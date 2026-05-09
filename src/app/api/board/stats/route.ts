import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';
import type { TaskStatus } from '@/types';

interface BoardStats {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  closed: number;
  avgCompletionTime?: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

export async function GET() {
  try {
    const db = getDatabase();

    const rows = db.prepare('SELECT status, priority, type, started_at, completed_at FROM tasks').all() as any[];

    const stats: BoardStats = {
      total: rows.length,
      pending: 0,
      inProgress: 0,
      completed: 0,
      closed: 0,
      byPriority: {},
      byType: {}
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

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching board stats:', error);
    return NextResponse.json({ error: 'Failed to fetch board stats' }, { status: 500 });
  }
}
