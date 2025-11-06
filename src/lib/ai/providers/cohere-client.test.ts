// Cohere Client Unit Tests
// ========================

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { CohereClient } from './cohere-client';
import type { AIServiceManagerResponse } from '@/types/ai-service-manager';

// Mock fetch for testing
global.fetch = vi.fn();

describe('CohereClient', () => {
  let client: CohereClient;
  const mockApiKey = 'test-cohere-api-key';
  
  beforeEach(() => {
    vi.clearAllMocks();
    client = new CohereClient(mockApiKey);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    test('should initialize with correct API key', () => {
      const testClient = new CohereClient(mockApiKey);
      expect(testClient).toBeInstanceOf(CohereClient);
    });
  });

  describe('Chat Functionality', () => {
    test('should make chat request with correct format', async () => {
      const mockMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello, how are you?' }
      ];

      const mockResponse = {
        id: 'test-123',
        type: 'chat',
        message: {
          role: 'assistant',
          content: 'Hello! I am doing well, thank you for asking.'
        },
        metadata: {
          api_version: '2022-12-06',
          billed_units: { input_tokens: 10, output_tokens: 8 },
          tokens_input: 10,
          tokens_output: 8
        }
      };

      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.chat({
        messages: mockMessages,
        model: 'command',
        webSearchEnabled: false
      });

      expect(result).toMatchObject({
        content: 'Hello! I am doing well, thank you for asking.',
        model_used: 'command',
        provider: 'cohere',
        query_type: 'general',
        cached: false,
        tokens_used: {
          input: 10,
          output: 8
        },
        latency_ms: expect.any(Number),
        web_search_enabled: false,
        fallback_used: false,
        limit_approaching: false
      });
    });

    test('should handle API errors gracefully', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: () => Promise.resolve({
          message: 'Invalid API key'
        }),
      } as Response);

      await expect(client.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'command'
      })).rejects.toThrow('Invalid API key');
    });
  });

  describe('Model Management', () => {
    test('should return available models', () => {
      const models = client.getAvailableModels();
      expect(models).toContain('command');
      expect(models).toContain('command-light');
      expect(models).toContain('command-r');
      expect(models).toContain('command-r-plus');
    });
  });

  describe('Health Check', () => {
    test('should perform successful health check', async () => {
      const mockResponse = {
        id: 'health-check',
        type: 'chat',
        message: {
          role: 'assistant',
          content: 'OK'
        },
        metadata: {
          tokens_input: 1,
          tokens_output: 1
        }
      };

      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const health = await client.healthCheck();
      
      expect(health).toEqual({
        healthy: true,
        responseTime: expect.any(Number)
      });
    });
  });

  describe('Provider Info', () => {
    test('should return correct provider information', () => {
      const providerInfo = client.getProviderInfo();
      
      expect(providerInfo).toMatchObject({
        name: 'Cohere',
        tier: 2,
        models: expect.arrayContaining(['command']),
        capabilities: {
          supportsStreaming: true,
          supportsFunctionCalling: false,
          supportsJsonMode: true,
          maxContextLength: 4096
        },
        rateLimits: {
          requestsPerMinute: 1000,
          tokensPerMinute: 60000
        }
      });
    });
  });

  describe('Rate Limiting', () => {
    test('should handle rate limit errors gracefully', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve({
          message: 'Rate limit exceeded'
        }),
      } as Response);

      await expect(client.chat({
        messages: [{ role: 'user', content: 'Hello' }],
        model: 'command'
      })).rejects.toThrow('Rate limit exceeded');
    });
  });

  describe('Model Capabilities', () => {
    test('should return capabilities for supported models', () => {
      const capabilities = client.getModelCapabilities('command');
      
      expect(capabilities).toMatchObject({
        supportsStreaming: true,
        supportsFunctionCalling: false,
        supportsJsonMode: true,
        maxTokens: 4096
      });
    });
  });

  describe('API Key Validation', () => {
    test('should validate API key format', () => {
      expect(CohereClient.validateApiKey('test_api_key_123456789')).toBe(true);
      expect(CohereClient.validateApiKey('invalid_key')).toBe(false);
      expect(CohereClient.validateApiKey('')).toBe(false);
    });
  });
});
