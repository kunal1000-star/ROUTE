'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Database, 
  Zap, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  Users,
  Cpu,
  HardDrive
} from 'lucide-react';

interface SystemMetrics {
  timestamp: string;
  providers: {
    total: number;
    healthy: number;
    unhealthy: number;
  };
  database: {
    status: 'connected' | 'disconnected' | 'error';
    responseTime: number;
    activeConnections: number;
  };
  features: {
    total: number;
    active: number;
    errors: number;
  };
  chat: {
    activeSessions: number;
    totalMessages: number;
    avgResponseTime: number;
  };
  performance: {
    cpu: number;
    memory: number;
    cacheHitRate: number;
  };
  logs: {
    errors: number;
    warnings: number;
    info: number;
  };
}

export function SystemOverview() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchSystemMetrics = async () => {
    try {
      const response = await fetch('/api/debug/ai-realtime');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data.metrics);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch system metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemMetrics();
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchSystemMetrics, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-500';
      case 'disconnected':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Disconnected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Failed to load system metrics</p>
            <Button onClick={fetchSystemMetrics} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Last Update */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">System Overview</h3>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdate?.toLocaleTimeString() || 'Unknown'}
          </p>
        </div>
        <Button onClick={fetchSystemMetrics} size="sm" disabled={isLoading}>
          <Activity className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* AI Providers Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Providers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.providers.healthy}/{metrics.providers.total}
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="default" className="bg-green-100 text-green-800">
                {metrics.providers.healthy} Healthy
              </Badge>
              {metrics.providers.unhealthy > 0 && (
                <Badge variant="destructive">
                  {metrics.providers.unhealthy} Issues
                </Badge>
              )}
            </div>
            <Progress 
              value={(metrics.providers.healthy / metrics.providers.total) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Database Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusBadge(metrics.database.status)}
            </div>
            <div className="text-sm text-gray-600">
              <div>Response: {metrics.database.responseTime}ms</div>
              <div>Connections: {metrics.database.activeConnections}</div>
            </div>
          </CardContent>
        </Card>

        {/* Features Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Features</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.features.active}/{metrics.features.total}
            </div>
            {metrics.features.errors > 0 && (
              <Badge variant="destructive" className="mt-2">
                {metrics.features.errors} Errors
              </Badge>
            )}
            <Progress 
              value={(metrics.features.active / metrics.features.total) * 100} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* Chat System */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Chat System</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.chat.activeSessions}
            </div>
            <p className="text-xs text-muted-foreground">Active Sessions</p>
            <div className="text-sm text-gray-600 mt-2">
              <div>Total Messages: {metrics.chat.totalMessages}</div>
              <div>Avg Response: {metrics.chat.avgResponseTime}ms</div>
            </div>
          </CardContent>
        </Card>

        {/* Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Performance</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm">
                <span>CPU</span>
                <span>{metrics.performance.cpu}%</span>
              </div>
              <Progress value={metrics.performance.cpu} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Memory</span>
                <span>{metrics.performance.memory}%</span>
              </div>
              <Progress value={metrics.performance.memory} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm">
                <span>Cache Hit Rate</span>
                <span>{metrics.performance.cacheHitRate}%</span>
              </div>
              <Progress value={metrics.performance.cacheHitRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* System Logs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Logs</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-600">Errors</span>
                <Badge variant="destructive">{metrics.logs.errors}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-600">Warnings</span>
                <Badge className="bg-yellow-100 text-yellow-800">{metrics.logs.warnings}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600">Info</span>
                <Badge variant="outline">{metrics.logs.info}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">✅ Healthy Components</h4>
              <ul className="text-sm text-green-600 space-y-1">
                {metrics.providers.healthy > 0 && <li>• {metrics.providers.healthy} AI providers operational</li>}
                {metrics.database.status === 'connected' && <li>• Database connection stable</li>}
                {metrics.features.active > 0 && <li>• {metrics.features.active} AI features active</li>}
                <li>• Real-time monitoring active</li>
              </ul>
            </div>
            
            {metrics.providers.unhealthy > 0 || metrics.database.status === 'error' || metrics.features.errors > 0 ? (
              <div className="space-y-2">
                <h4 className="font-medium text-red-600">⚠️ Issues Detected</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {metrics.providers.unhealthy > 0 && <li>• {metrics.providers.unhealthy} AI providers down</li>}
                  {metrics.database.status === 'error' && <li>• Database connection issues</li>}
                  {metrics.features.errors > 0 && <li>• {metrics.features.errors} AI feature errors</li>}
                  {metrics.logs.errors > 0 && <li>• {metrics.logs.errors} recent system errors</li>}
                </ul>
              </div>
            ) : (
              <div className="space-y-2">
                <h4 className="font-medium text-green-600">🎉 All Systems Operational</h4>
                <p className="text-sm text-green-600">No issues detected. All components are running smoothly.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}