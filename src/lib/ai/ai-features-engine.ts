// AI Features Engine - Central Orchestrator for All 22 AI Features
// =================================================================

import type { AIServiceManagerResponse } from '@/types/ai-service-manager';
import { aiServiceManager } from './ai-service-manager-fixed';
import { testLogger } from './logger';

// Feature Categories and Definitions
export enum FeatureCategory {
  PERFORMANCE_ANALYSIS = 'performance_analysis',
  STUDY_SCHEDULING = 'study_scheduling', 
  PREDICTION_ESTIMATION = 'prediction_estimation',
  MOTIVATION_LEARNING = 'motivation_learning'
}

export enum FeaturePriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface AIFeature {
  id: number;
  name: string;
  description: string;
  category: FeatureCategory;
  priority: FeaturePriority;
  modelProvider: string;
  modelName: string;
  estimatedTimeMs: number;
  batchable: boolean;
  cacheable: boolean;
  cacheTTLMinutes: number;
  enabled: boolean;
  version: string;
}

export interface FeatureRequest {
  featureId: number;
  userId: string;
  context: Record<string, any>;
  priority?: FeaturePriority;
  timeoutMs?: number;
  batchId?: string;
}

export interface FeatureResponse {
  featureId: number;
  success: boolean;
  data?: any;
  error?: {
    message: string;
    code: string;
    details?: any;
  };
  metadata: {
    modelUsed: string;
    provider: string;
    tokensUsed: {
      input: number;
      output: number;
    };
    latencyMs: number;
    cached: boolean;
    timestamp: string;
  };
}

export interface BatchRequest {
  batchId: string;
  requests: FeatureRequest[];
  userId: string;
  priority: FeaturePriority;
}

export interface BatchResponse {
  batchId: string;
  results: FeatureResponse[];
  summary: {
    total: number;
    successful: number;
    failed: number;
    totalLatencyMs: number;
    totalTokensUsed: {
      input: number;
      output: number;
    };
  };
  timestamp: string;
}

// Feature Implementation Templates
export interface FeatureImplementation {
  (request: FeatureRequest, context: any): Promise<FeatureResponse>;
}

