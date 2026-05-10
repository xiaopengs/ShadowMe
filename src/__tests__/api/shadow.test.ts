/**
 * ShadowMe - Shadow Status API Test Suite
 * 
 * Tests for shadow status API endpoints:
 * - GET /api/shadow/status - Get shadow status
 * - POST /api/shadow/status - Update shadow status
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { createTestDatabase } from './helpers/test-db';
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

describe('Shadow Status API', () => {
  beforeAll(() => {
    mockDb = createTestDatabase();
  });

  afterAll(() => {
    mockDb.close();
  });

  beforeEach(() => {
    // Reset shadow status to known state
    mockDb.prepare('DELETE FROM shadow_status').run();
    mockDb.prepare(`
      INSERT INTO shadow_status (id, name, status, capabilities, auto_take_tasks, last_heartbeat)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      'shadow-1',
      '影子分身',
      'online',
      JSON.stringify(['代码审查', '方案设计', '技术问题解决', '文档生成']),
      0,
      new Date().toISOString()
    );
  });

  describe('GET /api/shadow/status', () => {
    it('should return shadow status', async () => {
      const { GET } = await import('@/app/api/shadow/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('shadow-1');
      expect(data.name).toBe('影子分身');
      expect(data.status).toBe('online');
    });

    it('should return capabilities as array', async () => {
      const { GET } = await import('@/app/api/shadow/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(Array.isArray(data.capabilities)).toBe(true);
      expect(data.capabilities).toContain('代码审查');
    });

    it('should return autoTakeTasks as boolean', async () => {
      const { GET } = await import('@/app/api/shadow/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(typeof data.autoTakeTasks).toBe('boolean');
    });

    it('should include lastHeartbeat timestamp', async () => {
      const { GET } = await import('@/app/api/shadow/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.lastHeartbeat).toBeDefined();
      expect(new Date(data.lastHeartbeat).toISOString()).toBe(data.lastHeartbeat);
    });

    it('should return default status when no shadow exists', async () => {
      // Clear shadow status
      mockDb.prepare('DELETE FROM shadow_status').run();

      const { GET } = await import('@/app/api/shadow/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.id).toBe('shadow-1');
      expect(data.name).toBe('影子分身');
      expect(data.status).toBe('offline');
      expect(data.capabilities).toEqual([]);
      expect(data.autoTakeTasks).toBe(false);
    });

    it('should include current task when assigned', async () => {
      // Create a task and assign it to shadow
      const taskId = 'assigned-task-id';
      mockDb.prepare(`
        INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(taskId, 'Assigned Task', 'technical_issue', 'high', 'in_progress', '', '[]', 'User', new Date().toISOString(), new Date().toISOString());

      // Update shadow to have current task
      mockDb.prepare('UPDATE shadow_status SET current_task_id = ? WHERE id = ?').run(taskId, 'shadow-1');

      const { GET } = await import('@/app/api/shadow/status/route');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentTaskId).toBe(taskId);
      expect(data.currentTask).toBeDefined();
      expect(data.currentTask.id).toBe(taskId);
      expect(data.currentTask.title).toBe('Assigned Task');
    });
  });

  describe('POST /api/shadow/status', () => {
    it('should update status to busy', async () => {
      const { POST } = await import('@/app/api/shadow/status/route');
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'busy' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('busy');
    });

    it('should update status to offline', async () => {
      const { POST } = await import('@/app/api/shadow/status/route');
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'offline' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('offline');
    });

    it('should update capabilities', async () => {
      const { POST } = await import('@/app/api/shadow/status/route');
      const newCapabilities = ['代码审查', '性能优化', '安全审计'];
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capabilities: newCapabilities })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.capabilities).toEqual(newCapabilities);
    });

    it('should enable autoTakeTasks', async () => {
      const { POST } = await import('@/app/api/shadow/status/route');
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoTakeTasks: true })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.autoTakeTasks).toBe(true);
    });

    it('should disable autoTakeTasks', async () => {
      // First enable it
      mockDb.prepare('UPDATE shadow_status SET auto_take_tasks = 1 WHERE id = ?').run('shadow-1');

      const { POST } = await import('@/app/api/shadow/status/route');
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoTakeTasks: false })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.autoTakeTasks).toBe(false);
    });

    it('should update multiple fields at once', async () => {
      const { POST } = await import('@/app/api/shadow/status/route');
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'busy',
          capabilities: ['new', 'capabilities'],
          autoTakeTasks: true
        })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.status).toBe('busy');
      expect(data.capabilities).toEqual(['new', 'capabilities']);
      expect(data.autoTakeTasks).toBe(true);
    });

    it('should update lastHeartbeat on any update', async () => {
      // Get original heartbeat
      const original = mockDb.prepare('SELECT last_heartbeat FROM shadow_status WHERE id = ?').get('shadow-1') as any;
      
      // Wait a bit to ensure different timestamp
      await new Promise(resolve => setTimeout(resolve, 100));

      const { POST } = await import('@/app/api/shadow/status/route');
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'busy' })
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(new Date(data.lastHeartbeat).getTime()).toBeGreaterThan(new Date(original.last_heartbeat).getTime());
    });

    it('should ignore undefined fields', async () => {
      const { POST } = await import('@/app/api/shadow/status/route');
      const request = new Request('http://localhost/api/shadow/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      // Status should remain unchanged
      expect(data.status).toBe('online');
    });
  });
});
