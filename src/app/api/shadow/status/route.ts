import { NextResponse } from 'next/server';
import { get, run } from '@/lib/db';
import { logger } from '@/lib/logger';
import { broadcastToChannel } from '@/lib/sse-manager';
import type { ShadowState, ShadowStatus } from '@/types';

const apiLogger = logger.child({ module: 'api/shadow/status' });

export async function GET() {
  try {
    const row = await get('SELECT * FROM shadow_status WHERE id = ?', ['shadow-1']) as any;

    if (!row) {
      const defaultShadow: ShadowState = {
        id: 'shadow-1',
        name: '影子分身',
        status: 'offline',
        lastHeartbeat: new Date().toISOString(),
        capabilities: [],
        autoTakeTasks: false
      };
      return NextResponse.json(defaultShadow);
    }

    const shadow: ShadowState = {
      id: row.id,
      name: row.name,
      status: row.status as ShadowStatus,
      currentTaskId: row.current_task_id,
      lastHeartbeat: row.last_heartbeat,
      capabilities: JSON.parse(row.capabilities || '[]'),
      autoTakeTasks: Boolean(row.auto_take_tasks)
    };

    if (shadow.currentTaskId) {
      const task = await get('SELECT * FROM tasks WHERE id = ?', [shadow.currentTaskId]) as any;
      if (task) {
        shadow.currentTask = {
          id: task.id,
          title: task.title,
          type: task.type,
          priority: task.priority,
          status: task.status,
          description: task.description || '',
          tags: JSON.parse(task.tags || '[]'),
          attachments: JSON.parse(task.attachments || '[]'),
          expectedDelivery: task.expected_delivery,
          result: task.result ? JSON.parse(task.result) : undefined,
          createdBy: task.created_by,
          createdAt: task.created_at,
          updatedAt: task.updated_at,
          startedAt: task.started_at,
          completedAt: task.completed_at,
          dueDate: task.due_date
        };
      }
    }

    // Use debug level instead of info to reduce log noise
    apiLogger.debug('Shadow status fetched', {
      status: shadow.status,
      currentTaskId: shadow.currentTaskId
    });
    return NextResponse.json(shadow);
  } catch (error) {
    apiLogger.error('Error fetching shadow status', error, { operation: 'GET' });
    return NextResponse.json({ error: 'Failed to fetch shadow status' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { status, capabilities, autoTakeTasks } = body;

    const updates: string[] = [];
    const values: any[] = [];

    if (status !== undefined) {
      updates.push('status = ?');
      values.push(status);
    }
    if (capabilities !== undefined) {
      updates.push('capabilities = ?');
      values.push(JSON.stringify(capabilities));
    }
    if (autoTakeTasks !== undefined) {
      updates.push('auto_take_tasks = ?');
      values.push(autoTakeTasks ? 1 : 0);
    }

    updates.push('last_heartbeat = ?');
    values.push(new Date().toISOString());

    if (updates.length > 1) {
      await run(`UPDATE shadow_status SET ${updates.join(', ')} WHERE id = 'shadow-1'`, values);
    }

    const row = await get('SELECT * FROM shadow_status WHERE id = ?', ['shadow-1']) as any;

    const shadowState: ShadowState = {
      id: row.id,
      name: row.name,
      status: row.status as ShadowStatus,
      currentTaskId: row.current_task_id,
      lastHeartbeat: row.last_heartbeat,
      capabilities: JSON.parse(row.capabilities || '[]'),
      autoTakeTasks: Boolean(row.auto_take_tasks)
    };

    // Broadcast shadow status update via SSE so frontend can receive it in real-time
    broadcastToChannel('shadow', 'shadow:status', shadowState);

    // Use debug level to reduce log noise for frequent heartbeat calls
    apiLogger.debug('Shadow status updated', {
      status: row.status,
      autoTakeTasks: autoTakeTasks
    });

    return NextResponse.json(shadowState);
  } catch (error) {
    apiLogger.error('Error updating shadow status', error, { operation: 'POST' });
    return NextResponse.json({ error: 'Failed to update shadow status' }, { status: 500 });
  }
}
