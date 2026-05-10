import { NextResponse } from 'next/server';
import { all, run } from '@/lib/db';
import { logger } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';
import type { TaskMessage } from '@/types';

const apiLogger = logger.child({ module: 'api/tasks/[id]/messages' });

interface TaskMessageRow {
  id: string;
  task_id: string;
  type: 'user' | 'system' | 'claude';
  content: string;
  created_at: string;
}

function rowToMessage(row: TaskMessageRow): TaskMessage {
  return {
    id: row.id,
    taskId: row.task_id,
    type: row.type,
    content: row.content,
    createdAt: row.created_at,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;

    const rows = await all(
      'SELECT * FROM task_messages WHERE task_id = ? ORDER BY created_at ASC',
      [taskId]
    ) as TaskMessageRow[];

    const messages = rows.map(rowToMessage);
    apiLogger.debug('Messages fetched', { taskId, count: messages.length });
    return NextResponse.json({ messages, total: messages.length });
  } catch (error) {
    apiLogger.error('Error fetching messages', error, { taskId: (await params).id, operation: 'GET' });
    return NextResponse.json({ messages: [], total: 0 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: taskId } = await params;
    const body = await request.json();
    const { content, type = 'user' } = body;

    if (!content || content.trim().length === 0) {
      apiLogger.warn('Empty content provided', { taskId, operation: 'POST' });
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await run(`
      INSERT INTO task_messages (id, task_id, type, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [id, taskId, type, content.trim(), now]);

    const systemMessageId = uuidv4();
    await run(`
      INSERT INTO task_messages (id, task_id, type, content, created_at)
      VALUES (?, ?, ?, ?, ?)
    `, [
      systemMessageId,
      taskId,
      'system',
      `Message received and queued for processing`,
      new Date(Date.now() + 1000).toISOString()
    ]);

    apiLogger.info('Message created', { taskId, messageId: id, messageType: type });
    return NextResponse.json({
      id,
      taskId,
      type,
      content: content.trim(),
      createdAt: now
    });
  } catch (error) {
    apiLogger.error('Error creating message', error, { taskId: (await params).id, operation: 'POST' });
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
