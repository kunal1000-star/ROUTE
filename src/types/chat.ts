// Stubbed Chat types to satisfy legacy imports after removing General Chat
// This file intentionally defines minimal placeholder types to keep the build green.
// The General Chat feature has been removed; these are retained only for unused modules/tests.

export interface ChatRequest {
  userId?: string;
  conversationId?: string | null;
  message?: string;
  context?: any;
  preferences?: any;
}

export interface ChatResponse {
  content?: string;
  provider?: string;
  model_used?: string;
  tokensUsed?: number;
  metadata?: any;
}

export interface ChatStreamChunk { type?: string; data?: any; }
export interface StreamingMetadata { provider?: string; model?: string; [k: string]: any }

export type ProviderStatus = 'healthy' | 'degraded' | 'down' | string;
export interface ProviderCapabilities { streaming?: boolean; tools?: boolean; [k: string]: any }
export interface UnifiedProviderConfig { provider?: string; model?: string; [k: string]: any }
export interface ChatError { code?: string; message?: string; details?: any }

export interface IUnifiedProvider {
  name: string;
  status?: ProviderStatus;
  capabilities?: ProviderCapabilities;
  send?(req: ChatRequest): Promise<ChatResponse>;
  stream?(req: ChatRequest): AsyncIterable<ChatStreamChunk> | Promise<AsyncIterable<ChatStreamChunk>>;
}

export interface ChatServiceConfig { defaultProvider?: string; fallbackProviders?: string[]; [k: string]: any }
export interface ProviderPerformanceMetrics { [k: string]: any }
export interface ChatMetrics { [k: string]: any }
export interface ChatSession { id?: string; userId?: string; createdAt?: string | Date }
export interface ChatContext { [k: string]: any }
export interface UserPreferences { [k: string]: any }
export interface IChatService {
  sendMessage(req: ChatRequest): Promise<ChatResponse>;
  streamMessage?(req: ChatRequest): AsyncIterable<ChatStreamChunk> | Promise<AsyncIterable<ChatStreamChunk>>;
}

export interface ProviderRegistry { [provider: string]: IUnifiedProvider }

// Legacy types that some UI/tests might reference
export interface Conversation { id: string; title?: string; createdAt?: string | Date }
export interface ChatMessage { id?: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp?: string | Date }
export interface ProviderHealthStatus { provider: string; status: ProviderStatus }
