// AI Prediction Data Service - Enhancement 2C Implementation
// Features 13-17: Data collection and analysis for AI predictions

import { createClient } from '@supabase/supabase-js';
import type { StudentProfile } from './ai-suggestions';
import type { StudentPerformanceData } from './prediction-engine';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface HistoricalBlockData {
  id: string;
  title: string;
  subject: string;
  chapter: string;
  status: 'pending' | 'in_progress' | 'completed' | 'missed';
  scheduled_date: string;
  completed_at?: string;
  duration_planned: number;
  duration_actual?: number;
  difficulty_level: number; // 1-5 scale
  performance_score?: number; // 0-1 scale
  interruptions: number;
  energy_level_before?: number; // 1-5 scale
  energy_level_after?: number; // 1-5 scale
  notes?: string;
}

export interface SessionData {
  id: string;
  block_id: string;
  subject: string;
  session_type: 'pomodoro' | 'spare' | 'intensive' | 'review';
  planned_duration: number;
  actual_duration: number;
  start_time: string;
  end_time: string;
  completion_status: 'complete' | 'partial' | 'abandoned';
  performance_rating: number; // 1-5 scale
  difficulty_actual: number; // 1-5 scale
  notes: string;
  interruptions: number;
}

// Get comprehensive student performance data for AI predictions
export async function getUserPredictionData(userId: string): Promise<StudentPerformanceData> {
  const [
    studentProfile,
    historicalBlocks,
    sessions,
    performanceHistory
  ] = await Promise.all([
    getStudentProfile(userId),
    getHistoricalBlockData(userId, 30), // Last 30 days
    getSessionData(userId, 30), // Last 30 days
    getPerformanceHistory(userId, 30) // Last 30 days
  ]);

  // Analyze performance patterns
  const subjectPerformance = analyzeSubjectPerformance(historicalBlocks, sessions, performanceHistory);
  const learningVelocity = calculateLearningVelocity(sessions);
  const historicalPatterns = analyzeHistoricalPatterns(historicalBlocks, sessions);

  return {
    userId,
    subjectPerformance,
    learningVelocity,
    historicalPatterns
  };
}

// Helper function to get student profile
async function getStudentProfile(userId: string): Promise<StudentProfile> {
  const { data: profile, error } = await supabase
    .from('student_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') { // Not found error
    console.error('Error fetching student profile:', error);
    throw new Error(`Failed to fetch student profile: ${error.message}`);
  }

  if (!profile) {
    // Return default profile structure
    return {
      userId,
      performanceData: {
        subjectScores: {},
        weakAreas: [],
        strongAreas: [],
        recentActivities: [],
        studyTime: 120,
        learningStyle: 'visual',
        examTarget: 'JEE 2025',
        currentProgress: {}
      },
      historicalData: {
        improvementTrends: {},
        struggleTopics: [],
        successPatterns: [],
        timeSpentBySubject: {}
      }
    };
  }

  return {
    userId,
    performanceData: profile.performance_data || {},
    historicalData: profile.historical_data || {}
  };
}

// Get historical block data for analysis
async function getHistoricalBlockData(userId: string, daysBack: number): Promise<HistoricalBlockData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('blocks')
    .select(`
      id,
      title,
      subject,
      chapter,
      status,
      scheduled_date,
      completed_at,
      duration_planned,
      duration_actual,
      difficulty_level,
      performance_score,
      interruptions,
      energy_level_before,
      energy_level_after,
      notes
    `)
    .eq('user_id', userId)
    .gte('scheduled_date', cutoffDate.toISOString())
    .order('scheduled_date', { ascending: false });

  if (error) {
    console.error('Error fetching historical blocks:', error);
    throw new Error(`Failed to fetch historical blocks: ${error.message}`);
  }

  return data || [];
}

// Get session data for analysis
async function getSessionData(userId: string, daysBack: number): Promise<SessionData[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  const { data, error } = await supabase
    .from('sessions')
    .select(`
      id,
      block_id,
      subject,
      session_type,
      planned_duration,
      actual_duration,
      start_time,
      end_time,
      completion_status,
      performance_rating,
      difficulty_actual,
      notes,
      interruptions
    `)
    .eq('user_id', userId)
    .gte('start_time', cutoffDate.toISOString())
    .order('start_time', { ascending: false });

  if (error) {
    console.error('Error fetching session data:', error);
    throw new Error(`Failed to fetch session data: ${error.message}`);
  }

  return data || [];
}

