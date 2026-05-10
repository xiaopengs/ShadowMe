import { getDatabase, get, run } from './db';
import { broadcastToChannel, type SSEChannel } from './sse-manager';
import { logger } from './logger';
import { randomUUID } from 'crypto';

const ccLogger = logger.child({ module: 'cc-protocol' });

export type CCMessageType =
  | 'task.assign'
  | 'task.progress'
  | 'task.complete'
  | 'task.error'
  | 'task.log'
  | 'git.commit'
  | 'git.mr_created'
  | 'sync.heartbeat'
  | 'sync.status';

export interface CCBaseMessage {
  type: CCMessageType;
  timestamp: string;
  messageId: string;
  senderId: string;
}

export interface CCTaskAssignMessage extends CCBaseMessage {
  type: 'task.assign';
  taskId: string;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  expectedDelivery?: string;
}

export interface CCTaskProgressMessage extends CCBaseMessage {
  type: 'task.progress';
  taskId: string;
  progress: number;
  message?: string;
  logs?: string[];
}

export interface CCTaskCompleteMessage extends CCBaseMessage {
  type: 'task.complete';
  taskId: string;
  result: {
    type: 'merge_request' | 'commit' | 'document' | 'text';
    url?: string;
    summary: string;
    commitSha?: string;
  };
}

export interface CCTaskErrorMessage extends CCBaseMessage {
  type: 'task.error';
  taskId: string;
  error: string;
  stack?: string;
  recoverable: boolean;
}

export interface CCTaskLogMessage extends CCBaseMessage {
  type: 'task.log';
  taskId: string;
  log: string;
  level: 'info' | 'warn' | 'error' | 'debug';
}

export interface CCGitCommitMessage extends CCBaseMessage {
  type: 'git.commit';
  taskId: string;
  commitSha: string;
  branch: string;
  files: string[];
  message: string;
}

export interface CCGitMRCreatedMessage extends CCBaseMessage {
  type: 'git.mr_created';
  taskId: string;
  mrUrl: string;
  mrId: string;
  sourceBranch: string;
  targetBranch: string;
}

export interface CCSyncHeartbeatMessage extends CCBaseMessage {
  type: 'sync.heartbeat';
  status: 'online' | 'busy' | 'idle';
  currentTaskId?: string;
  capabilities: string[];
}

export interface CCSyncStatusMessage extends CCBaseMessage {
  type: 'sync.status';
  status: 'online' | 'busy' | 'idle' | 'offline';
  currentTaskId?: string;
  message?: string;
}

export type CCMessage =
  | CCTaskAssignMessage
  | CCTaskProgressMessage
  | CCTaskCompleteMessage
  | CCTaskErrorMessage
  | CCTaskLogMessage
  | CCGitCommitMessage
  | CCGitMRCreatedMessage
  | CCSyncHeartbeatMessage
  | CCSyncStatusMessage;

