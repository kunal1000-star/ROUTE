// Main Chat API Route - Enhanced with Error Handling
// ==================================================

import { NextRequest, NextResponse } from 'next/server';
import type { AIProvider } from '@/types/api-test';
import type { ChatType } from '@/types/ai-service-manager';

// Simple request/response interfaces for this route
interface ChatMessageRequest {
  message: string;
  provider?: AIProvider;
  context?: any;
  preferences?: any;
  sessionId?: string;
}

interface ChatMessageResponse {
  success: boolean;
  data?: {
    response: any;
    sessionId: string;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
  metadata?: {
    timestamp: string;
    requestId: string;
    processingTime: number;
  };
}

// Graceful AI service manager initialization with fallbacks
async function getChatServiceSafely() {
  try {
    // Import the unified AI service manager
    const { aiServiceManager } = await import('@/lib/ai/ai-service-manager-unified');
    
    try {
      // Test the service manager health
      const health = await aiServiceManager.healthCheck();
      const hasHealthyProviders = Object.values(health).some(h => h.healthy);
      
      return { 
        service: aiServiceManager, 
        error: null, 
        initialized: hasHealthyProviders,
        health 
      };
    } catch (healthError) {
      console.warn('AI service manager health check failed:', healthError);
      return {
        service: aiServiceManager,
        error: healthError instanceof Error ? healthError.message : String(healthError),
        initialized: false,
        reason: 'AI service manager health check failed'
      };
    }
  } catch (importError) {
    console.warn('AI service manager import failed:', importError instanceof Error ? importError.message : String(importError));
    return {
      service: null,
      error: importError instanceof Error ? importError.message : String(importError),
      initialized: false,
      reason: 'AI service manager modules not available'
    };
  }
}

// Mock response for when chat service is unavailable
function createMockChatResponse(message: string): any {
  return {
    id: `mock-${Date.now()}`,
    content: `Hello! I'm currently in offline mode, but I received your message: "${message}". The AI chat service is temporarily unavailable. Please try again later.`,
    provider: 'mock',
    model: 'offline-mode',
    tokensUsed: 0,
    timestamp: new Date(),
    metadata: {
      offlineMode: true,
      originalMessage: message
    }
  };
}

// POST /api/chat - Send a chat message
export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Parse request body
    const body = await request.json() as ChatMessageRequest;
    
    // Validate required fields
    if (!body.message || typeof body.message !== 'string') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Message is required and must be a string',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTime: Date.now() - startTime,
        },
      }, { status: 400 });
    }

    // Validate provider if specified
    if (body.provider && !['groq', 'cerebras', 'mistral', 'openrouter', 'gemini', 'cohere'].includes(body.provider)) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_PROVIDER',
          message: `Unsupported provider: ${body.provider}`,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId,
          processingTime: Date.now() - startTime,
        },
      }, { status: 400 });
    }

    // Get chat service safely with fallback
    const { service: chatService, initialized } = await getChatServiceSafely();
    
    let response;
    let sessionId = body.sessionId;

    if (chatService && initialized) {
      try {
        // Convert API request to unified AI service manager format
        const aiRequest = {
          userId: body.sessionId || 'anonymous',
          conversationId: body.sessionId || `conv-${Date.now()}`,
          message: body.message,
          chatType: 'general' as ChatType,
          includeAppData: false
        };

        // Send message using unified AI service manager
        response = await chatService.processQuery(aiRequest);
        sessionId = aiRequest.conversationId;
      } catch (serviceError) {
        console.warn('Chat service error, using mock response:', serviceError);
        response = createMockChatResponse(body.message);
        sessionId = sessionId || `mock-session-${Date.now()}`;
      }
    } else {
      // Chat service unavailable, return mock response
      response = createMockChatResponse(body.message);
      sessionId = sessionId || `mock-session-${Date.now()}`;
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        response,
        sessionId,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTime: Date.now() - startTime,
        serviceInitialized: initialized,
      },
    });

  } catch (error) {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    console.error('Chat API error:', error);
    
    // Determine error type and retryability
    let errorCode = 'INTERNAL_ERROR';
    let errorMessage = 'An unexpected error occurred';
    let statusCode = 500;
    let retryable = false;

    if (error instanceof Error) {
      if (error.message.includes('No healthy providers')) {
        errorCode = 'NO_PROVIDERS_AVAILABLE';
        errorMessage = 'No AI providers are currently available';
        statusCode = 503;
        retryable = true;
      } else if (error.message.includes('API key')) {
        errorCode = 'AUTHENTICATION_ERROR';
        errorMessage = 'Authentication failed';
        statusCode = 401;
        retryable = false;
      } else if (error.message.includes('Rate limit')) {
        errorCode = 'RATE_LIMITED';
        errorMessage = 'Rate limit exceeded';
        statusCode = 429;
        retryable = true;
      } else if (error.message.includes('timeout')) {
        errorCode = 'REQUEST_TIMEOUT';
        errorMessage = 'Request timed out';
        statusCode = 408;
        retryable = true;
      }
    }

    return NextResponse.json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
        details: error instanceof Error ? error.message : String(error),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId,
        processingTime: Date.now() - startTime,
      },
    }, { status: statusCode });
  }
}

// GET /api/chat - Get chat service health and capabilities
export async function GET() {
  try {
    // Get chat service safely with fallback
    const { service: chatService, initialized } = await getChatServiceSafely();
    
    let serviceInfo = {
      healthy: false,
      version: '1.0.0',
      offlineMode: true,
    };
    
    let providers: any[] = [];
    let capabilities = {
      streaming: false,
      fallback: false,
      sessionManagement: false,
      studyContext: false,
    };
    
    if (chatService && initialized) {
      try {
        // Get service statistics from unified AI service manager
        const stats = await chatService.getStatistics();
        const health = await chatService.healthCheck();
        
        serviceInfo = {
          healthy: true,
          version: '1.0.0',
          offlineMode: false,
          providers: stats.providers,
        } as any;
        
        providers = stats.providers;
        
        capabilities = {
          streaming: false,
          fallback: true,
          sessionManagement: true,
          studyContext: true,
        };
      } catch (serviceError) {
        console.warn('Chat service health check failed:', serviceError);
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        service: serviceInfo,
        providers,
        capabilities,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        serviceInitialized: initialized,
      },
    });

  } catch (error) {
    console.error('Chat service health check error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Chat service is not available',
        details: error instanceof Error ? error.message : String(error),
      },
      metadata: {
        timestamp: new Date().toISOString(),
      },
    }, { status: 503 });
  }
}