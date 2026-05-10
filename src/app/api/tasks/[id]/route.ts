import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { Task, TaskStatus } from '@/types';

const apiLogger = logger.child({ module: 'api/tasks/[id]' });

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    priority: row.priority,
    status: row.status as TaskStatus,
    description: row.description || '',
    tags: JSON.parse(row.tags || '[]'),
    attachments: JSON.parse(row.attachments || '[]'),
    expectedDelivery: row.expected_delivery,
    result: row.result ? JSON.parse(row.result) : undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    dueDate: row.due_date
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const row = await get('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!row) {
      apiLogger.warn('Task not found', { taskId: id, operation: 'GET' });
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    apiLogger.info('Task fetched', { taskId: id });
    return NextResponse.json(rowToTask(row));
  } catch (error) {
    apiLogger.error('Error fetching task', error, { taskId: (await params).id, operation: 'GET' });
    return NextResponse.json({ error: 'Failed to fetch task' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await get('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!existing) {
      apiLogger.warn('Task not found for update', { taskId: id, operation: 'PATCH' });
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (body.title !== undefined) {
      updates.push('title = ?');
      values.push(body.title);
    }
    if (body.type !== undefined) {
      updates.push('type = ?');
      values.push(body.type);
    }
    if (body.priority !== undefined) {
      updates.push('priority = ?');
      values.push(body.priority);
    }
    if (body.status !== undefined) {
      updates.push('status = ?');
      values.push(body.status);
    }
    if (body.description !== undefined) {
      updates.push('description = ?');
      values.push(body.description);
    }
    if (body.tags !== undefined) {
      updates.push('tags = ?');
      values.push(JSON.stringify(body.tags));
    }
    if (body.attachments !== undefined) {
      updates.push('attachments = ?');
      values.push(JSON.stringify(body.attachments));
    }
    if (body.expectedDelivery !== undefined) {
      updates.push('expected_delivery = ?');
      values.push(body.expectedDelivery);
    }
    if (body.dueDate !== undefined) {
      updates.push('due_date = ?');
      values.push(body.dueDate);
    }
    if (body.result !== undefined) {
      updates.push('result = ?');
      values.push(JSON.stringify(body.result));
    }

    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await run(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`, values);

    await run(`
      INSERT INTO logs (task_id, action, actor, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, 'updated', body.updatedBy || 'system', JSON.stringify(body), new Date().toISOString()]);

    const row = await get('SELECT * FROM tasks WHERE id = ?', [id]);

    apiLogger.info('Task updated', { taskId: id, updates: Object.keys(body) });
    return NextResponse.json(rowToTask(row));
  } catch (error) {
    apiLogger.error('Error updating task', error, { taskId: (await params).id, operation: 'PATCH' });
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await get('SELECT * FROM tasks WHERE id = ?', [id]);
    if (!existing) {
      apiLogger.warn('Task not found for delete', { taskId: id, operation: 'DELETE' });
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    await run('DELETE FROM tasks WHERE id = ?', [id]);
    await run('DELETE FROM logs WHERE task_id = ?', [id]);

    apiLogger.info('Task deleted', { taskId: id });
    return NextResponse.json({ success: true });
  } catch (error) {
    apiLogger.error('Error deleting task', error, { taskId: (await params).id, operation: 'DELETE' });
    return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
  }
}
