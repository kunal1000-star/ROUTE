// Advanced ML-Powered Study Insights Engine
// ==========================================

"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Brain,
  TrendingUp,
  Target,
  Clock,
  BookOpen,
  Award,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Zap,
  Calendar,
  BarChart3,
  Activity,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';

interface StudyPattern {
  date: string;
  studyTime: number;
  topics: string[];
  performance: number;
  difficulty: 'easy' | 'medium' | 'hard';
  focusScore: number;
}

interface LearningInsight {
  id: string;
  type: 'strength' | 'weakness' | 'opportunity' | 'pattern';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionable: boolean;
  recommendation: string;
  data: any;
}

interface PredictiveAnalysis {
  nextOptimalStudyTime: string;
  recommendedTopics: string[];
  expectedImprovement: number;
  difficultyProgression: string[];
  predictedScore: number;
  confidence: number;
}

interface StudyRecommendation {
  id: string;
  type: 'immediate' | 'scheduled' | 'review';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  estimatedTime: number;
  topics: string[];
  aiReasoning: string;
  deadline?: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface MLStudyInsightsProps { runSignal?: number }

export default function MLStudyInsights({ runSignal }: MLStudyInsightsProps) {
  const [studyPatterns, setStudyPatterns] = useState<StudyPattern[]>([]);
  const [insights, setInsights] = useState<LearningInsight[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalysis | null>(null);
  const [recommendations, setRecommendations] = useState<StudyRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<Date | null>(null);

  // Initialize with mock data for demonstration
  useEffect(() => {
    initializeMockData();
    performAnalysis();
  }, []);

  // Re-run analysis when parent triggers a run signal
  useEffect(() => {
    if (typeof runSignal !== 'number') return;
    performAnalysis();
  }, [runSignal]);

  const initializeMockData = () => {
    const mockPatterns: StudyPattern[] = [
      {
        date: '2025-11-01',
        studyTime: 120,
        topics: ['Thermodynamics', 'Calculus'],
        performance: 78,
        difficulty: 'medium',
        focusScore: 8.5
      },
      {
        date: '2025-11-02',
        studyTime: 95,
        topics: ['Organic Chemistry', 'Physics'],
        performance: 85,
        difficulty: 'hard',
        focusScore: 9.2
      },
      {
        date: '2025-11-03',
        studyTime: 105,
        topics: ['Linear Algebra', 'Statistics'],
        performance: 92,
        difficulty: 'medium',
        focusScore: 8.8
      },
      {
        date: '2025-11-04',
        studyTime: 110,
        topics: ['Thermodynamics', 'Statistical Mechanics'],
        performance: 73,
        difficulty: 'hard',
        focusScore: 7.1
      },
      {
        date: '2025-11-05',
        studyTime: 130,
        topics: ['Quantum Mechanics', 'Physics'],
        performance: 88,
        difficulty: 'hard',
        focusScore: 9.5
      }
    ];

    setStudyPatterns(mockPatterns);
  };

  const performAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate ML analysis processing
    setTimeout(() => {
      generateInsights();
      generatePredictions();
      generateRecommendations();
      setIsAnalyzing(false);
      setLastAnalysis(new Date());
    }, 2000);
  };

  const generateInsights = () => {
    const mockInsights: LearningInsight[] = [
      {
        id: '1',
        type: 'strength',
        title: 'Quantum Mechanics Mastery',
        description: 'Exceptional performance in quantum mechanics topics with 95% retention rate',
        confidence: 0.92,
        impact: 'high',
        actionable: false,
        recommendation: 'Continue challenging yourself with advanced problems',
        data: { 
          averageScore: 92, 
          retentionRate: 0.95, 
          topics: ['Quantum States', 'Operators', 'Schrödinger Equation'] 
        }
      },
      {
        id: '2',
        type: 'weakness',
        title: 'Thermodynamics Fundamentals',
        description: 'Inconsistent performance in thermodynamics, especially entropy concepts',
        confidence: 0.87,
        impact: 'high',
        actionable: true,
        recommendation: 'Focus on conceptual understanding and visual aids for entropy',
        data: { 
          averageScore: 68, 
          issues: ['Entropy calculations', 'Second law applications'], 
          errorRate: 0.35 
        }
      },
      {
        id: '3',
        type: 'pattern',
        title: 'Peak Performance Window',
        description: 'Study sessions after 2 PM show 23% better retention and focus',
        confidence: 0.89,
        impact: 'medium',
        actionable: true,
        recommendation: 'Schedule challenging topics between 2-4 PM for optimal learning',
        data: { 
          timeAnalysis: {
            'morning': { score: 74, focus: 7.2 },
            'afternoon': { score: 91, focus: 9.1 },
            'evening': { score: 82, focus: 8.4 }
          }
        }
      },
      {
        id: '4',
        type: 'opportunity',
        title: 'Spaced Repetition Gap',
        description: 'Not utilizing spaced repetition effectively - missing 40% of review opportunities',
        confidence: 0.78,
        impact: 'high',
        actionable: true,
        recommendation: 'Implement active recall sessions 24 hours after initial learning',
        data: { 
          currentRetention: 0.60,
          potentialWithSpacedRep: 0.85,
          missedReviews: 12
        }
      }
    ];

    setInsights(mockInsights);
  };

  const generatePredictions = () => {
    const mockPredictions: PredictiveAnalysis = {
      nextOptimalStudyTime: '2025-11-06 14:00',
      recommendedTopics: [
        'Thermodynamics - Entropy Applications',
        'Organic Chemistry - Reaction Mechanisms', 
        'Linear Algebra - Eigenvalue Problems'
      ],
      expectedImprovement: 15,
      difficultyProgression: [
        'Review current medium-difficulty thermodynamics (Today)',
        'Introduce hard-difficulty reaction mechanisms (Tomorrow)', 
        'Challenge with advanced linear algebra (Day 3)'
      ],
      predictedScore: 87,
      confidence: 0.84
    };

    setPredictions(mockPredictions);
  };

  const generateRecommendations = () => {
    const mockRecommendations: StudyRecommendation[] = [
      {
        id: '1',
        type: 'immediate',
        priority: 'urgent',
        title: 'Thermodynamics Review Session',
        description: 'Address entropy misconceptions with guided practice',
        estimatedTime: 45,
        topics: ['Entropy', 'Second Law', 'Statistical Mechanics'],
        aiReasoning: 'ML model detected 35% error rate in recent entropy calculations. Immediate intervention needed.',
        difficulty: 'medium'
      },
      {
        id: '2',
        type: 'scheduled', 
        priority: 'high',
        title: 'Quantum Mechanics Deep Dive',
        description: 'Leverage strengths with advanced quantum problems',
        estimatedTime: 90,
        topics: ['Quantum States', 'Time Evolution', 'Measurement Theory'],
        aiReasoning: '92% mastery score suggests readiness for advanced topics.',
        deadline: '2025-11-06 15:00',
        difficulty: 'hard'
      },
      {
        id: '3',
        type: 'review',
        priority: 'medium',
        title: 'Spaced Repetition Session',
        description: 'Review Linear Algebra concepts from 2 days ago',
        estimatedTime: 30,
        topics: ['Matrix Operations', 'Determinants', 'Vector Spaces'],
        aiReasoning: 'Optimal review window detected based on forgetting curve analysis.',
        deadline: '2025-11-06 18:00',
        difficulty: 'medium'
      },
      {
        id: '4',
        type: 'immediate',
        priority: 'high',
        title: 'Active Recall Practice',
        description: 'Test retention of Organic Chemistry reactions',
        estimatedTime: 25,
        topics: ['SN1/SN2 Reactions', 'Addition Reactions', 'Elimination'],
        aiReasoning: 'Scheduled review to improve 60% to target 85% retention rate.',
        difficulty: 'easy'
      }
    ];

    setRecommendations(mockRecommendations);
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'strength': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'weakness': return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'pattern': return <Activity className="h-5 w-5 text-blue-500" />;
      case 'opportunity': return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      default: return <Brain className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'high': return <ArrowUpRight className="h-4 w-4 text-green-500" />;
      case 'medium': return <Minus className="h-4 w-4 text-yellow-500" />;
      case 'low': return <ArrowDownRight className="h-4 w-4 text-red-500" />;
      default: return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Brain className="h-6 w-6 text-purple-500" />
            AI-Powered Study Insights
          </h2>
          <p className="text-muted-foreground">
            Machine learning analysis of your study patterns and personalized recommendations
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {lastAnalysis && (
            <Badge variant="outline" className="text-xs">
              Last analysis: {lastAnalysis.toLocaleTimeString()}
            </Badge>
          )}
          <Button 
            onClick={performAnalysis} 
            disabled={isAnalyzing}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            {isAnalyzing ? (
              <>
                <Activity className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">Key Insights</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Key Insights */}
        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getInsightIcon(insight.type)}
                      <CardTitle className="text-lg">{insight.title}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2">
                      {getImpactIcon(insight.impact)}
                      <Badge 
                        variant={insight.confidence > 0.8 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {Math.round(insight.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {insight.description}
                  </p>
                  
                  {insight.actionable && (
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            AI Recommendation
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {insight.recommendation}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      Impact: {insight.impact}
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Actionable: {insight.actionable ? 'Yes' : 'No'}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {recommendations.map((rec) => (
              <Card key={rec.id} className="relative">
                <div className={`absolute top-0 left-0 w-1 h-full ${getPriorityColor(rec.priority)}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-500" />
                        {rec.title}
                        <Badge 
                          variant={rec.priority === 'urgent' ? 'destructive' : 'secondary'}
                          className="text-xs ml-2"
                        >
                          {rec.priority}
                        </Badge>
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {rec.description}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>{rec.estimatedTime} minutes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>{rec.difficulty}</span>
                    </div>
                    {rec.deadline && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-red-500" />
                        <span>Due: {rec.deadline}</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Topics</label>
                    <div className="flex flex-wrap gap-1">
                      {rec.topics.map((topic, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Brain className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          AI Reasoning
                        </p>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          {rec.aiReasoning}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      Start Now
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
