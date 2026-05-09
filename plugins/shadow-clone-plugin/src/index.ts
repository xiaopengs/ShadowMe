import axios from 'axios';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import type { Task, ShadowConfig, TaskResult, GitLabMR } from './types';

class ShadowClonePlugin extends EventEmitter {
  private config: ShadowConfig;
  private ws: WebSocket | null = null;
  private pollingTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;
  private pendingTasks: Map<string, Task> = new Map();

  constructor(config: Partial<ShadowConfig> = {}) {
    super();
    this.config = {
      boardUrl: config.boardUrl || process.env.SHADOW_BOARD_URL || 'http://localhost:3000',
      gitlabUrl: config.gitlabUrl || process.env.GITLAB_URL || '',
      gitlabToken: config.gitlabToken || process.env.GITLAB_TOKEN || '',
      gitlabDefaultProject: config.gitlabDefaultProject || process.env.GITLAB_DEFAULT_PROJECT || '',
      workingDirectory: config.workingDirectory || process.env.WORKING_DIRECTORY || '.',
      autoTakeTasks: config.autoTakeTasks ?? false,
      pollingInterval: config.pollingInterval || 10000,
    };
  }

  async initialize(): Promise<void> {
    console.log('🔮 Shadow Clone Plugin initializing...');
    await this.connectWebSocket();
    this.startPolling();
    this.startHeartbeat();
    console.log('✅ Shadow Clone Plugin initialized');
  }

  private async connectWebSocket(): Promise<void> {
    try {
      const wsUrl = `${this.config.boardUrl.replace('http', 'ws')}/api/ws`;
      this.ws = new WebSocket(wsUrl);

      this.ws.on('open', () => {
        console.log('📡 WebSocket connected');
        this.isConnected = true;
        this.sendHeartbeat();
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      });

      this.ws.on('close', () => {
        console.log('📡 WebSocket disconnected');
        this.isConnected = false;
        setTimeout(() => this.connectWebSocket(), 5000);
      });

      this.ws.on('error', (err) => {
        console.error('WebSocket error:', err);
      });
    } catch (err) {
      console.error('Failed to connect WebSocket:', err);
      setTimeout(() => this.connectWebSocket(), 5000);
    }
  }

  private handleMessage(message: any): void {
    const { event, data } = message;

    switch (event) {
      case 'task:created':
        console.log(`📋 New task created: ${data.title}`);
        this.emit('task:created', data);
        if (this.config.autoTakeTasks) {
          this.takeTask(data.id);
        }
        break;

      case 'task:updated':
        console.log(`📝 Task updated: ${data.title} -> ${data.status}`);
        this.emit('task:updated', data);
        break;

      case 'shadow:status_changed':
        console.log(`🟢 Shadow status: ${data.status}`);
        this.emit('shadow:status_changed', data);
        break;

      default:
        this.emit('message', message);
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
      await axios.post(`${this.config.boardUrl}/api/shadow/status`, {
        status: this.pendingTasks.size > 0 ? 'busy' : 'online',
        lastHeartbeat: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to send heartbeat:', err);
    }
  }

  async getTasks(status?: string): Promise<Task[]> {
    try {
      const url = status
        ? `${this.config.boardUrl}/api/tasks?status=${status}`
        : `${this.config.boardUrl}/api/tasks`;
      const response = await axios.get(url);
      return response.data.tasks;
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
      const response = await axios.get(`${this.config.boardUrl}/api/tasks/${taskId}`);
      return response.data;
    } catch (err) {
      console.error('Failed to fetch task:', err);
      return null;
    }
  }

  async takeTask(taskId: string): Promise<Task | null> {
    try {
      const response = await axios.post(`${this.config.boardUrl}/api/tasks/${taskId}/take`);
      console.log(`🎯 Task taken: ${taskId}`);
      this.emit('task:taken', response.data);
      return response.data;
    } catch (err) {
      console.error('Failed to take task:', err);
      return null;
    }
  }

  async completeTask(taskId: string, result: TaskResult): Promise<Task | null> {
    try {
      const response = await axios.post(`${this.config.boardUrl}/api/tasks/${taskId}/complete`, {
        result,
      });
      console.log(`✅ Task completed: ${taskId}`);
      this.emit('task:completed', response.data);
      this.pendingTasks.delete(taskId);
      return response.data;
    } catch (err) {
      console.error('Failed to complete task:', err);
      return null;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task | null> {
    try {
      const response = await axios.patch(`${this.config.boardUrl}/api/tasks/${taskId}`, updates);
      return response.data;
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
      const response = await axios.post(
        `${this.config.gitlabUrl}/api/v4/projects/${projectId}/merge_requests`,
        {
          source_branch: sourceBranch,
          target_branch: targetBranch,
          title,
          description,
        },
        {
          headers: {
            'PRIVATE-TOKEN': this.config.gitlabToken,
          },
        }
      );
      return response.data;
    } catch (err) {
      console.error('Failed to create GitLab MR:', err);
      return null;
    }
  }

  async commitToGitLab(
    projectId: string,
    filePath: string,
    content: string,
    commitMessage: string,
    branch: string = 'main'
  ): Promise<boolean> {
    if (!this.config.gitlabToken) {
      console.error('GitLab token not configured');
      return false;
    }

    try {
      const encodedPath = encodeURIComponent(filePath);
      await axios.put(
        `${this.config.gitlabUrl}/api/v4/projects/${projectId}/repository/files/${encodedPath}`,
        {
          branch,
          content,
          commit_message: commitMessage,
        },
        {
          headers: {
            'PRIVATE-TOKEN': this.config.gitlabToken,
          },
        }
      );
      console.log(`📤 Committed to GitLab: ${filePath}`);
      return true;
    } catch (err) {
      console.error('Failed to commit to GitLab:', err);
      return false;
    }
  }

  destroy(): void {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    if (this.ws) {
      this.ws.close();
    }
    console.log('🔮 Shadow Clone Plugin destroyed');
  }
}

export default ShadowClonePlugin;
export { ShadowClonePlugin };
