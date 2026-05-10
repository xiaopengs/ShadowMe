/**
 * ShadowMe - Tasks API Test Suite
 * 
 * Tests for all task-related API endpoints:
 * - GET /api/tasks - List tasks with filtering
 * - POST /api/tasks - Create new task
 * - GET /api/tasks/[id] - Get task by ID
 * - PATCH /api/tasks/[id] - Update task
 * - DELETE /api/tasks/[id] - Delete task
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestDatabase, testTask, testTask2 } from './helpers/test-db';
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

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-uuid-' + Math.random().toString(36).substring(7))
}));

describe('Tasks API', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
  });

  afterAll(() => {
    mockDb.close();
  });

  beforeEach(() => {
    // Clear tasks table before each test
    mockDb.prepare('DELETE FROM tasks').run();
    mockDb.prepare('DELETE FROM logs').run();
  });

  describe('GET /api/tasks', () => {
    it('should return empty list when no tasks exist', async () => {
      const { GET } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toEqual([]);
      expect(data.total).toBe(0);
    });

    it('should return all tasks', async () => {
      // Create test tasks
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-1', testTask.title, testTask.type, testTask.priority, 'pending', testTask.description, '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
      
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-2', testTask2.title, testTask2.type, testTask2.priority, 'pending', testTask2.description, '[]', testTask2.createdBy, new Date().toISOString(), new Date().toISOString());

      const { GET } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(2);
      expect(data.total).toBe(2);
    });

    it('should filter tasks by status', async () => {
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-1', testTask.title, testTask.type, testTask.priority, 'pending', '', '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
      
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-2', testTask2.title, testTask2.type, testTask2.priority, 'completed', '', '[]', testTask2.createdBy, new Date().toISOString(), new Date().toISOString());

      const { GET } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks?status=pending');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].status).toBe('pending');
    });

    it('should filter tasks by type', async () => {
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-1', testTask.title, testTask.type, testTask.priority, 'pending', '', '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
      
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-2', testTask2.title, testTask2.type, testTask2.priority, 'pending', '', '[]', testTask2.createdBy, new Date().toISOString(), new Date().toISOString());

      const { GET } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks?type=design_doc');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].type).toBe('design_doc');
    });

    it('should filter tasks by priority', async () => {
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-1', testTask.title, testTask.type, 'low', 'pending', '', '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
      
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-2', testTask2.title, testTask2.type, 'high', 'pending', '', '[]', testTask2.createdBy, new Date().toISOString(), new Date().toISOString());

      const { GET } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks?priority=high');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(1);
      expect(data.tasks[0].priority).toBe('high');
    });

    it('should support comma-separated status values', async () => {
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-1', testTask.title, testTask.type, testTask.priority, 'completed', '', '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
      
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('task-2', testTask2.title, testTask2.type, testTask2.priority, 'closed', '', '[]', testTask2.createdBy, new Date().toISOString(), new Date().toISOString());

      const { GET } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks?status=completed,closed');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.tasks).toHaveLength(2);
    });
  });

  describe('POST /api/tasks', () => {
    it('should create a new task with all required fields', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testTask)
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe(testTask.title);
      expect(data.type).toBe(testTask.type);
      expect(data.priority).toBe(testTask.priority);
      expect(data.status).toBe('pending');
      expect(data.id).toBeDefined();
    });

    it('should create task with default values', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Minimal Task' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.type).toBe('technical_issue');
      expect(data.priority).toBe('medium');
      expect(data.createdBy).toBe('访客');
    });

    it('should return 400 when title is missing', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title is required');
    });

    it('should return 400 when title is empty string', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '   ' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Title is required');
    });

    it('should trim whitespace from title', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: '  Trimmed Title  ' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.title).toBe('Trimmed Title');
    });

    it('should store tags as JSON array', async () => {
      const { POST } = await import('@/app/api/tasks/route');
      const request = new Request('http://localhost/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'Task with Tags',
          tags: ['bug', 'urgent', 'frontend']
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.tags).toEqual(['bug', 'urgent', 'frontend']);
    });
  });

  describe('GET /api/tasks/[id]', () => {
    beforeEach(() => {
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-task-id', testTask.title, testTask.type, testTask.priority, 'pending', testTask.description, '["test"]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
    });

    it('should return task by ID', async () => {
      const { GET } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/test-task-id');
      const response = await GET(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('test-task-id');
      expect(data.title).toBe(testTask.title);
    });

    it('should return 404 for non-existent task', async () => {
      const { GET } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/non-existent');
      const response = await GET(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found');
    });

    it('should parse tags from JSON string', async () => {
      const { GET } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/test-task-id');
      const response = await GET(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.tags)).toBe(true);
      expect(data.tags).toContain('test');
    });
  });

  describe('PATCH /api/tasks/[id]', () => {
    beforeEach(() => {
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-task-id', testTask.title, testTask.type, testTask.priority, 'pending', testTask.description, '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
    });

    it('should update task title', async () => {
      const { PATCH } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/test-task-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' })
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('Updated Title');
    });

    it('should update task status', async () => {
      const { PATCH } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/test-task-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'in_progress' })
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('in_progress');
    });

    it('should update multiple fields at once', async () => {
      const { PATCH } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/test-task-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'New Title',
          priority: 'urgent',
          status: 'completed'
        })
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe('New Title');
      expect(data.priority).toBe('urgent');
      expect(data.status).toBe('completed');
    });

    it('should return 404 for non-existent task', async () => {
      const { PATCH } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/non-existent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Test' })
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found');
    });

    it('should store result as JSON string', async () => {
      const { PATCH } = await import('@/app/api/tasks/[id]/route');
      const result = {
        type: 'merge_request' as const,
        url: 'https://gitlab.example.com/mr/123',
        summary: 'Fixed the bug'
      };
      const request = new Request('http://localhost/api/tasks/test-task-id', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ result })
      });
      const response = await PATCH(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.result).toEqual(result);
    });
  });

  describe('DELETE /api/tasks/[id]', () => {
    beforeEach(() => {
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run('test-task-id', testTask.title, testTask.type, testTask.priority, 'pending', testTask.description, '[]', testTask.createdBy, new Date().toISOString(), new Date().toISOString());
      
      // Insert a log entry for the task
      mockDb.prepare(`
        INSERT INTO logs (task_id, action, actor, details, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run('test-task-id', 'created', testTask.createdBy, '{}', new Date().toISOString());
    });

    it('should delete existing task', async () => {
      const { DELETE } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/test-task-id', {
        method: 'DELETE'
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'test-task-id' }) });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify task is deleted
      const task = mockDb.prepare('SELECT * FROM tasks WHERE id = ?').get('test-task-id');
      expect(task).toBeUndefined();
    });

    it('should also delete associated logs', async () => {
      const { DELETE } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/test-task-id', {
        method: 'DELETE'
      });
      await DELETE(request, { params: Promise.resolve({ id: 'test-task-id' }) });

      const logs = mockDb.prepare('SELECT * FROM logs WHERE task_id = ?').all('test-task-id');
      expect(logs).toHaveLength(0);
    });

    it('should return 404 for non-existent task', async () => {
      const { DELETE } = await import('@/app/api/tasks/[id]/route');
      const request = new Request('http://localhost/api/tasks/non-existent', {
        method: 'DELETE'
      });
      const response = await DELETE(request, { params: Promise.resolve({ id: 'non-existent' }) });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Task not found');
    });
  });
});
