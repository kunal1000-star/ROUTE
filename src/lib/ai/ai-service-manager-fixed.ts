// AI Service Manager - Fixed Version with Improved Error Handling
// =============================================================

import type { 
  AIServiceManagerRequest,
  AIServiceManagerResponse,
  QueryType,
  ProviderTier,
  AppDataContext
} from '@/types/ai-service-manager';

// Simplified provider import strategy - handle failures gracefully
let groqClient: any = null;
let geminiClient: any = null;
let cerebrasClient: any = null;
let cohereClient: any = null;
let mistralClient: any = null;
let openRouterClient: any = null;

// Safe import function with fallback
async function importProviderSafely(providerName: string): Promise<any> {
  try {
    const module = await import(`./providers/${providerName}-client`);
    return module.default || module[providerName + 'Client'] || module;
  } catch (error) {
    console.warn(`Failed to import ${providerName} provider:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Initialize providers safely
async function initializeProviders() {
  try {
    const groqModule = await importProviderSafely('groq');
    groqClient = groqModule?.groqClient || groqModule;
    
    const geminiModule = await importProviderSafely('gemini');
    geminiClient = geminiModule?.geminiClient || geminiModule;
    
    const cerebrasModule = await importProviderSafely('cerebras');
    cerebrasClient = cerebrasModule?.cerebrasClient || cerebrasModule;
    
    const cohereModule = await importProviderSafely('cohere');
    cohereClient = cohereModule?.cohereClient || cohereModule;
    
    const mistralModule = await importProviderSafely('mistral');
    mistralClient = mistralModule?.mistralClient || mistralModule;
    
    const openRouterModule = await importProviderSafely('openrouter');
    openRouterClient = openRouterModule?.openRouterClient || openRouterModule;
    
    console.log('AI providers initialized successfully');
  } catch (error) {
    console.error('Failed to initialize AI providers:', error);
  }
}

// Dynamic Provider Configuration
interface ProviderConfig {
  client: any;
  healthy: boolean;
  lastCheck: number;
  responseTime: number;
  tier: number;
  name: string;
}

// Initialize with safe defaults
let ALL_PROVIDERS: Record<string, ProviderConfig> = {
  groq: { client: null, healthy: false, lastCheck: 0, responseTime: 0, tier: 1, name: 'groq' },
  gemini: { client: null, healthy: false, lastCheck: 0, responseTime: 0, tier: 2, name: 'gemini' },
  cerebras: { client: null, healthy: false, lastCheck: 0, responseTime: 0, tier: 3, name: 'cerebras' },
  cohere: { client: null, healthy: false, lastCheck: 0, responseTime: 0, tier: 4, name: 'cohere' },
  mistral: { client: null, healthy: false, lastCheck: 0, responseTime: 0, tier: 5, name: 'mistral' },
  openrouter: { client: null, healthy: false, lastCheck: 0, responseTime: 0, tier: 6, name: 'openrouter' }
};

export class AIServiceManager {
  private healthCheckInterval: number = 600000; // 10 minutes
  private lastHealthCheck: number = 0;
  private isCheckingHealth: boolean = false;
  private initialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private async initialize() {
    if (this.initialized) return;
    
    try {
      await initializeProviders();
      
      // Update provider configs with imported clients
      ALL_PROVIDERS = {
        groq: { ...ALL_PROVIDERS.groq, client: groqClient },
        gemini: { ...ALL_PROVIDERS.gemini, client: geminiClient },
        cerebras: { ...ALL_PROVIDERS.cerebras, client: cerebrasClient },
        cohere: { ...ALL_PROVIDERS.cohere, client: cohereClient },
        mistral: { ...ALL_PROVIDERS.mistral, client: mistralClient },
        openrouter: { ...ALL_PROVIDERS.openrouter, client: openRouterClient }
      };
      
      this.initialized = true;
      console.log('AI Service Manager initialized successfully');
    } catch (error) {
      console.error('AI Service Manager initialization failed:', error);
    }
  }

  /**
   * Main entry point - Process query through intelligent routing
   */
  async processQuery(request: AIServiceManagerRequest): Promise<AIServiceManagerResponse> {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      console.log(`[${requestId}] Processing query for user ${request.userId}`);
      
      // Ensure initialization
      await this.initialize();
      
      // Get available providers
      const availableProviders = this.getAvailableProviders('general');
      console.log(`[${requestId}] Available providers: ${availableProviders.join(', ')}`);

      if (availableProviders.length === 0) {
        return this.getGracefulDegradationResponse(request, startTime, 'general', 'No providers available');
      }

      // Try providers in order
      let lastError: Error | null = null;
      let providerUsed = 'none';

      for (const providerName of availableProviders) {
        try {
          console.log(`[${requestId}] Trying provider: ${providerName}`);
          
          // Check if provider has client
          const providerConfig = ALL_PROVIDERS[providerName];
          if (!providerConfig?.client) {
            console.log(`[${requestId}] Skipping ${providerName} - no client available`);
            continue;
          }

          // Make request to provider
          const response = await this.callProvider({
            providerName,
            request,
            tier: providerConfig.tier,
            requestId
          });

          console.log(`[${requestId}] Success with provider: ${providerName}`);
          return response;

        } catch (error) {
          lastError = error as Error;
          providerUsed = providerName;
          console.warn(`[${requestId}] Provider ${providerName} failed:`, error);
        }
      }

      // All providers failed
      console.log(`[${requestId}] All providers failed, returning graceful degradation`);
      return this.getGracefulDegradationResponse(request, startTime, 'general', lastError?.message);

    } catch (error) {
      // Critical error handling
      const latency = Date.now() - startTime;
      console.error(`[${requestId}] AI Service Manager critical error:`, error);

      return this.getGracefulDegradationResponse(request, startTime, 'general', error instanceof Error ? error.message : 'Unknown error');
    }
  }

  /**
   * Get available (healthy) providers for a query type
   */
  private getAvailableProviders(queryType: QueryType): string[] {
    const healthyProviders = Object.entries(ALL_PROVIDERS)
      .filter(([_, config]) => config.client && config.healthy)
      .map(([name]) => name);
    
    // If no healthy providers, return all with clients
    if (healthyProviders.length === 0) {
      return Object.entries(ALL_PROVIDERS)
        .filter(([_, config]) => config.client)
        .map(([name]) => name);
    }
    
    return healthyProviders;
  }

  /**
   * Call a specific provider
   */
  private async callProvider(params: {
    providerName: string;
    request: AIServiceManagerRequest;
    tier: number;
    requestId: string;
  }): Promise<AIServiceManagerResponse> {
    const { providerName, request, tier, requestId } = params;
    
    const client = ALL_PROVIDERS[providerName].client;
    if (!client) {
      throw new Error(`No client available for provider: ${providerName}`);
    }

    // Prepare messages
    const messages = this.prepareMessages(request);

    // Make the API call
    let response: AIServiceManagerResponse;
    
    try {
      switch (providerName) {
        case 'groq':
          response = await client.chat({
            messages,
            model: 'llama-3.3-70b-versatile',
            webSearchEnabled: false
          });
          break;
          
        case 'gemini':
          response = await client.chat({
            messages,
            model: 'gemini-2.0-flash-lite',
            webSearchEnabled: false
          });
          break;
          
        case 'cerebras':
          response = await client.chat({
            messages,
            model: 'llama-3.3-70b'
          });
          break;
          
        case 'cohere':
          response = await client.chat({
            message: request.message,
            chatHistory: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content })),
            model: 'command'
          });
          break;
          
        case 'mistral':
          response = await client.chat({
            messages,
            model: 'mistral-large-latest'
          });
          break;
          
        case 'openrouter':
          response = await client.chat({
            messages,
            model: 'meta-llama/llama-3.1-8b-instruct:free'
          });
          break;
          
        default:
          throw new Error(`Provider ${providerName} not implemented`);
      }

      // Update response with correct metadata
      response.tier_used = tier;
      response.query_type = 'general';
      response.web_search_enabled = false;

      return response;
    } catch (error) {
      throw new Error(`Provider ${providerName} call failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Prepare messages with context
   */
  private prepareMessages(
    request: AIServiceManagerRequest
  ): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
    const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];

    // System message
    const systemMessage = request.chatType === 'study_assistant' 
      ? 'You are a helpful study assistant for BlockWise, an educational platform. Provide clear, accurate answers to help students learn.'
      : 'You are a helpful AI assistant for BlockWise users. Provide helpful, accurate, and engaging responses.';

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
   * Get graceful degradation response
   */
  private getGracefulDegradationResponse(
    request: AIServiceManagerRequest, 
    startTime: number, 
    queryType: QueryType, 
    errorMessage?: string
  ): AIServiceManagerResponse {
    const latency = Date.now() - startTime;
    
    // More helpful fallback messages
    let content: string;
    if (errorMessage?.includes('rate limit')) {
      content = 'I\'m experiencing high demand right now. Please try again in a few moments.';
    } else if (errorMessage?.includes('unavailable')) {
      content = 'I\'m currently upgrading my capabilities. Please try again in a moment.';
    } else {
      content = 'I\'m here to help! I\'m currently experiencing some technical difficulties, but I\'m working on getting back to full capacity.';
    }
    
    return {
      content,
      model_used: 'graceful_degradation',
      provider: 'system' as any,
      query_type: queryType,
      tier_used: 6,
      cached: false,
      tokens_used: { input: 0, output: 0 },
      latency_ms: latency,
      web_search_enabled: false,
      fallback_used: true,
      limit_approaching: false
    };
  }

  /**
   * Manual health check trigger
   */
  async healthCheck(): Promise<Record<string, { healthy: boolean; responseTime: number; error?: string }>> {
    const results: Record<string, { healthy: boolean; responseTime: number; error?: string }> = {};

    for (const [providerName, config] of Object.entries(ALL_PROVIDERS)) {
      if (!config.client) {
        results[providerName] = {
          healthy: false,
          responseTime: 0,
          error: 'No client implementation'
        };
        continue;
      }

      try {
        const startTime = Date.now();
        await config.client.healthCheck();
        const responseTime = Date.now() - startTime;
        results[providerName] = {
          healthy: true,
          responseTime
        };
        // Update config
        config.healthy = true;
        config.lastCheck = Date.now();
        config.responseTime = responseTime;
      } catch (error) {
        results[providerName] = {
          healthy: false,
          responseTime: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        // Update config
        config.healthy = false;
        config.lastCheck = Date.now();
      }
    }

    return results;
  }

  /**
   * Get system statistics
   */
  async getStatistics() {
    const healthyProviders = Object.entries(ALL_PROVIDERS)
      .filter(([_, config]) => config.client && config.healthy)
      .map(([name, config]) => ({
        name,
        healthy: config.healthy,
        responseTime: config.responseTime,
        lastCheck: config.lastCheck
      }));

    return {
      providers: healthyProviders,
      totalProviders: Object.keys(ALL_PROVIDERS).length,
      healthyCount: healthyProviders.length,
      initialized: this.initialized
    };
  }
}

// Export singleton instance
export const aiServiceManager = new AIServiceManager();

// Export the main processQuery function
export const processQuery = (request: AIServiceManagerRequest): Promise<AIServiceManagerResponse> => {
  return aiServiceManager.processQuery(request);
};
