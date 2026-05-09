# ShadowMe 架构设计

## 1. 系统架构总览

```
┌──────────────────────────────────────────────────────────────────────┐
│                           用户访问层                                   │
│                  (浏览器 / 移动端 / 其他客户端)                        │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │ HTTPS / WebSocket
                                  ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          Next.js 应用层                               │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                    App Router (前端渲染)                        │ │
│  │   /                  首页/看板视图                              │ │
│  │   /tasks             任务列表页                                 │ │
│  │   /tasks/new         新建任务页                                 │ │
│  │   /tasks/[id]        任务详情页                                 │ │
│  │   /settings          设置页                                     │ │
│  └────────────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │                  API Routes (后端接口)                          │ │
│  │   /api/tasks           任务 CRUD                                │ │
│  │   /api/tasks/[id]      单个任务操作                              │ │
│  │   /api/board           看板数据                                 │ │
│  │   /api/shadow          影子分身状态                             │ │
│  │   /api/openkit/*       OpenKit 协议                             │ │
│  │   /api/gitlab/*        GitLab 集成                              │ │
│  │   /api/ws              WebSocket 升级                           │ │
│  └────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────┬────────────────────────────────────┘
                                  │
        ┌─────────────────────────┼─────────────────────────┐
        ▼                         ▼                         ▼
┌───────────────────┐   ┌───────────────────┐   ┌───────────────────┐
│    数据存储层      │   │    实时通信层      │   │   外部服务层       │
│                   │   │                   │   │                   │
│  SQLite 数据库     │   │  WebSocket Server  │   │   GitLab API      │
│  - tasks 表       │   │  - 任务状态推送    │   │   - MR 创建       │
│  - config 表      │   │  - 通知广播        │   │   - 代码提交      │
│  - users 表       │   │  - 心跳检测        │   │                   │
│  - logs 表        │   │                   │   │   Claude Code      │
│                   │   │                   │   │   - 本地插件       │
│  JSON 配置文件     │   │                   │   │   - 任务执行       │
│  - shadow.json    │   │                   │   │   - 结果回传       │
│  - gitlab.json    │   │                   │   │                   │
└───────────────────┘   └───────────────────┘   └───────────────────┘
```

## 2. 核心模块设计

### 2.1 任务模块 (Task Module)

```typescript
// 任务实体
interface Task {
  id: string;                    // UUID
  title: string;                 // 标题
  type: TaskType;                // 类型
  priority: Priority;            // 优先级
  status: TaskStatus;            // 状态
  description: string;            // 描述 (Markdown)
  tags: string[];                 // 技术栈标签
  attachments: Attachment[];     // 附件
  expectedDelivery: string;      // 期望交付物
  result: TaskResult | null;      // 结果
  createdBy: string;              // 创建者
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  dueDate: Date | null;
}

enum TaskType {
  TECHNICAL_ISSUE = 'technical_issue',    // 技术问题
  DESIGN_DOC = 'design_doc',              // 方案设计
  CODE_REVIEW = 'code_review',            // 代码审查
  OTHER = 'other'                         // 其他
}

enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

enum TaskStatus {
  PENDING = 'pending',           // 待领取
  IN_PROGRESS = 'in_progress',  // 处理中
  COMPLETED = 'completed',       // 已完成
  NEEDS_FEEDBACK = 'needs_feedback', // 需要反馈
  CLOSED = 'closed'             // 已关闭
}
```

### 2.2 OpenKit 协议层

```typescript
// OpenKit 消息格式
interface OpenKitMessage {
  protocol: 'openkit/1.0';
  type: MessageType;
  payload: any;
  timestamp: number;
  signature?: string;  // 可选的签名验证
}

enum MessageType {
  // 任务相关
  TASK_CREATED = 'task:created',
  TASK_UPDATED = 'task:updated',
  TASK_ASSIGNED = 'task:assigned',
  TASK_COMPLETED = 'task:completed',
  
  // 影子分身相关
  SHADOW_STATUS = 'shadow:status',
  SHADOW_HEARTBEAT = 'shadow:heartbeat',
  SHADOW_READY = 'shadow:ready',
  
  // 回调相关
  CALLBACK_RESULT = 'callback:result',
  CALLBACK_ERROR = 'callback:error'
}
```

