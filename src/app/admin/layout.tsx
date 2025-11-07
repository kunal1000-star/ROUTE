import { Metadata } from 'next';
import '../globals.css';
import { Toaster } from '@/components/ui/toaster';
import { JsonParseErrorBoundary } from '@/components/error/JsonParseErrorBoundary';

export const metadata: Metadata = {
  title: 'Admin Panel - AI Study System',
  description: 'Administration dashboard for the AI study system',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <JsonParseErrorBoundary>
        {children}
        <Toaster />
      </JsonParseErrorBoundary>
    </div>
  );
}