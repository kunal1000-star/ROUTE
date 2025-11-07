// Mistral AI Image Analysis API Endpoint - Phase 2
// Handles Pixtral 12B image analysis for handwritten notes and documents

import { NextRequest, NextResponse } from 'next/server';
import { getMistralAIService, type ImageAnalysisResult } from '@/lib/ai/mistral-integration';
import { aiDataService, type AIUserProfile } from '@/lib/ai/ai-data-centralization-unified';
import type { StudentProfile } from '@/lib/ai/ai-suggestions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageData, imageType, userId, context, analysisType } = body;

    // Validate required fields
    if (!imageData || !imageType || !userId || !analysisType) {
      return NextResponse.json(
        { error: 'Missing required fields: imageData, imageType, userId, analysisType' },
        { status: 400 }
      );
    }

    // Validate analysis type
    const validTypes = ['handwriting', 'diagrams', 'equations', 'notes', 'general'];
    if (!validTypes.includes(analysisType)) {
      return NextResponse.json(
        { error: `Invalid analysisType. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Get user profile for AI analysis
    let userProfile;
    try {
      userProfile = await aiDataService.getAIUserProfile(userId, {
        includeDetailedPatterns: true,
        includePersonalization: true,
        timeRange: 'month'
      });
    } catch (profileError) {
      console.error('Error getting user profile:', profileError);
      return NextResponse.json(
        { error: 'Failed to get user profile', details: profileError instanceof Error ? profileError.message : 'Unknown error' },
        { status: 500 }
      );
    }

    if (!userProfile) {
      return NextResponse.json(
        { error: 'User profile not found for user: ' + userId },
        { status: 404 }
      );
    }

    // Initialize Mistral service
    const mistralService = getMistralAIService();
    await mistralService.initialize();

    // Perform image analysis
    const analysisResult = await mistralService.analyzeHandwrittenNotes({
      imageData,
      imageType,
      userId,
      context,
      analysisType
    });

    // Convert AI profile to StudentProfile for compatibility
    const studentProfile = convertAIProfileToStudentProfile(userProfile);
    
    // Generate study suggestions from analysis
    const studySuggestions = await mistralService.generateStudySuggestionsFromImage(
      analysisResult,
      studentProfile
    );

    return NextResponse.json({
      success: true,
      data: {
        analysis: analysisResult,
        suggestions: studySuggestions
      }
    });

  } catch (error) {
    console.error('Mistral image analysis error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { 
        error: 'Image analysis failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// Get analysis history for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId parameter required' },
        { status: 400 }
      );
    }

    // Get analysis history from database (implementation would fetch from actual database)
    const analysisHistory = await getUserAnalysisHistory(userId);

    return NextResponse.json({
      success: true,
      data: {
        history: analysisHistory,
        totalAnalyses: analysisHistory.length
      }
    });

  } catch (error) {
    console.error('Get analysis history error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get analysis history',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to convert AI profile to StudentProfile
function convertAIProfileToStudentProfile(aiProfile: AIUserProfile): StudentProfile {
  // Extract subject scores from profile data
  const subjectScores: Record<string, number> = {};
  const currentProgress: Record<string, number> = {};
  
  aiProfile.subjects.forEach(subject => {
    // Estimate score based on completion percentage
    const completionRate = subject.totalTopics > 0 ? (subject.completedTopics / subject.totalTopics) : 0;
    subjectScores[subject.name] = Math.round(completionRate * 100);
    currentProgress[subject.name] = Math.round(completionRate * 100);
  });

  // Extract weak and strong areas
  const weakAreas: string[] = [];
  const strongAreas: string[] = [];
  
  aiProfile.subjects.forEach(subject => {
    const score = subjectScores[subject.name];
    if (score < 60) {
      weakAreas.push(subject.name);
    } else if (score >= 80) {
      strongAreas.push(subject.name);
    }
  });

  return {
    userId: aiProfile.userId,
    performanceData: {
      subjectScores,
      weakAreas,
      strongAreas,
      recentActivities: aiProfile.recentActivity,
      studyTime: aiProfile.performanceMetrics.weeklyStudyHours * 60, // Convert to minutes
      learningStyle: 'visual', // Could be detected from study patterns
      examTarget: aiProfile.subjects[0]?.name || 'General',
      currentProgress
    },
    historicalData: {
      improvementTrends: {}, // Would need historical data
      struggleTopics: weakAreas,
      successPatterns: strongAreas,
      timeSpentBySubject: aiProfile.subjects.reduce((acc, subject) => {
        acc[subject.name] = subject.completedTopics * 30; // Estimate 30 min per topic
        return acc;
      }, {} as Record<string, number>)
    }
  };
}

// Helper function to get user analysis history
// In production, this would query the actual database
async function getUserAnalysisHistory(userId: string): Promise<ImageAnalysisResult[]> {
  // Mock implementation - replace with actual database query
  const mockHistory: ImageAnalysisResult[] = [
    {
      id: `history_1_${userId}`,
      analysis: {
        textExtracted: 'Calculus - derivatives and integrals',
        handwritingRecognized: 'Working through differentiation problems',
        conceptsIdentified: ['Derivatives', 'Integration', 'Chain Rule'],
        keyTopics: ['Calculus', 'Mathematics'],
        studyRecommendations: ['Practice more derivative problems', 'Review integration techniques']
      },
      confidence: 0.92,
      processingTime: 2500,
      metadata: {
        imageSize: 125000,
        analysisType: 'handwriting',
        userId,
        timestamp: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      }
    }
  ];

  return mockHistory;
}
