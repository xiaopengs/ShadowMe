import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import {
  getAllApiKeys,
  createApiKey,
  ApiKeyPublic,
  getApiKeyByIdWithText,
  ApiKeyWithText
} from '@/lib/db';
import { logger } from '@/lib/logger';

const apiLogger = logger.child({ module: 'api/api-keys' });

function generateId(): string {
  return `key_${Date.now()}_${randomBytes(8).toString('hex')}`;
}

function generateApiKey(): { fullKey: string; keyHash: string; keyPrefix: string } {
  const randomPart = randomBytes(32);
  const fullKey = `sm_${randomPart.toString('hex')}`;
  const keyHash = createHash('sha256').update(fullKey).digest('hex');
  const keyPrefix = `sm_${randomPart.toString('hex').substring(0, 8)}...`;

  return { fullKey, keyHash, keyPrefix };
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const keyId = url.searchParams.get('id');

    if (keyId) {
      const key = await getApiKeyByIdWithText(keyId);
      if (!key) {
        return NextResponse.json(
          { error: 'API key not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        key,
      });
    }

    const keys = await getAllApiKeys();

    return NextResponse.json({
      success: true,
      keys,
      count: keys.length,
    });
  } catch (error) {
    apiLogger.error('Failed to list API keys', error);
    return NextResponse.json(
      { error: 'Failed to list API keys' },
      { status: 500 }
    );
  }
}

interface CreateApiKeyRequest {
  name: string;
  permissions?: string;
  expiresInDays?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as CreateApiKeyRequest;

    if (!body.name || typeof body.name !== 'string') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    const name = body.name.trim();
    if (name.length < 1 || name.length > 100) {
      return NextResponse.json(
        { error: 'Name must be between 1 and 100 characters' },
        { status: 400 }
      );
    }

    const permissions = body.permissions || 'webhook';
    if (!['webhook', 'full'].includes(permissions)) {
      return NextResponse.json(
        { error: 'Invalid permissions. Must be "webhook" or "full"' },
        { status: 400 }
      );
    }

    let expiresAt: string | undefined;
    if (body.expiresInDays && body.expiresInDays > 0) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + body.expiresInDays);
      expiresAt = expiryDate.toISOString();
    }

    const id = generateId();
    const { fullKey, keyHash, keyPrefix } = generateApiKey();

    const keyRecord = await createApiKey({
      id,
      name,
      key_text: fullKey,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      permissions,
      expires_at: expiresAt,
    });

    apiLogger.info('API key created', { id, name, permissions });

    return NextResponse.json({
      success: true,
      key: {
        id: keyRecord.id,
        name: keyRecord.name,
        key: fullKey,
        keyPrefix: keyRecord.key_prefix,
        permissions: keyRecord.permissions,
        createdAt: keyRecord.created_at,
        expiresAt: keyRecord.expires_at,
      },
    });

  } catch (error) {
    apiLogger.error('Failed to create API key', error);
    return NextResponse.json(
      { error: 'Failed to create API key' },
      { status: 500 }
    );
  }
}
