// Rate Limit Manager - Intelligent Provider Management System
// ============================================================

import type { AIProvider } from '@/types/api-test';
import { rateLimitTracker } from './rate-limit-tracker';
import { responseCache } from './response-cache';

export interface RateLimitStrategy {
  name: string;
  description: string;
  provider: AIProvider;
  priority: number;
  dailyLimit: number;
  hourlyLimit: number;
  minuteLimit: number;
  concurrency: number;
  exponentialBackoff: boolean;
  retryAttempts: number;
}

export interface IntelligentRoutingRule {
  featureId: number;
  featureName: string;
  preferredProviders: AIProvider[];
  fallbackProviders: AIProvider[];
  loadBalancingStrategy: 'round_robin' | 'least_used' | 'fastest_response' | 'priority';
  maxRetries: number;
  timeout: number;
}

export interface ProviderHealthStatus {
  provider: AIProvider;
  isHealthy: boolean;
  lastError: Date | null;
  errorCount: number;
  averageResponseTime: number;
  successRate: number;
  errorRate: number;
  currentLoad: number;
  rateLimitRemaining: number;
  rateLimitResetTime: Date;
  cooldownUntil: Date | null;
}

export interface RoutingDecision {
  selectedProvider: AIProvider;
  confidence: number;
  reason: string;
  fallbackUsed: boolean;
  estimatedLatency: number;
  cost: number;
}

export interface ProviderMetrics {
  provider: AIProvider;
  requestsToday: number;
  requestsHour: number;
  requestsMinute: number;
  averageLatency: number;
  successRate: number;
  errorRate: number;
  cacheHitRate: number;
  costEstimate: number;
  lastUsed: Date;
  loadFactor: number;
}

export class RateLimitManager {
  private strategies: Map<AIProvider, RateLimitStrategy> = new Map();
  private routingRules: Map<number, IntelligentRoutingRule> = new Map();
  private providerMetrics: Map<AIProvider, ProviderMetrics> = new Map();
  private healthStatuses: Map<AIProvider, ProviderHealthStatus> = new Map();
  private lastRequestTimes: Map<AIProvider, Date[]> = new Map();
  private roundRobinIndex: Map<AIProvider, number> = new Map();
  private isInitialized = false;

  constructor() {
    this.initializeStrategies();
    this.initializeRoutingRules();
    this.initializeProviderMetrics();
  }

  /**
   * Initialize default rate limiting strategies for each provider
   */
  private initializeStrategies(): void {
    const strategies: RateLimitStrategy[] = [
      {
        name: 'Groq High-Speed Strategy',
        description: 'Optimized for speed with rapid rate limits',
        provider: 'groq',
        priority: 1,
        dailyLimit: 10000,
        hourlyLimit: 500,
        minuteLimit: 30,
        concurrency: 10,
        exponentialBackoff: true,
        retryAttempts: 3
      },
      {
        name: 'Gemini Quota Strategy', 
        description: 'Conservative approach for Google Gemini quotas',
        provider: 'gemini',
        priority: 2,
        dailyLimit: 2000,
        hourlyLimit: 60,
        minuteLimit: 15,
        concurrency: 5,
        exponentialBackoff: true,
        retryAttempts: 3
      },
      {
        name: 'Cerebras Performance Strategy',
        description: 'Balanced performance and reliability',
        provider: 'cerebras',
        priority: 3,
        dailyLimit: 15000,
        hourlyLimit: 500,
        minuteLimit: 25,
        concurrency: 8,
        exponentialBackoff: true,
        retryAttempts: 2
      },
      {
        name: 'Mistral Monthly Strategy',
        description: 'Monthly quota-based optimization',
        provider: 'mistral',
        priority: 4,
        dailyLimit: 500,
        hourlyLimit: 50,
        minuteLimit: 10,
        concurrency: 3,
        exponentialBackoff: true,
        retryAttempts: 2
      },
      {
        name: 'Cohere Enterprise Strategy',
        description: 'Enterprise-grade reliability and limits',
        provider: 'cohere',
        priority: 5,
        dailyLimit: 1000,
        hourlyLimit: 100,
        minuteLimit: 20,
        concurrency: 6,
        exponentialBackoff: true,
        retryAttempts: 3
      },
      {
        name: 'OpenRouter Premium Strategy',
        description: 'Premium routing with rate limits',
        provider: 'openrouter',
        priority: 6,
        dailyLimit: 5000,
        hourlyLimit: 100,
        minuteLimit: 10,
        concurrency: 4,
        exponentialBackoff: true,
        retryAttempts: 2
      }
    ];

    strategies.forEach(strategy => {
      this.strategies.set(strategy.provider, strategy);
    });
  }

