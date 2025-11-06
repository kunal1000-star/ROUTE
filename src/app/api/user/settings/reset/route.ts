// Settings Reset API Endpoint - Phase 3
// Handle settings reset to defaults

import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/ai/settings-service';

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId parameter required' },
        { status: 400 }
      );
    }

    const result = await settingsService.resetSettings(userId);

    if (result.success) {
      // Clear cache after reset
      settingsService.invalidateCache(userId);
      
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Settings reset to defaults successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Settings Reset API] POST error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