// Define all 22 AI Features
export const AI_FEATURES: Record<number, AIFeature> = {
  // Features 1-6: Performance Analysis
  1: {
    id: 1,
    name: 'Smart Topic Suggestions',
    description: 'Analyze study patterns to suggest optimal topics based on performance data',
    category: FeatureCategory.PERFORMANCE_ANALYSIS,
    priority: FeaturePriority.HIGH,
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    estimatedTimeMs: 3000,
    batchable: true,
    cacheable: true,
    cacheTTLMinutes: 30,
    enabled: true,
    version: '1.0.0'
  },
  2: {
    id: 2,
    name: 'Weak Area Identification',
    description: 'Identify knowledge gaps and weak areas in student performance',
    category: FeatureCategory.PERFORMANCE_ANALYSIS,
    priority: FeaturePriority.HIGH,
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    estimatedTimeMs: 4000,
    batchable: true,
    cacheable: true,
    cacheTTLMinutes: 60,
    enabled: true,
    version: '1.0.0'
  },
  3: {
    id: 3,
    name: 'Performance Insights',
    description: 'Generate detailed performance analysis and insights',
    category: FeatureCategory.PERFORMANCE_ANALYSIS,
    priority: FeaturePriority.HIGH,
    modelProvider: 'gemini',
    modelName: 'gemini-2.0-flash-lite',
    estimatedTimeMs: 5000,
    batchable: false,
    cacheable: true,
    cacheTTLMinutes: 120,
    enabled: true,
    version: '1.0.0'
  },
  4: {
    id: 4,
    name: 'Performance Analysis',
    description: 'Comprehensive performance tracking and trend analysis',
    category: FeatureCategory.PERFORMANCE_ANALYSIS,
    priority: FeaturePriority.HIGH,
    modelProvider: 'groq',
    modelName: 'llama-3.3-70b-versatile',
    estimatedTimeMs: 3500,
    batchable: true,
    cacheable: true,
    cacheTTLMinutes: 60,
    enabled: true,
    version: '1.0.0'
  },
  5: {
    id: 5,
    name: 'Personalized Recommendations',
    description: 'Generate personalized study recommendations based on learning style',
    category: FeatureCategory.PERFORMANCE_ANALYSIS,
    priority: FeaturePriority.MEDIUM,
    modelProvider: 'cerebras',
    modelName: 'llama-3.3-70b',
    estimatedTimeMs: 4500,
    batchable: true,
    cacheable: true,
    cacheTTLMinutes: 90,
    enabled: true,
    version: '1.0.0'
  },
  6: {
    id: 6,
    name: 'Natural Language Inputs',
    description: 'Process natural language queries and convert to structured data',
    category: FeatureCategory.PERFORMANCE_ANALYSIS,
    priority: FeaturePriority.MEDIUM,
    modelProvider: 'openrouter',
    modelName: 'openai/gpt-3.5-turbo',
    estimatedTimeMs: 2000,
    batchable: true,
    cacheable: false,
    cacheTTLMinutes: 0,
    enabled: true,
    version: '1.0.0'
  },

  // Features 7-12: Study Scheduling (placeholder definitions)
  7: { id: 7, name: 'Smart Schedule Generation', description: 'Generate optimal study schedules', category: FeatureCategory.STUDY_SCHEDULING, priority: FeaturePriority.HIGH, modelProvider: 'groq', modelName: 'llama-3.3-70b-versatile', estimatedTimeMs: 4000, batchable: true, cacheable: true, cacheTTLMinutes: 60, enabled: true, version: '1.0.0' },
  8: { id: 8, name: 'Dynamic Rescheduling', description: 'Adjust schedules based on performance', category: FeatureCategory.STUDY_SCHEDULING, priority: FeaturePriority.MEDIUM, modelProvider: 'gemini', modelName: 'gemini-2.0-flash-lite', estimatedTimeMs: 3000, batchable: true, cacheable: true, cacheTTLMinutes: 30, enabled: true, version: '1.0.0' },
  9: { id: 9, name: 'Chapter Prioritization', description: 'Prioritize chapters based on exam dates', category: FeatureCategory.STUDY_SCHEDULING, priority: FeaturePriority.HIGH, modelProvider: 'groq', modelName: 'llama-3.3-70b-versatile', estimatedTimeMs: 2500, batchable: true, cacheable: true, cacheTTLMinutes: 60, enabled: true, version: '1.0.0' },
  10: { id: 10, name: 'Priority Ranking', description: 'Rank study tasks by importance', category: FeatureCategory.STUDY_SCHEDULING, priority: FeaturePriority.MEDIUM, modelProvider: 'cerebras', modelName: 'llama-3.3-70b', estimatedTimeMs: 2000, batchable: true, cacheable: true, cacheTTLMinutes: 45, enabled: true, version: '1.0.0' },
  11: { id: 11, name: 'Pomodoro Optimization', description: 'Optimize Pomodoro timer settings', category: FeatureCategory.STUDY_SCHEDULING, priority: FeaturePriority.LOW, modelProvider: 'mistral', modelName: 'mistral-medium-latest', estimatedTimeMs: 1500, batchable: true, cacheable: true, cacheTTLMinutes: 120, enabled: true, version: '1.0.0' },
  12: { id: 12, name: 'Break Optimization', description: 'Recommend optimal break times and activities', category: FeatureCategory.STUDY_SCHEDULING, priority: FeaturePriority.LOW, modelProvider: 'groq', modelName: 'llama-3.3-70b-versatile', estimatedTimeMs: 1800, batchable: true, cacheable: true, cacheTTLMinutes: 90, enabled: true, version: '1.0.0' },

  // Features 13-17: Prediction & Estimation
  13: { id: 13, name: 'Mastery Prediction', description: 'Predict time to master topics', category: FeatureCategory.PREDICTION_ESTIMATION, priority: FeaturePriority.HIGH, modelProvider: 'gemini', modelName: 'gemini-2.0-flash-lite', estimatedTimeMs: 4000, batchable: true, cacheable: true, cacheTTLMinutes: 120, enabled: true, version: '1.0.0' },
  14: { id: 14, name: 'Difficulty Prediction', description: 'Predict topic difficulty levels', category: FeatureCategory.PREDICTION_ESTIMATION, priority: FeaturePriority.HIGH, modelProvider: 'groq', modelName: 'llama-3.3-70b-versatile', estimatedTimeMs: 3000, batchable: true, cacheable: true, cacheTTLMinutes: 90, enabled: true, version: '1.0.0' },
  15: { id: 15, name: 'Time Estimation', description: 'Estimate study time for topics', category: FeatureCategory.PREDICTION_ESTIMATION, priority: FeaturePriority.MEDIUM, modelProvider: 'cerebras', modelName: 'llama-3.3-70b', estimatedTimeMs: 2500, batchable: true, cacheable: true, cacheTTLMinutes: 60, enabled: true, version: '1.0.0' },
  16: { id: 16, name: 'Question Volume Recommendations', description: 'Recommend question quantities for practice', category: FeatureCategory.PREDICTION_ESTIMATION, priority: FeaturePriority.MEDIUM, modelProvider: 'mistral', modelName: 'mistral-medium-latest', estimatedTimeMs: 2000, batchable: true, cacheable: true, cacheTTLMinutes: 90, enabled: true, version: '1.0.0' },
  17: { id: 17, name: 'Prerequisite Suggestions', description: 'Suggest prerequisite topics for learning', category: FeatureCategory.PREDICTION_ESTIMATION, priority: FeaturePriority.MEDIUM, modelProvider: 'openrouter', modelName: 'openai/gpt-3.5-turbo', estimatedTimeMs: 3500, batchable: true, cacheable: true, cacheTTLMinutes: 120, enabled: true, version: '1.0.0' },

  // Features 18-22: Motivation & Learning
  18: { id: 18, name: 'Daily Study Tips', description: 'Generate daily motivational study tips', category: FeatureCategory.MOTIVATION_LEARNING, priority: FeaturePriority.MEDIUM, modelProvider: 'groq', modelName: 'llama-3.3-70b-versatile', estimatedTimeMs: 2000, batchable: true, cacheable: true, cacheTTLMinutes: 1440, enabled: true, version: '1.0.0' },
  19: { id: 19, name: 'Motivational Messages', description: 'Provide personalized motivational messages', category: FeatureCategory.MOTIVATION_LEARNING, priority: FeaturePriority.MEDIUM, modelProvider: 'gemini', modelName: 'gemini-2.0-flash-lite', estimatedTimeMs: 1800, batchable: true, cacheable: true, cacheTTLMinutes: 720, enabled: true, version: '1.0.0' },
  20: { id: 20, name: 'Study Technique Recommendations', description: 'Recommend effective study techniques', category: FeatureCategory.MOTIVATION_LEARNING, priority: FeaturePriority.LOW, modelProvider: 'cerebras', modelName: 'llama-3.3-70b', estimatedTimeMs: 3000, batchable: true, cacheable: true, cacheTTLMinutes: 480, enabled: true, version: '1.0.0' },
  21: { id: 21, name: 'Practice Recommendations', description: 'Suggest practice activities and exercises', category: FeatureCategory.MOTIVATION_LEARNING, priority: FeaturePriority.MEDIUM, modelProvider: 'mistral', modelName: 'mistral-medium-latest', estimatedTimeMs: 2500, batchable: true, cacheable: true, cacheTTLMinutes: 240, enabled: true, version: '1.0.0' },
  22: { id: 22, name: 'Revision Suggestions', description: 'Provide personalized revision strategies', category: FeatureCategory.MOTIVATION_LEARNING, priority: FeaturePriority.LOW, modelProvider: 'openrouter', modelName: 'openai/gpt-3.5-turbo', estimatedTimeMs: 2800, batchable: true, cacheable: true, cacheTTLMinutes: 360, enabled: true, version: '1.0.0' }
};