  /**
   * Initialize intelligent routing rules for AI features
   */
  private initializeRoutingRules(): void {
    const rules: IntelligentRoutingRule[] = [
      {
        featureId: 1,
        featureName: 'Smart Topic Suggestion',
        preferredProviders: ['groq', 'cerebras'],
        fallbackProviders: ['mistral', 'cohere'],
        loadBalancingStrategy: 'least_used',
        maxRetries: 2,
        timeout: 10000
      },
      {
        featureId: 3,
        featureName: 'Performance Insights',
        preferredProviders: ['cerebras', 'groq'],
        fallbackProviders: ['gemini', 'mistral'],
        loadBalancingStrategy: 'fastest_response',
        maxRetries: 2,
        timeout: 15000
      },
      {
        featureId: 14,
        featureName: 'Daily Tips',
        preferredProviders: ['groq', 'cohere'],
        fallbackProviders: ['openrouter'],
        loadBalancingStrategy: 'priority',
        maxRetries: 1,
        timeout: 8000
      },
      {
        featureId: 6,
        featureName: 'Natural Language',
        preferredProviders: ['gemini', 'cerebras'],
        fallbackProviders: ['mistral', 'cohere'],
        loadBalancingStrategy: 'round_robin',
        maxRetries: 2,
        timeout: 12000
      },
      {
        featureId: 8,
        featureName: 'Dynamic Rescheduling',
        preferredProviders: ['groq', 'cerebras'],
        fallbackProviders: ['cohere', 'mistral'],
        loadBalancingStrategy: 'least_used',
        maxRetries: 2,
        timeout: 10000
      }
    ];

    rules.forEach(rule => {
      this.routingRules.set(rule.featureId, rule);
    });
  }

  /**
   * Initialize provider metrics tracking
   */
  private initializeProviderMetrics(): void {
    const providers: AIProvider[] = ['groq', 'gemini', 'cerebras', 'cohere', 'mistral', 'openrouter'];
    
    providers.forEach(provider => {
      this.providerMetrics.set(provider, {
        provider,
        requestsToday: 0,
        requestsHour: 0,
        requestsMinute: 0,
        averageLatency: 0,
        successRate: 100,
        errorRate: 0,
        cacheHitRate: 0,
        costEstimate: 0,
        lastUsed: new Date(),
        loadFactor: 0
      });

      this.healthStatuses.set(provider, {
        provider,
        isHealthy: true,
        lastError: null,
        errorCount: 0,
        averageResponseTime: 0,
        successRate: 100,
        errorRate: 0,
        currentLoad: 0,
        rateLimitRemaining: 100,
        rateLimitResetTime: new Date(),
        cooldownUntil: null
      });

      this.lastRequestTimes.set(provider, []);
      this.roundRobinIndex.set(provider, 0);
    });

    this.isInitialized = true;
  }

