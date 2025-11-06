'use client';

import React, { useState, useEffect } from 'react';

interface EmbeddingProvider {
  name: string;
  provider: string;
  enabled: boolean;
  model: string;
  priority: number;
  health?: {
    healthy: boolean;
    responseTime: number;
    lastCheck: string;
    error?: string;
  };
  usage?: {
    requests: number;
    cost: number;
  };
}

interface AdminSettings {
  providers: {
    [key: string]: EmbeddingProvider;
  };
  defaultProvider: string;
}

export function EmbeddingSettingsWorking() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Starting API call...');
      
      // Create a timeout promise to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 10000); // 10 second timeout
      });
      
      const apiPromise = fetch('/api/admin/embeddings/settings', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      const response = await Promise.race([apiPromise, timeoutPromise]) as Response;
      
      console.log('📡 Response received:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('📊 Data received:', data);
      
      if (data.success) {
        setSettings(data.data);
        setError(null);
        console.log('✅ Settings loaded successfully');
      } else {
        throw new Error(data.error || 'API returned error');
      }
    } catch (error) {
      console.error('💥 Error details:', error);
      
      // For demo purposes, let's create mock data when API fails
      const mockData: AdminSettings = {
        providers: {
          cohere: {
            name: 'Cohere',
            provider: 'cohere',
            enabled: true,
            model: 'embed-english-v3.0',
            priority: 1,
            health: {
              healthy: true,
              responseTime: 245,
              lastCheck: new Date().toISOString()
            },
            usage: {
              requests: 1247,
              cost: 2.45
            }
          },
          mistral: {
            name: 'Mistral AI',
            provider: 'mistral',
            enabled: true,
            model: 'mistral-embed',
            priority: 2,
            health: {
              healthy: true,
              responseTime: 189,
              lastCheck: new Date().toISOString()
            },
            usage: {
              requests: 892,
              cost: 1.78
            }
          },
          google: {
            name: 'Google AI',
            provider: 'google',
            enabled: false,
            model: 'text-embedding-004',
            priority: 3,
            health: {
              healthy: false,
              responseTime: 0,
              lastCheck: new Date().toISOString(),
              error: 'API key not configured'
            },
            usage: {
              requests: 0,
              cost: 0
            }
          }
        },
        defaultProvider: 'cohere'
      };
      
      setSettings(mockData);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setError(`API Error: ${errorMessage}. Using mock data for demonstration.`);
      
      console.log('🔄 Using mock data due to API error');
    } finally {
      setLoading(false);
    }
  };

  const toggleProvider = async (providerKey: string) => {
    if (!settings) return;
    
    const updatedProviders = {
      ...settings.providers,
      [providerKey]: {
        ...settings.providers[providerKey],
        enabled: !settings.providers[providerKey].enabled
      }
    };
    
    setSettings({
      ...settings,
      providers: updatedProviders
    });
    
    console.log(`🔄 Toggled ${providerKey} provider`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Embedding Settings</h1>
            <p className="text-muted-foreground">
              Manage embedding providers, models, and usage settings
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="ml-2">Loading embedding settings...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">No Settings Available</h1>
          <p className="text-muted-foreground">Failed to load configuration data.</p>
          <button 
            onClick={loadSettings}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Embedding Settings</h1>
          <p className="text-muted-foreground">
            Manage embedding providers, models, and usage settings
          </p>
        </div>
        <button 
          onClick={loadSettings}
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
        >
          🔄 Refresh
        </button>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(settings.providers).map(([providerKey, provider]) => (
          <div key={providerKey} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold">{provider.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  provider.enabled 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {provider.enabled ? 'Enabled' : 'Disabled'}
                </span>
                {providerKey === settings.defaultProvider && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                    Default
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <span className={`w-3 h-3 rounded-full ${
                  provider.health?.healthy ? 'bg-green-500' : 'bg-red-500'
                }`}></span>
                <span className="text-sm text-gray-600">
                  {provider.health?.healthy 
                    ? `Healthy (${provider.health?.responseTime}ms)` 
                    : 'Unhealthy'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <p className="text-sm text-gray-900">{provider.model}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <p className="text-sm text-gray-900">{provider.priority}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleProvider(providerKey)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      provider.enabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      provider.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                  <span className="text-sm text-gray-600">
                    {provider.enabled ? 'On' : 'Off'}
                  </span>
                </div>
              </div>
            </div>

            {provider.usage && (
              <div className="border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Usage Today</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Requests:</span>
                    <span className="ml-2 font-medium">{provider.usage.requests.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost:</span>
                    <span className="ml-2 font-medium">${provider.usage.cost.toFixed(4)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Default Provider</h4>
        <p className="text-sm text-gray-600">
          <span className="font-medium">{settings.defaultProvider}</span> is set as the primary embedding provider.
        </p>
      </div>
    </div>
  );
}
