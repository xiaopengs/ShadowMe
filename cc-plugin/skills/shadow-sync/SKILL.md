# Shadow Sync 技能

ShadowMe 看板同步技能，提供与看板的双向同步能力。

## 功能概述

- 任务状态同步
- 实时进度上报
- 日志推送
- 事件监听

## 核心脚本

### shadowme-api.sh
ShadowMe API 调用封装。

**用法：**
```bash
shadowme-api.sh <METHOD> <PATH> [BODY]
```

**示例：**
```bash
# 获取任务列表
shadowme-api.sh GET "/api/tasks?status=pending"

# 领取任务
shadowme-api.sh POST "/api/tasks/TASK-001/take"

# 更新任务状态
shadowme-api.sh PATCH "/api/tasks/TASK-001" '{"status": "in_progress"}'
```

### poll-tasks.sh
轮询新任务脚本。

**用法：**
```bash
poll-tasks.sh [--continuous] [--interval=60]
```

**示例：**
```bash
# 单次轮询
poll-tasks.sh

# 持续轮询（每60秒）
poll-tasks.sh --continuous --interval=60
```

### report-progress.sh
进度上报脚本。

**用法：**
```bash
report-progress.sh --task-id <id> --progress <0-100> [--message <msg>]
```

**示例：**
```bash
report-progress.sh --task-id TASK-001 --progress 50 --message "正在重构"
```

### report-complete.sh
任务完成上报脚本。

**用法：**
```bash
report-complete.sh --task-id <id> --summary <summary> [--commit-sha <sha>]
```

**示例：**
```bash
report-complete.sh \
  --task-id TASK-001 \
  --summary "重构完成，提取了5个公共组件" \
  --commit-sha a1b2c3d4
```

### heartbeat.sh
心跳发送脚本。

**用法：**
```bash
heartbeat.sh
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | /api/tasks | 获取任务列表 |
| POST | /api/tasks | 创建任务 |
| GET | /api/tasks/:id | 获取任务详情 |
| PATCH | /api/tasks/:id | 更新任务 |
| DELETE | /api/tasks/:id | 删除任务 |
| POST | /api/tasks/:id/take | 领取任务 |
| POST | /api/tasks/:id/complete | 完成任务 |
| GET | /api/shadow/status | 获取影子状态 |
| POST | /api/shadow/status | 更新影子状态 |
| GET | /api/sse | SSE 实时推送 |
| POST | /api/webhook/cc | CC 消息 webhook |

## CC 协议消息

### 发送消息

```bash
# 发送消息到 webhook
curl -X POST "${SHADOWME_URL}/api/webhook/cc" \
  -H "Content-Type: application/json" \
  -H "x-cc-api-key: ${SHADOWME_API_KEY}" \
  -d '{
    "type": "task.progress",
    "taskId": "TASK-001",
    "timestamp": "2024-01-15T10:30:00Z",
    "messageId": "msg-xxx",
    "senderId": "shadow-001",
    "progress": 50,
    "message": "正在处理..."
  }'
```

### 消息类型

| 类型 | 方向 | 说明 |
|------|------|------|
| task.assign | →看板 | 任务领取 |
| task.progress | →看板 | 进度更新 |
| task.complete | →看板 | 任务完成 |
| task.error | →看板 | 执行错误 |
| log | ↔双向 | 工作日志 |
| git.commit | →看板 | Git提交 |
| git.mr_created | →看板 | MR创建 |
| sync.heartbeat | ↔双向 | 心跳 |
| sync.status | ↔双向 | 状态查询 |

## 配置

配置存储在 `~/.shadowme/config`：

```bash
# ShadowMe 配置
SHADOWME_URL="https://your-server.com"
SHADOWME_API_KEY="your-api-key"
SHADOWME_SHADOW_ID="shadow-001"

# 可选配置
SHADOWME_GITLAB_URL="https://gitlab.com"
SHADOWME_GITLAB_TOKEN="glpat-xxxx"
SHADOWME_POLL_INTERVAL=60
```

## 错误处理

所有脚本返回以下退出码：

| 退出码 | 含义 |
|--------|------|
| 0 | 成功 |
| 1 | 参数错误 |
| 2 | 配置缺失 |
| 3 | API 调用失败 |
| 4 | 认证失败 |
| 5 | 网络错误 |

## 使用示例

### 完整任务流程

```bash
# 1. 配置连接
/shadow-connect https://shadowme.app your-api-key

# 2. 拉取任务
/shadow-poll

# 3. 领取任务
/shadow-take TASK-001

# 4. 执行中报告进度
/shadow-log 正在分析代码...

# 5. 完成任务
/shadow-done 任务完成，提交了3个commit
```

### 自动化脚本调用

```bash
#!/bin/bash

# 加载配置
source ~/.shadowme/config

# 轮询新任务
TASKS=$(poll-tasks.sh)

if [ -n "$TASKS" ]; then
  # 领取第一个任务
  TASK_ID=$(echo "$TASKS" | jq -r '.[0].id')
  
  # 领取
  shadowme-api.sh POST "/api/tasks/${TASK_ID}/take"
  
  # 执行任务...
  
  # 报告进度
  report-progress.sh --task-id "$TASK_ID" --progress 100 --message "完成"
  
  # 完成任务
  report-complete.sh --task-id "$TASK_ID" --summary "任务完成"
fi
```
