// Mistral Embeddings Provider
// ============================

import type { AIProvider } from '@/types/api-test';

export interface MistralEmbeddingRequest {
  model?: string;
  texts: string[];
}

export interface MistralEmbeddingResponse {
  id: string;
  object: string;
  data: Array<{
    object: string;
    embedding: number[];
    index: number;
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

export class MistralEmbeddingProvider {
  private readonly provider: AIProvider = 'mistral';
  private readonly baseUrl = 'https://api.mistral.ai/v1';
  private readonly defaultModel = 'mistral-embed';

  constructor(private apiKey: string) {
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is required');
    }
  }

  /**
   * Generate embeddings for text(s)
   */
  async generateEmbeddings(params: {
    texts: string[];
    model?: string;
    timeout?: number;
  }): Promise<number[][]> {
    const { texts, model, timeout = 30000 } = params;
    
    if (!texts || texts.length === 0) {
      throw new Error('Texts array cannot be empty');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${this.baseUrl}/embeddings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || this.defaultModel,
          input: texts,
          encoding_format: 'float',
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Mistral API error: ${response.status} ${response.statusText} - ${errorData.message || 'Unknown error'}`);
      }

      const data: MistralEmbeddingResponse = await response.json();
      
      // Validate response structure
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error('Invalid response structure from Mistral API');
      }

      // Extract embeddings
      const embeddings = data.data.map(item => {
        if (!item.embedding || !Array.isArray(item.embedding)) {
          throw new Error('Invalid embedding format in response');
        }
        return item.embedding;
      });

      return embeddings;

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timed out after ${timeout}ms`);
        }
        throw error;
      }
      
      throw new Error(`Unknown error: ${error}`);
    }
  }

  /**
   * Health check for Mistral embeddings
   */
  async healthCheck(): Promise<{
    healthy: boolean;
    responseTime: number;
    error?: string;
  }> {
    const startTime = Date.now();

    try {
      const embeddings = await this.generateEmbeddings({
        texts: ['test'],
        timeout: 5000
      });

      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        healthy: false,
        responseTime: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get available embedding models
   */
  getAvailableModels(): string[] {
    return [
      'mistral-embed',      // Default English
      'mistral-embed-mix',  // Multilingual support
    ];
  }

  /**
   * Get provider information
   */
  getProviderInfo() {
    return {
      name: 'Mistral AI',
      provider: this.provider,
      models: this.getAvailableModels(),
      capabilities: {
        supportsEmbeddings: true,
        maxTextLength: 32000,
        dimensions: 1024, // Mistral embeddings are 1024 dimensions
      },
      pricing: {
        costPerToken: .0001, // Estimated
      }
    };
  }
}

/**
 * Factory function to create Mistral provider
 */
export function createMistralEmbeddingProvider(apiKey?: string): MistralEmbeddingProvider {
  const key = apiKey || process.env.MISTRAL_API_KEY;
  if (!key) {
    throw new Error('MISTRAL_API_KEY environment variable is required');
  }
  return new MistralEmbeddingProvider(key);
}

// Export singleton instance
export const mistralEmbeddingProvider = new MistralEmbeddingProvider(
  process.env.MISTRAL_API_KEY || ''
);
