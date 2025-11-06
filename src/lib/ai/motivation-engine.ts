// AI Motivation Engine - Phase 1C: Features 18-22
// Advanced motivation and engagement system for personalized learning

import type { Suggestion, StudentProfile } from './ai-suggestions';

export interface MotivationData {
  recentActivities: Array<{
    date: string;
    subject: string;
    duration: number;
    completion: number;
    performance: number;
  }>;
  currentStreak: number;
  longestStreak: number;
  studyGoals: {
    daily: number;
    weekly: number;
    subjectGoals: Record<string, number>;
  };
  achievements: Array<{
    type: string;
    subject?: string;
    date: string;
    value: number;
  }>;
  challenges: Array<{
    id: string;
    type: string;
    subject: string;
    target: number;
    progress: number;
    deadline: string;
  }>;
}

// Feature 18: Daily Study Tips
export async function generateDailyTips(profile: StudentProfile, motivationData: MotivationData): Promise<Suggestion[]> {
  const today = new Date();
  const currentHour = today.getHours();
  const currentSubject = getCurrentStudySubject(profile, motivationData);
  
  const timeBasedTips = {
    morning: `Start your day with challenging problems from ${currentSubject}. Your brain is fresh and alert now!`,
    afternoon: `Perfect time for ${currentSubject} practice problems. Your logical thinking is at its peak.`,
    evening: `Use this time for review and consolidation of ${currentSubject}. Less intensive, more reflective.`
  };

  const timeOfDay = currentHour < 12 ? 'morning' : currentHour < 17 ? 'afternoon' : 'evening';
  
  return [{
    id: 'daily-tip-today',
    type: 'tip',
    title: `Today's ${currentSubject} Study Tip`,
    description: timeBasedTips[timeOfDay],
    priority: 'medium',
    estimatedImpact: 6,
    reasoning: `Personalized for ${timeOfDay} study and ${profile.performanceData.learningStyle} learning style`,
    actionableSteps: [
      'Apply this tip during your next study session',
      'Notice how it affects your focus and retention',
      'Share your experience with the AI for optimization'
    ],
    confidenceScore: 0.9,
    metadata: {
      featureId: 18,
      date: today.toISOString().split('T')[0],
      currentSubject,
      timeOfDay,
      learningStyle: profile.performanceData.learningStyle
    }
  }];
}

// Feature 19: Motivational Messages
export async function generateMotivationalMessages(profile: StudentProfile, motivationData: MotivationData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  
  // Streak-based motivation
  if (motivationData.currentStreak > 0) {
    const message = motivationData.currentStreak >= 7 
      ? `Incredible! You've maintained a ${motivationData.currentStreak}-day study streak. You're building an amazing habit!`
      : `Great job on your ${motivationData.currentStreak}-day streak! Consistency is the key to success.`;
    
    suggestions.push({
      id: 'motivation-streak',
      type: 'motivation',
      title: 'Streak Achievement',
      description: message,
      priority: 'high',
      estimatedImpact: 8,
      reasoning: 'Positive reinforcement for consistency builds motivation',
      actionableSteps: [
        'Continue your daily study habit',
        'Set a goal to extend your streak',
        'Celebrate small wins along the way'
      ],
      confidenceScore: 0.95,
      metadata: {
        featureId: 19,
        type: 'progress',
        streak: motivationData.currentStreak
      }
    });
  }

  // Performance improvement motivation
  const recentImprovement = getRecentImprovement(motivationData);
  if (recentImprovement > 0) {
    suggestions.push({
      id: 'motivation-improvement',
      type: 'motivation',
      title: 'Progress Recognition',
      description: `You've improved by ${(recentImprovement * 100).toFixed(1)}% in your recent sessions. Your hard work is paying off!`,
      priority: 'high',
      estimatedImpact: 7,
      reasoning: 'Recognizing progress increases motivation and self-efficacy',
      actionableSteps: [
        'Continue with your current study approach',
        'Challenge yourself with slightly harder problems',
        'Document your learning strategies that work'
      ],
      confidenceScore: 0.9,
      metadata: {
        featureId: 19,
        type: 'improvement',
        improvementRate: recentImprovement
      }
    });
  }

  return suggestions;
}