export class AIFeaturesEngine {
  private featureImplementations: Map<number, FeatureImplementation> = new Map();
  private cache: Map<string, { data: any; expires: number }> = new Map();
  private performanceMetrics: Map<number, { totalCalls: number; totalLatency: number; successRate: number }> = new Map();
  private isInitialized: boolean = false;

  constructor() {
    this.initializeFeatures();
  }

  /**
   * Initialize all feature implementations
   */
  private async initializeFeatures(): Promise<void> {
    try {
      // Initialize performance analysis features (1-6)
      await this.initializePerformanceFeatures();
      
      // Initialize other feature categories
      await this.initializeSchedulingFeatures();
      await this.initializePredictionFeatures();
      await this.initializeMotivationFeatures();

      this.isInitialized = true;
      console.log('AI Features Engine initialized successfully', {
        totalFeatures: Object.keys(AI_FEATURES).length,
        categories: Object.values(FeatureCategory).length
      });
    } catch (error) {
      console.error('Failed to initialize AI Features Engine', { error });
      throw error;
    }
  }

  /**
   * Initialize performance analysis features (1-6)
   */
  private async initializePerformanceFeatures(): Promise<void> {
    // Feature 1: Smart Topic Suggestions
    this.featureImplementations.set(1, async (request: FeatureRequest) => {
      return await this.processFeature(1, request, async (context) => {
        const { studyData, performanceHistory, examDates } = context;
        const prompt = `
        Analyze the student's study patterns and performance data to suggest optimal next topics.
        
        Study Data: ${JSON.stringify(studyData)}
        Performance History: ${JSON.stringify(performanceHistory)}
        Exam Dates: ${JSON.stringify(examDates)}
        
        Provide 3-5 topic suggestions with reasoning.
        `;
        
        return this.callModel(prompt, 'groq', 'llama-3.3-70b-versatile', request.userId);
      });
    });

    // Feature 2: Weak Area Identification
    this.featureImplementations.set(2, async (request: FeatureRequest) => {
      return await this.processFeature(2, request, async (context) => {
        const { quizResults, studySessionData, errorPatterns } = context;
        const prompt = `
        Identify knowledge gaps and weak areas based on the following data:
        
        Quiz Results: ${JSON.stringify(quizResults)}
        Study Session Data: ${JSON.stringify(studySessionData)}
        Error Patterns: ${JSON.stringify(errorPatterns)}
        
        Provide detailed analysis of weak areas with specific recommendations.
        `;
        
        return this.callModel(prompt, 'groq', 'llama-3.3-70b-versatile', request.userId);
      });
    });

    // Feature 3: Performance Insights
    this.featureImplementations.set(3, async (request: FeatureRequest) => {
      return await this.processFeature(3, request, async (context) => {
        const { performanceMetrics, trends, comparisons } = context;
        const prompt = `
        Generate comprehensive performance analysis and insights:
        
        Performance Metrics: ${JSON.stringify(performanceMetrics)}
        Trends: ${JSON.stringify(trends)}
        Comparisons: ${JSON.stringify(comparisons)}
        
        Provide detailed insights with actionable recommendations.
        `;
        
        return this.callModel(prompt, 'gemini', 'gemini-2.0-flash-lite', request.userId);
      });
    });

    // Feature 4: Performance Analysis
    this.featureImplementations.set(4, async (request: FeatureRequest) => {
      return await this.processFeature(4, request, async (context) => {
        const { sessionData, timeSpent, topicsCovered, accuracyRates } = context;
        const prompt = `
        Analyze study performance and identify trends:
        
        Session Data: ${JSON.stringify(sessionData)}
        Time Spent: ${JSON.stringify(timeSpent)}
        Topics Covered: ${JSON.stringify(topicsCovered)}
        Accuracy Rates: ${JSON.stringify(accuracyRates)}
        
        Provide performance analysis with trend identification.
        `;
        
        return this.callModel(prompt, 'groq', 'llama-3.3-70b-versatile', request.userId);
      });
    });

    // Feature 5: Personalized Recommendations
    this.featureImplementations.set(5, async (request: FeatureRequest) => {
      return await this.processFeature(5, request, async (context) => {
        const { learningStyle, preferences, performancePatterns } = context;
        const prompt = `
        Generate personalized study recommendations based on learning style:
        
        Learning Style: ${JSON.stringify(learningStyle)}
        Preferences: ${JSON.stringify(preferences)}
        Performance Patterns: ${JSON.stringify(performancePatterns)}
        
        Provide 5-7 personalized recommendations.
        `;
        
        return this.callModel(prompt, 'cerebras', 'llama-3.3-70b', request.userId);
      });
    });

    // Feature 6: Natural Language Inputs
    this.featureImplementations.set(6, async (request: FeatureRequest) => {
      return await this.processFeature(6, request, async (context) => {
        const { query, userContext } = context;
        const prompt = `
        Process this natural language query and extract structured information:
        
        Query: "${query}"
        User Context: ${JSON.stringify(userContext)}
        
        Extract: intent, entities, parameters, and context requirements.
        `;
        
        return this.callModel(prompt, 'openrouter', 'openai/gpt-3.5-turbo', request.userId);
      });
    });
  }

