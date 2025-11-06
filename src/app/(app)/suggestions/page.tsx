// Dedicated Suggestions Page
// ==========================

'use client';

import { useState, useEffect } from 'react';
import { AISuggestionsDashboard } from '@/components/ai/AISuggestionsDashboard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Sparkles, Brain, Target, TrendingUp, Lightbulb, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getCurrentUser } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

export default function SuggestionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [generatingPersonalized, setGeneratingPersonalized] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        // In a real app, redirect to login
        console.log('No user found, redirecting to auth');
      } else {
        setUser(currentUser);
      }
      setLoading(false);
    };
    checkUser();
  }, []);

  const generatePersonalizedSuggestions = async () => {
    try {
      setGeneratingPersonalized(true);
      
      const response = await fetch('/api/suggestions/personalized', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token || ''}`
        },
        body: JSON.stringify({
          context: 'manual_generation',
          timeAvailable: 60,
          currentMood: 'energetic'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        toast({
          title: "Personalized Suggestions Generated!",
          description: `Generated ${data.suggestionsGenerated} new personalized suggestions using AI embeddings.`,
        });
      } else {
        toast({
          title: "Generation Failed",
          description: data.error || "Failed to generate personalized suggestions",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating personalized suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to generate personalized suggestions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setGeneratingPersonalized(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p className="text-muted-foreground">Loading suggestions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-blue-500" />
          <h1 className="text-3xl font-bold">AI Study Suggestions</h1>
        </div>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Get personalized study recommendations powered by AI embeddings and your learning analytics. 
          Our system analyzes your patterns to suggest the most effective study strategies.
        </p>
      </div>

      {/* Feature Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-4">
              <Brain className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Multi-Provider AI</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>
              Uses Cohere, Mistral, and Google embeddings with automatic fallback for 99.9% reliability
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center mb-4">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <CardTitle className="text-lg">Personalized Analysis</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>
              Analyzes your study patterns, performance data, and behavior to create tailored recommendations
            </CardDescription>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center mb-4">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Real-time Updates</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <CardDescription>
              Suggestions update based on your latest activities and learning progress
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Suggestions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Personalized AI Suggestions
              </CardTitle>
              <CardDescription>
                Generate new suggestions using your multi-provider embedding system
              </CardDescription>
            </div>
            <Button 
              onClick={generatePersonalizedSuggestions}
              disabled={generatingPersonalized}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {generatingPersonalized ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {generatingPersonalized ? 'Generating...' : 'Generate New'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">Embedding Providers</Badge>
              <span>Cohere • Mistral • Google/Vertex AI</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">Analysis Types</Badge>
              <span>Performance • Patterns • Behavior • Collaborative</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Main Suggestions Dashboard */}
      <AISuggestionsDashboard 
        userId={user?.id}
        showHeader={false}
        compact={false}
      />

      {/* Footer */}
      <div className="text-center py-8 border-t">
        <p className="text-sm text-muted-foreground">
          Powered by multi-provider AI embeddings • {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
