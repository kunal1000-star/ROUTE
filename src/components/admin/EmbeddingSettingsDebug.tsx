'use client';

import React, { useState, useEffect } from 'react';

interface EmbeddingProvider {
  name: string;
  provider: string;
  enabled: boolean;
  model: string;
  priority: number;
}

interface AdminSettings {
  providers: {
    [key: string]: EmbeddingProvider;
  };
  defaultProvider: string;
}

export function EmbeddingSettingsDebug() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading settings...');
      
      const response = await fetch('/api/admin/embeddings/settings');
      console.log('📡 Response status:', response.status);
      
      const data = await response.json();
      console.log('📊 Response data:', data);
      
      if (data.success) {
        setSettings(data.data);
        setError(null);
        console.log('✅ Settings loaded successfully');
      } else {
        setError(data.error || 'Failed to load settings');
        console.log('❌ Settings load failed:', data.error);
      }
    } catch (error) {
      console.error('💥 Network error:', error);
      setError('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 border border-blue-300 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold text-blue-800">🔄 Loading Embedding Settings...</h2>
        <p className="text-blue-600">Please wait while we fetch the configuration data.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 border border-red-300 bg-red-50 rounded-lg">
        <h2 className="text-xl font-bold text-red-800">❌ Error Loading Settings</h2>
        <p className="text-red-600">{error}</p>
        <button 
          onClick={loadSettings}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8 border border-gray-300 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold text-gray-800">❓ No Settings Available</h2>
        <p className="text-gray-600">Settings data is null or undefined.</p>
      </div>
    );
  }

  return (
    <div className="p-8 border border-green-300 bg-green-50 rounded-lg">
      <h2 className="text-xl font-bold text-green-800 mb-4">✅ Embedding Settings Debug Component</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-green-700">📊 Configuration Data:</h3>
        <pre className="bg-white p-4 rounded border text-sm overflow-auto max-h-96">
          {JSON.stringify(settings, null, 2)}
        </pre>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-green-700">🏢 Embedding Providers:</h3>
        
        {Object.entries(settings.providers).map(([providerKey, provider]) => (
          <div key={providerKey} className="p-4 bg-white border border-gray-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{provider.name}</h4>
                <p className="text-sm text-gray-600">Model: {provider.model}</p>
                <p className="text-sm text-gray-600">Provider Key: {providerKey}</p>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  provider.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  Priority: {provider.priority}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
        <h4 className="font-semibold text-gray-800">⚙️ Default Provider:</h4>
        <p className="text-sm text-gray-600">{settings.defaultProvider}</p>
      </div>

      <button 
        onClick={loadSettings}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        🔄 Refresh Data
      </button>
    </div>
  );
}
