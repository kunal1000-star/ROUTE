import { createClient } from '@supabase/supabase-js';
import { supabaseBrowserClient } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

// Initialize server-side Supabase client
const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Type definitions for centralized AI data
export interface AIUserProfile {
  userId: string;
  basicInfo: {
    email: string;
    fullName: string | null;
    createdAt: string;
    lastActiveAt: string;
  };
  gamification: {
    currentStreak: number;
    longestStreak: number;
    currentLevel: number;
    totalPoints: number;
    badgesEarned: string[];
    totalTopicsCompleted: number;
  };
  subjects: {
    id: number;
    name: string;
    color: string;
    category: string;
    totalChapters: number;
    completedChapters: number;
    totalTopics: number;
    completedTopics: number;
    inProgressTopics: number;
  }[];
  recentActivity: {
    date: string;
    studyMinutes: number;
    blocksCompleted: number;
    topicsStudied: number;
    pointsEarned: number;
    pointsLost: number;
    highlights: string[];
    concerns: string[];
  }[];
  studyPatterns: {
    mostProductiveTime: string;
    favoriteSubject: string;
    averageSessionDuration: number;
    studyStreak: number;
  };
  revisionQueue: {
    overdueCount: number;
    dueTodayCount: number;
    highPriorityCount: number;
    topicsDue: {
      id: number;
      name: string;
      dueDate: string;
      priority: string;
      subject: string;
    }[];
  };
  performanceMetrics: {
    weeklyStudyHours: number;
    monthlyTopicsCompleted: number;
    questionAccuracy: number;
    studyConsistency: number;
  };
}

export interface AIContextOptions {
  includeDetailedPatterns?: boolean;
  includePersonalization?: boolean;
  timeRange?: 'today' | 'week' | 'month' | 'quarter';
  focusAreas?: string[];
}

/**
 * Unified Centralized AI Data Aggregation Service
 * Provides a single point of access for all AI-related data queries
 * Combines the best features from both server and browser implementations
 */
