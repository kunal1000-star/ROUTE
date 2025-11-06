// AI Features Metrics API Endpoints
// =================================

import { NextRequest, NextResponse } from 'next/server';
import { aiFeaturesEngine, FeatureCategory } from '@/lib/ai/ai-features-engine';

/**
 * GET /api/features/metrics
 * Get performance metrics for AI features
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = searchParams.get('featureId');
    const includeStatus = searchParams.get('includeStatus') === 'true';

    if (featureId) {
      // Get metrics for specific feature
      const featureIdNum = parseInt(featureId);
      if (featureIdNum < 1 || featureIdNum > 22) {
        return NextResponse.json(
          { error: 'Invalid feature ID. Must be between 1 and 22' },
          { status: 400 }
        );
      }

      const metrics = aiFeaturesEngine.getFeatureMetrics(featureIdNum);
      if (!metrics) {
        return NextResponse.json(
          { error: 'No metrics available for this feature' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        featureId: featureIdNum,
        metrics
      });
    } else {
      // Get all metrics and status
      const status = aiFeaturesEngine.getStatus();
      
      // Get metrics for all features
      const featureMetrics: Record<number, any> = {};
      for (let i = 1; i <= 22; i++) {
        const metrics = aiFeaturesEngine.getFeatureMetrics(i);
        if (metrics) {
          featureMetrics[i] = metrics;
        }
      }

      const response: any = {
        status,
        featureMetrics
      };

      if (includeStatus) {
        // Get features by category
          response.featuresByCategory = {
            performance_analysis: aiFeaturesEngine.getFeaturesByCategory(FeatureCategory.PERFORMANCE_ANALYSIS),
            study_scheduling: aiFeaturesEngine.getFeaturesByCategory(FeatureCategory.STUDY_SCHEDULING),
            prediction_estimation: aiFeaturesEngine.getFeaturesByCategory(FeatureCategory.PREDICTION_ESTIMATION),
            motivation_learning: aiFeaturesEngine.getFeaturesByCategory(FeatureCategory.MOTIVATION_LEARNING)
          };
      }

      return NextResponse.json(response);
    }

  } catch (error) {
    console.error('Metrics retrieval error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to retrieve metrics',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/features/metrics
 * Toggle feature enable/disable
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureId, enabled } = body;

    if (!featureId || typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: featureId, enabled' },
        { status: 400 }
      );
    }

    if (featureId < 1 || featureId > 22) {
      return NextResponse.json(
        { error: 'Invalid feature ID. Must be between 1 and 22' },
        { status: 400 }
      );
    }

    const success = aiFeaturesEngine.toggleFeature(featureId, enabled);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to toggle feature' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      featureId,
      enabled
    });

  } catch (error) {
    console.error('Feature toggle error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to toggle feature',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}