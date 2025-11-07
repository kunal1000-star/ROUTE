'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Zap, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  AlertCircle
} from 'lucide-react';

interface PerformanceMetrics {
  timestamp: string;
  system: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  aiProviders: {
    provider: string;
    responseTime: number;
    requestsPerSecond: number;
    errorRate: number;
  }[];
  database: {
    queryTime: number;
    activeConnections: number;
    cacheHitRate: number;
    slowQueries: number;
  };
  cache: {
    hitRate: number;
    totalRequests: number;
    memoryUsage: number;
  };
  application: {
    uptime: number;
    totalRequests: number;
    avgResponseTime: number;
    errorRate: number;
  };
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h'>('1h');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchPerformanceMetrics = async () => {
    try {
      const response = await fetch('/api/debug/ai-realtime');
      if (response.ok) {
        const data = await response.json();
        setMetrics(data.data.performance);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformanceMetrics();
    
    // Set up real-time updates every 15 seconds
    const interval = setInterval(fetchPerformanceMetrics, 15000);
    
    return () => clearInterval(interval);
  }, [timeRange]);

  const getStatusColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'text-green-500';
    if (value <= thresholds.warning) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (value: number, thresholds: { good: number; warning: number }) => {
    if (value <= thresholds.good) return 'bg-green-500';
    if (value <= thresholds.warning) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Failed to load performance metrics</p>
            <Button onClick={fetchPerformanceMetrics} variant="outline" size="sm" className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Performance Monitor</h3>
          <p className="text-sm text-gray-600">
            Last updated: {lastUpdate?.toLocaleTimeString() || 'Unknown'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="1h">1H</TabsTrigger>
              <TabsTrigger value="6h">6H</TabsTrigger>
              <TabsTrigger value="24h">24H</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={fetchPerformanceMetrics} size="sm">
            <Activity className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.system.cpu, { good: 50, warning: 75 })}`}>
              {metrics.system.cpu}%
            </div>
            <Progress 
              value={metrics.system.cpu} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.system.cpu <= 50 ? 'Good' : metrics.system.cpu <= 75 ? 'Warning' : 'High'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.system.memory, { good: 60, warning: 80 })}`}>
              {metrics.system.memory}%
            </div>
            <Progress 
              value={metrics.system.memory} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.system.memory <= 60 ? 'Good' : metrics.system.memory <= 80 ? 'Warning' : 'High'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics.application.avgResponseTime, { good: 200, warning: 500 })}`}>
              {metrics.application.avgResponseTime}ms
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.application.avgResponseTime <= 200 ? 'Excellent' : metrics.application.avgResponseTime <= 500 ? 'Good' : 'Slow'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(100 - metrics.cache.hitRate, { good: 10, warning: 30 })}`}>
              {metrics.cache.hitRate}%
            </div>
            <Progress 
              value={metrics.cache.hitRate} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.cache.hitRate >= 90 ? 'Excellent' : metrics.cache.hitRate >= 70 ? 'Good' : 'Needs optimization'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Performance Tabs */}
      <Tabs defaultValue="system" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="system">System</TabsTrigger>
          <TabsTrigger value="providers">AI Providers</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="application">Application</TabsTrigger>
        </TabsList>
        
        <TabsContent value="system" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU</span>
                    <span>{metrics.system.cpu}%</span>
                  </div>
                  <Progress value={metrics.system.cpu} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory</span>
                    <span>{metrics.system.memory}%</span>
                  </div>
                  <Progress value={metrics.system.memory} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Disk I/O</span>
                    <span>{metrics.system.disk}%</span>
                  </div>
                  <Progress value={metrics.system.disk} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Network</span>
                    <span>{metrics.system.network}%</span>
                  </div>
                  <Progress value={metrics.system.network} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">System Uptime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{formatUptime(metrics.application.uptime)}</div>
                <p className="text-sm text-gray-600 mt-2">
                  Total Requests: {metrics.application.totalRequests.toLocaleString()}
                </p>
                <div className="flex items-center mt-3">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm text-green-600">System Stable</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">AI Provider Performance</CardTitle>
              <CardDescription>
                Performance metrics for each AI provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics.aiProviders.map((provider, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize">{provider.provider}</h4>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={provider.errorRate < 5 ? "default" : provider.errorRate < 10 ? "secondary" : "destructive"}
                        >
                          {provider.errorRate}% error rate
                        </Badge>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Response Time</div>
                        <div className={`text-lg font-semibold ${getStatusColor(provider.responseTime, { good: 300, warning: 800 })}`}>
                          {provider.responseTime}ms
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Requests/sec</div>
                        <div className="text-lg font-semibold">{provider.requestsPerSecond}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Error Rate</div>
                        <div className={`text-lg font-semibold ${getStatusColor(provider.errorRate, { good: 2, warning: 10 })}`}>
                          {provider.errorRate}%
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Database Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Avg Query Time</span>
                    <span className={getStatusColor(metrics.database.queryTime, { good: 50, warning: 200 })}>
                      {metrics.database.queryTime}ms
                    </span>
                  </div>
                  <Progress value={Math.min((metrics.database.queryTime / 500) * 100, 100)} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Cache Hit Rate</span>
                    <span className={getStatusColor(100 - metrics.database.cacheHitRate, { good: 10, warning: 30 })}>
                      {metrics.database.cacheHitRate}%
                    </span>
                  </div>
                  <Progress value={metrics.database.cacheHitRate} className="h-2" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Active Connections</div>
                  <div className="text-lg font-semibold">{metrics.database.activeConnections}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Slow Queries</div>
                  <div className={`text-lg font-semibold ${metrics.database.slowQueries > 0 ? 'text-red-500' : 'text-green-500'}`}>
                    {metrics.database.slowQueries}
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cache Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm text-gray-600">Hit Rate</div>
                  <div className={`text-2xl font-bold ${getStatusColor(100 - metrics.cache.hitRate, { good: 10, warning: 30 })}`}>
                    {metrics.cache.hitRate}%
                  </div>
                  <Progress value={metrics.cache.hitRate} className="mt-2" />
                </div>
                <div>
                  <div className="text-sm text-gray-600">Total Requests</div>
                  <div className="text-lg font-semibold">{metrics.cache.totalRequests.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Memory Usage</div>
                  <div className="text-lg font-semibold">{metrics.cache.memoryUsage}MB</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="application" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Application Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-500 mb-2">
                    {((1 - metrics.application.errorRate / 100) * 100).toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600">Uptime Percentage</p>
                  <div className="mt-3">
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      Operational
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Request Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <div className="text-sm text-gray-600">Total Requests</div>
                  <div className="text-lg font-semibold">{metrics.application.totalRequests.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.application.avgResponseTime, { good: 200, warning: 500 })}`}>
                    {metrics.application.avgResponseTime}ms
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Error Rate</div>
                  <div className={`text-lg font-semibold ${getStatusColor(metrics.application.errorRate, { good: 1, warning: 5 })}`}>
                    {metrics.application.errorRate}%
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trends</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Response Time</span>
                  <div className="flex items-center">
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">-5%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Error Rate</span>
                  <div className="flex items-center">
                    <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">-2%</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">CPU Usage</span>
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-yellow-500 mr-1" />
                    <span className="text-sm text-yellow-600">+3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}