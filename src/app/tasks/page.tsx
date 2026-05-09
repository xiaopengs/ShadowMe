'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  Clock,
  CheckCircle
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import TaskCard from '@/components/tasks/TaskCard';
import TaskForm from '@/components/tasks/TaskForm';
import { useApp } from '@/context/AppContext';
import type { Task, TaskType, Priority, TaskStatus } from '@/types';
import { TASK_TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/types';

export default function TasksPage() {
  const { state } = useApp();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<TaskType | 'all'>('all');
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  const filteredTasks = state.tasks.filter(task => {
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !task.description.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterType !== 'all' && task.type !== filterType) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    if (filterStatus !== 'all' && task.status !== filterStatus) return false;
    return true;
  });

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
                任务列表
              </h1>
              <p className="text-[var(--color-text-secondary)] mt-1">
                共 {filteredTasks.length} 个任务
              </p>
            </div>
            <button
              onClick={() => setIsFormOpen(true)}
              className="btn-primary w-full sm:w-auto"
            >
              <Plus size={18} />
              新建任务
            </button>
          </div>

          <div className="glass-card p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full lg:w-auto">
                <div className="relative flex-1 max-w-md">
                  <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索任务..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                  />
                </div>

                <div className="flex gap-2 flex-wrap">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}
                    className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
                  >
                    <option value="all">全部状态</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as TaskType | 'all')}
                    className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
                  >
                    <option value="all">全部类型</option>
                    {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}
                    className="px-3 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)] text-sm focus:outline-none focus:border-[var(--color-primary-500)] transition-all cursor-pointer"
                  >
                    <option value="all">全部优先级</option>
                    {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)]'
                      : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 rounded-xl transition-all ${
                    viewMode === 'list'
                      ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)]'
                      : 'bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]'
                  }`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>

          {filteredTasks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-12 text-center"
            >
              <div className="w-16 h-16 rounded-full bg-[var(--color-bg-surface)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                {searchQuery || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all'
                  ? '没有找到匹配的任务'
                  : '暂无任务'}
              </h3>
              <p className="text-[var(--color-text-muted)] mb-6">
                {searchQuery || filterType !== 'all' || filterPriority !== 'all' || filterStatus !== 'all'
                  ? '尝试调整筛选条件'
                  : '创建一个新任务开始使用影子分身'}
              </p>
              {!searchQuery && filterType === 'all' && filterPriority === 'all' && filterStatus === 'all' && (
                <button
                  onClick={() => setIsFormOpen(true)}
                  className="btn-primary mx-auto"
                >
                  <Plus size={18} />
                  创建任务
                </button>
              )}
            </motion.div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <TaskCard task={task} onEdit={handleEditTask} />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      任务
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      类型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      优先级
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      创建者
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                      创建时间
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => handleEditTask(task)}
                      className="border-b border-white/5 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--color-text-primary)]">{task.title}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full type-${task.type}`}>
                          {TASK_TYPE_LABELS[task.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full priority-badge-${task.priority}`}>
                          {PRIORITY_LABELS[task.priority]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full status-${task.status}`}>
                          {STATUS_LABELS[task.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                        {task.createdBy}
                      </td>
                      <td className="px-4 py-3 text-sm text-[var(--color-text-muted)]">
                        {new Date(task.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      <TaskForm
        isOpen={isFormOpen}
        onClose={handleCloseForm}
        editTask={editingTask}
      />
    </div>
  );
}
