// Settings Export API Endpoint - Phase 3
// Handle settings export functionality

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

    const exportData = await settingsService.exportSettings(userId);

    return NextResponse.json({
      success: true,
      data: {
        exportDate: new Date().toISOString(),
        ...exportData
      },
      message: 'Settings exported successfully'
    });

  } catch (error) {
    console.error('[Settings Export API] GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