// Feature 20: Study Technique Recommendations
export async function recommendStudyTechniques(profile: StudentProfile, motivationData: MotivationData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const learningStyle = profile.performanceData.learningStyle;
  const weakAreas = profile.performanceData.weakAreas;
  
  if (weakAreas.length > 0) {
    const subject = weakAreas[0];
    const technique = getTechniqueForSubjectAndStyle(subject, learningStyle);
    
    suggestions.push({
      id: 'technique-recommendation',
      type: 'technique',
      title: `Optimized Study Technique for ${subject}`,
      description: `Based on your ${learningStyle} learning style and ${subject} content, try ${technique.name}.`,
      priority: 'high',
      estimatedImpact: 8,
      reasoning: `Matches your learning style for optimal retention in challenging subjects`,
      actionableSteps: technique.steps,
      confidenceScore: 0.88,
      metadata: {
        featureId: 20,
        subject,
        learningStyle,
        technique: technique.name,
        effectiveness: 'High'
      }
    });
  }

  return suggestions;
}

// Feature 21: Practice Recommendations
export async function recommendPractice(profile: StudentProfile, motivationData: MotivationData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const weakAreas = profile.performanceData.weakAreas;
  const strongAreas = profile.performanceData.strongAreas;
  
  if (weakAreas.length > 0) {
    const subject = weakAreas[0];
    const practiceType = getRecommendedPracticeType(subject);
    
    suggestions.push({
      id: 'practice-recommendation',
      type: 'practice',
      title: `${subject} Practice Session`,
      description: `Focus on ${practiceType.name} to strengthen your ${subject} understanding.`,
      priority: 'high',
      estimatedImpact: 8,
      reasoning: `Targeted practice on weak areas maximizes improvement potential`,
      actionableSteps: [
        `Complete ${practiceType.questions} practice questions`,
        practiceType.reviewStep,
        'Track accuracy and time taken',
        'Review incorrect answers thoroughly'
      ],
      confidenceScore: 0.85,
      metadata: {
        featureId: 21,
        subject,
        practiceType: practiceType.name,
        questions: practiceType.questions,
        focus: practiceType.focus
      }
    });
  }

  return suggestions;
}

// Feature 22: Revision Suggestions
export async function suggestRevisions(profile: StudentProfile, motivationData: MotivationData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const topicsToRevise = getTopicsForRevision(profile, motivationData);
  
  if (topicsToRevise.length > 0) {
    const subject = topicsToRevise[0];
    const daysSinceStudy = getDaysSinceLastStudy(subject, motivationData);
    
    suggestions.push({
      id: 'revision-suggestion',
      type: 'revision',
      title: `${subject} Revision Time`,
      description: `It's been ${daysSinceStudy} days since you studied ${subject}. Perfect time for spaced repetition review!`,
      priority: daysSinceStudy > 7 ? 'high' : 'medium',
      estimatedImpact: 8,
      reasoning: 'Optimal review timing based on forgetting curve research',
      actionableSteps: [
        'Do 10 quick practice questions',
        'Review key formulas and concepts',
        'Identify areas needing more practice',
        'Create flashcards for important points'
      ],
      confidenceScore: 0.87,
      metadata: {
        featureId: 22,
        subject,
        daysSinceStudy,
        revisionType: 'spaced repetition',
        priority: daysSinceStudy > 7 ? 'high' : 'medium'
      }
    });
  }

  return suggestions;
}

// Helper functions
function getCurrentStudySubject(profile: StudentProfile, motivationData: MotivationData): string {
  // Get most recently active subject
  const recentActivity = motivationData.recentActivities
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  
  if (recentActivity) {
    return recentActivity.subject;
  }
  
  // Fallback to exam target subject
  return profile.performanceData.examTarget || 'Mathematics';
}

function getRecentPerformanceScore(profile: StudentProfile, motivationData: MotivationData): number {
  const recentActivities = motivationData.recentActivities
    .slice(-5); // Last 5 activities
  
  if (recentActivities.length === 0) return 0;
  
  const avgPerformance = recentActivities.reduce((sum, activity) => sum + activity.performance, 0) / recentActivities.length;
  return avgPerformance;
}

function getRecentImprovement(motivationData: MotivationData): number {
  if (motivationData.recentActivities.length < 2) return 0;
  
  const recent = motivationData.recentActivities.slice(-3);
  const earlier = motivationData.recentActivities.slice(-6, -3);
  
  if (recent.length === 0 || earlier.length === 0) return 0;
  
  const recentAvg = recent.reduce((sum, a) => sum + a.performance, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, a) => sum + a.performance, 0) / earlier.length;
  
  return Math.max(0, recentAvg - earlierAvg);
}

