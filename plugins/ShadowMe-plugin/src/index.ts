import { EventEmitter } from 'events';
import type { Task, ShadowConfig, TaskResult, GitLabMR } from './types';

class ShadowClonePlugin extends EventEmitter {
  private config: ShadowConfig;
  private pollingTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private pendingTasks: Map<string, Task> = new Map();

  constructor(config: Partial<ShadowConfig> = {}) {
    super();
    this.config = {
      boardUrl: config.boardUrl || process.env.SHADOW_BOARD_URL || 'http://localhost:3000',
      apiKey: config.apiKey || process.env.SHADOW_API_KEY || '',
      gitlabUrl: config.gitlabUrl || process.env.GITLAB_URL || '',
      gitlabToken: config.gitlabToken || process.env.GITLAB_TOKEN || '',
      gitlabDefaultProject: config.gitlabDefaultProject || process.env.GITLAB_DEFAULT_PROJECT || '',
      workingDirectory: config.workingDirectory || process.env.WORKING_DIRECTORY || '.',
      autoTakeTasks: config.autoTakeTasks ?? false,
      pollingInterval: config.pollingInterval || 10000,
    };
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.config.apiKey) {
      headers['x-cc-api-key'] = this.config.apiKey;
    }
    return headers;
  }

  async initialize(): Promise<void> {
    console.log('🔮 ShadowMe Plugin initializing...');
    console.log(`   Board URL: ${this.config.boardUrl}`);
    console.log(`   API Key: ${this.config.apiKey ? '✅ configured' : '⚠️ not set (dev mode)'}`);

    const statusOk = await this.checkConnection();
    if (statusOk) {
      console.log('   Connection: ✅ Board reachable');
    } else {
      console.log('   Connection: ❌ Board unreachable');
    }

    this.startPolling();
    this.startHeartbeat();
    console.log('✅ ShadowMe Plugin initialized');
  }

  async checkConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.boardUrl}/api/status`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  private startPolling(): void {
    this.pollingTimer = setInterval(async () => {
      await this.checkNewTasks();
    }, this.config.pollingInterval);
  }

  private async checkNewTasks(): Promise<void> {
    try {
      const tasks = await this.getPendingTasks();
      tasks.forEach((task) => {
        if (!this.pendingTasks.has(task.id)) {
          this.pendingTasks.set(task.id, task);
          this.emit('task:pending', task);
          console.log(`📋 New task detected: ${task.title} [${task.id.slice(0, 8)}]`);
          if (this.config.autoTakeTasks) {
            this.takeTask(task.id);
          }
        }
      });
    } catch (err) {
      console.error('Failed to check tasks:', err);
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendHeartbeat();
    }, 30000);
  }

  private async sendHeartbeat(): Promise<void> {
    try {
      const response = await fetch(`${this.config.boardUrl}/api/shadow/status`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          status: this.pendingTasks.size > 0 ? 'busy' : 'online',
          lastHeartbeat: new Date().toISOString(),
        }),
      });
      if (!response.ok) {
        console.error(`Heartbeat failed: ${response.status}`);
      }
    } catch (err) {
      console.error('Failed to send heartbeat:', err);
    }
  }

  async getTasks(status?: string): Promise<Task[]> {
    try {
      const url = status
        ? `${this.config.boardUrl}/api/tasks?status=${status}`
        : `${this.config.boardUrl}/api/tasks`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch tasks: ${response.status} ${errText}`);
      }
      const data = await response.json();
      return data.tasks;
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      return [];
    }
  }

  async getPendingTasks(): Promise<Task[]> {
    return this.getTasks('pending');
  }

  async getTask(taskId: string): Promise<Task | null> {
    try {
      const response = await fetch(`${this.config.boardUrl}/api/tasks/${taskId}`, {
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to fetch task: ${response.status} ${errText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to fetch task:', err);
      return null;
    }
  }

  async takeTask(taskId: string): Promise<Task | null> {
    try {
      const response = await fetch(`${this.config.boardUrl}/api/tasks/${taskId}/take`, {
        method: 'POST',
        headers: this.getHeaders(),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to take task: ${response.status} ${errText}`);
      }
      const data = await response.json();
      console.log(`🎯 Task taken: ${taskId}`);
      this.emit('task:taken', data);
      return data;
    } catch (err) {
      console.error('Failed to take task:', err);
      return null;
    }
  }

  async completeTask(taskId: string, result: TaskResult): Promise<Task | null> {
    try {
      const response = await fetch(`${this.config.boardUrl}/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ result }),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to complete task: ${response.status} ${errText}`);
      }
      const data = await response.json();
      console.log(`✅ Task completed: ${taskId}`);
      this.emit('task:completed', data);
      this.pendingTasks.delete(taskId);
      return data;
    } catch (err) {
      console.error('Failed to complete task:', err);
      return null;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const response = await fetch(`${this.config.boardUrl}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Failed to update task: ${response.status} ${errText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to update task:', err);
      return null;
    }
  }

  async createGitLabMR(
    projectId: string,
    sourceBranch: string,
    targetBranch: string,
    title: string,
    description: string
  ): Promise<GitLabMR | null> {
    if (!this.config.gitlabToken) {
      console.error('GitLab token not configured');
      return null;
    }

    try {
      const response = await fetch(
        `${this.config.gitlabUrl}/api/v4/projects/${projectId}/merge_requests`,
        {
          method: 'POST',
          headers: {
            'PRIVATE-TOKEN': this.config.gitlabToken,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            source_branch: sourceBranch,
            target_branch: targetBranch,
            title,
            description,
          }),
        }
      );
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`GitLab MR failed: ${response.status} ${errText}`);
      }
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Failed to create GitLab MR:', err);
      return null;
    }
  }

  destroy(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    console.log('🔮 ShadowMe Plugin destroyed');
  }
}

export default ShadowClonePlugin;
export { ShadowClonePlugin };
