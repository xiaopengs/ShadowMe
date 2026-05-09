'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Save,
  RefreshCw,
  PowerSettingsNew,
  TestTube,
  Fingerprint,
  Memory,
  GitBranch,
  FolderOpen,
  Wifi,
  WifiOff,
  ChevronDown,
  Eye,
  EyeOff,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useTheme, THEMES } from '@/context/ThemeContext';

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

export default function SettingsPage() {
  const { theme, setTheme, themeInfo } = useTheme();
  const [activeTab, setActiveTab] = useState<'core' | 'integrations'>('core');
  const [showToken, setShowToken] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<SettingsFormData>({
    gitlabUrl: 'https://gitlab.example.com',
    gitlabToken: 'glpat-xxxxxxxxxxxx',
    localEndpoint: 'http://localhost:8080/v1',
    greetingProtocol: 'concise',
    responseVerbosity: 50,
    autoContextInjection: true,
    workingDirectory: '/home/user/projects',
    autoSyncChanges: false,
  });

  const greetingProtocols = [
    { value: 'standard', label: 'Standard (Formal)' },
    { value: 'concise', label: 'Concise (Technical)' },
    { value: 'friendly', label: 'Friendly (Casual)' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleDiscard = () => {
    setFormData({
      gitlabUrl: 'https://gitlab.example.com',
      gitlabToken: 'glpat-xxxxxxxxxxxx',
      localEndpoint: 'http://localhost:8080/v1',
      greetingProtocol: 'concise',
      responseVerbosity: 50,
      autoContextInjection: true,
      workingDirectory: '/home/user/projects',
      autoSyncChanges: false,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-4xl md:text-5xl font-bold text-[var(--color-on-background)] tracking-tight mb-2">
              Configuration
            </h1>
            <p className="font-body text-[var(--color-on-surface-variant)] text-lg">
              Manage your local Claude Code integration and shadow identity.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary self-start md:self-auto"
          >
            {isSaving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Configuration
              </>
            )}
          </button>
        </header>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 border-b border-[var(--color-outline-variant)]/30">
          <button
            onClick={() => setActiveTab('core')}
            className={`px-4 py-3 font-body text-sm border-b-2 transition-colors ${
              activeTab === 'core'
                ? 'border-[var(--color-primary)] text-[var(--color-primary)]'
                : 'border-transparent text-[var(--color-on-surface-variant)] hover:text-[var(--color-on-surface)]'
            }`}
          >
            Core Settings
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

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          {/* Left Column */}
          <div className="md:col-span-7 space-y-8">
            {/* System Core Panel */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[var(--shadow-card)] border border-[var(--color-outline-variant)]/40 relative overflow-hidden"
            >
              {/* Decorative Corner */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary)]/5 rounded-bl-full -mr-16 -mt-16 pointer-events-none" />
              
              <div className="flex items-center gap-3 mb-6">
                <Memory size={24} className="text-[var(--color-primary)]" />
                <h2 className="font-headline text-2xl font-semibold text-[var(--color-on-background)]">
                  System Core
                </h2>
              </div>

              {/* Connection Status */}
              <div className="flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg mb-6 border border-[var(--color-outline-variant)]/30">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[var(--color-error)]'}`} />
                  <div>
                    <p className="font-body text-sm font-semibold text-[var(--color-on-surface)]">Connection Status</p>
                    <p className="font-body text-xs text-[var(--color-on-surface-variant)] mt-0.5">
                      {isConnected ? 'Local Port 8080 active' : 'Disconnected'}
                    </p>
                  </div>
                </div>
                <span className={`font-body text-xs font-medium px-2.5 py-1 rounded-full ${
                  isConnected 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                }`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block font-body text-sm font-medium text-[var(--color-on-surface)] mb-2">
                    Local Endpoint
                  </label>
                  <input
                    type="text"
                    value={formData.localEndpoint}
                    onChange={(e) => setFormData({ ...formData, localEndpoint: e.target.value })}
                    className="input-field font-mono text-sm"
                    readOnly
                  />
                </div>

                <div className="flex gap-4 pt-2">
                  <button className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-[var(--color-outline-variant)] rounded-lg font-body text-sm font-medium text-[var(--color-on-surface)] hover:bg-[var(--color-surface-container-low)] transition-colors">
                    <RefreshCw size={16} />
                    Restart Plugin
                  </button>
                  <button 
                    onClick={() => setIsConnected(!isConnected)}
                    className="flex-1 flex justify-center items-center gap-2 py-2.5 border border-[var(--color-error)]/50 rounded-lg font-body text-sm font-medium text-[var(--color-error)] hover:bg-[var(--color-error-container)]/30 transition-colors"
                  >
                    <PowerSettingsNew size={16} />
                    {isConnected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Shadow Identity Panel */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[var(--shadow-card)] border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-6">
                <Fingerprint size={24} className="text-[var(--color-primary)]" />
                <h2 className="font-headline text-2xl font-semibold text-[var(--color-on-background)]">
                  Shadow Identity
                </h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block font-body text-sm font-medium text-[var(--color-on-surface)] mb-2">
                    Greeting Protocol
                  </label>
                  <div className="relative">
                    <select
                      value={formData.greetingProtocol}
                      onChange={(e) => setFormData({ ...formData, greetingProtocol: e.target.value })}
                      className="input-field appearance-none cursor-pointer"
                    >
                      {greetingProtocols.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-[var(--color-on-surface)] mb-2">
                    Response Verbosity
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[var(--color-outline)]">Brief</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={formData.responseVerbosity}
                      onChange={(e) => setFormData({ ...formData, responseVerbosity: parseInt(e.target.value) })}
                      className="flex-1 accent-[var(--color-primary)]"
                    />
                    <span className="text-xs text-[var(--color-outline)]">Detailed</span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[var(--color-surface-container-low)] rounded-lg">
                  <div>
                    <p className="font-body text-sm font-medium text-[var(--color-on-surface)]">Auto Context Injection</p>
                    <p className="font-body text-xs text-[var(--color-on-surface-variant)]">
                      Automatically inject relevant context into prompts
                    </p>
                  </div>
                  <button
                    onClick={() => setFormData({ ...formData, autoContextInjection: !formData.autoContextInjection })}
                    className="text-[var(--color-primary)]"
                  >
                    {formData.autoContextInjection ? (
                      <ToggleRight size={32} className="fill-current" />
                    ) : (
                      <ToggleLeft size={32} />
                    )}
                  </button>
                </div>
              </div>
            </motion.section>

            {/* Repository Sync Panel */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[var(--color-surface-container-lowest)] rounded-xl p-8 shadow-[var(--shadow-card)] border border-[var(--color-outline-variant)]/40"
            >
              <div className="flex items-center gap-3 mb-6">
                <GitBranch size={24} className="text-[var(--color-primary)]" />
                <h2 className="font-headline text-2xl font-semibold text-[var(--color-on-background)]">
                  Repository Sync
                </h2>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block font-body text-sm font-medium text-[var(--color-on-surface)] mb-2">
                    GitLab URL
                  </label>
                  <input
                    type="text"
                    value={formData.gitlabUrl}
                    onChange={(e) => setFormData({ ...formData, gitlabUrl: e.target.value })}
                    className="input-field font-mono text-sm"
                  />
                </div>

                <div>
                  <label className="block font-body text-sm font-medium text-[var(--color-on-surface)] mb-2">
                    Access Token
                  </label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={formData.gitlabToken}
                      onChange={(e) => setFormData({ ...formData, gitlabToken: e.target.value })}
                      className="input-field font-mono text-sm pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-outline)] hover:text-[var(--color-on-surface)]"
                    >
                      {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button className="w-full flex justify-center items-center gap-2 py-2.5 border border-[var(--color-secondary)] text-[var(--color-secondary)] rounded-lg font-body text-sm font-medium hover:bg-[var(--color-secondary)]/10 transition-colors">
                  <TestTube size={16} />
                  Test Connection
                </button>
              </div>
            </motion.section>
          </div>

          {/* Right Column */}
          <div className="md:col-span-5 space-y-6">
            {/* Theme Selector Card */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-[var(--color-surface-container)] rounded-xl p-6 shadow-[var(--shadow-card)] border border-[var(--color-outline-variant)]/20"
            >
              <h3 className="font-headline text-lg font-semibold text-[var(--color-on-surface)] mb-4">
                Theme
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                      p-3 rounded-lg border text-left transition-all
                      ${theme === t.id
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                        : 'border-[var(--color-outline-variant)]/30 hover:border-[var(--color-primary)]/50'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: t.isDark ? '#1a1a2e' : '#faf5ee', border: '1px solid var(--color-outline-variant)' }}
                      />
                      <span className="font-body text-xs font-medium text-[var(--color-on-surface)]">
                        {t.name}
                      </span>
                    </div>
                    <p className="text-[10px] text-[var(--color-on-surface-variant)]">
                      {t.description}
                    </p>
                  </button>
                ))}
              </div>
            </motion.section>

            {/* Local Mode Status */}
            <motion.section
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[var(--color-secondary)]/10 border border-[var(--color-secondary)]/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <Wifi size={20} className="text-[var(--color-secondary)]" />
                <div>
                  <h4 className="font-body text-sm font-semibold text-[var(--color-on-surface)]">
                    Local Mode Active
                  </h4>
                  <p className="font-body text-xs text-[var(--color-on-surface-variant)]">
                    All processing happens locally on your machine
                  </p>
                </div>
              </div>
            </motion.section>

            {/* Integration Console: Local Mount */}
            {activeTab === 'integrations' && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[var(--color-surface-container-lowest)] rounded-xl p-6 shadow-[var(--shadow-card)] border border-[var(--color-outline-variant)]/40"
              >
                <div className="flex items-center gap-3 mb-4">
                  <FolderOpen size={20} className="text-[var(--color-primary)]" />
                  <h3 className="font-headline text-lg font-semibold text-[var(--color-on-background)]">
                    Local Mount
                  </h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block font-body text-xs font-medium text-[var(--color-on-surface)] mb-1.5">
                      Working Directory
                    </label>
                    <input
                      type="text"
                      value={formData.workingDirectory}
                      onChange={(e) => setFormData({ ...formData, workingDirectory: e.target.value })}
                      className="input-field font-mono text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[var(--color-surface-container-low)] rounded-lg">
                    <span className="font-body text-sm text-[var(--color-on-surface)]">
                      Auto-Sync Changes
                    </span>
                    <button
                      onClick={() => setFormData({ ...formData, autoSyncChanges: !formData.autoSyncChanges })}
                      className="text-[var(--color-primary)]"
                    >
                      {formData.autoSyncChanges ? (
                        <ToggleRight size={28} className="fill-current" />
                      ) : (
                        <ToggleLeft size={28} />
                      )}
                    </button>
                  </div>
                </div>
              </motion.section>
            )}

            {/* Discard/Save Buttons (Mobile) */}
            <div className="md:hidden flex gap-3">
              <button
                onClick={handleDiscard}
                className="flex-1 btn-secondary"
              >
                Discard Changes
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 btn-primary"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
