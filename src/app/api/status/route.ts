import { NextResponse } from 'next/server';
import { get } from '@/lib/db';

export async function GET() {
  try {
    const shadowRow = await get('SELECT * FROM shadow_status WHERE id = ?', ['shadow-1']) as any;

    const shadow = shadowRow ? {
      id: shadowRow.id,
      name: shadowRow.name,
      status: shadowRow.status,
      lastHeartbeat: shadowRow.last_heartbeat,
    } : {
      id: 'shadow-1',
      name: 'ShadowMe',
      status: 'offline',
      lastHeartbeat: null,
    };

    const taskStats = await get(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as inProgress,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) as closed
      FROM tasks
    `) as any;

    return NextResponse.json({
      status: 'ok',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      board: {
        totalTasks: taskStats?.total || 0,
        pendingTasks: taskStats?.pending || 0,
        inProgressTasks: taskStats?.inProgress || 0,
        completedTasks: taskStats?.completed || 0,
        closedTasks: taskStats?.closed || 0,
      },
      shadow,
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      error: 'Failed to fetch status',
    }, { status: 500 });
  }
}
