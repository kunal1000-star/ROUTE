// AI Providers Debug API - Real-time Provider Testing
// =================================================

import { NextRequest, NextResponse } from 'next/server';
import { groqClient } from '@/lib/ai/providers/groq-client';
import { geminiClient } from '@/lib/ai/providers/gemini-client';
import { cerebrasClient } from '@/lib/ai/providers/cerebras-client';
import { cohereClient } from '@/lib/ai/providers/cohere-client';
import { mistralClient } from '@/lib/ai/providers/mistral-client';
import { openRouterClient } from '@/lib/ai/providers/openrouter-client';

interface ProviderTestRequest {
  provider?: string;
  message?: string;
  model?: string;
  timeout?: number;
}

interface ProviderHealthResult {
  provider: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
  details?: any;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ProviderTestRequest;
    const { provider, message, model, timeout } = body;

    if (provider) {
      // Test specific provider
      const result = await testSpecificProvider(provider, message, model, timeout);
      return NextResponse.json({
        success: true,
        data: result
      });
    } else {
      // Test all providers
      const results = await testAllProviders(message, model, timeout);
      return NextResponse.json({
        success: true,
        data: {
          totalProviders: results.length,
          healthyProviders: results.filter(r => r.healthy).length,
          results
        }
      });
    }

  } catch (error) {
    console.error('Provider debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function testSpecificProvider(
  providerName: string, 
  message?: string, 
  model?: string, 
  timeout?: number
): Promise<ProviderHealthResult> {
  const clients: Record<string, any> = {
    groq: groqClient,
    gemini: geminiClient,
    cerebras: cerebrasClient,
    cohere: cohereClient,
    mistral: mistralClient,
    openrouter: openRouterClient
  };

  const client = clients[providerName];
  const startTime = Date.now();

  if (!client) {
    return {
      provider: providerName,
      healthy: false,
      responseTime: 0,
      error: 'Provider client not available'
    };
  }

  try {
    // Health check first
    const healthCheck = await client.healthCheck();
    
    if (!healthCheck.healthy) {
      return {
        provider: providerName,
        healthy: false,
        responseTime: healthCheck.responseTime,
        error: healthCheck.error
      };
    }

    // If message provided, test actual chat
    if (message) {
      const chatParams: any = {
        messages: [{ role: 'user', content: message }]
      };
      
      if (model) chatParams.model = model;
      if (timeout) chatParams.timeout = timeout;

      let chatResponse;
      switch (providerName) {
        case 'cohere':
          chatResponse = await client.chat({ message, ...chatParams });
          break;
        default:
          chatResponse = await client.chat(chatParams);
      }

      return {
        provider: providerName,
        healthy: true,
        responseTime: Date.now() - startTime,
        details: {
          healthCheck: healthCheck.responseTime,
          chatResponse: {
            content: chatResponse.content?.substring(0, 100) + '...',
            model: chatResponse.model_used || chatResponse.provider,
            tokens: chatResponse.tokens_used
          }
        }
      };
    }

    return {
      provider: providerName,
      healthy: true,
      responseTime: healthCheck.responseTime,
      details: {
        healthCheck: healthCheck.responseTime
      }
    };

  } catch (error) {
    return {
      provider: providerName,
      healthy: false,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Provider test failed'
    };
  }
}

async function testAllProviders(message?: string, model?: string, timeout?: number): Promise<ProviderHealthResult[]> {
  const providers = ['groq', 'gemini', 'cerebras', 'cohere', 'mistral', 'openrouter'];
  const results: ProviderHealthResult[] = [];

  for (const provider of providers) {
    const result = await testSpecificProvider(provider, message, model, timeout);
    results.push(result);
  }

  return results;
}

// GET endpoint for provider status overview
export async function GET() {
  try {
    const providers = ['groq', 'gemini', 'cerebras', 'cohere', 'mistral', 'openrouter'];
    const statusPromises = providers.map(async (provider) => {
      const result = await testSpecificProvider(provider);
      return {
        name: provider,
        healthy: result.healthy,
        responseTime: result.responseTime,
        error: result.error
      };
    });

    const statuses = await Promise.all(statusPromises);

    return NextResponse.json({
      success: true,
      data: {
        totalProviders: statuses.length,
        healthyProviders: statuses.filter(p => p.healthy).length,
        providers: statuses
      }
    });

  } catch (error) {
    console.error('Provider status error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}