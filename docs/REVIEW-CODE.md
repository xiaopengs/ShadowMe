# Shadow Clone 代码审查报告

> 审查日期: 2026-05-09
> 审查范围: `/workspace/shadow-clone/src/`
> 审查人: 自动化代码审查

---

## 执行摘要

本报告对 Shadow Clone 项目进行了全面的代码审查，涵盖前端组件、API 路由、状态管理、类型定义和数据库层。整体代码质量良好，但存在若干需要关注的安全、性能和可维护性问题。

| 评估维度 | 评分 | 说明 |
|---------|------|------|
| 安全性 | ⭐⭐⭐☆☆ | 存在 XSS 风险和输入验证不足 |
| 错误处理 | ⭐⭐⭐☆☆ | 错误处理基本完善但可加强 |
| TypeScript 类型安全 | ⭐⭐⭐⭐☆ | 类型定义良好，存在少数 `any` 类型 |
| React 最佳实践 | ⭐⭐⭐☆☆ | 缺少性能优化和错误边界 |
| 状态管理 | ⭐⭐⭐⭐☆ | Context 设计合理，可增加乐观更新 |
| API 设计 | ⭐⭐⭐⭐☆ | RESTful 设计合理，缺少分页 |
| 性能 | ⭐⭐⭐☆☆ | 存在渲染优化空间 |

---

## 🔴 严重问题（必须修复）

### 1. 语法错误导致编译失败

