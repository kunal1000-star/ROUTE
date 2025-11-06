// Mistral Data Service - Enhancement 3 Implementation
// Database operations and context building for Mistral AI services

import { supabase } from '../supabase';
import { getMistralAIService, type ImageAnalysisResult, type ComplexReasoningResult } from './mistral-integration';

export interface MistralContext {
  userId: string;
  recentImageAnalyses: ImageAnalysisResult[];
  recentReasoningSessions: ComplexReasoningResult[];
  studyHistory: any[];
  currentGoals: string[];
  learningStyle: string;
  performancePatterns: any;
}

export interface MistralDatabaseRecord {
  id: string;
  user_id: string;
  type: 'image_analysis' | 'complex_reasoning';
  result_data: any;
  confidence_score: number;
  processing_time: number;
  analysis_type?: string;
  reasoning_type?: string;
  complexity_level?: string;
  created_at: string;
  metadata: any;
}

export interface MistralAnalytics {
  totalAnalyses: number;
  totalReasoningSessions: number;
  averageConfidence: number;
  averageProcessingTime: number;
  popularAnalysisTypes: Array<{ type: string; count: number }>;
  popularReasoningTypes: Array<{ type: string; count: number }>;
  recentActivity: Array<{
    type: string;
    timestamp: string;
    confidence: number;
  }>;
  performanceTrends: {
    confidenceImprovement: number;
    processingTimeEfficiency: number;
  };
}

export class MistralDataService {
  private mistralService = getMistralAIService();

  constructor() {
    // Initialize the service
    this.mistralService.initialize().catch(console.error);
  }

  // Get comprehensive user context for Mistral processing
  async getUserContext(userId: string): Promise<MistralContext> {
    try {
      const [
        recentImageAnalyses,
        recentReasoningSessions,
        studyHistory,
        userProfile
      ] = await Promise.all([
        this.getRecentImageAnalyses(userId, 10),
        this.getRecentReasoningSessions(userId, 10),
        this.getStudyHistory(userId, 30),
        this.getUserProfile(userId)
      ]);

      return {
        userId,
        recentImageAnalyses,
        recentReasoningSessions,
        studyHistory,
        currentGoals: userProfile?.goals || [],
        learningStyle: userProfile?.learning_style || 'visual',
        performancePatterns: userProfile?.performance_patterns || {}
      };

    } catch (error) {
      console.error('Error getting user context:', error);
      throw new Error(`Failed to get user context: ${error.message}`);
    }
  }

  // Store image analysis result
  async storeImageAnalysis(result: ImageAnalysisResult): Promise<void> {
    try {
      const record: Partial<MistralDatabaseRecord> = {
        id: result.id,
        user_id: result.metadata.userId,
        type: 'image_analysis',
        result_data: result.analysis,
        confidence_score: result.confidence,
        processing_time: result.processingTime,
        analysis_type: result.metadata.analysisType,
        created_at: result.metadata.timestamp,
        metadata: {
          imageSize: result.metadata.imageSize,
          keyTopics: result.analysis.keyTopics,
          studyRecommendationsCount: result.analysis.studyRecommendations.length,
          conceptsIdentifiedCount: result.analysis.conceptsIdentified.length
        }
      };

      const { error } = await supabase
        .from('mistral_analyses')
        .insert(record);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

    } catch (error) {
      console.error('Error storing image analysis:', error);
      throw new Error(`Failed to store image analysis: ${error.message}`);
    }
  }

  // Store complex reasoning result
  async storeComplexReasoning(result: ComplexReasoningResult): Promise<void> {
    try {
      const record: Partial<MistralDatabaseRecord> = {
        id: result.id,
        user_id: result.metadata.userId,
        type: 'complex_reasoning',
        result_data: result.reasoning,
        confidence_score: result.confidence,
        processing_time: result.processingTime,
        reasoning_type: result.metadata.reasoningType,
        complexity_level: result.metadata.complexity,
        created_at: result.metadata.timestamp,
        metadata: {
          stepsCount: result.reasoning.steps.length,
          conceptsExplained: result.reasoning.conceptExplanations.length,
          followUpQuestionsCount: result.reasoning.followUpQuestions.length,
          hasConclusion: !!result.reasoning.conclusion
        }
      };

      const { error } = await supabase
        .from('mistral_analyses')
        .insert(record);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

    } catch (error) {
      console.error('Error storing complex reasoning:', error);
      throw new Error(`Failed to store complex reasoning: ${error.message}`);
    }
  }

