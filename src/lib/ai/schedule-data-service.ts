eh// Study Schedule Data Service - Enhancement 2B Implementation
// Fetches and structures schedule data for AI suggestions

import { supabase } from '../supabase';
import type { StudyScheduleData } from './scheduling-suggestions';
import { format, subDays, isToday } from 'date-fns';

export interface ScheduleBlock {
  id: string;
  start_time: string;
  duration: number;
  subject?: string;
  type: 'Study' | 'Question' | 'Revision';
  completed: boolean;
  date: string;
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  timeSpent: number;
  completedBlocks: number;
  totalBlocks: number;
}

// Get comprehensive schedule data for a user
export async function getUserScheduleData(userId: string): Promise<StudyScheduleData> {
  // Fetch recent schedule data (last 30 days)
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
  
  // Fetch blocks from last 30 days
  const { data: blocks, error: blocksError } = await supabase
    .from('blocks')
    .select('*')
    .eq('user_id', userId)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false });

  if (blocksError) {
    throw new Error(`Failed to fetch blocks: ${blocksError.message}`);
  }

  // Fetch sessions to determine completion
  const { data: sessions, error: sessionsError } = await supabase
    .from('sessions')
    .select('block_id, created_at')
    .in('block_id', blocks?.map(b => b.id) || []);

  if (sessionsError) {
    throw new Error(`Failed to fetch sessions: ${sessionsError.message}`);
  }

  // Create completion lookup
  const completedBlockIds = new Set(sessions.map(s => s.block_id));

  // Process today's schedule
  const today = format(new Date(), 'yyyy-MM-dd');
  const todayBlocks = blocks?.filter(b => b.date === today) || [];
  const todayScheduleBlocks: ScheduleBlock[] = todayBlocks.map(block => ({
    id: block.id,
    start_time: block.start_time,
    duration: block.duration,
    subject: block.subject,
    type: block.type,
    completed: completedBlockIds.has(block.id),
    date: block.date
  }));

  // Calculate performance metrics
  const performanceData = calculatePerformanceMetrics(blocks || [], completedBlockIds);
  
  // Analyze historical patterns
  const historicalPatterns = analyzeHistoricalPatterns(blocks || [], completedBlockIds);

  return {
    userId,
    currentSchedule: {
      dailyBlocks: todayScheduleBlocks,
      completedToday: todayScheduleBlocks.filter(b => b.completed).length,
      totalPlannedToday: todayScheduleBlocks.length
    },
    performanceData,
    historicalPatterns
  };
}

