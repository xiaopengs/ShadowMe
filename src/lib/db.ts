import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import { logger } from './logger';

const DB_PATH_ENV = process.env.DATABASE_PATH || './data/ShadowMe.db';
const DB_PATH = path.isAbsolute(DB_PATH_ENV)
  ? DB_PATH_ENV
  : path.join(process.cwd(), DB_PATH_ENV);
const DB_DIR = path.dirname(DB_PATH);

let dbInstance: SqlJsDatabase | null = null;
let SQL: any = null;

async function initSql() {
  if (SQL) return SQL;
  SQL = await initSqlJs();
  return SQL;
}

function createTables(db: SqlJsDatabase) {
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

    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      key_text TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      permissions TEXT DEFAULT 'webhook',
      last_used_at TEXT,
      created_at TEXT NOT NULL,
      expires_at TEXT,
      created_by TEXT DEFAULT 'owner'
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
    CREATE INDEX IF NOT EXISTS idx_logs_task_id ON logs(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_messages_task_id ON task_messages(task_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_created_at ON api_keys(created_at);
  `);
}

function seedData(db: SqlJsDatabase) {
  const existingShadow = getSync(db, 'SELECT * FROM shadow_status WHERE id = ?', ['shadow-1']);
  if (!existingShadow) {
    runSync(db, `
      INSERT INTO shadow_status (id, name, status, capabilities, auto_take_tasks, last_heartbeat)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'shadow-1',
      '影子分身',
      'online',
      JSON.stringify(['代码审查', '方案设计', '技术问题解决', '文档生成']),
      0,
      new Date().toISOString()
    ]);
  }
}

function saveDatabase(): void {
  if (dbInstance) {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  }
}

function getSync(db: SqlJsDatabase, sql: string, params: any[] = []): any | undefined {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result: any | undefined;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function allSync(db: SqlJsDatabase, sql: string, params: any[] = []): any[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results: any[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function runSync(db: SqlJsDatabase, sql: string, params: any[] = []): { changes: number; lastInsertRowid: number } {
  db.run(sql, params);
  return { changes: db.getRowsModified(), lastInsertRowid: 0 };
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSql();

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    logger.info('Created database directory', { path: DB_DIR });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    dbInstance = new SQL.Database(buffer);
  } else {
    dbInstance = new SQL.Database();
  }

  createTables(dbInstance);
  seedData(dbInstance);
  saveDatabase();
  logger.info('Database initialized successfully', { path: DB_PATH });
  return dbInstance;
}

export async function getDatabase(): Promise<SqlJsDatabase> {
  if (dbInstance) return dbInstance;
  return initDatabase();
}

export function closeDatabase(): void {
  if (dbInstance) {
    saveDatabase();
    dbInstance.close();
    dbInstance = null;
    logger.info('Database connection closed');
  }
}

export async function all(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDatabase();
  return allSync(db, sql, params);
}

export async function get(sql: string, params: any[] = []): Promise<any | undefined> {
  const db = await getDatabase();
  return getSync(db, sql, params);
}

export async function run(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
  const db = await getDatabase();
  const result = runSync(db, sql, params);
  saveDatabase();
  return result;
}

export async function exec(sql: string): Promise<void> {
  const db = await getDatabase();
  db.exec(sql);
  saveDatabase();
}

// ===========================================
// API Key Database Operations
// ===========================================

export interface ApiKey {
  id: string;
  name: string;
  key_text: string;
  key_hash: string;
  key_prefix: string;
  permissions: string;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
  created_by: string;
}

export interface ApiKeyCreateInput {
  id: string;
  name: string;
  key_text: string;
  key_hash: string;
  key_prefix: string;
  permissions?: string;
  expires_at?: string;
}

export interface ApiKeyPublic {
  id: string;
  name: string;
  key_prefix: string;
  permissions: string;
  last_used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface ApiKeyWithText extends ApiKeyPublic {
  key_text: string;
}

export async function createApiKey(input: ApiKeyCreateInput): Promise<ApiKey> {
  const db = await getDatabase();
  const now = new Date().toISOString();

  runSync(db, `
    INSERT INTO api_keys (id, name, key_text, key_hash, key_prefix, permissions, created_at, expires_at, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    input.id,
    input.name,
    input.key_text,
    input.key_hash,
    input.key_prefix,
    input.permissions || 'webhook',
    now,
    input.expires_at || null,
    'owner'
  ]);
  saveDatabase();

  return getSync(db, 'SELECT * FROM api_keys WHERE id = ?', [input.id]) as ApiKey;
}

export async function getAllApiKeys(): Promise<ApiKeyPublic[]> {
  const db = await getDatabase();
  return allSync(db, `
    SELECT id, name, key_prefix, permissions, last_used_at, created_at, expires_at
    FROM api_keys
    ORDER BY created_at DESC
  `) as ApiKeyPublic[];
}

export async function getApiKeyById(id: string): Promise<ApiKey | undefined> {
  const db = await getDatabase();
  return getSync(db, 'SELECT * FROM api_keys WHERE id = ?', [id]) as ApiKey | undefined;
}

export async function getApiKeyByIdWithText(id: string): Promise<ApiKeyWithText | undefined> {
  const db = await getDatabase();
  const key = getSync(db, 'SELECT * FROM api_keys WHERE id = ?', [id]) as ApiKey | undefined;
  if (!key) return undefined;
  return {
    id: key.id,
    name: key.name,
    key_prefix: key.key_prefix,
    permissions: key.permissions,
    last_used_at: key.last_used_at,
    created_at: key.created_at,
    expires_at: key.expires_at,
    key_text: key.key_text,
  };
}

export async function getApiKeyByHash(keyHash: string): Promise<ApiKey | undefined> {
  const db = await getDatabase();
  return getSync(db, 'SELECT * FROM api_keys WHERE key_hash = ?', [keyHash]) as ApiKey | undefined;
}

export async function updateApiKeyLastUsed(id: string): Promise<void> {
  const db = await getDatabase();
  const now = new Date().toISOString();
  runSync(db, 'UPDATE api_keys SET last_used_at = ? WHERE id = ?', [now, id]);
  saveDatabase();
}

export async function deleteApiKey(id: string): Promise<boolean> {
  const db = await getDatabase();
  const result = runSync(db, 'DELETE FROM api_keys WHERE id = ?', [id]);
  saveDatabase();
  return result.changes > 0;
}

export function isApiKeyExpired(key: ApiKey): boolean {
  if (!key.expires_at) return false;
  return new Date(key.expires_at) < new Date();
}
