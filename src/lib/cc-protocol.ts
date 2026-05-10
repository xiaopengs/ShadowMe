/**
 * Claude Code (CC) Communication Protocol
 * Defines message types and handlers for CC plugin communication
 */

import { getDatabase } from './db';
import { broadcastToChannel, type SSEChannel } from './sse-manager';
import { logger } from './logger';
import { v4 as uuidv4 } from 'uuid';

const ccLogger = logger.child({ module: 'cc-protocol' });

// ============================================================================
// Message Type Definitions
// ============================================================================

export type CCMessageType = 
  | 'task.assign'      // Assign task to CC
  | 'task.progress'    // CC reports progress
  | 'task.complete'    // CC completes task
  | 'task.error'       // CC encounters error
  | 'task.log'         // CC terminal log output
  | 'git.commit'       // CC commits code
  | 'git.mr_created'   // CC creates MR
  | 'sync.heartbeat'   // CC heartbeat
  | 'sync.status';     // CC status change

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
  progress: number; // 0-100
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

// ============================================================================
// Message Handlers
// ============================================================================

/**
 * Process incoming CC message
 */
export async function processCCMessage(message: CCMessage): Promise<{
  success: boolean;
  error?: string;
}> {
  ccLogger.info('Processing CC message', { type: message.type, messageId: message.messageId });

  try {
    switch (message.type) {
      case 'task.assign':
        return handleTaskAssign(message);
      
      case 'task.progress':
        return handleTaskProgress(message);
      
      case 'task.complete':
        return handleTaskComplete(message);
      
      case 'task.error':
        return handleTaskError(message);
      
      case 'task.log':
        return handleTaskLog(message);
      
      case 'git.commit':
        return handleGitCommit(message);
      
      case 'git.mr_created':
        return handleGitMRCreated(message);
      
      case 'sync.heartbeat':
        return handleHeartbeat(message);
      
      case 'sync.status':
        return handleStatusChange(message);
      
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

/**
 * Handle task assignment acknowledgment from CC
 */
function handleTaskAssign(message: CCTaskAssignMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  
  // Update task status to in_progress
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE tasks 
    SET status = 'in_progress', 
        started_at = COALESCE(started_at, ?),
        updated_at = ?
    WHERE id = ?
  `).run(now, now, message.taskId);

  // Update shadow status to busy
  db.prepare(`
    UPDATE shadow_status 
    SET status = 'busy', 
        current_task_id = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `).run(message.taskId, now);

  // Add system message
  const msgId = uuidv4();
  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, message.taskId, `Task assigned to Claude Code at ${new Date(message.timestamp).toLocaleString()}`, now);

  // Broadcast updates
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

/**
 * Handle progress update from CC
 */
function handleTaskProgress(message: CCTaskProgressMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Add log messages if provided
  if (message.logs && message.logs.length > 0) {
    for (const log of message.logs) {
      const msgId = uuidv4();
      db.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, 'claude', ?, ?)
      `).run(msgId, message.taskId, log, now);
    }
  }

  // Update task with progress info (could extend task table with progress field)
  if (message.message) {
    const msgId = uuidv4();
    db.prepare(`
      INSERT INTO task_messages (id, task_id, type, content, created_at)
      VALUES (?, ?, 'claude', ?, ?)
    `).run(msgId, message.taskId, `[Progress ${message.progress}%] ${message.message}`, now);
  }

  // Broadcast update
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

/**
 * Handle task completion from CC
 */
function handleTaskComplete(message: CCTaskCompleteMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

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
    JSON.stringify(message.result),
    now,
    message.taskId
  );

  // Update shadow status back to online
  db.prepare(`
    UPDATE shadow_status 
    SET status = 'online', 
        current_task_id = NULL,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `).run(now);

  // Add completion message
  const msgId = uuidv4();
  let completionText = `Task completed successfully at ${new Date(message.timestamp).toLocaleString()}\n\n`;
  completionText += `Result Type: ${message.result.type}\n`;
  if (message.result.url) {
    completionText += `URL: ${message.result.url}\n`;
  }
  if (message.result.commitSha) {
    completionText += `Commit: ${message.result.commitSha}\n`;
  }
  completionText += `\n${message.result.summary}`;

  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, message.taskId, completionText, now);

  // Broadcast updates
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

/**
 * Handle task error from CC
 */
function handleTaskError(message: CCTaskErrorMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Update task status if recoverable
  if (message.recoverable) {
    // Keep as in_progress, just log the error
    db.prepare(`
      UPDATE tasks SET updated_at = ? WHERE id = ?
    `).run(now, message.taskId);
  } else {
    // Mark as needs_feedback
    db.prepare(`
      UPDATE tasks SET status = 'needs_feedback', updated_at = ? WHERE id = ?
    `).run(now, message.taskId);
  }

  // Add error message
  const msgId = uuidv4();
  let errorText = `⚠️ Error: ${message.error}\n\n`;
  if (message.stack) {
    errorText += `Stack trace:\n${message.stack}\n\n`;
  }
  errorText += message.recoverable 
    ? 'The task will continue processing...' 
    : 'This error requires attention.';

  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, message.taskId, errorText, now);

  // Broadcast error
  broadcastToChannel('task', 'task:error', {
    taskId: message.taskId,
    error: message.error,
    recoverable: message.recoverable,
    timestamp: now,
  });

  ccLogger.error('Task error from CC', { taskId: message.taskId, error: message.error });
  return { success: true };
}

/**
 * Handle log output from CC
 */
