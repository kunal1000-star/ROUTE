// AI Real-time Monitoring Debug API
// =================================

import { NextRequest, NextResponse } from 'next/server';
import { aiDataService } from '@/lib/ai/ai-data-centralization-unified';
import { aiPerformanceMonitor } from '@/lib/ai/ai-performance-monitor';

interface RealtimeMetrics {
  timestamp: string;
  cacheStats: {
    totalEntries: number;
    totalSize: number;
    hitRate: number;
  };
  performanceMetrics: {
    totalQueries: number;
    averageDuration: number;
    cacheHitRate: number;
    errorRate: number;
    slowQueries: number;
  };
  systemStatus: {
    databaseConnected: boolean;
    aiServiceManagerHealthy: boolean;
    centralizedServiceWorking: boolean;
    cacheSystemActive: boolean;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') || 'all';

    const metrics: RealtimeMetrics = {
      timestamp: new Date().toISOString(),
      cacheStats: aiDataService.getCacheStats(),
      performanceMetrics: aiPerformanceMonitor.getPerformanceAnalytics('1h'),
      systemStatus: {
        databaseConnected: await testDatabaseConnection(),
        aiServiceManagerHealthy: await testAIServiceManager(),
        centralizedServiceWorking: await testCentralizedService(),
        cacheSystemActive: testCacheSystem()
      }
    };

    if (metric === 'cache') {
      return NextResponse.json({
        success: true,
        data: {
          cacheStats: metrics.cacheStats,
          systemStatus: metrics.systemStatus
        }
      });
    } else if (metric === 'performance') {
      return NextResponse.json({
        success: true,
        data: {
          performanceMetrics: metrics.performanceMetrics,
          timestamp: metrics.timestamp
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Realtime monitoring error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testDatabaseConnection(): Promise<boolean> {
  try {
    await aiDataService.getAIUserProfile('test-user');
    return true;
  } catch (error) {
    return false;
  }
}

async function testAIServiceManager(): Promise<boolean> {
  try {
    // Test AI service manager availability
    const { aiServiceManager } = await import('@/lib/ai/ai-service-manager-unified');
    const health = await aiServiceManager.healthCheck();
    return Object.values(health).some(h => h.healthy);
  } catch (error) {
    return false;
  }
}

async function testCentralizedService(): Promise<boolean> {
  try {
    const cacheStats = aiDataService.getCacheStats();
    return cacheStats.totalEntries >= 0; // Cache system is working if we can get stats
  } catch (error) {
    return false;
  }
}

function testCacheSystem(): boolean {
  try {
    const cacheStats = aiDataService.getCacheStats();
    return typeof cacheStats.totalEntries === 'number';
  } catch (error) {
    return false;
  }
}

// POST endpoint for continuous monitoring
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'clear_cache') {
      aiDataService.clearCache();
      return NextResponse.json({
        success: true,
        message: 'Cache cleared successfully'
      });
    } else if (action === 'warm_cache') {
      // Warm cache with test data
      await aiDataService.getAIUserProfile('test-user-1');
      await aiDataService.getAIUserProfile('test-user-2');
      return NextResponse.json({
        success: true,
        message: 'Cache warmed with test data'
      });
    } else if (action === 'get_trends') {
      const trends = aiPerformanceMonitor.getQueryTrends('1h');
      return NextResponse.json({
        success: true,
        data: trends
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 });

  } catch (error) {
    console.error('Realtime monitoring action error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}