// Personalized Suggestions Engine
// ==============================

import { unifiedEmbeddingService } from './unified-embedding-service';
import { semanticSearch } from './semantic-search';
import { MemoryQueries } from '@/lib/database/queries';
import type { AIProvider } from '@/types/api-test';

export interface UserProfile {
  userId: string;
  studyPreferences: {
    preferredSubjects: string[];
    studyHours: number; // hours per day
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    peakHours: number[]; // array of hours (0-23) when user studies best
  };
  performance: {
    averageScore: number;
    improvementRate: number; // percentage
    weakSubjects: string[];
    strongSubjects: string[];
    recentPerformance: Array<{
      subject: string;
      score: number;
      date: string;
    }>;
  };
  behavior: {
    sessionDuration: number; // average session length in minutes
    breakFrequency: number; // breaks per hour
    engagementLevel: 'low' | 'medium' | 'high';
    lastActivity: string;
  };
}

export interface StudySuggestion {
  id: string;
  type: 'study_schedule' | 'content_review' | 'practice_test' | 'break_reminder' | 'resource_recommendation';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  subjects: string[];
  tags: string[];
  confidence: number; // 0-1
  reasoning: string;
  metadata: {
    basedOnPerformance: boolean;
    basedOnPatterns: boolean;
    basedOnHistory: boolean;
    similarUsersBenefited: number;
  };
  actions?: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
}

export interface SuggestionEngineConfig {
  maxSuggestions: number;
  includePersonalized: boolean;
  includePerformanceBased: boolean;
  includeBehavioral: boolean;
  confidenceThreshold: number;
  relevanceWeight: {
    performance: number;
    patterns: number;
    history: number;
    collaborative: number;
  };
}

export class PersonalizedSuggestionsEngine {
  private config: SuggestionEngineConfig;

  constructor(config?: Partial<SuggestionEngineConfig>) {
    this.config = {
      maxSuggestions: 10,
      includePersonalized: true,
      includePerformanceBased: true,
      includeBehavioral: true,
      confidenceThreshold: 0.3,
      relevanceWeight: {
        performance: 0.4,
        patterns: 0.3,
        history: 0.2,
        collaborative: 0.1
      },
      ...config
    };
  }

