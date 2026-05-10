# ShadowMe Claude Code Plugin

让本地 Claude Code 实例能连接 ShadowMe 看板，自动领取和执行任务。

## 功能介绍

ShadowMe Claude Code Plugin 是 ShadowMe 影子分身协作看板的 Claude Code 集成插件，实现：

- 🤖 **自动任务领取** - 从看板拉取待领取任务并自动执行
- 📊 **实时进度同步** - 执行过程实时上报到看板
- 📝 **工作日志** - 发送工作日志供协作者查看
- ✅ **自动完成上报** - 任务完成后自动提交代码并标记完成
- 💓 **心跳保活** - 定期发送心跳维持连接状态

## 架构说明

```
┌─────────────────────────────────────────────────────────────┐
│                     Claude Code                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Commands   │  │   Agents    │  │      Skills         │ │
│  │ /shadow-*   │  │shadow-worker│  │    shadow-sync      │ │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                     │            │
│         └────────────────┼─────────────────────┘            │
│                          │                                  │
│  ┌───────────────────────┼───────────────────────────────┐ │
│  │              Scripts (工具脚本)                         │ │
│  │  shadowme-api.sh | poll-tasks.sh | report-progress.sh  │ │
│  │  report-complete.sh | heartbeat.sh                     │ │
│  └───────────────────────┬───────────────────────────────┘ │
└──────────────────────────┼─────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   Webhook   │
                    │  /api/webhook/cc
                    └──────┬──────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    ShadowMe 看板后端                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ SSE推送  │  │ Webhook  │  │ 任务API  │  │ 影子状态 │   │
│  │/api/sse  │  │  接收端  │  │ /api/tasks│ │/api/shadow│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
cc-plugin/
├── .claude-plugin/
│   └── plugin.json          # Plugin 清单文件
├── commands/                 # Slash 命令
│   ├── shadow-connect.md    # 配置连接
│   ├── shadow-poll.md       # 拉取任务
│   ├── shadow-take.md       # 领取任务
│   ├── shadow-status.md     # 查看状态
│   ├── shadow-done.md       # 完成任务
│   └── shadow-log.md        # 发送日志
├── agents/                  # 子 Agent
│   └── shadow-worker.md     # 自动任务执行
├── skills/
│   └── shadow-sync/
│       └── SKILL.md         # 同步技能
├── hooks/
│   └── hooks.json           # 自动钩子配置
├── scripts/                 # 工具脚本
│   ├── shadowme-api.sh      # API 调用封装
│   ├── poll-tasks.sh        # 轮询任务
│   ├── report-progress.sh   # 进度上报
│   ├── report-complete.sh   # 完成上报
│   └── heartbeat.sh         # 心跳发送
├── .mcp.json               # MCP Server 配置
├── README.md               # 本文件
└── INSTALL.md              # 安装指南
```

## 命令列表

| 命令 | 说明 |
|------|------|
| `/shadow-connect` | 首次配置连接看板 |
| `/shadow-poll` | 拉取待领取任务 |
| `/shadow-take <id>` | 领取任务 |
| `/shadow-status` | 查看当前状态 |
| `/shadow-done <summary>` | 完成任务 |
| `/shadow-log <message>` | 发送工作日志 |

## CC 协议消息

### 发送到看板的消息

| 消息类型 | 说明 |
|----------|------|
| `task.assign` | 任务领取 |
| `task.progress` | 进度更新 |
| `task.complete` | 任务完成 |
| `task.error` | 执行错误 |
| `log` | 工作日志 |
| `git.commit` | Git 提交 |
| `git.mr_created` | MR 创建 |
| `sync.heartbeat` | 心跳 |

### 接收看板消息

| 消息类型 | 说明 |
|----------|------|
| `task.assign` | 新任务分配 |
| `task.cancel` | 任务取消 |
| `sync.status` | 状态查询 |

## 使用示例

### 完整任务流程

```bash
# 1. 配置连接
/shadow-connect https://shadowme.app your-api-key

# 2. 拉取任务
/shadow-poll

# 3. 领取任务
/shadow-take TASK-001

# 4. 执行中报告进度
/shadow-log 正在分析代码结构...

# 5. 完成任务
/shadow-done 重构完成，提取了5个公共组件，提交PR #42
```

### 自动模式

加载 `shadow-worker` agent 后，会自动：
1. 轮询新任务
2. 领取任务
3. 执行任务
4. 上报进度
5. 完成提交

## 配置说明

配置存储在 `~/.shadowme/config`：

```bash
# ShadowMe 服务器
SHADOWME_URL="https://shadowme.example.com"
SHADOWME_API_KEY="your-api-key"
SHADOWME_SHADOW_ID="shadow-001"

# GitLab 配置（可选）
SHADOWME_GITLAB_URL="https://gitlab.com"
SHADOWME_GITLAB_TOKEN="glpat-xxxx"

# 轮询配置
SHADOWME_POLL_INTERVAL=60
```

## 依赖要求

- **必须**: Claude Code CLI
- **可选**: jq（JSON 处理）, curl（API 调用）

## 安装

请参考 [INSTALL.md](./INSTALL.md) 安装指南。

## License

MIT