function getTechniqueForSubjectAndStyle(subject: string, learningStyle: string): { name: string; steps: string[] } {
  const techniques = {
    visual: {
      'Mathematics': {
        name: 'Visual Problem Solving',
        steps: [
          'Draw diagrams for every problem',
          'Use color coding for different solution steps',
          'Create mind maps for formula relationships'
        ]
      },
      'Physics': {
        name: 'Diagram-Based Learning',
        steps: [
          'Sketch all force diagrams and vector representations',
          'Use motion graphs to visualize concepts',
          'Create flowcharts for complex derivations'
        ]
      }
    },
    logical: {
      'Mathematics': {
        name: 'Logical Proof Structure',
        steps: [
          'Break problems into logical steps',
          'Prove each sub-problem before moving forward',
          'Use mathematical induction for pattern recognition'
        ]
      },
      'Chemistry': {
        name: 'Mechanism Analysis',
        steps: [
          'Understand reaction mechanisms step-by-step',
          'Identify electron flow in organic reactions',
          'Use logical reasoning for stereochemistry'
        ]
      }
    },
    practical: {
      'Physics': {
        name: 'Experimental Application',
        steps: [
          'Relate problems to real-world examples',
          'Use everyday objects for demonstrations',
          'Think about practical applications of concepts'
        ]
      }
    }
  };

  return techniques[learningStyle]?.[subject] || {
    name: 'Active Learning',
    steps: [
      'Take comprehensive notes',
      'Create summary sheets',
      'Practice with varied problem types'
    ]
  };
}

function getRecommendedPracticeType(subject: string): { name: string; questions: number; reviewStep: string; focus: string } {
  const practiceTypes = {
    'Mathematics': {
      name: 'Mixed Problem Solving',
      questions: 15,
      reviewStep: 'Focus on understanding solution methodology',
      focus: 'Pattern recognition and speed'
    },
    'Physics': {
      name: 'Conceptual Application',
      questions: 12,
      reviewStep: 'Review force diagrams and vector calculations',
      focus: 'Physical intuition and formula application'
    },
    'Chemistry': {
      name: 'Mechanism Practice',
      questions: 20,
      reviewStep: 'Study electron flow and intermediate stability',
      focus: 'Reaction mechanisms and stereochemistry'
    }
  };

  return practiceTypes[subject] || {
    name: 'Standard Practice',
    questions: 15,
    reviewStep: 'Review solution steps and key concepts',
    focus: 'Comprehensive understanding'
  };
}

function getTopicsForRevision(profile: StudentProfile, motivationData: MotivationData): string[] {
  const topics = profile.performanceData.weakAreas.concat(profile.performanceData.strongAreas);
  return topics.filter(topic => getDaysSinceLastStudy(topic, motivationData) > 3);
}

function getDaysSinceLastStudy(subject: string, motivationData: MotivationData): number {
  const lastActivity = motivationData.recentActivities
    .filter(a => a.subject === subject)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  if (!lastActivity) return 30; // If never studied, suggest revision soon

  const daysDiff = Math.floor((Date.now() - new Date(lastActivity.date).getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, daysDiff);
}

// Main function to generate all motivation features
export async function generateAllMotivationFeatures(
  profile: StudentProfile,
  motivationData: MotivationData
): Promise<Suggestion[]> {
  const [
    dailyTips,
    motivationalMessages,
    techniqueRecommendations,
    practiceRecommendations,
    revisionSuggestions
  ] = await Promise.all([
    generateDailyTips(profile, motivationData),
    generateMotivationalMessages(profile, motivationData),
    recommendStudyTechniques(profile, motivationData),
    recommendPractice(profile, motivationData),
    suggestRevisions(profile, motivationData)
  ]);

  const allSuggestions = [
    ...dailyTips,
    ...motivationalMessages,
    ...techniqueRecommendations,
    ...practiceRecommendations,
    ...revisionSuggestions
  ];

  return allSuggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aScore = priorityOrder[a.priority] * a.estimatedImpact * a.confidenceScore;
    const bScore = priorityOrder[b.priority] * b.estimatedImpact * b.confidenceScore;
    return bScore - aScore;
  });
}
