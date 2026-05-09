/**
 * Database initialization script
 * Run with: npm run db:init
 */

import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'ShadowMe.db');

function createTables(db) {
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
}

function seedData(db) {
  // Insert default shadow status if not exists
  const existingShadow = db.prepare('SELECT * FROM shadow_status WHERE id = ?').get('shadow-1');
  if (!existingShadow) {
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
  }

  // Insert sample tasks if none exist
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  if (taskCount.count === 0) {
    const sampleTasks = [
      {
        id: 'task-' + Date.now(),
        title: 'Refactor Authentication Middleware',
        type: 'technical_issue',
        priority: 'high',
        status: 'pending',
        description: 'Need to improve error handling in auth middleware for better security.',
        tags: JSON.stringify(['auth', 'middleware', 'security']),
        createdBy: 'Alex J.'
      },
      {
        id: 'task-' + (Date.now() + 1),
        title: 'Update API documentation for v2 endpoints',
        type: 'design_doc',
        priority: 'medium',
        status: 'in_progress',
        description: 'Document all new v2 API endpoints with examples.',
        tags: JSON.stringify(['docs', 'api']),
        createdBy: 'Sarah M.'
      },
      {
        id: 'task-' + (Date.now() + 2),
        title: 'Implement dark mode theme configuration parser',
        type: 'code_review',
        priority: 'high',
        status: 'completed',
        description: 'Parse tailwind config and build CSS variables for theming.',
        tags: JSON.stringify(['ui', 'theming', 'css']),
        createdBy: 'John D.'
      }
    ];

    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO tasks (id, title, type, priority, status, description, tags, created_by, created_at, updated_at, started_at, completed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const task of sampleTasks) {
      insertStmt.run(
        task.id,
        task.title,
        task.type,
        task.priority,
        task.status,
        task.description,
        task.tags,
        task.createdBy,
        now,
        now,
        task.status === 'in_progress' ? now : null,
        task.status === 'completed' ? now : null
      );
    }
    console.log(`Inserted ${sampleTasks.length} sample tasks`);
  }
}

function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    console.log('Created data directory:', DB_DIR);
  }

  const db = new Database(DB_PATH);
  createTables(db);
  seedData(db);
  console.log('Database initialized successfully at:', DB_PATH);
  db.close();
}

// Run if executed directly
initDatabase();