  /**
   * Initialize scheduling features (7-12)
   */
  private async initializeSchedulingFeatures(): Promise<void> {
    // Placeholder implementations for features 7-12
    for (let i = 7; i <= 12; i++) {
      this.featureImplementations.set(i, async (request: FeatureRequest) => {
        return await this.processFeature(i, request, async (context) => {
          const feature = AI_FEATURES[i];
          const prompt = `Generate ${feature.name.toLowerCase()} recommendations for: ${JSON.stringify(context)}`;
          return this.callModel(prompt, feature.modelProvider, feature.modelName);
        });
      });
    }
  }

  /**
   * Initialize prediction features (13-17)
   */
  private async initializePredictionFeatures(): Promise<void> {
    // Placeholder implementations for features 13-17
    for (let i = 13; i <= 17; i++) {
      this.featureImplementations.set(i, async (request: FeatureRequest) => {
        return await this.processFeature(i, request, async (context) => {
          const feature = AI_FEATURES[i];
          const prompt = `Generate ${feature.name.toLowerCase()} for: ${JSON.stringify(context)}`;
          return this.callModel(prompt, feature.modelProvider, feature.modelName);
        });
      });
    }
  }

  /**
   * Initialize motivation features (18-22)
   */
  private async initializeMotivationFeatures(): Promise<void> {
    // Placeholder implementations for features 18-22
    for (let i = 18; i <= 22; i++) {
      this.featureImplementations.set(i, async (request: FeatureRequest) => {
        return await this.processFeature(i, request, async (context) => {
          const feature = AI_FEATURES[i];
          const prompt = `Generate ${feature.name.toLowerCase()} for: ${JSON.stringify(context)}`;
          return this.callModel(prompt, feature.modelProvider, feature.modelName);
        });
      });
    }
  }

