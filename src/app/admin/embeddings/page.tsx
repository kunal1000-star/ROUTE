// Admin Embedding Settings Page
// ============================

import { EmbeddingSettings } from '@/components/admin/EmbeddingSettings';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Embedding Settings | Admin',
  description: 'Manage embedding providers, models, and usage settings',
};

export default function EmbeddingsAdminPage() {
  return (
    <div className="container mx-auto py-8">
      <EmbeddingSettings />
    </div>
  );
}
