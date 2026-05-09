// UI-POLISH: 修复了Tab名称（Configuration/Integration Console）、卡片布局和保存按钮位置
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Save,
  RefreshCw,
  Power,
  TestTube,
  Fingerprint,
  Cpu,
  GitBranch,
  FolderOpen,
  Wifi,
  WifiOff,
  ChevronDown,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight,
  HardDrive,
  Shield,
  Plug,
  Folder
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useTheme, THEMES } from '@/context/ThemeContext';
import { useToast } from '@/components/ui/Toast';

const STORAGE_KEY = 'shadowme-settings';

interface SettingsFormData {
  gitlabUrl: string;
  gitlabToken: string;
  localEndpoint: string;
  greetingProtocol: string;
  responseVerbosity: number;
  autoContextInjection: boolean;
  workingDirectory: string;
  autoSyncChanges: boolean;
}

// Default settings from environment variables (exposed via NEXT_PUBLIC_ prefix for client-side access)
const envDefaults = {
  gitlabUrl: process.env.NEXT_PUBLIC_GITLAB_URL || 'https://gitlab.example.com',
  gitlabToken: process.env.NEXT_PUBLIC_GITLAB_TOKEN || 'glpat-xxxxxxxxxxxx',
  localEndpoint: process.env.NEXT_PUBLIC_LOCAL_ENDPOINT || 'http://localhost:8080/v1',
  greetingProtocol: process.env.NEXT_PUBLIC_GREETING_PROTOCOL || 'concise',
  responseVerbosity: parseInt(process.env.NEXT_PUBLIC_RESPONSE_VERBOSITY || '50', 10),
  autoContextInjection: process.env.NEXT_PUBLIC_AUTO_CONTEXT_INJECTION !== 'false',
  workingDirectory: process.env.NEXT_PUBLIC_WORKING_DIRECTORY || '/home/user/projects',
  autoSyncChanges: process.env.NEXT_PUBLIC_AUTO_SYNC_CHANGES === 'true',
};

const defaultSettings: SettingsFormData = {
  gitlabUrl: envDefaults.gitlabUrl,
  gitlabToken: envDefaults.gitlabToken,
  localEndpoint: envDefaults.localEndpoint,
  greetingProtocol: envDefaults.greetingProtocol,
  responseVerbosity: envDefaults.responseVerbosity,
  autoContextInjection: envDefaults.autoContextInjection,
  workingDirectory: envDefaults.workingDirectory,
  autoSyncChanges: envDefaults.autoSyncChanges,
};

