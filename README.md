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

## 快速开始

### 环境要求

- Node.js >= 20.0.0
- npm / yarn / pnpm

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/xiaopengs/ShadowMe.git
cd ShadowMe

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入配置

# 初始化数据库
npm run db:init

# 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

### 环境变量配置

```env
# 数据库路径（可选，默认 ./data/ShadowMe.db）
DATABASE_PATH=./data/ShadowMe.db

# API 密钥（用于 Webhook 认证）
API_KEY=your-api-key-here

# GitLab 集成（可选）
GITLAB_TOKEN=your-gitlab-token
```

---

## 功能特性

### 🎨 8 套精美主题

| 主题 | 风格 | 特点 |
|------|------|------|
| **sahara** | 沙漠暖调 | 米黄色调，温馨自然 |
| **shadow-clone** | 暗夜神秘 | 深色系，荧光蓝点缀 |
| **geist-dark** | 极简暗色 | 纯黑底，高对比度 |
| **neon-tokyo** | 霓虹东京 | 赛博朋克，霓虹粉蓝 |
| **candy** | 糖果甜系 | 马卡龙色系，圆润可爱 |
| **glacier** | 冰川蓝调 | 冷色系，清新专业 |
| **lumina-tech** | 科技光效 | 渐变蓝紫，光影效果 |
| **alexandria** | 亚历山大 | 优雅深蓝，学术气质 |

### 📋 协作看板

- **拖拽操作**：通过拖拽调整任务状态和优先级
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
- 提交记录追踪（规划中）

### 📱 响应式设计

- 桌面端：完整侧边栏布局
- 移动端：底部导航栏
- 自适应卡片和列表视图

---

## CC 插件对接

ShadowMe 提供 Webhook 接口供 Claude Code 等工具对接，实现任务领取和状态同步。

### Webhook 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/webhook` | POST | 接收 CC 消息 |
| `/api/shadow/status` | GET/POST | 影子状态管理 |
| `/api/tasks/[id]/take` | POST | 领取任务 |
| `/api/tasks/[id]/complete` | POST | 完成任务 |

### 消息协议格式

```json
{
  "type": "message",
  "taskId": "task-uuid",
  "content": "执行状态或结果描述",
  "timestamp": "2024-01-01T12:00:00Z"
}
```

### API Key 认证

```bash
# 请求头携带 API Key
curl -X POST http://localhost:3000/api/webhook \
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

---

## 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| **框架** | Next.js 15 App Router | React 全栈框架 |
| **语言** | TypeScript | 类型安全 |
| **数据库** | SQLite (better-sqlite3) | 轻量级关系数据库 |
| **样式** | Tailwind CSS | 原子化 CSS |
| **动画** | Framer Motion | React 动画库 |
| **图标** | Lucide React | 开源图标库 |
| **拖拽** | @dnd-kit | React 拖拽库 |

---

## 项目结构

```
ShadowMe/
├── public/                  # 静态资源
├── scripts/                 # 脚本文件
│   └── init-db.js          # 数据库初始化
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/            # API 路由
│   │   │   ├── board/      # 看板统计 API
│   │   │   ├── gitlab/     # GitLab 集成 API
│   │   │   ├── shadow/     # 影子状态 API
│   │   │   ├── tasks/      # 任务 API
│   │   │   └── webhook/    # Webhook 接收
│   │   ├── archive/        # 归档页面
│   │   ├── settings/       # 设置页面
│   │   ├── tasks/          # 任务页面
│   │   └── page.tsx        # 首页（看板）
│   ├── components/         # React 组件
│   │   ├── board/          # 看板组件
│   │   │   ├── BoardColumn.tsx
│   │   │   ├── BoardStats.tsx
│   │   │   └── TaskCard.tsx
│   │   ├── layout/         # 布局组件
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── tasks/          # 任务组件
│   │   │   ├── TaskDetail.tsx
│   │   │   └── TaskForm.tsx
│   │   ├── sync/           # 同步组件
│   │   │   ├── CCSyncLog.tsx
│   │   │   └── SyncMessage.tsx
│   │   └── ui/             # 通用 UI 组件
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       └── Toast.tsx
│   ├── context/            # React Context
│   │   ├── ThemeContext.tsx
│   │   └── ToastContext.tsx
│   ├── lib/                 # 工具库
│   │   ├── db.ts           # 数据库操作
│   │   ├── logger.ts       # 日志工具
│   │   └── theme.ts        # 主题配置
│   └── types/              # TypeScript 类型
│       └── index.ts
├── __tests__/              # 测试文件
│   ├── api/                # API 测试
│   └── helpers/           # 测试辅助
├── .env.example            # 环境变量示例
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 开发指南

### 运行测试

```bash
# 运行所有测试
npm test

# 运行特定测试文件
npm test -- tasks.test.ts

# 监听模式
npm test -- --watch
```

### 代码规范

```bash
# 代码检查
npm run lint

# 类型检查
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
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) - SQLite 驱动
