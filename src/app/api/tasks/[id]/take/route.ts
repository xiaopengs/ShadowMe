import { NextResponse } from 'next/server';
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
    const db = getDatabase();

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!row) {
      db.close();
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (row.status !== 'pending') {
      db.close();
      return NextResponse.json({ error: 'Task is not pending' }, { status: 400 });
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tasks
      SET status = 'in_progress', started_at = ?, updated_at = ?
      WHERE id = ?
    `).run(now, now, id);

    db.prepare(`
      UPDATE shadow_status
      SET status = 'busy', current_task_id = ?, last_heartbeat = ?
      WHERE id = 'shadow-1'
    `).run(id, now);

    db.prepare(`
      INSERT INTO logs (task_id, action, actor, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, 'taken', 'shadow-clone', JSON.stringify({ source: 'manual' }), now);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    db.close();

    return NextResponse.json(rowToTask(updated));
  } catch (error) {
    console.error('Error taking task:', error);
    return NextResponse.json({ error: 'Failed to take task' }, { status: 500 });
  }
}