export class AICentralizedDataService {
  private static instance: AICentralizedDataService;
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private readonly DEFAULT_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): AICentralizedDataService {
    if (!AICentralizedDataService.instance) {
      AICentralizedDataService.instance = new AICentralizedDataService();
    }
    return AICentralizedDataService.instance;
  }

  private getCacheKey(userId: string, type: string, options?: AIContextOptions): string {
    return `${userId}:${type}:${JSON.stringify(options || {})}`;
  }

  private setCache(key: string, data: any, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_CACHE_TTL
    });
  }

  private getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Check if cache has valid data for a key (for performance monitoring)
   */
  checkCache(key: string): { exists: boolean; expired: boolean; data?: any } {
    const cached = this.cache.get(key);
    if (!cached) return { exists: false, expired: false };

    const expired = Date.now() - cached.timestamp > cached.ttl;
    if (expired) {
      this.cache.delete(key);
      return { exists: true, expired: true };
    }

    return { exists: true, expired: false, data: cached.data };
  }

  /**
   * Get comprehensive user profile for AI analysis
   */
  async getAIUserProfile(userId: string, options: AIContextOptions = {}): Promise<AIUserProfile | null> {
    const cacheKey = this.getCacheKey(userId, 'userProfile', options);
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      // Use browser client for better compatibility
      const supabaseClient = supabaseBrowserClient || supabaseServer;

      // Step 1: Get basic profile and gamification data
      const { data: profileData, error: profileError } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError || !profileData) {
        console.error('[AICentralizedDataService] Error fetching user profile:', profileError);
        return null;
      }

      // Step 2: Get gamification data
      const { data: gamificationData } = await supabaseClient
        .from('user_gamification')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Step 3: Get subjects with chapters and topics
      const { data: subjectsData } = await supabaseClient
        .from('subjects')
        .select(`
          id,
          name,
          color,
          category,
          chapters:chapters(
            id,
            name,
            topics:topics(
              id,
              name,
              status,
              difficulty
            )
          )
        `)
        .eq('user_id', userId);

      // Step 4: Get recent activity summaries
      const { data: dailySummaries } = await supabaseClient
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(7);

      // Process and structure the data with proper type casting
      const aiProfile: AIUserProfile = {
        userId,
        basicInfo: {
          email: (profileData as any)?.email || '',
          fullName: (profileData as any)?.full_name || null,
          createdAt: (profileData as any)?.created_at || '',
          lastActiveAt: (gamificationData as any)?.last_activity_date || (profileData as any)?.created_at || ''
        },
        gamification: {
          currentStreak: (gamificationData as any)?.current_streak || 0,
          longestStreak: (gamificationData as any)?.longest_streak || 0,
          currentLevel: (gamificationData as any)?.current_level || 1,
          totalPoints: (gamificationData as any)?.total_points_earned || 0,
          badgesEarned: Array.isArray((gamificationData as any)?.badges_earned) 
            ? (gamificationData as any).badges_earned as string[] 
            : [],
          totalTopicsCompleted: (gamificationData as any)?.total_topics_completed || 0
        },
        subjects: this.processSubjectsData((subjectsData as any[]) || []),
        recentActivity: this.processRecentActivity((dailySummaries as any[]) || []),
        studyPatterns: await this.getStudyPatterns(userId, options.timeRange || 'month'),
        revisionQueue: await this.getRevisionQueueData(userId),
        performanceMetrics: await this.getPerformanceMetrics(userId, options.timeRange || 'month')
      };

      this.setCache(cacheKey, aiProfile);
      return aiProfile;

    } catch (error) {
      console.error('[AICentralizedDataService] Error in getAIUserProfile:', error);
      return null;
    }
  }

  /**
   * Get daily context for AI with single query
   */
  async getDailyAIContext(userId: string, date: Date): Promise<any> {
    const cacheKey = this.getCacheKey(userId, 'dailyContext', { timeRange: 'today' });
    const cached = this.getCache(cacheKey);
    if (cached) return cached;

    try {
      const supabaseClient = supabaseBrowserClient || supabaseServer;
      const dateStr = date.toISOString().split('T')[0];
      
      const { data, error } = await supabaseClient
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('date', dateStr)
        .single();

      if (error || !data) {
        return {
          date: dateStr,
          studyTime: 0,
          blocksCompleted: 0,
          topicsStudied: 0,
          activities: [],
          highlights: [],
          concerns: []
        };
      }

      const dailyContext = {
        date: (data as any)?.date || '',
        studyTime: (data as any)?.total_study_minutes || 0,
        blocksCompleted: (data as any)?.blocks_completed_count || 0,
        currentStreak: (data as any)?.current_streak || 0,
        pointsEarned: (data as any)?.points_earned || 0,
        activities: [], // Would need separate query for activity logs
        highlights: Array.isArray((data as any)?.highlights) ? (data as any).highlights : [],
        concerns: Array.isArray((data as any)?.concerns) ? (data as any).concerns : []
      };

      this.setCache(cacheKey, dailyContext);
      return dailyContext;

    } catch (error) {
      console.error('[AICentralizedDataService] Error in getDailyAIContext:', error);
      return null;
    }
  }

  /**
   * Get study patterns analysis with optimized queries
   */
  async getStudyPatterns(userId: string, timeRange: string = 'month'): Promise<any> {
    try {
      const supabaseClient = supabaseBrowserClient || supabaseServer;
      const daysBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: blocks, error } = await supabaseClient
        .from('blocks')
        .select(`
          start_time,
          duration,
          subject:subjects(name),
          status
        `)
        .eq('user_id', userId)
        .gte('date', startDate.toISOString())
        .eq('status', 'completed');

      if (error || !blocks) {
        return {
          mostProductiveTime: 'Unknown',
          favoriteSubject: 'None',
          averageSessionDuration: 0,
          studyStreak: 0
        };
      }

      // Analyze patterns
      const timeOfDayCounts: Record<string, number> = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
      const subjectCounts: Record<string, number> = {};
      let totalDuration = 0;

      (blocks as any[]).forEach((block: any) => {
        const hour = parseInt(block.start_time.split(':')[0], 10);
        if (hour >= 6 && hour < 12) timeOfDayCounts['Morning']++;
        else if (hour >= 12 && hour < 17) timeOfDayCounts['Afternoon']++;
        else if (hour >= 17 && hour < 21) timeOfDayCounts['Evening']++;
        else timeOfDayCounts['Night']++;

        if (block.subject?.name) {
          subjectCounts[block.subject.name] = (subjectCounts[block.subject.name] || 0) + 1;
        }

        totalDuration += block.duration || 0;
      });

      return {
        mostProductiveTime: Object.entries(timeOfDayCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown',
        favoriteSubject: Object.entries(subjectCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None',
        averageSessionDuration: blocks.length > 0 ? Math.round(totalDuration / blocks.length) : 0,
        studyStreak: await this.calculateStudyStreak(userId)
      };

    } catch (error) {
      console.error('[AICentralizedDataService] Error in getStudyPatterns:', error);
      return null;
    }
  }

  /**
   * Get revision queue data with priority sorting
   */
  async getRevisionQueueData(userId: string): Promise<any> {
    try {
      const supabaseClient = supabaseBrowserClient || supabaseServer;
      const { data: revisionTopics, error } = await supabaseClient
        .from('revision_topics')
        .select(`
          *,
          topic:topics(
            name,
            chapter:chapters(
              subject:subjects(name)
            )
          )
        `)
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('priority', { ascending: false })
        .order('due_date', { ascending: true });

      if (error || !revisionTopics) {
        return {
          overdueCount: 0,
          dueTodayCount: 0,
          highPriorityCount: 0,
          topicsDue: []
        };
      }

      const today = new Date().toISOString().split('T')[0];
      const overdueCount = (revisionTopics as any[]).filter((rt: any) => rt.due_date < today).length;
      const dueTodayCount = (revisionTopics as any[]).filter((rt: any) => rt.due_date === today).length;
      const highPriorityCount = (revisionTopics as any[]).filter((rt: any) => rt.priority === 'high' || rt.priority === 'critical').length;

      return {
        overdueCount,
        dueTodayCount,
        highPriorityCount,
        topicsDue: (revisionTopics as any[]).slice(0, 10).map((rt: any) => ({
          id: rt.topic_id,
          name: rt.topic?.name || 'Unknown Topic',
          dueDate: rt.due_date,
          priority: rt.priority,
          subject: rt.topic?.chapter?.subject?.name || 'Unknown Subject'
        }))
      };

    } catch (error) {
      console.error('[AICentralizedDataService] Error in getRevisionQueueData:', error);
      return null;
    }
  }

  /**
   * Get performance metrics for AI analysis
   */
  async getPerformanceMetrics(userId: string, timeRange: string): Promise<any> {
    try {
      const supabaseClient = supabaseBrowserClient || supabaseServer;
      const daysBack = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      const { data: dailyData, error } = await supabaseClient
        .from('daily_activity_summary')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate.toISOString());

      if (error || !dailyData) {
        return {
          weeklyStudyHours: 0,
          monthlyTopicsCompleted: 0,
          questionAccuracy: 0,
          studyConsistency: 0
        };
      }

      const totalStudyMinutes = (dailyData as any[]).reduce((sum, day) => sum + ((day as any)?.total_study_minutes || 0), 0);
      const weeklyStudyHours = totalStudyMinutes / 60;
      const activeDays = (dailyData as any[]).filter(day => ((day as any)?.total_study_minutes || 0) > 0).length;
      const studyConsistency = dailyData.length > 0 ? (activeDays / dailyData.length) * 100 : 0;

      // Get topics completed in the period
      const { data: completedTopics, error: topicsError } = await supabaseClient
        .from('topics')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('updated_at', startDate.toISOString());

      return {
        weeklyStudyHours: Math.round(weeklyStudyHours * 10) / 10,
        monthlyTopicsCompleted: (completedTopics as any[])?.length || 0,
        questionAccuracy: 0, // Would need question attempt data
        studyConsistency: Math.round(studyConsistency)
      };

    } catch (error) {
      console.error('[AICentralizedDataService] Error in getPerformanceMetrics:', error);
      return null;
    }
  }

  // Helper methods
  private processSubjectsData(subjects: any[]): AIUserProfile['subjects'] {
    return subjects.map((subject: any) => {
      const totalChapters = subject.chapters?.length || 0;
      const completedChapters = subject.chapters?.filter((ch: any) => 
        ch.topics?.every((t: any) => t.status === 'completed')
      ).length || 0;
      
      const allTopics = subject.chapters?.flatMap((ch: any) => ch.topics || []) || [];
      const completedTopics = allTopics.filter((t: any) => t.status === 'completed').length;
      const inProgressTopics = allTopics.filter((t: any) => t.status === 'in_progress').length;

      return {
        id: subject.id,
        name: subject.name,
        color: subject.color,
        category: subject.category,
        totalChapters,
        completedChapters,
        totalTopics: allTopics.length,
        completedTopics,
        inProgressTopics
      };
    });
  }

  private processRecentActivity(summaries: any[]): AIUserProfile['recentActivity'] {
    return summaries
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 7)
      .map((summary: any) => ({
        date: summary.date,
        studyMinutes: summary.total_study_minutes || 0,
        blocksCompleted: summary.blocks_completed_count || 0,
        topicsStudied: summary.topics_studied_count || 0,
        pointsEarned: summary.points_earned || 0,
        pointsLost: summary.points_lost || 0,
        highlights: Array.isArray(summary.highlights) ? summary.highlights : [],
        concerns: Array.isArray(summary.concerns) ? summary.concerns : []
      }));
  }

  private async calculateStudyStreak(userId: string): Promise<number> {
    try {
      const supabaseClient = supabaseBrowserClient || supabaseServer;
      const { data: gamification } = await supabaseClient
        .from('user_gamification')
        .select('current_streak')
        .eq('user_id', userId)
        .single();

      return (gamification as any)?.current_streak || 0;
    } catch (error) {
      console.error('[AICentralizedDataService] Error calculating study streak:', error);
      return 0;
    }
  }

  /**
   * Invalidate cache for a user
   */
  invalidateUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(userId + ':')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { totalEntries: number; totalSize: number; hitRate: number } {
    const totalEntries = this.cache.size;
    const totalSize = Array.from(this.cache.values())
      .reduce((sum, entry) => sum + JSON.stringify(entry.data).length, 0);
    
    return {
      totalEntries,
      totalSize,
      hitRate: 85 // Placeholder - would need to track actual hits
    };
  }
}

// Export singleton instance
export const aiDataService = AICentralizedDataService.getInstance();

// Legacy exports for backward compatibility
export const getAIUserProfile = (userId: string, options?: AIContextOptions) => 
  aiDataService.getAIUserProfile(userId, options);

export const getDailyAIContext = (userId: string, date: Date) => 
  aiDataService.getDailyAIContext(userId, date);

export const getStudyPatterns = (userId: string, timeRange?: string) => 
  aiDataService.getStudyPatterns(userId, timeRange);

export const getRevisionQueueData = (userId: string) => 
  aiDataService.getRevisionQueueData(userId);

export const getPerformanceMetrics = (userId: string, timeRange: string) => 
  aiDataService.getPerformanceMetrics(userId, timeRange);

export const invalidateUserCache = (userId: string) => 
  aiDataService.invalidateUserCache(userId);

export const clearCache = () => 
  aiDataService.clearCache();