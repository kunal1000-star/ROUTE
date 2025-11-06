// Real-Time Dashboard WebSocket Hook
// ===================================

"use client";

import { useEffect, useRef, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp: string;
}

interface UseRealtimeDashboardOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  subscribedChannels?: string[];
}

interface UseRealtimeDashboardReturn {
  isConnected: boolean;
  isConnecting: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (message: any) => void;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  requestUpdate: (channel?: string) => void;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  error: string | null;
}

export function useRealtimeDashboard(options: UseRealtimeDashboardOptions = {}): UseRealtimeDashboardReturn {
  const {
    url = 'ws://localhost:3000/ws/dashboard',
    autoConnect = true,
    reconnectInterval = 5000,
    maxReconnectAttempts = 5,
    subscribedChannels = ['all']
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [error, setError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    setError(null);

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('📡 WebSocket connected');
        setIsConnected(true);
        setIsConnecting(false);
        setConnectionStatus('connected');
        setError(null);
        reconnectAttemptsRef.current = 0;

        // Subscribe to channels
        subscribedChannels.forEach(channel => {
          ws.send(JSON.stringify({ type: 'subscribe', channel }));
        });
      };

      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          
          // Handle different message types
          switch (message.type) {
            case 'pong':
              // Handle heartbeat response
              break;
            case 'error':
              setError(message.data?.message || 'WebSocket error');
              setConnectionStatus('error');
              break;
            default:
              // Handle data messages
              break;
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('📡 WebSocket disconnected:', event.code, event.reason);
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatus('disconnected');
        
        // Auto-reconnect if not at max attempts
        if (autoConnect && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(`🔄 Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };

      ws.onerror = (event) => {
        console.error('📡 WebSocket error:', event);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      };

    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('error');
      setIsConnecting(false);
    }
  }, [url, autoConnect, reconnectInterval, maxReconnectAttempts, subscribedChannels]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
  }, []);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  const subscribe = useCallback((channel: string) => {
    sendMessage({ type: 'subscribe', channel });
  }, [sendMessage]);

  const unsubscribe = useCallback((channel: string) => {
    sendMessage({ type: 'unsubscribe', channel });
  }, [sendMessage]);

  const requestUpdate = useCallback((channel?: string) => {
    sendMessage({ type: 'request_update', channel: channel || 'all' });
  }, [sendMessage]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      sendMessage({ type: 'ping' });
    }, 30000); // Ping every 30 seconds

    return () => clearInterval(pingInterval);
  }, [isConnected, sendMessage]);

  return {
    isConnected,
    isConnecting,
    lastMessage,
    sendMessage,
    subscribe,
    unsubscribe,
    requestUpdate,
    connectionStatus,
    error
  };
}

// Specialized hooks for different dashboard components

export function useProviderStatus() {
  const { lastMessage, subscribe, unsubscribe } = useRealtimeDashboard({
    subscribedChannels: ['provider_status']
  });

  const [providerStatus, setProviderStatus] = useState<any[]>([]);

  useEffect(() => {
    if (lastMessage?.type === 'provider_status') {
      setProviderStatus(lastMessage.data);
    } else if (lastMessage?.type === 'initial_data') {
      setProviderStatus(lastMessage.data.providerStatus || []);
    }
  }, [lastMessage]);

  return {
    providerStatus,
    subscribe: () => subscribe('provider_status'),
    unsubscribe: () => unsubscribe('provider_status')
  };
}

export function useSystemHealth() {
  const { lastMessage, subscribe, unsubscribe } = useRealtimeDashboard({
    subscribedChannels: ['system_health']
  });

  const [systemHealth, setSystemHealth] = useState<any>(null);

  useEffect(() => {
    if (lastMessage?.type === 'system_health') {
      setSystemHealth(lastMessage.data);
    } else if (lastMessage?.type === 'initial_data') {
      setSystemHealth(lastMessage.data.systemHealth || null);
    }
  }, [lastMessage]);

  return {
    systemHealth,
    subscribe: () => subscribe('system_health'),
    unsubscribe: () => unsubscribe('system_health')
  };
}

export function useRateLimits() {
  const { lastMessage, subscribe, unsubscribe } = useRealtimeDashboard({
    subscribedChannels: ['rate_limits']
  });

  const [rateLimitWarnings, setRateLimitWarnings] = useState<any[]>([]);

  useEffect(() => {
    if (lastMessage?.type === 'rate_limits') {
      setRateLimitWarnings(lastMessage.data || []);
    } else if (lastMessage?.type === 'initial_data') {
      setRateLimitWarnings(lastMessage.data.rateLimitData || []);
    }
  }, [lastMessage]);

  return {
    rateLimitWarnings,
    subscribe: () => subscribe('rate_limits'),
    unsubscribe: () => unsubscribe('rate_limits')
  };
}

export function useFallbackEvents() {
  const { lastMessage, subscribe, unsubscribe } = useRealtimeDashboard({
    subscribedChannels: ['fallback']
  });

  const [fallbackEvents, setFallbackEvents] = useState<any[]>([]);

  useEffect(() => {
    if (lastMessage?.type === 'fallback') {
      setFallbackEvents(lastMessage.data || []);
    } else if (lastMessage?.type === 'initial_data') {
      setFallbackEvents(lastMessage.data.fallbackEvents || []);
    }
  }, [lastMessage]);

  return {
    fallbackEvents,
    subscribe: () => subscribe('fallback'),
    unsubscribe: () => unsubscribe('fallback')
  };
}

export function useRealtimeAPICalls() {
  const { lastMessage } = useRealtimeDashboard();
  
  const [apiCallStats, setApiCallStats] = useState<any[]>([]);

  useEffect(() => {
    if (lastMessage?.type === 'api_calls') {
      setApiCallStats(prev => [...prev.slice(-50), lastMessage.data]); // Keep last 50 calls
    }
  }, [lastMessage]);

  return { apiCallStats };
}