  /**
   * Generate personalized study suggestions for a user
   */
  async generateSuggestions(userId: string, options?: {
    context?: string;
    timeAvailable?: number; // minutes
    preferredSubjects?: string[];
    currentMood?: 'stressed' | 'confident' | 'tired' | 'energetic';
  }): Promise<StudySuggestion[]> {
    try {
      // Step 1: Build user profile
      const userProfile = await this.buildUserProfile(userId);
      
      // Step 2: Generate different types of suggestions
      const suggestions = await Promise.all([
        this.generatePerformanceBasedSuggestions(userProfile, options),
        this.generatePatternBasedSuggestions(userProfile, options),
        this.generateBehavioralSuggestions(userProfile, options),
        this.generateCollaborativeSuggestions(userProfile, options)
      ]);

      // Step 3: Combine and rank suggestions
      const allSuggestions = suggestions.flat();
      const rankedSuggestions = this.rankSuggestions(allSuggestions, userProfile, options);

      // Step 4: Filter by confidence and relevance
      const filteredSuggestions = rankedSuggestions.filter(
        suggestion => suggestion.confidence >= this.config.confidenceThreshold
      );

      return filteredSuggestions.slice(0, this.config.maxSuggestions);

    } catch (error) {
      console.error('Failed to generate suggestions:', error);
      throw new Error(`Suggestion generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Build comprehensive user profile from analytics and behavior data
   */
  private async buildUserProfile(userId: string): Promise<UserProfile> {
    try {
      // Get user's recent study patterns and performance
      const analytics = await this.getUserAnalytics(userId);
      const memoryPatterns = await this.getUserMemoryPatterns(userId);
      const performanceData = await this.getUserPerformance(userId);

      return {
        userId,
        studyPreferences: this.extractStudyPreferences(analytics, memoryPatterns),
        performance: this.extractPerformanceData(performanceData),
        behavior: this.extractBehaviorPatterns(analytics)
      };

    } catch (error) {
      console.error('Failed to build user profile:', error);
      // Return minimal profile with defaults
      return {
        userId,
        studyPreferences: {
          preferredSubjects: [],
          studyHours: 2,
          difficultyLevel: 'intermediate',
          learningStyle: 'mixed',
          peakHours: [14, 15, 16] // Default afternoon
        },
        performance: {
          averageScore: 75,
          improvementRate: 5,
          weakSubjects: [],
          strongSubjects: [],
          recentPerformance: []
        },
        behavior: {
          sessionDuration: 45,
          breakFrequency: 2,
          engagementLevel: 'medium',
          lastActivity: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Generate suggestions based on user's performance data
   */
  private async generatePerformanceBasedSuggestions(
    profile: UserProfile, 
    options?: any
  ): Promise<StudySuggestion[]> {
    const suggestions: StudySuggestion[] = [];

    // Weak subject recommendations
    for (const subject of profile.performance.weakSubjects) {
      suggestions.push({
        id: `perf-weak-${subject}`,
        type: 'content_review',
        title: `Focus on ${subject}`,
        description: `Your performance in ${subject} could use improvement. Let's review key concepts and practice problems.`,
        priority: 'high',
        estimatedDuration: 60,
        difficulty: this.mapDifficultyLevel(profile.studyPreferences.difficultyLevel),
        subjects: [subject],
        tags: ['performance', 'weak-subject', 'review'],
        confidence: 0.85,
        reasoning: `Based on your recent performance data showing challenges in ${subject}`,
        metadata: {
          basedOnPerformance: true,
          basedOnPatterns: false,
          basedOnHistory: true,
          similarUsersBenefited: 78
        }
      });
    }

    // Strength building suggestions
    for (const subject of profile.performance.strongSubjects) {
      suggestions.push({
        id: `perf-strong-${subject}`,
        type: 'practice_test',
        title: `Master ${subject} Advanced Topics`,
        description: `You've shown strong performance in ${subject}. Challenge yourself with advanced concepts.`,
        priority: 'medium',
        estimatedDuration: 45,
        difficulty: 'hard',
        subjects: [subject],
        tags: ['performance', 'strong-subject', 'advanced'],
        confidence: 0.75,
        reasoning: `Building on your strong foundation in ${subject}`,
        metadata: {
          basedOnPerformance: true,
          basedOnPatterns: false,
          basedOnHistory: true,
          similarUsersBenefited: 65
        }
      });
    }