// Get performance history data
async function getPerformanceHistory(userId: string, daysBack: number): Promise<any[]> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);

  // Try to get from multiple possible tables
  const { data, error } = await supabase
    .from('student_performance')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', cutoffDate.toISOString())
    .order('created_at', { ascending: false });

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching performance history:', error);
    // This might not exist yet, so return empty array
    return [];
  }

  return data || [];
}

// Analyze subject performance patterns
function analyzeSubjectPerformance(
  blocks: HistoricalBlockData[], 
  sessions: SessionData[], 
  performanceHistory: any[]
): Record<string, {
  currentScore: number;
  trendDirection: 'improving' | 'stable' | 'declining';
  improvementRate: number;
  timeToMastery?: number;
  difficultyLevel: 'easy' | 'medium' | 'hard';
  strugglingTopics: string[];
  strongTopics: string[];
}> {
  const subjectMap: Record<string, {
    scores: number[];
    completionRates: number[];
    difficultyLevels: number[];
    improvementTrend: number[];
    sessions: SessionData[];
  }> = {};

  // Collect data by subject
  blocks.forEach(block => {
    if (!subjectMap[block.subject]) {
      subjectMap[block.subject] = {
        scores: [],
        completionRates: [],
        difficultyLevels: [],
        improvementTrend: [],
        sessions: []
      };
    }

    if (block.performance_score) {
      subjectMap[block.subject].scores.push(block.performance_score);
    }
    
    const completionRate = block.status === 'completed' ? 1 : 0;
    subjectMap[block.subject].completionRates.push(completionRate);
    
    if (block.difficulty_level) {
      subjectMap[block.subject].difficultyLevels.push(block.difficulty_level);
    }

    // Track improvement trend by looking at performance over time
    if (block.performance_score && block.completed_at) {
      subjectMap[block.subject].improvementTrend.push(block.performance_score);
    }
  });

  // Add session data
  sessions.forEach(session => {
    if (!subjectMap[session.subject]) {
      subjectMap[session.subject] = {
        scores: [],
        completionRates: [],
        difficultyLevels: [],
        improvementTrend: [],
        sessions: []
      };
    }
    subjectMap[session.subject].sessions.push(session);
  });

  // Analyze each subject
  const analysis: Record<string, any> = {};
  
  Object.entries(subjectMap).forEach(([subject, data]) => {
    const currentScore = data.scores.length > 0 ? 
      data.scores.slice(-5).reduce((a, b) => a + b) / Math.min(5, data.scores.length) : 0.5;
    
    const trendDirection = calculateTrendDirection(data.improvementTrend);
    const improvementRate = calculateImprovementRate(data.improvementTrend);
    const avgDifficulty = data.difficultyLevels.length > 0 ? 
      data.difficultyLevels.reduce((a, b) => a + b) / data.difficultyLevels.length : 3;
    
    // Determine difficulty level
    let difficultyLevel: 'easy' | 'medium' | 'hard' = 'medium';
    if (avgDifficulty <= 2) difficultyLevel = 'easy';
    else if (avgDifficulty >= 4) difficultyLevel = 'hard';
    
    // Calculate time to 80% mastery
    const timeToMastery = calculateTimeToMastery(currentScore, improvementRate);
    
    // Identify struggling and strong topics
    const strugglingTopics = data.sessions
      .filter(s => s.completion_status !== 'complete' || s.performance_rating < 3)
      .map(s => s.session_type)
      .slice(0, 3);
    
    const strongTopics = data.sessions
      .filter(s => s.completion_status === 'complete' && s.performance_rating >= 4)
      .map(s => s.session_type)
      .slice(0, 3);

    analysis[subject] = {
      currentScore,
      trendDirection,
      improvementRate,
      timeToMastery,
      difficultyLevel,
      strugglingTopics,
      strongTopics
    };
  });

  return analysis;
}

// Calculate learning velocity metrics
function calculateLearningVelocity(sessions: SessionData[]): {
  averageStudyTime: number;
  completionRate: number;
  retentionRate: number;
  preferredSessionLength: number;
} {
  if (sessions.length === 0) {
    return {
      averageStudyTime: 120, // 2 hours default
      completionRate: 0.75,
      retentionRate: 0.80,
      preferredSessionLength: 90
    };
  }

  const totalStudyTime = sessions.reduce((sum, s) => sum + s.actual_duration, 0);
  const averageStudyTime = totalStudyTime / sessions.length; // minutes per session
  
  const completedSessions = sessions.filter(s => s.completion_status === 'complete').length;
  const completionRate = completedSessions / sessions.length;
  
  // Estimate retention rate based on completion and performance
  const highPerformanceSessions = sessions.filter(s => s.performance_rating >= 4).length;
  const retentionRate = highPerformanceSessions / sessions.length;
  
  const preferredSessionLength = sessions
    .filter(s => s.completion_status === 'complete')
    .reduce((sum, s, _, arr) => sum + s.actual_duration / arr.length, 0);

  return {
    averageStudyTime,
    completionRate,
    retentionRate,
    preferredSessionLength
  };
}

