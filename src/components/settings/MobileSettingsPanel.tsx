// Mobile-Optimized Settings Panel Component - Phase 5
// Touch-optimized, mobile-friendly 5-tab settings interface

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMobile } from '@/hooks/use-mobile';
import { safeApiCall } from '@/lib/utils/safe-api';
import type { 
  UserSettings, 
  AIModelSettings, 
  FeaturePreferences, 
  NotificationSettings, 
  PrivacyControls, 
  UsageMonitoring,
  UsageStatistics 
} from '@/types/settings';

// Icons
import { 
  Settings as SettingsIcon, 
  Brain, 
  Bell, 
  Shield, 
  BarChart3, 
  Download, 
  RotateCcw,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Zap,
  Target,
  Clock
} from 'lucide-react';

interface MobileSettingsPanelProps {
  userId: string;
  onClose?: () => void;
}

export default function MobileSettingsPanel({ userId, onClose }: MobileSettingsPanelProps) {
  const { toast } = useToast();
  const isMobile = useMobile();
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [usageStats, setUsageStats] = useState<UsageStatistics | null>(null);
  const [tempSettings, setTempSettings] = useState<UserSettings | null>(null);

  // Load settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, [userId]);

  const loadUserSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsResponse, statsResponse] = await Promise.all([
        safeApiCall(`/api/user/settings?userId=${userId}`),
        safeApiCall(`/api/user/settings/statistics?userId=${userId}`)
      ]);

      if (settingsResponse.success) {
        setSettings(settingsResponse.data);
        setTempSettings(settingsResponse.data);
      }

      if (statsResponse.success) {
        setUsageStats(statsResponse.data);
      }

    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    if (!tempSettings) return;

    setIsLoading(true);
    try {
      const result = await safeApiCall(`/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          settings: tempSettings
        })
      });

      if (result.success) {
        setSettings(tempSettings);
        setHasUnsavedChanges(false);
        toast({
          title: 'Success',
          description: 'Settings saved successfully',
          variant: 'default'
        });
      } else {
        throw new Error(result.error);
      }

    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetSettings = async () => {
    if (!confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }

    setIsLoading(true);
    try {
      const result = await safeApiCall(`/api/user/settings/reset?userId=${userId}`, {
        method: 'POST'
      });

      if (result.success) {
        setSettings(result.data);
        setTempSettings(result.data);
        setHasUnsavedChanges(false);
        toast({
          title: 'Success',
          description: 'Settings reset to defaults',
          variant: 'default'
        });
      }

    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to reset settings',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportSettings = async () => {
    try {
      const result = await safeApiCall(`/api/user/settings/export?userId=${userId}`);

      if (result.success) {
        const dataStr = JSON.stringify(result.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `study-assistant-settings-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        toast({
          title: 'Success',
          description: 'Settings exported successfully',
          variant: 'default'
        });
      }

    } catch (error) {
      console.error('Failed to export settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to export settings',
        variant: 'destructive'
      });
    }
  };

  const updateTempSettings = (updates: Partial<UserSettings>) => {
    if (!tempSettings) return;
    
    const updated = { ...tempSettings, ...updates };
    setTempSettings(updated);
    setHasUnsavedChanges(true);
  };

  const toggleSection = (section: string) => {
    setActiveSection(activeSection === section ? null : section);
  };

  if (isLoading && !settings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  if (!settings || !tempSettings) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-4" />
          <p className="text-destructive">Failed to load settings</p>
          <Button onClick={loadUserSettings} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Mobile-Optimized Header */}
      <Card>
        <CardHeader className={isMobile ? "p-4" : ""}>
          <div className={`flex items-center justify-between ${isMobile ? 'flex-col gap-3' : ''}`}>
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SettingsIcon className="h-5 w-5" />
                Settings
              </CardTitle>
              <CardDescription className="text-sm">
                Customize your AI study assistant
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="animate-pulse text-xs">
                  Unsaved Changes
                </Badge>
              )}
              <Button
                onClick={saveSettings}
                disabled={!hasUnsavedChanges || isLoading}
                className="bg-primary flex-1 sm:flex-none"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {isMobile ? 'Save' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mobile-Optimized Settings Sections */}
      <div className="space-y-4">
        
        {/* AI Models Section */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('aiModels')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-base">AI Models</h3>
                  <p className="text-sm text-gray-500">Configure AI providers and quality</p>
                </div>
              </div>
              {activeSection === 'aiModels' ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </div>
          
          {activeSection === 'aiModels' && (
            <CardContent className="border-t p-4 space-y-4">
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Primary Provider</Label>
                  <Select
                    value={tempSettings.aiModel.preferredProviders[0]}
                    onValueChange={(value) => {
                      const newProviders = [value, ...tempSettings.aiModel.preferredProviders.filter(p => p !== value)];
                      updateTempSettings({ aiModel: { ...tempSettings.aiModel, preferredProviders: newProviders } });
                    }}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gemini">Gemini</SelectItem>
                      <SelectItem value="mistral">Mistral</SelectItem>
                      <SelectItem value="groq">Groq</SelectItem>
                      <SelectItem value="cerebras">Cerebras</SelectItem>
                      <SelectItem value="openrouter">OpenRouter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Quality Setting</Label>
                  <Select
                    value={tempSettings.aiModel.qualitySettings.responseQuality}
                    onValueChange={(value: 'fast' | 'balanced' | 'high') =>
                      updateTempSettings({ 
                        aiModel: { 
                          ...tempSettings.aiModel, 
                          qualitySettings: { 
                            ...tempSettings.aiModel.qualitySettings, 
                            responseQuality: value 
                          }
                        }
                      })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fast">Fast (Lower Cost)</SelectItem>
                      <SelectItem value="balanced">Balanced</SelectItem>
                      <SelectItem value="high">High Quality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Temperature: {tempSettings.aiModel.qualitySettings.temperature}</Label>
                  <Slider
                    value={[tempSettings.aiModel.qualitySettings.temperature]}
                    onValueChange={([value]) =>
                      updateTempSettings({ 
                        aiModel: { 
                          ...tempSettings.aiModel, 
                          qualitySettings: { 
                            ...tempSettings.aiModel.qualitySettings, 
                            temperature: value 
                          }
                        }
                      })
                    }
                    min={0}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Features Section */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('features')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className="h-5 w-5 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-base">Features</h3>
                  <p className="text-sm text-gray-500">AI suggestions and study modes</p>
                </div>
              </div>
              {activeSection === 'features' ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </div>
          
          {activeSection === 'features' && (
            <CardContent className="border-t p-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Enable AI Suggestions</Label>
                  <Switch
                    checked={tempSettings.features.aiSuggestions.enabled}
                    onCheckedChange={(checked) =>
                      updateTempSettings({
                        features: {
                          ...tempSettings.features,
                          aiSuggestions: {
                            ...tempSettings.features.aiSuggestions,
                            enabled: checked
                          }
                        }
                      })
                    }
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium">Frequency</Label>
                  <Select
                    value={tempSettings.features.aiSuggestions.frequency}
                    onValueChange={(value: 'real-time' | 'hourly' | 'daily' | 'manual') =>
                      updateTempSettings({
                        features: {
                          ...tempSettings.features,
                          aiSuggestions: {
                            ...tempSettings.features.aiSuggestions,
                            frequency: value
                          }
                        }
                      })
                    }
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="real-time">Real-time</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="manual">Manual Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">Categories</Label>
                  {Object.entries(tempSettings.features.aiSuggestions.categories).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">
                        {key}
                      </Label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateTempSettings({
                            features: {
                              ...tempSettings.features,
                              aiSuggestions: {
                                ...tempSettings.features.aiSuggestions,
                                categories: {
                                  ...tempSettings.features.aiSuggestions.categories,
                                  [key]: checked
                                }
                              }
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Notifications Section */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('notifications')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-base">Notifications</h3>
                  <p className="text-sm text-gray-500">Push and email notifications</p>
                </div>
              </div>
              {activeSection === 'notifications' ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </div>
          
          {activeSection === 'notifications' && (
            <CardContent className="border-t p-4 space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Push Notifications</Label>
                  <Switch
                    checked={tempSettings.notifications.pushNotifications.enabled}
                    onCheckedChange={(checked) =>
                      updateTempSettings({
                        notifications: {
                          ...tempSettings.notifications,
                          pushNotifications: {
                            ...tempSettings.notifications.pushNotifications,
                            enabled: checked
                          }
                        }
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Email Notifications</Label>
                  <Switch
                    checked={tempSettings.notifications.emailNotifications.enabled}
                    onCheckedChange={(checked) =>
                      updateTempSettings({
                        notifications: {
                          ...tempSettings.notifications,
                          emailNotifications: {
                            ...tempSettings.notifications.emailNotifications,
                            enabled: checked
                          }
                        }
                      })
                    }
                  />
                </div>

                {/* Notification Types */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Notification Types</Label>
                  {['studyReminders', 'achievementAlerts', 'revisionAlerts'].map((type) => (
                    <div key={type} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">
                        {type.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                      <Switch
                        checked={tempSettings.notifications.pushNotifications[type as keyof typeof tempSettings.notifications.pushNotifications] as boolean}
                        onCheckedChange={(checked) =>
                          updateTempSettings({
                            notifications: {
                              ...tempSettings.notifications,
                              pushNotifications: {
                                ...tempSettings.notifications.pushNotifications,
                                [type]: checked
                              }
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Privacy Section */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('privacy')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-red-600" />
                <div>
                  <h3 className="font-semibold text-base">Privacy</h3>
                  <p className="text-sm text-gray-500">Data collection and sharing</p>
                </div>
              </div>
              {activeSection === 'privacy' ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </div>
          
          {activeSection === 'privacy' && (
            <CardContent className="border-t p-4 space-y-4">
              <div className="space-y-4">
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Data Collection</Label>
                  {Object.entries(tempSettings.privacy.dataCollection).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateTempSettings({
                            privacy: {
                              ...tempSettings.privacy,
                              dataCollection: {
                                ...tempSettings.privacy.dataCollection,
                                [key]: checked
                              }
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium">AI Data Processing</Label>
                  {Object.entries(tempSettings.privacy.aiDataProcessing).map(([key, enabled]) => (
                    <div key={key} className="flex items-center justify-between">
                      <Label className="text-sm capitalize">
                        {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      </Label>
                      <Switch
                        checked={enabled}
                        onCheckedChange={(checked) =>
                          updateTempSettings({
                            privacy: {
                              ...tempSettings.privacy,
                              aiDataProcessing: {
                                ...tempSettings.privacy.aiDataProcessing,
                                [key]: checked
                              }
                            }
                          })
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Usage Section */}
        <Card className="overflow-hidden">
          <div 
            className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection('usage')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-base">Usage & Statistics</h3>
                  <p className="text-sm text-gray-500">Monitor your study progress</p>
                </div>
              </div>
              {activeSection === 'usage' ? 
                <ChevronDown className="h-5 w-5" /> : 
                <ChevronRight className="h-5 w-5" />
              }
            </div>
          </div>
          
          {activeSection === 'usage' && usageStats && (
            <CardContent className="border-t p-4 space-y-4">
              {/* Usage Statistics Overview - Mobile Optimized */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{usageStats.totalSessions}</p>
                  <p className="text-xs text-gray-600">Sessions</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Clock className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{Math.round(usageStats.totalStudyTime / 60)}h</p>
                  <p className="text-xs text-gray-600">Study Time</p>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Brain className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{usageStats.aiRequestsMade}</p>
                  <p className="text-xs text-gray-600">AI Requests</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                  <p className="text-lg font-bold">{usageStats.studyStreak.current}</p>
                  <p className="text-xs text-gray-600">Day Streak</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Display Options</Label>
                {Object.entries(tempSettings.usage.displayOptions).map(([key, enabled]) => (
                  <div key={key} className="flex items-center justify-between">
                    <Label className="text-sm capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </Label>
                    <Switch
                      checked={enabled}
                      onCheckedChange={(checked) =>
                        updateTempSettings({
                          usage: {
                            ...tempSettings.usage,
                            displayOptions: {
                              ...tempSettings.usage.displayOptions,
                              [key]: checked
                            }
                          }
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>

      </div>

      {/* Mobile Action Bar */}
      {isMobile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={exportSettings}
                disabled={isLoading}
                className="flex-1"
                size="sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                onClick={resetSettings}
                disabled={isLoading}
                className="flex-1"
                size="sm"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button
                onClick={saveSettings}
                disabled={!hasUnsavedChanges || isLoading}
                className="bg-primary flex-1"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Desktop Action Buttons */}
      {!isMobile && onClose && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
}
