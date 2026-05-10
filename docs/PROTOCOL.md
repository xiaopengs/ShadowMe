# ShadowMe 通信协议文档

本文档详细描述 ShadowMe 看板与 Claude Code 插件之间的通信协议和方式。

---

## 1. 通信架构总览

```
┌──────────────┐     HTTP REST      ┌──────────────┐     SSE/HTTP      ┌──────────────┐
│              │  ──────────────▶   │              │  ──────────────▶  │              │
│  网页管理端   │                    │   后台服务    │                   │  CC 插件     │
│  (Browser)   │  ◀────────────── │  (API Routes) │  ◀──────────────  │  (Plugin)    │
│              │     HTTP REST      │              │     HTTP POST     │              │
└──────────────┘                    └──────────────┘                   └──────────────┘
                                          │
                                          │ 读写
                                          ▼
                                    ┌──────────────┐
                                    │   SQLite     │
                                    │   (sql.js)   │
                                    └──────────────┘
```

---

## 2. 通信方式

### 2.1 HTTP REST API（主要方式）

所有数据操作通过 REST API 完成。

**请求格式：**
```
METHOD /api/path HTTP/1.1
Content-Type: application/json
x-cc-api-key: sm_xxxxxxxxxxxxxxxx
```

**响应格式：**
```json
{
  "tasks": [...],
  "success": true
}
```

**错误响应：**
```json
{
  "error": "Error message",
  "status": 400
}
```

### 2.2 SSE 实时推送

插件通过 SSE (Server-Sent Events) 接收看板的实时事件通知。

**连接方式：**
```
GET /api/sse?channels=task,shadow,stats
```

**事件格式：**
```
event: task
data: {"type":"task.created","task":{"id":"task-xxx","title":"..."}}

event: shadow
data: {"type":"shadow.status_changed","status":"online"}

event: stats
data: {"type":"stats.updated","pendingTasks":3}
```

### 2.3 Webhook 回调

插件通过 Webhook 向看板发送事件消息（进度、日志、完成等）。

**请求格式：**
```
POST /api/webhook/cc
Content-Type: application/json
x-cc-api-key: sm_xxxxxxxxxxxxxxxx
```

---

## 3. 认证方式

### 3.1 API Key 认证

所有需要认证的请求必须在 HTTP Header 中携带 API Key：

```
x-cc-api-key: sm_xxxxxxxxxxxxxxxx
```

### 3.2 API Key 生命周期

```
生成 → 存储（看板数据库） → 分发给插件 → 插件每次请求携带 → 看板验证
```

1. **生成**：在看板设置页面点击"生成新密钥"
2. **存储**：看板将 API Key 哈希后存入 SQLite
3. **分发**：用户手动复制到插件的 `.env` 文件
4. **使用**：插件每次 API 请求自动携带 `x-cc-api-key` Header
5. **验证**：看板收到请求后比对哈希值

### 3.3 开发模式

未配置 API Key 时，插件以"开发模式"运行，功能受限但基本可用。

---

## 4. 消息协议

### 4.1 CC → 看板（插件发送给看板）

#### task.assign — 领取任务

```json
{
  "type": "task.assign",
  "taskId": "task-1778412448938",
  "timestamp": "2026-05-10T10:30:00Z",
  "messageId": "assign-1705312500",
  "senderId": "shadow-1",
  "taskTitle": "代码重构：提取公共组件"
}
```

#### task.progress — 进度更新

```json
{
  "type": "task.progress",
  "taskId": "task-1778412448938",
  "timestamp": "2026-05-10T10:35:00Z",
  "messageId": "progress-1705312800",
  "senderId": "shadow-1",
  "progress": 50,
  "message": "正在重构核心模块"
}
```

#### task.complete — 任务完成

```json
{
  "type": "task.complete",
  "taskId": "task-1778412448938",
  "timestamp": "2026-05-10T11:30:00Z",
  "messageId": "complete-1705316400",
  "senderId": "shadow-1",
  "summary": "重构完成，提取了5个公共组件",
  "commitSha": "a1b2c3d4e5f6",
  "duration": "5400s"
}
```

#### task.error — 执行错误

```json
{
  "type": "task.error",
  "taskId": "task-1778412448938",
  "timestamp": "2026-05-10T10:40:00Z",
  "messageId": "error-1705313100",
  "senderId": "shadow-1",
  "error": "Module not found: ./utils",
  "stack": "Error: Module not found..."
}
```

#### log — 工作日志

```json
{
  "type": "log",
  "timestamp": "2026-05-10T10:35:00Z",
  "messageId": "log-1705312800",
  "senderId": "shadow-1",
  "taskId": "task-1778412448938",
  "content": "正在分析登录模块代码结构",
  "level": "info"
}
```

