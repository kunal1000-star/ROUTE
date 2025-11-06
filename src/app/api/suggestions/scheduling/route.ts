import { NextRequest, NextResponse } from 'next/server';
import { generateAllSchedulingSuggestions } from '@/lib/ai/scheduling-suggestions';
import { getUserScheduleData } from '@/lib/ai/schedule-data-service';
import type { StudentProfile } from '@/lib/ai/ai-suggestions';

// Mock student profile generator (replace with actual DB query when available)
async function generateMockStudentProfile(userId: string): Promise<StudentProfile> {
  return {
    userId,
    performanceData: {
      subjectScores: {
        'Mathematics': 85,
        'Physics': 72,
        'Chemistry': 78
      },
      weakAreas: ['Physics', 'Chemistry'],
      strongAreas: ['Mathematics'],
      recentActivities: [
        { date: '2025-11-05', subject: 'Physics', duration: 90, performance: 0.8 },
        { date: '2025-11-04', subject: 'Mathematics', duration: 120, performance: 0.9 }
      ],
      studyTime: 4.5,
      learningStyle: 'visual',
      examTarget: 'JEE Advanced',
      currentProgress: {
        'Mathematics': 75,
        'Physics': 60,
        'Chemistry': 70
      }
    },
    historicalData: {
      improvementTrends: {
        'Mathematics': 0.15,
        'Physics': 0.05,
        'Chemistry': 0.08
      },
      struggleTopics: ['Quantum Mechanics', 'Organic Chemistry'],
      successPatterns: ['Calculus', 'Algebra'],
      timeSpentBySubject: {
        'Mathematics': 15,
        'Physics': 12,
        'Chemistry': 10
      }
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' }, 
        { status: 400 }
      );
    }
    
    // Get student profile and schedule data
    const [profile, scheduleData] = await Promise.all([
      generateMockStudentProfile(userId),
      getUserScheduleData(userId)
    ]);
    
    // Generate scheduling suggestions
    const suggestions = await generateAllSchedulingSuggestions(
      profile,
      scheduleData
    );
    
    return NextResponse.json({
      success: true,
      suggestions,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Scheduling suggestions API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate scheduling suggestions' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return NextResponse.json(
      { error: 'userId query parameter is required' },
      { status: 400 }
    );
  }
  
  try {
    const profile = await generateMockStudentProfile(userId);
    
    return NextResponse.json({
      success: true,
      profile: {
        userId: profile.userId,
        performanceData: profile.performanceData,
        historicalData: profile.historicalData
      }
    });
    
  } catch (error) {
    console.error('Scheduling profile API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch student profile' },
      { status: 500 }
    );
  }
}
