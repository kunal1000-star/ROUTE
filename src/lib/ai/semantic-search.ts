// Semantic Search Service for Study Memories
// =========================================

import { unifiedEmbeddingService, generateEmbeddings } from './unified-embedding-service';
import { MemoryQueries } from '@/lib/database/queries';
import type { StudyChatMemoryWithSimilarity } from '@/types/database-ai';
import type { AIProvider } from '@/types/api-test';

export interface SemanticSearchOptions {
  userId: string;
  query: string;
  limit?: number;
  minSimilarity?: number;
  tags?: string[];
  importanceScore?: number;
  contextLevel?: 'light' | 'balanced' | 'comprehensive';
  preferredProvider?: AIProvider;
}

export interface SemanticSearchResult {
  memories: StudyChatMemoryWithSimilarity[];
  queryEmbedding: number[];
  searchStats: {
    totalFound: number;
    averageSimilarity: number;
    searchTimeMs: number;
    embeddingGenerated: boolean;
    provider: AIProvider;
    model: string;
    dimensions: number;
    usage: {
      requestCount: number;
      totalTokens: number;
      cost: number;
    };
  };
}

export interface EmbeddingUsageStats {
  total: { requests: number; cost: number };
  byProvider: Record<AIProvider, { requests: number; cost: number; healthy: boolean }>;
}

const EMBEDDING_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Semantic Search Service for Study Memories
 * Uses multi-provider embeddings with automatic fallback
 */
export class SemanticSearchService {
  private embeddingCache: Map<string, { embedding: number[]; timestamp: number; provider: AIProvider; model: string }> = new Map();

