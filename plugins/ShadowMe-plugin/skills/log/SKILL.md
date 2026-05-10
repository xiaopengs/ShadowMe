---
description: 向ShadowMe看板发送工作日志
argument-hint: <log-message>
---

# Shadow Log

将当前工作进度发送到 ShadowMe 看板。

## 用法

```
/shadowme:log <log-message>
```

## 执行流程

1. 检查当前任务
2. 发送 log 消息到 POST /api/webhook/cc

消息格式：
```json
{
  "type": "log",
  "taskId": "current-task-id",
  "content": "log message",
  "level": "info"
}
```

日志级别：info, progress, warning, error
