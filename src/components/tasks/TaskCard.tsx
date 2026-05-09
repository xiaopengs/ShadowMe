'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Code,
  MoreHorizontal,
  Clock,
  User,
  ExternalLink,
  CheckCircle,
  XCircle,
  Trash2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Task, TaskType, Priority, TaskStatus } from '@/types';
import { TASK_TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/types';
import { useApp } from '@/context/AppContext';

const typeIcons: Record<TaskType, React.ElementType> = {
  technical_issue: Code,
  design_doc: FileText,
  code_review: MessageSquare,
  other: MoreHorizontal
};

const priorityColors = {
  urgent: 'bg-[var(--color-priority-urgent)]',
  high: 'bg-[var(--color-priority-high)]',
  medium: 'bg-[var(--color-priority-medium)]',
  low: 'bg-[var(--color-priority-low)]'
};

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  compact?: boolean;
}

export default function TaskCard({ task, onEdit, compact = false }: TaskCardProps) {
  const { deleteTask, takeTask } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const TypeIcon = typeIcons[task.type];

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;

    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const getDuration = () => {
    if (!task.startedAt) return null;
    const start = new Date(task.startedAt);
    const end = task.completedAt ? new Date(task.completedAt) : new Date();
    const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
    const minutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60)) % 60;

    if (hours > 0) return `${hours}小时${minutes}分钟`;
    return `${minutes}分钟`;
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('确定要删除这个任务吗？')) {
      await deleteTask(task.id);
    }
    setIsMenuOpen(false);
  };

  const handleTake = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await takeTask(task.id);
    setIsMenuOpen(false);
  };

  const duration = getDuration();

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ y: -4 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`glass-card p-5 cursor-pointer relative group ${
        compact ? 'p-4' : ''
      }`}
      onClick={() => onEdit?.(task)}
    >
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary-500)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-md type-${task.type}`}>
            <TypeIcon size={14} />
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full type-${task.type}`}>
            {TASK_TYPE_LABELS[task.type]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} title={PRIORITY_LABELS[task.priority]} />
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
              className="p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
            >
              <MoreHorizontal size={16} className="text-[var(--color-text-muted)]" />
            </button>

            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute right-0 top-full mt-1 w-36 py-1 glass-heavy z-20"
                onClick={(e) => e.stopPropagation()}
              >
                {task.status === 'pending' && (
                  <button
                    onClick={handleTake}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 text-[var(--color-primary-400)]"
                  >
                    <CheckCircle size={14} />
                    领取任务
                  </button>
                )}
                <button
                  onClick={handleDelete}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2 text-[var(--color-error)]"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <h3 className={`font-semibold text-[var(--color-text-primary)] mb-2 line-clamp-2 ${compact ? 'text-sm' : 'text-base'}`}>
        {task.title}
      </h3>

      {!compact && task.description && (
        <p className="text-sm text-[var(--color-text-tertiary)] mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 text-xs rounded-md bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]"
            >
              {tag}
            </span>
          ))}
          {task.tags.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded-md bg-[var(--color-bg-surface)] text-[var(--color-text-muted)]">
              +{task.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <User size={12} />
            <span>{task.createdBy}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDate(task.createdAt)}</span>
          </div>
        </div>

        {duration && task.status !== 'pending' && (
          <span className="text-[var(--color-primary-400)]">
            ⏱ {duration}
          </span>
        )}
      </div>

      {task.result && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-3 pt-3 border-t border-white/5"
        >
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle size={14} className="text-[var(--color-success)]" />
            <span className="text-[var(--color-text-secondary)] truncate flex-1">
              {task.result.summary}
            </span>
            {task.result.url && (
              <a
                href={task.result.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <ExternalLink size={14} className="text-[var(--color-info)]" />
              </a>
            )}
          </div>
        </motion.div>
      )}

      <div className="mt-3 pt-3 border-t border-white/5">
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium status-${task.status}`}>
          {task.status === 'completed' && <CheckCircle size={12} />}
          {task.status === 'pending' && <Clock size={12} />}
          {task.status === 'in_progress' && (
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="inline-block"
            >
              ⏳
            </motion.span>
          )}
          {STATUS_LABELS[task.status]}
        </div>
      </div>
    </motion.div>
  );
}
