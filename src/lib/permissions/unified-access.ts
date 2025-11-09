// Unified Access System - No Admin/Premium Restrictions
// ====================================================

import type { User } from '@supabase/supabase-js';

/**
 * Remove all role-based restrictions
 * All authenticated users get equal access to all features
 */
export class UnifiedAccess {
  
  /**
   * Check if user has basic authentication (that's it!)
   */
  static isAuthenticated(user: User | null): boolean {
    return !!user;
  }

  /**
   * All authenticated users get the same access level
   */
  static getUserAccessLevel(user: User | null): 'standard' {
    // Everyone gets standard access - no tiers, no roles
    return 'standard';
  }

  /**
   * Check access for admin features (now open to all authenticated users)
   */
  static canAccessAdmin(user: User | null): boolean {
    return this.isAuthenticated(user);
  }

  /**
   * Check access for AI features (now unlimited for all users)
   */
  static canUseAI(user: User | null): boolean {
    return this.isAuthenticated(user);
  }

  /**
   * Check access for analytics features (now available to all)
   */
  static canViewAnalytics(user: User | null): boolean {
    return this.isAuthenticated(user);
  }

  /**
   * Check access for system monitoring (now available to all)
   */
  static canMonitorSystem(user: User | null): boolean {
    return this.isAuthenticated(user);
  }

  /**
   * Check access for configuration settings (now available to all)
   */
  static canConfigureSystem(user: User | null): boolean {
    return this.isAuthenticated(user);
  }

  /**
   * Rate limits are global, not per user tier
   */
  static getUserTier(): 'unlimited' {
    return 'unlimited';
  }

  /**
   * Feature flags - all enabled for authenticated users
   */
  static isFeatureEnabled(feature: string, user: User | null): boolean {
    if (!this.isAuthenticated(user)) return false;
    
    // All features enabled for authenticated users
    const enabledFeatures = [
      'ai_chat',
      'study_buddy',
      'analytics',
      'admin_panel',
      'system_monitoring',
      'google_drive',
      'ai_suggestions',
      'performance_tracking',
      'gamification',
      'revision_queue',
      'resource_management',
      'pomodoro',
      'chat_history',
      'ai_memory',
      'web_search',
      'file_upload',
      'api_testing',
      'real_time_monitoring'
    ];

    return enabledFeatures.includes(feature);
  }

  /**
   * Get allowed AI providers for user (all providers available)
   */
  static getAllowedAIProviders(user: User | null): string[] {
    if (!this.isAuthenticated(user)) return [];
    
    return [
      'groq',
      'gemini',
      'cerebras',
      'cohere',
      'mistral',
      'openrouter'
    ];
  }

  /**
   * Get API rate limits (same for all users)
   */
  static getAPILimits(user: User | null) {
    if (!this.isAuthenticated(user)) return { requests: 0 };
    
    return {
      requests: {
        perMinute: 100,
        perHour: 1000,
        perDay: 10000
      },
      ai: {
        perMinute: 50,
        perHour: 500,
        perDay: 5000
      }
    };
  }

  /**
   * Check if user can access specific API endpoint
   */
  static canAccessEndpoint(endpoint: string, user: User | null): boolean {
    if (!this.isAuthenticated(user)) return false;
    
    // All endpoints open to authenticated users
    const openEndpoints = [
      
      '/api/chat/study-assistant/send',
      '/api/student/profile',
      '/api/suggestions',
      '/api/gdrive/analyze',
      '/api/admin/system/health',
      '/api/admin/system/usage',
      '/api/admin/system/config',
      '/api/admin/monitoring/realtime',
      '/api/admin/providers'
    ];

    return openEndpoints.some(openEndpoint => endpoint.startsWith(openEndpoint));
  }

  /**
   * No premium features - everything is free
   */
  static isPremiumFeature(feature: string): boolean {
    return false;
  }

  /**
   * Get user permissions (everyone gets everything)
   */
  static getUserPermissions(user: User | null): string[] {
    if (!this.isAuthenticated(user)) return [];
    
    return [
      'read_own_data',
      'write_own_data',
      'use_ai_chat',
      'access_admin_panel',
      'view_analytics',
      'configure_system',
      'monitor_performance',
      'manage_resources',
      'access_study_tools',
      'use_gamification',
      'manage_sessions',
      'view_reports',
      'export_data',
      'import_data',
      'test_ai_providers',
      'access_monitoring'
    ];
  }

  /**
   * Middleware helper for API routes
   */
  static requireAuth(user: User | null) {
    if (!this.isAuthenticated(user)) {
      throw new Error('Authentication required');
    }
  }

  /**
   * Middleware helper for admin access (now just requires auth)
   */
  static requireAdmin(user: User | null) {
    if (!this.canAccessAdmin(user)) {
      throw new Error('Admin access requires authentication');
    }
  }

  /**
   * Get user's subscription status (everyone is "premium" now)
   */
  static getSubscriptionStatus(user: User | null): 'premium' | 'free' {
    return 'premium'; // Everyone gets premium features
  }

  /**
   * Check if user has reached any usage limits (none for authenticated users)
   */
  static checkUsageLimits(user: User | null, usage: any): {
    exceeded: boolean;
    message?: string;
  } {
    if (!this.isAuthenticated(user)) {
      return { exceeded: true, message: 'Authentication required' };
    }
    
    // No limits for authenticated users
    return { exceeded: false };
  }
}

export default UnifiedAccess;