// Calculate performance metrics from blocks and sessions
function calculatePerformanceMetrics(blocks: any[], completedBlockIds: Set<string>) {
  const totalBlocks = blocks.length;
  const completedBlocks = blocks.filter(b => completedBlockIds.has(b.id)).length;
  const averageCompletionRate = totalBlocks > 0 ? completedBlocks / totalBlocks : 0;

  // Group by subject to calculate performance per subject
  const subjectGroups = blocks.reduce((acc, block) => {
    const subject = block.subject || 'General';
    if (!acc[subject]) {
      acc[subject] = [];
    }
    acc[subject].push(block);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate time spent and completion rate per subject
  const subjectPerformance: Record<string, number> = {};
  const timeSpentBySubject: Record<string, number> = {};
  
  Object.entries(subjectGroups).forEach(([subject, subjectBlocks]) => {
    const completedSubjectBlocks = subjectBlocks.filter(b => completedBlockIds.has(b.id));
    const completionRate = subjectBlocks.length > 0 ? completedSubjectBlocks.length / subjectBlocks.length : 0;
    subjectPerformance[subject] = completionRate;
    
    // Calculate time spent (only completed blocks)
    const timeSpent = completedSubjectBlocks.reduce((sum, block) => sum + (block.duration || 0), 0);
    timeSpentBySubject[subject] = timeSpent;
  });

  // Analyze study time patterns
  const studyTimes = blocks.map(b => {
    const hour = parseInt(b.start_time.split(':')[0]);
    return hour;
  });
  
  const timeCounts = studyTimes.reduce((acc, hour) => {
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Find peak productivity hours
  const peakHours = Object.entries(timeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([hour]) => `${hour.padStart(2, '0')}:00`);

  return {
    averageCompletionRate,
    preferredStudyTimes: peakHours,
    subjectPerformance,
    timeSpentBySubject
  };
}

// Analyze historical patterns for optimization
function analyzeHistoricalPatterns(blocks: any[], completedBlockIds: Set<string>) {
  // Group blocks by day to find completion patterns
  const dayGroups = blocks.reduce((acc, block) => {
    const day = new Date(block.date).getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (!acc[day]) {
      acc[day] = { total: 0, completed: 0 };
    }
    acc[day].total++;
    if (completedBlockIds.has(block.id)) {
      acc[day].completed++;
    }
    return acc;
  }, {} as Record<number, { total: number; completed: number }>);

  // Find days with highest completion rates
  const completionRates = Object.entries(dayGroups)
    .map(([day, data]) => ({
      day: parseInt(day),
      rate: data.total > 0 ? data.completed / data.total : 0
    }))
    .filter(d => d.rate > 0);

  // Consistent completion days = days with >80% completion rate
  const consistentDays = completionRates.filter(d => d.rate > 0.8).length;

  // Analyze interruptions (blocks that are frequently missed)
  const interruptionPatterns = findInterruptionPatterns(blocks, completedBlockIds);

  // Calculate optimal break intervals based on session patterns
  const optimalBreakIntervals = calculateOptimalBreakIntervals(blocks);

  return {
    peakProductivityHours: extractPeakHours(blocks),
    consistentCompletionDays: consistentDays,
    frequentInterruptions: interruptionPatterns,
    optimalBreakIntervals
  };
}

// Find patterns in missed blocks
function findInterruptionPatterns(blocks: any[], completedBlockIds: Set<string>) {
  const interruptions: string[] = [];
  
  // Analyze time-based interruptions
  const timeInterruptionRates = blocks.reduce((acc, block) => {
    const hour = parseInt(block.start_time.split(':')[0]);
    const isCompleted = completedBlockIds.has(block.id);
    if (!acc[hour]) {
      acc[hour] = { total: 0, missed: 0 };
    }
    acc[hour].total++;
    if (!isCompleted) {
      acc[hour].missed++;
    }
    return acc;
  }, {} as Record<number, { total: number; missed: number }>);

  // Find hours with high interruption rates (>50% missed)
  Object.entries(timeInterruptionRates).forEach(([hour, data]) => {
    const missedRate = data.missed / data.total;
    if (missedRate > 0.5) {
      interruptions.push(`${hour}:00 - High interruption rate (${Math.round(missedRate * 100)}%)`);
    }
  });

  return interruptions;
}

// Calculate optimal break intervals
function calculateOptimalBreakIntervals(blocks: any[]) {
  // Simple algorithm: analyze session duration patterns
  const durations = blocks
    .filter(b => b.duration)
    .map(b => b.duration)
    .sort((a, b) => a - b);
  
  if (durations.length === 0) return 15; // Default 15 minutes
  
  // Find the most common duration range
  const durationCounts = durations.reduce((acc, duration) => {
    const range = Math.floor(duration / 30) * 30; // Group by 30-minute ranges
    acc[range] = (acc[range] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  const mostCommonDuration = Object.entries(durationCounts)
    .sort(([,a], [,b]) => b - a)[0][0];

  // Suggest break interval as 15-20% of session duration
  return Math.max(10, Math.min(25, Math.floor(mostCommonDuration * 0.2)));
}

// Extract peak productivity hours
function extractPeakHours(blocks: any[]) {
  const hourPerformance = blocks.reduce((acc, block) => {
    const hour = parseInt(block.start_time.split(':')[0]);
    const date = new Date(block.date);
    const dayOfWeek = date.getDay();
    
    // Weight weekdays higher than weekends
    const dayWeight = dayOfWeek === 0 || dayOfWeek === 6 ? 0.5 : 1;
    
    if (!acc[hour]) {
      acc[hour] = { total: 0, weight: 0 };
    }
    acc[hour].total++;
    acc[hour].weight += dayWeight;
    return acc;
  }, {} as Record<number, { total: number; weight: number }>);

  return Object.entries(hourPerformance)
    .map(([hour, data]) => ({
      hour: parseInt(hour),
      score: data.weight / data.total // Normalize by total count
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)
    .map(({ hour }) => `${hour.toString().padStart(2, '0')}:00`);
}

// Get subject performance data
export async function getSubjectPerformanceData(userId: string): Promise<SubjectPerformance[]> {
  const scheduleData = await getUserScheduleData(userId);
  
  return Object.entries(scheduleData.performanceData.subjectPerformance)
    .map(([subject, score]) => ({
      subject,
      averageScore: score,
      timeSpent: scheduleData.performanceData.timeSpentBySubject[subject] || 0,
      completedBlocks: Math.floor(score * 10), // Estimated from completion rate
      totalBlocks: 10 // Estimated total
    }))
    .sort((a, b) => b.averageScore - a.averageScore);
}
