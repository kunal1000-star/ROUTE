// Enhanced Auto-fallback Logic System
// ====================================

import { createClient } from '@supabase/supabase-js';
import { rateLimitTracker } from './rate-limit-tracker';
import { responseCache } from './response-cache';
import { realtimeDataIntegration } from './realtime-data-integration';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface ProviderMetrics {
  provider: string;
  successRate: number;
  averageLatency: number;
  currentLoad: number;
  rateLimitStatus: 'ok' | 'approaching' | 'blocked';
  errorCount: number;
  lastError?: string;
  uptime: number;
  reliabilityScore: number;
}

export interface FallbackStrategy {
  name: string;
  priority: number;
  conditions: FallbackCondition[];
  actions: FallbackAction[];
}

export interface FallbackCondition {
  type: 'success_rate' | 'latency' | 'rate_limit' | 'error_rate' | 'load';
  operator: '<' | '>' | '<=' | '>=' | '==';
  value: number;
  timeframe?: string;
}

export interface FallbackAction {
  type: 'switch_provider' | 'increase_timeout' | 'enable_caching' | 'reduce_load' | 'circuit_breaker';
  parameters: Record<string, any>;
}

export class AutoFallbackManager {
  private static instance: AutoFallbackManager;
  private providerMetrics: Map<string, ProviderMetrics> = new Map();
  private fallbackStrategies: Map<string, FallbackStrategy> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private activeProvider: string = 'groq';
  private fallbackHistory: FallbackEvent[] = [];
  private isInitialized: boolean = false;

  private constructor() {
    this.initializeSystem();
  }

  public static getInstance(): AutoFallbackManager {
    if (!AutoFallbackManager.instance) {
      AutoFallbackManager.instance = new AutoFallbackManager();
    }
    return AutoFallbackManager.instance;
  }

  private async initializeSystem(): Promise<void> {
    console.log('🔄 Initializing Auto-fallback Logic System...');
    await this.initializeProviderMetrics();
    this.setupFallbackStrategies();
    this.initializeCircuitBreakers();
    this.startMonitoring();
    this.isInitialized = true;
    console.log('✅ Auto-fallback Logic System initialized');
  }

  private async initializeProviderMetrics(): Promise<void> {
    const providers = ['groq', 'cohere', 'mistral', 'gemini', 'cerebras', 'openrouter'];
    
    for (const provider of providers) {
      const metrics = await this.collectProviderMetrics(provider);
      this.providerMetrics.set(provider, metrics);
    }
  }

  private async collectProviderMetrics(provider: string): Promise<ProviderMetrics> {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    try {
      const { data: usageData, error } = await supabase
        .from('api_usage_logs')
        .select('success, latency_ms, error_message')
        .eq('provider_used', provider)
        .gte('timestamp', fifteenMinutesAgo);

      if (error || !usageData) {
        throw new Error(`Failed to collect metrics for ${provider}: ${error?.message}`);
      }

      const totalRequests = usageData.length;
      const successfulRequests = usageData.filter(req => req.success).length;
      const failedRequests = totalRequests - successfulRequests;
      
      const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;
      const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
      const averageLatency = usageData.reduce((sum, req) => sum + req.latency_ms, 0) / totalRequests;
      
      const rateLimitStatus = rateLimitTracker.getProviderStatus(provider);
      const reliabilityScore = this.calculateReliabilityScore({
        successRate,
        averageLatency,
        errorRate,
        uptime: 95
      });

      return {
        provider,
        successRate,
        averageLatency,
        currentLoad: totalRequests,
        rateLimitStatus: rateLimitStatus.status === 'blocked' ? 'blocked' : 
                        rateLimitStatus.requestsTotal > 800 ? 'approaching' : 'ok',
        errorCount: failedRequests,
        uptime: 95,
        reliabilityScore
      };
    } catch (error) {
      console.error(`Error collecting metrics for ${provider}:`, error);
      return {
        provider,
        successRate: 0,
        averageLatency: 0,
        currentLoad: 0,
        rateLimitStatus: 'blocked' as any,
        errorCount: 0,
        uptime: 0,
        reliabilityScore: 0
      };
    }
  }

