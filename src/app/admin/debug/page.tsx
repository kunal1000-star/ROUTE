'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Play, Clock, Database, Cpu, MessageSquare } from 'lucide-react';

// Import debug components
import { ProviderTestPanel } from '@/components/debug/ProviderTestPanel';
import { AuthTestPanel } from '@/components/debug/AuthTestPanel';
import { AISuggestionsTest } from '@/components/debug/AISuggestionsTest';
import { SystemOverview } from '@/components/debug/SystemOverview';
import { DatabaseTestPanel } from '@/components/debug/DatabaseTestPanel';
import { ChatFlowTestPanel } from '@/components/debug/ChatFlowTestPanel';

export default function AIDebugDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const runFullSystemTest = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/ai-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          testType: 'all'
        }),
      });
      const result = await response.json();
      setTestResults(result);
    } catch (error) {
      console.error('Test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadSystemStatus = async () => {
    try {
      const response = await fetch('/api/debug/ai-system');
      const result = await response.json();
      setSystemStatus(result);
    } catch (error) {
      console.error('Status load failed:', error);
    }
  };

  useEffect(() => {
    loadSystemStatus();
    const interval = setInterval(loadSystemStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI System Debug Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Comprehensive testing and monitoring of all AI system components
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              onClick={runFullSystemTest} 
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run Full Test
            </Button>
            <Button variant="outline" onClick={loadSystemStatus}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>
        </div>

        {/* Quick Status Overview */}
        {systemStatus && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">AI Providers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {Object.values(systemStatus.data?.providers || {}).some((p: any) => p.available) ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <span className="text-2xl font-bold">
                    {Object.values(systemStatus.data?.providers || {}).filter((p: any) => p.available).length}/
                    {Object.keys(systemStatus.data?.providers || {}).length}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Available Providers</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  {Object.values(systemStatus.data?.services || {}).every((s: any) => s.available) ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-yellow-500 mr-2" />
                  )}
                  <span className="text-2xl font-bold">
                    {Object.values(systemStatus.data?.services || {}).filter((s: any) => s.available).length}/
                    {Object.keys(systemStatus.data?.services || {}).length}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Core Services</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Database className="w-5 h-5 text-blue-500 mr-2" />
                  <Badge variant="secondary">Connected</Badge>
                </div>
                <p className="text-xs text-gray-600 mt-1">Supabase Active</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 text-gray-500 mr-2" />
                  <span className="text-sm">
                    {new Date(systemStatus.data?.timestamp || Date.now()).toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1">System Status</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Test Results */}
        {testResults && (
          <Card>
            <CardHeader>
              <CardTitle>Latest Test Results</CardTitle>
              <CardDescription>
                Full system test completed in {testResults.data?.totalTime}ms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span>Success Rate</span>
                  <div className="flex items-center space-x-2">
                    <Progress 
                      value={(testResults.data?.successfulTests / testResults.data?.totalTests) * 100} 
                      className="w-32" 
                    />
                    <span className="text-sm font-medium">
                      {testResults.data?.successfulTests}/{testResults.data?.totalTests}
                    </span>
                  </div>
                </div>
                {testResults.data?.results?.slice(0, 5).map((result: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      {result.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500 mr-2" />
                      )}
                      <span className="font-medium">{result.testName}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">{result.responseTime}ms</span>
                      <Badge variant={result.success ? "default" : "destructive"}>
                        {result.success ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Debug Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="auth">Auth</TabsTrigger>
            <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
            <TabsTrigger value="providers">Providers</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="chat">Chat Flow</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <SystemOverview />
          </TabsContent>

          <TabsContent value="auth" className="space-y-4">
            <AuthTestPanel />
          </TabsContent>

          <TabsContent value="ai-suggestions" className="space-y-4">
            <AISuggestionsTest />
          </TabsContent>

          <TabsContent value="providers" className="space-y-4">
            <ProviderTestPanel />
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <DatabaseTestPanel />
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <ChatFlowTestPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}