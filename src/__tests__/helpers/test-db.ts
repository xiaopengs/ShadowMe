/**
 * ShadowMe Test Database Helper
 * 
 * Provides an in-memory SQLite database for testing purposes.
 * Mocks the database module to avoid file system operations.
 */

import DatabaseLib from 'better-sqlite3';
import path from 'path';

// Create in-memory database for testing
export function createTestDatabase(): DatabaseLib.Database {
  const db = new DatabaseLib(':memory:');
  
  // Create tables matching production schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('technical_issue', 'design_doc', 'code_review', 'other')),
      priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'needs_feedback', 'closed')),
      description TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      attachments TEXT DEFAULT '[]',
      expected_delivery TEXT,
      result TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      started_at DATETIME,
      completed_at DATETIME,
      due_date DATETIME
    );

    CREATE TABLE IF NOT EXISTS shadow_status (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offline',
      current_task_id TEXT,
      last_heartbeat DATETIME,
      capabilities TEXT DEFAULT '[]',
      auto_take_tasks INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_id TEXT,
      action TEXT NOT NULL,
      actor TEXT,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_messages (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('user', 'system', 'claude')),
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON task_messages(task_id);
  `);
  
  // Seed default shadow status
  db.prepare(`
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
  
  return db;
}

// Test data factories
export const testTask = {
  title: 'Test Task',
  type: 'technical_issue' as const,
  priority: 'medium' as const,
  description: 'Test description',
  tags: ['test'],
  createdBy: 'Test User'
};

export const testTask2 = {
  title: 'Another Task',
  type: 'design_doc' as const,
  priority: 'high' as const,
  description: 'Another description',
  tags: ['design'],
  createdBy: 'Designer'
};

export const testMessage = {
  content: 'Test message content',
  type: 'user' as const
};
