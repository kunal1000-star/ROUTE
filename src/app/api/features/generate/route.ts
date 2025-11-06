// AI Features API Endpoints
// ========================

import { NextRequest, NextResponse } from 'next/server';
import { aiFeaturesEngine } from '@/lib/ai/ai-features-engine';
import type { FeatureRequest } from '@/lib/ai/ai-features-engine';

/**
 * POST /api/features/generate
 * Generate AI features for a user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { featureIds, userId, context, priority = 'medium' } = body;

    if (!userId || !Array.isArray(featureIds) || featureIds.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, featureIds' },
        { status: 400 }
      );
    }

    // Validate feature IDs
    const validFeatureIds = featureIds.filter(id => id >= 1 && id <= 22);
    if (validFeatureIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid feature IDs provided' },
        { status: 400 }
      );
    }

    // Create feature requests
    const featureRequests: FeatureRequest[] = validFeatureIds.map(featureId => ({
      featureId,
      userId,
      context: context || {},
      priority: priority as any
    }));

    // Execute features in batch
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchResult = await aiFeaturesEngine.executeBatch({
      batchId,
      requests: featureRequests,
      userId,
      priority: priority as any
    });

    return NextResponse.json({
      success: true,
      batchId,
      results: batchResult.results,
      summary: batchResult.summary
    });

  } catch (error) {
    console.error('Feature generation error:', error);
    return NextResponse.json(
      { 
        error: 'Feature generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/features/generate
 * Generate a single AI feature
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const featureId = parseInt(searchParams.get('featureId') || '0');
    const userId = searchParams.get('userId');
    const context = searchParams.get('context');

    if (!userId || !featureId) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, featureId' },
        { status: 400 }
      );
    }

    if (featureId < 1 || featureId > 22) {
      return NextResponse.json(
        { error: 'Invalid feature ID. Must be between 1 and 22' },
        { status: 400 }
      );
    }

    // Parse context if provided
    let parsedContext = {};
    if (context) {
      try {
        parsedContext = JSON.parse(context);
      } catch (e) {
        return NextResponse.json(
          { error: 'Invalid context JSON' },
          { status: 400 }
        );
      }
    }

    // Execute single feature
    const result = await aiFeaturesEngine.executeFeature({
      featureId,
      userId,
      context: parsedContext
    });

    return NextResponse.json(result);

  } catch (error) {
    console.error('Single feature generation error:', error);
    return NextResponse.json(
      { 
        error: 'Feature generation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}