  private calculateReliabilityScore(metrics: {
    successRate: number;
    averageLatency: number;
    errorRate: number;
    uptime: number;
  }): number {
    const { successRate, averageLatency, errorRate, uptime } = metrics;
    
    const successScore = (successRate / 100) * 40;
    const latencyScore = Math.max(0, (5000 - averageLatency) / 5000) * 25;
    const errorScore = Math.max(0, (20 - errorRate) / 20) * 25;
    const uptimeScore = (uptime / 100) * 10;
    
    return Math.round(successScore + latencyScore + errorScore + uptimeScore);
  }

  private setupFallbackStrategies(): void {
    this.fallbackStrategies.set('rate_limit', {
      name: 'Rate Limit Fallback',
      priority: 1,
      conditions: [
        { type: 'rate_limit', operator: '==', value: 1 }
      ],
      actions: [
        { type: 'switch_provider', parameters: { targetProvider: 'auto', excludeCurrent: true } }
      ]
    });

    this.fallbackStrategies.set('high_error_rate', {
      name: 'High Error Rate Fallback',
      priority: 2,
      conditions: [
        { type: 'error_rate', operator: '>', value: 15 },
        { type: 'success_rate', operator: '<', value: 85 }
      ],
      actions: [
        { type: 'switch_provider', parameters: { targetProvider: 'highest_reliability' } }
      ]
    });

    this.fallbackStrategies.set('high_latency', {
      name: 'High Latency Fallback',
      priority: 3,
      conditions: [
        { type: 'latency', operator: '>', value: 5000 }
      ],
      actions: [
        { type: 'switch_provider', parameters: { targetProvider: 'fastest' } }
      ]
    });
  }

  private initializeCircuitBreakers(): void {
    const providers = ['groq', 'cohere', 'mistral', 'gemini', 'cerebras', 'openrouter'];
    
    for (const provider of providers) {
      this.circuitBreakers.set(provider, new CircuitBreaker({
        failureThreshold: 5,
        resetTimeout: 30000,
        monitorWindow: 60000
      }));
    }
  }

  private startMonitoring(): void {
    setInterval(async () => {
      await this.updateAllMetrics();
    }, 30000);

    setInterval(() => {
      this.checkFallbackConditions();
    }, 10000);
  }

  private async updateAllMetrics(): Promise<void> {
    const providers = ['groq', 'cohere', 'mistral', 'gemini', 'cerebras', 'openrouter'];
    
    for (const provider of providers) {
      const metrics = await this.collectProviderMetrics(provider);
      this.providerMetrics.set(provider, metrics);
    }
  }

  private checkFallbackConditions(): void {
    if (!this.isInitialized) return;

    const currentProviderMetrics = this.providerMetrics.get(this.activeProvider);
    if (!currentProviderMetrics) return;

    for (const [strategyName, strategy] of this.fallbackStrategies) {
      if (this.evaluateConditions(strategy.conditions, currentProviderMetrics)) {
        this.executeFallback(strategy);
        break;
      }
    }
  }

  private evaluateConditions(conditions: FallbackCondition[], metrics: ProviderMetrics): boolean {
    return conditions.every(condition => {
      const value = this.getConditionValue(condition.type, metrics);
      
      switch (condition.operator) {
        case '<': return value < condition.value;
        case '>': return value > condition.value;
        case '<=': return value <= condition.value;
        case '>=': return value >= condition.value;
        case '==': return value == condition.value;
        default: return false;
      }
    });
  }

  private getConditionValue(type: string, metrics: ProviderMetrics): number {
    switch (type) {
      case 'success_rate': return metrics.successRate;
      case 'latency': return metrics.averageLatency;
      case 'rate_limit': 
        return metrics.rateLimitStatus === 'blocked' ? 1 : 
               metrics.rateLimitStatus === 'approaching' ? 0.5 : 0;
      case 'error_rate': return (metrics.errorCount / Math.max(metrics.currentLoad, 1)) * 100;
      case 'load': return metrics.currentLoad;
      default: return 0;
    }
  }

