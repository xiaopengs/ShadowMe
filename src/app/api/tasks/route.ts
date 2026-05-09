import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from '@/lib/db';
import type { Task, TaskStatus } from '@/types';

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    priority: row.priority,
    status: row.status as TaskStatus,
    description: row.description || '',
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
    attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments || '[]') : (row.attachments || []),
    expectedDelivery: row.expected_delivery,
    result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) : undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    dueDate: row.due_date
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const priority = searchParams.get('priority');

    const db = getDatabase();
    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY created_at DESC';

    const rows = db.prepare(query).all(...params);
    const tasks = rows.map(rowToTask);
    return NextResponse.json({ tasks, total: tasks.length });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      type = 'technical_issue',
      priority = 'medium',
      description = '',
      tags = [],
      attachments = [],
      expectedDelivery,
      dueDate,
      createdBy = '访客'
    } = body;

    if (!title || title.trim().length === 0) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const db = getDatabase();
    db.prepare(`
      INSERT INTO tasks (id, title, type, priority, status, description, tags, attachments, expected_delivery, due_date, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      title.trim(),
      type,
      priority,
      'pending',
      description,
      JSON.stringify(tags),
      JSON.stringify(attachments),
      expectedDelivery || null,
      dueDate || null,
      createdBy,
      now,
      now
    );

    db.prepare(`
      INSERT INTO logs (task_id, action, actor, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, 'created', createdBy, JSON.stringify({ type, priority }), now);

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return NextResponse.json(rowToTask(row), { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
