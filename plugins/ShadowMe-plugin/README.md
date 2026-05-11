# ShadowMe 任务执行系统使用指南

本文档说明如何使用 ShadowMe 插件在 Claude Code 中执行任务。

## 快速开始

### 1. 配置环境变量

```bash
# 在 Claude Code 对话中设置
export SHADOW_BOARD_URL="http://localhost:3000"
export SHADOW_API_KEY="your-api-key-here"
```

或者创建配置文件 `~/.shadowme/config`:

```bash
mkdir -p ~/.shadowme
cat > ~/.shadowme/config << 'EOF'
SHADOW_BOARD_URL="http://localhost:3000"
SHADOW_API_KEY="sm_your_api_key_here"
EOF
```

### 2. 基本命令

```bash
# 进入插件目录
cd /workspace/ShadowMe/plugins/ShadowMe-plugin/scripts

# 查看帮助
./shadowme-tools.sh help

# 检查连接状态
./shadowme-tools.sh status

# 查看待处理任务
./shadowme-tools.sh tasks

# 领取任务
./shadowme-tools.sh take <task-id>

# 查看任务详情
./shadowme-tools.sh info <task-id>
```

### 3. 执行任务的完整流程

```bash
# 1. 查看待处理任务
./shadowme-tools.sh tasks

# 2. 领取任务
./shadowme-tools.sh take <task-id>

# 3. 查看任务详情，了解需要做什么
./shadowme-tools.sh info <task-id>

# 4. 分析任务并开始执行
# (这里是你实际的代码工作)

# 5. 报告进度
./shadowme-tools.sh progress <task-id> 25 "分析完成，开始实现"

# 6. 继续执行...
./shadowme-tools.sh progress <task-id> 50 "核心功能实现完成"

# 7. 提交代码
./shadowme-tools.sh commit <task-id> "feat: 实现XXX功能"

# 8. 继续报告进度
./shadowme-tools.sh progress <task-id> 75 "测试完成，准备提交"

# 9. 完成任务
./shadowme-tools.sh complete <task-id> "功能已实现，包含单元测试"
```

## 命令详解

### shadowme-tools.sh 命令

| 命令 | 参数 | 说明 |
|------|------|------|
| `help` | - | 显示帮助信息 |
| `status` | - | 检查连接状态 |
| `tasks` | [status] | 列出任务，默认 pending |
| `take` | \<taskId\> | 领取任务 |
| `info` | \<taskId\> | 查看任务详情 |
| `progress` | \<taskId\> \<0-100\> \<message\> | 报告进度 |
| `log` | \<taskId\> \<message\> [level] | 发送工作日志 |
| `complete` | \<taskId\> [summary] | 完成任务 |
| `commit` | \<taskId\> \<message\> [files...] | 提交代码 |
| `mr` | \<taskId\> \<title\> [source] [target] | 创建 MR |
| `heartbeat` | - | 发送心跳 |
| `start` | - | 启动自动执行模式 |

### shadowme-simple.sh 命令

简化版本，适合快速使用：

```bash
./shadowme-simple.sh tasks
./shadowme-simple.sh take <task-id>
./shadowme-simple.sh info <task-id>
./shadowme-simple.sh complete <task-id> "完成摘要"
```

## 任务类型处理

### 技术问题 (technical_issue)

1. **分析问题**：理解问题的根因和影响
2. **制定方案**：设计解决方案
3. **实施修复**：编写代码修复问题
4. **测试验证**：确保修复有效
5. **文档更新**：更新相关文档

```bash
# 示例
./shadowme-tools.sh take abc123
./shadowme-tools.sh progress abc123 20 "分析问题根因"
# ... 执行修复 ...
./shadowme-tools.sh progress abc123 60 "修复完成，开始测试"
./shadowme-tools.sh commit abc123 "fix: 修复XXX问题"
./shadowme-tools.sh complete abc123 "问题已修复并通过测试"
```

### 方案设计 (design_doc)

1. **理解需求**：明确业务需求和约束
2. **调研分析**：分析现有方案和最佳实践
3. **设计方案**：制定详细的设计方案
4. **文档编写**：撰写设计文档
5. **评审讨论**：与协作者讨论完善

