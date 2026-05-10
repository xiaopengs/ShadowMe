---
description: 从ShadowMe看板拉取待领取的任务
argument-hint: [filter]
allowed-tools: Bash(shadowme:*), Read, Write
always-apply: false
---

# Shadow Poll

从 ShadowMe 看板拉取所有待领取（pending）的任务。

## 用法

```
/shadow-poll [filter]
```

## 参数

- `filter`: 可选的任务过滤器
  - `all`: 所有任务
  - `pending`: 待领取（默认）
  - `in_progress`: 进行中
  - `my`: 我的任务

## 执行流程

1. **调用 API 获取任务列表**
   ```bash
   ${CLAUDE_PLUGIN_ROOT}/scripts/shadowme-api.sh GET "/api/tasks?status=pending"
   ```

2. **解析并格式化任务列表**
   - 任务ID
   - 任务标题
   - 优先级
   - 创建时间
   - 分配者

3. **展示任务列表**
   ```
   📋 ShadowMe 待领取任务
   
   [1] TASK-001 | 🟢 高 | 代码重构：提取公共组件
   [2] TASK-002 | 🟡 中 | 修复登录超时Bug
   [3] TASK-003 | 🔴 低 | 更新API文档
   
   使用 /shadow-take <task-id> 领取任务
   ```

## 可用操作

- `/shadow-take <task-id>` - 领取指定任务
- `/shadow-take 1` - 领取列表中的第1个任务

## 过滤示例

```
/shadow-poll my        # 只看分配给我的任务
/shadow-poll high      # 只看高优先级任务
```

## 自动模式

当 shadow-worker agent 运行时，会自动调用此命令轮询新任务。
