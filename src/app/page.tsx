'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { Bot, Zap, Users, GitBranch, ArrowDown, ExternalLink } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import ShadowStatus from '@/components/shadow/ShadowStatus';
import KanbanBoard from '@/components/board/KanbanBoard';
import { useApp } from '@/context/AppContext';

export default function HomePage() {
  const { state } = useApp();
  const heroRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(titleRef.current, {
        opacity: 0,
        y: 40,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.2,
      });
      gsap.from(subtitleRef.current, {
        opacity: 0,
        y: 30,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.4,
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  const scrollToBoard = () => {
    document.getElementById('board')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section
        ref={heroRef}
        className="relative min-h-[60vh] flex items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-bg-base)] via-[var(--color-bg-elevated)] to-[var(--color-bg-base)]" />

        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[var(--color-primary-500)] rounded-full opacity-10 blur-[120px] animate-float-orb" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[var(--color-secondary-500)] rounded-full opacity-10 blur-[100px] animate-float-orb-reverse" />

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTJoLTJ2Mmgyem0tNiA2aC0ydi00aDJ2NHptMC02di0yaC0ydjJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-light text-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--color-success)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--color-success)]"></span>
              </span>
              <span className="text-[var(--color-text-secondary)]">影子分身已就位</span>
            </div>
          </motion.div>

          <h1
            ref={titleRef}
            className="gradient-text-hero text-[clamp(2.5rem,8vw,4.5rem)] font-extrabold leading-[1.1] tracking-tight mb-6"
          >
            当主角不在时
            <br />
            影子替他战斗
          </h1>

          <p
            ref={subtitleRef}
            className="text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto mb-10"
          >
            智能影子分身协作看板 - 任务直达 Claude Code，结果返回 GitLab
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={scrollToBoard}
              className="btn-primary"
            >
              <Zap size={18} />
              进入看板
            </button>
            <button className="btn-secondary">
              <ExternalLink size={18} />
              了解更多
            </button>
          </div>
        </div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        >
          <ArrowDown size={24} className="text-white/30" />
        </motion.div>
      </section>

      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <ShadowStatus />

              <div className="glass-card p-5 mt-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  快速统计
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-tertiary)]">总任务数</span>
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">{state.stats.total}</span>
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 rounded-xl bg-[var(--color-bg-surface)]">
                      <div className="text-xl font-bold text-[var(--color-info)]">{state.stats.pending}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">待领取</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--color-bg-surface)]">
                      <div className="text-xl font-bold text-[var(--color-warning)]">{state.stats.inProgress}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">处理中</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--color-bg-surface)]">
                      <div className="text-xl font-bold text-[var(--color-success)]">{state.stats.completed}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">已完成</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-[var(--color-bg-surface)]">
                      <div className="text-xl font-bold text-[var(--color-text-muted)]">{state.stats.closed}</div>
                      <div className="text-xs text-[var(--color-text-muted)]">已关闭</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card p-5 mt-4">
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                  功能特点
                </h3>
                <div className="space-y-3">
                  {[
                    { icon: Bot, title: '智能代理', desc: 'Claude Code 自动处理' },
                    { icon: GitBranch, title: 'GitLab 集成', desc: '代码直接提交' },
                    { icon: Users, title: '协作友好', desc: '无需复杂操作' },
                    { icon: Zap, title: '实时响应', desc: '状态即时同步' }
                  ].map((item, index) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-surface)]"
                    >
                      <div className="p-2 rounded-lg bg-[var(--color-primary-500)]/10">
                        <item.icon size={18} className="text-[var(--color-primary-400)]" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-[var(--color-text-primary)]">{item.title}</div>
                        <div className="text-xs text-[var(--color-text-muted)]">{item.desc}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3" id="board">
              <KanbanBoard tasks={state.tasks} />
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-[var(--color-primary-500)] to-[var(--color-secondary-500)] flex items-center justify-center">
              <span className="text-white text-xs font-bold">影</span>
            </div>
            <span className="text-sm text-[var(--color-text-muted)]">ShadowMe v1.0</span>
          </div>
          <p className="text-sm text-[var(--color-text-muted)]">
            当主角不在时，影子替他战斗
          </p>
        </div>
      </footer>
    </div>
  );
}
