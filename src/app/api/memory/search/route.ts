import { NextRequest, NextResponse } from 'next/server';
import { memoryContextProvider } from '@/lib/ai/memory-context-provider';
import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client for database operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const requestId = `memory-search-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  try {
    console.log(`[${requestId}] Processing memory search request`);

    // Parse request body
    const body = await request.json();

    // Validate required fields
    if (!body.userId || !body.query) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'Missing required fields: userId, query'
        }
      }, { status: 400 });
    }

    // Get memory context using the memory context provider
    console.log(`[${requestId}] Getting memory context for user: ${body.userId}`);
    const memoryResult = await memoryContextProvider.getMemoryContext({
      userId: body.userId,
      query: body.query,
      chatType: body.chatType || 'study_assistant',
      isPersonalQuery: body.isPersonalQuery || false,
      contextLevel: body.contextLevel || 'comprehensive',
      limit: body.limit || 8
    });

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: {
        memories: memoryResult.memories,
        contextString: memoryResult.contextString,
        personalFacts: memoryResult.personalFacts,
        searchStats: memoryResult.searchStats,
        processingTime
      },
      metadata: {
        requestId,
        processingTime,
        userId: body.userId,
        query: body.query,
        memoriesFound: memoryResult.memories?.length || 0
      }
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`[${requestId}] Memory search error:`, error);

    return NextResponse.json({
      success: false,
      error: {
        code: 'MEMORY_SEARCH_ERROR',
        message: 'Failed to search memories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      data: {
        requestId,
        processingTime,
        memories: [],
        contextString: '',
        searchStats: {
          searchTimeMs: processingTime,
          memoriesProcessed: 0,
          searchMethod: 'failed'
        }
      }
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');

    if (action === 'health') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'Memory Search API is operational',
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          memorySystem: {
            provider: 'memoryContextProvider',
            database: 'conversation_memory',
            embedding: 'enabled'
          }
        }
      });
    }

    if (action === 'table-info') {
      // Get table information
      const { data, error } = await supabase
        .from('conversation_memory')
        .select('*')
        .limit(0);

      if (error) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'TABLE_ACCESS_ERROR',
            message: 'Cannot access conversation_memory table',
            details: error.message
          }
        }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        data: {
          table: 'conversation_memory',
          accessible: true,
          totalRecords: data?.length || 0,
          lastChecked: new Date().toISOString()
        }
      });
    }

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'MISSING_USER_ID',
          message: 'userId parameter is required'
        }
      }, { status: 400 });
    }

    // Get all memories for a user
    const { data: memories, error } = await supabase
      .from('conversation_memory')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Failed to fetch memories',
          details: error.message
        }
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        userId,
        memories: memories || [],
        count: memories?.length || 0,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Memory Search GET error:', error);
    
    return NextResponse.json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 });
  }
}