export async function processCCMessage(message: CCMessage): Promise<{
  success: boolean;
  error?: string;
}> {
  ccLogger.info('Processing CC message', { type: message.type, messageId: message.messageId });

  try {
    switch (message.type) {
      case 'task.assign':
        return await handleTaskAssign(message);

      case 'task.progress':
        return await handleTaskProgress(message);

      case 'task.complete':
        return await handleTaskComplete(message);

      case 'task.error':
        return await handleTaskError(message);

      case 'task.log':
        return await handleTaskLog(message);

      case 'git.commit':
        return await handleGitCommit(message);

      case 'git.mr_created':
        return await handleGitMRCreated(message);

      case 'sync.heartbeat':
        return await handleHeartbeat(message);

      case 'sync.status':
        return await handleStatusChange(message);

      default:
        return { success: false, error: `Unknown message type: ${(message as CCBaseMessage).type}` };
    }
  } catch (error) {
    ccLogger.error('Error processing CC message', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

async function handleTaskAssign(message: CCTaskAssignMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();
  await run(`
    UPDATE tasks
    SET status = 'in_progress',
        started_at = COALESCE(started_at, ?),
        updated_at = ?
    WHERE id = ?
  `, [now, now, message.taskId]);

  await run(`
    UPDATE shadow_status
    SET status = 'busy',
        current_task_id = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `, [message.taskId, now]);

  const msgId = randomUUID();
  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, message.taskId, `Task assigned to Claude Code at ${new Date(message.timestamp).toLocaleString()}`, now]);

  broadcastToChannel('task', 'task:updated', {
    taskId: message.taskId,
    status: 'in_progress',
    updatedAt: now,
  });

  broadcastToChannel('shadow', 'shadow:status', {
    status: 'busy',
    currentTaskId: message.taskId,
    lastHeartbeat: now,
  });

  ccLogger.info('Task assigned to CC', { taskId: message.taskId });
  return { success: true };
}

async function handleTaskProgress(message: CCTaskProgressMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  if (message.logs && message.logs.length > 0) {
    for (const log of message.logs) {
      const msgId = randomUUID();
      await run(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, 'claude', ?, ?)
      `, [msgId, message.taskId, log, now]);
    }
  }

  if (message.message) {
    const msgId = randomUUID();
    await run(`
      INSERT INTO task_messages (id, task_id, type, content, created_at)
      VALUES (?, ?, 'claude', ?, ?)
    `, [msgId, message.taskId, `[Progress ${message.progress}%] ${message.message}`, now]);
  }

  broadcastToChannel('task', 'task:progress', {
    taskId: message.taskId,
    progress: message.progress,
    message: message.message,
  });

  broadcastToChannel('messages', 'message:new', {
    taskId: message.taskId,
    type: 'claude',
    progress: message.progress,
    message: message.message,
  });

  ccLogger.debug('Task progress updated', { taskId: message.taskId, progress: message.progress });
  return { success: true };
}

async function handleTaskComplete(message: CCTaskCompleteMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  await run(`
    UPDATE tasks
    SET status = 'completed',
        completed_at = ?,
        result = ?,
        updated_at = ?
    WHERE id = ?
  `, [
    now,
    JSON.stringify(message.result),
    now,
    message.taskId
  ]);

  await run(`
    UPDATE shadow_status
    SET status = 'online',
        current_task_id = NULL,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `, [now]);

  const msgId = randomUUID();
  let completionText = `Task completed successfully at ${new Date(message.timestamp).toLocaleString()}\n\n`;
  completionText += `Result Type: ${message.result.type}\n`;
  if (message.result.url) {
    completionText += `URL: ${message.result.url}\n`;
  }
  if (message.result.commitSha) {
    completionText += `Commit: ${message.result.commitSha}\n`;
  }
  completionText += `\n${message.result.summary}`;

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, message.taskId, completionText, now]);

  broadcastToChannel('task', 'task:completed', {
    taskId: message.taskId,
    result: message.result,
    completedAt: now,
  });

  broadcastToChannel('shadow', 'shadow:status', {
    status: 'online',
    currentTaskId: null,
    lastHeartbeat: now,
  });

  broadcastToChannel('stats', 'stats:updated', {
    timestamp: now,
  });

  ccLogger.info('Task completed', { taskId: message.taskId, resultType: message.result.type });
  return { success: true };
}

async function handleTaskError(message: CCTaskErrorMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  if (message.recoverable) {
    await run(`
      UPDATE tasks SET updated_at = ? WHERE id = ?
    `, [now, message.taskId]);
  } else {
    await run(`
      UPDATE tasks SET status = 'needs_feedback', updated_at = ? WHERE id = ?
    `, [now, message.taskId]);
  }

  const msgId = randomUUID();
  let errorText = `⚠️ Error: ${message.error}\n\n`;
  if (message.stack) {
    errorText += `Stack trace:\n${message.stack}\n\n`;
  }
  errorText += message.recoverable
    ? 'The task will continue processing...'
    : 'This error requires attention.';

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, message.taskId, errorText, now]);

  broadcastToChannel('task', 'task:error', {
    taskId: message.taskId,
    error: message.error,
    recoverable: message.recoverable,
    timestamp: now,
  });

  ccLogger.error('Task error from CC', { taskId: message.taskId, error: message.error });
  return { success: true };
}

async function handleTaskLog(message: CCTaskLogMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const msgId = randomUUID();
  const prefix = message.level === 'error' ? '❌' :
                  message.level === 'warn' ? '⚠️' :
                  message.level === 'debug' ? '🔍' : '📝';

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'claude', ?, ?)
  `, [msgId, message.taskId, `${prefix} ${message.log}`, now]);

  broadcastToChannel('messages', 'message:log', {
    taskId: message.taskId,
    level: message.level,
    log: message.log,
    timestamp: now,
  });

  return { success: true };
}

async function handleGitCommit(message: CCGitCommitMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const msgId = randomUUID();
  let commitText = `📦 Commit: ${message.commitSha.slice(0, 8)}\n`;
  commitText += `Branch: ${message.branch}\n`;
  commitText += `Files: ${message.files.length}\n`;
  commitText += `\n${message.message}`;

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, message.taskId, commitText, now]);

  broadcastToChannel('task', 'task:commit', {
    taskId: message.taskId,
    commitSha: message.commitSha,
    branch: message.branch,
    files: message.files,
  });

  ccLogger.info('Git commit from CC', { taskId: message.taskId, commitSha: message.commitSha });
  return { success: true };
}

