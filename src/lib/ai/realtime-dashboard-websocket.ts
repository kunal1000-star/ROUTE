// Enhanced WebSocket Real-Time Dashboard Server
// ================================================

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { realtimeUsageDashboard } from './realtime-usage-dashboard';
import { rateLimitManager } from './rate-limit-manager';
import { aiServiceManager } from './ai-service-manager-unified';

export interface DashboardUpdate {
  type: 'provider_status' | 'system_health' | 'rate_limits' | 'api_calls' | 'insights' | 'fallback';
  data: any;
  timestamp: string;
}

export interface ConnectedClient {
  id: string;
  ws: WebSocket;
  userId?: string;
  subscriptions: Set<string>;
  lastPing: number;
}

export class RealtimeDashboardServer {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server,
      path: '/ws/dashboard',
      clientTracking: true
    });

    this.setupWebSocketHandlers();
    this.startPeriodicUpdates();
    this.startHeartbeat();
  }

  private setupWebSocketHandlers() {
    this.wss.on('connection', (ws: WebSocket, request) => {
      const clientId = this.generateClientId();
      const client: ConnectedClient = {
        id: clientId,
        ws,
        subscriptions: new Set(['all']),
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);
      console.log(`📡 Dashboard WebSocket client connected: ${clientId}`);

      // Send initial dashboard data
      this.sendInitialData(client);

      ws.on('message', (data: Buffer) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(client, message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`📡 Dashboard WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleClientMessage(client: ConnectedClient, message: any) {
    switch (message.type) {
      case 'subscribe':
        if (message.channel && typeof message.channel === 'string') {
          client.subscriptions.add(message.channel);
          console.log(`Client ${client.id} subscribed to ${message.channel}`);
        }
        break;

      case 'unsubscribe':
        if (message.channel && typeof message.channel === 'string') {
          client.subscriptions.delete(message.channel);
          console.log(`Client ${client.id} unsubscribed from ${message.channel}`);
        }
        break;

      case 'ping':
        client.lastPing = Date.now();
        client.ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
        break;

      case 'request_update':
        this.sendImmediateUpdate(client, message.channel || 'all');
        break;

      default:
        console.log(`Unknown message type from client ${client.id}:`, message.type);
    }
  }

  private async sendInitialData(client: ConnectedClient) {
    try {
      const [
        providerStatus,
        systemHealth,
        rateLimits
      ] = await Promise.all([
        realtimeUsageDashboard.getProviderStatusCards(),
        realtimeUsageDashboard.getSystemHealthSummary(),
        rateLimitManager.getCurrentLimits()
      ]);

      client.ws.send(JSON.stringify({
        type: 'initial_data',
        data: {
          providerStatus,
          systemHealth,
          rateLimits
        },
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to send initial data to client:', error);
    }
  }

  private async sendImmediateUpdate(client: ConnectedClient, channel: string) {
    try {
      let update: DashboardUpdate | null = null;

      switch (channel) {
        case 'provider_status':
          const providerStatus = await realtimeUsageDashboard.getProviderStatusCards();
          update = {
            type: 'provider_status',
            data: providerStatus,
            timestamp: new Date().toISOString()
          };
          break;

        case 'system_health':
          const systemHealth = await realtimeUsageDashboard.getSystemHealthSummary();
          update = {
            type: 'system_health',
            data: systemHealth,
            timestamp: new Date().toISOString()
          };
          break;

        case 'rate_limits':
          const rateLimits = rateLimitManager.getCurrentLimits();
          update = {
            type: 'rate_limits',
            data: rateLimits,
            timestamp: new Date().toISOString()
          };
          break;

        case 'all':
        default:
          // Send all data
          const [providerStatus, systemHealth] = await Promise.all([
            realtimeUsageDashboard.getProviderStatusCards(),
            realtimeUsageDashboard.getSystemHealthSummary()
          ]);
          
          client.ws.send(JSON.stringify({
            type: 'bulk_update',
            data: { providerStatus, systemHealth },
            timestamp: new Date().toISOString()
          }));
          return;
      }

      if (update) {
        client.ws.send(JSON.stringify(update));
      }
    } catch (error) {
      console.error(`Failed to send update for channel ${channel}:`, error);
    }
  }

  private startPeriodicUpdates() {
    this.updateInterval = setInterval(async () => {
      await this.broadcastDashboardUpdates();
    }, 5000); // Update every 5 seconds
  }

  private async broadcastDashboardUpdates() {
    const connectedClients = Array.from(this.clients.values());
    if (connectedClients.length === 0) return;

    try {
      // Get latest dashboard data
      const [
        providerStatus,
        systemHealth,
        rateLimitWarnings,
        fallbackEvents
      ] = await Promise.all([
        realtimeUsageDashboard.getProviderStatusCards(),
        realtimeUsageDashboard.getSystemHealthSummary(),
        Promise.resolve(realtimeUsageDashboard.getRateLimitWarnings()),
        realtimeUsageDashboard.getFallbackEvents(5) // Last 5 events
      ]);

      // Check for significant changes
      const hasHealthIssues = systemHealth.overallStatus !== 'operational';
      const hasRateLimitWarnings = rateLimitWarnings.length > 0;
      const hasRecentFallbacks = fallbackEvents.length > 0;

      // Broadcast to interested clients
      for (const client of connectedClients) {
        if (client.ws.readyState !== WebSocket.OPEN) continue;

        try {
          // Always send provider status updates
          if (client.subscriptions.has('provider_status') || client.subscriptions.has('all')) {
            client.ws.send(JSON.stringify({
              type: 'provider_status',
              data: providerStatus,
              timestamp: new Date().toISOString()
            }));
          }

          // Send system health if there are issues or client is subscribed
          if (hasHealthIssues || client.subscriptions.has('system_health') || client.subscriptions.has('all')) {
            client.ws.send(JSON.stringify({
              type: 'system_health',
              data: systemHealth,
              timestamp: new Date().toISOString()
            }));
          }

          // Send rate limit warnings if any
          if (hasRateLimitWarnings && (client.subscriptions.has('rate_limits') || client.subscriptions.has('all'))) {
            client.ws.send(JSON.stringify({
              type: 'rate_limits',
              data: rateLimitWarnings,
              timestamp: new Date().toISOString()
            }));
          }

          // Send recent fallback events if any
          if (hasRecentFallbacks && (client.subscriptions.has('fallback') || client.subscriptions.has('all'))) {
            client.ws.send(JSON.stringify({
              type: 'fallback',
              data: fallbackEvents,
              timestamp: new Date().toISOString()
            }));
          }

        } catch (error) {
          console.error(`Failed to send update to client ${client.id}:`, error);
          this.clients.delete(client.id);
        }
      }
    } catch (error) {
      console.error('Failed to broadcast dashboard updates:', error);
    }
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const clients = Array.from(this.clients.values());

      for (const client of clients) {
        if (client.ws.readyState !== WebSocket.OPEN) {
          this.clients.delete(client.id);
          continue;
        }

        // Check if client is stale
        if (now - client.lastPing > 30000) { // 30 seconds
          console.log(`Removing stale client: ${client.id}`);
          client.ws.terminate();
          this.clients.delete(client.id);
          continue;
        }

        // Send ping
        try {
          client.ws.ping();
        } catch (error) {
          console.error(`Failed to ping client ${client.id}:`, error);
          this.clients.delete(client.id);
        }
      }
    }, 10000); // Every 10 seconds
  }

  private generateClientId(): string {
    return `dashboard_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public getStats() {
    return {
      connectedClients: this.clients.size,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      lastUpdate: new Date().toISOString()
    };
  }

  public destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.close();
      }
    }

    this.clients.clear();
    this.wss.close();
  }
}

// Export singleton instance
export let realtimeDashboardServer: RealtimeDashboardServer | null = null;

export function initializeRealtimeDashboardServer(server: Server): RealtimeDashboardServer {
  if (!realtimeDashboardServer) {
    realtimeDashboardServer = new RealtimeDashboardServer(server);
    console.log('🚀 Realtime Dashboard WebSocket Server initialized');
  }
  return realtimeDashboardServer;
}
