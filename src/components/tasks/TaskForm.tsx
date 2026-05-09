// UI-POLISH: 修复为左右布局，添加右侧系统状态面板，优化Priority选择按钮组样式
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Code, FileText, MessageSquare, MoreHorizontal, CloudUpload, ArrowRight, Server, Clock, Users, Activity } from 'lucide-react';
import type { TaskType, Priority, TaskFormData } from '@/types';
import { TASK_TYPE_LABELS, PRIORITY_LABELS } from '@/types';
import { useApp } from '@/context/AppContext';

const typeOptions: { value: TaskType; label: string; icon: React.ElementType; color: string }[] = [
  { value: 'technical_issue', label: '技术问题', icon: Code, color: 'from-[#0EA5E9] to-[#7DD3FC]' },
  { value: 'design_doc', label: '方案设计', icon: FileText, color: 'from-[#29C16A] to-[#5FCC8E]' },
  { value: 'code_review', label: '代码审查', icon: MessageSquare, color: 'from-[#F59E0B] to-[#FBBF24]' },
  { value: 'other', label: '其他', icon: MoreHorizontal, color: 'from-[#9CA3AF] to-[#D1D5DB]' }
];

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: 'urgent', label: '紧急', color: 'bg-[var(--color-priority-urgent)]' },
  { value: 'high', label: '高', color: 'bg-[var(--color-priority-high)]' },
  { value: 'medium', label: '中', color: 'bg-[var(--color-priority-medium)]' },
  { value: 'low', label: '低', color: 'bg-[var(--color-priority-low)]' }
];

interface TaskFormProps {
  isOpen: boolean;
  onClose: () => void;
  editTask?: any;
}

