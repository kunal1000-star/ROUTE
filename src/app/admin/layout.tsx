import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel',
  description: 'AI System Administration Panel',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  );
}