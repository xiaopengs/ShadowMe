/**
 * TaskCard Component - Enhanced with Accessibility & Performance
 * Features: React.memo, useCallback, ARIA attributes, keyboard navigation
 */
'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import {
  MessageSquare,
  FileText,
  Code,
  MoreHorizontal,
  Clock,
  User,
  CheckCircle,
  Trash2,
  GripVertical,
} from 'lucide-react';
import type { Task, TaskType, Priority, TaskStatus } from '@/types';
import { TASK_TYPE_LABELS, PRIORITY_LABELS, STATUS_LABELS } from '@/types';
import { useApp } from '@/context/AppContext';

const typeIcons: Record<TaskType, React.ElementType> = {
  technical_issue: Code,
  design_doc: FileText,
  code_review: MessageSquare,
  other: MoreHorizontal,
};

const priorityColors: Record<Priority, string> = {
  urgent: 'bg-[var(--color-priority-urgent)]',
  high: 'bg-[var(--color-priority-high)]',
  medium: 'bg-[var(--color-priority-medium)]',
  low: 'bg-[var(--color-priority-low)]',
};

// Memoized type icon component
const TypeIconComponent = memo(function TypeIconComponent({ type }: { type: TaskType }) {
  const Icon = typeIcons[type];
  return <Icon size={14} aria-hidden="true" />;
});

interface TaskCardProps {
  task: Task;
  onEdit?: (task: Task) => void;
  compact?: boolean;
  isDragging?: boolean;
}

// Format date helper
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

// Get duration helper
const getDuration = (task: Task): string | null => {
  if (!task.startedAt) return null;
  const start = new Date(task.startedAt);
  const end = task.completedAt ? new Date(task.completedAt) : new Date();
  const hours = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60));
  const minutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60)) % 60;

  if (hours > 0) return `${hours}小时${minutes}分钟`;
  return `${minutes}分钟`;
};