  // Get recent image analyses for user
  async getRecentImageAnalyses(userId: string, limit: number = 10): Promise<ImageAnalysisResult[]> {
    try {
      const { data, error } = await supabase
        .from('mistral_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'image_analysis')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data.map(record => ({
        id: record.id,
        analysis: record.result_data,
        confidence: record.confidence_score,
        processingTime: record.processing_time,
        metadata: {
          ...record.metadata,
          analysisType: record.analysis_type,
          userId: record.user_id,
          timestamp: record.created_at
        }
      }));

    } catch (error) {
      console.error('Error getting recent image analyses:', error);
      throw new Error(`Failed to get recent image analyses: ${error.message}`);
    }
  }

  // Get recent reasoning sessions for user
  async getRecentReasoningSessions(userId: string, limit: number = 10): Promise<ComplexReasoningResult[]> {
    try {
      const { data, error } = await supabase
        .from('mistral_analyses')
        .select('*')
        .eq('user_id', userId)
        .eq('type', 'complex_reasoning')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data.map(record => ({
        id: record.id,
        reasoning: record.result_data,
        confidence: record.confidence_score,
        processingTime: record.processing_time,
        metadata: {
          ...record.metadata,
          reasoningType: record.reasoning_type,
          complexity: record.complexity_level,
          userId: record.user_id,
          timestamp: record.created_at
        }
      }));

    } catch (error) {
      console.error('Error getting recent reasoning sessions:', error);
      throw new Error(`Failed to get recent reasoning sessions: ${error.message}`);
    }
  }

  // Get user's study history
  async getStudyHistory(userId: string, days: number = 30): Promise<any[]> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', cutoffDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      return data || [];

    } catch (error) {
      console.error('Error getting study history:', error);
      throw new Error(`Failed to get study history: ${error.message}`);
    }
  }

  // Get user profile
  async getUserProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" which is acceptable
        throw new Error(`Database error: ${error.message}`);
      }

      return data;

    } catch (error) {
      console.error('Error getting user profile:', error);
      throw new Error(`Failed to get user profile: ${error.message}`);
    }
  }

  // Get analytics for user
  async getUserAnalytics(userId: string): Promise<MistralAnalytics> {
    try {
      // Get all user Mistral analyses
      const { data: analyses, error } = await supabase
        .from('mistral_analyses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      const imageAnalyses = analyses.filter(a => a.type === 'image_analysis');
      const reasoningSessions = analyses.filter(a => a.type === 'complex_reasoning');

      // Calculate analytics
      const totalAnalyses = imageAnalyses.length;
      const totalReasoningSessions = reasoningSessions.length;
      const averageConfidence = analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + a.confidence_score, 0) / analyses.length 
        : 0;
      const averageProcessingTime = analyses.length > 0 
        ? analyses.reduce((sum, a) => sum + a.processing_time, 0) / analyses.length 
        : 0;

      // Popular analysis types
      const analysisTypeCounts: Record<string, number> = {};
      imageAnalyses.forEach(a => {
        if (a.analysis_type) {
          analysisTypeCounts[a.analysis_type] = (analysisTypeCounts[a.analysis_type] || 0) + 1;
        }
      });
      const popularAnalysisTypes = Object.entries(analysisTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Popular reasoning types
      const reasoningTypeCounts: Record<string, number> = {};
      reasoningSessions.forEach(a => {
        if (a.reasoning_type) {
          reasoningTypeCounts[a.reasoning_type] = (reasoningTypeCounts[a.reasoning_type] || 0) + 1;
        }
      });
      const popularReasoningTypes = Object.entries(reasoningTypeCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count);

      // Recent activity (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const recentActivity = analyses
        .filter(a => new Date(a.created_at) > weekAgo)
        .map(a => ({
          type: a.type,
          timestamp: a.created_at,
          confidence: a.confidence_score
        }))
        .slice(0, 20);

      // Performance trends (simplified)
      const recentAnalyses = analyses.slice(0, 10);
      const olderAnalyses = analyses.slice(10, 20);
      const recentAvgConfidence = recentAnalyses.length > 0 
        ? recentAnalyses.reduce((sum, a) => sum + a.confidence_score, 0) / recentAnalyses.length 
        : 0;
      const olderAvgConfidence = olderAnalyses.length > 0 
        ? olderAnalyses.reduce((sum, a) => sum + a.confidence_score, 0) / olderAnalyses.length 
        : 0;

      return {
        totalAnalyses,
        totalReasoningSessions,
        averageConfidence,
        averageProcessingTime,
        popularAnalysisTypes,
        popularReasoningTypes,
        recentActivity,
        performanceTrends: {
          confidenceImprovement: recentAvgConfidence - olderAvgConfidence,
          processingTimeEfficiency: 0 // Would calculate based on trend data
        }
      };

    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw new Error(`Failed to get user analytics: ${error.message}`);
    }
  }

  // Generate comprehensive Mistral suggestions based on user context
  async generateContextualMistralSuggestions(userId: string, focusArea?: string): Promise<any[]> {
    try {
      const context = await this.getUserContext(userId);
      const analytics = await this.getUserAnalytics(userId);
      const suggestions = [];

      // Analyze patterns and generate suggestions
      if (context.recentImageAnalyses.length === 0) {
        suggestions.push({
          type: 'recommendation',
          title: 'Start Analyzing Your Study Materials',
          description: 'Upload your handwritten notes, diagrams, or equations to get AI-powered insights and study recommendations.',
          priority: 'high',
          estimatedImpact: 9,
          reasoning: 'No image analyses found - user could benefit from visual learning assistance',
          actionableSteps: [
            'Take photos of your handwritten notes',
            'Upload diagrams or charts you\'re studying',
            'Try analyzing practice problems with equations',
            'Review the AI-generated study recommendations'
          ]
        });
      }

      // Suggest complex reasoning for difficult topics
      const lowConfidenceAnalyses = context.recentImageAnalyses.filter(a => a.confidence < 0.7);
      if (lowConfidenceAnalyses.length > 0) {
        suggestions.push({
          type: 'analysis',
          title: 'Deep Dive into Complex Topics',
          description: 'Some of your study materials showed complex concepts that could benefit from step-by-step reasoning breakdown.',
          priority: 'medium',
          estimatedImpact: 8,
          reasoning: `${lowConfidenceAnalyses.length} recent analyses had low confidence scores`,
          actionableSteps: [
            'Use complex reasoning for difficult topics from your notes',
            'Ask for step-by-step explanations of confusing concepts',
            'Request conceptual breakdowns of complex problems',
            'Practice with the generated study paths'
          ]
        });
      }

      // Suggest based on popular analysis types
      if (analytics.popularAnalysisTypes.length > 0) {
        const topType = analytics.popularAnalysisTypes[0];
        suggestions.push({
          type: 'topic',
          title: `Focus on ${topType.type.replace('_', ' ')} Analysis`,
          description: `You've been using ${topType.type} analysis frequently. Consider deepening your practice in this area.`,
          priority: 'low',
          estimatedImpact: 6,
          reasoning: `Most used analysis type: ${topType.type} (${topType.count} times)`,
          actionableSteps: [
            `Continue using ${topType.type} analysis for similar materials`,
            'Explore variations of this analysis type',
            'Combine with other AI features for comprehensive study',
            'Track improvement in understanding over time'
          ]
        });
      }

      return suggestions;

    } catch (error) {
      console.error('Error generating contextual Mistral suggestions:', error);
      throw new Error(`Failed to generate contextual suggestions: ${error.message}`);
    }
  }

  // Clean up old analyses (for data retention)
  async cleanupOldAnalyses(userId: string, daysToKeep: number = 90): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('mistral_analyses')
        .delete()
        .eq('user_id', userId)
        .lt('created_at', cutoffDate.toISOString());

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

    } catch (error) {
      console.error('Error cleaning up old analyses:', error);
      throw new Error(`Failed to cleanup old analyses: ${error.message}`);
    }
  }
}

// Singleton instance
let mistralDataServiceInstance: MistralDataService | null = null;

export function getMistralDataService(): MistralDataService {
  if (!mistralDataServiceInstance) {
    mistralDataServiceInstance = new MistralDataService();
  }
  return mistralDataServiceInstance;
}