日志级别：`info` | `progress` | `warning` | `error`

#### sync.heartbeat — 心跳

```json
{
  "type": "sync.heartbeat",
  "timestamp": "2026-05-10T10:30:00Z",
  "senderId": "shadow-1",
  "status": "online"
}
```

#### git.commit — Git 提交

```json
{
  "type": "git.commit",
  "timestamp": "2026-05-10T11:00:00Z",
  "senderId": "shadow-1",
  "taskId": "task-1778412448938",
  "commitSha": "a1b2c3d4e5f6",
  "message": "refactor: extract shared components",
  "files": ["src/components/Button.tsx", "src/components/Input.tsx"]
}
```

#### git.mr_created — MR 创建

```json
{
  "type": "git.mr_created",
  "timestamp": "2026-05-10T11:30:00Z",
  "senderId": "shadow-1",
  "taskId": "task-1778412448938",
  "mrId": 42,
  "mrIid": 15,
  "url": "https://gitlab.com/project/-/merge_requests/15",
  "title": "[task-1778] Refactor: extract shared components"
}
```

### 4.2 看板 → CC（看板推送给插件）

#### task.created — 新任务创建

```json
{
  "type": "task.created",
  "task": {
    "id": "task-1778412448938",
    "title": "代码重构：提取公共组件",
    "type": "code_review",
    "priority": "high",
    "status": "pending",
    "description": "将重复代码提取为公共组件",
    "createdBy": "John D."
  }
}
```

#### task.cancel — 任务取消

```json
{
  "type": "task.cancel",
  "taskId": "task-1778412448938",
  "reason": "需求变更"
}
```

#### sync.status — 状态查询

```json
{
  "type": "sync.status",
  "requestId": "status-1705312500"
}
```

---

## 5. 任务状态机

```
                    ┌──────────┐
                    │ pending  │ ← 创建任务
                    └────┬─────┘
                         │ POST /api/tasks/:id/take
                         ▼
                    ┌──────────┐
              ┌─────│in_progress│
              │     └────┬─────┘
              │          │ POST /api/tasks/:id/complete
              │          ▼
              │     ┌──────────┐
              │     │completed │
              │     └────┬─────┘
              │          │ PATCH /api/tasks/:id
              │          ▼
              │     ┌──────────┐
              │     │  closed  │
              │     └──────────┘
              │
              │ PATCH /api/tasks/:id (退回)
              ▼
         回到 pending
```

| 状态 | 含义 | 可转换到 |
|------|------|---------|
| `pending` | 待领取 | `in_progress` |
| `in_progress` | 执行中 | `completed`, `pending` |
| `completed` | 已完成 | `closed` |
| `closed` | 已关闭 | — |

---

## 6. 完整通信时序

```
Browser          API Server         SQLite          SSE           CC Plugin
  │                  │                │              │               │
  │──POST /api/tasks─▶│──INSERT──────▶│              │               │
  │                  │◀─OK───────────│              │               │
  │◀─201 Created─────│              │              │               │
  │                  │              │──SSE event───▶│               │
  │                  │              │              │──task.created─▶│
  │                  │              │              │               │
  │                  │◀─────────────POST /tasks/:id/take───────────│
  │                  │──UPDATE──────▶│              │               │
  │                  │◀─OK───────────│              │               │
  │                  │───────────────SSE event─────▶│               │
  │                  │              │              │               │
  │                  │◀─────────────POST /webhook/cc───────────────│
  │                  │              │  (task.assign)│               │
  │                  │              │              │               │
  │                  │◀─────────────POST /webhook/cc───────────────│
  │                  │              │  (task.progress)│             │
  │                  │              │              │               │
  │                  │◀──POST /tasks/:id/complete──────────────────│
  │                  │──UPDATE──────▶│              │               │
  │                  │◀─────────────POST /webhook/cc───────────────│
  │                  │              │  (task.complete)│             │
  │◀─SSE updated─────│              │              │               │
  │                  │              │              │               │
```

---

## 7. 错误码

| HTTP 状态码 | 含义 | 处理建议 |
|------------|------|---------|
| 400 | 请求参数错误 | 检查请求体格式 |
| 401 | API Key 无效 | 重新生成 API Key |
| 403 | 权限不足 | 检查 API Key 权限 |
| 404 | 资源不存在 | 检查任务 ID |
| 409 | 状态冲突 | 任务已被领取或状态不允许 |
| 500 | 服务器错误 | 检查后台日志 |

---

## 8. 脚本退出码

| 退出码 | 含义 |
|--------|------|
| 0 | 成功 |
| 1 | 参数错误 |
| 2 | 配置缺失 |
| 3 | API 调用失败 |
| 4 | 认证失败 |
| 5 | 网络错误 |