// Analyze historical patterns
function analyzeHistoricalPatterns(
  blocks: HistoricalBlockData[], 
  sessions: SessionData[]
): {
  peakPerformanceTimes: string[];
  subjectProgressionRates: Record<string, number>;
  interventionPoints: string[];
  optimalStudySequence: string[];
} {
  // Analyze peak performance times (hours)
  const performanceByHour: Record<number, { scores: number[], count: number }> = {};
  
  sessions.forEach(session => {
    const hour = new Date(session.start_time).getHours();
    if (!performanceByHour[hour]) {
      performanceByHour[hour] = { scores: [], count: 0 };
    }
    performanceByHour[hour].scores.push(session.performance_rating);
    performanceByHour[hour].count++;
  });

  const peakPerformanceTimes = Object.entries(performanceByHour)
    .map(([hour, data]) => {
      const avgScore = data.scores.reduce((a, b) => a + b) / data.scores.length;
      return { hour: parseInt(hour), avgScore };
    })
    .filter(h => h.avgScore >= 4)
    .sort((a, b) => b.avgScore - a.avgScore)
    .slice(0, 3)
    .map(h => `${h.hour}:00`);

  // Calculate subject progression rates (weeks to master)
  const subjectProgressionRates: Record<string, number> = {};
  const subjectData: Record<string, { scores: number[], dates: string[] }> = {};

  blocks.forEach(block => {
    if (!subjectData[block.subject]) {
      subjectData[block.subject] = { scores: [], dates: [] };
    }
    if (block.performance_score && block.completed_at) {
      subjectData[block.subject].scores.push(block.performance_score);
      subjectData[block.subject].dates.push(block.completed_at);
    }
  });

  Object.entries(subjectData).forEach(([subject, data]) => {
    if (data.scores.length >= 2) {
      // Calculate weeks to go from current score to 0.8 (mastery)
      const currentScore = data.scores[data.scores.length - 1];
      if (currentScore < 0.8) {
        const weeksToMastery = Math.ceil((0.8 - currentScore) / 0.05); // Assume 5% improvement per week
        subjectProgressionRates[subject] = weeksToMastery;
      }
    }
  });

  // Identify intervention points (when student typically needs help)
  const interventionPoints = sessions
    .filter(s => s.completion_status !== 'complete' || s.performance_rating < 3)
    .map(s => s.session_type)
    .slice(0, 5);

  // Generate optimal study sequence based on difficulty and performance
  const allSubjects = Object.keys(subjectData);
  const optimalStudySequence = allSubjects.sort((a, b) => {
    const aScore = subjectData[a].scores[subjectData[a].scores.length - 1] || 0.5;
    const bScore = subjectData[b].scores[subjectData[b].scores.length - 1] || 0.5;
    return aScore - bScore; // Start with weakest subjects
  });

  return {
    peakPerformanceTimes,
    subjectProgressionRates,
    interventionPoints,
    optimalStudySequence
  };
}

// Helper functions
function calculateTrendDirection(scores: number[]): 'improving' | 'stable' | 'declining' {
  if (scores.length < 3) return 'stable';
  
  const recent = scores.slice(-3);
  const earlier = scores.slice(-6, -3);
  
  if (earlier.length === 0) return 'stable';
  
  const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
  const earlierAvg = earlier.reduce((a, b) => a + b) / earlier.length;
  
  const difference = recentAvg - earlierAvg;
  
  if (difference > 0.1) return 'improving';
  if (difference < -0.1) return 'declining';
  return 'stable';
}

function calculateImprovementRate(scores: number[]): number {
  if (scores.length < 2) return 0;
  
  const recent = scores.slice(-5);
  if (recent.length < 2) return 0;
  
  const first = recent[0];
  const last = recent[recent.length - 1];
  return (last - first) / recent.length;
}

function calculateTimeToMastery(currentScore: number, improvementRate: number): number {
  if (improvementRate <= 0) return Infinity;
  
  const targetScore = 0.8;
  const scoreDifference = targetScore - currentScore;
  
  if (scoreDifference <= 0) return 0;
  
  return Math.ceil(scoreDifference / improvementRate);
}
