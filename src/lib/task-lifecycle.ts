import { getDatabase, all, get, run } from './db';
import { broadcastToChannel } from './sse-manager';
import { createTaskAssignMessage, type CCMessage } from './cc-protocol';
import { logger } from './logger';
import { randomUUID } from 'crypto';
import type { Task, TaskStatus } from '@/types';

const lifecycleLogger = logger.child({ module: 'task-lifecycle' });

export type TaskLifecycleEvent =
  | 'assign'
  | 'start'
  | 'review'
  | 'complete'
  | 'need_feedback'
  | 'close'
  | 'cancel';

const VALID_TRANSITIONS: Record<TaskStatus, TaskLifecycleEvent[]> = {
  'pending': ['assign', 'close'],
  'in_progress': ['review', 'complete', 'need_feedback', 'close', 'cancel'],
  'completed': ['close', 'need_feedback'],
  'needs_feedback': ['start', 'close'],
  'closed': [],
};

const STATUS_MAP: Record<TaskLifecycleEvent, TaskStatus> = {
  assign: 'in_progress',
  start: 'in_progress',
  review: 'completed',
  complete: 'completed',
  need_feedback: 'needs_feedback',
  close: 'closed',
  cancel: 'closed',
};

function isValidTransition(currentStatus: TaskStatus, event: TaskLifecycleEvent): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(event) ?? false;
}

export async function getQueuePosition(taskId: string): Promise<number> {
  const result = await get(`
    SELECT COUNT(*) as position
    FROM tasks
    WHERE status = 'pending'
    AND created_at <= (
      SELECT created_at FROM tasks WHERE id = ?
    )
  `, [taskId]) as { position: number };

  return result?.position || 0;
}

export async function getPendingTasksCount(): Promise<number> {
  const result = await get(`
    SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'
  `, []) as { count: number };

  return result?.count || 0;
}

export interface AssignToCCOptions {
  taskId: string;
  sendToCC?: boolean;
  notes?: string;
}

export async function assignToCC(options: AssignToCCOptions): Promise<{
  success: boolean;
  error?: string;
  message?: CCMessage;
}> {
  const { taskId, sendToCC = true, notes } = options;
  const now = new Date().toISOString();

  const task = await get('SELECT * FROM tasks WHERE id = ?', [taskId]) as {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: TaskStatus;
    expected_delivery: string | null;
  } | undefined;

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  if (task.status !== 'pending') {
    return { success: false, error: `Task is already ${task.status}` };
  }

  if (!isValidTransition(task.status, 'assign')) {
    return { success: false, error: `Cannot assign task in ${task.status} status` };
  }

  await run(`
    UPDATE tasks
    SET status = 'in_progress',
        started_at = ?,
        updated_at = ?
    WHERE id = ?
  `, [now, now, taskId]);

  await run(`
    UPDATE shadow_status
    SET status = 'busy',
        current_task_id = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `, [taskId, now]);

  const msgId = randomUUID();
  let systemMsg = `Task assigned to Claude Code at ${new Date().toLocaleString()}`;
  if (notes) {
    systemMsg += `\n\nNotes: ${notes}`;
  }

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, taskId, systemMsg, now]);

  let ccMessage: CCMessage | undefined;
  if (sendToCC) {
    ccMessage = createTaskAssignMessage(
      taskId,
      task.title,
      task.description,
      task.priority as 'low' | 'medium' | 'high' | 'urgent',
      task.expected_delivery || undefined
    );
  }

  broadcastToChannel('task', 'task:assigned', {
    taskId,
    assignedAt: now,
    queuePosition: await getQueuePosition(taskId),
  });

  broadcastToChannel('shadow', 'shadow:task_assigned', {
    status: 'busy',
    currentTaskId: taskId,
    taskTitle: task.title,
    lastHeartbeat: now,
  });

  broadcastToChannel('stats', 'stats:updated', {
    timestamp: now,
    action: 'task_assigned',
  });

  lifecycleLogger.info('Task assigned to CC', { taskId, queuePosition: await getQueuePosition(taskId) });

  return { success: true, message: ccMessage };
}

export async function updateProgress(taskId: string, progress: number, message?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const now = new Date().toISOString();

  const task = await get('SELECT * FROM tasks WHERE id = ?', [taskId]) as {
    id: string;
    status: TaskStatus;
  } | undefined;

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  if (task.status !== 'in_progress') {
    return { success: false, error: `Task is ${task.status}, not in_progress` };
  }

  if (message) {
    const msgId = randomUUID();
    await run(`
      INSERT INTO task_messages (id, task_id, type, content, created_at)
      VALUES (?, ?, 'claude', ?, ?)
    `, [msgId, taskId, `[Progress: ${progress}%] ${message}`, now]);
  }

  broadcastToChannel('task', 'task:progress', {
    taskId,
    progress,
    message,
  });

  broadcastToChannel('messages', 'message:new', {
    taskId,
    type: 'progress',
    progress,
    message,
    timestamp: now,
  });

  lifecycleLogger.debug('Task progress updated', { taskId, progress });
  return { success: true };
}

