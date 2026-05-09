'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  User,
  Link2,
  Bell,
  Shield,
  Save,
  ExternalLink,
  Check,
  Copy
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [config, setConfig] = useState({
    shadowName: '影子分身',
    autoTakeTasks: false,
    gitlabUrl: '',
    gitlabToken: '',
    gitlabDefaultProject: '',
    notifications: {
      taskCreated: true,
      taskCompleted: true,
      shadowStatus: true
    }
  });
  const [saved, setSaved] = useState(false);

  const tabs = [
    { id: 'general', label: '通用设置', icon: Settings },
    { id: 'gitlab', label: 'GitLab', icon: Link2 },
    { id: 'notifications', label: '通知', icon: Bell },
    { id: 'security', label: '安全', icon: Shield }
  ];

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const boardUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            设置
          </h1>
          <p className="text-[var(--color-text-secondary)] mb-8">
            配置影子分身的各项参数
          </p>

          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-64 flex-shrink-0">
              <nav className="glass-card p-2 sticky top-24">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                        isActive
                          ? 'bg-[var(--color-primary-500)]/10 text-[var(--color-primary-400)]'
                          : 'text-[var(--color-text-secondary)] hover:bg-white/5'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="flex-1 space-y-6">
              {activeTab === 'general' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                    通用设置
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        影子分身名称
                      </label>
                      <input
                        type="text"
                        value={config.shadowName}
                        onChange={(e) => setConfig({ ...config, shadowName: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-surface)]">
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">
                          自动领取任务
                        </div>
                        <div className="text-sm text-[var(--color-text-muted)]">
                          新的待领取任务自动被影子分身领取
                        </div>
                      </div>
                      <button
                        onClick={() => setConfig({ ...config, autoTakeTasks: !config.autoTakeTasks })}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          config.autoTakeTasks ? 'bg-[var(--color-primary-500)]' : 'bg-[var(--color-bg-surface-hover)]'
                        }`}
                      >
                        <motion.div
                          animate={{ x: config.autoTakeTasks ? 28 : 2 }}
                          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
                        />
                      </button>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        看板访问地址
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={boardUrl}
                          readOnly
                          className="flex-1 px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-secondary)]"
                        />
                        <button
                          onClick={() => navigator.clipboard.writeText(boardUrl)}
                          className="px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 hover:border-[var(--color-primary-500)] transition-all"
                        >
                          <Copy size={18} className="text-[var(--color-text-secondary)]" />
                        </button>
                      </div>
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        分享此地址给需要协作的人
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'gitlab' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                    GitLab 集成
                  </h2>

                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        GitLab 服务器地址
                      </label>
                      <input
                        type="url"
                        value={config.gitlabUrl}
                        onChange={(e) => setConfig({ ...config, gitlabUrl: e.target.value })}
                        placeholder="https://gitlab.com"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        Access Token
                      </label>
                      <input
                        type="password"
                        value={config.gitlabToken}
                        onChange={(e) => setConfig({ ...config, gitlabToken: e.target.value })}
                        placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                      />
                      <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                        需要 api 权限的 Personal Access Token
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                        默认项目 ID 或路径
                      </label>
                      <input
                        type="text"
                        value={config.gitlabDefaultProject}
                        onChange={(e) => setConfig({ ...config, gitlabDefaultProject: e.target.value })}
                        placeholder="namespace/project"
                        className="w-full px-4 py-3 rounded-xl bg-[var(--color-bg-surface)] border border-white/10 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary-500)] transition-all"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                    通知设置
                  </h2>

                  <div className="space-y-4">
                    {[
                      { key: 'taskCreated', label: '新任务创建', desc: '当有人创建新任务时通知' },
                      { key: 'taskCompleted', label: '任务完成', desc: '当任务被完成时通知' },
                      { key: 'shadowStatus', label: '分身状态变更', desc: '当影子分身状态变化时通知' }
                    ].map((item) => (
                      <div
                        key={item.key}
                        className="flex items-center justify-between p-4 rounded-xl bg-[var(--color-bg-surface)]"
                      >
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">{item.label}</div>
                          <div className="text-sm text-[var(--color-text-muted)]">{item.desc}</div>
                        </div>
                        <button
                          onClick={() => setConfig({
                            ...config,
                            notifications: {
                              ...config.notifications,
                              [item.key]: !config.notifications[item.key as keyof typeof config.notifications]
                            }
                          })}
                          className={`relative w-14 h-7 rounded-full transition-colors ${
                            config.notifications[item.key as keyof typeof config.notifications]
                              ? 'bg-[var(--color-primary-500)]'
                              : 'bg-[var(--color-bg-surface-hover)]'
                          }`}
                        >
                          <motion.div
                            animate={{ x: config.notifications[item.key as keyof typeof config.notifications] ? 28 : 2 }}
                            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'security' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-card p-6"
                >
                  <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">
                    安全设置
                  </h2>

                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-warning)]/30">
                      <div className="flex items-start gap-3">
                        <Shield size={20} className="text-[var(--color-warning)] mt-0.5" />
                        <div>
                          <div className="font-medium text-[var(--color-text-primary)]">
                            本地部署
                          </div>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            此系统部署在本地网络内，只有同一网络的用户可以访问。请勿将服务暴露到公网。
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="font-medium text-[var(--color-text-primary)] mb-3">
                        数据存储
                      </h3>
                      <ul className="space-y-2 text-sm text-[var(--color-text-secondary)]">
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-[var(--color-success)]" />
                          SQLite 数据库本地存储
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-[var(--color-success)]" />
                          API 密钥环境变量存储
                        </li>
                        <li className="flex items-center gap-2">
                          <Check size={16} className="text-[var(--color-success)]" />
                          参数化查询防止 SQL 注入
                        </li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button onClick={handleSave} className="btn-primary">
                  {saved ? (
                    <>
                      <Check size={18} />
                      已保存
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      保存设置
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
