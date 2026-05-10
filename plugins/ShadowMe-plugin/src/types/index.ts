export interface Task {
  id: string;
  title: string;
  type: 'technical_issue' | 'design_doc' | 'code_review' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in_progress' | 'completed' | 'needs_feedback' | 'closed';
  description: string;
  tags: string[];
  attachments: Attachment[];
  expectedDelivery?: string;
  result?: TaskResult;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

export interface TaskResult {
  type: 'merge_request' | 'commit' | 'document' | 'text';
  url?: string;
  summary: string;
  commitSha?: string;
}

export interface ShadowConfig {
  boardUrl: string;
  apiKey: string;
  gitlabUrl: string;
  gitlabToken: string;
  gitlabDefaultProject: string;
  workingDirectory: string;
  autoTakeTasks: boolean;
  pollingInterval: number;
}

export interface GitLabMR {
  id: number;
  iid: number;
  title: string;
  description: string;
  web_url: string;
  source_branch: string;
  target_branch: string;
  state: string;
  sha: string;
}

export interface GitLabCommit {
  id: string;
  short_id: string;
  title: string;
  message: string;
  author_name: string;
  author_email: string;
  created_at: string;
}

// Protocol Message Types
export type CCMessageType =
  | 'task.assign'
  | 'task.progress'
  | 'task.complete'
  | 'task.error'
  | 'log'
  | 'git.commit'
  | 'git.mr_created'
  | 'sync.heartbeat';

export interface CCBaseMessage {
  type: CCMessageType;
  timestamp: string;
  messageId: string;
  senderId: string;
}

export interface CCTaskAssignMessage extends CCBaseMessage {
  type: 'task.assign';
  taskId: string;
  taskTitle: string;
}

export interface CCTaskProgressMessage extends CCBaseMessage {
  type: 'task.progress';
  taskId: string;
  progress: number;
  message: string;
}

export interface CCTaskCompleteMessage extends CCBaseMessage {
  type: 'task.complete';
  taskId: string;
  summary: string;
  commitSha?: string;
  duration?: string;
}

export interface CCTaskErrorMessage extends CCBaseMessage {
  type: 'task.error';
  taskId: string;
  error: string;
  stack?: string;
}

export interface CCLogMessage extends CCBaseMessage {
  type: 'log';
  taskId: string;
  content: string;
  level?: 'info' | 'progress' | 'warning' | 'error';
}

export interface CCGitCommitMessage extends CCBaseMessage {
  type: 'git.commit';
  taskId: string;
  commitSha: string;
  message: string;
  files?: string[];
}

export interface CCGitMRCreatedMessage extends CCBaseMessage {
  type: 'git.mr_created';
  taskId: string;
  mrId?: number;
  mrIid?: number;
  url?: string;
  title: string;
}

export interface CCSyncHeartbeatMessage extends CCBaseMessage {
  type: 'sync.heartbeat';
  status: 'online' | 'busy' | 'idle';
}

export type CCMessage =
  | CCTaskAssignMessage
  | CCTaskProgressMessage
  | CCTaskCompleteMessage
  | CCTaskErrorMessage
  | CCLogMessage
  | CCGitCommitMessage
  | CCGitMRCreatedMessage
  | CCSyncHeartbeatMessage;
