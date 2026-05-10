---
description: 领取一个ShadowMe看板任务
argument-hint: <task-id>
allowed-tools: Bash(shadowme:*), Read, Write, Edit, Bash(git:*)
always-apply: false
---

# Shadow Take

领取指定ID的 ShadowMe 看板任务并开始执行。

## 用法

```
/shadow-take <task-id>
```

## 参数

- `task-id`: 任务ID（例如：`TASK-001` 或 `1`）

## 执行流程

### 1. 领取任务
```bash
# 调用 API 领取任务
${CLAUDE_PLUGIN_ROOT}/scripts/shadowme-api.sh POST "/api/tasks/${TASK_ID}/take"
```

### 2. 获取任务详情
```bash
# 获取完整任务信息
${CLAUDE_PLUGIN_ROOT}/scripts/shadowme-api.sh GET "/api/tasks/${TASK_ID}"
```

### 3. 发送 task.assign 消息
```json
{
  "type": "task.assign",
  "taskId": "TASK-001",
  "timestamp": "2024-01-15T10:30:00Z",
  "messageId": "assign-xxx",
  "senderId": "shadow-001",
  "taskTitle": "代码重构：提取公共组件"
}
```

### 4. 初始化任务工作目录
- 创建任务工作区（如需要）
- 记录当前任务到 `~/.shadowme/current-task`

### 5. 展示任务详情
```
✅ 任务已领取：TASK-001

📝 标题：代码重构：提取公共组件
🏷️  优先级：高
📂 分类：refactoring
📄 描述：...
📎 附件：...

开始执行任务...
```

## 示例

```
/shadow-take TASK-001
/shadow-take 42
/shadow-take my        # 领取第一个待领取任务
```

## 注意事项

- 只能领取 `pending` 状态的任务
- 领取后任务状态变为 `in_progress`
- 每个任务只能被一个影子分身领取
- 领取后请及时开始执行，避免任务超时

## 任务完成后

使用 `/shadow-done` 标记任务完成：
```
/shadow-done 重构完成，提取了5个公共组件，提交了3个commit
```
