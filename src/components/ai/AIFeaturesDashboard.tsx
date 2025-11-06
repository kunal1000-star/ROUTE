// AI Features Dashboard Component
// =============================

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  Target, 
  Heart, 
  BarChart3, 
  Clock, 
  Zap,
  RefreshCw,
  Settings,
  CheckCircle,
  AlertCircle,
  XCircle
} from 'lucide-react';

interface AIFeature {
  id: number;
  name: string;
  description: string;
  category: string;
  priority: string;
  modelProvider: string;
  enabled: boolean;
}

interface FeatureResponse {
  featureId: number;
  success: boolean;
  data?: any;
  metadata: {
    modelUsed: string;
    latencyMs: number;
    cached: boolean;
  };
}

interface FeatureMetrics {
  totalCalls: number;
  avgLatency: number;
  successRate: number;
}

interface FeatureStatus {
  initialized: boolean;
  totalFeatures: number;
  enabledFeatures: number;
  cachedEntries: number;
}

const categoryConfig = {
  performance_analysis: {
    title: 'Performance Analysis',
    description: 'Track and analyze study performance',
    icon: BarChart3,
    color: 'bg-blue-500',
    features: [1, 2, 3, 4, 5, 6]
  },
  study_scheduling: {
    title: 'Study Scheduling', 
    description: 'Optimize study schedules and timing',
    icon: Calendar,
    color: 'bg-green-500',
    features: [7, 8, 9, 10, 11, 12]
  },
  prediction_estimation: {
    title: 'Prediction & Estimation',
    description: 'Predict outcomes and estimate requirements',
    icon: TrendingUp,
    color: 'bg-purple-500',
    features: [13, 14, 15, 16, 17]
  },
  motivation_learning: {
    title: 'Motivation & Learning',
    description: 'Provide motivation and learning support',
    icon: Heart,
    color: 'bg-pink-500',
    features: [18, 19, 20, 21, 22]
  }
};

const priorityConfig = {
  high: { color: 'bg-red-100 text-red-800', icon: Zap },
  medium: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  low: { color: 'bg-gray-100 text-gray-800', icon: Target }
};

