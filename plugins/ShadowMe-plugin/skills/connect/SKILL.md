---
description: 首次连接ShadowMe看板配置
argument-hint: <server-url> [api-key]
---

# Shadow Connect

配置 ShadowMe 看板服务器连接。

## 用法

```
/shadowme:connect <server-url> [api-key]
```

## 执行流程

1. 验证服务器连接 — 使用 fetch 测试 /api/status
2. 保存配置到 ~/.shadowme/config
3. 测试认证 — 调用 GET /api/tasks 验证 API Key 有效
4. 报告连接状态

配置文件格式：
```
SHADOWME_URL="https://your-server.com"
SHADOWME_API_KEY="your-api-key"
```