**文件**: [ShadowStatus.tsx#L153](file:///workspace/shadow-clone/src/components/shadow/ShadowStatus.tsx#L153)

```typescript
// 当前代码 - 缺少右引号
<span className="text-xs text-[var(--color-text-muted)]">
  {shadow.status === 'busy' ? '70%' : shadow.status === 'online' ? '100%' : '20%}  // ❌ 语法错误
</span>
```

**建议修复**:
```typescript
<span className="text-xs text-[var(--color-text-muted)]">
  {shadow.status === 'busy' ? '70%' : shadow.status === 'online' ? '100%' : '20%'}
</span>
```

---

### 2. 数据库连接管理问题

**文件**: [db.ts](file:///workspace/shadow-clone/src/lib/db.ts#L85-L90)

**问题**: `getDatabase()` 每次调用都创建新的 `Database` 实例，虽然调用后 `close()`，但 better-sqlite3 推荐使用单一连接。

```typescript
// 当前代码
export function getDatabase() {
  if (!fs.existsSync(DB_PATH)) {
    initDatabase();
  }
  return new Database(DB_PATH);  // 每次创建新实例
}
```

**建议修复**:
```typescript
let dbInstance: Database | null = null;

export function getDatabase(): Database {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DB_PATH)) {
    initDatabase();
  }
  dbInstance = new Database(DB_PATH);
  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
```

---

### 3. XSS 漏洞风险

**文件**: [TaskForm.tsx#L299-L305](file:///workspace/shadow-clone/src/components/tasks/TaskForm.tsx#L299-L305)

**问题**: `createdBy` 字段直接渲染，可能导致 XSS 攻击。

```typescript
// 当前代码
<input
  type="text"
  value={formData.createdBy}
  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
  placeholder="方便影子分身联系你"
  // ... 缺少消毒处理
/>
```

**建议修复**:
```typescript
// 在组件中使用 DOMPurify 消毒
import DOMPurify from 'dompurify';

const sanitizedCreatedBy = DOMPurify.sanitize(formData.createdBy, { ALLOWED_TAGS: [] });

<input
  type="text"
  value={sanitizedCreatedBy}
  onChange={(e) => setFormData({
    ...formData,
    createdBy: e.target.value.replace(/[<>\"']/g, '')
  })}
  // ...
/>
```

---

### 4. API 路由缺少输入验证

**文件**: [gitlab/route.ts#L170-L191](file:///workspace/shadow-clone/src/app/api/gitlab/route.ts#L170-L191)

**问题**: `createFile` 函数未验证 `file_path` 参数。

```typescript
// 当前代码
async function createFile(config: GitLabConfig, projectId: string, params: { ... }) {
  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(params.file_path || 'README.md')}`,
    // file_path 未验证
  );
}
```

**建议修复**:
```typescript
async function createFile(config: GitLabConfig, projectId: string, params: { ... }) {
  const filePath = params.file_path?.trim();

  if (!filePath) {
    throw new Error('file_path is required');
  }

  // 验证路径格式，防止路径遍历攻击
  if (filePath.includes('..') || filePath.startsWith('/')) {
    throw new Error('Invalid file_path format');
  }

  const response = await axios.post(
    `${config.url}/api/v4/projects/${encodeURIComponent(projectId)}/repository/files/${encodeURIComponent(filePath)}`,
    // ...
  );
}
```

---

### 5. 使用浏览器原生对话框

**文件**: [TaskCard.tsx#L76-L82](file:///workspace/shadow-clone/src/components/tasks/TaskCard.tsx#L76-L82)

**问题**: 使用 `confirm()` 会阻塞 UI，建议使用自定义模态框。

```typescript
// 当前代码
const handleDelete = async (e: React.MouseEvent) => {
  e.stopPropagation();
  if (confirm('确定要删除这个任务吗？')) {  // ❌ 阻塞 UI
    await deleteTask(task.id);
  }
  setIsMenuOpen(false);
};
```

**建议修复**:
```typescript
// 创建可复用的确认对话框组件或使用现有的 UI 库
import { useConfirm } from '@/hooks/useConfirm';

const { deleteTask } = useApp();
const { ConfirmDialog, showConfirm } = useConfirm();

const handleDelete = async (e: React.MouseEvent) => {
  e.stopPropagation();
  const confirmed = await showConfirm({
    title: '删除任务',
    message: '确定要删除这个任务吗？此操作无法撤销。',
    confirmText: '删除',
    cancelText: '取消',
    variant: 'danger'
  });

  if (confirmed) {
    await deleteTask(task.id);
  }
  setIsMenuOpen(false);
};
```

---

## 🟠 主要问题（应该修复）

### 6. 缺少 React 性能优化

**文件**: [KanbanBoard.tsx](file:///workspace/shadow-clone/src/components/board/KanbanBoard.tsx)

**问题**: 组件未使用 `memo` 包装，频繁重新渲染影响性能。

```typescript
// 当前代码
export default function KanbanBoard({ tasks, onEditTask }: KanbanBoardProps) {
  // 每次 state.tasks 变化，整个组件树重新渲染
}

export default function TaskCard({ task, onEdit, compact = false }: TaskCardProps) {
  // 未 memo 包装
}
```

**建议修复**:
```typescript
import { memo, useMemo } from 'react';

// 使用 memo 包装 TaskCard
const TaskCard = memo(function TaskCard({ task, onEdit, compact = false }: TaskCardProps) {
  // ... 组件内容
});

// 使用 useMemo 缓存列数据
export default function KanbanBoard({ tasks, onEditTask }: KanbanBoardProps) {
  const columns = useMemo(() => {
    return COLUMN_ORDER.map(status => ({
      id: status,
      title: STATUS_LABELS[status],
      icon: columnIcons[status],
      tasks: tasks
        .filter(t => {
          if (t.status !== status) return false;
          if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
          // ... 其他过滤逻辑
        }))
        .sort((a, b) => { /* 排序逻辑 */ })
    }));
  }, [tasks, searchQuery, filterType, filterPriority, sortBy]);

  // ...
}
```

---

### 7. 缺少错误边界

**文件**: [AppContext.tsx](file:///shadow-clone/src/context/AppContext.tsx)

**问题**: React 应用缺少错误边界组件，错误会导致整个应用崩溃。

**建议添加**:

```typescript
// components/ErrorBoundary.tsx
import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
          <h2 className="text-xl font-bold text-[var(--color-error)]">出错了</h2>
          <p className="text-[var(--color-text-secondary)] mt-2">
            {this.state.error?.message}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary mt-4"
          >
            刷新页面
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

### 8. API 路由代码重复

**文件**: 所有 API 路由文件

**问题**: `rowToTask` 函数在多个文件中重复定义。

```typescript
// 重复定义在以下文件中:
// - /api/tasks/route.ts
// - /api/tasks/[id]/route.ts
// - /api/tasks/[id]/take/route.ts
// - /api/tasks/[id]/complete/route.ts

function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    // ... 相同逻辑
  };
}
```

**建议修复**:

```typescript
// lib/mappers.ts
import type { Task, TaskStatus } from '@/types';

export function rowToTask(row: any): Task {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    priority: row.priority,
    status: row.status as TaskStatus,
    description: row.description || '',
    tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
    attachments: typeof row.attachments === 'string' ? JSON.parse(row.attachments || '[]') : (row.attachments || []),
    expectedDelivery: row.expected_delivery,
    result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) : undefined,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    dueDate: row.due_date
  };
}
```

---

### 9. 缺少分页支持

**文件**: [tasks/route.ts](file:///workspace/shadow-clone/src/app/api/tasks/route.ts#L27-L61)

**问题**: GET `/api/tasks` 返回所有任务，没有分页，大数据量时影响性能。

**建议修复**:

```typescript
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);
    const offset = (page - 1) * limit;

    // ... 现有过滤逻辑 ...

    const countQuery = 'SELECT COUNT(*) as total FROM tasks WHERE 1=1' + whereClause;
    const countResult = db.prepare(countQuery).get(...params) as { total: number };

    const paginatedQuery = query + ` LIMIT ? OFFSET ?`;
    const rows = db.prepare(paginatedQuery).all(...params, limit, offset);

    return NextResponse.json({
      tasks: rows.map(rowToTask),
      pagination: {
        page,
        limit,
        total: countResult.total,
        totalPages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    // ...
  }
}
```

---

### 10. 缺少乐观更新

**文件**: [AppContext.tsx](file:///workspace/shadow-clone/src/context/AppContext.tsx#L131-L176)

**问题**: 删除和更新任务时没有乐观更新，用户体验不佳。

**建议修复**:

```typescript
const deleteTask = async (id: string) => {
  // 乐观更新：立即从 UI 移除
  const previousTasks = state.tasks;
  dispatch({ type: 'DELETE_TASK', payload: id });

  try {
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete task');
  } catch (error) {
    // 失败时回滚
    dispatch({ type: 'SET_TASKS', payload: previousTasks });
    dispatch({ type: 'SET_ERROR', payload: '删除任务失败' });
  }
};
```

---

## 🟡 次要问题（可以优化）

### 11. 变量命名不一致

**文件**: [db.ts](file:///workspace/shadow-clone/src/lib/db.ts)

**问题**: 数据库字段使用 snake_case (`created_at`)，但 TypeScript 类型使用 camelCase (`createdAt`)。

**建议**: 统一使用 camelCase 或在数据库层添加转换工具。

---

### 12. 缺少加载状态指示

**文件**: [KanbanBoard.tsx](file:///workspace/shadow-clone/src/components/board/KanbanBoard.tsx)

**问题**: 过滤和搜索操作没有加载状态指示。

**建议**: 添加 `isFiltering` 状态：

```typescript
const [isFiltering, setIsFiltering] = useState(false);

useEffect(() => {
  setIsFiltering(true);
  const timer = setTimeout(() => setIsFiltering(false), 300);
  return () => clearTimeout(timer);
}, [searchQuery, filterType, filterPriority]);
```

---

### 13. 缺少 aria 属性

**文件**: [TaskForm.tsx](file:///workspace/shadow-clone/src/components/tasks/TaskForm.tsx)

**问题**: 表单元素缺少 `aria-label` 和 `aria-describedby`，影响可访问性。

**建议**:
```typescript
<input
  type="text"
  aria-label="任务标题"
  aria-describedby="title-help"
  // ...
/>
<span id="title-help" className="sr-only">最多输入50个字符</span>
```

---

### 14. 未使用的 import

**文件**: [TaskCard.tsx](file:///workspace/shadow-clone/src/components/tasks/TaskCard.tsx)

**问题**: `XCircle` 和 `ChevronDown` 已导入但未使用。

```typescript
import {
  MessageSquare,
  FileText,
  Code,
  MoreHorizontal,
  Clock,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,        // ❌ 未使用
  Trash2,
  ChevronDown,    // ❌ 未使用
  ChevronUp
} from 'lucide-react';
```

---

## 📊 代码质量评分详情

| 类别 | 分数 | 发现项 |
|------|------|--------|
| **前端组件** | 7/10 | |
| - 组件结构 | 8/10 | 良好的组件分解 |
| - 性能优化 | 5/10 | 缺少 memo 和 useMemo |
| - 可访问性 | 6/10 | 缺少 aria 属性 |
| **API 路由** | 7/10 | |
| - 输入验证 | 5/10 | 缺少验证 |
| - 错误处理 | 7/10 | 基本完善 |
| - 代码复用 | 5/10 | rowToTask 重复 |
| **状态管理** | 8/10 | |
| - 设计模式 | 9/10 | 良好的 Context + Reducer |
| - 乐观更新 | 4/10 | 缺失 |
| - 错误恢复 | 6/10 | 可改进 |
| **类型安全** | 8/10 | |
| - 类型覆盖 | 9/10 | 良好的类型定义 |
| - 消除 any | 6/10 | 少数 any 类型 |
| **数据库** | 7/10 | |
| - 连接管理 | 5/10 | 需改进 |
| - SQL 注入防护 | 9/10 | 使用参数化查询 |
| - 索引 | 8/10 | 已创建必要索引 |

---

## 🔧 改进建议优先级

### 高优先级 (P0)
1. 修复 ShadowStatus.tsx 语法错误
2. 改进数据库连接管理
3. 添加 XSS 防护
4. 添加 API 输入验证

### 中优先级 (P1)
5. 添加 React.memo 和 useMemo 优化
6. 实现乐观更新
7. 添加错误边界
8. 添加分页支持

### 低优先级 (P2)
9. 统一命名规范
10. 增强可访问性
11. 添加加载状态
12. 移除未使用的 import

---

## 📝 具体文件修改建议汇总

| 文件 | 问题数 | 优先级 |
|------|--------|--------|
| [ShadowStatus.tsx](file:///workspace/shadow-clone/src/components/shadow/ShadowStatus.tsx) | 1 | P0 |
| [db.ts](file:///workspace/shadow-clone/src/lib/db.ts) | 2 | P0 |
| [TaskForm.tsx](file:///workspace/shadow-clone/src/components/tasks/TaskForm.tsx) | 2 | P0/P1 |
| [gitlab/route.ts](file:///workspace/shadow-clone/src/app/api/gitlab/route.ts) | 1 | P0 |
| [KanbanBoard.tsx](file:///workspace/shadow-clone/src/components/board/KanbanBoard.tsx) | 2 | P1 |
| [TaskCard.tsx](file:///workspace/shadow-clone/src/components/tasks/TaskCard.tsx) | 2 | P1 |
| [AppContext.tsx](file:///workspace/shadow-clone/src/context/AppContext.tsx) | 2 | P1 |
| [tasks/route.ts](file:///workspace/shadow-clone/src/app/api/tasks/route.ts) | 2 | P1 |
| 多个 API 路由 | 1 (共享) | P1 |
| 多个组件 | 1 (共享) | P2 |

---

## ✅ 优点总结

1. **良好的项目结构**: 组件、API、上下文分离清晰
2. **TypeScript 类型定义完善**: 类型覆盖全面，减少运行时错误
3. **数据库设计合理**: 包含日志表、索引优化
4. **UI 设计现代**: 使用 Framer Motion 动画，视觉效果良好
5. **参数化查询**: 有效防止 SQL 注入
6. **响应式设计**: 支持移动端和桌面端

---

*报告生成时间: 2026-05-09*