export default function AIFeaturesDashboard() {
  const [features, setFeatures] = useState<AIFeature[]>([]);
  const [featureMetrics, setFeatureMetrics] = useState<Record<number, FeatureMetrics>>({});
  const [status, setStatus] = useState<FeatureStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<Record<number, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState('performance_analysis');
  const [userId] = useState('demo-user'); // In real app, get from auth

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load metrics and status with proper error handling
      const response = await fetch('/api/features/metrics?includeStatus=true');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON format');
      }
      
      const data = await response.json();
      
      if (data.featureMetrics) {
        setFeatureMetrics(data.featureMetrics);
      }
      
      if (data.status) {
        setStatus(data.status);
      }

      // Load features by category
      const featuresResponse = await fetch('/api/features/metrics');
      
      if (!featuresResponse.ok) {
        throw new Error(`HTTP ${featuresResponse.status}: ${featuresResponse.statusText}`);
      }
      
      const featuresContentType = featuresResponse.headers.get('content-type');
      if (!featuresContentType || !featuresContentType.includes('application/json')) {
        throw new Error('Features response is not JSON format');
      }
      
      const featuresData = await featuresResponse.json();
      
      if (featuresData.featuresByCategory) {
        const allFeatures: AIFeature[] = [];
        Object.values(featuresData.featuresByCategory).forEach((categoryFeatures: any) => {
          allFeatures.push(...categoryFeatures);
        });
        setFeatures(allFeatures);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set fallback data when API is unavailable
      setStatus({
        initialized: false,
        totalFeatures: 22,
        enabledFeatures: 0,
        cachedEntries: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFeature = async (featureId: number) => {
    try {
      setGenerating(prev => ({ ...prev, [featureId]: true }));
      
      const response = await fetch('/api/features/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          featureIds: [featureId],
          userId,
          context: {
            studyData: {
              totalBlocks: 50,
              completedBlocks: 35,
              accuracy: 78
            },
            performanceHistory: [
              { date: '2025-11-01', score: 75 },
              { date: '2025-11-02', score: 82 },
              { date: '2025-11-03', score: 78 }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON format');
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Refresh metrics after generation
        await loadDashboardData();
        
        // Show success message
        alert(`Feature ${featureId} generated successfully!`);
      } else {
        alert(`Failed to generate feature ${featureId}: ${result.error}`);
      }

    } catch (error) {
      console.error('Feature generation failed:', error);
      alert(`Feature generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setGenerating(prev => ({ ...prev, [featureId]: false }));
    }
  };

  const toggleFeature = async (featureId: number, enabled: boolean) => {
    try {
      const response = await fetch('/api/features/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featureId, enabled })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Response is not JSON format');
      }

      const result = await response.json();
      
      if (result.success) {
        setFeatures(prev => prev.map(f =>
          f.id === featureId ? { ...f, enabled } : f
        ));
      } else {
        throw new Error(result.error || 'Toggle operation failed');
      }
    } catch (error) {
      console.error('Toggle feature failed:', error);
      alert(`Failed to toggle feature: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const getStatusIcon = (successRate: number) => {
    if (successRate >= 0.9) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (successRate >= 0.7) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(1)}s`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Features Dashboard</h1>
          <p className="text-gray-600">Monitor and manage all 22 AI-powered study features</p>
        </div>
        <Button onClick={loadDashboardData} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Status Overview */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Brain className="h-8 w-8 text-blue-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{status.totalFeatures}</p>
                  <p className="text-gray-600">Total Features</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{status.enabledFeatures}</p>
                  <p className="text-gray-600">Enabled</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-yellow-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">{status.cachedEntries}</p>
                  <p className="text-gray-600">Cached Results</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
                <div>
                  <p className="text-2xl font-bold">
                    {status.initialized ? 'Ready' : 'Loading'}
                  </p>
                  <p className="text-gray-600">System Status</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Features by Category */}
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-4">
          {Object.entries(categoryConfig).map(([key, config]) => (
            <TabsTrigger key={key} value={key} className="flex items-center gap-2">
              <config.icon className="h-4 w-4" />
              {config.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(categoryConfig).map(([categoryKey, config]) => (
          <TabsContent key={categoryKey} value={categoryKey} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${config.color} text-white`}>
                <config.icon className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{config.title}</h2>
                <p className="text-gray-600">{config.description}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {config.features.map(featureId => {
                const feature = features.find(f => f.id === featureId);
                const metrics = featureMetrics[featureId];
                const priorityInfo = feature ? priorityConfig[feature.priority as keyof typeof priorityConfig] : null;
                
                if (!feature) return null;

                return (
                  <Card key={featureId} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <span>Feature {featureId}</span>
                            {metrics && getStatusIcon(metrics.successRate)}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {feature.name}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          {priorityInfo && (
                            <Badge className={priorityInfo.color}>
                              <priorityInfo.icon className="h-3 w-3 mr-1" />
                              {feature.priority}
                            </Badge>
                          )}
                          <Switch
                            checked={feature.enabled}
                            onCheckedChange={(enabled) => toggleFeature(featureId, enabled)}
                          />
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                      
                      {metrics && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Success Rate</span>
                            <span>{(metrics.successRate * 100).toFixed(1)}%</span>
                          </div>
                          <Progress value={metrics.successRate * 100} className="h-2" />
                          
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Calls: {metrics.totalCalls}</span>
                            <span>Avg Latency: {formatLatency(metrics.avgLatency)}</span>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => generateFeature(featureId)}
                          disabled={!feature.enabled || generating[featureId]}
                          className="flex-1"
                        >
                          {generating[featureId] ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Brain className="h-4 w-4 mr-2" />
                              Generate
                            </>
                          )}
                        </Button>
                        
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Provider: {feature.modelProvider} | 
                        {feature.enabled ? ' Enabled' : ' Disabled'}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Summary</CardTitle>
          <CardDescription>
            Overall system performance across all features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(featureMetrics).filter(m => m.successRate >= 0.9).length}
              </div>
              <div className="text-sm text-gray-600">High Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {Object.values(featureMetrics).filter(m => m.successRate >= 0.7 && m.successRate < 0.9).length}
              </div>
              <div className="text-sm text-gray-600">Medium Performance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(featureMetrics).filter(m => m.successRate < 0.7).length}
              </div>
              <div className="text-sm text-gray-600">Needs Attention</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}