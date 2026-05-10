---
description: 从ShadowMe看板拉取待领取的任务
argument-hint: "[pending|in_progress|completed|all]"
---

# Shadow Poll

从 ShadowMe 看板拉取任务列表。

## 用法

```
/shadowme:poll [filter]
```

## 参数

- filter: 可选过滤器 (pending/in_progress/completed/all, 默认 pending)

## 执行流程

1. 调用 GET /api/tasks?status={filter}
2. 格式化展示任务列表
3. 提示可用操作

如果 API Key 已配置，在请求头添加 x-cc-api-key。
