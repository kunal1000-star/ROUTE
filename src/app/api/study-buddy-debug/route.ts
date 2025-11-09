import { NextRequest, NextResponse } from 'next/server';
import { aiServiceManager } from '@/lib/ai/ai-service-manager-unified';
import { memoryContextProvider } from '@/lib/ai/memory-context-provider';
import type { StudyBuddyApiRequest, StudyBuddyApiResponse } from '@/types/study-buddy';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `study-buddy-debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${requestId}] === STUDY BUDDY DEBUG REQUEST START ===`);
    console.log(`[${requestId}] Request ID: ${requestId}`);

    // Parse request body and save for error handling
    const body = await request.json() as any;
    console.log(`[${requestId}] Request body:`, JSON.stringify(body, null, 2));

    // Detect if this is a personal question
    const isPersonalQuery = body.message?.toLowerCase().includes('my name') ||
                           body.message?.toLowerCase().includes('do you know') ||
                           body.message?.toLowerCase().includes('who am i') ||
                           body.message?.toLowerCase().includes('what is my');

    console.log(`[${requestId}] Personal query detected:`, isPersonalQuery);
    console.log(`[${requestId}] Message: "${body.message}"`);

    // Validate required fields
    if (!body.userId || !body.message || !body.operation) {
      console.log(`[${requestId}] ❌ INVALID REQUEST - Missing fields`);
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
      body.conversationId = `debug-conv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      console.log(`[${requestId}] Generated conversationId: ${body.conversationId}`);
    }

    // Only handle 'chat' operation for now
    if (body.operation !== 'chat') {
      console.log(`[${requestId}] ❌ UNSUPPORTED OPERATION: ${body.operation}`);
      return NextResponse.json({
        success: false,
        error: {
          code: 'UNSUPPORTED_OPERATION',
          message: 'Only "chat" operation is currently supported'
        }
      }, { status: 400 });
    }

    console.log(`[${requestId}] === MEMORY CONTEXT RETRIEVAL START ===`);
    
    // Get memory context for personal queries
    let memoryContext = '';
    let memoryResult = null;
    
    if (isPersonalQuery && body.userId && body.message) {
      try {
        console.log(`[${requestId}] 🧠 CALLING memoryContextProvider.getMemoryContext()`);
        console.log(`[${requestId}] Parameters:`, {
          userId: body.userId,
          query: body.message,
          chatType: 'study_assistant',
          isPersonalQuery: true,
          contextLevel: 'comprehensive',
          limit: 8
        });
        
        memoryResult = await memoryContextProvider.getMemoryContext({
          userId: body.userId,
          query: body.message,
          chatType: 'study_assistant',
          isPersonalQuery: true,
          contextLevel: 'comprehensive',
          limit: 8
        });
        
        console.log(`[${requestId}] ✅ Memory context provider SUCCESS`);
        console.log(`[${requestId}] Memory result:`, {
          memoriesFound: memoryResult?.memories?.length || 0,
          contextStringLength: memoryResult?.contextString?.length || 0,
          personalFactsCount: memoryResult?.personalFacts?.length || 0
        });
        
        if (memoryResult.contextString) {
          memoryContext = memoryResult.contextString;
          console.log(`[${requestId}] 📝 Memory context string: "${memoryContext.substring(0, 200)}..."`);
        } else {
          console.log(`[${requestId}] ❌ No memory context string returned`);
        }
        
      } catch (memoryError) {
        console.log(`[${requestId}] ❌ MEMORY CONTEXT PROVIDER FAILED:`, memoryError);
        console.log(`[${requestId}] Memory error details:`, {
          message: memoryError instanceof Error ? memoryError.message : 'Unknown error',
          stack: memoryError instanceof Error ? memoryError.stack : undefined
        });
      }
    } else {
      console.log(`[${requestId}] ⏭️ SKIPPING memory context (not personal query or missing params)`);
    }

    console.log(`[${requestId}] === AI SERVICE MANAGER START ===`);

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
      console.log(`[${requestId}] 📋 Enhanced message created (${memoryContext.length} chars memory context)`);
    } else {
      console.log(`[${requestId}] 📋 Using original message (no memory context)`);
    }

    console.log(`[${requestId}] 🚀 CALLING aiServiceManager.processQuery()`);
    console.log(`[${requestId}] AI Request params:`, JSON.stringify({
      userId: studyRequest.userId,
      conversationId: studyRequest.conversationId,
      message: enhancedMessage.substring(0, 100) + '...',
      chatType: studyRequest.chatType
    }, null, 2));

    // Process through AI service manager
    const aiResponse = await aiServiceManager.processQuery({
      userId: studyRequest.userId,
      conversationId: studyRequest.conversationId,
      message: enhancedMessage,
      chatType: studyRequest.chatType,
      includeAppData: false
    });

    console.log(`[${requestId}] ✅ AI Service Manager SUCCESS`);
    console.log(`[${requestId}] AI Response:`, {
      contentLength: aiResponse.content?.length || 0,
      modelUsed: aiResponse.model_used,
      provider: aiResponse.provider,
      cached: aiResponse.cached
    });

    const processingTime = Date.now() - startTime;

    // Determine layers used
    const layersUsed = [2]; // AI layer is always used
    if (isPersonalQuery && memoryContext) {
      layersUsed.push(3); // Add memory layer if we have context
    }

    console.log(`[${requestId}] === FINAL RESPONSE ASSEMBLY ===`);
    console.log(`[${requestId}] Layers used:`, layersUsed);
    console.log(`[${requestId}] Memory references count:`, memoryContext ? 1 : 0);
    console.log(`[${requestId}] Processing time: ${processingTime}ms`);

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
            layersProcessed: layersUsed,
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
          layersUsed: layersUsed,
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
      },
      debug: {
        requestId: requestId,
        memoryContext: {
          found: !!memoryContext,
          length: memoryContext.length,
          memoriesCount: memoryResult?.memories?.length || 0,
          personalFactsCount: memoryResult?.personalFacts?.length || 0
        }
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Study Buddy API error:`, error);
    console.error(`[${requestId}] Error stack:`, error instanceof Error ? error.stack : 'No stack');

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
      },
      debug: {
        requestId: requestId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Study Buddy DEBUG API - GET request received');
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
        status: 'Study Buddy DEBUG API is operational',
        version: '2.0.0-debug',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Study Buddy DEBUG API GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: error instanceof Error ? error.message : 'Health check failed'
      }
    }, { status: 500 });
  }
}