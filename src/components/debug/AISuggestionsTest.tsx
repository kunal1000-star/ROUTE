'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface SuggestionsTestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  responseTime: number;
  message: string;
  details?: any;
}

export function AISuggestionsTest() {
  const [testResults, setTestResults] = useState<SuggestionsTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runAISuggestionsTest = async () => {
    setIsLoading(true);
    const results: SuggestionsTestResult[] = [];

    try {
      // Test 1: Basic suggestions fetch (same as AISuggestionsDashboard)
      console.log('🔍 Testing AI Suggestions fetch...');
      const suggestionsStart = Date.now();
      
      try {
        const { safeApiCall } = await import('@/lib/utils/safe-api');
        const result = await safeApiCall('/api/suggestions');
        const suggestionsTime = Date.now() - suggestionsStart;

        if (result.success) {
          results.push({
            test: 'Fetch Suggestions (safeApiCall)',
            status: 'success',
            responseTime: suggestionsTime,
            message: 'Suggestions fetched successfully',
            details: {
              hasData: !!result.data,
              success: result.data?.success,
              suggestionsCount: result.data?.suggestions?.length || 0,
              cached: result.data?.cached
            }
          });
        } else {
          results.push({
            test: 'Fetch Suggestions (safeApiCall)',
            status: 'error',
            responseTime: suggestionsTime,
            message: result.error || 'Failed to fetch suggestions',
            details: {
              isAuthError: result.isAuthError,
              needsAuth: result.needsAuth
            }
          });
        }
      } catch (error) {
        results.push({
          test: 'Fetch Suggestions (safeApiCall)',
          status: 'error',
          responseTime: Date.now() - suggestionsStart,
          message: error instanceof Error ? error.message : 'Network error',
          details: { error }
        });
      }

      // Test 2: Direct API call (same as original component)
      console.log('🔍 Testing direct API call...');
      const directStart = Date.now();
      
      try {
        const response = await fetch('/api/suggestions');
        const data = await response.json();
        const directTime = Date.now() - directStart;

        if (response.ok && data.success) {
          results.push({
            test: 'Direct API Call',
            status: 'success',
            responseTime: directTime,
            message: 'Direct API call successful',
            details: {
              hasData: !!data,
              success: data.success,
              suggestionsCount: data.suggestions?.length || 0,
              cached: data.cached
            }
          });
        } else {
          results.push({
            test: 'Direct API Call',
            status: 'error',
            responseTime: directTime,
            message: data.error || 'API call failed',
            details: {
              status: response.status,
              response: data
            }
          });
        }
      } catch (error) {
        results.push({
          test: 'Direct API Call',
          status: 'error',
          responseTime: Date.now() - directStart,
          message: error instanceof Error ? error.message : 'Network error',
          details: { error }
        });
      }

      // Test 3: Generate new suggestions
      console.log('🔍 Testing suggestion generation...');
      const generationStart = Date.now();
      
      try {
        const { safeApiCall } = await import('@/lib/utils/safe-api');
        const result = await safeApiCall('/api/suggestions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ forceRefresh: true })
        });
        const generationTime = Date.now() - generationStart;

        if (result.success) {
          results.push({
            test: 'Generate Suggestions',
            status: 'success',
            responseTime: generationTime,
            message: 'Suggestion generation successful',
            details: {
              hasData: !!result.data,
              success: result.data?.success,
              suggestionsGenerated: result.data?.suggestionsGenerated || 0
            }
          });
        } else {
          results.push({
            test: 'Generate Suggestions',
            status: 'error',
            responseTime: generationTime,
            message: result.error || 'Generation failed',
            details: {
              isAuthError: result.isAuthError,
              needsAuth: result.needsAuth
            }
          });
        }
      } catch (error) {
        results.push({
          test: 'Generate Suggestions',
          status: 'error',
          responseTime: Date.now() - generationStart,
          message: error instanceof Error ? error.message : 'Network error',
          details: { error }
        });
      }

      // Test 4: Simulate the exact AISuggestionsDashboard behavior
      console.log('🔍 Testing AISuggestionsDashboard pattern...');
      const dashboardStart = Date.now();
      
      try {
        const { safeApiCall } = await import('@/lib/utils/safe-api');
        const params = new URLSearchParams();
        const result = await safeApiCall(`/api/suggestions?${params}`);
        const dashboardTime = Date.now() - dashboardStart;

        if (!result.success) {
          // This should match the exact error condition from AISuggestionsDashboard
          throw new Error(result.error || 'Failed to fetch suggestions');
        }

        const data = result.data;
        if (data.success && data.suggestions) {
          results.push({
            test: 'AISuggestionsDashboard Pattern',
            status: 'success',
            responseTime: dashboardTime,
            message: 'Dashboard pattern working',
            details: {
              hasData: !!data,
              success: data.success,
              suggestionsCount: data.suggestions.length,
              cached: data.cached
            }
          });
        } else {
          throw new Error('API response not successful');
        }
      } catch (error) {
        results.push({
          test: 'AISuggestionsDashboard Pattern',
          status: 'error',
          responseTime: Date.now() - dashboardStart,
          message: error instanceof Error ? error.message : 'Dashboard pattern failed',
          details: { error }
        });
      }

    } finally {
      setTestResults(results);
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-blue-600';
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
      case 'pending':
        return <Badge className="bg-blue-100 text-blue-800">Pending</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const successCount = testResults.filter(r => r.status === 'success').length;
  const errorCount = testResults.filter(r => r.status === 'error').length;
  const totalCount = testResults.length;

  return (
    <div className="space-y-6">
      {/* AI Suggestions Test Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Suggestions System Test
          </CardTitle>
          <CardDescription>
            Test the exact error scenario from AISuggestionsDashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-green-50 rounded">
              <div className="text-2xl font-bold text-green-600">{successCount}</div>
              <div className="text-sm text-gray-600">Successful Tests</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded">
              <div className="text-2xl font-bold text-red-600">{errorCount}</div>
              <div className="text-sm text-gray-600">Failed Tests</div>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded">
              <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
              <div className="text-sm text-gray-600">Total Tests</div>
            </div>
          </div>
          
          <Button onClick={runAISuggestionsTest} disabled={isLoading} className="w-full">
            <Brain className="w-4 h-4 mr-2" />
            {isLoading ? 'Running Tests...' : 'Test AI Suggestions System'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>AI Suggestions Test Results</CardTitle>
            <CardDescription>
              Testing the exact patterns used by AISuggestionsDashboard
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
                        <h4 className="font-medium">{result.test}</h4>
                        <p className={`text-sm ${getStatusColor(result.status)}`}>{result.message}</p>
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

      {/* Original Error Scenario */}
      <Card>
        <CardHeader>
          <CardTitle>Original Error Scenario</CardTitle>
          <CardDescription>
            The exact error that was occurring in AISuggestionsDashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded p-4">
            <h4 className="font-medium text-red-800 mb-2">Original Error:</h4>
            <pre className="text-sm text-red-700 whitespace-pre-wrap">
{`Console Error

❌ Failed to load conversations: "User session not available - No NextAuth user found" and Console Error

User session not available - No NextAuth user found

src/components/ai/AISuggestionsDashboard.tsx (100:15) @ fetchSuggestions

   98 |       
   99 | if (!result.success) {
> 100 |         throw new Error(result.error || 'Failed to fetch suggestions');
      |               ^
 101 |       }`}
            </pre>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Root Cause:</strong> The safeApiCall function was trying to check NextAuth session by calling <code>/api/auth/session</code>, but this endpoint didn't exist in NextAuth v4.</p>
            <p><strong>Fix:</strong> Created the missing <code>/api/auth/session</code> endpoint that properly returns NextAuth session data.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}