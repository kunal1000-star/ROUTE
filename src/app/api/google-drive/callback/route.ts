// Google Drive Auth Callback API Endpoint - Phase 4
// Handle Google Drive OAuth callback

import { NextRequest, NextResponse } from 'next/server';
import { googleDriveService } from '@/lib/ai/google-drive-integration';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // userId from auth URL
    const error = searchParams.get('error');

    // Handle OAuth errors
    if (error) {
      console.error('[Google Drive Callback] OAuth error:', error);
      return NextResponse.redirect(new URL(`/dashboard?driveAuthError=${error}`, request.url));
    }

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Authorization code required' },
        { status: 400 }
      );
    }

    const userId = state || undefined;
    const callbackResponse = await googleDriveService.handleAuthCallback(code, userId);

    if (callbackResponse.success) {
      // Redirect to dashboard with success
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('driveAuth', 'success');
      return NextResponse.redirect(redirectUrl);
    } else {
      // Redirect with error
      const redirectUrl = new URL('/dashboard', request.url);
      redirectUrl.searchParams.set('driveAuthError', callbackResponse.error || 'Authentication failed');
      return NextResponse.redirect(redirectUrl);
    }

  } catch (error) {
    console.error('[Google Drive Callback API] Error:', error);
    
    const redirectUrl = new URL('/dashboard', request.url);
    redirectUrl.searchParams.set('driveAuthError', 'Authentication failed');
    return NextResponse.redirect(redirectUrl);
  }
}
