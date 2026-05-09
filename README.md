# ShadowMe

<div align="center">

![ShadowMe Logo](https://img.shields.io/badge/Shadow%20Clone-影子分身-29C16A?style=for-the-badge&logo=ghost&logoColor=white)

### 当主角不在时，影子替他战斗

---

> **"ShadowMe 是一个智能化的个人影子分身协作系统。核心价值在于：当项目负责人不在或忙碌时，协作方可以通过这个看板提交任务需求，影子分身（基于 Claude Code）会自动接收任务、在本地工作目录执行、并将结果返回给看板，形成一个闭环的自动化协作流程。"**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Claude Code](https://img.shields.io/badge/Claude%20Code-FF6B35?style=flat&logo=anthropic&logoColor=white)](https://claude.ai/code)

</div>

---

## ✨ 核心特性

| 特性 | 描述 |
|------|------|
| 🤖 **智能影子分身** | 基于 Claude Code 的 AI 助手，24/7 待命 |
| 📋 **协作看板** | 直观的 Kanban 风格任务管理 |
| ⚡ **自动执行** | 任务直达 Claude Code，结果自动返回 |
| 🔗 **GitLab 集成** | 代码 MR、文档提交自动化 |
| 🔒 **本地部署** | 数据本地存储，安全可控 |
| 🎨 **大师级 UI** | 现代化玻璃态设计，流畅动效 |

---

## 🚀 安装与运行

### 环境要求

| 要求 | 版本 | 说明 |
|------|------|------|
| Node.js | >= 20.0.0 | 推荐使用 LTS 版本 |
| npm | >= 10.0.0 | 或使用 yarn/pnpm |
| 数据库 | SQLite | 自动创建，无需安装 |

### 安装步骤

```bash
# 1. 克隆项目
git clone https://github.com/yourusername/ShadowMe.git
cd ShadowMe

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

访问 `http://localhost:3000` 打开看板。

### 构建生产版本

```bash
# 1. 构建项目
npm run build

# 2. 启动生产服务器
npm start

# 或使用自定义端口
PORT=8080 npm start
```

### 内网部署

允许内网其他机器访问：

```bash
# 开发模式（所有网卡）
npm run dev -- -H 0.0.0.0

# 生产模式
HOST=0.0.0.0 npm start
```

其他机器访问：`http://<your-ip>:3000`

---

## ⚙️ 配置指南

### 环境变量配置

创建 `.env.local` 文件（可选，会使用默认值）：

```env
# ============ 看板服务配置 ============
# 基础路径，默认为 /
NEXT_PUBLIC_BASE_PATH=/

# ============ GitLab 集成配置（可选）===========
# GitLab 服务器地址
GITLAB_URL=https://gitlab.com

# GitLab Personal Access Token
GITLAB_TOKEN=glpat-xxxxxxxxxxxxxxxxxxxx

# 默认项目 ID 或路径
GITLAB_DEFAULT_PROJECT=namespace/project

# ============ Claude Code 插件配置 ============
# 看板 API 地址
SHADOW_BOARD_URL=http://localhost:3000

# Claude Code 工作目录
WORKING_DIRECTORY=/path/to/your/work
```

### GitLab 集成配置

1. **创建 Personal Access Token**
   - 登录 GitLab → Settings → Access Tokens
   - 创建 Token，勾选权限：`api`、`read_repository`、`write_repository`

2. **配置 Token**
   - 方式一：在 `.env.local` 中配置
   - 方式二：在 Web 界面设置页配置

3. **验证连接**
   - 访问 `/settings` → GitLab 标签页
   - 填写配置后保存

### Claude Code 插件配置

```bash
# 进入插件目录
cd plugins/ShadowMe-plugin

# 安装插件依赖
npm install

# 复制配置模板
cp .env.example .env

# 编辑配置
vim .env
```

插件配置项：

| 变量 | 必填 | 说明 | 示例 |
|------|------|------|------|
| `SHADOW_BOARD_URL` | 是 | 看板地址 | `http://localhost:3000` |
| `GITLAB_URL` | 否 | GitLab 地址 | `https://gitlab.com` |
| `GITLAB_TOKEN` | 否 | GitLab Token | `glpat-xxx` |
| `GITLAB_DEFAULT_PROJECT` | 否 | 默认项目 | `mygroup/myproject` |
| `WORKING_DIRECTORY` | 否 | 工作目录 | `/home/user/projects` |

---

## 🎯 工作原理

```
┌─────────────────────────────────────────────────────────────────────┐
│                           用户访问层                                  │
│                        (浏览器 / 协作方)                              │
└─────────────────────────────┬───────────────────────────────────────┘
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js 应用层                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌─────────────────────────┐ │
│  │   协作看板    │  │   任务管理    │  │    影子分身状态监控     │ │
│  └───────────────┘  └───────────────┘  └─────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   SQLite DB   │    │  WebSocket   │    │  Claude Code  │
│   (本地存储)   │    │   (实时通知)  │    │   (任务执行)   │
└───────────────┘    └───────────────┘    └───────┬───────┘
                                                  │
                                                  ▼
                                          ┌───────────────┐
                                          │    GitLab     │
                                          │   (代码提交)   │
                                          └───────────────┘
```

### 任务流转

1. **创建任务** → 协作者在看板创建任务
2. **任务下发** → 任务通过 OpenKit 协议发送给 Claude Code
3. **自动执行** → Claude Code 在本地工作目录执行任务
4. **结果回传** → 执行结果（MR 链接、文档等）返回看板
5. **状态更新** → 任务卡片自动更新状态为"已完成"

---

## 📁 项目结构

```
ShadowMe/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   │   ├── tasks/         # 任务 CRUD
│   │   │   ├── board/         # 看板数据
│   │   │   ├── shadow/        # 影子分身状态
│   │   │   └── gitlab/        # GitLab 集成
│   │   ├── tasks/             # 任务列表页
│   │   ├── settings/          # 设置页
│   │   └── page.tsx           # 首页（看板）
│   ├── components/             # React 组件
│   │   ├── board/             # 看板组件
│   │   ├── tasks/             # 任务组件
│   │   ├── shadow/             # 影子分身组件
│   │   ├── layout/             # 布局组件
│   │   └── ui/                 # UI 基础组件
│   ├── context/               # React Context
│   ├── lib/                   # 工具库
│   └── types/                 # TypeScript 类型
├── plugins/
│   └── ShadowMe-plugin/   # Claude Code 插件
├── docs/                      # 文档
└── data/                      # SQLite 数据库（自动生成）
```

---

## 🎨 设计理念

### 设计语言

沿用 **moxt-demo** 的设计风格：

- **色彩系统**：主色 #29C16A（品牌绿）+ #0EA5E9（科技蓝）
- **玻璃态效果**：backdrop-filter blur + 透明边框
- **渐变文字**：多色渐变增加视觉层次
- **流畅动效**：Framer Motion 驱动的微交互

### 优先级标识

| 优先级 | 颜色 | 使用场景 |
|--------|------|----------|
| 🔴 紧急 | #EF4444 | 需要立即处理 |
| 🟠 高 | #F59E0B | 重要但不紧急 |
| 🔵 中 | #0EA5E9 | 普通任务 |
| ⚪ 低 | #6B7280 | 可以延后 |

### 任务类型

| 类型 | 图标 | 描述 |
|------|------|------|
| 技术问题 | 💻 | 代码调试、bug 修复 |
| 方案设计 | 📄 | 技术方案、架构设计 |
| 代码审查 | 💬 | Code Review |
| 其他 | 📌 | 其他类型任务 |

---

## 🔌 API 接口

### 任务管理

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/tasks` | 获取任务列表 |
| POST | `/api/tasks` | 创建任务 |
| GET | `/api/tasks/:id` | 获取任务详情 |
| PATCH | `/api/tasks/:id` | 更新任务 |
| DELETE | `/api/tasks/:id` | 删除任务 |
| POST | `/api/tasks/:id/take` | 领取任务 |
| POST | `/api/tasks/:id/complete` | 完成任务 |

### 影子分身

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | `/api/shadow/status` | 获取状态 |
| POST | `/api/shadow/status` | 更新状态 |

### GitLab

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | `/api/gitlab` | 执行 GitLab 操作 |

---

## 🛠️ Claude Code 插件

### 安装插件

```bash
cd plugins/ShadowMe-plugin
npm install
cp .env.example .env
vim .env  # 编辑配置
```

### 插件命令

```bash
/shadow help          # 显示帮助
/shadow status        # 查看状态
/shadow tasks         # 查看待处理任务
/shadow take <id>     # 领取任务
/shadow info <id>     # 查看任务详情
/shadow complete <id> # 完成任务
```

---

## 📊 使用场景

### 场景一：远程技术支持

> 小王需要主程序员张三的帮助解决一个技术问题，但张三正在开会

1. 小王访问 `http://zhangsan.local:3000`
2. 创建任务，填写问题描述
3. 影子分身自动领取并处理
4. GitLab 上创建 MR，小王收到通知

### 场景二：快速方案生成

> 产品经理需要快速生成一个技术方案文档

1. 创建"方案设计"类型任务
2. 填写需求背景和约束条件
3. 影子分身在本地生成方案
4. 方案文档自动提交到 GitLab

### 场景三：代码审查请求

> 团队成员需要帮忙 review 代码

1. 创建"代码审查"类型任务
2. 上传或粘贴代码
3. 影子分身进行深度审查
4. 审查报告生成并展示

---

## 🔒 安全说明

- ✅ 数据本地 SQLite 存储
- ✅ 参数化查询防 SQL 注入
- ✅ API 密钥环境变量存储
- ⚠️ 本地网络访问控制
- ⚠️ 建议配合内网防火墙

---

## 📝 常用命令

| 命令 | 说明 |
|------|------|
| `npm install` | 安装依赖 |
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行代码检查 |

---

## 📝 文档

- [需求规格说明书](docs/PRD.md)
- [架构设计文档](docs/ARCHITECTURE.md)
- [代码审查报告](docs/REVIEW-CODE.md)

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">

**Made with ❤️ by ShadowMe Team**

*"当主角不在时，影子替他战斗。"*

</div>