### 2.3 影子分身模块 (Shadow Module)

```typescript
// 影子分身状态
interface ShadowState {
  id: string;
  name: string;
  status: ShadowStatus;
  currentTask: string | null;
  lastHeartbeat: Date;
  capabilities: Capability[];
  config: ShadowConfig;
}

enum ShadowStatus {
  ONLINE = 'online',
  BUSY = 'busy',
  OFFLINE = 'offline',
  UNKNOWN = 'unknown'
}

interface Capability {
  name: string;          // 能力名称
  description: string;  // 能力描述
  enabled: boolean;      // 是否启用
}

// 影子分身配置
interface ShadowConfig {
  autoTakeTasks: boolean;       // 自动领取任务
  maxConcurrentTasks: number;   // 最大并发任务数
  workingDirectory: string;      // 工作目录
  gitlabConfig: GitLabConfig;   // GitLab 配置
  notificationConfig: NotificationConfig;  // 通知配置
}
```

### 2.4 GitLab 集成模块

```typescript
// GitLab 配置
interface GitLabConfig {
  url: string;
  token: string;
  defaultProjectId: number;
  repositoryMappings: RepositoryMapping[];
}

// 仓库映射
interface RepositoryMapping {
  localPath: string;     // 本地路径
  remoteUrl: string;      // GitLab URL
  branch: string;         // 默认分支
}

// GitLab 操作结果
interface GitLabResult {
  type: 'merge_request' | 'commit' | 'document';
  url: string;
  id: number | string;
  title: string;
  description?: string;
  sha?: string;
}
```

## 3. 数据库设计

### 3.1 数据库概览

使用 SQLite 作为本地数据库，适合单机器部署场景。

### 3.2 表结构

```sql
-- 任务表
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('technical_issue', 'design_doc', 'code_review', 'other')),
  priority TEXT NOT NULL CHECK(priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in_progress', 'completed', 'needs_feedback', 'closed')),
  description TEXT,
  tags TEXT,  -- JSON array
  attachments TEXT,  -- JSON array
  expected_delivery TEXT,
  result TEXT,  -- JSON object
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  started_at DATETIME,
  completed_at DATETIME,
  due_date DATETIME
);

-- 影子分身状态表
CREATE TABLE shadow_status (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'offline',
  current_task_id TEXT,
  last_heartbeat DATETIME,
  capabilities TEXT,  -- JSON array
  config TEXT,  -- JSON object
  FOREIGN KEY (current_task_id) REFERENCES tasks(id)
);

-- 操作日志表
CREATE TABLE logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT,
  action TEXT NOT NULL,
  actor TEXT,
  details TEXT,  -- JSON object
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 配置表
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value TEXT,  -- JSON object
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 索引
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_created_at ON tasks(created_at);
CREATE INDEX idx_tasks_priority ON tasks(priority);
CREATE INDEX idx_logs_task_id ON logs(task_id);
```

## 4. API 设计

### 4.1 任务 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/tasks | 获取任务列表（支持筛选） |
| POST | /api/tasks | 创建新任务 |
| GET | /api/tasks/:id | 获取单个任务详情 |
| PATCH | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 删除任务 |
| POST | /api/tasks/:id/take | 领取任务 |
| POST | /api/tasks/:id/complete | 完成任务 |
| POST | /api/tasks/:id/close | 关闭任务 |

### 4.2 看板 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/board | 获取看板数据 |
| GET | /api/board/stats | 获取统计数据 |

### 4.3 影子分身 API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/shadow/status | 获取影子分身状态 |
| POST | /api/shadow/config | 更新配置 |
| POST | /api/shadow/start | 启动影子分身 |
| POST | /api/shadow/stop | 停止影子分身 |

### 4.4 OpenKit API

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/openkit/publish | 发布消息 |
| POST | /api/openkit/subscribe | 订阅消息 |
| POST | /api/openkit/callback | 接收回调 |

