'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Send,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Paperclip,
  X,
  FileText
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import { useToast } from '@/components/ui/Toast';
import type { TaskType, Priority } from '@/types';

export default function CreateTaskPage() {
  const router = useRouter();
  const { createTask } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    type: 'technical_issue' as TaskType,
    environment: 'local',
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-[var(--color-outline)]' },
    { value: 'medium', label: 'Standard', color: 'text-[var(--color-primary)]' },
    { value: 'high', label: 'Critical', color: 'text-[var(--color-error)]' },
  ];

  const taskTypes: { value: TaskType; label: string; description: string }[] = [
    { value: 'technical_issue', label: 'Technical Issue', description: 'Bug fixes and technical problems' },
    { value: 'code_review', label: 'Code Review', description: 'Review code changes and MRs' },
    { value: 'design_doc', label: 'Design Doc', description: 'Design documents and specifications' },
    { value: 'other', label: 'Other', description: 'Miscellaneous tasks' },
  ];

  const environments = [
    { value: 'local', label: 'Local Development' },
    { value: 'staging', label: 'Staging Branch' },
    { value: 'production', label: 'Production Hotfix' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createTask({
        title: formData.title,
        type: formData.type,
        priority: formData.priority,
        description: formData.description,
        tags: [],
        attachments: [],
        createdBy: 'Shadow Clone Alpha',
      });
      
      setSuccess(true);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        type: 'technical_issue',
        environment: 'local',
      });

      // Redirect to dashboard after short delay
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Form Area */}
          <div className="lg:col-span-8 space-y-4">
            {/* Page Header */}
            <div className="mb-6">
              <h2 className="font-headline text-2xl md:text-3xl text-[var(--color-on-surface)]">
                New Task Portal
              </h2>
              <p className="font-body text-[var(--color-on-surface-variant)] mt-2">
                Submit technical requests to your local Shadow Clone for automated processing.
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 rounded-xl p-4 flex items-center gap-3"
              >
                <CheckCircle2 size={20} className="text-[var(--color-secondary)]" />
                <p className="text-[var(--color-on-surface)] font-body text-sm">
                  Task created successfully! Redirecting to dashboard...
                </p>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-error)]/10 border border-[var(--color-error)]/30 rounded-xl p-4 flex items-center gap-3"
              >
                <AlertCircle size={20} className="text-[var(--color-error)]" />
                <p className="text-[var(--color-on-surface)] font-body text-sm">{error}</p>
              </motion.div>
            )}

            {/* Task Form */}
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/30 p-6 shadow-lg relative overflow-hidden"
            >
              {/* Title Input */}
              <div className="mb-6">
                <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                  TASK TITLE
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Implement dark mode theme configuration parser"
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/50 rounded-xl px-4 py-3 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all font-body"
                  disabled={isSubmitting}
                />
              </div>

              {/* Type Selector */}
              <div className="mb-6">
                <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                  TASK TYPE
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {taskTypes.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: type.value })}
                      disabled={isSubmitting}
                      className={`
                        p-3 rounded-xl border text-left transition-all
                        ${formData.type === type.value
                          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10 text-[var(--color-primary)]'
                          : 'border-[var(--color-outline-variant)]/30 text-[var(--color-on-surface)] hover:border-[var(--color-outline-variant)]/50'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      <div className="font-body text-sm font-semibold mb-1">{type.label}</div>
                      <div className="text-[10px] text-[var(--color-on-surface-variant)]">{type.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority Selector */}
              <div className="mb-6">
                <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                  PRIORITY LEVEL
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {priorities.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: p.value })}
                      disabled={isSubmitting}
                      className={`
                        py-2.5 rounded-xl border font-body text-sm transition-all text-center
                        ${formData.priority === p.value
                          ? `border-[var(--color-primary)] ${p.color} font-semibold bg-[var(--color-primary)]/10`
                          : 'border-[var(--color-outline-variant)]/30 bg-[var(--color-surface)] text-[var(--color-on-surface-variant)] hover:border-[var(--color-outline-variant)]/50'
                        }
                        disabled:opacity-50 disabled:cursor-not-allowed
                      `}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                  DESCRIPTION
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  onFocus={(e) => e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder="Describe the task in detail. Include any relevant context, error messages, or expected behavior..."
                  rows={6}
                  className="w-full bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)]/50 rounded-xl px-4 py-3 text-[var(--color-on-surface)] placeholder:text-[var(--color-outline)] focus:outline-none focus:border-[var(--color-primary)] focus:shadow-[0_0_15px_rgba(208,188,255,0.3)] transition-all font-body resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Attachments */}
              <div className="mb-6">
                <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                  ATTACHMENTS
                </label>
                
                {/* File List */}
                {attachments.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {attachments.map((file, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between bg-[var(--color-surface-container)] rounded-lg px-3 py-2 border border-[var(--color-outline-variant)]/30"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={16} className="text-[var(--color-primary)] flex-shrink-0" />
                          <span className="text-sm text-[var(--color-on-surface)] truncate">{file.name}</span>
                          <span className="text-xs text-[var(--color-outline)] flex-shrink-0">
                            ({(file.size / 1024).toFixed(1)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                          className="p-1 hover:bg-[var(--color-surface-variant)] rounded transition-colors flex-shrink-0"
                        >
                          <X size={14} className="text-[var(--color-outline)]" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Upload Area */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[var(--color-outline-variant)]/50 rounded-xl p-6 text-center cursor-pointer hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5 transition-all"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      const files = Array.from(e.target.files || []);
                      setAttachments(prev => [...prev, ...files]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  />
                  <Paperclip size={24} className="text-[var(--color-outline)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-on-surface-variant)]">
                    Click to select files
                  </p>
                  <p className="text-xs text-[var(--color-outline)] mt-1">
                    Screenshots, logs, or relevant documents
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl font-body text-sm font-semibold hover:bg-[var(--color-primary-container)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(208,188,255,0.4)]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Submit Task
                  </>
                )}
              </button>
            </motion.form>
          </div>

          {/* Sidebar Info */}
          <div className="lg:col-span-4 space-y-4">
            {/* Workload Simulator */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/30 p-5"
            >
              <h3 className="code-label text-[var(--color-on-surface-variant)] mb-4">
                CURRENT WORKLOAD
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-on-surface)]">Pending Tasks</span>
                  <span className="code-label text-[var(--color-secondary)]">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-on-surface)]">In Progress</span>
                  <span className="code-label text-[var(--color-primary)]">1</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-on-surface)]">Shadow Clone Load</span>
                  <span className="code-label text-[var(--color-outline)]">45%</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--color-outline-variant)]/20">
                <div className="w-full bg-[var(--color-surface-container)] rounded-full h-2">
                  <div 
                    className="bg-[var(--color-primary)] h-2 rounded-full shadow-energy-glow" 
                    style={{ width: '45%' }} 
                  />
                </div>
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/30 p-5"
            >
              <h3 className="code-label text-[var(--color-on-surface-variant)] mb-4">
                PRO TIPS
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-[var(--color-on-surface-variant)]">
                  <span className="text-[var(--color-secondary)]">→</span>
                  Be specific about the expected vs actual behavior
                </li>
                <li className="flex items-start gap-2 text-[var(--color-on-surface-variant)]">
                  <span className="text-[var(--color-secondary)]">→</span>
                  Include error messages and stack traces
                </li>
                <li className="flex items-start gap-2 text-[var(--color-on-surface-variant)]">
                  <span className="text-[var(--color-secondary)]">→</span>
                  High priority tasks will be processed first
                </li>
                <li className="flex items-start gap-2 text-[var(--color-on-surface-variant)]">
                  <span className="text-[var(--color-secondary)]">→</span>
                  Check archive for similar past solutions
                </li>
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