function handleTaskLog(message: CCTaskLogMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Add log to task_messages
  const msgId = uuidv4();
  const prefix = message.level === 'error' ? '❌' : 
                  message.level === 'warn' ? '⚠️' : 
                  message.level === 'debug' ? '🔍' : '📝';
  
  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'claude', ?, ?)
  `).run(msgId, message.taskId, `${prefix} ${message.log}`, now);

  // Broadcast log (throttled on client side)
  broadcastToChannel('messages', 'message:log', {
    taskId: message.taskId,
    level: message.level,
    log: message.log,
    timestamp: now,
  });

  return { success: true };
}

/**
 * Handle git commit from CC
 */
function handleGitCommit(message: CCGitCommitMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Add commit message
  const msgId = uuidv4();
  let commitText = `📦 Commit: ${message.commitSha.slice(0, 8)}\n`;
  commitText += `Branch: ${message.branch}\n`;
  commitText += `Files: ${message.files.length}\n`;
  commitText += `\n${message.message}`;

  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, message.taskId, commitText, now);

  // Broadcast commit
  broadcastToChannel('task', 'task:commit', {
    taskId: message.taskId,
    commitSha: message.commitSha,
    branch: message.branch,
    files: message.files,
  });

  ccLogger.info('Git commit from CC', { taskId: message.taskId, commitSha: message.commitSha });
  return { success: true };
}

/**
 * Handle MR creation from CC
 */
function handleGitMRCreated(message: CCGitMRCreatedMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Add MR message
  const msgId = uuidv4();
  let mrText = `🔀 Merge Request Created\n`;
  mrText += `MR ID: ${message.mrId}\n`;
  mrText += `URL: ${message.mrUrl}\n`;
  mrText += `${message.sourceBranch} → ${message.targetBranch}`;

  db.prepare(`
    INSERT INTO task_messages (id, task_id, type, content, created_at)
    VALUES (?, ?, 'system', ?, ?)
  `).run(msgId, message.taskId, mrText, now);

  // Update task result
  db.prepare(`
    UPDATE tasks 
    SET result = ?, updated_at = ?
    WHERE id = ?
  `).run(
    JSON.stringify({
      type: 'merge_request',
      url: message.mrUrl,
      summary: `Merge Request #${message.mrId} created`,
      mrId: message.mrId,
    }),
    now,
    message.taskId
  );

  // Broadcast MR
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

/**
 * Handle heartbeat from CC
 */
function handleHeartbeat(message: CCSyncHeartbeatMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Update shadow status
  db.prepare(`
    UPDATE shadow_status 
    SET status = ?,
        current_task_id = ?,
        capabilities = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `).run(
    message.status,
    message.currentTaskId || null,
    JSON.stringify(message.capabilities),
    now
  );

  // Broadcast status
  broadcastToChannel('shadow', 'shadow:heartbeat', {
    status: message.status,
    currentTaskId: message.currentTaskId,
    capabilities: message.capabilities,
    lastHeartbeat: now,
  });

  ccLogger.debug('CC heartbeat received', { status: message.status });
  return { success: true };
}

/**
 * Handle status change from CC
 */
function handleStatusChange(message: CCSyncStatusMessage): { success: boolean; error?: string } {
  const db = getDatabase();
  const now = new Date().toISOString();

  // Update shadow status
  db.prepare(`
    UPDATE shadow_status 
    SET status = ?,
        current_task_id = ?,
        last_heartbeat = ?
    WHERE id = 'shadow-1'
  `).run(
    message.status,
    message.currentTaskId || null,
    now
  );

  // Add system message if provided
  if (message.message) {
    // Find a task to attach this to, or skip
    const currentTask = db.prepare(
      'SELECT id FROM tasks WHERE status = ? ORDER BY updated_at DESC LIMIT 1'
    ).get('in_progress') as { id: string } | undefined;
    
    if (currentTask) {
      const msgId = uuidv4();
      db.prepare(`
        INSERT INTO task_messages (id, task_id, type, content, created_at)
        VALUES (?, ?, 'system', ?, ?)
      `).run(msgId, currentTask.id, `🔔 ${message.message}`, now);
    }
  }

  // Broadcast status
  broadcastToChannel('shadow', 'shadow:status', {
    status: message.status,
    currentTaskId: message.currentTaskId,
    message: message.message,
    lastHeartbeat: now,
  });

  ccLogger.info('CC status changed', { status: message.status, message: message.message });
  return { success: true };
}

// ============================================================================
// Outbound Message Creators
// ============================================================================

/**
 * Create a task assignment message to send to CC
 */
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
    messageId: uuidv4(),
    senderId,
    taskId,
    title,
    description,
    priority,
    expectedDelivery,
  };
}

/**
 * Validate incoming message structure
 */
export function validateCCMessage(data: unknown): data is CCMessage {
  if (!data || typeof data !== 'object') return false;
  
  const msg = data as Record<string, unknown>;
  
  // Check required base fields
  if (typeof msg.type !== 'string') return false;
  if (typeof msg.timestamp !== 'string') return false;
  if (typeof msg.messageId !== 'string') return false;
  if (typeof msg.senderId !== 'string') return false;
  
  // Validate known message types
  const validTypes: CCMessageType[] = [
    'task.assign', 'task.progress', 'task.complete', 'task.error', 'task.log',
    'git.commit', 'git.mr_created', 'sync.heartbeat', 'sync.status'
  ];
  
  if (!validTypes.includes(msg.type as CCMessageType)) return false;
  
  return true;
}

/**
 * Get CC protocol version
 */
export function getCCProtocolVersion(): string {
  return '1.0.0';
}
