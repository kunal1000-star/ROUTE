// Advanced Analytics Data Service - Enhancement 4 Implementation
// Comprehensive analytics for admin and student dashboards

import { supabase } from '../supabase';
import { getSchedulingDataService } from './scheduling-suggestions';
import { getPredictionDataService } from './prediction-data-service';
import { getMotivationDataService } from './motivation-data-service';
import { getMistralDataService } from './mistral-data-service';
import { generateAllSuggestions } from './ai-suggestions';

export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: 'study_session' | 'ai_interaction' | 'question_answer' | 'goal_completion' | 'feature_usage';
  event_category: string;
  event_data: any;
  timestamp: string;
  session_id?: string;
  duration?: number;
  metadata?: any;
}

export interface UserAnalytics {
  userId: string;
  period: string; // daily, weekly, monthly
  
  // Study Performance
  totalStudyTime: number;
  studySessionsCount: number;
  averageSessionDuration: number;
  currentStreak: number;
  longestStreak: number;
  
  // Question Performance
  questionsSolved: number;
  questionsCorrect: number;
  accuracyRate: number;
  difficultyProgression: Array<{ date: string; difficulty: string; count: number }>;
  
  // AI Feature Usage
  suggestionsViewed: number;
  suggestionsAccepted: number;
  scheduleGenerations: number;
  predictionsGenerated: number;
  motivationTriggers: number;
  mistralAnalyses: number;
  
  // Subject Performance
  subjectStats: Array<{
    subject: string;
    timeSpent: number;
    questionsSolved: number;
    accuracyRate: number;
    topicsCovered: string[];
    improvementTrend: number;
  }>;
  
  // Learning Insights
  learningVelocity: number; // Topics mastered per week
  weakAreas: string[];
  strongAreas: string[];
  recommendedNextTopics: string[];
  
  // Goal Tracking
  goals: Array<{
    id: string;
    title: string;
    target: number;
    current: number;
    progress: number;
    deadline: string;
    status: 'active' | 'completed' | 'missed';
  }>;
  
  // Time-based patterns
  studyTimeByHour: Array<{ hour: number; minutes: number }>;
  studyTimeByDay: Array<{ day: string; minutes: number }>;
  weeklyTrend: Array<{ week: string; totalMinutes: number }>;
  
  // Engagement Metrics
  appUsageDays: number;
  featureAdoptionRate: number;
  engagementScore: number; // 0-100
  retentionRate: number;
}

export interface AdminAnalytics {
  // System-wide metrics
  totalUsers: number;
  activeUsers: number; // last 7 days
  newUsersToday: number;
  newUsersThisWeek: number;
  
  // Feature Adoption
  featureUsage: Array<{
    feature: string;
    usersCount: number;
    usageRate: number;
    engagement: number;
  }>;
  
  // Most Popular Content
  popularQuestions: Array<{
    question: string;
    frequency: number;
    difficulty: string;
    subject: string;
  }>;
  
  // Study Patterns
  peakUsageHours: Array<{ hour: number; userCount: number }>;
  weeklyEngagement: Array<{ day: string; activeUsers: number; sessions: number }>;
  
  // Performance Insights
  averageSessionDuration: number;
  averageQuestionsPerSession: number;
  overallAccuracyRate: number;
  
  // Educational Analytics
  subjectDistribution: Array<{ subject: string; users: number; percentage: number }>;
  difficultyProgression: Array<{ level: string; users: number; averageScore: number }>;
  
  // A/B Testing Results
  abTestResults: Array<{
    testName: string;
    variant: string;
    users: number;
    conversionRate: number;
    confidence: number;
  }>;
  
  // System Health
  apiResponseTime: number;
  errorRate: number;
  featureErrorRates: Array<{
    feature: string;
    errorRate: number;
    totalRequests: number;
  }>;
}

export class AnalyticsDataService {
  constructor() {
    // Initialize all AI data services
  }

  // ========================================
  // USER ANALYTICS
  // ========================================

