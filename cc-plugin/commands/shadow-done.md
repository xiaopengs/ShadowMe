---
description: 标记当前ShadowMe任务为已完成
argument-hint: [result-summary]
allowed-tools: Bash(shadowme:*), Read, Write, Bash(git:*)
always-apply: false
---

# Shadow Done

标记当前 ShadowMe 任务为已完成，上报结果并清理工作状态。

## 用法

```
/shadow-done [result-summary]
```

## 参数

- `result-summary`: 结果摘要（必填，说明任务完成情况）

## 执行流程

### 1. 检查当前任务
```bash
# 读取当前任务信息
CURRENT_TASK=$(cat ~/.shadowme/current-task 2>/dev/null)
if [ -z "$CURRENT_TASK" ]; then
  echo "Error: No active task. Use /shadow-take first."
  exit 1
fi
```

### 2. Git 提交流程
```bash
# 检查是否有未提交的变更
if git status --porcelain | grep -q .; then
  echo "📦 发现未提交的变更，正在提交..."
  
  # 添加所有变更
  git add -A
  
  # 创建提交
  COMMIT_MSG="[ShadowMe] ${TASK_ID}: ${RESULT_SUMMARY}"
  git commit -m "$COMMIT_MSG"
  
  # 获取 commit SHA
  COMMIT_SHA=$(git rev-parse HEAD)
  
  # 推送到远程
  git push origin HEAD 2>/dev/null || echo "⚠️ 推送失败，请手动推送"
else
  echo "📝 无需提交变更"
  COMMIT_SHA=""
fi
```

### 3. 标记任务完成
```bash
# 调用 API 标记完成
${CLAUDE_PLUGIN_ROOT}/scripts/report-complete.sh \
  --task-id "${TASK_ID}" \
  --summary "${RESULT_SUMMARY}" \
  --commit-sha "${COMMIT_SHA}"
```

### 4. 发送 task.complete 消息
```json
{
  "type": "task.complete",
  "taskId": "TASK-001",
  "timestamp": "2024-01-15T11:30:00Z",
  "messageId": "complete-xxx",
  "senderId": "shadow-001",
  "summary": "重构完成，提取了5个公共组件",
  "commitSha": "a1b2c3d4e5f6",
  "duration": "5400s"
}
```

### 5. 清理状态
```bash
# 清理当前任务记录
rm -f ~/.shadowme/current-task
```

### 6. 展示完成报告
```
┌─────────────────────────────────────────┐
│  ✅ 任务已完成: TASK-001               │
├─────────────────────────────────────────┤
│  标题: 代码重构：提取公共组件           │
│  结果: 重构完成，提取了5个公共组件      │
│  Commit: a1b2c3d4                      │
│  耗时: 1小时30分钟                      │
└─────────────────────────────────────────┘
```

## 示例

```
/shadow-done 重构完成，提取了5个公共组件
/shadow-done Bug已修复，登录超时问题解决
/shadow-done 文档更新完成，API文档已同步
```

## GitLab MR 创建（如配置）

如果配置了 GitLab，将自动创建 Merge Request：
```bash
# 创建 MR
${CLAUDE_PLUGIN_ROOT}/scripts/create-mr.sh \
  --title "[TASK-001] ${RESULT_SUMMARY}" \
  --source-branch "shadowme/${TASK_ID}" \
  --target-branch "main"
```

## 错误处理

| 情况 | 处理方式 |
|------|----------|
| 无活跃任务 | 提示先领取任务 |
| Git 提交失败 | 保留变更，报告错误但仍标记任务完成 |
| API 调用失败 | 重试3次，仍失败则提示手动完成 |

## 完成后

任务完成后，影子分身恢复空闲状态，可使用：
- `/shadow-poll` 拉取新任务
- `/shadow-status` 查看状态