```bash
# 示例
./shadowme-tools.sh take def456
./shadowme-tools.sh progress def456 30 "需求分析完成"
# ... 编写设计文档 ...
./shadowme-tools.sh commit def456 "docs: 添加XXX设计文档"
./shadowme-tools.sh complete def456 "设计方案已完成，包含架构图和API设计"
```

### 代码审查 (code_review)

1. **获取代码**：查看需要审查的代码
2. **全面审查**：检查代码质量、安全性、性能
3. **问题汇总**：整理发现的问题
4. **建议提出**：给出改进建议
5. **报告撰写**：撰写审查报告

```bash
# 示例
./shadowme-tools.sh take ghi789
./shadowme-tools.sh progress ghi789 40 "代码审查完成"
./shadowme-tools.sh log ghi789 "发现3个潜在的空指针问题" warn
./shadowme-tools.sh complete ghi789 "审查完成，发现10个问题已整理成报告"
```

## 协议消息

所有命令都会通过 Webhook 发送协议消息到看板：

### task.assign - 领取任务
```json
{
  "type": "task.assign",
  "taskId": "task-xxx",
  "taskTitle": "任务标题",
  "timestamp": "2026-05-10T12:00:00Z",
  "messageId": "assign-xxx",
  "senderId": "shadow-1"
}
```

### task.progress - 进度更新
```json
{
  "type": "task.progress",
  "taskId": "task-xxx",
  "progress": 50,
  "message": "正在实现核心功能",
  "timestamp": "2026-05-10T12:05:00Z",
  "messageId": "progress-xxx",
  "senderId": "shadow-1"
}
```

### task.complete - 任务完成
```json
{
  "type": "task.complete",
  "taskId": "task-xxx",
  "summary": "任务完成摘要",
  "timestamp": "2026-05-10T13:00:00Z",
  "messageId": "complete-xxx",
  "senderId": "shadow-1"
}
```

## 自动执行模式

### 后台执行器

启动后台任务监听和执行：

```bash
./shadow-executor.sh
```

这个脚本会：
- 每 30 秒检查一次待处理任务
- 自动领取新任务
- 执行任务并报告进度
- 完成任务并更新看板

### Claude Code Local Routine 集成

在 Claude Code 中配置定时任务：

```yaml
# .claude/routines/shadowme-task-check.yaml
trigger:
  type: schedule
  cron: "*/5 * * * *"  # 每5分钟检查一次

steps:
  - name: Check and execute tasks
    script: |
      cd /workspace/ShadowMe/plugins/ShadowMe-plugin/scripts
      ./shadowme-tools.sh start
```

## 最佳实践

### 1. 及时报告进度
- 每完成一个阶段就报告进度
- 不要等到任务结束才更新
- 遇到问题也要及时上报

### 2. 清晰的提交信息
```bash
# ❌ 不好
./shadowme-tools.sh commit abc123 "fix bug"

# ✅ 好
./shadowme-tools.sh commit abc123 "fix: 修复用户登录时密码验证失败的问题"
```

### 3. 完整的任务总结
```bash
./shadowme-tools.sh complete abc123 "完成了XXX功能
- 新增用户管理API
- 添加了权限验证
- 编写了单元测试
- 更新了API文档"
```

### 4. 处理错误情况
```bash
# 发现无法解决的问题时
./shadowme-tools.sh log abc123 "遇到XXX问题，需要人工介入" error

# 请求延期时
./shadowme-tools.sh log abc123 "任务需要延期，等待XXX依赖完成" warn
```

## 故障排除

### 看板连接失败
```bash
# 检查配置
./shadowme-tools.sh status

# 验证 API Key
curl -s http://localhost:3000/api/status \
  -H "x-cc-api-key: your-key"
```

### 任务领取失败
```bash
# 任务可能已被其他分身领取
./shadowme-tools.sh tasks

# 查看任务当前状态
./shadowme-tools.sh info <task-id>
```

### 提交失败
```bash
# 确保在 git 仓库中
git status

# 检查远程仓库
git remote -v
```

## 获取帮助

- 查看完整帮助：`./shadowme-tools.sh help`
- 查看协议文档：`/workspace/ShadowMe/docs/PROTOCOL.md`
- 查看架构文档：`/workspace/ShadowMe/docs/ARCHITECTURE.md`
