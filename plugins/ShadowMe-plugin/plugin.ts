#!/usr/bin/env node
import ShadowClonePlugin from './src/index';
import ShadowCommands from './src/commands';

let plugin: ShadowClonePlugin | null = null;
let commands: ShadowCommands | null = null;

async function initPlugin() {
  if (!plugin) {
    plugin = new ShadowClonePlugin({
      autoTakeTasks: true,
      pollingInterval: 10000,
    });
    commands = new ShadowCommands(plugin);
    await plugin.initialize();
  }
  return { plugin, commands };
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    const { commands: cmd } = await initPlugin();

    switch (command) {
      case 'help':
        await cmd.help();
        break;
      case 'start':
        console.log('🔮 ShadowMe task monitoring started...');
        console.log('   Press Ctrl+C to stop');
        // Keep process alive
        setInterval(() => {}, 1000);
        break;
      case 'status':
        await cmd.status();
        break;
      case 'tasks':
        await cmd.listTasks(args[1]);
        break;
      case 'take':
        if (!args[1]) {
          console.error('❌ Task ID is required');
          process.exit(1);
        }
        await cmd.takeTask(args[1]);
        break;
      case 'info':
        if (!args[1]) {
          console.error('❌ Task ID is required');
          process.exit(1);
        }
        await cmd.taskInfo(args[1]);
        break;
      case 'complete':
        if (!args[1]) {
          console.error('❌ Task ID is required');
          process.exit(1);
        }
        const result = {
          type: 'text',
          summary: args[2] || 'Task completed',
        };
        await cmd.completeTask(args[1], result);
        break;
      default:
        await cmd.help();
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down ShadowMe...');
  if (plugin) {
    plugin.destroy();
  }
  process.exit(0);
});

main();
