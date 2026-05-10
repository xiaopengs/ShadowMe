import { NextResponse } from 'next/server';
import { all, get } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getPendingTasksCount, getActiveShadowsCount } from '@/lib/task-lifecycle';
import type { TaskStatus } from '@/types';

const apiLogger = logger.child({ module: 'api/board/stats' });

interface BoardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  closed: number;
  avgCompletionTime?: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
  activeShadows: number;
  queuePosition: number;
  energyLevel: number;
  lastUpdated: string;
}

export async function GET() {
  try {
    const rows = await all('SELECT status, priority, type, started_at, completed_at FROM tasks', []) as any[];

    const stats: BoardStats = {
      total: rows.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      closed: 0,
      byPriority: {},
      byType: {},
      activeShadows: 0,
      queuePosition: 0,
      energyLevel: 0,
      lastUpdated: new Date().toISOString(),
    };

    let totalCompletionTime = 0;
    let completedCount = 0;

    rows.forEach((row) => {
      switch (row.status) {
        case 'pending': stats.pending++; break;
        case 'in_progress': stats.inProgress++; break;
        case 'completed': stats.completed++; break;
        case 'closed': stats.closed++; break;
      }

      stats.byPriority[row.priority] = (stats.byPriority[row.priority] || 0) + 1;
      stats.byType[row.type] = (stats.byType[row.type] || 0) + 1;

      if (row.status === 'completed' && row.started_at && row.completed_at) {
        const start = new Date(row.started_at).getTime();
        const end = new Date(row.completed_at).getTime();
        totalCompletionTime += (end - start);
        completedCount++;
      }
    });

    if (completedCount > 0) {
      stats.avgCompletionTime = Math.round(totalCompletionTime / completedCount / (1000 * 60));
    }

    try {
      stats.activeShadows = await getActiveShadowsCount();
    } catch {
      const shadowRows = await get(`
        SELECT COUNT(*) as count 
        FROM shadow_status 
        WHERE status IN ('online', 'busy')
      `, []) as { count: number } | undefined;
      stats.activeShadows = shadowRows?.count || 0;
    }

    stats.queuePosition = stats.pending;

    stats.energyLevel = Math.max(0, Math.min(100, 100 - (stats.pending * 10) - (stats.inProgress * 20)));

    apiLogger.info('Board stats fetched', {
      totalTasks: stats.total,
      activeShadows: stats.activeShadows,
      energyLevel: stats.energyLevel
    });
    return NextResponse.json(stats);
  } catch (error) {
    apiLogger.error('Error fetching board stats', error, { operation: 'GET' });
    return NextResponse.json({ error: 'Failed to fetch board stats' }, { status: 500 });
  }
}
