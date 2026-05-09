import DatabaseLib from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

// Database path from environment variable or default
const DB_PATH_ENV = process.env.DATABASE_PATH || './data/ShadowMe.db';
// Resolve to absolute path if relative
const DB_PATH = path.isAbsolute(DB_PATH_ENV) 
  ? DB_PATH_ENV 
  : path.join(process.cwd(), DB_PATH_ENV);
const DB_DIR = path.dirname(DB_PATH);

type Database = InstanceType<typeof DatabaseLib>;
let dbInstance: Database | null = null;

function createTables(db: Database) {
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

function seedData(db: Database) {
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
}

export function initDatabase(): Database {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    logger.info('Created database directory', { path: DB_DIR });
  }

  const db = new DatabaseLib(DB_PATH);
  createTables(db);
  seedData(db);
  logger.info('Database initialized successfully', { path: DB_PATH });
  return db;
}

export function getDatabase(): Database {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_PATH)) {
    dbInstance = initDatabase();
  } else {
    dbInstance = new DatabaseLib(DB_PATH);
  }

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    logger.info('Database connection closed');
  }
}
