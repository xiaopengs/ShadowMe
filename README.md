# ShadowMe - 智能影子分身协作看板

<p align="center">
  <img src="public/logo.svg" alt="ShadowMe" width="120" />
</p>

<p align="center">
  <strong>让 AI 影子分身成为你的协作伙伴</strong>
</p>

<p align="center">
  <a href="https://github.com/xiaopengs/ShadowMe/stargazers">
    <img src="https://img.shields.io/github/stars/xiaopengs/ShadowMe?style=flat-square" alt="Stars" />
  </a>
  <a href="https://github.com/xiaopengs/ShadowMe/issues">
    <img src="https://img.shields.io/github/issues/xiaopengs/ShadowMe?style=flat-square" alt="Issues" />
  </a>
  <a href="https://github.com/xiaopengs/ShadowMe/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/xiaopengs/ShadowMe?style=flat-square" alt="License" />
  </a>
</p>

---

## 项目介绍

ShadowMe 是一款智能影子分身协作看板，旨在将 Claude Code 等 AI 工具融入日常工作流程。通过 ShadowMe，你可以创建任务并交给 AI 影子分身自动处理，实现人机协作的高效工作方式。

### 核心场景

```
协作方来访 → 创建任务 → 影子分身自动领取 → 本地执行 → 结果返回
```

1. **创建任务**：协作者在看板中创建任务，描述需要解决的问题或需求
2. **影子领取**：Claude Code（影子分身）自动接收待处理任务
3. **本地执行**：影子分身在本地环境中执行代码、搜索、分析
4. **结果返回**：执行结果自动同步到看板，协作者可查看进度和结果

### 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        ShadowMe 看板系统                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────┐   │
│  │   前端界面   │───▶│   API 路由   │───▶│  SQLite 数据库   │   │
│  │  (Next.js)   │    │  (REST API)  │    │  (任务/消息/状态) │   │
│  └──────────────┘    └──────────────┘    └──────────────────┘   │
│         │                   │                                    │
│         │                   ▼                                    │
│         │          ┌──────────────────┐                          │
│         │          │  Claude Code    │                          │
│         │          │   (影子分身)      │                          │
│         │          └──────────────────┘                          │
│         │                   │                                    │
│         │                   ▼                                    │
│         │          ┌──────────────────┐                          │
│         └─────────▶│  CC Sync Log    │◀──── 实时消息推送        │
│                    │   (终端风格)       │                          │
│                    └──────────────────┘                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 部署指南

ShadowMe 由三个部分组成：**网页管理端（前端 + API）**、**后台服务**、**Claude Code 插件**。以下分别说明部署方式。

### 环境要求

| 依赖 | 最低版本 | 说明 |
|------|---------|------|
| Node.js | >= 20.0.0 | 推荐 LTS 版本 |
| npm | >= 9.0.0 | 随 Node.js 安装 |
| Git | >= 2.0 | 克隆仓库 |

### 一、网页管理端部署

网页管理端基于 Next.js，包含前端界面和所有 API 路由，是一个全栈应用。

#### 1. 克隆项目

```bash
git clone https://github.com/xiaopengs/ShadowMe.git
cd ShadowMe
```

#### 2. 安装依赖

```bash
npm install
```

> 项目使用 sql.js（纯 JavaScript/WASM SQLite），无需安装 C++ 编译工具链，Windows/macOS/Linux 均可直接安装。

#### 3. 配置环境变量

```bash
cp .env.example .env.local
```

编辑 `.env.local`，必填项：

```env
# 数据库路径（默认 ./data/ShadowMe.db）
DATABASE_PATH=./data/ShadowMe.db

# API 密钥 - 用于 Webhook 认证和插件连接
# 生成方式: openssl rand -hex 32
CC_WEBHOOK_API_KEY=your-secure-api-key

# SSE 实时推送（默认开启）
SSE_ENABLED=true
```

可选配置（GitLab 集成）：

```env
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_PROJECT_ID=12345
```

