import { NextRequest, NextResponse } from 'next/server';
import { aiServiceManager } from '@/lib/ai/ai-service-manager-unified';
import { memoryContextProvider } from '@/lib/ai/memory-context-provider';
import type { StudyBuddyApiRequest, StudyBuddyApiResponse } from '@/types/study-buddy';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `study-buddy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${requestId}] Processing study buddy request`);

    // Parse request body and save for error handling
    const body = await request.json() as any;

    // Detect if this is a personal question
    const isPersonalQuery = body.message?.toLowerCase().includes('my name') ||
                           body.message?.toLowerCase().includes('do you know') ||
                           body.message?.toLowerCase().includes('who am i') ||
                           body.message?.toLowerCase().includes('what is my');

    // Validate required fields (conversationId is optional - will be generated if not provided)
    if (!body.userId || !body.message || !body.operation) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: userId, message, operation'
        }
      }, { status: 400 });
    }

    // Generate conversationId if not provided
    if (!body.conversationId) {
      body.conversationId = `conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    // Only handle 'chat' operation for now
    if (body.operation !== 'chat') {
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: 'Only "chat" operation is currently supported'
        }
      }, { status: 400 });
    }

    // Get memory context for personal queries
    let memoryContext = '';
    if (isPersonalQuery && body.userId && body.message) {
      try {
        console.log(`[${requestId}] Getting memory context for personal query`);
        const memoryResult = await memoryContextProvider.getMemoryContext({
          userId: body.userId,
          query: body.message,
          chatType: 'study_assistant',
          isPersonalQuery: true,
          contextLevel: 'comprehensive',
          limit: 8
        });
        
        if (memoryResult.contextString) {
          memoryContext = memoryResult.contextString;
          console.log(`[${requestId}] Found ${memoryResult.memories.length} relevant memories`);
        }
      } catch (memoryError) {
        console.warn(`[${requestId}] Failed to get memory context:`, memoryError);
      }
    }

    // Create study request for AI service manager
    const studyRequest: StudyBuddyApiRequest = {
      userId: body.userId,
      conversationId: body.conversationId,
      message: body.message,
      chatType: 'study_assistant'
    };

    // Enhanced message with memory context for personal queries
    let enhancedMessage = body.message;
    if (isPersonalQuery && memoryContext) {
      enhancedMessage = `${memoryContext}\n\nUser's current question: ${body.message}`;
      console.log(`[${requestId}] Enhanced message with memory context (${memoryContext.length} chars)`);
    }

    // Process through AI service manager
    const aiResponse = await aiServiceManager.processQuery({
      userId: studyRequest.userId,
      conversationId: studyRequest.conversationId,
      message: enhancedMessage,
      chatType: studyRequest.chatType,
      includeAppData: false
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        response: {
          content: aiResponse.content,
          model_used: aiResponse.model_used,
          provider_used: aiResponse.provider,
          tokens_used: aiResponse.tokens_used,
          latency_ms: aiResponse.latency_ms,
          query_type: aiResponse.query_type,
          web_search_enabled: aiResponse.web_search_enabled,
          fallback_used: aiResponse.fallback_used,
          cached: aiResponse.cached,
          memory_references: memoryContext ? [`Memory context included: ${memoryContext.substring(0, 100)}...`] : []
        },
        conversationId: body.conversationId,
        timestamp: new Date().toISOString(),
        layer5Data: {
          orchestration: {
            success: true,
            layersProcessed: [2, 3], // AI service manager + memory integration
            processingTime: processingTime,
            optimizations: ['provider_fallback', ...(memoryContext ? ['memory_integration'] : [])]
          },
          performance: {
            optimized: memoryContext ? true : false,
            improvements: memoryContext ? ['memory_context_added'] : [],
            cacheHitRate: 0
          },
          compliance: {
            status: 'basic',
            score: 80,
            frameworksValidated: 0
          },
          monitoring: {
            sessionActive: true,
            healthStatus: 'healthy',
            lastUpdate: new Date().toISOString()
          }
        },
        metadata: {
          processingTime: processingTime,
          layersUsed: [2, ...(memoryContext ? [3] : [])],
          optimizationsApplied: ['provider_fallback', ...(memoryContext ? ['memory_integration'] : [])],
          complianceValidated: [],
          systemHealth: 'healthy'
        }
      },
      monitoring: {
        sessionActive: true,
        healthStatus: 'healthy',
        recommendations: memoryContext ? ['Memory context successfully integrated'] : [],
        alerts: []
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Study Buddy API error:`, error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      data: {
        sessionId: 'error',
        timestamp: new Date().toISOString(),
        metadata: {
          processingTime,
          layersUsed: [],
          optimizationsApplied: [],
          complianceValidated: [],
          systemHealth: 'error'
        }
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'health') {
      return NextResponse.json({
        success: true,
        data: {
          system: {
            status: 'healthy',
            layer5: {
              initialized: true,
              services: {
                orchestration: false, // Simplified version
                integration: false,
                monitoring: false,
                optimization: false,
                compliance: false
              }
            }
          },
          timestamp: new Date().toISOString()
        }
      });
    }

    // Default health check
    return NextResponse.json({
      success: true,
      data: {
        status: 'Study Buddy API is operational (Simplified Version)',
        version: '2.0.0-simplified',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Study Buddy API GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Health check failed'
      }
    }, { status: 500 });
  }
}