    // Improvement rate suggestions
    if (profile.performance.improvementRate < 0) {
      suggestions.push({
        id: 'perf-decline',
        type: 'study_schedule',
        title: 'Revise Your Study Strategy',
        description: 'Your performance has been declining. Consider adjusting your study approach and seeking help.',
        priority: 'urgent',
        estimatedDuration: 30,
        difficulty: 'medium',
        subjects: profile.performance.weakSubjects,
        tags: ['performance', 'strategy', 'help'],
        confidence: 0.9,
        reasoning: 'Performance decline detected in recent sessions',
        metadata: {
          basedOnPerformance: true,
          basedOnPatterns: true,
          basedOnHistory: true,
          similarUsersBenefited: 82
        },
        actions: [
          {
            label: 'Schedule Tutoring Session',
            action: 'book_tutor',
            url: '/tutoring'
          }
        ]
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on user's learning patterns and habits
   */
  private async generatePatternBasedSuggestions(
    profile: UserProfile,
    options?: any
  ): Promise<StudySuggestion[]> {
    const suggestions: StudySuggestion[] = [];
    const currentHour = new Date().getHours();

    // Time-based suggestions
    const isPeakHour = profile.studyPreferences.peakHours.includes(currentHour);
    
    if (isPeakHour) {
      suggestions.push({
        id: 'pattern-peak',
        type: 'study_schedule',
        title: 'Perfect Time for Deep Learning',
        description: `It's your peak learning hour (${currentHour}:00). Focus on challenging subjects now.`,
        priority: 'high',
        estimatedDuration: 90,
        difficulty: 'hard',
        subjects: profile.studyPreferences.preferredSubjects,
        tags: ['timing', 'peak-hours', 'deep-learning'],
        confidence: 0.8,
        reasoning: 'Current time aligns with your peak learning hours',
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: true,
          basedOnHistory: true,
          similarUsersBenefited: 71
        }
      });
    }

    // Break reminders based on session duration
    if (profile.behavior.sessionDuration > 90) {
      suggestions.push({
        id: 'pattern-break',
        type: 'break_reminder',
        title: 'Take a Well-Deserved Break',
        description: `You've been studying for ${profile.behavior.sessionDuration} minutes. A short break will help maintain focus.`,
        priority: 'medium',
        estimatedDuration: 15,
        difficulty: 'easy',
        subjects: [],
        tags: ['break', 'productivity', 'health'],
        confidence: 0.9,
        reasoning: 'Extended study session detected',
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: true,
          basedOnHistory: true,
          similarUsersBenefited: 89
        },
        actions: [
          {
            label: 'Start 15-min Break',
            action: 'start_break'
          }
        ]
      });
    }

    // Learning style recommendations
    const styleSuggestions = this.getLearningStyleSuggestions(profile.studyPreferences.learningStyle);
    suggestions.push(...styleSuggestions);

    return suggestions;
  }

  /**
   * Generate suggestions based on user's behavior and engagement patterns
   */
  private async generateBehavioralSuggestions(
    profile: UserProfile,
    options?: any
  ): Promise<StudySuggestion[]> {
    const suggestions: StudySuggestion[] = [];

    // Engagement level based suggestions
    if (profile.behavior.engagementLevel === 'low') {
      suggestions.push({
        id: 'behavior-engagement',
        type: 'resource_recommendation',
        title: 'Try Interactive Learning Materials',
        description: 'To boost your engagement, try interactive study materials and gamified learning.',
        priority: 'medium',
        estimatedDuration: 20,
        difficulty: 'easy',
        subjects: profile.studyPreferences.preferredSubjects,
        tags: ['engagement', 'interactive', 'gamification'],
        confidence: 0.7,
        reasoning: 'Low engagement levels detected',
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: true,
          basedOnHistory: false,
          similarUsersBenefited: 74
        },
        actions: [
          {
            label: 'Browse Interactive Resources',
            action: 'browse_resources'
          }
        ]
      });
    }

    // Frequency-based suggestions
    if (profile.behavior.breakFrequency < 1) {
      suggestions.push({
        id: 'behavior-breaks',
        type: 'break_reminder',
        title: 'Regular Breaks Improve Learning',
        description: 'Taking regular breaks can improve retention and prevent burnout.',
        priority: 'medium',
        estimatedDuration: 5,
        difficulty: 'easy',
        subjects: [],
        tags: ['breaks', 'productivity', 'health'],
        confidence: 0.8,
        reasoning: 'Low break frequency detected',
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: true,
          basedOnHistory: true,
          similarUsersBenefited: 76
        }
      });
    }