function TaskCard({ task, onEdit, compact = false, isDragging = false }: TaskCardProps) {
  const { deleteTask, takeTask } = useApp();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [statusChanged, setStatusChanged] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<TaskStatus>(task.status);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  // Detect status change for scale animation
  useEffect(() => {
    if (prevStatusRef.current !== task.status) {
      setStatusChanged(true);
      const timer = setTimeout(() => setStatusChanged(false), 300);
      prevStatusRef.current = task.status;
      return () => clearTimeout(timer);
    }
  }, [task.status]);

  // Handle delete with callback
  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('确定要删除这个任务吗？')) {
      await deleteTask(task.id);
    }
    setIsMenuOpen(false);
  }, [deleteTask, task.id]);

  // Handle take with callback
  const handleTake = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    await takeTask(task.id);
    setIsMenuOpen(false);
  }, [takeTask, task.id]);

  // Toggle menu with callback
  const toggleMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsMenuOpen(prev => !prev);
  }, []);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isMenuOpen]);

  // Handle card click with callback
  const handleCardClick = useCallback(() => {
    onEdit?.(task);
  }, [onEdit, task]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
    if (e.key === 'Escape') {
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }, [handleCardClick]);

  // Handle menu keyboard
  const handleMenuKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    }
  }, []);

  const duration = getDuration(task);

  // Animation variants
  const cardVariants: Variants = {
    initial: { 
      opacity: 0, 
      y: 20,
      scale: 0.98,
    },
    animate: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.3,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
    exit: { 
      opacity: 0, 
      y: -10,
      scale: 0.95,
      transition: {
        duration: prefersReducedMotion ? 0.1 : 0.2,
      },
    },
    hover: {
      y: -4,
      transition: {
        duration: 0.2,
        ease: [0.4, 0, 0.2, 1] as const,
      },
    },
  };

  // Generate unique ID for ARIA
  const cardId = `task-card-${task.id}`;
  const menuId = `task-menu-${task.id}`;

  return (
    <motion.div
      ref={cardRef}
      variants={cardVariants}
      initial="initial"
      animate={statusChanged ? ["animate", "pulse"] : "animate"}
      whileHover={isDragging ? {} : "hover"}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`
        glass-card p-5 cursor-pointer relative group 
        ${compact ? 'p-4' : ''}
        ${isDragging ? 'opacity-90 shadow-xl scale-[1.02]' : ''}
        ${statusChanged ? 'ring-2 ring-[var(--color-primary)]/50' : ''}
      `}
      style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
      role="article"
      aria-labelledby={`${cardId}-title`}
      aria-describedby={`${cardId}-description`}
      tabIndex={0}
    >
      {/* Top gradient line */}
      <motion.div 
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[var(--color-primary-500)] to-transparent"
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        aria-hidden="true"
      />

      {/* Drag Handle */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => e.stopPropagation()}
        aria-hidden="true"
      >
        <GripVertical size={16} className="text-[var(--color-outline)] hover:text-[var(--color-primary)] transition-colors" />
      </motion.div>

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-md type-${task.type}`} aria-hidden="true">
            <TypeIconComponent type={task.type} />
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full type-${task.type}`}>
            {TASK_TYPE_LABELS[task.type]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Priority indicator with text for accessibility */}
          <div 
            className={`w-2 h-2 rounded-full ${priorityColors[task.priority]}`} 
            title={PRIORITY_LABELS[task.priority]}
            role="img"
            aria-label={`Priority: ${PRIORITY_LABELS[task.priority]}`}
          />
          
          {/* More actions menu */}
          <div className="relative">
            <motion.button
              ref={menuButtonRef}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleMenu}
              onKeyDown={handleMenuKeyDown}
              className="p-1 rounded hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="More actions"
              aria-expanded={isMenuOpen}
              aria-haspopup="menu"
              aria-controls={menuId}
            >
              <MoreHorizontal size={16} className="text-[var(--color-text-muted)]" />
            </motion.button>

            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  id={menuId}
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-36 py-1 glass-heavy z-20"
                  onClick={(e) => e.stopPropagation()}
                  role="menu"
                  aria-label="Task actions"
                >
                  {task.status === 'pending' && (
                    <motion.button
                      whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                      onClick={handleTake}
                      className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-[var(--color-primary-400)]"
                      role="menuitem"
                    >
                      <CheckCircle size={14} aria-hidden="true" />
                      领取任务
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.1)' }}
                    onClick={handleDelete}
                    className="w-full px-3 py-2 text-left text-sm flex items-center gap-2 text-[var(--color-error)]"
                    role="menuitem"
                  >
                    <Trash2 size={14} aria-hidden="true" />
                    删除
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Task Title - linked to card via aria-labelledby */}
      <h3 
        id={`${cardId}-title`}
        className="font-medium text-[var(--color-on-surface)] mb-2 group-hover:text-[var(--color-primary)] transition-colors"
      >
        {task.title}
      </h3>

      {/* Task Description Preview */}
      {task.description && (
        <p 
          id={`${cardId}-description`}
          className="text-sm text-[var(--color-on-surface-variant)] mb-3 line-clamp-2"
        >
          {task.description}
        </p>
      )}

      {/* Metadata Row */}
      <div className="flex items-center justify-between text-xs text-[var(--color-on-surface-variant)]">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden="true" />
            <span>{formatDate(task.createdAt)}</span>
          </span>
          {duration && (
            <span className="flex items-center gap-1 text-[var(--color-secondary)]">
              <CheckCircle size={12} aria-hidden="true" />
              <span>{duration}</span>
            </span>
          )}
        </div>

        {/* Creator info */}
        <span className="flex items-center gap-1">
          <User size={12} aria-hidden="true" />
          <span>{task.createdBy.split(' ')[0]}</span>
        </span>
      </div>

      {/* Status Badge with Animation */}
      <motion.div 
        className={`
          absolute bottom-4 right-4 px-2 py-1 rounded text-[10px] font-medium
          ${task.status === 'pending' ? 'bg-[var(--color-outline)]/20 text-[var(--color-outline)]' : ''}
          ${task.status === 'in_progress' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]' : ''}
          ${task.status === 'completed' ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]' : ''}
          ${task.status === 'needs_feedback' ? 'bg-yellow-500/20 text-yellow-500' : ''}
        `}
        animate={task.status === 'in_progress' ? {
          boxShadow: [
            '0 0 0 rgba(var(--color-primary), 0)',
            '0 0 8px rgba(var(--color-primary), 0.3)',
            '0 0 0 rgba(var(--color-primary), 0)',
          ],
        } : {}}
        transition={{ duration: 2, repeat: Infinity }}
        role="status"
        aria-label={`Status: ${STATUS_LABELS[task.status]}`}
      >
        {STATUS_LABELS[task.status]}
      </motion.div>
    </motion.div>
  );
}

export default memo(TaskCard);
