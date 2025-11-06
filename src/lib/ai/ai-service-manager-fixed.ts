// AI Service Manager - Fixed Version (Working Providers Only)
// =======================================================

import type { 
  AIServiceManagerRequest,
  AIServiceManagerResponse,
  QueryType,
  ProviderTier,
  AppDataContext
} from '@/types/ai-service-manager';
import type { AIProvider } from '@/types/api-test';

// Import working provider clients only
import { groqClient } from './providers/groq-client';
import { geminiClient } from './providers/gemini-client';

// Simplified Fallback Chain Configuration (working providers only)
const FALLBACK_CHAINS: Record<QueryType, Array<{ provider: AIProvider; tier: ProviderTier }>> = {
  time_sensitive: [
    { provider: 'gemini', tier: 1 },
    { provider: 'groq', tier: 2 }
  ],
  app_data: [
    { provider: 'groq', tier: 1 },
    { provider: 'gemini', tier: 2 }
  ],
  general: [
    { provider: 'groq', tier: 1 },
    { provider: 'gemini', tier: 2 }
  ]
};

// Provider client registry (only working providers)
const PROVIDER_CLIENTS = {
  groq: groqClient,
  gemini: geminiClient
} as const;

export class AIServiceManager {
  private maxRetries: number = 3;
  private retryDelay: number = 2000; // 2 seconds

  /**
   * Main entry point - Process query through intelligent routing
   */
  async processQuery(request: AIServiceManagerRequest): Promise<AIServiceManagerResponse> {
    const startTime = Date.now();
    
    try {
      // Step 1: Simple query detection (default to general)
      const queryDetection = {
        type: 'general' as QueryType,
        confidence: 0.8
      };

      // Step 2: Get app data context if needed
      let appDataContext: AppDataContext | undefined;
      if (request.includeAppData) {
        appDataContext = await this.getAppDataContext(request.userId);
      }

      // Step 3: Get fallback chain for this query type
      const fallbackChain = FALLBACK_CHAINS[queryDetection.type];

      // Step 4: Try providers in order with fallback
      let lastError: Error | null = null;
      let fallbackUsed = false;
      let tierUsed = 1;

      for (const { provider: providerName, tier } of fallbackChain) {
        try {
          // Make request to provider
          const response = await this.callProvider({
            providerName,
            request,
            queryDetection,
            appDataContext,
            webSearchEnabled: false, // Simplified for now
            tier
          });

          return response;

        } catch (error) {
          lastError = error as Error;
          tierUsed = tier;
          
          console.warn(`Provider ${providerName} (tier ${tier}) failed:`, error);
          
          // If this is not the first provider, mark as fallback used
          if (tier > 1) {
            fallbackUsed = true;
          }

          // Continue to next provider
          if (tier >= fallbackChain.length) {
            break;
          }
        }
      }

      // Step 5: All providers failed, return graceful degradation
      const latency = Date.now() - startTime;
      const gracefulResponse: AIServiceManagerResponse = {
        content: 'I apologize, but I\'m experiencing high demand right now. Please try again in a few moments, and I\'ll be happy to help!',
        model_used: 'graceful_degradation',
        provider: 'system',
        query_type: queryDetection.type,
        tier_used: tierUsed,
        cached: false,
        tokens_used: { input: 0, output: 0 },
        latency_ms: latency,
        web_search_enabled: false,
        fallback_used: fallbackUsed,
        limit_approaching: false
      };

      return gracefulResponse;

    } catch (error) {
      // Critical error handling
      const latency = Date.now() - startTime;
      console.error('AI Service Manager critical error:', error);

      return {
        content: 'I apologize, but I\'m experiencing technical difficulties. Please try again in a moment.',
        model_used: 'error_handler',
        provider: 'system',
        query_type: 'general',
        tier_used: 2,
        cached: false,
        tokens_used: { input: 0, output: 0 },
        latency_ms: latency,
        web_search_enabled: false,
        fallback_used: false,
        limit_approaching: false
      };
    }
  }

