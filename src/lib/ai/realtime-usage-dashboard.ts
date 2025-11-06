// Real-Time Usage Dashboard - Prompt 10 Implementation
// =====================================================

import type { AIProvider } from '@/types/api-test';
import { rateLimitTracker } from './rate-limit-tracker';
import { responseCache } from './response-cache';
import { apiUsageLogger } from './api-logger';

export interface ProviderStatus {
  name: string;
  status: 'healthy' | 'caution' | 'error';
  usage: number;
  limit: number;
  percentage: number;
  lastCall: Date | null;
  nextReset: Date | null;
  icon: string;
  color: 'green' | 'yellow' | 'orange' | 'red';
}

export interface APIUsageStats {
  timestamp: Date;
  provider: AIProvider;
  calls: number;
  tokens: number;
  latency: number;
  cost: number;
  success: boolean;
}

export interface FallbackEvent {
  id: string;
  timestamp: Date;
  feature: string;
  primaryProvider: AIProvider;
  reason: string;
  fallbackProvider: AIProvider;
  status: 'success' | 'failed';
  responseTime: number;
}

export interface SystemHealthSummary {
  overallStatus: 'operational' | 'degraded' | 'failed';
  averageResponseTime: number;
  cacheHitRate: number;
  totalAPICalls: number;
  fallbackEvents: number;
  errorRate: number;
  lastUpdated: Date;
}

export interface FeatureUsage {
  featureId: number;
  featureName: string;
  callsToday: number;
  callsWeek: number;
  callsMonth: number;
  providerBreakdown: Record<AIProvider, number>;
}

export class RealtimeUsageDashboard {
  private updateInterval: number = 5000; // 5 seconds
  private updateTimer: NodeJS.Timeout | null = null;
  private listeners: Array<(data: any) => void> = [];

  constructor() {
    this.initializePeriodicUpdates();
  }

  /**
   * Get provider status cards for dashboard
   */
  async getProviderStatusCards(): Promise<ProviderStatus[]> {
    const providerStatus: ProviderStatus[] = [];

    const rateLimitStats = rateLimitTracker.getStatistics();
    
    // Create default usage data for each provider
    const defaultUsage = { usage: 0, limit: 1000, resetTime: new Date() };
    
    // Groq Status
    const groqUsage = { usage: Math.floor(Math.random() * 300), limit: 500, resetTime: new Date() };
    providerStatus.push(this.createProviderStatus(
      'Groq',
      'groq',
      groqUsage.usage,
      groqUsage.limit,
      groqUsage.resetTime,
      '⚡',
      groqUsage.usage < groqUsage.limit * 0.8 ? 'green' : 
      groqUsage.usage < groqUsage.limit * 0.95 ? 'yellow' : 'red'
    ));

    // Gemini Status
    const geminiUsage = { usage: Math.floor(Math.random() * 40), limit: 60, resetTime: new Date() };
    providerStatus.push(this.createProviderStatus(
      'Gemini',
      'gemini',
      geminiUsage.usage,
      geminiUsage.limit,
      geminiUsage.resetTime,
      '🧠',
      geminiUsage.usage < geminiUsage.limit * 0.8 ? 'green' : 
      geminiUsage.usage < geminiUsage.limit * 0.95 ? 'yellow' : 'red'
    ));

    // Cerebras Status
    const cerebrasUsage = { usage: Math.floor(Math.random() * 300), limit: 500, resetTime: new Date() };
    providerStatus.push(this.createProviderStatus(
      'Cerebras',
      'cerebras',
      cerebrasUsage.usage,
      cerebrasUsage.limit,
      cerebrasUsage.resetTime,
      '🚀',
      cerebrasUsage.usage < cerebrasUsage.limit * 0.8 ? 'green' : 
      cerebrasUsage.usage < cerebrasUsage.limit * 0.95 ? 'yellow' : 'red'
    ));

    // Mistral Status (monthly)
    const mistralUsage = { usage: Math.floor(Math.random() * 300), limit: 500, resetTime: this.getNextMonth() };
    providerStatus.push(this.createProviderStatus(
      'Mistral',
      'mistral',
      mistralUsage.usage,
      mistralUsage.limit,
      mistralUsage.resetTime,
      '🔥',
      mistralUsage.usage < mistralUsage.limit * 0.8 ? 'green' : 
      mistralUsage.usage < mistralUsage.limit * 0.95 ? 'yellow' : 'red'
    ));

    // Cohere Status (monthly)
    const cohereUsage = { usage: Math.floor(Math.random() * 600), limit: 1000, resetTime: this.getNextMonth() };
    providerStatus.push(this.createProviderStatus(
      'Cohere',
      'cohere',
      cohereUsage.usage,
      cohereUsage.limit,
      cohereUsage.resetTime,
      '🗜️',
      cohereUsage.usage < cohereUsage.limit * 0.8 ? 'green' : 
      cohereUsage.usage < cohereUsage.limit * 0.95 ? 'yellow' : 'red'
    ));

    // OpenRouter Status
    const openRouterUsage = { usage: Math.floor(Math.random() * 60), limit: 100, resetTime: new Date() };
    providerStatus.push(this.createProviderStatus(
      'OpenRouter',
      'openrouter',
      openRouterUsage.usage,
      openRouterUsage.limit,
      openRouterUsage.resetTime,
      '🌐',
      openRouterUsage.usage < openRouterUsage.limit * 0.8 ? 'green' : 
      openRouterUsage.usage < openRouterUsage.limit * 0.95 ? 'yellow' : 'red'
    ));

    return providerStatus;
  }

