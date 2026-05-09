'use client';

import { motion } from 'framer-motion';
import {
  Bot,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useApp } from '@/context/AppContext';
import type { ShadowStatus } from '@/types';

const statusConfig = {
  online: {
    label: '在线',
    color: 'text-[var(--color-success)]',
    bgColor: 'bg-[var(--color-success)]',
    icon: CheckCircle,
    description: '准备接受任务'
  },
  busy: {
    label: '忙碌中',
    color: 'text-[var(--color-warning)]',
    bgColor: 'bg-[var(--color-warning)]',
    icon: Loader2,
    description: '正在处理任务'
  },
  offline: {
    label: '离线',
    color: 'text-[var(--color-text-muted)]',
    bgColor: 'bg-[var(--color-text-muted)]',
    icon: WifiOff,
    description: '未启动'
  },
  unknown: {
    label: '未知',
    color: 'text-[var(--color-info)]',
    bgColor: 'bg-[var(--color-info)]',
    icon: AlertCircle,
    description: '状态检测中'
  }
};

export default function ShadowStatus() {
  const { state } = useApp();
  const { shadow } = state;
  const config = statusConfig[shadow.status as ShadowStatus];

  const StatusIcon = config.icon;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return '刚刚';
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`;
    return `${Math.floor(diff / 86400)}天前`;
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-secondary-500)] p-0.5"
            animate={shadow.status === 'online' ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <div className="w-full h-full rounded-[10px] bg-[var(--color-bg-surface)] flex items-center justify-center">
              <Bot size={24} className="text-[var(--color-primary-400)]" />
            </div>
            <motion.div
              className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${config.bgColor} border-2 border-[var(--color-bg-surface)]`}
              animate={shadow.status === 'online' ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            />
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {shadow.name}
            </h3>
            <div className={`flex items-center gap-1.5 ${config.color}`}>
              <StatusIcon size={14} className={shadow.status === 'busy' ? 'animate-spin' : ''} />
              <span className="text-sm font-medium">{config.label}</span>
            </div>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor}/20 ${config.color}`}>
          {config.label}
        </div>
      </div>

      <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
        {config.description}
      </p>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
            <Clock size={14} />
            <span>最后心跳</span>
          </div>
          <span className="text-[var(--color-text-secondary)]">
            {formatTime(shadow.lastHeartbeat)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
            <Zap size={14} />
            <span>当前任务</span>
          </div>
          <span className="text-[var(--color-text-secondary)]">
            {shadow.currentTaskId ? shadow.currentTask?.title || '处理中...' : '无'}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="text-xs text-[var(--color-text-muted)] mb-2">能力清单</div>
        <div className="flex flex-wrap gap-1.5">
          {shadow.capabilities.map((cap, index) => (
            <motion.span
              key={cap}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="px-2 py-0.5 text-xs rounded-md bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)]"
            >
              {cap}
            </motion.span>
          ))}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-2">
        <div className={`flex-1 h-1.5 rounded-full bg-[var(--color-bg-surface)] overflow-hidden`}>
          <motion.div
            className={`h-full rounded-full ${config.bgColor}`}
            initial={{ width: '0%' }}
            animate={{ width: shadow.status === 'busy' ? '70%' : shadow.status === 'online' ? '100%' : '20%' }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">
          {shadow.status === 'busy' ? '70%' : shadow.status === 'online' ? '100%' : '20%'}
        </span>
      </div>
    </div>
  );
}
