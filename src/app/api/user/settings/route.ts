// Settings API Endpoints - Phase 3 Implementation
// Handle GET, PUT operations for user settings

import { NextRequest, NextResponse } from 'next/server';
import { settingsService } from '@/lib/ai/settings-service';
import type { UserSettings, SettingsUpdateRequest } from '@/types/settings';

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

    const settings = await settingsService.getUserSettings(userId);

    if (!settings) {
      return NextResponse.json(
        { success: false, error: 'Settings not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: settings
    });

  } catch (error) {
    console.error('[Settings API] GET error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body: SettingsUpdateRequest & { userId: string } = await request.json();
    const { userId, settings } = body;

    if (!userId || !settings) {
      return NextResponse.json(
        { success: false, error: 'userId and settings are required' },
        { status: 400 }
      );
    }

    // Validate settings structure
    const validationResult = await validateSettings(settings);
    if (!validationResult.isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid settings structure', details: validationResult.errors },
        { status: 400 }
      );
    }

    const result = await settingsService.updateSettings(userId, {
      tab: body.tab,
      settings
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: result.data,
        message: 'Settings updated successfully'
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Settings API] PUT error:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Settings validation function
async function validateSettings(settings: Partial<UserSettings>): Promise<{
  isValid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  try {
    // Basic structure validation
    if (settings.aiModel) {
      if (!settings.aiModel.preferredProviders || !Array.isArray(settings.aiModel.preferredProviders)) {
        errors.push('aiModel.preferredProviders must be an array');
      }
      if (!settings.aiModel.rateLimits || typeof settings.aiModel.rateLimits.dailyRequests !== 'number') {
        errors.push('aiModel.rateLimits.dailyRequests must be a number');
      }
      if (!settings.aiModel.qualitySettings || typeof settings.aiModel.qualitySettings.temperature !== 'number') {
        errors.push('aiModel.qualitySettings.temperature must be a number');
      }
    }

    if (settings.features) {
      if (!settings.features.aiSuggestions || typeof settings.features.aiSuggestions.enabled !== 'boolean') {
        errors.push('features.aiSuggestions.enabled must be a boolean');
      }
    }

    if (settings.notifications) {
      if (!settings.notifications.pushNotifications || typeof settings.notifications.pushNotifications.enabled !== 'boolean') {
        errors.push('notifications.pushNotifications.enabled must be a boolean');
      }
    }

    if (settings.privacy) {
      if (!settings.privacy.dataCollection || typeof settings.privacy.dataCollection.anonymousAnalytics !== 'boolean') {
        errors.push('privacy.dataCollection.anonymousAnalytics must be a boolean');
      }
    }

    if (settings.usage) {
      if (!settings.usage.displayOptions || typeof settings.usage.displayOptions.showTokenUsage !== 'boolean') {
        errors.push('usage.displayOptions.showTokenUsage must be a boolean');
      }
    }

  } catch (error) {
    errors.push('Invalid settings format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
