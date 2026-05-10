import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { all, get, run } from '@/lib/db';
import { logger } from '@/lib/logger';
import { broadcastToChannel } from '@/lib/sse-manager';
import type { Task, TaskStatus } from '@/types';

const apiLogger = logger.child({ module: 'api/tasks' });

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

    let query = 'SELECT * FROM tasks WHERE 1=1';
    const params: any[] = [];

    if (status) {
      const statuses = status.split(',').map(s => s.trim());
      if (statuses.length === 1) {
        query += ' AND status = ?';
        params.push(status);
      } else {
        query += ` AND status IN (${statuses.map(() => '?').join(', ')})`;
        params.push(...statuses);
      }
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

    const rows = await all(query, params);
    const tasks = rows.map(rowToTask);
    apiLogger.info('Tasks fetched', { count: tasks.length, filters: { status, type, priority } });
    return NextResponse.json({ tasks, total: tasks.length });
  } catch (error) {
    apiLogger.error('Error fetching tasks', error, { operation: 'GET' });
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

    const id = randomUUID();
    const now = new Date().toISOString();

    await run(`
      INSERT INTO tasks (id, title, type, priority, status, description, tags, attachments, expected_delivery, due_date, created_by, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
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
    ]);

    await run(`
      INSERT INTO logs (task_id, action, actor, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, 'created', createdBy, JSON.stringify({ type, priority }), now]);

    const row = await get('SELECT * FROM tasks WHERE id = ?', [id]);
    const task = rowToTask(row);
    
    // Broadcast task.created event per protocol
    broadcastToChannel('task', 'task.created', {
      type: 'task.created',
      task: {
        id: task.id,
        title: task.title,
        type: task.type,
        priority: task.priority,
        status: task.status,
        description: task.description,
        createdBy: task.createdBy
      }
    });
    
    // Also update stats
    broadcastToChannel('stats', 'stats.updated', {
      type: 'stats.updated',
      timestamp: new Date().toISOString()
    });
    
    apiLogger.info('Task created', { taskId: id, title: title.trim() });
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    apiLogger.error('Error creating task', error, { operation: 'POST' });
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
