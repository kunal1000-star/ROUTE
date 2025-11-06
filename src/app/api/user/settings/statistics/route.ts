// Settings Statistics API Endpoint - Phase 3
// Handle usage statistics for settings panel

import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/ai/settings-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const statistics = await settingsService.getUsageStatistics(userId);

    return NextResponse.json({
      success: true,
      data: statistics
    });

  } catch (error) {
    console.error('[Settings Statistics API] GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