  private executeFallback(strategy: FallbackStrategy): void {
    console.log(`🔄 Executing fallback strategy: ${strategy.name}`);
    
    const event: FallbackEvent = {
      timestamp: new Date().toISOString(),
      trigger: strategy.name,
      fromProvider: this.activeProvider,
      toProvider: this.activeProvider,
      reason: this.generateFallbackReason(strategy),
      actions: strategy.actions.map(action => action.type)
    };

    strategy.actions.forEach(action => {
      this.executeAction(action, event);
    });

    this.fallbackHistory.push(event);
    
    console.log(`✅ Fallback executed: ${event.fromProvider} → ${event.toProvider}`);
  }

  private executeAction(action: FallbackAction, event: FallbackEvent): void {
    switch (action.type) {
      case 'switch_provider':
        this.switchProvider(action.parameters, event);
        break;
    }
  }

  private switchProvider(parameters: Record<string, any>, event: FallbackEvent): void {
    const targetProvider = this.selectBestProvider(parameters);
    
    if (targetProvider && targetProvider !== this.activeProvider) {
      event.toProvider = targetProvider;
      this.activeProvider = targetProvider;
      console.log(`🔄 Switched to provider: ${targetProvider}`);
    }
  }

  private selectBestProvider(parameters: Record<string, any>): string | null {
    const availableProviders = Array.from(this.providerMetrics.keys())
      .filter(provider => provider !== this.activeProvider);

    if (availableProviders.length === 0) {
      return null;
    }

    let bestProvider = availableProviders[0];
    let bestScore = 0;

    for (const provider of availableProviders) {
      const metrics = this.providerMetrics.get(provider);
      const circuitBreaker = this.circuitBreakers.get(provider);
      
      if (circuitBreaker && circuitBreaker.isOpen()) {
        continue;
      }

      let score = 0;
      
      if (parameters.targetProvider === 'highest_reliability') {
        score = metrics?.reliabilityScore || 0;
      } else if (parameters.targetProvider === 'fastest') {
        score = metrics?.averageLatency ? 10000 - metrics.averageLatency : 0;
      } else {
        score = (metrics?.reliabilityScore || 0) * 0.4 +
                (metrics?.successRate || 0) * 0.3 +
                (metrics?.averageLatency ? 10000 - metrics.averageLatency : 0) * 0.3;
      }

      if (score > bestScore) {
        bestScore = score;
        bestProvider = provider;
      }
    }

    return bestProvider;
  }

  private generateFallbackReason(strategy: FallbackStrategy): string {
    const metrics = this.providerMetrics.get(this.activeProvider);
    if (!metrics) return 'Unknown reason';

    return `${strategy.name}: ${metrics.errorCount} errors, ${metrics.successRate.toFixed(1)}% success rate`;
  }

  public getSystemStatus(): {
    activeProvider: string;
    providerMetrics: Record<string, ProviderMetrics>;
    fallbackHistory: FallbackEvent[];
  } {
    return {
      activeProvider: this.activeProvider,
      providerMetrics: Object.fromEntries(this.providerMetrics),
      fallbackHistory: this.fallbackHistory.slice(-10)
    };
  }

  public getBestProvider(): string {
    const bestProvider = this.selectBestProvider({ targetProvider: 'auto' });
    return bestProvider || this.activeProvider;
  }
}

class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(private config: {
    failureThreshold: number;
    resetTimeout: number;
    monitorWindow: number;
  }) {}

  public recordResult(success: boolean): void {
    const now = Date.now();
    
    if (success) {
      this.failures = 0;
      if (this.state === 'half-open') {
        this.state = 'closed';
      }
    } else {
      this.failures++;
      this.lastFailureTime = now;
      
      if (this.failures >= this.config.failureThreshold) {
        this.state = 'open';
      }
    }

    if (this.state === 'open' && 
        now - this.lastFailureTime > this.config.resetTimeout) {
      this.state = 'half-open';
    }
  }

  public isOpen(): boolean {
    return this.state === 'open';
  }

  public open(): void {
    this.state = 'open';
    this.lastFailureTime = Date.now();
  }
}

interface FallbackEvent {
  timestamp: string;
  trigger: string;
  fromProvider: string;
  toProvider: string;
  reason: string;
  actions: string[];
}

export const autoFallbackManager = AutoFallbackManager.getInstance();
