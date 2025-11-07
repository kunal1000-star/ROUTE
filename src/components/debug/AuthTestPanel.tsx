'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, User, Key, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface AuthTestResult {
  test: string;
  status: 'success' | 'error' | 'pending';
  responseTime: number;
  message: string;
  details?: any;
}

export function AuthTestPanel() {
  const [testResults, setTestResults] = useState<AuthTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const runAuthTests = async () => {
    setIsLoading(true);
    const results: AuthTestResult[] = [];

    try {
      // Test 1: Check NextAuth session endpoint
      console.log('🔍 Testing NextAuth session endpoint...');
      const sessionStart = Date.now();
      
      try {
        const sessionResponse = await fetch('/api/auth/session');
        const sessionData = await sessionResponse.json();
        const sessionTime = Date.now() - sessionStart;

        if (sessionResponse.ok && sessionData.user) {
          results.push({
            test: 'NextAuth Session',
            status: 'success',
            responseTime: sessionTime,
            message: 'Session endpoint working',
            details: {
              user: sessionData.user,
              hasToken: !!sessionData.accessToken
            }
          });
        } else {
          results.push({
            test: 'NextAuth Session',
            status: 'error',
            responseTime: sessionTime,
            message: sessionData.error || 'No session found',
            details: sessionData
          });
        }
      } catch (error) {
        results.push({
          test: 'NextAuth Session',
          status: 'error',
          responseTime: Date.now() - sessionStart,
          message: error instanceof Error ? error.message : 'Network error',
          details: { error: error }
        });
      }

      // Test 2: Check Supabase session
      console.log('🔍 Testing Supabase session...');
      const supabaseStart = Date.now();
      
      try {
        // Test if we can get Supabase session
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
        const { data: { session }, error } = await supabase.auth.getSession();
        const supabaseTime = Date.now() - supabaseStart;

        if (!error && session) {
          results.push({
            test: 'Supabase Session',
            status: 'success',
            responseTime: supabaseTime,
            message: 'Supabase session active',
            details: {
              user: session.user.email,
              tokenType: session.token_type,
              expiresAt: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'No expiry'
            }
          });
        } else {
          results.push({
            test: 'Supabase Session',
            status: 'error',
            responseTime: supabaseTime,
            message: error?.message || 'No Supabase session',
            details: { error, session }
          });
        }
      } catch (error) {
        results.push({
          test: 'Supabase Session',
          status: 'error',
          responseTime: Date.now() - supabaseStart,
          message: error instanceof Error ? error.message : 'Supabase error',
          details: { error }
        });
      }

      // Test 3: Test AI Suggestions API with authentication
      console.log('🔍 Testing AI Suggestions API with auth...');
      const suggestionsStart = Date.now();
      
      try {
        const suggestionsResponse = await fetch('/api/suggestions');
        const suggestionsData = await suggestionsResponse.json();
        const suggestionsTime = Date.now() - suggestionsStart;

        if (suggestionsResponse.ok) {
          results.push({
            test: 'AI Suggestions API',
            status: 'success',
            responseTime: suggestionsTime,
            message: 'AI suggestions accessible',
            details: {
              success: suggestionsData.success,
              suggestionsCount: suggestionsData.suggestions?.length || 0,
              cached: suggestionsData.cached
            }
          });
        } else {
          results.push({
            test: 'AI Suggestions API',
            status: 'error',
            responseTime: suggestionsTime,
            message: suggestionsData.error || 'API failed',
            details: suggestionsData
          });
        }
      } catch (error) {
        results.push({
          test: 'AI Suggestions API',
          status: 'error',
          responseTime: Date.now() - suggestionsStart,
          message: error instanceof Error ? error.message : 'API error',
          details: { error }
        });
      }

      // Test 4: Test safeApiCall function
      console.log('🔍 Testing safeApiCall function...');
      const safeApiStart = Date.now();
      
      try {
        const { safeApiCall } = await import('@/lib/utils/safe-api');
        const result = await safeApiCall('/api/suggestions');
        const safeApiTime = Date.now() - safeApiStart;

        if (result.success) {
          results.push({
            test: 'Safe API Call',
            status: 'success',
            responseTime: safeApiTime,
            message: 'safeApiCall working correctly',
            details: {
              hasData: !!result.data,
              dataKeys: result.data ? Object.keys(result.data) : []
            }
          });
        } else {
          results.push({
            test: 'Safe API Call',
            status: 'error',
            responseTime: safeApiTime,
            message: result.error || 'safeApiCall failed',
            details: {
              isAuthError: result.isAuthError,
              needsAuth: result.needsAuth
            }
          });
        }
      } catch (error) {
        results.push({
          test: 'Safe API Call',
          status: 'error',
          responseTime: Date.now() - safeApiStart,
          message: error instanceof Error ? error.message : 'safeApiCall error',
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
      {/* Authentication Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Authentication System Test
          </CardTitle>
          <CardDescription>
            Test NextAuth session, Supabase auth, and API authentication flow
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
          
          <Button onClick={runAuthTests} disabled={isLoading} className="w-full">
            <Shield className="w-4 h-4 mr-2" />
            {isLoading ? 'Running Tests...' : 'Run Authentication Tests'}
          </Button>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Authentication Test Results</CardTitle>
            <CardDescription>
              Detailed results from authentication flow testing
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

      {/* Authentication Flow Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Authentication Flow</CardTitle>
          <CardDescription>
            How authentication works in the AI system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { 
                step: 'NextAuth Session', 
                description: 'Check Google OAuth session', 
                icon: User,
                endpoint: '/api/auth/session'
              },
              { 
                step: 'Supabase Auth', 
                description: 'Verify Supabase session', 
                icon: Key,
                endpoint: 'Supabase SDK'
              },
              { 
                step: 'API Headers', 
                description: 'Pass auth headers to APIs', 
                icon: Shield,
                endpoint: 'X-NextAuth-* headers'
              },
              { 
                step: 'Route Protection', 
                description: 'Verify user in API routes', 
                icon: CheckCircle,
                endpoint: 'authenticateUser()'
              }
            ].map((flow, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <flow.icon className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium text-sm">{flow.step}</h4>
                  <p className="text-xs text-gray-600">{flow.description}</p>
                  <code className="text-xs text-blue-600">{flow.endpoint}</code>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}