  async getUserAnalytics(userId: string, period: 'daily' | 'weekly' | 'monthly' = 'weekly'): Promise<UserAnalytics> {
    try {
      const [studyData, aiUsageData, performanceData, goalData, patternsData] = await Promise.all([
        this.getStudyData(userId, period),
        this.getAIUsageData(userId, period),
        this.getPerformanceData(userId, period),
        this.getGoalData(userId),
        this.getStudyPatterns(userId, period)
      ]);

      return {
        userId,
        period,
        ...studyData,
        ...aiUsageData,
        ...performanceData,
        ...goalData,
        ...patternsData
      };

    } catch (error) {
      console.error('Error getting user analytics:', error);
      throw new Error(`Failed to get user analytics: ${error.message}`);
    }
  }

  private async getStudyData(userId: string, period: string) {
    // Get study sessions data
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', this.getPeriodStart(period))
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching study sessions: ${error.message}`);
    }

    const totalStudyTime = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    const studySessionsCount = sessions.length;
    const averageSessionDuration = studySessionsCount > 0 ? totalStudyTime / studySessionsCount : 0;
    
    // Calculate streaks
    const { currentStreak, longestStreak } = this.calculateStreaks(sessions);

    return {
      totalStudyTime,
      studySessionsCount,
      averageSessionDuration,
      currentStreak,
      longestStreak
    };
  }

  private async getAIUsageData(userId: string, period: string) {
    const periodStart = this.getPeriodStart(period);
    
    // Get AI feature usage from all systems
    const [suggestions, scheduling, predictions, motivation, mistral] = await Promise.all([
      this.getSuggestionUsage(userId, periodStart),
      this.getSchedulingUsage(userId, periodStart),
      this.getPredictionUsage(userId, periodStart),
      this.getMotivationUsage(userId, periodStart),
      this.getMistralUsage(userId, periodStart)
    ]);

    return {
      suggestionsViewed: suggestions.viewed,
      suggestionsAccepted: suggestions.accepted,
      scheduleGenerations: scheduling.generations,
      predictionsGenerated: predictions.generated,
      motivationTriggers: motivation.triggers,
      mistralAnalyses: mistral.analyses
    };
  }

  private async getPerformanceData(userId: string, period: string) {
    // Get question performance data
    const { data: questions, error } = await supabase
      .from('questions_attempted')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', this.getPeriodStart(period))
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching question data: ${error.message}`);
    }

    const questionsSolved = questions.length;
    const questionsCorrect = questions.filter(q => q.is_correct).length;
    const accuracyRate = questionsSolved > 0 ? (questionsCorrect / questionsSolved) * 100 : 0;
    
    // Difficulty progression over time
    const difficultyProgression = this.calculateDifficultyProgression(questions);
    
    // Subject performance breakdown
    const subjectStats = this.calculateSubjectStats(questions);

    return {
      questionsSolved,
      questionsCorrect,
      accuracyRate,
      difficultyProgression,
      subjectStats
    };
  }

  private async getGoalData(userId: string) {
    // Get user goals and progress
    const { data: goals, error } = await supabase
      .from('user_goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Error fetching goals: ${error.message}`);
    }

    const processedGoals = goals.map(goal => ({
      id: goal.id,
      title: goal.title,
      target: goal.target_value,
      current: goal.current_value,
      progress: goal.target_value > 0 ? (goal.current_value / goal.target_value) * 100 : 0,
      deadline: goal.deadline,
      status: this.determineGoalStatus(goal)
    }));

    // Calculate learning insights
    const { weakAreas, strongAreas, recommendedNextTopics } = this.generateLearningInsights(goals, questions);

    return {
      goals: processedGoals,
      learningVelocity: this.calculateLearningVelocity(goals),
      weakAreas,
      strongAreas,
      recommendedNextTopics
    };
  }

  private async getStudyPatterns(userId: string, period: string) {
    // Get detailed study time patterns
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('created_at, duration_minutes, start_time')
      .eq('user_id', userId)
      .gte('created_at', this.getPeriodStart(period))
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Error fetching study patterns: ${error.message}`);
    }

    const studyTimeByHour = this.calculateHourlyDistribution(sessions);
    const studyTimeByDay = this.calculateDailyDistribution(sessions);
    const weeklyTrend = this.calculateWeeklyTrend(sessions, period);
    const appUsageDays = this.calculateUniqueDays(sessions);

    return {
      studyTimeByHour,
      studyTimeByDay,
      weeklyTrend,
      appUsageDays,
      featureAdoptionRate: this.calculateFeatureAdoptionRate(userId),
      engagementScore: this.calculateEngagementScore(sessions, userId),
      retentionRate: this.calculateRetentionRate(userId)
    };
  }

  // ========================================
  // ADMIN ANALYTICS
  // ========================================

  async getAdminAnalytics(dateRange: { start: string; end: string }): Promise<AdminAnalytics> {
    try {
      const [userMetrics, featureUsage, popularContent, studyPatterns, systemHealth] = await Promise.all([
        this.getUserMetrics(dateRange),
        this.getFeatureUsage(dateRange),
        this.getPopularContent(dateRange),
        this.getStudyPatterns(dateRange),
        this.getSystemHealth(dateRange)
      ]);

      return {
        ...userMetrics,
        ...featureUsage,
        ...popularContent,
        ...studyPatterns,
        ...systemHealth
      };

    } catch (error) {
      console.error('Error getting admin analytics:', error);
      throw new Error(`Failed to get admin analytics: ${error.message}`);
    }
  }

  private async getUserMetrics(dateRange: { start: string; end: string }) {
    // Get user count metrics
    const { data: totalUsers, error: totalError } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact', head: true });

    const { data: activeUsers, error: activeError } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact', head: true })
      .gte('last_sign_in_at', this.getDaysAgo(7));

    if (totalError || activeError) {
      throw new Error('Error fetching user metrics');
    }

    return {
      totalUsers: totalUsers?.length || 0,
      activeUsers: activeUsers?.length || 0,
      newUsersToday: await this.getNewUsersCount('today'),
      newUsersThisWeek: await this.getNewUsersCount('week')
    };
  }

  private async getFeatureUsage(dateRange: { start: string; end: string }) {
    // Analyze feature usage across all users
    const { data: featureEvents, error } = await supabase
      .from('analytics_events')
      .select('event_category, user_id, created_at')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end)
      .in('event_type', ['ai_interaction', 'feature_usage']);

    if (error) {
      throw new Error('Error fetching feature usage data');
    }

    // Aggregate feature usage
    const featureStats = new Map<string, { users: Set<string>; count: number }>();
    
    featureEvents.forEach(event => {
      if (!featureStats.has(event.event_category)) {
        featureStats.set(event.event_category, { users: new Set(), count: 0 });
      }
      const stats = featureStats.get(event.event_category)!;
      stats.users.add(event.user_id);
      stats.count++;
    });

    // Get active user count outside the map to fix async issue
    const activeUserCount = await this.getActiveUserCount();
    
    const featureUsage = Array.from(featureStats.entries()).map(([feature, stats]) => ({
      feature,
      usersCount: stats.users.size,
      usageRate: activeUserCount > 0 ? (stats.users.size / activeUserCount) * 100 : 0,
      engagement: stats.count / stats.users.size
    }));

    return { featureUsage };
  }

  private async getPopularContent(dateRange: { start: string; end: string }) {
    // Get most popular questions and content
    const { data: questions, error } = await supabase
      .from('questions_attempted')
      .select('question_text, difficulty_level, subject, is_correct')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (error) {
      throw new Error('Error fetching popular content data');
    }

    // Aggregate question frequency
    const questionStats = new Map<string, { frequency: number; difficulty: string; subject: string; correct: number; total: number }>();
    
    questions.forEach(q => {
      const key = q.question_text;
      if (!questionStats.has(key)) {
        questionStats.set(key, { frequency: 0, difficulty: q.difficulty_level, subject: q.subject, correct: 0, total: 0 });
      }
      const stats = questionStats.get(key)!;
      stats.frequency++;
      stats.total++;
      if (q.is_correct) stats.correct++;
    });

    const popularQuestions = Array.from(questionStats.entries())
      .map(([question, stats]) => ({
        question,
        frequency: stats.frequency,
        difficulty: stats.difficulty,
        subject: stats.subject
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20);

    return { popularQuestions };
  }

  private async getStudyPatterns(dateRange: { start: string; end: string }) {
    // Get study pattern insights
    const { data: sessions, error } = await supabase
      .from('study_sessions')
      .select('created_at, duration_minutes, user_id, subject')
      .gte('created_at', dateRange.start)
      .lte('created_at', dateRange.end);

    if (error) {
      throw new Error('Error fetching study pattern data');
    }

    // Calculate peak usage hours
    const hourlyUsage = new Map<number, number>();
    const dailyEngagement = new Map<string, { users: Set<string>; sessions: number }>();
    
    sessions.forEach(session => {
      const hour = new Date(session.created_at).getHours();
      hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + 1);
      
      const day = new Date(session.created_at).toLocaleDateString('en-US', { weekday: 'long' });
      if (!dailyEngagement.has(day)) {
        dailyEngagement.set(day, { users: new Set(), sessions: 0 });
      }
      const engagement = dailyEngagement.get(day)!;
      engagement.users.add(session.user_id);
      engagement.sessions++;
    });

    const peakUsageHours = Array.from(hourlyUsage.entries())
      .map(([hour, count]) => ({ hour, userCount: count }))
      .sort((a, b) => b.userCount - a.userCount);

    const weeklyEngagement = Array.from(dailyEngagement.entries())
      .map(([day, data]) => ({ day, activeUsers: data.users.size, sessions: data.sessions }));

    return {
      peakUsageHours,
      weeklyEngagement,
      averageSessionDuration: sessions.reduce((sum, s) => sum + s.duration_minutes, 0) / sessions.length,
      averageQuestionsPerSession: sessions.length > 0 ? sessions.reduce((sum, s) => sum + (s.questions_count || 0), 0) / sessions.length : 0,
      overallAccuracyRate: 85.2 // Would calculate from questions data
    };
  }

  private async getSystemHealth(dateRange: { start: string; end: string }) {
    // Get system performance metrics
    // This would typically come from monitoring systems
    return {
      apiResponseTime: 145, // milliseconds
      errorRate: 0.02, // 2%
      featureErrorRates: [
        { feature: 'ai_suggestions', errorRate: 0.01, totalRequests: 1000 },
        { feature: 'scheduling', errorRate: 0.005, totalRequests: 500 },
        { feature: 'predictions', errorRate: 0.015, totalRequests: 800 }
      ]
    };
  }

  // ========================================
  // AI USAGE TRACKING
  // ========================================

  private async getSuggestionUsage(userId: string, periodStart: string) {
    const { data: suggestions, error } = await supabase
      .from('ai_suggestions')
      .select('user_id, created_at, suggestion_type, is_viewed, is_accepted')
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    if (error) return { viewed: 0, accepted: 0 };

    return {
      viewed: suggestions.filter(s => s.is_viewed).length,
      accepted: suggestions.filter(s => s.is_accepted).length
    };
  }

  private async getSchedulingUsage(userId: string, periodStart: string) {
    const { data: schedules, error } = await supabase
      .from('ai_suggestions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('suggestion_type', 'schedule')
      .gte('created_at', periodStart);

    if (error) return { generations: 0 };

    return { generations: schedules?.length || 0 };
  }

  private async getPredictionUsage(userId: string, periodStart: string) {
    const { data: predictions, error } = await supabase
      .from('ai_suggestions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('suggestion_type', 'prediction')
      .gte('created_at', periodStart);

    if (error) return { generated: 0 };

    return { generated: predictions?.length || 0 };
  }

  private async getMotivationUsage(userId: string, periodStart: string) {
    const { data: motivation, error } = await supabase
      .from('ai_suggestions')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .eq('suggestion_type', 'motivation')
      .gte('created_at', periodStart);

    if (error) return { triggers: 0 };

    return { triggers: motivation?.length || 0 };
  }

  private async getMistralUsage(userId: string, periodStart: string) {
    const { data: analyses, error } = await supabase
      .from('mistral_analyses')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', periodStart);

    if (error) return { analyses: 0 };

    return { analyses: analyses?.length || 0 };
  }

  // ========================================
  // HELPER METHODS
  // ========================================

  private getPeriodStart(period: string): string {
    const now = new Date();
    switch (period) {
      case 'daily':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      case 'weekly':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      case 'monthly':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      default:
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    }
  }

  private getDaysAgo(days: number): string {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  }

  private async getNewUsersCount(period: 'today' | 'week'): string {
    const startDate = period === 'today' ? this.getDaysAgo(1) : this.getDaysAgo(7);
    const { data, error } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact' })
      .gte('created_at', startDate);

    if (error) return '0';
    return data?.length.toString() || '0';
  }

  private async getActiveUserCount(): Promise<number> {
    const { data, error } = await supabase
      .from('auth.users')
      .select('id', { count: 'exact' })
      .gte('last_sign_in_at', this.getDaysAgo(7));

    if (error) return 0;
    return data?.length || 0;
  }

  private calculateStreaks(sessions: any[]): { currentStreak: number; longestStreak: number } {
    if (sessions.length === 0) return { currentStreak: 0, longestStreak: 0 };

    // Sort sessions by date
    const sortedSessions = sessions
      .map(s => new Date(s.created_at))
      .sort((a, b) => a.getTime() - b.getTime());

    // Get unique days
    const studyDays = [...new Set(sortedSessions.map(s => s.toDateString()))];
    
    // Calculate current streak
    let currentStreak = 0;
    const today = new Date();
    for (let i = 0; i < studyDays.length; i++) {
      const day = new Date(studyDays[studyDays.length - 1 - i]);
      const dayDiff = Math.floor((today.getTime() - day.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === i) {
        currentStreak++;
      } else {
        break;
      }
    }

    // Calculate longest streak (simplified)
    let longestStreak = 0;
    let tempStreak = 1;
    for (let i = 1; i < studyDays.length; i++) {
      const prevDay = new Date(studyDays[i - 1]);
      const currDay = new Date(studyDays[i]);
      const dayDiff = Math.floor((currDay.getTime() - prevDay.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dayDiff === 1) {
        tempStreak++;
      } else {
        longestStreak = Math.max(longestStreak, tempStreak);
        tempStreak = 1;
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { currentStreak, longestStreak };
  }

  private calculateDifficultyProgression(questions: any[]): Array<{ date: string; difficulty: string; count: number }> {
    // Group questions by date and difficulty
    const progression = new Map<string, Map<string, number>>();
    
    questions.forEach(q => {
      const date = new Date(q.created_at).toISOString().split('T')[0];
      if (!progression.has(date)) {
        progression.set(date, new Map());
      }
      const dayMap = progression.get(date)!;
      dayMap.set(q.difficulty_level, (dayMap.get(q.difficulty_level) || 0) + 1);
    });

    return Array.from(progression.entries())
      .map(([date, difficulties]) => ({
        date,
        difficulty: Array.from(difficulties.entries())
          .sort((a, b) => b[1] - a[1])[0][0],
        count: Array.from(difficulties.values()).reduce((sum, count) => sum + count, 0)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  private calculateSubjectStats(questions: any[]): Array<any> {
    const subjectData = new Map<string, { total: number; correct: number; timeSpent: number; topics: Set<string> }>();
    
    questions.forEach(q => {
      if (!subjectData.has(q.subject)) {
        subjectData.set(q.subject, { total: 0, correct: 0, timeSpent: 0, topics: new Set() });
      }
      const stats = subjectData.get(q.subject)!;
      stats.total++;
      if (q.is_correct) stats.correct++;
      stats.timeSpent += q.time_spent_seconds || 0;
      if (q.topic) stats.topics.add(q.topic);
    });

    return Array.from(subjectData.entries()).map(([subject, stats]) => ({
      subject,
      timeSpent: stats.timeSpent,
      questionsSolved: stats.total,
      accuracyRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
      topicsCovered: Array.from(stats.topics),
      improvementTrend: Math.random() * 20 - 10 // Would calculate actual trend
    }));
  }

  private calculateHourlyDistribution(sessions: any[]): Array<{ hour: number; minutes: number }> {
    const hourlyData = new Array(24).fill(0);
    
    sessions.forEach(session => {
      const hour = new Date(session.created_at).getHours();
      hourlyData[hour] += session.duration_minutes || 0;
    });

    return hourlyData.map((minutes, hour) => ({ hour, minutes }));
  }

  private calculateDailyDistribution(sessions: any[]): Array<{ day: string; minutes: number }> {
    const dailyData = new Map<string, number>();
    
    sessions.forEach(session => {
      const day = new Date(session.created_at).toLocaleDateString('en-US', { weekday: 'short' });
      dailyData.set(day, (dailyData.get(day) || 0) + (session.duration_minutes || 0));
    });

    return Array.from(dailyData.entries()).map(([day, minutes]) => ({ day, minutes }));
  }

  private calculateWeeklyTrend(sessions: any[], period: string): Array<{ week: string; totalMinutes: number }> {
    // Simplified weekly trend calculation
    const weeks = new Map<string, number>();
    
    sessions.forEach(session => {
      const week = this.getWeekKey(new Date(session.created_at));
      weeks.set(week, (weeks.get(week) || 0) + (session.duration_minutes || 0));
    });

    return Array.from(weeks.entries())
      .map(([week, totalMinutes]) => ({ week, totalMinutes }))
      .sort((a, b) => a.week.localeCompare(b.week));
  }

  private getWeekKey(date: Date): string {
    const year = date.getFullYear();
    const week = this.getWeekNumber(date);
    return `${year}-W${week.toString().padStart(2, '0')}`;
  }

  private getWeekNumber(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  }

  private calculateUniqueDays(sessions: any[]): number {
    const uniqueDays = new Set(sessions.map(s => new Date(s.created_at).toDateString()));
    return uniqueDays.size;
  }

  private calculateFeatureAdoptionRate(userId: string): number {
    // Simplified calculation - would be more complex in reality
    return 75; // Placeholder
  }

  private calculateEngagementScore(sessions: any[], userId: string): number {
    // Calculate engagement based on session frequency, duration, and consistency
    const totalTime = sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
    const sessionCount = sessions.length;
    const uniqueDays = this.calculateUniqueDays(sessions);
    
    // Weighted score (0-100)
    const timeScore = Math.min(totalTime / 60, 50); // Max 50 points for time
    const frequencyScore = Math.min(sessionCount * 2, 30); // Max 30 points for frequency
    const consistencyScore = Math.min(uniqueDays * 2, 20); // Max 20 points for consistency
    
    return Math.round(timeScore + frequencyScore + consistencyScore);
  }

  private calculateRetentionRate(userId: string): number {
    // Calculate user retention based on activity patterns
    return 82; // Placeholder - would calculate from historical data
  }

  private determineGoalStatus(goal: any): 'active' | 'completed' | 'missed' {
    if (goal.current_value >= goal.target_value) return 'completed';
    if (new Date(goal.deadline) < new Date()) return 'missed';
    return 'active';
  }

  private calculateLearningVelocity(goals: any[]): number {
    // Calculate how quickly user is mastering topics
    return 2.3; // Topics per week - placeholder
  }

  private generateLearningInsights(goals: any[], questions: any[]): {
    weakAreas: string[];
    strongAreas: string[];
    recommendedNextTopics: string[];
  } {
    // Analyze performance to identify weak/strong areas
    const subjectPerformance = new Map<string, { correct: number; total: number }>();
    
    questions.forEach(q => {
      if (!subjectPerformance.has(q.subject)) {
        subjectPerformance.set(q.subject, { correct: 0, total: 0 });
      }
      const stats = subjectPerformance.get(q.subject)!;
      stats.total++;
      if (q.is_correct) stats.correct++;
    });

    const performanceRates = Array.from(subjectPerformance.entries())
      .map(([subject, stats]) => ({
        subject,
        rate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      }))
      .sort((a, b) => a.rate - b.rate);

    const weakAreas = performanceRates.filter(p => p.rate < 60).map(p => p.subject);
    const strongAreas = performanceRates.filter(p => p.rate >= 80).map(p => p.subject);
    const recommendedNextTopics = ['Calculus', 'Organic Chemistry', 'Thermodynamics']; // Placeholder

    return { weakAreas, strongAreas, recommendedNextTopics };
  }

  // ========================================
  // ANALYTICS EVENT TRACKING
  // ========================================

  async trackAnalyticsEvent(event: Omit<AnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('analytics_events')
        .insert({
          ...event,
          id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString()
        });

      if (error) {
        throw new Error(`Error tracking analytics event: ${error.message}`);
      }

    } catch (error) {
      console.error('Failed to track analytics event:', error);
      // Don't throw - analytics tracking shouldn't break the main flow
    }
  }
}

// Singleton instance
let analyticsDataServiceInstance: AnalyticsDataService | null = null;

export function getAnalyticsDataService(): AnalyticsDataService {
  if (!analyticsDataServiceInstance) {
    analyticsDataServiceInstance = new AnalyticsDataService();
  }
  return analyticsDataServiceInstance;
}
