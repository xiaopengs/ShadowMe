/**
 * CC Communication Protocol Module
 * Re-exports all CC protocol related types and functions
 */

export {
  type CCMessage,
  type CCMessageType,
  type CCTaskAssignMessage,
  type CCTaskProgressMessage,
  type CCTaskCompleteMessage,
  type CCTaskErrorMessage,
  type CCTaskLogMessage,
  type CCGitCommitMessage,
  type CCGitMRCreatedMessage,
  type CCSyncHeartbeatMessage,
  type CCSyncStatusMessage,
  processCCMessage,
  createTaskAssignMessage,
  validateCCMessage,
  getCCProtocolVersion,
} from './cc-protocol';

export {
  type SSEClient,
  type SSEChannel,
  type SSEMessage,
  createSSEConnection,
  removeClient,
  updateSubscriptions,
  broadcastToChannel,
  sendToClient,
  broadcast,
  getConnectionStats,
  isSSEAvailable,
} from './sse-manager';

export {
  type TaskLifecycleEvent,
  assignToCC,
  updateProgress,
  completeTask,
  errorTask,
  closeTask,
  addTaskMessage,
  getQueuePosition,
  getPendingTasksCount,
  getActiveShadowsCount,
} from './task-lifecycle';

export {
  type SSEMessage as SSEClientMessage,
  type SSEOptions,
  type UseSSEReturn,
  useSSE,
  useTaskSSE,
  useShadowSSE,
} from './use-sse';