export default function TaskForm({ isOpen, onClose, editTask }: TaskFormProps) {
  const { createTask, updateTask } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    type: 'technical_issue',
    priority: 'medium',
    description: '',
    tags: [],
    expectedDelivery: '',
    dueDate: '',
    createdBy: '访客'
  });
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editTask) {
      setFormData({
        title: editTask.title || '',
        type: editTask.type || 'technical_issue',
        priority: editTask.priority || 'medium',
        description: editTask.description || '',
        tags: editTask.tags || [],
        expectedDelivery: editTask.expectedDelivery || '',
        dueDate: editTask.dueDate?.split('T')[0] || '',
        createdBy: editTask.createdBy || '访客'
      });
    } else {
      setFormData({
        title: '',
        type: 'technical_issue',
        priority: 'medium',
        description: '',
        tags: [],
        expectedDelivery: '',
        dueDate: '',
        createdBy: '访客'
      });
    }
  }, [editTask, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setIsSubmitting(true);
    try {
      if (editTask) {
        await updateTask(editTask.id, formData);
      } else {
        await createTask({
          ...formData,
          attachments: [],
          result: undefined
        });
      }
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-hidden glass-heavy z-50 rounded-2xl"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--color-surface-container-low)]/90 backdrop-blur-lg border-b border-[var(--color-outline-variant)]/30 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="font-headline text-xl text-[var(--color-on-surface)]">
                  New Task Portal
                </h2>
                <p className="font-body text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                  Submit technical requests to your local Shadow Clone for automated processing.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-variant)] transition-colors"
              >
                <X size={20} className="text-[var(--color-on-surface-variant)]" />
              </button>
            </div>

            {/* Main Content - 左右布局 */}
            <div className="flex max-h-[calc(90vh-80px)]">
              {/* 左侧表单区域 */}
              <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-5 overflow-y-auto">
                {/* Task Title */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2 font-body">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Refactor Auth Module"
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all font-body text-sm"
                    maxLength={50}
                    required
                  />
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2 font-body">
                    Problem Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detail the issue, context, and desired outcome..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/30 transition-all resize-none font-body text-sm"
                    required
                  />
                </div>

                {/* Priority Level - 三选一按钮组 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2 font-body">
                    Priority Level
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: 'low', label: 'Low' },
                      { value: 'medium', label: 'Standard' },
                      { value: 'urgent', label: 'Critical' }
                    ].map((opt) => {
                      const isSelected = formData.priority === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: opt.value as Priority })}
                          className={`flex-1 py-2.5 rounded-lg border transition-all font-body text-sm font-medium ${
                            isSelected
                              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] border-[var(--color-primary)]'
                              : 'bg-[var(--color-surface-container-low)] border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]/50'
                          }`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Target Environment */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2 font-body">
                    Target Environment
                  </label>
                  <select
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] focus:outline-none focus:border-[var(--color-primary)] transition-all font-body text-sm cursor-pointer appearance-none"
                  >
                    <option value="local">Local Development</option>
                    <option value="staging">Staging Server</option>
                    <option value="production">Production</option>
                  </select>
                </div>

                {/* Attachments / Context - 拖拽上传区 */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2 font-body">
                    Attachments / Context
                  </label>
                  <div className="border-2 border-dashed border-[var(--color-outline-variant)]/50 rounded-lg p-8 text-center hover:border-[var(--color-primary)]/50 transition-colors cursor-pointer group">
                    <CloudUpload size={32} className="mx-auto text-[var(--color-outline)] mb-2 group-hover:text-[var(--color-primary)] transition-colors" />
                    <p className="text-sm text-[var(--color-on-surface-variant)] font-body">
                      Drag & drop logs, screenshots, or diffs
                    </p>
                    <p className="text-xs text-[var(--color-outline)] mt-1">
                      or click to browse files
                    </p>
                  </div>
                </div>

                {/* Created By */}
                <div>
                  <label className="block text-sm font-medium text-[var(--color-on-surface)] mb-2 font-body">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.createdBy}
                    onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                    placeholder="For Shadow to reach you"
                    className="w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-container-low)] border border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] transition-all font-body text-sm"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-3 rounded-lg border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface-variant)] font-body text-sm font-medium hover:bg-[var(--color-surface-variant)]/50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !formData.title.trim()}
                    className="flex-1 py-3 rounded-lg bg-[var(--color-secondary)] text-[var(--color-on-secondary)] font-body text-sm font-medium hover:bg-[var(--color-secondary-container)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <motion.span
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                        className="inline-block"
                      >
                        ⏳
                      </motion.span>
                    ) : (
                      <>
                        Submit to Shadow
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 右侧系统状态面板 */}
              <div className="w-72 border-l border-[var(--color-outline-variant)]/30 p-5 bg-[var(--color-surface-container-low)]/50 overflow-y-auto">
                <h3 className="font-headline text-base text-[var(--color-on-surface)] mb-4 flex items-center gap-2">
                  <Server size={18} className="text-[var(--color-primary)]" />
                  SYSTEM STATUS
                </h3>

                {/* Online Status */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.5)]" />
                  <span className="font-body text-sm text-[var(--color-on-surface)]">ONLINE</span>
                </div>

                {/* Active Clones Progress */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Active Clones</span>
                    <span className="font-mono text-xs text-[var(--color-on-surface)]">3/5</span>
                  </div>
                  <div className="w-full h-2 bg-[var(--color-surface-container-low)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--color-primary)]/70 rounded-full transition-all"
                      style={{ width: '60%' }}
                    />
                  </div>
                </div>

                {/* Queue Time */}
                <div className="mb-6 flex items-center gap-2">
                  <Clock size={14} className="text-[var(--color-outline)]" />
                  <span className="font-body text-xs text-[var(--color-on-surface-variant)]">
                    Estimated Queue Time: <span className="font-mono text-[var(--color-on-surface)]">~4m 20s</span>
                  </span>
                </div>

                {/* Current Workload */}
                <div className="pt-4 border-t border-[var(--color-outline-variant)]/30">
                  <h4 className="font-body text-xs font-medium text-[var(--color-on-surface)] mb-3 uppercase tracking-wide">
                    Current Workload
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="bg-[var(--color-surface-container-low)] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Activity size={12} className="text-[var(--color-secondary)] animate-pulse" />
                        <span className="font-mono text-[10px] text-[var(--color-on-surface)]">DB Schema Migration</span>
                      </div>
                      <p className="text-[10px] text-[var(--color-on-surface-variant)] font-body">
                        Generating rollback scripts...
                      </p>
                    </div>

                    <div className="bg-[var(--color-surface-container-low)] rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Users size={12} className="text-[var(--color-outline)]" />
                        <span className="font-mono text-[10px] text-[var(--color-on-surface)]">Auth Refactor</span>
                      </div>
                      <p className="text-[10px] text-[var(--color-on-surface-variant)] font-body">
                        Queued
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
