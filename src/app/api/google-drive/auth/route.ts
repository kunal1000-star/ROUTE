// Google Drive Authentication API Endpoint - Phase 4
// Handle Google Drive OAuth authentication flow

import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/ai/google-drive-integration';

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

    const authResponse = await googleDriveService.getAuthUrl(userId);

    return NextResponse.json(authResponse);

  } catch (error) {
    console.error('[Google Drive Auth API] GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