完整配置项参见 [环境变量说明](#环境变量完整配置)。

#### 4. 初始化数据库

```bash
npm run db:init
```

该命令会创建 `data/ShadowMe.db` 文件，建表并插入示例数据。

#### 5. 启动服务

**开发模式：**

```bash
npm run dev
```

访问 http://localhost:3000 查看应用。

**生产模式：**

```bash
npm run build
npm start
```

默认监听 3000 端口，可通过以下方式修改：

```bash
PORT=8080 npm start
```

#### 6. 局域网/外网访问

开发模式默认绑定所有网络接口，局域网内其他设备可直接访问：

```
http://<你的IP>:3000
```

生产模式如需外网访问，推荐使用 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name shadow.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

> **注意**：SSE 实时推送需要 Nginx 关闭响应缓冲，上述配置中 `proxy_http_version 1.1` 和 `Connection "upgrade"` 已处理。

#### 7. 使用 PM2 守护进程（推荐生产环境）

```bash
npm install -g pm2

# 启动
pm2 start npm --name "shadowme" -- start

# 开机自启
pm2 save
pm2 startup
```

### 二、后台服务说明

ShadowMe 的后台逻辑集成在 Next.js API 路由中，**无需单独部署后台服务**。以下说明后台核心模块：

| 模块 | 路径 | 说明 |
|------|------|------|
| 任务 API | `src/app/api/tasks/` | 任务 CRUD、领取、完成 |
| 消息 API | `src/app/api/tasks/[id]/messages/` | 任务消息收发 |
| 影子状态 | `src/app/api/shadow/status/` | 影子分身状态管理 |
| Webhook | `src/app/api/webhook/cc/` | 接收 Claude Code 回调 |
| SSE 推送 | `src/app/api/sse/` | 实时事件流 |
| 看板统计 | `src/app/api/board/stats/` | 看板数据聚合 |
| GitLab 代理 | `src/app/api/gitlab/` | GitLab API 代理 |
| 数据库 | `src/lib/db.ts` | sql.js 数据库操作层 |

#### 数据库

- 使用 **sql.js**（SQLite 的 WASM 版本），数据文件存储在 `data/ShadowMe.db`
- 每次写入操作后自动持久化到磁盘
- 数据库表结构：`tasks`、`shadow_status`、`task_messages`、`logs`、`config`

#### 实时推送（SSE）

SSE 默认开启，客户端连接 `/api/sse` 即可接收实时事件：

```
event: task_created
data: {"id":"task-xxx","title":"新任务",...}

event: task_updated
data: {"id":"task-xxx","status":"in_progress",...}
```

配置项：

```env
SSE_ENABLED=true
SSE_HEARTBEAT_INTERVAL=30
SSE_CONNECTION_TIMEOUT=300
```

### 三、Claude Code 插件安装与使用

插件位于 `plugins/ShadowMe-plugin/`，负责连接 Claude Code 和看板系统，实现任务监听、领取、执行和结果回传。

#### 1. 安装插件

```bash
cd plugins/ShadowMe-plugin
npm install
```

#### 2. 配置插件

```bash
cp .env.example .env
```

编辑 `.env`：

```env
# 看板地址 - 填写网页管理端的访问地址
SHADOW_BOARD_URL=http://localhost:3000

# GitLab 配置（可选，用于自动创建 MR）
GITLAB_URL=https://gitlab.example.com
GITLAB_TOKEN=glpat-xxxxxxxxxxxx
GITLAB_DEFAULT_PROJECT=12345

# 工作目录 - Claude Code 执行任务的工作路径
WORKING_DIRECTORY=/home/user/projects
```

#### 3. 编译插件

```bash
npm run build
```

编译输出到 `dist/` 目录。

#### 4. 运行插件

**开发模式：**

```bash
npm run dev
```

**生产模式：**

```bash
node dist/index.js
```

#### 5. CLI 命令

插件启动后，可通过以下命令与看板交互：

| 命令 | 说明 |
|------|------|
| `/shadow help` | 显示帮助信息 |
| `/shadow status` | 查看连接状态和任务统计 |
| `/shadow tasks` | 列出待处理任务 |
| `/shadow take <id>` | 领取指定任务 |
| `/shadow info <id>` | 查看任务详情 |
| `/shadow complete <id>` | 完成任务并提交结果 |

#### 6. 编程接口

插件也可作为 Node.js 模块集成到你的代码中：

```typescript
import ShadowClonePlugin from 'ShadowMe-plugin';

const plugin = new ShadowClonePlugin({
  boardUrl: 'http://localhost:3000',
  autoTakeTasks: true,
  pollingInterval: 10000,
});

await plugin.initialize();

// 监听事件
plugin.on('task:pending', (task) => {
  console.log('新任务:', task.title);
});

plugin.on('task:taken', (task) => {
  console.log('已领取:', task.title);
});

plugin.on('task:completed', (task) => {
  console.log('已完成:', task.title);
});

// 手动操作
const tasks = await plugin.getTasks('pending');
await plugin.takeTask('task-id');
await plugin.completeTask('task-id', {
  type: 'merge_request',
  summary: '代码审查完成',
  url: 'https://gitlab.com/...',
});

// GitLab 集成
await plugin.createGitLabMR(projectId, 'feature-branch', 'main', 'MR 标题', 'MR 描述');

// 销毁
plugin.destroy();
```

#### 7. 插件工作流程

```
启动插件 → WebSocket 连接看板 → 心跳保持
                │
                ▼
        轮询待处理任务 ──→ 发现新任务
                │              │
                ▼              ▼
        自动领取(autoTake)   手动 /shadow take
                │              │
                ▼              ▼
          执行任务 ──────────→ /shadow complete
                │
                ▼
         结果回传看板（MR链接/文档/摘要）
```

---

## 环境变量完整配置

### 服务端变量（不暴露到浏览器）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_PATH` | SQLite 数据库文件路径 | `./data/ShadowMe.db` |
| `CC_WEBHOOK_API_KEY` | Webhook API 认证密钥 | 空 |
| `CC_API_KEY` | API 密钥（兼容旧配置） | 空 |
| `GITLAB_URL` | GitLab 服务器地址 | - |
| `GITLAB_TOKEN` | GitLab Access Token | - |
| `GITLAB_PROJECT_ID` | GitLab 项目 ID | - |
| `SSE_ENABLED` | 启用 SSE 实时推送 | `true` |
| `SSE_HEARTBEAT_INTERVAL` | SSE 心跳间隔（秒） | `30` |
| `SSE_CONNECTION_TIMEOUT` | SSE 连接超时（秒） | `300` |
| `CC_SYNC_INTERVAL` | CC 同步间隔（毫秒） | `30000` |
| `MESSAGE_POLL_INTERVAL` | 消息轮询间隔（毫秒） | `5000` |
| `SHADOW_AUTO_TAKE` | 影子自动领取任务 | `false` |

### 客户端变量（NEXT_PUBLIC_ 前缀，暴露到浏览器）

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `NEXT_PUBLIC_GITLAB_URL` | 设置页 GitLab 地址 | `https://gitlab.example.com` |
| `NEXT_PUBLIC_GITLAB_TOKEN` | 设置页 GitLab Token | - |
| `NEXT_PUBLIC_LOCAL_ENDPOINT` | 本地端点地址 | `http://localhost:8080/v1` |
| `NEXT_PUBLIC_GREETING_PROTOCOL` | 问候协议 | `concise` |
| `NEXT_PUBLIC_RESPONSE_VERBOSITY` | 响应详细度 (0-100) | `50` |
| `NEXT_PUBLIC_AUTO_CONTEXT_INJECTION` | 自动上下文注入 | `true` |
| `NEXT_PUBLIC_WORKING_DIRECTORY` | 工作目录 | `/home/user/projects` |
| `NEXT_PUBLIC_AUTO_SYNC_CHANGES` | 自动同步变更 | `false` |

---

## 功能特性

### 🎨 Sahara 主题

采用沙漠暖调设计风格，米黄色调温馨自然，为长时间工作提供舒适的视觉体验。

### 📋 协作看板

- **列视图**：pending → in_progress → completed → closed
- **任务卡片**：展示类型、优先级、描述、标签等信息
- **实时统计**：看板顶部显示各状态任务数量

### 💬 CC Sync Log

终端风格的通信组件，实现与影子分身的实时交互：

- 命令行界面设计，支持打字机效果
- 支持用户消息、Claude 响应、系统通知三种消息类型
- 自动滚动和消息时间戳

### 🔔 实时消息推送

- **SSE（Server-Sent Events）**：服务器主动推送更新
- **轮询降级**：不支持 SSE 时自动切换到轮询模式
- **即时通知**：任务状态变更、消息到达等实时提醒

### 🔗 GitLab 集成

- MR 链接解析和展示
- 分支信息关联
- 提交记录追踪

### 📱 响应式设计

- 桌面端：完整侧边栏布局
- 移动端：底部导航栏
- 自适应卡片和列表视图

---

## API 文档

### 任务接口

#### 获取任务列表

```
GET /api/tasks
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| status | string | 按状态筛选，支持逗号分隔多个值 |
| type | string | 按类型筛选 |
| priority | string | 按优先级筛选 |

**响应示例：**

```json
{
  "tasks": [
    {
      "id": "uuid",
      "title": "修复登录问题",
      "type": "technical_issue",
      "priority": "high",
      "status": "pending",
      "description": "用户反馈登录失败",
      "tags": ["bug", "urgent"],
      "attachments": [],
      "createdBy": "访客",
      "createdAt": "2024-01-01T12:00:00Z",
      "updatedAt": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1
}
```

#### 创建任务

```
POST /api/tasks
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | ✅ | 任务标题 |
| type | string | ❌ | 类型：technical_issue / design_doc / code_review / other |
| priority | string | ❌ | 优先级：low / medium / high / urgent |
| description | string | ❌ | 任务描述 |
| tags | string[] | ❌ | 标签列表 |
| attachments | object[] | ❌ | 附件列表 |
| expectedDelivery | string | ❌ | 预期交付时间 |
| dueDate | string | ❌ | 截止日期 |
| createdBy | string | ❌ | 创建者 |

**响应：** 返回创建的任务对象，状态码 201

#### 获取任务详情

```
GET /api/tasks/[id]
```

**响应：** 返回任务对象，状态码 404 表示任务不存在

#### 更新任务

```
PATCH /api/tasks/[id]
```

**请求体：** 支持所有任务字段的部分更新

**响应：** 返回更新后的任务对象

#### 删除任务

```
DELETE /api/tasks/[id]
```

**响应：**

```json
{
  "success": true
}
```

#### 领取任务

```
POST /api/tasks/[id]/take
```

**响应：** 返回更新后的任务对象（状态变为 in_progress）

#### 完成任务

```
POST /api/tasks/[id]/complete
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| result | object | ✅ | 完成结果 |
| result.type | string | ✅ | 结果类型 |
| result.summary | string | ✅ | 结果摘要 |
| result.url | string | ❌ | 相关链接（MR 等） |

### 消息接口

#### 获取任务消息

```
GET /api/tasks/[id]/messages
```

**响应示例：**

```json
{
  "messages": [
    {
      "id": "uuid",
      "taskId": "task-uuid",
      "type": "user",
      "content": "请帮我处理这个问题",
      "createdAt": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1
}
```

#### 发送消息

```
POST /api/tasks/[id]/messages
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| content | string | ✅ | 消息内容 |
| type | string | ❌ | 消息类型：user / system / claude |

**响应：** 返回创建的消息对象

### 影子状态接口

#### 获取状态

```
GET /api/shadow/status
```

**响应示例：**

```json
{
  "id": "shadow-1",
  "name": "影子分身",
  "status": "online",
  "currentTaskId": "task-uuid",
  "currentTask": { ... },
  "lastHeartbeat": "2024-01-01T12:00:00Z",
  "capabilities": ["代码审查", "方案设计"],
  "autoTakeTasks": false
}
```

#### 更新状态

```
POST /api/shadow/status
```

**请求体：**

| 字段 | 类型 | 说明 |
|------|------|------|
| status | string | online / busy / offline / unknown |
| capabilities | string[] | 能力列表 |
| autoTakeTasks | boolean | 是否自动领取任务 |

### Webhook 接口

```
POST /api/webhook/cc
```

接收 Claude Code 插件回调，需携带 API Key 认证：

```bash
curl -X POST http://localhost:3000/api/webhook/cc \
  -H "Authorization: Bearer your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"type": "message", "taskId": "...", "content": "..."}'
```

### 任务生命周期

```
pending → in_progress → completed → needs_feedback → closed
  │           │              │            │
  │           ▼              ▼            ▼
  └───── 影子领取       提交结果      确认反馈
```

---

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| **框架** | Next.js 16 (App Router) | React 全栈框架 |
| **语言** | TypeScript | 类型安全 |
| **数据库** | sql.js (SQLite WASM) | 纯 JS，无需编译，跨平台 |
| **样式** | Tailwind CSS 4 | 原子化 CSS |
| **动画** | Framer Motion | React 动画库 |
| **图标** | Lucide React | 开源图标库 |
| **校验** | Zod | 运行时类型校验 |

---

## 项目结构

```
ShadowMe/
├── public/                  # 静态资源
├── scripts/
│   └── init-db.js          # 数据库初始化脚本
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API 路由
│   │   │   ├── board/      # 看板统计 API
│   │   │   ├── gitlab/     # GitLab 集成 API
│   │   │   ├── shadow/     # 影子状态 API
│   │   │   ├── sse/        # SSE 实时推送
│   │   │   ├── tasks/      # 任务 API
│   │   │   └── webhook/    # Webhook 接收
│   │   ├── archive/        # 归档页面
│   │   ├── settings/       # 设置页面
│   │   ├── tasks/          # 任务页面
│   │   └── page.tsx        # 首页（看板）
│   ├── components/         # React 组件
│   │   ├── board/          # 看板组件
│   │   ├── layout/         # 布局组件
│   │   ├── tasks/          # 任务组件
│   │   ├── sync/           # 同步组件
│   │   └── ui/             # 通用 UI 组件
│   ├── context/            # React Context
│   ├── lib/                # 工具库
│   │   ├── db.ts           # 数据库操作层 (sql.js)
│   │   ├── cc-protocol.ts  # CC 通信协议
│   │   ├── task-lifecycle.ts # 任务生命周期
│   │   └── logger.ts       # 日志工具
│   └── types/              # TypeScript 类型
├── plugins/
│   └── ShadowMe-plugin/    # Claude Code 插件
│       ├── src/
│       │   ├── index.ts    # 插件主入口
│       │   ├── commands.ts # CLI 命令
│       │   └── types/      # 类型定义
│       ├── .env.example    # 插件环境变量
│       └── package.json
├── data/                   # 数据目录（运行时生成）
│   └── ShadowMe.db        # SQLite 数据库文件
├── .env.example            # 环境变量示例
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 开发指南

### 运行测试

```bash
npm test

npm test -- tasks.test.ts

npm test -- --watch
```

### 代码规范

```bash
npm run lint

npx tsc --noEmit
```

### 构建生产版本

```bash
npm run build
npm start
```

---

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

---

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

## 致谢

- [Next.js](https://nextjs.org/) - React 框架
- [Tailwind CSS](https://tailwindcss.com/) - CSS 框架
- [Framer Motion](https://www.framer.com/motion/) - 动画库
- [Lucide](https://lucide.dev/) - 图标库
- [sql.js](https://sql.js.org/) - SQLite WASM 驱动