  /**
   * Get intelligent routing decision for a feature
   */
  async getIntelligentRouting(featureId: number, requestSize: number = 1000): Promise<RoutingDecision> {
    const rule = this.routingRules.get(featureId);
    if (!rule) {
      throw new Error(`No routing rule found for feature: ${featureId}`);
    }

    const availableProviders = await this.filterHealthyProviders(rule.preferredProviders);
    
    if (availableProviders.length === 0) {
      // Use fallback providers
      const fallbackProviders = await this.filterHealthyProviders(rule.fallbackProviders);
      if (fallbackProviders.length === 0) {
        throw new Error('No healthy providers available');
      }
      
      const selectedProvider = this.selectProvider(fallbackProviders, rule.loadBalancingStrategy, rule.featureName);
      return {
        selectedProvider,
        confidence: 0.3,
        reason: `Primary providers unavailable, using fallback`,
        fallbackUsed: true,
        estimatedLatency: this.estimateLatency(selectedProvider),
        cost: this.estimateCost(selectedProvider, requestSize)
      };
    }

    const selectedProvider = this.selectProvider(availableProviders, rule.loadBalancingStrategy, rule.featureName);
    const metrics = this.providerMetrics.get(selectedProvider);
    
    // Check rate limits before selection
    if (await this.isRateLimited(selectedProvider)) {
      console.warn(`Provider ${selectedProvider} is rate limited, attempting fallback`);
      const fallbackProviders = await this.filterHealthyProviders(rule.fallbackProviders);
      if (fallbackProviders.length > 0) {
        const fallbackProvider = this.selectProvider(fallbackProviders, rule.loadBalancingStrategy, rule.featureName);
        return {
          selectedProvider: fallbackProvider,
          confidence: 0.6,
          reason: `${selectedProvider} was rate limited`,
          fallbackUsed: true,
          estimatedLatency: this.estimateLatency(fallbackProvider),
          cost: this.estimateCost(fallbackProvider, requestSize)
        };
      }
    }

    return {
      selectedProvider,
      confidence: 0.9,
      reason: `Optimal provider selected based on ${rule.loadBalancingStrategy} strategy`,
      fallbackUsed: false,
      estimatedLatency: this.estimateLatency(selectedProvider),
      cost: this.estimateCost(selectedProvider, requestSize)
    };
  }

  /**
   * Record provider usage after successful/failed request
   */
  async recordProviderUsage(
    provider: AIProvider, 
    latency: number, 
    success: boolean, 
    tokensUsed: number = 0,
    cost: number = 0
  ): Promise<void> {
    const metrics = this.providerMetrics.get(provider);
    const health = this.healthStatuses.get(provider);
    
    if (!metrics || !health) {
      throw new Error(`Provider ${provider} not found in tracking`);
    }

    const now = new Date();
    this.updateRequestTimes(provider, now);

    // Update metrics
    metrics.requestsToday++;
    metrics.requestsHour = this.getRecentRequests(provider, 60); // Last hour
    metrics.requestsMinute = this.getRecentRequests(provider, 1); // Last minute
    metrics.lastUsed = now;
    metrics.costEstimate += cost;

    // Update latency metrics
    if (metrics.averageLatency === 0) {
      metrics.averageLatency = latency;
    } else {
      metrics.averageLatency = (metrics.averageLatency * 0.9) + (latency * 0.1);
    }

    // Update success/error rates
    const totalRequests = metrics.requestsToday;
    const errors = health.errorCount;
    metrics.successRate = ((totalRequests - errors) / totalRequests) * 100;
    metrics.errorRate = (errors / totalRequests) * 100;

    // Calculate load factor
    metrics.loadFactor = this.calculateLoadFactor(provider);

    // Update health status
    if (success) {
      health.isHealthy = true;
      health.errorCount = Math.max(0, health.errorCount - 1);
      health.successRate = metrics.successRate;
    } else {
      health.errorCount++;
      health.isHealthy = health.errorCount < 3; // Unhealthy after 3 consecutive errors
      health.lastError = now;
      health.errorRate = metrics.errorRate;
      
      // Apply cooldown for failing providers
      if (health.errorCount >= 3) {
        health.cooldownUntil = new Date(Date.now() + 60000); // 1 minute cooldown
      }
    }

    health.averageResponseTime = metrics.averageLatency;
    health.currentLoad = metrics.loadFactor;

    // Update rate limit tracker
    rateLimitTracker.recordRequest(provider);

    console.log(`Recorded ${provider} usage: ${success ? 'success' : 'error'}, latency: ${latency}ms`);
  }

  /**
   * Check if provider is currently rate limited
   */
  async isRateLimited(provider: AIProvider): Promise<boolean> {
    const health = this.healthStatuses.get(provider);
    if (!health) return true;

    // Check if in cooldown period
    if (health.cooldownUntil && new Date() < health.cooldownUntil) {
      return true;
    }

    // Check rate limits via tracker
    const rateLimitStatus = rateLimitTracker.getStatistics();
    const providerStatus = rateLimitStatus.providerStatuses.find(s => s.provider === provider);
    return providerStatus ? providerStatus.percentage >= 95 : true;
  }

  /**
   * Get provider health status
   */
  getProviderHealth(provider: AIProvider): ProviderHealthStatus | null {
    return this.healthStatuses.get(provider) || null;
  }