  /**
   * Main semantic search function
   */
  async searchMemories(options: SemanticSearchOptions): Promise<SemanticSearchResult> {
    const startTime = Date.now();
    const {
      userId,
      query,
      limit = 5,
      minSimilarity = 0.7,
      tags,
      importanceScore,
      contextLevel = 'balanced',
      preferredProvider
    } = options;

    try {
      // Step 1: Generate or get cached embedding for the query
      const { embedding: queryEmbedding, provider, model, dimensions } = await this.getQueryEmbedding(query, preferredProvider);
      
      // Step 2: Perform vector similarity search in database
      const searchOptions = {
        user_id: userId,
        embedding: queryEmbedding,
        limit,
        min_similarity: minSimilarity,
        tags,
        importance_score: importanceScore
      };

      const memories = await MemoryQueries.findSimilarMemories(userId, queryEmbedding, searchOptions);
      
      // Step 3: Filter and sort results based on context level
      const filteredMemories = this.filterMemoriesByContext(memories, contextLevel);
      
      // Step 4: Calculate search statistics
      const searchStats = this.calculateSearchStats(
        filteredMemories,
        startTime,
        provider,
        model,
        dimensions
      );

      return {
        memories: filteredMemories,
        queryEmbedding,
        searchStats
      };

    } catch (error) {
      console.error('Semantic search failed:', error);
      throw new Error(`Semantic search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate embedding for a query using unified embedding service
   */
  private async getQueryEmbedding(query: string, preferredProvider?: AIProvider): Promise<{
    embedding: number[];
    provider: AIProvider;
    model: string;
    dimensions: number;
  }> {
    // Check cache first
    const cacheKey = this.getEmbeddingCacheKey(query, preferredProvider);
    const cached = this.embeddingCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < EMBEDDING_CACHE_TTL) {
      return {
        embedding: cached.embedding,
        provider: cached.provider,
        model: cached.model,
        dimensions: cached.embedding.length
      };
    }

    try {
      // Use unified embedding service with fallback
      const result = await unifiedEmbeddingService.generateEmbeddings({
        texts: [query],
        provider: preferredProvider,
        timeout: 30000
      });

      // Cache the embedding
      this.embeddingCache.set(cacheKey, {
        embedding: result.embeddings[0],
        timestamp: Date.now(),
        provider: result.provider,
        model: result.model
      });

      // Clean up old cache entries to prevent memory leaks
      this.cleanupEmbeddingCache();

      return {
        embedding: result.embeddings[0],
        provider: result.provider,
        model: result.model,
        dimensions: result.dimensions
      };

    } catch (error) {
      console.error('Failed to generate embedding:', error);
      
      // Return a fallback embedding with appropriate dimensions
      const fallbackDimensions = 1536; // Standard dimension
      const fallbackEmbedding = this.generateFallbackEmbedding(fallbackDimensions);
      
      return {
        embedding: fallbackEmbedding,
        provider: preferredProvider || 'cohere',
        model: 'fallback',
        dimensions: fallbackDimensions
      };
    }
  }

  /**
   * Filter memories based on context level requirements
   */
  private filterMemoriesByContext(
    memories: StudyChatMemoryWithSimilarity[], 
    contextLevel: 'light' | 'balanced' | 'comprehensive'
  ): StudyChatMemoryWithSimilarity[] {
    switch (contextLevel) {
      case 'light':
        // Return top 2 most relevant memories
        return memories.slice(0, 2);
      
      case 'balanced':
        // Return top 3-4 memories with good diversity
        const balancedResults = memories.slice(0, 4);
        
        // Ensure we have diversity in topics if possible
        const uniqueTopics = new Set<string>();
        const diverseResults: StudyChatMemoryWithSimilarity[] = [];
        
        for (const memory of balancedResults) {
          const topicKey = memory.tags?.[0] || 'general';
          if (!uniqueTopics.has(topicKey) || diverseResults.length < 2) {
            uniqueTopics.add(topicKey);
            diverseResults.push(memory);
          }
        }
        
        return diverseResults.length > 0 ? diverseResults : balancedResults;
      
      case 'comprehensive':
        // Return all relevant memories (up to limit)
        return memories;
      
      default:
        return memories.slice(0, 3);
    }
  }

  /**
   * Calculate search statistics
   */
  private calculateSearchStats(
    memories: StudyChatMemoryWithSimilarity[],
    startTime: number,
    provider: AIProvider,
    model: string,
    dimensions: number
  ): SemanticSearchResult['searchStats'] {
    const searchTimeMs = Date.now() - startTime;
    const similarities = memories.map(m => m.similarity || 0);
    const averageSimilarity = similarities.length > 0 
      ? similarities.reduce((sum, sim) => sum + sim, 0) / similarities.length 
      : 0;

    // Get usage statistics from unified service
    const usageStats = unifiedEmbeddingService.getUsageStatistics();
    const providerStats = usageStats.byProvider[provider] || { requests: 0, cost: 0, healthy: true };

    return {
      totalFound: memories.length,
      averageSimilarity,
      searchTimeMs,
      embeddingGenerated: true,
      provider,
      model,
      dimensions,
      usage: {
        requestCount: 1,
        totalTokens: 0, // Would need to track this separately
        cost: providerStats.cost
      }
    };
  }

  /**
   * Get cache key for embedding
   */
  private getEmbeddingCacheKey(text: string, provider?: AIProvider): string {
    // Enhanced hash function that includes provider
    let hash = 0;
    const str = `${provider || 'default'}:${text}`;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString();
  }

  /**
   * Generate fallback embedding with specified dimensions
   */
  private generateFallbackEmbedding(dimensions: number): number[] {
    // Return a random vector with specified dimensions
    return Array.from({ length: dimensions }, () => Math.random() - 0.5);
  }

  /**
   * Clean up old cache entries
   */
  private cleanupEmbeddingCache(): void {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, value] of this.embeddingCache.entries()) {
      if (now - value.timestamp > EMBEDDING_CACHE_TTL) {
        entriesToDelete.push(key);
      }
    }

    entriesToDelete.forEach(key => this.embeddingCache.delete(key));

    // If cache is still too large, remove oldest entries
    if (this.embeddingCache.size > 1000) {
      const sortedEntries = Array.from(this.embeddingCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = sortedEntries.slice(0, 500); // Remove oldest 500 entries
      toRemove.forEach(([key]) => this.embeddingCache.delete(key));
    }
  }

  /**
   * Batch generate embeddings for multiple texts using unified service
   */
  async batchGenerateEmbeddings(texts: string[], preferredProvider?: AIProvider): Promise<{
    embeddings: number[][];
    provider: AIProvider;
    model: string;
    dimensions: number;
  }> {
    try {
      // Use unified embedding service
      const result = await unifiedEmbeddingService.generateEmbeddings({
        texts,
        provider: preferredProvider,
        timeout: 30000
      });

      // Cache each embedding
      texts.forEach((text, index) => {
        const cacheKey = this.getEmbeddingCacheKey(text, result.provider);
        this.embeddingCache.set(cacheKey, {
          embedding: result.embeddings[index],
          timestamp: Date.now(),
          provider: result.provider,
          model: result.model
        });
      });

      return {
        embeddings: result.embeddings,
        provider: result.provider,
        model: result.model,
        dimensions: result.dimensions
      };

    } catch (error) {
      console.error('Batch embedding generation failed:', error);
      throw new Error(`Batch embedding failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get embedding service statistics
   */
  getEmbeddingUsageStatistics(): EmbeddingUsageStats {
    return unifiedEmbeddingService.getUsageStatistics();
  }

  /**
   * Check if embeddings are available for a text
   */
  hasCachedEmbedding(text: string, provider?: AIProvider): boolean {
    const cacheKey = this.getEmbeddingCacheKey(text, provider);
    const cached = this.embeddingCache.get(cacheKey);
    
    if (!cached) return false;
    
    // Check if cache is still valid
    return Date.now() - cached.timestamp < EMBEDDING_CACHE_TTL;
  }

  /**
   * Get cache statistics
   */
  getCacheStatistics(): {
    totalEntries: number;
    validEntries: number;
    cacheHitRate: number;
    memoryUsage: string;
    providerBreakdown: Record<AIProvider, number>;
  } {
    const now = Date.now();
    let validEntries = 0;
    const providerBreakdown: Record<AIProvider, number> = {} as any;

    for (const { timestamp, provider } of this.embeddingCache.values()) {
      if (now - timestamp < EMBEDDING_CACHE_TTL) {
        validEntries++;
      }
      
      if (provider) {
        providerBreakdown[provider] = (providerBreakdown[provider] || 0) + 1;
      }
    }

    // Estimate memory usage (rough calculation)
    const avgEmbeddingSize = 1536 * 8; // 1536 floats * 8 bytes per float (average)
    const totalMemoryUsage = this.embeddingCache.size * avgEmbeddingSize;
    
    return {
      totalEntries: this.embeddingCache.size,
      validEntries,
      cacheHitRate: validEntries / this.embeddingCache.size,
      memoryUsage: `${(totalMemoryUsage / 1024 / 1024).toFixed(2)} MB`,
      providerBreakdown
    };
  }

  /**
   * Clear the embedding cache
   */
  clearCache(): void {
    this.embeddingCache.clear();
  }

  /**
   * Preload embeddings for common study topics using unified service
   */
  async preloadCommonTopicEmbeddings(preferredProvider?: AIProvider): Promise<void> {
    const commonTopics = [
      'thermodynamics',
      'organic chemistry',
      'integration',
      'electromagnetism',
      'kinematics',
      'mole concept',
      'differentiation',
      'waves',
      'kinetics',
      'periodic table'
    ];

    try {
      const result = await this.batchGenerateEmbeddings(commonTopics, preferredProvider);
      console.log(`Preloaded ${result.embeddings.length} common topic embeddings using ${result.provider}`);
    } catch (error) {
      console.warn('Failed to preload common topic embeddings:', error);
    }
  }

  /**
   * Get health status of all embedding providers
   */
  async getProviderHealthStatus(): Promise<Record<AIProvider, { healthy: boolean; responseTime: number; error?: string }>> {
    try {
      const healthResults = await unifiedEmbeddingService.performHealthCheck();
      
      const status: Record<AIProvider, { healthy: boolean; responseTime: number; error?: string }> = {} as any;
      
      for (const [provider, health] of Object.entries(healthResults)) {
        status[provider as AIProvider] = {
          healthy: health.healthy,
          responseTime: health.responseTime,
          error: health.error
        };
      }
      
      return status;
    } catch (error) {
      console.error('Failed to get provider health status:', error);
      return {} as any;
    }
  }
}

// Export singleton instance
export const semanticSearch = new SemanticSearchService();

// Convenience functions
export const searchStudyMemories = (options: SemanticSearchOptions) => 
  semanticSearch.searchMemories(options);

export const generateQueryEmbedding = (query: string, provider?: AIProvider) => 
  semanticSearch['getQueryEmbedding'](query, provider);

export const getSemanticSearchStats = () => 
  semanticSearch.getEmbeddingUsageStatistics();

export const getEmbeddingProviderHealth = () => 
  semanticSearch.getProviderHealthStatus();

// Export for testing
export const EmbeddingCacheTTL = EMBEDDING_CACHE_TTL;
