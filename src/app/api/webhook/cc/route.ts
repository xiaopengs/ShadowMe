import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { processCCMessage, validateCCMessage, getCCProtocolVersion } from '@/lib/cc-protocol';
import { broadcastToChannel } from '@/lib/sse-manager';
import { getApiKeyByHash, updateApiKeyLastUsed, isApiKeyExpired } from '@/lib/db';
import { logger } from '@/lib/logger';

const webhookLogger = logger.child({ module: 'api/webhook/cc' });

const CC_API_KEY = process.env.CC_WEBHOOK_API_KEY || process.env.CC_API_KEY;
const API_KEY_HEADER = 'x-cc-api-key';
const API_KEY_PARAM = 'api_key';

function getRequestApiKey(request: NextRequest): string | null {
  const headerKey = request.headers.get(API_KEY_HEADER);
  if (headerKey) {
    return headerKey;
  }

  const url = new URL(request.url);
  const paramKey = url.searchParams.get(API_KEY_PARAM);
  if (paramKey) {
    return paramKey;
  }

  return null;
}

async function validateAPIKey(request: NextRequest): Promise<{ valid: boolean; keyId?: string }> {
  const requestKey = getRequestApiKey(request);

  if (!requestKey) {
    if (!CC_API_KEY) {
      webhookLogger.warn('No API key provided and CC_WEBHOOK_API_KEY not configured, allowing all requests (development mode)');
      return { valid: true };
    }
    return { valid: false };
  }

  const keyHash = createHash('sha256').update(requestKey).digest('hex');
  const dbKey = await getApiKeyByHash(keyHash);

  if (dbKey) {
    if (isApiKeyExpired(dbKey)) {
      webhookLogger.warn('Expired API key used', { keyId: dbKey.id });
      return { valid: false };
    }

    updateApiKeyLastUsed(dbKey.id);
    webhookLogger.info('Request authenticated via database API key', { keyId: dbKey.id });
    return { valid: true, keyId: dbKey.id };
  }

  if (requestKey === CC_API_KEY) {
    return { valid: true };
  }

  return { valid: false };
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  const authResult = await validateAPIKey(request);
  if (!authResult.valid) {
    webhookLogger.warn('Unauthorized webhook attempt', {
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    });
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing API key' },
      { status: 401 }
    );
  }

  try {
    const contentType = request.headers.get('content-type');
    let body: unknown;

    if (contentType?.includes('application/json')) {
      body = await request.json();
    } else if (contentType?.includes('text/plain')) {
      const text = await request.text();
      try {
        body = JSON.parse(text);
      } catch {
        return NextResponse.json(
          { error: 'Invalid JSON' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported content type' },
        { status: 415 }
      );
    }

    if (!validateCCMessage(body)) {
      webhookLogger.warn('Invalid CC message format', { body });
      return NextResponse.json(
        { error: 'Invalid message format', message: 'Missing required fields or unknown message type' },
        { status: 400 }
      );
    }

    webhookLogger.info('Received CC webhook', {
      type: (body as any).type,
      messageId: (body as any).messageId,
      senderId: (body as any).senderId,
    });

    const result = await processCCMessage(body);

    broadcastToChannel('webhook', 'cc:event', {
      type: (body as any).type,
      messageId: (body as any).messageId,
      success: result.success,
      timestamp: new Date().toISOString(),
    });

    const processingTime = Date.now() - startTime;
    webhookLogger.info('CC webhook processed', {
      type: (body as any).type,
      success: result.success,
      processingTime,
    });

    return NextResponse.json({
      success: result.success,
      messageId: (body as any).messageId,
      processingTime,
      ...(result.error && { error: result.error }),
    });

  } catch (error) {
    webhookLogger.error('Error processing CC webhook', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await validateAPIKey(request);
  if (!authResult.valid) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { error: 'Expected array of messages' },
        { status: 400 }
      );
    }

    const results = [];
    for (const message of body) {
      if (!validateCCMessage(message)) {
        results.push({
          messageId: (message as any).messageId,
          success: false,
          error: 'Invalid message format',
        });
        continue;
      }

      const result = await processCCMessage(message);
      results.push({
        messageId: (message as any).messageId,
        success: result.success,
        ...(result.error && { error: result.error }),
      });
    }

    webhookLogger.info('Batch CC webhook processed', {
      total: body.length,
      successful: results.filter(r => r.success).length,
    });

    return NextResponse.json({
      total: body.length,
      results,
    });

  } catch (error) {
    webhookLogger.error('Error processing batch CC webhook', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    protocol: 'CC-Webhook-v1',
    version: getCCProtocolVersion(),
    timestamp: new Date().toISOString(),
  });
}