export async function completeTask(
  taskId: string,
  result?: { type: string; url?: string; summary: string; commitSha?: string }
): Promise<{
  success: boolean;
  error?: string;
}> {
  const now = new Date().toISOString();

  const task = await get('SELECT * FROM tasks WHERE id = ?', [taskId]) as {
    id: string;
    title: string;
    status: TaskStatus;
  } | undefined;

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  if (task.status !== 'in_progress') {
    return { success: false, error: `Cannot complete task in ${task.status} status` };
  }

  await run(`
    UPDATE tasks
    SET status = 'completed',
        completed_at = ?,
        result = ?,
        updated_at = ?
    WHERE id = ?
  `, [
    now,
    result ? JSON.stringify(result) : null,
    now,
    taskId
  ]);

  await run(`
    UPDATE shadow_status
    SET status = 'online',
        current_task_id = NULL,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `, [now]);

  const msgId = randomUUID();
  let completionText = `✅ Task completed at ${new Date().toLocaleString()}`;
  if (result) {
    completionText += `\n\nResult Type: ${result.type}`;
    if (result.url) completionText += `\nURL: ${result.url}`;
    if (result.commitSha) completionText += `\nCommit: ${result.commitSha.slice(0, 8)}`;
    completionText += `\n\n${result.summary}`;
  }

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, taskId, completionText, now]);

  broadcastToChannel('task', 'task:completed', {
    taskId,
    result,
    completedAt: now,
  });

  broadcastToChannel('shadow', 'shadow:task_completed', {
    status: 'online',
    currentTaskId: null,
    taskTitle: task.title,
    lastHeartbeat: now,
  });

  broadcastToChannel('stats', 'stats:updated', {
    timestamp: now,
    action: 'task_completed',
  });

  lifecycleLogger.info('Task completed', { taskId, resultType: result?.type });
  return { success: true };
}

export async function errorTask(taskId: string, error: string, recoverable: boolean = true): Promise<{
  success: boolean;
  error?: string;
}> {
  const now = new Date().toISOString();

  const task = await get('SELECT * FROM tasks WHERE id = ?', [taskId]) as {
    id: string;
    status: TaskStatus;
  } | undefined;

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const newStatus: TaskStatus = recoverable ? 'in_progress' : 'needs_feedback';

  await run(`
    UPDATE tasks
    SET status = ?, updated_at = ?
    WHERE id = ?
  `, [newStatus, now, taskId]);

  const msgId = randomUUID();
  const errorText = recoverable
    ? `⚠️ Error occurred: ${error}\n\nThe task will continue processing...`
    : `❌ Critical error: ${error}\n\nThis error requires attention.`;

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, taskId, errorText, now]);

  broadcastToChannel('task', 'task:error', {
    taskId,
    error,
    recoverable,
    status: newStatus,
    timestamp: now,
  });

  lifecycleLogger.error('Task error', { taskId, error, recoverable });
  return { success: true };
}

export async function closeTask(taskId: string, reason?: string): Promise<{
  success: boolean;
  error?: string;
}> {
  const now = new Date().toISOString();

  const task = await get('SELECT * FROM tasks WHERE id = ?', [taskId]) as {
    id: string;
    status: TaskStatus;
    current_task_id?: string;
  } | undefined;

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  if (!isValidTransition(task.status, 'close')) {
    return { success: false, error: `Cannot close task in ${task.status} status` };
  }

  await run(`
    UPDATE tasks
    SET status = 'closed', updated_at = ?
    WHERE id = ?
  `, [now, taskId]);

  const shadow = await get('SELECT current_task_id FROM shadow_status WHERE id = ?', ['shadow-1']) as {
    current_task_id: string | null;
  } | undefined;

  if (shadow?.current_task_id === taskId) {
    await run(`
      UPDATE shadow_status
      SET status = 'online',
          current_task_id = NULL,
          last_heartbeat = ?
      WHERE id = 'shadow-1'
    `, [now]);
  }

  const msgId = randomUUID();
  let closureText = `📁 Task closed at ${new Date().toLocaleString()}`;
  if (reason) {
    closureText += `\nReason: ${reason}`;
  }

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, taskId, closureText, now]);

  broadcastToChannel('task', 'task:closed', {
    taskId,
    reason,
    timestamp: now,
  });

  broadcastToChannel('stats', 'stats:updated', {
    timestamp: now,
    action: 'task_closed',
  });

  lifecycleLogger.info('Task closed', { taskId, reason });
  return { success: true };
}

export async function addTaskMessage(
  taskId: string,
  type: 'user' | 'system' | 'claude',
  content: string
): Promise<{
  success: boolean;
  messageId?: string;
  error?: string;
}> {
  const now = new Date().toISOString();

  const task = await get('SELECT id FROM tasks WHERE id = ?', [taskId]);
  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const messageId = randomUUID();

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `, [messageId, taskId, type, content, now]);

  broadcastToChannel('messages', 'message:new', {
    taskId,
    type,
    content,
    messageId,
    timestamp: now,
  });

  return { success: true, messageId };
}

export async function getActiveShadowsCount(): Promise<number> {
  const now = new Date();
  const heartbeatTimeout = 5 * 60 * 1000;

  const result = await get(`
    SELECT COUNT(*) as count
    FROM shadow_status
    WHERE status IN ('online', 'busy')
    AND datetime(last_heartbeat) > datetime(?, '-5 minutes')
  `, [now.toISOString()]) as { count: number };

  return result?.count || 0;
}
