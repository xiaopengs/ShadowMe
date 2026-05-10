/**
 * API Key Delete Endpoint
 * Endpoint: DELETE /api/api-keys/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { getApiKeyById, deleteApiKey } from '@/lib/db';
import { logger } from '@/lib/logger';

const apiLogger = logger.child({ module: 'api/api-keys/delete' });

/**
 * DELETE /api/api-keys/[id] - Delete an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'API key ID is required' },
        { status: 400 }
      );
    }

    // Check if the key exists
    const existingKey = getApiKeyById(id);
    if (!existingKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Delete the key
    const deleted = deleteApiKey(id);

    if (deleted) {
      apiLogger.info('API key deleted', { id, name: existingKey.name });
      return NextResponse.json({
        success: true,
        message: 'API key deleted successfully',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to delete API key' },
        { status: 500 }
      );
    }

  } catch (error) {
    apiLogger.error('Failed to delete API key', error);
    return NextResponse.json(
      { error: 'Failed to delete API key' },
      { status: 500 }
    );
  }
}