  /**
   * Execute a single AI feature
   */
  async executeFeature(request: FeatureRequest): Promise<FeatureResponse> {
    if (!this.isInitialized) {
      await this.initializeFeatures();
    }

    const feature = AI_FEATURES[request.featureId];
    if (!feature) {
      return {
        featureId: request.featureId,
        success: false,
        error: {
          message: `Feature ${request.featureId} not found`,
          code: 'FEATURE_NOT_FOUND'
        },
        metadata: {
          modelUsed: '',
          provider: '',
          tokensUsed: { input: 0, output: 0 },
          latencyMs: 0,
          cached: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    if (!feature.enabled) {
      return {
        featureId: request.featureId,
        success: false,
        error: {
          message: `Feature ${feature.name} is disabled`,
          code: 'FEATURE_DISABLED'
        },
        metadata: {
          modelUsed: '',
          provider: '',
          tokensUsed: { input: 0, output: 0 },
          latencyMs: 0,
          cached: false,
          timestamp: new Date().toISOString()
        }
      };
    }

    // Check cache first
    if (feature.cacheable) {
      const cacheKey = this.generateCacheKey(request);
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        return {
          featureId: request.featureId,
          success: true,
          data: cached.data,
          metadata: {
            modelUsed: feature.modelName,
            provider: feature.modelProvider,
            tokensUsed: { input: 0, output: 0 },
            latencyMs: 0,
            cached: true,
            timestamp: new Date().toISOString()
          }
        };
      }
    }

    // Execute feature
    const startTime = Date.now();
    try {
      const implementation = this.featureImplementations.get(request.featureId);
      if (!implementation) {
        throw new Error(`Implementation not found for feature ${request.featureId}`);
      }

      const response = await implementation(request, request.context);
      
      // Cache result if applicable
      if (response.success && feature.cacheable) {
        const cacheKey = this.generateCacheKey(request);
        this.setCache(cacheKey, response.data, feature.cacheTTLMinutes);
      }

      // Update metrics
      this.updateMetrics(request.featureId, Date.now() - startTime, response.success);

      return response;
    } catch (error) {
      const errorResponse: FeatureResponse = {
        featureId: request.featureId,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          code: 'EXECUTION_ERROR',
          details: error
        },
        metadata: {
          modelUsed: feature.modelName,
          provider: feature.modelProvider,
          tokensUsed: { input: 0, output: 0 },
          latencyMs: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString()
        }
      };

      this.updateMetrics(request.featureId, errorResponse.metadata.latencyMs, false);
      return errorResponse;
    }
  }

  /**
   * Execute multiple features in batch
   */
  async executeBatch(request: BatchRequest): Promise<BatchResponse> {
    const startTime = Date.now();
    const results: FeatureResponse[] = [];
    let totalTokensInput = 0;
    let totalTokensOutput = 0;

    for (const featureRequest of request.requests) {
      try {
        const result = await this.executeFeature(featureRequest);
        results.push(result);
        
        if (result.success) {
          totalTokensInput += result.metadata.tokensUsed.input;
          totalTokensOutput += result.metadata.tokensUsed.output;
        }
      } catch (error) {
        results.push({
          featureId: featureRequest.featureId,
          success: false,
          error: {
            message: error instanceof Error ? error.message : 'Batch execution error',
            code: 'BATCH_ERROR'
          },
          metadata: {
            modelUsed: '',
            provider: '',
            tokensUsed: { input: 0, output: 0 },
            latencyMs: 0,
            cached: false,
            timestamp: new Date().toISOString()
          }
        });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.length - successful;

    return {
      batchId: request.batchId,
      results,
      summary: {
        total: results.length,
        successful,
        failed,
        totalLatencyMs: Date.now() - startTime,
        totalTokensUsed: {
          input: totalTokensInput,
          output: totalTokensOutput
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Process individual feature with standardized flow
   */
  private async processFeature(
    featureId: number,
    request: FeatureRequest,
    processFn: (context: any) => Promise<AIServiceManagerResponse>
  ): Promise<FeatureResponse> {
    const feature = AI_FEATURES[featureId];
    const startTime = Date.now();

    try {
      const response = await processFn(request.context);
      
      return {
        featureId,
        success: true,
        data: response.content,
        metadata: {
          modelUsed: response.model_used,
          provider: response.provider,
          tokensUsed: response.tokens_used,
          latencyMs: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        featureId,
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Feature processing failed',
          code: 'PROCESSING_ERROR',
          details: error
        },
        metadata: {
          modelUsed: feature.modelName,
          provider: feature.modelProvider,
          tokensUsed: { input: 0, output: 0 },
          latencyMs: Date.now() - startTime,
          cached: false,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Call AI model through service manager
   */
  private async callModel(
    prompt: string,
    provider: string,
    modelName: string,
    userId: string = 'ai-features-system'
  ): Promise<AIServiceManagerResponse> {
    return await aiServiceManager.processQuery({
      message: prompt,
      chatType: 'general',
      userId,
      conversationId: `ai-features-${Date.now()}`,
      includeAppData: false
    });
  }

  /**
   * Cache management
   */
  private generateCacheKey(request: FeatureRequest): string {
    const contextStr = JSON.stringify(request.context);
    const hash = this.simpleHash(contextStr);
    return `feature_${request.featureId}_${hash}`;
  }

  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private getFromCache(key: string): { data: any; expires: number } | null {
    const cached = this.cache.get(key);
    if (cached && cached.expires > Date.now()) {
      return cached;
    }
    this.cache.delete(key);
    return null;
  }

  private setCache(key: string, data: any, ttlMinutes: number): void {
    const expires = Date.now() + (ttlMinutes * 60 * 1000);
    this.cache.set(key, { data, expires });
    
    // Clean up expired entries periodically
    if (this.cache.size > 1000) {
      this.cleanupCache();
    }
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (value.expires <= now) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Performance metrics tracking
   */
  private updateMetrics(featureId: number, latency: number, success: boolean): void {
    const current = this.performanceMetrics.get(featureId) || {
      totalCalls: 0,
      totalLatency: 0,
      successRate: 0
    };

    const newTotalCalls = current.totalCalls + 1;
    const newTotalLatency = current.totalLatency + latency;
    const newSuccessCount = success ? 1 : 0;
    const newFailedCount = newTotalCalls - newSuccessCount;
    const newSuccessRate = newSuccessCount / newTotalCalls;

    this.performanceMetrics.set(featureId, {
      totalCalls: newTotalCalls,
      totalLatency: newTotalLatency,
      successRate: newSuccessRate
    });
  }

  /**
   * Get performance metrics for a feature
   */
  getFeatureMetrics(featureId: number): { totalCalls: number; avgLatency: number; successRate: number } | null {
    const metrics = this.performanceMetrics.get(featureId);
    if (!metrics) return null;

    return {
      totalCalls: metrics.totalCalls,
      avgLatency: metrics.totalCalls > 0 ? metrics.totalLatency / metrics.totalCalls : 0,
      successRate: metrics.successRate
    };
  }

  /**
   * Get all enabled features by category
   */
  getFeaturesByCategory(category: FeatureCategory): AIFeature[] {
    return Object.values(AI_FEATURES).filter(
      feature => feature.category === category && feature.enabled
    );
  }

  /**
   * Enable/disable feature
   */
  toggleFeature(featureId: number, enabled: boolean): boolean {
    const feature = AI_FEATURES[featureId];
    if (feature) {
      feature.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get engine status
   */
  getStatus(): {
    initialized: boolean;
    totalFeatures: number;
    enabledFeatures: number;
    cachedEntries: number;
    performanceMetrics: Record<number, any>;
  } {
    const enabledCount = Object.values(AI_FEATURES).filter(f => f.enabled).length;
    
    return {
      initialized: this.isInitialized,
      totalFeatures: Object.keys(AI_FEATURES).length,
      enabledFeatures: enabledCount,
      cachedEntries: this.cache.size,
      performanceMetrics: Object.fromEntries(this.performanceMetrics)
    };
  }
}

// Export singleton instance
export const aiFeaturesEngine = new AIFeaturesEngine();