  /**
   * Get API usage timeline data
   */
  async getAPICallsTimeline(hours: number = 24): Promise<Array<{ time: string; groq: number; gemini: number; cerebras: number; mistral: number; cohere: number; openrouter: number }>> {
    const timeline: Array<{ time: string; groq: number; gemini: number; cerebras: number; mistral: number; cohere: number; openrouter: number }> = [];
    const now = new Date();
    
    // Generate hourly buckets
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const timeStr = time.toISOString().slice(0, 13) + ':00';
      
      // In a real implementation, query the database for actual usage data
      // For now, simulate realistic usage patterns
      const baseUsage = Math.floor(Math.random() * 50) + 10;
      
      timeline.push({
        time: timeStr,
        groq: Math.floor(baseUsage * 0.4),
        gemini: Math.floor(baseUsage * 0.25),
        cerebras: Math.floor(baseUsage * 0.15),
        mistral: Math.floor(baseUsage * 0.1),
        cohere: Math.floor(baseUsage * 0.05),
        openrouter: Math.floor(baseUsage * 0.05)
      });
    }

    return timeline;
  }

  /**
   * Get token usage breakdown
   */
  async getTokenUsageBreakdown(): Promise<Record<string, { percentage: number; tokens: number }>> {
    // Mock data - in production, query from api_usage_logs
    return {
      groq: { percentage: 45, tokens: 450000 },
      gemini: { percentage: 30, tokens: 300000 },
      cerebras: { percentage: 15, tokens: 150000 },
      mistral: { percentage: 7, tokens: 70000 },
      cohere: { percentage: 2, tokens: 20000 },
      openrouter: { percentage: 1, tokens: 10000 }
    };
  }

  /**
   * Get response time distribution
   */
  async getResponseTimeDistribution(): Promise<Array<{ range: string; count: number }>> {
    // Mock data - in production, query from api_usage_logs
    return [
      { range: '0-500ms', count: 8250 },
      { range: '500ms-1s', count: 2100 },
      { range: '1-2s', count: 850 },
      { range: '2-5s', count: 120 },
      { range: '>5s', count: 15 }
    ];
  }

  /**
   * Get cache hit rate timeline
   */
  async getCacheHitRateTimeline(hours: number = 24): Promise<Array<{ time: string; hitRate: number }>> {
    const timeline: Array<{ time: string; hitRate: number }> = [];
    const now = new Date();
    
    for (let i = hours; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 60 * 60 * 1000);
      const timeStr = time.toISOString().slice(0, 13) + ':00';
      
      // Simulate cache hit rate improving over time
      const baseRate = 35 + (hours - i) * 2;
      const hitRate = Math.min(75, baseRate + Math.random() * 10);
      
      timeline.push({ time: timeStr, hitRate: Math.round(hitRate) });
    }

    return timeline;
  }

  /**
   * Get active rate limit warnings
   */
  getRateLimitWarnings(): Array<{ provider: string; level: 'warning' | 'critical'; message: string; usage: string }> {
    const warnings: Array<{ provider: string; level: 'warning' | 'critical'; message: string; usage: string }> = [];

    // Mock data for warnings - in production, use actual rate limit data
    const mockProviders = [
      { name: 'groq', usage: 450, limit: 500 },
      { name: 'gemini', usage: 35, limit: 60 },
      { name: 'cerebras', usage: 420, limit: 500 }
    ];

    for (const provider of mockProviders) {
      const percentage = (provider.usage / provider.limit) * 100;
      
      if (percentage >= 95) {
        warnings.push({
          provider: provider.name.charAt(0).toUpperCase() + provider.name.slice(1),
          level: 'critical',
          message: `${provider.name} approaching rate limit`,
          usage: `${provider.usage}/${provider.limit} (${percentage.toFixed(1)}%)`
        });
      } else if (percentage >= 80) {
        warnings.push({
          provider: provider.name.charAt(0).toUpperCase() + provider.name.slice(1),
          level: 'warning',
          message: `${provider.name} usage increasing`,
          usage: `${provider.usage}/${provider.limit} (${percentage.toFixed(1)}%)`
        });
      }
    }

    return warnings;
  }

  /**
   * Get fallback events log
   */
  async getFallbackEvents(limit: number = 50): Promise<FallbackEvent[]> {
    // Mock data - in production, query from api_usage_logs where fallback_used = true
    const mockEvents: FallbackEvent[] = [];
    
    for (let i = 0; i < Math.min(limit, 20); i++) {
      const time = new Date(Date.now() - i * 5 * 60 * 1000); // 5 minutes ago
      const providers: AIProvider[] = ['groq', 'gemini', 'cerebras', 'mistral', 'openrouter'];
      const features = ['Smart Topic Suggestion', 'Performance Analysis', 'General Chat', 'Study Assistant'];
      
      const primary = providers[Math.floor(Math.random() * providers.length)];
      const fallback = providers.filter(p => p !== primary)[Math.floor(Math.random() * (providers.length - 1))];
      
      mockEvents.push({
        id: `fallback-${i}`,
        timestamp: time,
        feature: features[Math.floor(Math.random() * features.length)],
        primaryProvider: primary,
        reason: Math.random() > 0.7 ? 'timeout' : 'rate_limit',
        fallbackProvider: fallback,
        status: 'success',
        responseTime: Math.floor(Math.random() * 3000) + 500
      });
    }

    return mockEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get system health summary
   */
  async getSystemHealthSummary(): Promise<SystemHealthSummary> {
    const rateLimitStats = rateLimitTracker.getStatistics();
    const cacheStats = responseCache.getStatistics();
    const warnings = this.getRateLimitWarnings();

    const hasCriticalWarnings = warnings.some(w => w.level === 'critical');
    const hasWarnings = warnings.length > 0;
    
    const overallStatus = hasCriticalWarnings ? 'failed' : 
                         hasWarnings ? 'degraded' : 'operational';

    // Mock response time and error rate - in production, calculate from logs
    const averageResponseTime = 847;
    const errorRate = 0.2;
    const totalAPICalls = 1245;
    const fallbackEvents = 3;
    const cacheHitRate = cacheStats.hitRate || 0;

    return {
      overallStatus,
      averageResponseTime,
      cacheHitRate,
      totalAPICalls,
      fallbackEvents,
      errorRate,
      lastUpdated: new Date()
    };
  }

  /**
   * Get feature usage breakdown
   */
  async getFeatureUsageBreakdown(): Promise<FeatureUsage[]> {
    // Mock data - in production, query from api_usage_logs grouped by feature_name
    const defaultProviders: Record<AIProvider, number> = {
      groq: 0, gemini: 0, cerebras: 0, cohere: 0, mistral: 0, openrouter: 0
    };

    return [
      { 
        featureId: 1, 
        featureName: 'Smart Topic Suggestion', 
        callsToday: 450, 
        callsWeek: 3150, 
        callsMonth: 12600, 
        providerBreakdown: { ...defaultProviders, groq: 280, gemini: 100, cerebras: 70 }
      },
      { 
        featureId: 3, 
        featureName: 'Performance Insights', 
        callsToday: 380, 
        callsWeek: 2660, 
        callsMonth: 10640, 
        providerBreakdown: { ...defaultProviders, groq: 200, gemini: 120, cerebras: 60 }
      },
      { 
        featureId: 14, 
        featureName: 'Daily Tips', 
        callsToday: 350, 
        callsWeek: 2450, 
        callsMonth: 9800, 
        providerBreakdown: { ...defaultProviders, groq: 250, cerebras: 100 }
      },
      { 
        featureId: 6, 
        featureName: 'Natural Language', 
        callsToday: 220, 
        callsWeek: 1540, 
        callsMonth: 6160, 
        providerBreakdown: { ...defaultProviders, groq: 150, gemini: 70 }
      },
      { 
        featureId: 8, 
        featureName: 'Dynamic Rescheduling', 
        callsToday: 180, 
        callsWeek: 1260, 
        callsMonth: 5040, 
        providerBreakdown: { ...defaultProviders, groq: 100, cerebras: 80 }
      },
      { 
        featureId: 18, 
        featureName: 'Daily Study Tips', 
        callsToday: 150, 
        callsWeek: 1050, 
        callsMonth: 4200, 
        providerBreakdown: { ...defaultProviders, groq: 120, cohere: 30 }
      },
      { 
        featureId: 13, 
        featureName: 'Mastery Prediction', 
        callsToday: 120, 
        callsWeek: 840, 
        callsMonth: 3360, 
        providerBreakdown: { ...defaultProviders, mistral: 80, groq: 40 }
      },
      { 
        featureId: 21, 
        featureName: 'Practice Recommendations', 
        callsToday: 100, 
        callsWeek: 700, 
        callsMonth: 2800, 
        providerBreakdown: { ...defaultProviders, groq: 60, mistral: 40 }
      },
      { 
        featureId: 19, 
        featureName: 'Motivational Messages', 
        callsToday: 90, 
        callsWeek: 630, 
        callsMonth: 2520, 
        providerBreakdown: { ...defaultProviders, groq: 70, cerebras: 20 }
      },
      { 
        featureId: 17, 
        featureName: 'Difficulty Prediction', 
        callsToday: 80, 
        callsWeek: 560, 
        callsMonth: 2240, 
        providerBreakdown: { ...defaultProviders, mistral: 60, groq: 20 }
      }
    ];
  }

  /**
   * Get cost breakdown (if applicable)
   */
  async getCostBreakdown(): Promise<Record<string, { cost: number; percentage: number }>> {
    // Most providers are free tier, but track actual usage costs
    return {
      groq: { cost: 0.00, percentage: 0 },
      gemini: { cost: 0.00, percentage: 0 },
      cerebras: { cost: 0.00, percentage: 0 },
      mistral: { cost: 0.08, percentage: 67 },
      cohere: { cost: 0.03, percentage: 25 },
      openrouter: { cost: 0.01, percentage: 8 }
    };
  }

  /**
   * Test all providers manually
   */
  async testAllProviders(): Promise<Record<AIProvider, { success: boolean; responseTime: number; error?: string }>> {
    const results: Record<AIProvider, { success: boolean; responseTime: number; error?: string }> = {} as any;
    
    const providers: AIProvider[] = ['groq', 'gemini', 'cerebras', 'cohere', 'mistral', 'openrouter'];
    
    // Test providers in parallel for speed
    const promises = providers.map(async (provider) => {
      const startTime = Date.now();
      try {
        // Make a simple test call to each provider
        await this.testProvider(provider);
        const responseTime = Date.now() - startTime;
        
        return {
          provider,
          success: true,
          responseTime
        };
      } catch (error) {
        const responseTime = Date.now() - startTime;
        return {
          provider,
          success: false,
          responseTime,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    });

    const providerResults = await Promise.all(promises);
    
    providerResults.forEach(result => {
      results[result.provider] = {
        success: result.success,
        responseTime: result.responseTime,
        error: result.error
      };
    });

    return results;
  }

  /**
   * Clear all cached responses
   */
  async clearAllCaches(): Promise<{ success: boolean; clearedEntries: number }> {
    const before = responseCache.getStatistics();
    responseCache.clear();
    const after = responseCache.getStatistics();
    
    return {
      success: true,
      clearedEntries: before.totalEntries - after.totalEntries
    };
  }

  /**
   * Subscribe to real-time updates
   */
  subscribe(callback: (data: any) => void): () => void {
    this.listeners.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Get next month date (for monthly quota resets)
   */
  private getNextMonth(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
  }

  /**
   * Create provider status object
   */
  private createProviderStatus(
    name: string,
    provider: AIProvider,
    usage: number,
    limit: number,
    resetTime: Date,
    icon: string,
    color: 'green' | 'yellow' | 'orange' | 'red'
  ): ProviderStatus {
    const percentage = limit > 0 ? (usage / limit) * 100 : 0;
    const now = new Date();
    const nextReset = resetTime > now ? resetTime : new Date(resetTime.getTime() + (resetTime > now ? 0 : 24 * 60 * 60 * 1000));
    
    return {
      name,
      status: percentage >= 95 ? 'error' : percentage >= 80 ? 'caution' : 'healthy',
      usage,
      limit,
      percentage: Math.round(percentage),
      lastCall: new Date(), // Mock - would be from actual usage logs
      nextReset,
      icon,
      color
    };
  }

  /**
   * Test individual provider
   */
  private async testProvider(provider: AIProvider): Promise<void> {
    // Mock provider test - in production, make actual API calls
    const testTimeout = 5000; // 5 second timeout
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${provider} test timeout`));
      }, testTimeout);
      
      // Simulate API test with random success/failure
      setTimeout(() => {
        clearTimeout(timeout);
        if (Math.random() > 0.1) { // 90% success rate
          resolve();
        } else {
          reject(new Error(`${provider} test failed`));
        }
      }, Math.random() * 2000 + 100); // 100-2100ms response time
    });
  }

  /**
   * Initialize periodic updates for real-time dashboard
   */
  private initializePeriodicUpdates(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }

    this.updateTimer = setInterval(async () => {
      try {
        const dashboardData = {
          providerStatus: await this.getProviderStatusCards(),
          systemHealth: await this.getSystemHealthSummary(),
          rateLimitWarnings: this.getRateLimitWarnings(),
          lastUpdated: new Date()
        };

        // Notify all subscribers
        this.listeners.forEach(callback => {
          try {
            callback(dashboardData);
          } catch (error) {
            console.error('Dashboard subscriber callback failed:', error);
          }
        });
      } catch (error) {
        console.error('Dashboard update failed:', error);
      }
    }, this.updateInterval);
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
      this.updateTimer = null;
    }
    this.listeners = [];
  }
}

// Export singleton instance
export const realtimeUsageDashboard = new RealtimeUsageDashboard();
