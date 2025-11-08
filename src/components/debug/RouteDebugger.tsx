"use client";

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bug, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

interface RouteDebugInfo {
  pathname: string;
  searchParams: string;
  timestamp: string;
  errors: string[];
  warnings: string[];
}

export function RouteDebugger() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [debugInfo, setDebugInfo] = useState<RouteDebugInfo | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const currentTime = new Date().toLocaleTimeString();
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for common issues
    if (pathname.includes('/404') || pathname.includes('/not-found')) {
      errors.push('Page redirected to 404');
    }

    if (pathname.includes('undefined') || pathname.includes('null')) {
      errors.push('Route contains undefined/null values');
    }

    if (pathname.length > 200) {
      warnings.push('Very long route path');
    }

    if (pathname.includes('%')) {
      warnings.push('Route contains URL encoded characters');
    }

    // Check for specific route patterns
    const validRoutes = [
      '/', '/auth', '/dashboard', '/admin', '/chat', '/boards', 
      '/session', '/topics', '/schedule', '/settings', '/analytics',
      '/achievements', '/feedback', '/gamification', '/points-history',
      '/resources', '/revision', '/revision-queue', '/daily-summary',
      '/activity-logs', '/study-buddy', '/suggestions'
    ];

    if (!validRoutes.some(route => pathname.startsWith(route))) {
      warnings.push(`Unrecognized route pattern: ${pathname}`);
    }

    const debug: RouteDebugInfo = {
      pathname: pathname || '/',
      searchParams: searchParams.toString() || 'none',
      timestamp: currentTime,
      errors,
      warnings
    };

    setDebugInfo(debug);

    // Log to console for debugging
    console.log('Route Debug Info:', debug);
  }, [pathname, searchParams]);

  if (!isVisible) {
    return (
      <Button
        onClick={() => setIsVisible(true)}
        variant="outline"
        size="sm"
        className="fixed bottom-4 left-4 z-50"
      >
        <Bug className="h-4 w-4 mr-2" />
        Debug Route
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 left-4 z-50 w-96 max-h-96 overflow-auto">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Route Debugger
          </span>
          <Button
            onClick={() => setIsVisible(false)}
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-xs">
        <div>
          <span className="font-medium">Path:</span> 
          <code className="ml-1 px-1 bg-muted rounded">{debugInfo?.pathname}</code>
        </div>
        
        <div>
          <span className="font-medium">Params:</span>
          <code className="ml-1 px-1 bg-muted rounded">{debugInfo?.searchParams}</code>
        </div>
        
        <div>
          <span className="font-medium">Time:</span>
          <span className="ml-1">{debugInfo?.timestamp}</span>
        </div>

        {debugInfo?.errors.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-destructive font-medium">
              <XCircle className="h-3 w-3" />
              Errors:
            </div>
            {debugInfo.errors.map((error, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {error}
              </Badge>
            ))}
          </div>
        )}

        {debugInfo?.warnings.length > 0 && (
          <div>
            <div className="flex items-center gap-1 text-yellow-600 font-medium">
              <AlertTriangle className="h-3 w-3" />
              Warnings:
            </div>
            {debugInfo.warnings.map((warning, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {warning}
              </Badge>
            ))}
          </div>
        )}

        {debugInfo?.errors.length === 0 && debugInfo?.warnings.length === 0 && (
          <div className="flex items-center gap-1 text-green-600 font-medium">
            <CheckCircle className="h-3 w-3" />
            Route looks good!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
