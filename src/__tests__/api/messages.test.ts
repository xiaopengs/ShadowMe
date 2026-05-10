/**
 * ShadowMe - Messages API Test Suite
 * 
 * Tests for task message API endpoints:
 * - GET /api/tasks/[id]/messages - List messages for a task
 * - POST /api/tasks/[id]/messages - Send a message to a task
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestDatabase, testTask, testMessage } from './helpers/test-db';
import type DatabaseLib from 'better-sqlite3';

// Mock the database module
let mockDb: DatabaseLib.Database;

jest.mock('@/lib/db', () => ({
  getDatabase: jest.fn(() => mockDb),
  initDatabase: jest.fn()
}));

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    child: jest.fn(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn()
    }))
  }
}));

// Mock crypto
let uuidCounter = 0;
jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => `test-uuid-${++uuidCounter}`)
}));

describe('Messages API', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
  });

  afterAll(() => {
    mockDb.close();
  });

  beforeEach(() => {
    // Clear messages table before each test
    mockDb.prepare('DELETE FROM task_messages').run();
    uuidCounter = 0;
    
    // Create a test task for message tests
    mockDb.prepare(`
      INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('test-task-id', testTask.title, testTask.type, testTask.priority, 'pending', testTask.description, '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
  });

  describe('GET /api/tasks/[id]/messages', () => {
    it('should return empty list when no messages exist', async () => {
      const { GET } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages');
      const response = await GET(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return all messages for a task', async () => {
      // Insert test messages
      mockDb.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('msg-1', 'test-task-id', 'user', 'First message', new Date().toISOString());
      
      mockDb.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('msg-2', 'test-task-id', 'claude', 'Claude response', new Date(Date.now() + 1000).toISOString());
      
      mockDb.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('msg-3', 'test-task-id', 'system', 'System notification', new Date(Date.now() + 2000).toISOString());

      const { GET } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages');
      const response = await GET(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toHaveLength(3);
      expect(data.total).toBe(3);
    });

    it('should return messages in chronological order', async () => {
      const now = new Date();
      
      mockDb.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('msg-1', 'test-task-id', 'user', 'First message', now.toISOString());
      
      mockDb.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('msg-2', 'test-task-id', 'user', 'Second message', new Date(now.getTime() + 1000).toISOString());

      const { GET } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages');
      const response = await GET(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages[0].content).toBe('First message');
      expect(data.messages[1].content).toBe('Second message');
    });

    it('should not return messages from other tasks', async () => {
      // Create another task
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('other-task-id', 'Other Task', 'technical_issue', 'medium', 'pending', '', '[]', 'User', new Date().toISOString(), new Date().toISOString());

      // Insert messages for both tasks
      mockDb.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('msg-1', 'test-task-id', 'user', 'Task 1 message', new Date().toISOString());
      
      mockDb.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('msg-2', 'other-task-id', 'user', 'Task 2 message', new Date().toISOString());

      const { GET } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages');
      const response = await GET(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toHaveLength(1);
      expect(data.messages[0].content).toBe('Task 1 message');
    });

    it('should return empty messages array on error (graceful degradation)', async () => {
      // This tests the error handling that returns empty messages instead of breaking
      const { GET } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/non-existent-task/messages');
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent-task' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.messages).toEqual([]);
      expect(data.total).toBe(0);
    });
  });

  describe('POST /api/tasks/[id]/messages', () => {
    it('should create a new user message', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe(testMessage.content);
      expect(data.type).toBe('user');
      expect(data.taskId).toBe('test-task-id');
      expect(data.id).toBeDefined();
      expect(data.createdAt).toBeDefined();
    });

    it('should create message with default type user', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Message without type' })
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('user');
    });

    it('should create claude type message', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: 'Claude response', type: 'claude' })
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.type).toBe('claude');
    });

    it('should return 400 when content is missing', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content is required');
    });

    it('should return 400 when content is empty string', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '   ' })
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Content is required');
    });

    it('should trim whitespace from content', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: '  Trimmed content  ' })
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.content).toBe('Trimmed content');
    });

    it('should add a system message after user message', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });
      await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });

      // Check that system message was added
      const messages = mockDb.prepare('SELECT * FROM task_messages WHERE task_id = ? ORDER BY created_at').all('test-task-id');
      expect(messages).toHaveLength(2);
      expect((messages[0] as any).type).toBe('user');
      expect((messages[1] as any).type).toBe('system');
      expect((messages[1] as any).content).toContain('queued');
    });

    it('should store message in database', async () => {
      const { POST } = await import('@/app/api/tasks/[id]/messages/route');
      const request = new Request('http://localhost/api/tasks/test-task-id/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testMessage)
      });
      const response = await POST(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      // Verify message is stored
      const stored = mockDb.prepare('SELECT * FROM task_messages WHERE id = ?').get(data.id);
      expect(stored).toBeDefined();
      expect((stored as any).content).toBe(testMessage.content);
    });
  });
});