export default function SettingsPage() {
  const { theme, setTheme, themeInfo } = useTheme();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'core' | 'integrations'>('core');
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [formData, setFormData] = useState<SettingsFormData>(defaultSettings);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFormData({ ...defaultSettings, ...parsed });
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  }, []);

  const greetingProtocols = [
    { value: 'standard', label: 'Standard (Formal)' },
    { value: 'concise', label: 'Concise (Technical)' },
    { value: 'friendly', label: 'Friendly (Casual)' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      await new Promise(resolve => setTimeout(resolve, 500));
      setSaveSuccess(true);
      showToast('Settings saved successfully!', 'success');
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFormData({ ...defaultSettings, ...JSON.parse(stored) });
      } else {
        setFormData(defaultSettings);
      }
    } catch {
      setFormData(defaultSettings);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl md:text-4xl font-bold text-[var(--color-on-background)] tracking-tight mb-2">
              {activeTab === 'core' ? 'Configuration' : 'Integration Console'}
            </h1>
            <p className="font-body text-sm text-[var(--color-on-surface-variant)]">
              {activeTab === 'core' 
                ? 'Manage your local Claude Code integration and shadow identity.'
                : 'Configure your Shadow Clone parameters and local environment sync.'}
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary self-start md:self-auto flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Configuration
              </>
            )}
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6 border-b border-[var(--color-outline-variant)]/30">
          <button
            onClick={() => setActiveTab('core')}
            className={`px-4 py-3 font-body text-sm border-b-2 transition-colors ${
              activeTab === 'core'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}
          >
            Configuration
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`px-4 py-3 font-body text-sm border-b-2 transition-colors ${
              activeTab === 'integrations'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}
          >
            Integration Console
          </button>
        </div>

        {/* Configuration Tab */}
        {activeTab === 'core' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* System Core */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/40 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                    <Cpu size={20} className="text-[var(--color-primary)]" />
                  </div>
                  <h2 className="font-headline text-lg font-semibold text-[var(--color-on-surface)]">
                    System Core
                  </h2>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between p-3 bg-[var(--color-surface-container-lowest)] rounded-lg mb-4 border border-[var(--color-outline-variant)]/20">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
                  <div>
                    <p className="font-body text-xs font-semibold text-[var(--color-on-surface)]">Connection Status</p>
                    <p className="font-body text-[10px] text-[var(--color-on-surface-variant)]">
                      Local Port 8080 active
                    </p>
                  </div>
                </div>
                <span className="font-body text-[10px] font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Connected
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-medium text-[var(--color-on-surface)] mb-1.5">
                    Local Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.localEndpoint}
                    onChange={(e) => setFormData({ ...formData, localEndpoint: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-lg text-[var(--color-on-surface)] font-mono text-xs focus:outline-none focus:border-[var(--color-primary)]"
                    readOnly
                  />
                </div>

                <div className="flex gap-2">
                  <button className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-lg font-body text-xs font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-variant)]/50 transition-colors">
                    <RefreshCw size={12} />
                    Restart
                  </button>
                  <button 
                    className="flex-1 flex justify-center items-center gap-1.5 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-error)]/30 rounded-lg font-body text-xs font-medium text-[var(--color-error)] hover:bg-[var(--color-error-container)]/20 transition-colors">
                    <Power size={12} />
                    Disconnect
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Repository Sync */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <GitBranch size={20} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="font-headline text-lg font-semibold text-[var(--color-on-surface)]">
                  Repository Sync
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-medium text-[var(--color-on-surface)] mb-1.5">
                    GitLab Instance URL
                  </label>
                  <input
                    type="text"
                    value={formData.gitlabUrl}
                    onChange={(e) => setFormData({ ...formData, gitlabUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-lg text-[var(--color-on-surface)] font-mono text-xs focus:outline-none focus:border-[var(--color-primary)]"
                  />
                </div>

                <div>
                  <label className="block font-body text-xs font-medium text-[var(--color-on-surface)] mb-1.5">
                    Personal Access Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={formData.gitlabToken}
                      onChange={(e) => setFormData({ ...formData, gitlabToken: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-lg text-[var(--color-on-surface)] font-mono text-xs focus:outline-none focus:border-[var(--color-primary)] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)]"
                    >
                      {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-[var(--color-outline)]">Requires 'api' and 'read_repository' scopes.</p>
                </div>

                <button className="w-full flex justify-center items-center gap-1.5 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-lg font-body text-xs font-medium text-[var(--color-outline)] hover:bg-[var(--color-surface-variant)]/50 transition-colors">
                  <TestTube size={12} />
                  Test Connection
                </button>
              </div>
            </motion.section>

            {/* Shadow Identity */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Fingerprint size={20} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="font-headline text-lg font-semibold text-[var(--color-on-surface)]">
                  Shadow Identity
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-body text-xs font-medium text-[var(--color-on-surface)] mb-1.5">
                    Greeting Protocol
                  </label>
                  <div className="relative">
                    <select
                      value={formData.greetingProtocol}
                      onChange={(e) => setFormData({ ...formData, greetingProtocol: e.target.value })}
                      className="w-full px-3 py-2 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded-lg text-[var(--color-on-surface)] font-body text-xs focus:outline-none focus:border-[var(--color-primary)] appearance-none cursor-pointer"
                    >
                      <option value="standard">Standard (Formal)</option>
                      <option value="concise">Concise (Technical)</option>
                      <option value="friendly">Friendly (Casual)</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-xs font-medium text-[var(--color-on-surface)] mb-1.5">
                    Response Verbosity
                  </label>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-[var(--color-outline)]">Brief</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.responseVerbosity}
                      onChange={(e) => setFormData({ ...formData, responseVerbosity: parseInt(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]"
                    />
                    <span className="text-[10px] text-[var(--color-outline)]">Detailed</span>
                  </div>
                  <p className="mt-1 text-center text-[10px] font-mono text-[var(--color-on-surface)]">
                    Level {Math.ceil(formData.responseVerbosity / 25)}
                  </p>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--color-surface-container-lowest)] rounded-lg">
                  <div>
                    <p className="font-body text-xs font-medium text-[var(--color-on-surface)]">Auto Context Injection</p>
                    <p className="font-body text-[10px] text-[var(--color-on-surface-variant)]">
                      Pre-loads active file context
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, autoContextInjection: !formData.autoContextInjection })}
                    className="text-[var(--color-primary)]"
                  >
                    {formData.autoContextInjection ? (
                      <ToggleRight size={28} className="fill-current" />
                    ) : (
                      <ToggleLeft size={28} />
                    )}
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Local Mode Card */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 rounded-xl p-5"
            >
              <div className="flex items-center gap-3 mb-3">
                <Wifi size={18} className="text-[var(--color-secondary)]" />
                <h2 className="font-headline text-base font-semibold text-[var(--color-on-surface)]">
                  Local Mode Active
                </h2>
              </div>
              <p className="font-body text-xs text-[var(--color-on-surface-variant)] leading-relaxed">
                Shadow Clone is currently running completely locally. No code snippets are sent to external servers unless explicitly synced.
              </p>
            </motion.section>
          </div>
        )}

        {/* Integration Console Tab */}
        {activeTab === 'integrations' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* System Core */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <HardDrive size={20} className="text-[var(--color-primary)]" />
                </div>
                <div>
                  <h2 className="font-headline text-base font-semibold text-[var(--color-on-surface)]">
                    System Core
                  </h2>
                  <p className="font-body text-[10px] text-[var(--color-on-surface-variant)]">
                    Local Claude Code Plugin Link
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 bg-[var(--color-surface-container-lowest)] rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-body text-xs text-[var(--color-on-surface)]">Status: Connected</span>
                </div>
                <button className="text-[var(--color-primary)] font-body text-xs hover:underline">
                  Restart
                </button>
              </div>
            </motion.section>

            {/* Shadow Identity */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Shield size={20} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="font-headline text-base font-semibold text-[var(--color-on-surface)]">
                  Shadow Identity
                </h2>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Greeting Protocol</span>
                  <span className="font-mono text-xs text-[var(--color-on-surface)]">Initializing...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-body text-xs text-[var(--color-on-surface-variant)]">Response Verbosity</span>
                  <span className="font-mono text-xs text-[var(--color-on-surface)]">Balanced</span>
                </div>
              </div>
            </motion.section>

            {/* Repository Sync */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <GitBranch size={20} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="font-headline text-base font-semibold text-[var(--color-on-surface)]">
                  Repository Sync
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block font-body text-[10px] text-[var(--color-on-surface-variant)] mb-1">GitLab Instance URL</label>
                  <input
                    type="text"
                    value={formData.gitlabUrl}
                    className="w-full px-3 py-1.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded text-[var(--color-on-surface)] font-mono text-xs"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block font-body text-[10px] text-[var(--color-on-surface-variant)] mb-1">Personal Access Token</label>
                  <div className="relative">
                    <input
                      type="password"
                      value="glpat-xxxxxxxxxxxx"
                      className="w-full px-3 py-1.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded text-[var(--color-on-surface)] font-mono text-xs"
                      readOnly
                    />
                    <Eye size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--color-outline)]" />
                  </div>
                </div>
                <button className="w-full py-1.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded font-body text-xs text-[var(--color-on-surface)]">
                  Validate Connection
                </button>
              </div>
            </motion.section>

            {/* Local Mount */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="col-span-1 md:col-span-6 bg-[var(--color-surface-container-low)] rounded-xl p-6 border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <Folder size={20} className="text-[var(--color-primary)]" />
                </div>
                <h2 className="font-headline text-base font-semibold text-[var(--color-on-surface)]">
                  Local Mount
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block font-body text-[10px] text-[var(--color-on-surface-variant)] mb-1">Working Directory Path</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value="~/dev/projects/shadow-workspace"
                      className="flex-1 px-3 py-1.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded text-[var(--color-on-surface)] font-mono text-xs"
                      readOnly
                    />
                    <button className="px-3 py-1.5 bg-[var(--color-surface-container-lowest)] border border-[var(--color-outline-variant)]/30 rounded text-[var(--color-outline)]">
                      <FolderOpen size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--color-surface-container-lowest)] rounded-lg">
                  <span className="font-body text-xs text-[var(--color-on-surface)]">Auto-Sync Changes</span>
                  <button className="text-[var(--color-primary)]">
                    <ToggleRight size={24} className="fill-current" />
                  </button>
                </div>
              </div>
            </motion.section>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
