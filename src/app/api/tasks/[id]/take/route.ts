import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { logger } from '@/lib/logger';
import type { Task, TaskStatus } from '@/types';

const apiLogger = logger.child({ module: 'api/tasks/[id]/take' });

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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const row = await get('SELECT * FROM tasks WHERE id = ?', [id]) as any;
    if (!row) {
      apiLogger.warn('Task not found for taking', { taskId: id, operation: 'POST' });
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (row.status !== 'pending') {
      apiLogger.warn('Task not pending', { taskId: id, currentStatus: row.status });
      return NextResponse.json({ error: 'Task is not pending' }, { status: 400 });
    }

    const now = new Date().toISOString();

    await run(`
      UPDATE tasks
      SET status = 'in_progress', started_at = ?, updated_at = ?
      WHERE id = ?
    `, [now, now, id]);

    await run(`
      UPDATE shadow_status
      SET status = 'busy', current_task_id = ?, last_heartbeat = ?
      WHERE id = 'shadow-1'
    `, [id, now]);

    await run(`
      INSERT INTO logs (task_id, action, actor, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, 'taken', 'ShadowMe', JSON.stringify({ source: 'manual' }), now]);

    const updated = await get('SELECT * FROM tasks WHERE id = ?', [id]);

    apiLogger.info('Task taken', { taskId: id });
    return NextResponse.json(rowToTask(updated));
  } catch (error) {
    apiLogger.error('Error taking task', error, { taskId: (await params).id, operation: 'POST' });
    return NextResponse.json({ error: 'Failed to take task' }, { status: 500 });
  }
}
