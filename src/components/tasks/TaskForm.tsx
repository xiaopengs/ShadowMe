'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Code, FileText, MessageSquare, MoreHorizontal } from 'lucide-react';
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-heavy z-50 rounded-2xl"
          >
            <div className="sticky top-0 bg-[var(--color-bg-elevated)]/90 backdrop-blur-lg border-b border-white/5 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                {editTask ? '编辑任务' : '创建新任务'}
              </h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} className="text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  任务标题 <span className="text-[var(--color-error)]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="简要描述任务内容..."
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20 transition-all"
                  maxLength={50}
                  required
                />
                <div className="mt-1 text-xs text-[var(--color-text-muted)] text-right">
                  {formData.title.length}/50
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    任务类型
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {typeOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = formData.type === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, type: opt.value })}
                          className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                            isSelected
                              ? 'border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10'
                              : 'border-white/10 hover:border-white/20 bg-[var(--color-bg-surface)]'
                          }`}
                        >
                          <Icon size={16} className={isSelected ? 'text-[var(--color-primary-400)]' : 'text-[var(--color-text-muted)]'} />
                          <span className={`text-sm ${isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    优先级
                  </label>
                  <div className="flex gap-2">
                    {priorityOptions.map((opt) => {
                      const isSelected = formData.priority === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: opt.value })}
                          className={`flex-1 py-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                            isSelected
                              ? `border-transparent ${opt.color} text-white`
                              : 'border-white/10 hover:border-white/20 bg-[var(--color-bg-surface)]'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : opt.color}`} />
                          <span className={`text-xs ${isSelected ? 'text-white' : 'text-[var(--color-text-secondary)]'}`}>
                            {opt.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  详细描述 <span className="text-[var(--color-error)]">*</span>
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="详细描述任务需求、支持 Markdown 格式..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] focus:ring-2 focus:ring-[var(--color-primary-500)]/20 transition-all resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  技术标签
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    placeholder="输入标签后按回车添加..."
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                  />
                  <button
                    type="button"
                    onClick={addTag}
                    className="px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 hover:border-[var(--color-primary-500)] text-[var(--color-text-secondary)] transition-all"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)]"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-[var(--color-error)] transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    期望交付物
                  </label>
                  <input
                    type="text"
                    value={formData.expectedDelivery}
                    onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })}
                    placeholder="如：代码审查报告"
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                    截止日期
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                  你的名字
                </label>
                <input
                  type="text"
                  value={formData.createdBy}
                  onChange={(e) => setFormData({ ...formData, createdBy: e.target.value })}
                  placeholder="方便影子分身联系你"
                  className="w-full px-4 py-2.5 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !formData.title.trim()}
                  className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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
                      <Plus size={18} />
                      {editTask ? '保存修改' : '创建任务'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
