'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, Clock, Zap } from 'lucide-react';

interface ProviderResult {
  name: string;
  healthy: boolean;
  responseTime: number;
  error?: string;
  details?: any;
}

export function ProviderTestPanel() {
  const [testMessage, setTestMessage] = useState('Hello, this is a test message for debugging AI providers.');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [testResults, setTestResults] = useState<ProviderResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testAllProviders = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting provider tests...');
      const response = await fetch('/api/debug/ai-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testMessage
        }),
      });

      console.log('📡 API Response status:', response.status);
      console.log('📡 API Response headers:', response.headers);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error('❌ API returned non-JSON response:', textResponse.substring(0, 200));
        throw new Error(`API returned ${response.status} ${response.statusText} - expected JSON but got ${contentType || 'text/html'}`);
      }

      const result = await response.json();
      console.log('✅ Provider test results:', result);
      setTestResults(result.data.results);
    } catch (error) {
      console.error('❌ Provider test failed:', error);
      
      // Show user-friendly error
      if (error instanceof Error) {
        console.error('Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const testSpecificProvider = async (provider: string) => {
    setIsLoading(true);
    try {
      console.log(`🔍 Testing specific provider: ${provider}`);
      const response = await fetch('/api/debug/ai-providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider,
          message: testMessage
        }),
      });

      console.log(`📡 ${provider} Response status:`, response.status);

      // Check if response is actually JSON before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(`❌ ${provider} API returned non-JSON response:`, textResponse.substring(0, 200));
        throw new Error(`${provider} API returned ${response.status} - expected JSON but got ${contentType || 'text/html'}`);
      }

      const result = await response.json();
      console.log(`✅ ${provider} test result:`, result);
      setTestResults([result.data]);
    } catch (error) {
      console.error(`❌ ${provider} provider test failed:`, error);
      
      // Add failed result to display
      setTestResults([{
        name: provider,
        healthy: false,
        responseTime: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderStatus = (provider: ProviderResult) => {
    if (provider.healthy) {
      return (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Healthy
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Unhealthy
        </Badge>
      );
    }
  };

  const providers = ['groq', 'gemini', 'cerebras', 'cohere', 'mistral', 'openrouter'];

  return (
    <div className="space-y-6">
      {/* Test Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>AI Provider Testing</CardTitle>
          <CardDescription>
            Test individual AI providers or run comprehensive provider tests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Test Message</label>
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Enter test message for AI providers"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={testAllProviders} disabled={isLoading}>
              <Zap className="w-4 h-4 mr-2" />
              Test All Providers
            </Button>
            {providers.map((provider) => (
              <Button
                key={provider}
                variant="outline"
                onClick={() => testSpecificProvider(provider)}
                disabled={isLoading}
                className="capitalize"
              >
                {provider}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testResults.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg capitalize">{result.name || result.provider}</CardTitle>
                  {getProviderStatus(result)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Clock className="w-4 h-4 mr-2 text-gray-500" />
                    <span>Response Time: {result.responseTime}ms</span>
                  </div>
                  
                  {result.error && (
                    <div className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.details && (
                    <div className="space-y-2">
                      {result.details.healthCheck && (
                        <div className="text-xs text-gray-600">
                          Health Check: {result.details.healthCheck}ms
                        </div>
                      )}
                      {result.details.chatResponse && (
                        <div className="text-xs text-gray-600">
                          <strong>Response:</strong> {result.details.chatResponse.content}
                        </div>
                      )}
                      {result.details.chatResponse?.model && (
                        <div className="text-xs text-gray-600">
                          <strong>Model:</strong> {result.details.chatResponse.model}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Provider Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Provider Health Overview</CardTitle>
          <CardDescription>
            Current status of all AI providers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {providers.map((provider) => {
              const result = testResults.find(r => r.name === provider || r.provider === provider);
              return (
                <div key={provider} className="text-center p-3 border rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    {result?.healthy ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="font-medium capitalize text-sm">{provider}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {result?.responseTime ? `${result.responseTime}ms` : 'Not tested'}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}