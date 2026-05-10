/**
 * Task Lifecycle Management
 * Handles task state transitions and coordinates with CC and SSE
 */

import { getDatabase } from './db';
import { broadcastToChannel } from './sse-manager';
import { createTaskAssignMessage, type CCMessage } from './cc-protocol';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskStatus } from '@/types';

const lifecycleLogger = logger.child({ module: 'task-lifecycle' });

// ============================================================================
// Task Status Machine
// ============================================================================

/**
 * Valid state transitions:
 * - pending → assigned → in_progress → reviewing → completed
 * - in_progress → closed (cancel)
 * - completed → closed
 * - reviewing → needs_feedback → in_progress
 */

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

/**
 * Check if a state transition is valid
 */
function isValidTransition(currentStatus: TaskStatus, event: TaskLifecycleEvent): boolean {
  return VALID_TRANSITIONS[currentStatus]?.includes(event) ?? false;
}

/**
 * Get task queue position
 */
export function getQueuePosition(taskId: string): number {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT COUNT(*) as position 
    FROM tasks 
    WHERE status = 'pending' 
    AND created_at <= (
      SELECT created_at FROM tasks WHERE id = ?
    )
  `).get(taskId) as { position: number };
  
  return result?.position || 0;
}

/**
 * Get total pending tasks count
 */
export function getPendingTasksCount(): number {
  const db = getDatabase();
  const result = db.prepare(`
    SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'
  `).get() as { count: number };
  
  return result?.count || 0;
}

// ============================================================================
// Task Operations
// ============================================================================

export interface AssignToCCOptions {
  taskId: string;
  sendToCC?: boolean;
  notes?: string;
}

/**
 * Assign a task to CC
 */
export async function assignToCC(options: AssignToCCOptions): Promise<{
  success: boolean;
  error?: string;
  message?: CCMessage;
}> {
  const { taskId, sendToCC = true, notes } = options;
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get task
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as {
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

  // Validate transition
  if (!isValidTransition(task.status, 'assign')) {
    return { success: false, error: `Cannot assign task in ${task.status} status` };
  }

  // Update task status
  db.prepare(`
    UPDATE tasks 
    SET status = 'in_progress', 
        started_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(now, now, taskId);

  // Update shadow status
  db.prepare(`
    UPDATE shadow_status 
    SET status = 'busy', 
        current_task_id = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `).run(taskId, now);

  // Add system message
  const msgId = uuidv4();
  let systemMsg = `Task assigned to Claude Code at ${new Date().toLocaleString()}`;
  if (notes) {
    systemMsg += `\n\nNotes: ${notes}`;
  }
  
  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, taskId, systemMsg, now);

  // Create CC message if needed
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

  // Broadcast updates
  broadcastToChannel('task', 'task:assigned', {
    taskId,
    assignedAt: now,
    queuePosition: getQueuePosition(taskId),
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

  lifecycleLogger.info('Task assigned to CC', { taskId, queuePosition: getQueuePosition(taskId) });

  return { success: true, message: ccMessage };
}

/**
 * Update task progress
 */
export function updateProgress(taskId: string, progress: number, message?: string): {
  success: boolean;
  error?: string;
} {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Verify task exists and is in progress
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as {
    id: string;
    status: TaskStatus;
  } | undefined;

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  if (task.status !== 'in_progress') {
    return { success: false, error: `Task is ${task.status}, not in_progress` };
  }

  // Add progress message if provided
  if (message) {
    const msgId = uuidv4();
    db.prepare(`
      INSERT INTO task_messages (id, task_id, type, content, created_at)
      VALUES (?, ?, 'claude', ?, ?)
    `).run(msgId, taskId, `[Progress: ${progress}%] ${message}`, now);
  }

  // Broadcast progress update
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

/**
 * Complete a task
 */
export function completeTask(
  taskId: string, 
  result?: { type: string; url?: string; summary: string; commitSha?: string }
): {
  success: boolean;
  error?: string;
} {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get task
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as {
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

  // Update task status
  db.prepare(`
    UPDATE tasks 
    SET status = 'completed', 
        completed_at = ?,
        result = ?,
        updated_at = ?
    WHERE id = ?
  `).run(
    now, 
    result ? JSON.stringify(result) : null,
    now,
    taskId
  );

  // Update shadow status
  db.prepare(`
    UPDATE shadow_status 
    SET status = 'online', 
        current_task_id = NULL,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `).run(now);

  // Add completion message
  const msgId = uuidv4();
  let completionText = `✅ Task completed at ${new Date().toLocaleString()}`;
  if (result) {
    completionText += `\n\nResult Type: ${result.type}`;
    if (result.url) completionText += `\nURL: ${result.url}`;
    if (result.commitSha) completionText += `\nCommit: ${result.commitSha.slice(0, 8)}`;
    completionText += `\n\n${result.summary}`;
  }

  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, taskId, completionText, now);

  // Broadcast updates
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

/**
 * Mark task as error
 */
export function errorTask(taskId: string, error: string, recoverable: boolean = true): {
  success: boolean;
  error?: string;
} {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Get task
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as {
    id: string;
    status: TaskStatus;
  } | undefined;

  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  // Update status based on recoverability
  const newStatus: TaskStatus = recoverable ? 'in_progress' : 'needs_feedback';
  
  db.prepare(`
    UPDATE tasks 
    SET status = ?, updated_at = ?
    WHERE id = ?
  `).run(newStatus, now, taskId);

  // Add error message
  const msgId = uuidv4();
  const errorText = recoverable
    ? `⚠️ Error occurred: ${error}\n\nThe task will continue processing...`
    : `❌ Critical error: ${error}\n\nThis error requires attention.`;

  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, taskId, errorText, now);

  // Broadcast error
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

/**
 * Close a task (cancel or finalize)
 */
export function closeTask(taskId: string, reason?: string): {
  success: boolean;
  error?: string;
} {
  const db = getDatabase();
  const now = new Date().toISOString();

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId) as {
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

  // Update task status
  db.prepare(`
    UPDATE tasks 
    SET status = 'closed', updated_at = ?
    WHERE id = ?
  `).run(now, taskId);

  // If CC was working on this task, update shadow status
  const shadow = db.prepare('SELECT current_task_id FROM shadow_status WHERE id = ?').get('shadow-1') as {
    current_task_id: string | null;
  } | undefined;

  if (shadow?.current_task_id === taskId) {
    db.prepare(`
      UPDATE shadow_status 
      SET status = 'online', 
          current_task_id = NULL,
          last_heartbeat = ?
      WHERE id = 'shadow-1'
    `).run(now);
  }

  // Add closure message
  const msgId = uuidv4();
  let closureText = `📁 Task closed at ${new Date().toLocaleString()}`;
  if (reason) {
    closureText += `\nReason: ${reason}`;
  }

  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, taskId, closureText, now);

  // Broadcast update
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

/**
 * Add a message to a task
 */
export function addTaskMessage(
  taskId: string,
  type: 'user' | 'system' | 'claude',
  content: string
): {
  success: boolean;
  messageId?: string;
  error?: string;
} {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Verify task exists
  const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(taskId);
  if (!task) {
    return { success: false, error: 'Task not found' };
  }

  const messageId = uuidv4();
  
  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(messageId, taskId, type, content, now);

  // Broadcast message
  broadcastToChannel('messages', 'message:new', {
    taskId,
    type,
    content,
    messageId,
    timestamp: now,
  });

  return { success: true, messageId };
}

/**
 * Get active CC instances count (connected shadows)
 */
export function getActiveShadowsCount(): number {
  const db = getDatabase();
  const now = new Date();
  const heartbeatTimeout = 5 * 60 * 1000; // 5 minutes

  const result = db.prepare(`
    SELECT COUNT(*) as count 
    FROM shadow_status 
    WHERE status IN ('online', 'busy') 
    AND datetime(last_heartbeat) > datetime(?, '-5 minutes')
  `).get(now.toISOString()) as { count: number };

  return result?.count || 0;
}
