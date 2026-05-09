# ShadowMe Plugin for Claude Code

Claude Code 插件，让影子分身能够接收看板任务、自动执行并返回结果。

## 功能特性

- 🔮 **任务监听** - 实时监听看板新任务
- ⚡ **自动领取** - 可配置自动领取待处理任务
- 📝 **结果回传** - 完成任务后自动更新看板状态
- 🔗 **GitLab 集成** - 自动创建 MR、提交代码
- 💓 **心跳保持** - 实时保持与看板的连接

## 安装

```bash
cd plugins/ShadowMe-plugin
npm install
```

## 配置

复制 `.env.example` 为 `.env` 并配置：

```bash
cp .env.example .env
```

配置项说明：

| 变量 | 描述 | 默认值 |
|------|------|--------|
| `SHADOW_BOARD_URL` | 看板地址 | `http://localhost:3000` |
| `GITLAB_URL` | GitLab 服务器地址 | - |
| `GITLAB_TOKEN` | GitLab Access Token | - |
| `GITLAB_DEFAULT_PROJECT` | 默认项目 ID | - |
| `WORKING_DIRECTORY` | 工作目录 | `.` |

## 使用方式

### 作为独立服务运行

```bash
npm run dev
```

### 集成到 Claude Code

在你的 Claude Code 配置中添加插件路径。

### CLI 命令

```bash
/shadow help          # 显示帮助
/shadow status        # 查看状态
/shadow tasks         # 查看待处理任务
/shadow take <id>     # 领取任务
/shadow info <id>     # 查看任务详情
/shadow complete <id> # 完成任务
```

## API 接口

### 获取任务列表

```typescript
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

## 许可证

MIT
