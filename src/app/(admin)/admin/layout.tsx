'use client';

import { useAuth } from '@/hooks/use-auth-listener';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    if (!user) {
      router.push('/auth');
      return;
    }

    // All authenticated users are admins
    // No additional email checks needed as all authenticated users are admins
  }, [user, router]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Shield className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to access the admin panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/auth')} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // All authenticated users are admins
  const isAdmin = !!user;

  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}