async function handleGitMRCreated(message: CCGitMRCreatedMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  const msgId = randomUUID();
  let mrText = `🔀 Merge Request Created\n`;
  mrText += `MR ID: ${message.mrId}\n`;
  mrText += `URL: ${message.mrUrl}\n`;
  mrText += `${message.sourceBranch} → ${message.targetBranch}`;

  await run(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `, [msgId, message.taskId, mrText, now]);

  await run(`
    UPDATE tasks
    SET result = ?, updated_at = ?
    WHERE id = ?
  `, [
    JSON.stringify({
      type: 'merge_request',
      url: message.mrUrl,
      summary: `Merge Request #${message.mrId} created`,
      mrId: message.mrId,
    }),
    now,
    message.taskId
  ]);

  broadcastToChannel('task', 'task:mr_created', {
    taskId: message.taskId,
    mrUrl: message.mrUrl,
    mrId: message.mrId,
    sourceBranch: message.sourceBranch,
    targetBranch: message.targetBranch,
  });

  ccLogger.info('MR created from CC', { taskId: message.taskId, mrUrl: message.mrUrl });
  return { success: true };
}

async function handleHeartbeat(message: CCSyncHeartbeatMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  await run(`
    UPDATE shadow_status
    SET status = ?,
        current_task_id = ?,
        capabilities = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `, [
    message.status,
    message.currentTaskId || null,
    JSON.stringify(message.capabilities),
    now
  ]);

  broadcastToChannel('shadow', 'shadow:heartbeat', {
    status: message.status,
    currentTaskId: message.currentTaskId,
    capabilities: message.capabilities,
    lastHeartbeat: now,
  });

  ccLogger.debug('CC heartbeat received', { status: message.status });
  return { success: true };
}

async function handleStatusChange(message: CCSyncStatusMessage): Promise<{ success: boolean; error?: string }> {
  const now = new Date().toISOString();

  await run(`
    UPDATE shadow_status
    SET status = ?,
        current_task_id = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `, [
    message.status,
    message.currentTaskId || null,
    now
  ]);

  if (message.message) {
    const currentTask = await get(
      'SELECT id FROM tasks WHERE status = ? ORDER BY updated_at DESC LIMIT 1',
      ['in_progress']
    ) as { id: string } | undefined;

    if (currentTask) {
      const msgId = randomUUID();
      await run(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, 'system', ?, ?)
      `, [msgId, currentTask.id, `🔔 ${message.message}`, now]);
    }
  }

  broadcastToChannel('shadow', 'shadow:status', {
    status: message.status,
    currentTaskId: message.currentTaskId,
    message: message.message,
    lastHeartbeat: now,
  });

  ccLogger.info('CC status changed', { status: message.status, message: message.message });
  return { success: true };
}

export function createTaskAssignMessage(
  taskId: string,
  title: string,
  description: string,
  priority: 'low' | 'medium' | 'high' | 'urgent',
  expectedDelivery?: string,
  senderId: string = 'shadowme-backend'
): CCTaskAssignMessage {
  return {
    type: 'task.assign',
    timestamp: new Date().toISOString(),
    messageId: randomUUID(),
    senderId,
    taskId,
    title,
    description,
    priority,
    expectedDelivery,
  };
}

export function validateCCMessage(data: unknown): data is CCMessage {
  if (!data || typeof data !== 'object') return false;

  const msg = data as Record<string, unknown>;

  if (typeof msg.type !== 'string') return false;
  if (typeof msg.timestamp !== 'string') return false;
  if (typeof msg.messageId !== 'string') return false;
  if (typeof msg.senderId !== 'string') return false;

  const validTypes: CCMessageType[] = [
    'task.assign', 'task.progress', 'task.complete', 'task.error', 'task.log',
    'git.commit', 'git.mr_created', 'sync.heartbeat', 'sync.status'
  ];

  if (!validTypes.includes(msg.type as CCMessageType)) return false;

  return true;
}

export function getCCProtocolVersion(): string {
  return '1.0.0';
}
