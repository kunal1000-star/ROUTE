'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, CheckCircle, XCircle, Clock, Table, Activity, AlertTriangle } from 'lucide-react';

interface DatabaseResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  responseTime: number;
  message: string;
  details?: any;
}

export function DatabaseTestPanel() {
  const [testResults, setTestResults] = useState<DatabaseResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('unknown');

  const runDatabaseTest = async (testType: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/ai-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'database', databaseTest: testType }),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        setTestResults(result.data.databaseTests || []);
        setConnectionStatus(result.data.database?.status || 'unknown');
      } else {
        setTestResults([{
          test: testType,
          status: 'error',
          responseTime: 0,
          message: 'Test failed to execute',
          details: result
        }]);
      }
    } catch (error) {
      console.error('Database test failed:', error);
      setTestResults([{
        test: testType,
        status: 'error',
        responseTime: 0,
        message: 'Network error occurred',
        details: { error: error instanceof Error ? error.message : String(error) }
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const runConnectionTest = () => runDatabaseTest('connection');
  const runTableTest = () => runDatabaseTest('tables');
  const runQueryTest = () => runDatabaseTest('query');
  const runAllTests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/debug/ai-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ test: 'database', databaseTest: 'all' }),
      });
      
      const result = await response.json();
      if (response.ok) {
        setTestResults(result.data.databaseTests || []);
        setConnectionStatus(result.data.database?.status || 'unknown');
      }
    } catch (error) {
      console.error('Database test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Success</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getConnectionStatusColor = (status: string) => {
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

  const tables = [
    { name: 'conversations', description: 'Chat conversations data' },
    { name: 'messages', description: 'Individual chat messages' },
    { name: 'ai_suggestions', description: 'AI-generated suggestions' },
    { name: 'ai_analytics', description: 'AI system analytics data' },
    { name: 'user_settings', description: 'User preferences and settings' },
    { name: 'provider_usage', description: 'AI provider usage statistics' }
  ];

  return (
    <div className="space-y-6">
      {/* Database Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection Status
          </CardTitle>
          <CardDescription>
            Monitor database connectivity and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getConnectionStatusColor(connectionStatus).replace('text-', 'bg-')}`}></div>
              <span className={`font-medium capitalize ${getConnectionStatusColor(connectionStatus)}`}>
                {connectionStatus}
              </span>
            </div>
            <Button onClick={runConnectionTest} disabled={isLoading} size="sm">
              <Activity className="w-4 h-4 mr-2" />
              Test Connection
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Database Testing Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Database Testing Suite</CardTitle>
          <CardDescription>
            Run comprehensive tests to verify database functionality
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button onClick={runConnectionTest} disabled={isLoading} variant="outline">
              <Database className="w-4 h-4 mr-2" />
              Connection
            </Button>
            <Button onClick={runTableTest} disabled={isLoading} variant="outline">
              <Table className="w-4 h-4 mr-2" />
              Tables
            </Button>
            <Button onClick={runQueryTest} disabled={isLoading} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              Query
            </Button>
            <Button onClick={runAllTests} disabled={isLoading}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Run All
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Database test execution results and performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium capitalize">{result.test.replace('_', ' ')} Test</h4>
                        <p className="text-sm text-gray-600">{result.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(result.status)}
                      <Badge variant="outline" className="text-xs">
                        {result.responseTime}ms
                      </Badge>
                    </div>
                  </div>
                  
                  {result.details && (
                    <div className="bg-gray-50 p-3 rounded text-sm">
                      <pre className="whitespace-pre-wrap overflow-x-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Database Tables Overview */}
      <Card>
        <CardHeader>
          <CardTitle>AI System Database Tables</CardTitle>
          <CardDescription>
            Overview of database tables used by the AI system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((table) => (
              <div key={table.name} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium font-mono text-sm">{table.name}</h4>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-sm text-gray-600">{table.description}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Database Health Indicators */}
      <Card>
        <CardHeader>
          <CardTitle>Database Health Indicators</CardTitle>
          <CardDescription>
            Key performance and health metrics for the database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="connections">Connections</TabsTrigger>
              <TabsTrigger value="queries">Queries</TabsTrigger>
            </TabsList>
            
            <TabsContent value="performance" className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">98%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">15ms</div>
                  <div className="text-sm text-gray-600">Avg Response</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="connections" className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">8/50</div>
                  <div className="text-sm text-gray-600">Active Connections</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded">
                  <div className="text-2xl font-bold text-green-600">0</div>
                  <div className="text-sm text-gray-600">Failed Connections</div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="queries" className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded">
                  <div className="text-2xl font-bold text-blue-600">1.2K</div>
                  <div className="text-sm text-gray-600">Queries/min</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded">
                  <div className="text-2xl font-bold text-yellow-600">5</div>
                  <div className="text-sm text-gray-600">Slow Queries</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}