    return suggestions;
  }

  /**
   * Generate suggestions based on collaborative filtering (similar users)
   */
  private async generateCollaborativeSuggestions(
    profile: UserProfile,
    options?: any
  ): Promise<StudySuggestion[]> {
    const suggestions: StudySuggestion[] = [];

    // Find similar users and their successful study patterns
    const similarUsersPatterns = await this.findSimilarUsersPatterns(profile);
    
    for (const pattern of similarUsersPatterns) {
      suggestions.push({
        id: `collab-${pattern.id}`,
        type: pattern.type,
        title: pattern.title,
        description: pattern.description,
        priority: pattern.priority,
        estimatedDuration: pattern.estimatedDuration,
        difficulty: pattern.difficulty,
        subjects: pattern.subjects,
        tags: ['collaborative', ...pattern.tags],
        confidence: pattern.confidence,
        reasoning: pattern.reasoning,
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: false,
          basedOnHistory: false,
          basedOnCollaborative: true,
          similarUsersBenefited: pattern.similarUsersBenefited
        }
      });
    }

    return suggestions;
  }

  /**
   * Rank suggestions based on user profile and context
   */
  private rankSuggestions(
    suggestions: StudySuggestion[], 
    profile: UserProfile,
    options?: any
  ): StudySuggestion[] {
    return suggestions.map(suggestion => {
      let score = suggestion.confidence;

      // Boost score based on subject relevance
      if (options?.preferredSubjects) {
        const subjectMatch = suggestion.subjects.some(subject => 
          options.preferredSubjects.includes(subject)
        );
        if (subjectMatch) score *= 1.2;
      }

      // Boost score based on time availability
      if (options?.timeAvailable) {
        const timeRatio = options.timeAvailable / suggestion.estimatedDuration;
        if (timeRatio >= 1) {
          score *= 1.1;
        } else if (timeRatio >= 0.5) {
          score *= 0.9;
        }
      }

      // Boost score based on user mood
      if (options?.currentMood) {
        const moodBoost = this.getMoodBoost(options.currentMood, suggestion.type);
        score *= moodBoost;
      }

      // Priority adjustments
      const priorityBoost = {
        urgent: 1.3,
        high: 1.2,
        medium: 1.0,
        low: 0.8
      }[suggestion.priority] || 1.0;

      score *= priorityBoost;

      return {
        ...suggestion,
        confidence: Math.min(score, 1.0) // Cap at 1.0
      };
    }).sort((a, b) => b.confidence - a.confidence);
  }

  // Helper methods

  private async getUserAnalytics(userId: string): Promise<any> {
    // This would integrate with your analytics_events table
    // For now, return mock data
    return {
      studyHours: 2.5,
      sessionCount: 12,
      averageSessionDuration: 45,
      subjectsStudied: ['mathematics', 'physics', 'chemistry'],
      peakHours: [14, 15, 16]
    };
  }

  private async getUserMemoryPatterns(userId: string): Promise<any> {
    // This would use semantic search to find similar study patterns
    return {
      commonTopics: ['calculus', 'thermodynamics', 'organic chemistry'],
      difficultyProgression: 'steady',
      retentionRate: 0.78
    };
  }

  private async getUserPerformance(userId: string): Promise<any> {
    // This would integrate with your performance metrics
    return {
      averageScore: 78,
      improvementRate: 8.5,
      weakSubjects: ['organic chemistry'],
      strongSubjects: ['calculus'],
      recentScores: [
        { subject: 'mathematics', score: 85, date: '2025-11-01' },
        { subject: 'physics', score: 82, date: '2025-11-02' },
        { subject: 'organic chemistry', score: 68, date: '2025-11-03' }
      ]
    };
  }

  private extractStudyPreferences(analytics: any, patterns: any): UserProfile['studyPreferences'] {
    return {
      preferredSubjects: analytics.subjectsStudied || [],
      studyHours: analytics.studyHours || 2,
      difficultyLevel: 'intermediate',
      learningStyle: 'mixed',
      peakHours: analytics.peakHours || [14, 15, 16]
    };
  }

  private extractPerformanceData(performance: any): UserProfile['performance'] {
    return {
      averageScore: performance.averageScore || 75,
      improvementRate: performance.improvementRate || 5,
      weakSubjects: performance.weakSubjects || [],
      strongSubjects: performance.strongSubjects || [],
      recentPerformance: performance.recentScores || []
    };
  }

  private extractBehaviorPatterns(analytics: any): UserProfile['behavior'] {
    return {
      sessionDuration: analytics.averageSessionDuration || 45,
      breakFrequency: 2,
      engagementLevel: 'medium',
      lastActivity: new Date().toISOString()
    };
  }

  private mapDifficultyLevel(level: string): 'easy' | 'medium' | 'hard' {
    const mapping = {
      'beginner': 'easy',
      'intermediate': 'medium',
      'advanced': 'hard'
    };
    return mapping[level] || 'medium';
  }

  private getLearningStyleSuggestions(style: string): StudySuggestion[] {
    const suggestions = {
      visual: [{
        id: 'style-visual',
        type: 'resource_recommendation',
        title: 'Visual Learning Resources',
        description: 'Try diagrams, charts, and video tutorials for better understanding.',
        priority: 'medium',
        estimatedDuration: 15,
        difficulty: 'easy',
        subjects: [],
        tags: ['learning-style', 'visual'],
        confidence: 0.8,
        reasoning: 'Based on your visual learning preference',
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: true,
          basedOnHistory: false,
          similarUsersBenefited: 83
        }
      }],
      auditory: [{
        id: 'style-auditory',
        type: 'resource_recommendation',
        title: 'Audio Learning Materials',
        description: 'Listen to recorded lectures and discussion-based content.',
        priority: 'medium',
        estimatedDuration: 15,
        difficulty: 'easy',
        subjects: [],
        tags: ['learning-style', 'auditory'],
        confidence: 0.8,
        reasoning: 'Based on your auditory learning preference',
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: true,
          basedOnHistory: false,
          similarUsersBenefited: 79
        }
      }],
      kinesthetic: [{
        id: 'style-kinesthetic',
        type: 'resource_recommendation',
        title: 'Hands-on Learning Activities',
        description: 'Engage with interactive simulations and practical exercises.',
        priority: 'medium',
        estimatedDuration: 20,
        difficulty: 'medium',
        subjects: [],
        tags: ['learning-style', 'kinesthetic'],
        confidence: 0.8,
        reasoning: 'Based on your kinesthetic learning preference',
        metadata: {
          basedOnPerformance: false,
          basedOnPatterns: true,
          basedOnHistory: false,
          similarUsersBenefited: 81
        }
      }],
      mixed: []
    };

    return suggestions[style] || suggestions.mixed;
  }

  private getMoodBoost(mood: string, suggestionType: string): number {
    const moodBoosts = {
      stressed: {
        'break_reminder': 1.5,
        'content_review': 0.7,
        'practice_test': 0.6
      },
      confident: {
        'practice_test': 1.3,
        'content_review': 1.1,
        'break_reminder': 0.8
      },
      tired: {
        'break_reminder': 1.4,
        'content_review': 0.9,
        'practice_test': 0.7
      },
      energetic: {
        'practice_test': 1.2,
        'content_review': 1.1,
        'break_reminder': 0.8
      }
    };

    return moodBoosts[mood]?.[suggestionType] || 1.0;
  }

  private async findSimilarUsersPatterns(profile: UserProfile): Promise<any[]> {
    // This would use embeddings to find similar users
    // For now, return sample collaborative suggestions
    return [
      {
        id: 'collab-1',
        type: 'study_schedule',
        title: 'Try the Pomodoro Technique',
        description: 'Many students with similar profiles benefit from 25-minute focused study sessions.',
        priority: 'medium',
        estimatedDuration: 30,
        difficulty: 'easy',
        subjects: [],
        tags: ['technique', 'focus'],
        confidence: 0.7,
        reasoning: 'Popular among users with similar study patterns',
        similarUsersBenefited: 72
      }
    ];
  }
}

// Export singleton instance
export const personalizedSuggestionsEngine = new PersonalizedSuggestionsEngine();

// Convenience functions
export const generatePersonalizedSuggestions = (userId: string, options?: any) =>
  personalizedSuggestionsEngine.generateSuggestions(userId, options);
