---
description: 首次连接ShadowMe看板配置
argument-hint: <server-url> [api-key]
allowed-tools: Bash, Read, Write
always-apply: false
---

# Shadow Connect

配置 ShadowMe 看板服务器连接。

## 用法

```
/shadow-connect <server-url> [api-key]
```

## 参数

- `server-url`: ShadowMe 看板服务器地址（例如：`https://shadowme.example.com`）
- `api-key`: API Key（可选，后续也可通过环境变量配置）

## 执行流程

1. **验证服务器连接**
   - 使用 `curl` 测试服务器可达性
   - 验证 API 端点响应

2. **保存配置到 `~/.shadowme/config`**
   ```
   SHADOWME_URL="https://your-server.com"
   SHADOWME_API_KEY="your-api-key"
   ```

3. **测试认证**
   - 调用 `GET /api/tasks` 验证 API Key 有效
   - 获取看板基本信息

4. **建立 SSE 连接**
   - 启动 SSE 监听（后台进程）
   - 接收实时任务推送

## 示例

```
/shadow-connect https://shadowme.mycompany.com sk_live_xxxxxxxxxxxxx
```

## 配置存储位置

配置将保存到 `~/.shadowme/config` 文件中，包含以下内容：
- `SHADOWME_URL`: 服务器地址
- `SHADOWME_API_KEY`: API Key
- `SHADOWME_SHADOW_ID`: 影子分身ID（从API获取）

## 注意事项

- API Key 请从 ShadowMe 看板的设置页面获取
- 敏感信息仅保存在本地，不会上传到任何第三方
- 如需修改配置，重新运行此命令即可
