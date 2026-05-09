'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Send,
  CloudUpload,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useApp } from '@/context/AppContext';
import type { TaskType, Priority } from '@/types';

export default function CreateTaskPage() {
  const { createTask } = useApp();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium' as Priority,
    type: 'technical_issue' as TaskType,
    environment: 'local',
  });

  const priorities: { value: Priority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'text-[var(--color-outline)]' },
    { value: 'medium', label: 'Standard', color: 'text-[var(--color-primary)]' },
    { value: 'high', label: 'Critical', color: 'text-[var(--color-error)]' },
  ];

  const environments = [
    { value: 'local', label: 'Local Development' },
    { value: 'staging', label: 'Staging Branch' },
    { value: 'production', label: 'Production Hotfix' },
  ];

  const workloadTasks = [
    { name: 'DB Schema Migration', status: 'Running', isActive: true },
    { name: 'API Endpoint Test Gen', status: 'Queued', isActive: false },
    { name: 'Dependency Update', status: 'Queued', isActive: false },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        type: 'technical_issue',
        environment: 'local',
      });
    } catch (error) {
      console.error('Failed to create task:', error);
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

            {/* Task Form */}
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className="bg-[var(--color-surface-container-low)] rounded-xl border border-[var(--color-outline-variant)]/30 p-6 shadow-lg relative overflow-hidden"
            >
              {/* Glassmorphic Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-surface-bright)]/10 to-transparent pointer-events-none" />
              
              <div className="space-y-6 relative z-10">
                {/* Task Title */}
                <div>
                  <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Refactor Auth Module"
                    className="input-field"
                    required
                  />
                </div>

                {/* Problem Description */}
                <div>
                  <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                    Problem Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detail the issue, context, and desired outcome..."
                    rows={5}
                    className="input-field"
                    required
                  />
                </div>

                {/* Priority & Environment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Priority Level */}
                  <div>
                    <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                      Priority Level
                    </label>
                    <div className="flex gap-2">
                      {priorities.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, priority: p.value })}
                          className={`
                            flex-1 py-2.5 rounded-lg font-body text-sm transition-all
                            ${formData.priority === p.value
                              ? p.value === 'high'
                                ? 'bg-[var(--color-error)]/10 border border-[var(--color-error)] text-[var(--color-error)]'
                                : 'bg-[var(--color-primary)]/10 border border-[var(--color-primary)] text-[var(--color-primary)] shadow-[0_0_10px_rgba(208,188,255,0.2)]'
                              : 'bg-[var(--color-surface)] border border-[var(--color-outline-variant)]/50 text-[var(--color-on-surface-variant)] hover:border-[var(--color-primary)]'
                            }
                          `}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Target Environment */}
                  <div>
                    <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                      Target Environment
                    </label>
                    <div className="relative">
                      <select
                        value={formData.environment}
                        onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                        className="input-field appearance-none cursor-pointer pr-10"
                      >
                        {environments.map((env) => (
                          <option key={env.value} value={env.value}>
                            {env.label}
                          </option>
                        ))}
                      </select>
                      <ChevronDown 
                        size={18} 
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" 
                      />
                    </div>
                  </div>
                </div>

                {/* Attachment Area */}
                <div>
                  <label className="block code-label text-[var(--color-on-surface-variant)] mb-2">
                    Attachments / Context
                  </label>
                  <div className="border-2 border-dashed border-[var(--color-outline-variant)]/50 rounded-xl p-8 text-center hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-surface-bright)]/30 transition-all cursor-pointer group">
                    <CloudUpload size={40} className="text-[var(--color-outline)] mx-auto mb-3 group-hover:text-[var(--color-primary)] transition-colors" />
                    <p className="font-body text-[var(--color-on-surface)]">
                      Drag & drop logs, screenshots, or diffs
                    </p>
                    <p className="font-body text-sm text-[var(--color-on-surface-variant)] mt-1">
                      or click to browse files
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[var(--color-outline-variant)]/30 flex justify-end gap-4">
                  <Link
                    href="/"
                    className="px-6 py-2.5 rounded-lg font-body text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)] transition-colors"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit to Shadow
                        <Send size={18} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.form>
          </div>

          {/* Side Panel: Workload & Status */}
          <div className="lg:col-span-4 space-y-4">
            {/* System Status Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--color-surface-container-high)] rounded-xl border border-[var(--color-outline-variant)]/20 p-4 shadow-md"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="code-label text-[var(--color-on-surface)]">SYSTEM STATUS</h3>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-secondary)] animate-pulse shadow-[0_0_8px_#4cd7f6]" />
                  <span className="status-mono text-[var(--color-secondary)]">ONLINE</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm text-[var(--color-on-surface-variant)]">Active Clones</span>
                  <span className="code-label text-[var(--color-on-surface)]">3/5</span>
                </div>
                <div className="w-full bg-[var(--color-surface)] rounded-full h-1.5">
                  <div 
                    className="bg-[var(--color-primary)] h-1.5 rounded-full shadow-[0_0_8px_rgba(208,188,255,0.8)]" 
                    style={{ width: '60%' }} 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body text-sm text-[var(--color-on-surface-variant)]">Estimated Queue Time</span>
                  <span className="code-label text-[var(--color-on-surface)]">~4m 20s</span>
                </div>
              </div>
            </motion.div>

            {/* Current Workload List */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--color-surface-container)] rounded-xl border border-[var(--color-outline-variant)]/20 p-4 shadow-md"
            >
              <h3 className="code-label text-[var(--color-on-surface)] mb-4">CURRENT WORKLOAD</h3>
              
              <div className="space-y-3 relative">
                {/* Connecting Energy Line */}
                <div className="absolute left-3 top-4 bottom-4 w-[2px] bg-gradient-to-b from-[var(--color-primary)] via-[var(--color-secondary)] to-transparent opacity-30" />
                
                {workloadTasks.map((task, index) => (
                  <div 
                    key={index}
                    className={`flex items-start gap-3 relative z-10 p-2 rounded-lg ${
                      task.isActive ? 'bg-[var(--color-surface-bright)]/20 border border-[var(--color-outline-variant)]/10' : ''
                    }`}
                  >
                    <div className={`
                      mt-0.5 p-1 rounded-full border
                      ${task.isActive 
                        ? 'bg-[var(--color-surface)] border-[var(--color-primary)] shadow-[0_0_8px_rgba(208,188,255,0.5)]' 
                        : 'bg-[var(--color-surface)] border-[var(--color-outline-variant)]'
                      }
                    `}>
                      {task.isActive ? (
                        <Loader2 size={14} className="text-[var(--color-primary)] animate-spin" />
                      ) : (
                        <Clock size={14} className="text-[var(--color-on-surface-variant)]" />
                      )}
                    </div>
                    <div>
                      <p className="code-label text-[var(--color-on-surface)]">{task.name}</p>
                      <p className={`font-body text-xs ${task.isActive ? 'text-[var(--color-secondary)]' : 'text-[var(--color-outline)]'}`}>
                        {task.isActive ? 'Processing...' : task.status}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tips Card */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle size={18} className="text-[var(--color-primary)] mt-0.5" />
                <div>
                  <h4 className="font-body text-sm font-semibold text-[var(--color-on-surface)] mb-1">
                    Tips for Better Results
                  </h4>
                  <ul className="text-xs text-[var(--color-on-surface-variant)] space-y-1">
                    <li>• Include error logs and screenshots</li>
                    <li>• Specify expected vs actual behavior</li>
                    <li>• Mention relevant file paths</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
