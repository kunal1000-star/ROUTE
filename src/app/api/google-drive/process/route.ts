// Google Drive Content Processing API Endpoint - Phase 4
// Handle file content extraction and processing for study materials

import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/ai/google-drive-integration';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, fileId, action } = body;

    if (!userId || !fileId || !action) {
      return NextResponse.json(
        { success: false, error: 'userId, fileId, and action parameters required' },
        { status: 400 }
      );
    }

    // Check authentication status
    const isAuthenticated = await googleDriveService.getAuthStatus(userId);
    if (!isAuthenticated) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated with Google Drive' },
        { status: 401 }
      );
    }

    switch (action) {
      case 'extract':
        const extractionResult = await googleDriveService.extractContent(userId, fileId);
        return NextResponse.json(extractionResult);

      case 'process':
        const processResult = await googleDriveService.processFileForStudy(userId, fileId);
        return NextResponse.json(processResult);

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action. Supported: extract, process' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('[Google Drive Process API] POST error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