  /**
   * Get all provider health statuses
   */
  getAllProviderHealth(): ProviderHealthStatus[] {
    return Array.from(this.healthStatuses.values());
  }

  /**
   * Get provider metrics
   */
  getProviderMetrics(provider: AIProvider): ProviderMetrics | null {
    return this.providerMetrics.get(provider) || null;
  }

  /**
   * Get routing statistics
   */
  getRoutingStatistics(): {
    totalRequests: number;
    successfulRoutings: number;
    fallbackUsage: number;
    averageConfidence: number;
  } {
    const metrics = Array.from(this.providerMetrics.values());
    const totalRequests = metrics.reduce((sum, m) => sum + m.requestsToday, 0);
    
    return {
      totalRequests,
      successfulRoutings: totalRequests, // Simplified - would track actual success
      fallbackUsage: 0, // Would track actual fallback usage
      averageConfidence: 85 // Would calculate actual average
    };
  }

  /**
   * Force provider cooldown (admin function)
   */
  forceProviderCooldown(provider: AIProvider, durationMinutes: number = 5): void {
    const health = this.healthStatuses.get(provider);
    if (health) {
      health.cooldownUntil = new Date(Date.now() + durationMinutes * 60 * 1000);
      console.log(`Forced cooldown for ${provider} for ${durationMinutes} minutes`);
    }
  }

  /**
   * Reset provider statistics (admin function)
   */
  resetProviderStats(provider: AIProvider): void {
    const metrics = this.providerMetrics.get(provider);
    const health = this.healthStatuses.get(provider);
    
    if (metrics) {
      Object.assign(metrics, {
        requestsToday: 0,
        requestsHour: 0,
        requestsMinute: 0,
        averageLatency: 0,
        successRate: 100,
        errorRate: 0,
        cacheHitRate: 0,
        costEstimate: 0,
        lastUsed: new Date(),
        loadFactor: 0
      });
    }

    if (health) {
      Object.assign(health, {
        isHealthy: true,
        lastError: null,
        errorCount: 0,
        averageResponseTime: 0,
        successRate: 100,
        currentLoad: 0,
        cooldownUntil: null
      });
    }

    this.lastRequestTimes.set(provider, []);
    this.roundRobinIndex.set(provider, 0);

    console.log(`Reset statistics for ${provider}`);
  }

  /**
   * Get provider recommendations for optimization
   */
  getOptimizationRecommendations(): Array<{
    type: 'warning' | 'suggestion' | 'critical';
    provider?: AIProvider;
    message: string;
    action: string;
  }> {
    const recommendations: Array<{
      type: 'warning' | 'suggestion' | 'critical';
      provider?: AIProvider;
      message: string;
      action: string;
    }> = [];

    // Check for unhealthy providers
    this.healthStatuses.forEach((health, provider) => {
      if (!health.isHealthy) {
        recommendations.push({
          type: 'critical',
          provider,
          message: `${provider} is unhealthy with ${health.errorCount} errors`,
          action: 'Check provider configuration and network connectivity'
        });
      }
    });

    // Check for rate limit approaching
    const rateLimitStats = rateLimitTracker.getStatistics();
    rateLimitStats.providerStatuses.forEach(status => {
      if (status.percentage > 80) {
        recommendations.push({
          type: 'warning',
          provider: status.provider,
          message: `${status.provider} approaching rate limit (${status.percentage.toFixed(1)}%)`,
          action: 'Consider redistributing load to other providers'
        });
      }
    });

    // Check for performance issues
    this.providerMetrics.forEach((metrics, provider) => {
      if (metrics.averageLatency > 5000) {
        recommendations.push({
          type: 'suggestion',
          provider,
          message: `${provider} has high latency (${metrics.averageLatency.toFixed(0)}ms)`,
          action: 'Consider optimizing prompt size or switching to faster provider'
        });
      }
    });

    return recommendations;
  }

