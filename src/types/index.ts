export type TaskType = 'technical_issue' | 'design_doc' | 'code_review' | 'other';

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'needs_feedback' | 'closed';

export type ShadowStatus = 'online' | 'busy' | 'offline' | 'unknown';

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

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  priority: Priority;
  status: TaskStatus;
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

export interface TaskFormData {
  title: string;
  type: TaskType;
  priority: Priority;
  description: string;
  tags: string[];
  expectedDelivery?: string;
  dueDate?: string;
  createdBy: string;
}

export interface BoardColumn {
  id: TaskStatus;
  title: string;
  tasks: Task[];
}

export interface ShadowState {
  id: string;
  name: string;
  status: ShadowStatus;
  currentTaskId?: string;
  currentTask?: Task;
  lastHeartbeat: string;
  capabilities: string[];
  autoTakeTasks: boolean;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

export interface Stats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  closed: number;
  avgCompletionTime?: number;
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  technical_issue: '技术问题',
  design_doc: '方案设计',
  code_review: '代码审查',
  other: '其他'
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: '低',
  medium: '中',
  high: '高',
  urgent: '紧急'
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: '待领取',
  in_progress: '处理中',
  completed: '已完成',
  needs_feedback: '需要反馈',
  closed: '已关闭'
};

export const COLUMN_ORDER: TaskStatus[] = ['pending', 'in_progress', 'completed', 'closed'];

export interface SyncMessage {
  id: string;
  type: 'user' | 'system' | 'claude';
  content: string;
  timestamp: string;
}

export interface TaskMessage {
  id: string;
  taskId: string;
  type: 'user' | 'system' | 'claude';
  content: string;
  createdAt: string;
}
