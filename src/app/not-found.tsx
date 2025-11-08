"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    console.log('404 page accessed');
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-3xl">404</CardTitle>
          <CardDescription className="text-lg">
            Page not found
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="space-y-2">
            <Button 
              asChild 
              className="w-full"
              onClick={() => {
                console.log('Back button clicked');
                router.back();
              }}
            >
              <Link href="javascript:void(0)">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Link>
            </Button>
            <Button 
              asChild 
              variant="outline" 
              className="w-full"
            >
              <Link href="/">
                <Home className="h-4 w-4 mr-2" />
                Home Page
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