  /**
   * Apply intelligent load balancing
   */
  async balanceProviderLoad(): Promise<void> {
    const providers = Array.from(this.providerMetrics.keys());
    const avgLoad = providers.reduce((sum, p) => {
      const metrics = this.providerMetrics.get(p);
      return sum + (metrics?.loadFactor || 0);
    }, 0) / providers.length;

    // Identify overloaded providers
    const overloaded = providers.filter(p => {
      const metrics = this.providerMetrics.get(p);
      return (metrics?.loadFactor || 0) > avgLoad * 1.5;
    });

    const underutilized = providers.filter(p => {
      const metrics = this.providerMetrics.get(p);
      return (metrics?.loadFactor || 0) < avgLoad * 0.5;
    });

    if (overloaded.length > 0 && underutilized.length > 0) {
      console.log(`Load balancing: ${overloaded.length} overloaded, ${underutilized.length} underutilized`);
      // In a real implementation, this would adjust routing weights
    }
  }

  /**
   * Private helper methods
   */
  private async filterHealthyProviders(providers: AIProvider[]): Promise<AIProvider[]> {
    const healthy: AIProvider[] = [];
    
    for (const provider of providers) {
      const health = this.healthStatuses.get(provider);
      if (health && health.isHealthy && !await this.isRateLimited(provider)) {
        healthy.push(provider);
      }
    }
    
    return healthy;
  }

  private selectProvider(
    providers: AIProvider[], 
    strategy: 'round_robin' | 'least_used' | 'fastest_response' | 'priority',
    featureName: string
  ): AIProvider {
    switch (strategy) {
      case 'round_robin':
        return this.selectRoundRobin(providers);
      case 'least_used':
        return this.selectLeastUsed(providers);
      case 'fastest_response':
        return this.selectFastest(providers);
      case 'priority':
        return providers[0];
      default:
        return providers[0];
    }
  }

  private selectRoundRobin(providers: AIProvider[]): AIProvider {
    const provider = providers[0]; // Simplified - would implement actual round robin
    return provider;
  }

  private selectLeastUsed(providers: AIProvider[]): AIProvider {
    return providers.reduce((least, current) => {
      const leastMetrics = this.providerMetrics.get(least);
      const currentMetrics = this.providerMetrics.get(current);
      return (currentMetrics?.loadFactor || 0) < (leastMetrics?.loadFactor || 0) ? current : least;
    });
  }

  private selectFastest(providers: AIProvider[]): AIProvider {
    return providers.reduce((fastest, current) => {
      const fastestMetrics = this.providerMetrics.get(fastest);
      const currentMetrics = this.providerMetrics.get(current);
      return (currentMetrics?.averageLatency || Infinity) < (fastestMetrics?.averageLatency || Infinity) ? current : fastest;
    });
  }

  private updateRequestTimes(provider: AIProvider, timestamp: Date): void {
    const times = this.lastRequestTimes.get(provider) || [];
    times.push(timestamp);
    
    // Keep only last hour of timestamps
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentTimes = times.filter(t => t > oneHourAgo);
    
    this.lastRequestTimes.set(provider, recentTimes);
  }

  private getRecentRequests(provider: AIProvider, minutes: number): number {
    const times = this.lastRequestTimes.get(provider) || [];
    const cutoff = new Date(Date.now() - minutes * 60 * 1000);
    return times.filter(t => t > cutoff).length;
  }

  private calculateLoadFactor(provider: AIProvider): number {
    const metrics = this.providerMetrics.get(provider);
    if (!metrics) return 0;

    // Calculate load based on multiple factors
    const recentLoad = this.getRecentRequests(provider, 1) / 10; // Normalize to 0-1
    const hourlyLoad = metrics.requestsHour / 100; // Normalize
    const latencyFactor = Math.min(metrics.averageLatency / 1000, 1); // Cap at 1 second
    
    return (recentLoad * 0.5) + (hourlyLoad * 0.3) + (latencyFactor * 0.2);
  }

  private estimateLatency(provider: AIProvider): number {
    const metrics = this.providerMetrics.get(provider);
    return metrics?.averageLatency || 1000;
  }

  private estimateCost(provider: AIProvider, requestSize: number): number {
    // Mock cost estimation - would use actual provider pricing
    const baseCosts: Record<AIProvider, number> = {
      groq: 0.0001,
      gemini: 0.0002,
      cerebras: 0.00015,
      cohere: 0.0003,
      mistral: 0.00025,
      openrouter: 0.0004
    };

    return baseCosts[provider] * requestSize;
  }
}

// Export singleton instance
export const rateLimitManager = new RateLimitManager();
