// Streaming Chat API Route - Enhanced with Error Handling
// ======================================================

import { NextRequest } from 'next/server';
import { getInitializedChatService } from '@/lib/ai/chat';
import type { AIProvider } from '@/types/api-test';

// Simple request interface
interface ChatApiRequest {
  message: string;
  provider?: AIProvider;
  context?: any;
  conversationId?: string;
  preferences?: any;
  sessionId?: string;
}

// Graceful chat service initialization
async function getChatServiceSafely() {
  try {
    const { getChatService, getInitializedChatService } = await import('@/lib/ai/chat/simple-index');
    
    try {
      const service = getChatService();
      return { service, error: null, initialized: true };
    } catch (getError) {
      const service = await getInitializedChatService();
      return { service, error: null, initialized: true };
    }
  } catch (importError) {
    console.warn('Chat service initialization failed:', importError instanceof Error ? importError.message : String(importError));
    return {
      service: null,
      error: importError instanceof Error ? importError.message : String(importError),
      initialized: false,
      reason: 'Chat service modules not available'
    };
  }
}

// Remove mock; will use real streaming
function createMockStreamingResponse(message: string, sessionId?: string) {
  return {
    id: `mock-stream-${Date.now()}`,
    content: `Streaming response for: "${message}". The advanced AI service is temporarily unavailable. This is a fallback response.`,
    provider: 'mock-stream',
    model: 'fallback-v1',
    tokensUsed: 25,
    timestamp: new Date(),
    metadata: {
      offlineMode: true,
      originalMessage: message
    }
  };
}

// POST /api/chat/stream - Stream a chat message (single-chunk reliability)
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body = await request.json() as ChatApiRequest;
    if (!body.message || typeof body.message !== 'string') {
      return new Response(
        encoder.encode(`data: ${JSON.stringify({ type: 'error', error: { code: 'INVALID_REQUEST', message: 'Message is required and must be a string' } })}\n\n`),
        { status: 400, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } }
      );
    }

    // Create a readable stream that emits start -> content -> end
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const { processQuery } = await import('@/lib/ai/ai-service-manager-unified');

          // start
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'start', data: { timestamp: new Date().toISOString(), provider: body.provider || 'auto' } })}\n\n`));

          // compute single response
          const resp = await processQuery({
            userId: body.sessionId || 'anonymous',
            conversationId: body.conversationId || body.sessionId || null,
            message: body.message,
            chatType: 'general',
            includeAppData: false,
            preferredProvider: body.provider as any,
          } as any);

          // optional metadata (include hint if graceful/system)
          const meta: any = { provider: resp.provider, model: resp.model_used };
          if ((resp as any).provider === 'system') {
            meta.hint = 'All providers failed. Check API keys for the selected provider or raise rate limits.';
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'metadata', data: meta })}\n\n`));

          // single content chunk
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'content', data: resp.content })}\n\n`));

          // end
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'end', data: { timestamp: new Date().toISOString() } })}\n\n`));
          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: { code: 'STREAMING_ERROR', message: error instanceof Error ? error.message : 'Streaming failed' } })}\n\n`));
          controller.close();
        }
      }
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Chat stream API error:', error);
    const errorResponse = { type: 'error', error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', details: error instanceof Error ? error.message : String(error) }, timestamp: new Date().toISOString() };
    return new Response(encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`), { status: 500, headers: { 'Content-Type': 'text/plain', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' } });
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}