### 4.5 GitLab API

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/gitlab/projects | 获取项目列表 |
| POST | /api/gitlab/mr | 创建 Merge Request |
| POST | /api/gitlab/commit | 提交代码 |

## 5. WebSocket 协议

### 5.1 连接建立

```javascript
// 客户端连接
const ws = new WebSocket('ws://localhost:3000/api/ws');

// 连接认证（可选）
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'optional-token'
  }));
};
```

### 5.2 消息格式

```typescript
// 服务器推送消息
interface WSMessage {
  event: string;      // 事件类型
  data: any;          // 消息数据
  timestamp: number;  // 时间戳
}

// 事件类型
const WSEvents = {
  TASK_CREATED: 'task:created',
  TASK_UPDATED: 'task:updated',
  TASK_DELETED: 'task:deleted',
  SHADOW_STATUS_CHANGED: 'shadow:status_changed',
  NOTIFICATION: 'notification'
};
```

## 6. Claude Code 插件设计

### 6.1 插件结构

```
ShadowMe-plugin/
├── src/
│   ├── index.ts          # 插件入口
│   ├── commands/         # 命令处理
│   │   ├── shadow.ts     # /shadow 命令族
│   │   ├── task.ts       # 任务相关命令
│   │   └── gitlab.ts     # GitLab 命令
│   ├── handlers/         # 事件处理
│   │   ├── taskHandler.ts
│   │   └── webhookHandler.ts
│   ├── services/         # 服务层
│   │   ├── apiService.ts
│   │   ├── gitlabService.ts
│   │   └── cacheService.ts
│   ├── types/           # 类型定义
│   │   └── index.ts
│   └── utils/           # 工具函数
│       └── logger.ts
├── package.json
└── README.md
```

### 6.2 核心流程

```
1. 启动时
   ├── 连接 WebSocket 到看板服务器
   ├── 注册 /shadow 命令
   └── 发送 READY 消息

2. 任务监听循环
   ├── 定时拉取 /api/tasks?status=pending
   ├── 检测新任务
   └── 触发通知

3. 任务执行
   ├── 领取任务 (POST /api/tasks/:id/take)
   ├── 分析任务需求
   ├── 在本地工作目录执行
   ├── 生成结果文档 (Markdown)
   ├── 提交到 GitLab
   └── 完成回调 (POST /api/openkit/callback)

4. 心跳保持
   ├── 每 30 秒发送心跳
   └── 断线重连机制
```

## 7. 部署架构

### 7.1 本地开发部署

```
┌─────────────────────────────────────────────────────────┐
│                    开发机器                               │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │   Browser    │◄──►│  Next.js     │                  │
│  │              │    │  (Port 3000) │                  │
│  └──────────────┘    └──────┬───────┘                  │
│                             │                           │
│                    ┌─────────┼─────────┐                │
│                    ▼         ▼         ▼                │
│              ┌────────┐ ┌────────┐ ┌────────┐          │
│              │ SQLite │ │  WS    │ │Claude  │          │
│              │  DB    │ │ Server │ │ Code   │          │
│              └────────┘ └────────┘ └───┬────┘          │
│                                        │                │
│                                        ▼                │
│                                   ┌────────┐           │
│                                   │ GitLab │           │
│                                   │ Server │           │
│                                   └────────┘           │
└─────────────────────────────────────────────────────────┘
```

### 7.2 内网访问配置

```
# 启动命令
npm run dev -- -H 0.0.0.0

# 或使用自定义端口
PORT=8080 npm run dev

# 内网其他机器访问
http://<your-ip>:3000
```

### 7.3 反向代理配置 (Nginx)

```nginx
server {
    listen 80;
    server_name shadow.local;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 8. 安全考虑

### 8.1 网络安全
- 本地部署，无外网暴露
- 同一内网用户可访问
- 可选：添加 Basic Auth

### 8.2 数据安全
- SQLite 数据库本地存储
- GitLab Token 加密存储（环境变量）
- 用户输入 XSS 防护

### 8.3 Claude Code 安全
- 仅执行已审核的任务
- 工作目录隔离
- 操作日志完整记录

---

**文档版本**：v1.0.0
**最后更新**：2025-05-09
