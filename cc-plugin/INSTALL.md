# ShadowMe Claude Code Plugin 安装指南

## 前置条件

### 1. Claude Code CLI 已安装

确保 Claude Code CLI 已安装并可用：

```bash
# 检查 Claude Code 是否已安装
which claude

# 如果未安装，使用 npm 安装
npm install -g @anthropic-ai/claude-code

# 验证安装
claude --version
```

### 2. 基础依赖

```bash
# jq (JSON 处理工具)
# macOS
brew install jq
# Ubuntu/Debian
sudo apt-get install jq
# 验证
jq --version
```

### 3. ShadowMe 服务

确保 ShadowMe 看板服务已启动，并记录：
- 服务器地址（如：`https://shadowme.mycompany.com`）
- API Key（在看板设置页面获取）

## 安装方式

### 方式一：从源码安装（推荐）

```bash
# 克隆 ShadowMe 项目
git clone https://github.com/xiaopengs/ShadowMe.git
cd ShadowMe

# 安装插件
cc --plugin-install ./cc-plugin

# 验证插件已安装
cc --plugin-list
```

### 方式二：全局安装

```bash
# 创建全局插件目录
mkdir -p ~/.claude/plugins

# 复制插件到全局目录
cp -r ./cc-plugin ~/.claude/plugins/shadowme

# 链接到工作目录
ln -s ~/.claude/plugins/shadowme ./cc-plugin
```

### 方式三：符号链接（开发模式）

```bash
# 在工作目录创建符号链接
ln -s /path/to/ShadowMe/cc-plugin ./cc-plugin

# 或使用环境变量
export CLAUDE_PLUGIN_ROOT="/path/to/plugins"
```

## 配置步骤

### 1. 启动 ShadowMe 服务

确保 ShadowMe 后端服务已启动：

```bash
# 启动服务（根据实际部署方式）
docker-compose up -d
# 或
kubectl apply -f deployment.yaml
```

### 2. 获取 API Key

1. 登录 ShadowMe 看板
2. 进入「设置」→「API Keys」
3. 创建新的 API Key
4. 复制 Key（格式：`sk_live_xxxxxxxx`）

### 3. 配置连接

在 Claude Code 中执行：

```
/shadow-connect https://your-shadowme-server.com sk_live_xxxxxxxxxxxxx
```

配置将被保存到 `~/.shadowme/config`：

```bash
cat ~/.shadowme/config
# SHADOWME_URL="https://your-shadowme-server.com"
# SHADOWME_API_KEY="sk_live_xxxxxxxxxxxxx"
# SHADOWME_SHADOW_ID="shadow-001"
```

### 4. 验证连接

```bash
# 查看状态
/shadow-status

# 应该显示类似：
# ┌─────────────────────────────────────┐
# │  🔗 连接状态: 已连接                │
# │  🏠 服务器: https://shadowme.app   │
# │  👤 影子ID: shadow-001              │
# └─────────────────────────────────────┘
```

## 使用流程

### 首次使用

```bash
# 1. 拉取待领取任务
/shadow-poll

# 输出示例：
# 📋 ShadowMe 待领取任务 (共 3 个)
# ──────────────────────────────────────
# [1] TASK-001 | 高 | 代码重构：提取公共组件
# [2] TASK-002 | 中 | 修复登录超时Bug
# [3] TASK-003 | 低 | 更新API文档

# 2. 领取任务
/shadow-take TASK-001

# 输出示例：
# ✅ 任务已领取：TASK-001
# 📝 标题：代码重构：提取公共组件
# 开始执行任务...

# 3. 执行任务过程中报告进度
/shadow-log 正在分析代码结构...
/shadow-log 进度 50%：开始提取公共组件

# 4. 完成任务
/shadow-done 重构完成，提取了5个公共组件
```

### 自动化使用

加载 shadow-worker agent 自动执行：

```
# 激活 shadow-worker
/use shadow-worker

# Agent 会自动：
# 1. 轮询新任务（每60秒）
# 2. 领取第一个待领取任务
# 3. 执行任务并上报进度
# 4. 完成后自动提交代码
# 5. 标记任务完成
# 6. 继续轮询下一个任务
```

## 常用命令

| 命令 | 说明 |
|------|------|
| `/shadow-connect <url> <key>` | 配置连接 |
| `/shadow-poll` | 拉取任务列表 |
| `/shadow-take <task-id>` | 领取任务 |
| `/shadow-status` | 查看状态 |
| `/shadow-log <message>` | 发送日志 |
| `/shadow-done <summary>` | 完成任务 |

## 故障排查

### 连接失败

```bash
# 检查配置
cat ~/.shadowme/config

# 测试 API 连接
curl -s https://your-server.com/api/tasks \
  -H "x-cc-api-key: your-key" | jq

# 重新配置
/shadow-connect https://your-server.com your-api-key
```

### 任务领取失败

- 确保任务状态为 `pending`
- 确保任务未被其他影子分身领取
- 检查 API Key 权限

### 脚本不可执行

```bash
# 设置脚本可执行权限
chmod +x cc-plugin/scripts/*.sh

# 验证
ls -la cc-plugin/scripts/
```

### 权限问题

```bash
# 确保配置目录存在
mkdir -p ~/.shadowme

# 设置合适权限
chmod 700 ~/.shadowme
chmod 600 ~/.shadowme/config
```

## 卸载

```bash
# 移除插件
cc --plugin-uninstall shadowme

# 或手动删除
rm -rf ~/.claude/plugins/shadowme
rm -rf ~/.shadowme
```

## 进阶配置

### 自动模式

在 `~/.shadowme/config` 中启用自动轮询：

```bash
SHADOWME_AUTO_POLL=true
SHADOWME_POLL_INTERVAL=30
```

### GitLab 集成

配置 GitLab 以自动创建 MR：

```bash
SHADOWME_GITLAB_URL="https://gitlab.com"
SHADOWME_GITLAB_TOKEN="glpat-xxxx"
SHADOWME_GITLAB_PROJECT="owner/repo"
```

### 定时心跳

使用 cron 定时发送心跳：

```bash
# 每5分钟发送心跳
*/5 * * * * /path/to/cc-plugin/scripts/heartbeat.sh
```

## 获取帮助

- 文档：https://github.com/xiaopengs/ShadowMe
- 问题反馈：https://github.com/xiaopengs/ShadowMe/issues
