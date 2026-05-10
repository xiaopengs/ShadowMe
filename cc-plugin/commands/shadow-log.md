---
description: 向ShadowMe看板发送工作日志
argument-hint: <log-message>
allowed-tools: Bash(shadowme:*), Read
always-apply: false
---

# Shadow Log

将当前工作进度发送到 ShadowMe 看板的 CC Sync Log。

## 用法

```
/shadow-log <log-message>
```

## 参数

- `log-message`: 日志内容（必填）

## 执行流程

### 1. 检查当前任务
```bash
# 确保有活跃任务
if [ ! -f ~/.shadowme/current-task ]; then
  echo "Warning: No active task, but will still send log."
fi
```

### 2. 发送 log 消息
```bash
${CLAUDE_PLUGIN_ROOT}/scripts/shadowme-api.sh POST "/api/webhook/cc" '{
  "type": "log",
  "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
  "messageId": "log-'$(date +%s)'",
  "senderId": "'${SHADOWME_SHADOW_ID}'",
  "taskId": "'${TASK_ID}'",
  "content": "'${LOG_MESSAGE}'",
  "level": "info"
}'
```

### 3. 展示发送结果
```
✅ 日志已发送

📝 内容: 正在分析登录模块代码结构
🕐 时间: 2024-01-15 10:35:00
📋 任务: TASK-001
```

## 消息格式

```json
{
  "type": "log",
  "timestamp": "2024-01-15T10:35:00Z",
  "messageId": "log-1705312500",
  "senderId": "shadow-001",
  "taskId": "TASK-001",
  "content": "正在分析登录模块代码结构",
  "level": "info",
  "metadata": {
    "cwd": "/workspace/project",
    "gitBranch": "shadowme/TASK-001"
  }
}
```

## 日志级别

| 级别 | 说明 | 场景 |
|------|------|------|
| `info` | 信息 | 常规进度更新（默认） |
| `progress` | 进度 | 百分比进度（0-100） |
| `warning` | 警告 | 遇到问题但可解决 |
| `error` | 错误 | 执行遇到错误 |

## 使用场景

### 任务开始时
```
/shadow-log 开始执行任务，正在分析需求...
```

### 阶段性完成
```
/shadow-log 第一阶段完成：完成代码分析
/shadow-log 进度 50%：开始重构核心模块
```

### 遇到问题
```
/shadow-log ⚠️ 发现遗留代码依赖较多，预计耗时增加
```

### 代码提交后
```
/shadow-log ✅ 已提交变更: a1b2c3d4 - 提取公共组件
```

### 工作完成
```
/shadow-log 任务主体完成，准备收尾测试
```

## 自动上报（可选）

在 `hooks.json` 中配置自动进度上报：
- 每次工具执行后自动发送进度
- 大文件操作时自动发送进度
- 长时间操作时的间隔心跳

## 与看板的同步

发送的日志会在看板的 CC Sync Log 区域实时显示，协作者可以看到影子分身的工作进展。
