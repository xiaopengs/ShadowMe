import ShadowClonePlugin from './index';
import type { Task } from './types';

class ShadowCommands {
  private plugin: ShadowClonePlugin;

  constructor(plugin: ShadowClonePlugin) {
    this.plugin = plugin;
  }

  async help(): Promise<void> {
    console.log(`
🔮 Shadow Clone Plugin Commands
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/shadow help          - Show this help message
/shadow status        - Show current shadow status
/shadow tasks         - List pending tasks
/shadow take <id>     - Take a specific task
/shadow info <id>     - Show task details
/shadow complete <id> - Complete a task with result

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  async status(): Promise<void> {
    const tasks = await this.plugin.getTasks();
    const pendingTasks = tasks.filter(t => t.status === 'pending');
    const inProgressTasks = tasks.filter(t => t.status === 'in_progress');

    console.log(`
🟢 Shadow Clone Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Connection: ${this.plugin['isConnected'] ? 'Connected' : 'Disconnected'}
  Pending Tasks: ${pendingTasks.length}
  In Progress: ${inProgressTasks.length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  async listTasks(status?: string): Promise<void> {
    const tasks = status
      ? await this.plugin.getTasks(status)
      : await this.plugin.getPendingTasks();

    if (tasks.length === 0) {
      console.log('📭 No pending tasks');
      return;
    }

    console.log(`
📋 Pending Tasks (${tasks.length})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    tasks.forEach((task: Task) => {
      console.log(`  [${task.id.slice(0, 8)}] ${task.title}`);
      console.log(`    Type: ${task.type} | Priority: ${task.priority}`);
      console.log(`    Created by: ${task.createdBy}`);
      console.log('');
    });
  }

  async takeTask(taskId: string): Promise<void> {
    const task = await this.plugin.takeTask(taskId);
    if (task) {
      console.log(`✅ Task taken: ${task.title}`);
      console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task Details:
  Title: ${task.title}
  Type: ${task.type}
  Priority: ${task.priority}
  Description:
${task.description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    } else {
      console.log(`❌ Failed to take task: ${taskId}`);
    }
  }

  async taskInfo(taskId: string): Promise<void> {
    const task = await this.plugin.getTask(taskId);
    if (!task) {
      console.log(`❌ Task not found: ${taskId}`);
      return;
    }

    console.log(`
📋 Task Details: ${task.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Title: ${task.title}
  Type: ${task.type}
  Priority: ${task.priority}
  Status: ${task.status}
  Created by: ${task.createdBy}
  Created at: ${new Date(task.createdAt).toLocaleString()}
  ${task.startedAt ? `Started at: ${new Date(task.startedAt).toLocaleString()}` : ''}
  ${task.completedAt ? `Completed at: ${new Date(task.completedAt).toLocaleString()}` : ''}

Description:
${task.description}

Tags: ${task.tags.join(', ') || 'None'}
${task.expectedDelivery ? `Expected Delivery: ${task.expectedDelivery}` : ''}
${task.result ? `
Result:
  Type: ${task.result.type}
  Summary: ${task.result.summary}
  ${task.result.url ? `URL: ${task.result.url}` : ''}
` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  async completeTask(taskId: string, result: { type: string; summary: string; url?: string }): Promise<void> {
    const task = await this.plugin.completeTask(taskId, {
      type: result.type as any,
      summary: result.summary,
      url: result.url,
    });

    if (task) {
      console.log(`✅ Task completed: ${task.title}`);
    } else {
      console.log(`❌ Failed to complete task: ${taskId}`);
    }
  }
}

export default ShadowCommands;
