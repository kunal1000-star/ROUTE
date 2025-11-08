import { createOpenRouterClient } from '@/lib/ai/providers/openrouter-client';
import { createGroqClient } from '@/lib/ai/providers/groq-client';
import { createGeminiClient } from '@/lib/ai/providers/gemini-client';
import { createMistralClient } from '@/lib/ai/providers/mistral-client';
import { createCohereClient } from '@/lib/ai/providers/cohere-client';
import { createCerebrasClient } from '@/lib/ai/providers/cerebras-client';

export async function testProviderKey(provider: string, apiKey: string): Promise<boolean> {
  try {
    const messages = [{ role: 'user' as const, content: 'ping' }];
    switch (provider) {
      case 'openrouter':
        await createOpenRouterClient(apiKey).chat({ messages, maxTokens: 1 });
        return true;
      case 'groq':
        await createGroqClient(apiKey).chat({ messages, maxTokens: 1 });
        return true;
      case 'gemini':
        await createGeminiClient(apiKey).chat({ messages, maxTokens: 1 });
        return true;
      case 'mistral':
        await createMistralClient(apiKey).chat({ messages, maxTokens: 1 });
        return true;
      case 'cohere':
        await createCohereClient(apiKey).chat({ message: 'ping', chatHistory: [], maxTokens: 1 });
        return true;
      case 'cerebras':
        await createCerebrasClient(apiKey).chat({ messages, maxTokens: 1 });
        return true;
      default:
        return false;
    }
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (msg.includes('401') || msg.toLowerCase().includes('auth')) return false;
    // Some providers may 400 on tiny requests; treat non-auth errors as pass for key presence
    return true;
  }
}
