/**
 * Webhook Receiver for Claude Code (CC) Events
 * Endpoint: POST /api/webhook/cc
 * 
 * Receives events from CC plugins and processes them through the CC protocol
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { processCCMessage, validateCCMessage, getCCProtocolVersion } from '@/lib/cc-protocol';
import { broadcastToChannel } from '@/lib/sse-manager';
import { getApiKeyByHash, updateApiKeyLastUsed, isApiKeyExpired } from '@/lib/db';
import { logger } from '@/lib/logger';

const webhookLogger = logger.child({ module: 'api/webhook/cc' });

// API Key validation
const CC_API_KEY = process.env.CC_WEBHOOK_API_KEY || process.env.CC_API_KEY;
const API_KEY_HEADER = 'x-cc-api-key';
const API_KEY_PARAM = 'api_key';

/**
 * Get the API key from request (header or query param)
 */
function getRequestApiKey(request: NextRequest): string | null {
  // Check header first
  const headerKey = request.headers.get(API_KEY_HEADER);
  if (headerKey) {
    return headerKey;
  }

  // Check query param
  const url = new URL(request.url);
  const paramKey = url.searchParams.get(API_KEY_PARAM);
  if (paramKey) {
    return paramKey;
  }

  return null;
}

/**
 * Validate API Key from request
 * Priority:
 * 1. Database API Keys (hash comparison)
 * 2. Environment variable CC_WEBHOOK_API_KEY (backward compatibility)
 * 3. Allow all if no configuration (development mode)
 */
async function validateAPIKey(request: NextRequest): Promise<{ valid: boolean; keyId?: string }> {
  const requestKey = getRequestApiKey(request);
  
  if (!requestKey) {
    // No key provided
    if (!CC_API_KEY) {
      webhookLogger.warn('No API key provided and CC_WEBHOOK_API_KEY not configured, allowing all requests (development mode)');
      return { valid: true }; // Development mode
    }
    return { valid: false };
  }

  // 1. First try database API keys (hash comparison)
  const keyHash = createHash('sha256').update(requestKey).digest('hex');
  const dbKey = getApiKeyByHash(keyHash);
  
  if (dbKey) {
    // Check expiration
    if (isApiKeyExpired(dbKey)) {
      webhookLogger.warn('Expired API key used', { keyId: dbKey.id });
      return { valid: false };
    }
    
    // Update last used timestamp (async, don't wait)
    updateApiKeyLastUsed(dbKey.id);
    webhookLogger.info('Request authenticated via database API key', { keyId: dbKey.id });
    return { valid: true, keyId: dbKey.id };
  }

  // 2. Fallback to environment variable (backward compatibility)
  if (requestKey === CC_API_KEY) {
    return { valid: true };
  }

  return { valid: false };
}

/**
 * Handle CC webhook events
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // Validate API Key
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
    // Parse request body
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

    // Validate message structure
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

    // Process the message through CC protocol
    const result = await processCCMessage(body);

    // Broadcast to all connected clients
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

/**
 * Handle CC webhook events (batch endpoint)
 */
export async function PUT(request: NextRequest) {
  // Validate API Key
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

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    protocol: 'CC-Webhook-v1',
    version: getCCProtocolVersion(),
    timestamp: new Date().toISOString(),
  });
}
