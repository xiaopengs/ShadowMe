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
    const body = await request.json();
    const { result, summary } = body;

    const db = getDatabase();

    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!row) {
      db.close();
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }

    if (row.status !== 'in_progress') {
      db.close();
      return NextResponse.json({ error: 'Task is not in progress' }, { status: 400 });
    }

    const now = new Date().toISOString();

    const resultData = result || {
      type: 'text',
      summary: summary || '任务已完成'
    };

    db.prepare(`
      UPDATE tasks
      SET status = 'completed', result = ?, completed_at = ?, updated_at = ?
      WHERE id = ?
    `).run(JSON.stringify(resultData), now, now, id);

    db.prepare(`
      UPDATE shadow_status
      SET status = 'online', current_task_id = NULL, last_heartbeat = ?
      WHERE id = 'shadow-1'
    `).run(now);

    db.prepare(`
      INSERT INTO logs (task_id, action, actor, details, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, 'completed', 'shadow-clone', JSON.stringify({ result: resultData }), now);

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    db.close();

    return NextResponse.json(rowToTask(updated));
  } catch (error) {
    console.error('Error completing task:', error);
    return NextResponse.json({ error: 'Failed to complete task' }, { status: 500 });
  }
}
