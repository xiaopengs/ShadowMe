# ShadowMe Plugin for Claude Code

Claude Code 插件，让影子分身能够接收看板任务、自动执行并返回结果。

## 功能特性

- 🔮 **任务监听** - 实时监听看板新任务
- ⚡ **自动领取** - 可配置自动领取待处理任务
- 📝 **结果回传** - 完成任务后自动更新看板状态
- 🔗 **GitLab 集成** - 自动创建 MR、提交代码
- 💓 **心跳保持** - 实时保持与看板的连接

## 安装方式

### 方式一：作为 Claude Code 插件安装（推荐）

1. 确保已安装 [Claude Code VS Code 扩展](https://marketplace.visualstudio.com/items?itemName=anthropic.claude-code)

2. 在 VS Code 中打开 Claude Code，输入：
   ```
   /plugins
   ```

3. 在插件管理界面中，点击 **Marketplaces** 标签，添加本地插件目录：
   ```
   /workspace/ShadowMe/plugins/ShadowMe-plugin
   ```

4. 或者，在启动 Claude Code 时指定插件目录：
   ```bash
   claude --plugin-dir /workspace/ShadowMe/plugins/ShadowMe-plugin
   ```

### 方式二：作为独立 Node.js 库安装

```bash
cd plugins/ShadowMe-plugin
npm install
```

## 配置

### Claude Code 插件配置

首次使用时，需要配置 ShadowMe 看板地址。可以通过以下方式：

1. 创建 `.env` 文件：
   ```bash
   cp .env.example .env
   ```

2. 编辑 `.env` 文件：

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `SHADOW_BOARD_URL` | 看板地址 | `http://localhost:3000` |
| `GITLAB_URL` | GitLab 服务器地址 | - |
| `GITLAB_TOKEN` | GitLab Access Token | - |
| `GITLAB_DEFAULT_PROJECT` | 默认项目 ID | - |
| `WORKING_DIRECTORY` | 工作目录 | `.` |

## 使用方式

### 在 Claude Code VS Code 扩展中使用

安装插件后，可以使用以下技能：

| 技能 | 描述 |
|------|------|
| `/shadowme:status` | 检查 ShadowMe 看板状态和连接 |
| `/shadowme:list-tasks` | 列出看板上的所有任务 |
| `/shadowme:create-task` | 创建新任务到看板 |
| `/shadowme:take-task` | 领取看板任务 |
| `/shadowme:complete-task` | 完成看板任务并提交结果 |

### 作为独立服务运行

```bash
npm run dev
```

### CLI 命令（独立模式）

```bash
/shadow help          # 显示帮助
/shadow status        # 查看状态
/shadow tasks         # 查看待处理任务
/shadow take <id>     # 领取任务
/shadow info <id>     # 查看任务详情
/shadow complete <id> # 完成任务
```

## API 接口（作为 Node.js 库）

### 获取任务列表

```typescript
import ShadowClonePlugin from './src/index';

const plugin = new ShadowClonePlugin({
  boardUrl: 'http://localhost:3000'
});
await plugin.initialize();

const tasks = await plugin.getTasks('pending');
```

### 领取任务

```typescript
const task = await plugin.takeTask('task-id');
```

### 完成任务

```typescript
await plugin.completeTask('task-id', {
  type: 'merge_request',
  summary: '代码审查完成，发现 3 个问题',
  url: 'https://gitlab.com/...'
});
```

### GitLab MR

```typescript
const mr = await plugin.createGitLabMR(
  projectId,
  sourceBranch,
  targetBranch,
  'MR 标题',
  'MR 描述'
);
```

## 事件监听

```typescript
plugin.on('task:pending', (task) => {
  console.log('新任务:', task.title);
});

plugin.on('task:taken', (task) => {
  console.log('已领取:', task.title);
});

plugin.on('task:completed', (task) => {
  console.log('已完成:', task.title);
});
```

## 插件结构

```
ShadowMe-plugin/
├── .claude-plugin/
│   └── plugin.json          # 插件清单
├── skills/
│   ├── status/
│   │   └── SKILL.md         # 检查状态技能
│   ├── list-tasks/
│   │   └── SKILL.md         # 列出任务技能
│   ├── create-task/
│   │   └── SKILL.md         # 创建任务技能
│   ├── take-task/
│   │   └── SKILL.md         # 领取任务技能
│   └── complete-task/
│       └── SKILL.md         # 完成任务技能
├── src/
│   ├── index.ts             # Node.js 库主入口
│   ├── commands.ts          # CLI 命令
│   └── types.ts             # 类型定义
├── .env.example             # 环境变量示例
├── package.json
└── README.md
```

## 开发与测试

### 本地测试插件

```bash
# 启动 Claude Code 并加载本地插件
claude --plugin-dir /workspace/ShadowMe/plugins/ShadowMe-plugin
```

### 重新加载插件

在 Claude Code 中输入：
```
/reload-plugins
```

## 许可证

MIT