  /**
   * Call a specific provider with error handling
   */
  private async callProvider(params: {
    providerName: AIProvider;
    request: AIServiceManagerRequest;
    queryDetection: any;
    appDataContext?: AppDataContext;
    webSearchEnabled: boolean;
    tier: number;
  }): Promise<AIServiceManagerResponse> {
    const { providerName, request, queryDetection, appDataContext, webSearchEnabled, tier } = params;
    
    const client = PROVIDER_CLIENTS[providerName];
    if (!client) {
      throw new Error(`Unknown provider: ${providerName}`);
    }

    // Prepare messages
    const messages = this.prepareMessages(request, queryDetection, appDataContext);

    // Make the API call
    let response: AIServiceManagerResponse;
    
    switch (providerName) {
      case 'groq':
        response = await client.chat({
          messages,
          model: this.getModelForQuery(queryDetection.type, 'groq'),
          webSearchEnabled
        });
        break;
        
      case 'gemini':
        response = await client.chat({
          messages,
          model: this.getModelForQuery(queryDetection.type, 'gemini'),
          webSearchEnabled
        });
        break;
        
      default:
        throw new Error(`Provider ${providerName} not implemented`);
    }

    // Update response with correct metadata
    response.tier_used = tier;
    response.query_type = queryDetection.type;
    response.web_search_enabled = webSearchEnabled;

    return response;
  }

  /**
   * Prepare messages with context and app data
   */
  private prepareMessages(
    request: AIServiceManagerRequest,
    queryDetection: any,
    appDataContext?: AppDataContext
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // System message based on query type
    let systemMessage = this.getSystemMessage(queryDetection.type, request.chatType);
    
    // Add app data context if available
    if (appDataContext) {
      systemMessage += `\n\nStudent Context:\n- Progress: ${appDataContext.studyProgress.completedBlocks}/${appDataContext.studyProgress.totalBlocks} blocks completed\n- Accuracy: ${appDataContext.studyProgress.accuracy}%`;
    }

    messages.push({
      role: 'system',
      content: systemMessage
    });

    // Add user message
    messages.push({
      role: 'user',
      content: request.message
    });

    return messages;
  }

  /**
   * Get appropriate model for query type and provider
   */
  private getModelForQuery(queryType: QueryType, provider: AIProvider): string {
    const modelMappings: Record<QueryType, Record<AIProvider, string>> = {
      time_sensitive: {
        groq: 'llama-3.3-70b-versatile',
        gemini: 'gemini-2.0-flash-lite'
      },
      app_data: {
        groq: 'llama-3.3-70b-versatile',
        gemini: 'gemini-1.5-flash'
      },
      general: {
        groq: 'llama-3.3-70b-versatile',
        gemini: 'gemini-1.5-flash'
      }
    };

    return modelMappings[queryType]?.[provider] || 'default';
  }

  /**
   * Get system message based on query type
   */
  private getSystemMessage(queryType: QueryType, chatType: string): string {
    const baseMessage = chatType === 'study_assistant' 
      ? 'You are a helpful study assistant for BlockWise, an educational platform.'
      : 'You are a helpful AI assistant for BlockWise users.';

    switch (queryType) {
      case 'time_sensitive':
        return `${baseMessage} You excel at providing current, time-sensitive information and answers. Be concise and accurate.`;

      case 'app_data':
        return `${baseMessage} You help students analyze their study progress and performance data. Provide insights based on their activity and achievements.`;

      case 'general':
      default:
        return `${baseMessage} Provide helpful, accurate, and engaging responses to student questions.`;
    }
  }

  /**
   * Get app data context for a user
   */
  private async getAppDataContext(userId: string): Promise<AppDataContext> {
    // Return mock data - in production, fetch from Supabase
    return {
      userId,
      studyProgress: {
        totalBlocks: 50,
        completedBlocks: 35,
        accuracy: 78,
        subjectsStudied: ['Mathematics', 'Physics', 'Chemistry'],
        timeSpent: 120 // hours
      },
      recentActivity: {
        lastStudySession: new Date(),
        questionsAnswered: 245,
        correctAnswers: 191,
        topicsStruggled: ['Integration', 'Electromagnetism'],
        topicsStrong: ['Algebra', 'Mechanics']
      },
      preferences: {
        difficulty: 'intermediate',
        subjects: ['Mathematics', 'Physics'],
        studyGoals: ['Exam preparation', 'Concept clarity']
      }
    };
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager();

// Export the main processQuery function
export const processQuery = (request: AIServiceManagerRequest): Promise<AIServiceManagerResponse> => {
  return aiServiceManager.processQuery(request);
};
