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
