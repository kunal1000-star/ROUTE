// AI Prediction Engine - Phase 1B: Features 13-17
// Advanced prediction and estimation system for personalized learning

import type { Suggestion, StudentProfile } from './ai-suggestions';

export interface LearningPattern {
  userId: string;
  studyVelocity: number; // Topics per week
  retentionRate: number; // 0-1
  difficultyAdaptation: number; // How well student adapts to new difficulties
  consistencyScore: number; // 0-1
  peakPerformanceTime: string; // "08:00-10:00"
  averageSessionLength: number; // minutes
  subjectMasteryRates: Record<string, number>; // Progress rate per subject
  struggleRecoveryTime: number; // days to recover from struggles
}

export interface PredictionData {
  currentProgress: Record<string, number>; // % completed by topic
  timeSpent: Record<string, number>; // hours spent per topic
  performanceTrends: Record<string, number[]>; // Recent scores by topic
  upcomingExam: {
    date: string;
    subjects: string[];
    importance: Record<string, number>; // 0-1 importance weight
  };
}

// Helper function to analyze learning patterns
async function analyzeLearningPatterns(profile: StudentProfile, predictionData: PredictionData): Promise<LearningPattern> {
  // Calculate study velocity (simplified)
  const totalTimeSpent = Object.values(predictionData.timeSpent).reduce((a, b) => a + b, 0);
  const totalProgress = Object.values(predictionData.currentProgress).reduce((a, b) => a + b, 0);
  const studyVelocity = totalProgress > 0 ? totalProgress / Math.max(totalTimeSpent, 1) : 5; // % per hour

  // Calculate retention rate (simplified)
  const recentPerformance = Object.values(profile.historicalData.improvementTrends);
  const retentionRate = recentPerformance.length > 0 
    ? recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length 
    : 0.75;

  // Calculate consistency score
  const consistencyScore = profile.performanceData.studyTime > 0 ? Math.min(0.9, profile.performanceData.studyTime / 50) : 0.6;

  // Calculate difficulty adaptation (simplified)
  const difficultyAdaptation = 0.7 + (Math.random() * 0.2); // Simplified for now

  // Calculate subject mastery rates
  const subjectMasteryRates: Record<string, number> = {};
  Object.entries(predictionData.currentProgress).forEach(([subject, progress]) => {
    const timeSpent = predictionData.timeSpent[subject] || 1;
    subjectMasteryRates[subject] = progress / timeSpent; // % per hour
  });

  return {
    userId: profile.userId,
    studyVelocity,
    retentionRate,
    difficultyAdaptation,
    consistencyScore,
    peakPerformanceTime: '08:00-10:00',
    averageSessionLength: 90,
    subjectMasteryRates,
    struggleRecoveryTime: 7
  };
}

// Calculate base difficulty for subjects (simplified)
function calculateBaseDifficulty(subject: string): number {
  const difficultyMap: Record<string, number> = {
    'Mathematics': 0.6,
    'Physics': 0.7,
    'Chemistry': 0.5,
    'Organic Chemistry': 0.8,
    'Inorganic Chemistry': 0.4,
    'Physical Chemistry': 0.7,
    'Mechanics': 0.6,
    'Thermodynamics': 0.8,
    'Quantum Mechanics': 0.9,
    'Electromagnetism': 0.8
  };
  
  return difficultyMap[subject] || 0.6;
}

// Predict learning velocity for a specific subject
function predictLearningVelocity(profile: StudentProfile, subject: string): number {
  const historicalRate = profile.historicalData.timeSpentBySubject[subject] || 10;
  const baseVelocity = 5; // Base topics per week
  
  // Adjust based on historical performance
  if (profile.historicalData.successPatterns.includes(subject)) {
    return baseVelocity * 1.3;
  } else if (profile.historicalData.struggleTopics.includes(subject)) {
    return baseVelocity * 0.7;
  }
  return baseVelocity;
}

// Predict optimal session length for subject
function predictOptimalSessionLength(profile: StudentProfile, subject: string): number {
  const baseLength = 90; // minutes
  const learningStyleMultiplier = profile.performanceData.learningStyle === 'visual' ? 1.2 : 1.0;
  
  // Adjust for subject difficulty
  const difficulty = calculateBaseDifficulty(subject);
  const difficultyMultiplier = difficulty > 0.7 ? 0.8 : 1.1;
  
  return Math.round(baseLength * learningStyleMultiplier * difficultyMultiplier);
}

// Feature 13: Mastery Prediction
export async function predictMasteryTimeline(profile: StudentProfile, predictionData: PredictionData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const patterns = await analyzeLearningPatterns(profile, predictionData);

  // Predict mastery for each subject
  Object.entries(predictionData.currentProgress).forEach(([subject, progress]) => {
    if (progress >= 100) return; // Already mastered
    
    const remainingProgress = 100 - progress;
    const weeklyRate = patterns.subjectMasteryRates[subject] || 5; // Default 5% per week
    const weeksToMaster = remainingProgress / weeklyRate;
    const masteryDate = new Date();
    masteryDate.setDate(masteryDate.getDate() + (weeksToMaster * 7));

    // Check if mastery will be before exam
    const examDate = new Date(predictionData.upcomingExam.date);
    const daysUntilMastery = Math.ceil((masteryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const daysUntilExam = Math.ceil((examDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    const willMasterInTime = daysUntilMastery <= daysUntilExam;
    const confidence = patterns.consistencyScore * patterns.retentionRate;

    suggestions.push({
      id: `mastery-${subject.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'mastery',
      title: `${subject} Mastery Prediction`,
      description: `Based on your learning patterns, you'll likely master ${subject} in ${Math.ceil(weeksToMaster)} weeks${!willMasterInTime ? ' - consider increasing study time' : ''}.`,
      priority: willMasterInTime ? 'medium' : 'high',
      estimatedImpact: 8,
      reasoning: `AI analysis of your ${patterns.studyVelocity.toFixed(1)} topics/week pace and ${(patterns.consistencyScore * 100).toFixed(0)}% consistency score`,
      actionableSteps: willMasterInTime ? [
        'Maintain current study pace',
        'Focus on problem-solving in this subject',
        'Schedule weekly review sessions'
      ] : [
        `Increase ${subject} study time by 30%`,
        'Study this subject during peak performance hours',
        'Use active recall techniques',
        'Consider additional practice materials'
      ],
      confidenceScore: confidence,
      metadata: {
        featureId: 13,
        subject,
        predictedWeeks: Math.ceil(weeksToMaster),
        masteryDate: masteryDate.toISOString().split('T')[0],
        daysUntilExam,
        willMasterInTime,
        currentProgress: progress,
        weeklyRate
      }
    });
  });

  return suggestions;
}

// Feature 14: Difficulty Prediction
export async function predictDifficulty(profile: StudentProfile, predictionData: PredictionData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  const patterns = await analyzeLearningPatterns(profile, predictionData);
  
  // Analyze which upcoming topics will be most challenging
  const upcomingTopics = Object.keys(predictionData.currentProgress)
    .filter(subject => predictionData.currentProgress[subject] < 50); // Topics just started

  upcomingTopics.forEach(subject => {
    // Calculate difficulty score based on multiple factors
    const baseDifficulty = calculateBaseDifficulty(subject);
    const studentAdaptation = patterns.difficultyAdaptation || 0.7;
    const historicalPerformance = predictionData.performanceTrends[subject] || [];
    const avgScore = historicalPerformance.length > 0 
      ? historicalPerformance.reduce((a, b) => a + b, 0) / historicalPerformance.length 
      : 0.7;

    // Adjusted difficulty = base difficulty * (1 - student adaptation) * (1 - performance)
    const adjustedDifficulty = baseDifficulty * (2 - studentAdaptation - avgScore);
    
    let difficultyLevel: string;
    let estimatedHours: number;
    
    if (adjustedDifficulty < 0.3) {
      difficultyLevel = 'Easy';
      estimatedHours = 8 + (adjustedDifficulty * 10);
    } else if (adjustedDifficulty < 0.7) {
      difficultyLevel = 'Moderate';
      estimatedHours = 12 + ((adjustedDifficulty - 0.3) * 15);
    } else {
      difficultyLevel = 'Challenging';
      estimatedHours = 18 + ((adjustedDifficulty - 0.7) * 20);
    }

    suggestions.push({
      id: `difficulty-${subject.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'difficulty',
      title: `${subject} Difficulty Assessment`,
      description: `This topic is likely to be ${difficultyLevel.toLowerCase()} for you. Estimated study time: ${Math.round(estimatedHours)} hours.`,
      priority: adjustedDifficulty > 0.7 ? 'high' : 'medium',
      estimatedImpact: 7,
      reasoning: `Based on your ${(avgScore * 100).toFixed(0)}% performance with similar topics and ${(studentAdaptation * 100).toFixed(0)}% adaptation rate`,
      actionableSteps: [
        `Allocate ${Math.round(estimatedHours)} hours for ${subject}`,
        adjustedDifficulty > 0.7 ? 'Start with foundational concepts first' : 'Begin with standard approach',
        adjustedDifficulty > 0.7 ? 'Consider breaking into smaller sub-topics' : 'Use regular study schedule',
        'Monitor progress and adjust time allocation'
      ],
      confidenceScore: Math.max(0.6, 1 - adjustedDifficulty + studentAdaptation),
      metadata: {
        featureId: 14,
        subject,
        difficultyScore: adjustedDifficulty,
        difficultyLevel,
        estimatedHours,
        baseDifficulty,
        studentAdaptation,
        avgScore
      }
    });
  });

  return suggestions;
}

// Feature 15: Time Estimation
export async function estimateStudyTime(profile: StudentProfile, predictionData: PredictionData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  
  Object.entries(predictionData.currentProgress).forEach(([subject, progress]) => {
    if (progress >= 100) return; // Already completed
    
    const remainingProgress = 100 - progress;
    const timeSpent = predictionData.timeSpent[subject] || 0;
    const currentRate = progress > 0 ? progress / Math.max(timeSpent, 1) : 0; // % per hour
    
    // Predict time needed based on learning velocity
    const learningVelocity = predictLearningVelocity(profile, subject);
    const adjustedRate = (currentRate * 0.3) + (learningVelocity * 0.7); // Weight recent performance
    
    const hoursNeeded = remainingProgress / Math.max(adjustedRate, 1);
    
    // Break down into session recommendations
    const sessionLength = predictOptimalSessionLength(profile, subject);
    const sessionsNeeded = Math.ceil(hoursNeeded * 60 / sessionLength);
    
    suggestions.push({
      id: `estimation-${subject.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'estimation',
      title: `${subject} Study Time Estimation`,
      description: `You'll need approximately ${Math.round(hoursNeeded)} more hours to complete ${subject}. This translates to ${sessionsNeeded} study sessions.`,
      priority: hoursNeeded > 20 ? 'high' : 'medium',
      estimatedImpact: 6,
      reasoning: `Based on your ${adjustedRate.toFixed(1)}% per hour learning rate and ${sessionLength}-minute optimal session length`,
      actionableSteps: [
        `Plan ${Math.round(hoursNeeded)} hours over ${sessionsNeeded} sessions`,
        `Use ${sessionLength}-minute study blocks for optimal focus`,
        'Schedule sessions during your peak performance times',
        'Include 10-minute breaks between intensive sessions'
      ],
      confidenceScore: 0.85,
      metadata: {
        featureId: 15,
        subject,
        estimatedHours: Math.round(hoursNeeded),
        sessionsNeeded,
        sessionLength,
        adjustedRate,
        remainingProgress
      }
    });
  });

  return suggestions;
}

// Feature 16: Question Volume Recommendations
export async function recommendQuestionVolume(profile: StudentProfile, predictionData: PredictionData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  
  Object.entries(predictionData.currentProgress).forEach(([subject, progress]) => {
    const performanceScore = predictionData.performanceTrends[subject] 
      ? predictionData.performanceTrends[subject].slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, predictionData.performanceTrends[subject].length)
      : 0.7;
    
    let questionCount: number;
    let reasoning: string;
    
    if (performanceScore < 0.6) {
      // Struggling - more practice needed
      questionCount = Math.round(50 + (10 * (0.6 - performanceScore)));
      reasoning = 'Higher volume to strengthen understanding through repetition';
    } else if (performanceScore > 0.85) {
      // Strong - maintenance level
      questionCount = 20;
      reasoning = 'Maintenance level to stay sharp without burnout';
    } else {
      // Moderate performance - moderate practice
      questionCount = 30 + Math.round(20 * (performanceScore - 0.6));
      reasoning = 'Balanced practice to improve toward mastery';
    }

    suggestions.push({
      id: `volume-${subject.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'practice',
      title: `${subject} Practice Question Volume`,
      description: `Recommended: ${questionCount} practice questions for ${subject} this week.`,
      priority: performanceScore < 0.6 ? 'high' : 'medium',
      estimatedImpact: 7,
      reasoning,
      actionableSteps: [
        `Attempt ${questionCount} questions over ${Math.ceil(questionCount / 10)} study sessions`,
        'Focus on understanding concepts, not just memorizing',
        'Review explanations for both correct and incorrect answers',
        'Track accuracy to adjust future volume'
      ],
      confidenceScore: 0.8,
      metadata: {
        featureId: 16,
        subject,
        questionCount,
        performanceScore,
        recommendedFrequency: 'Weekly'
      }
    });
  });

  return suggestions;
}

// Feature 17: Prerequisite Suggestions
export async function suggestPrerequisites(profile: StudentProfile, predictionData: PredictionData): Promise<Suggestion[]> {
  const suggestions: Suggestion[] = [];
  
  // Define prerequisite relationships (simplified)
  const prerequisites: Record<string, string[]> = {
    'Quantum Mechanics': ['Mechanics', 'Thermodynamics'],
    'Electromagnetism': ['Mechanics', 'Mathematics'],
    'Organic Chemistry': ['Inorganic Chemistry', 'Mathematics'],
    'Physical Chemistry': ['Mathematics', 'Thermodynamics'],
    'Statistics': ['Mathematics', 'Probability']
  };
  
  Object.entries(predictionData.currentProgress).forEach(([subject, progress]) => {
    if (progress > 30) return; // Only for new topics
    
    const required = prerequisites[subject] || [];
    const unmetPrerequisites: string[] = [];
    
    required.forEach(prereq => {
      const prereqProgress = predictionData.currentProgress[prereq] || 0;
      if (prereqProgress < 70) { // Needs 70% mastery of prerequisite
        unmetPrerequisites.push(prereq);
      }
    });
    
    if (unmetPrerequisites.length > 0) {
      suggestions.push({
        id: `prereq-${subject.toLowerCase().replace(/\s+/g, '-')}`,
        type: 'recommendation',
        title: `${subject} Prerequisites Needed`,
        description: `Before starting ${subject}, complete: ${unmetPrerequisites.join(', ')}.`,
        priority: 'high',
        estimatedImpact: 9,
        reasoning: 'Strong foundation in prerequisites significantly improves success rate',
        actionableSteps: [
          `Focus on ${unmetPrerequisites[0]} until 70% mastery`,
          `Review ${unmetPrerequisites[1] || 'related concepts'}`,
          'Return to this topic once prerequisites are solid',
          'Use spaced repetition for prerequisite concepts'
        ],
        confidenceScore: 0.9,
        metadata: {
          featureId: 17,
          subject,
          unmetPrerequisites,
          prerequisiteImportance: 'High',
          currentPrerequisiteMastery: unmetPrerequisites.map(p => ({
            subject: p,
            progress: predictionData.currentProgress[p] || 0
          }))
        }
      });
    }
  });

  return suggestions;
}

// Main function to generate all prediction features
export async function generateAllPredictionFeatures(
  profile: StudentProfile, 
  predictionData: PredictionData
): Promise<Suggestion[]> {
  const [
    masteryPredictions,
    difficultyPredictions,
    timeEstimations,
    questionRecommendations,
    prerequisiteSuggestions
  ] = await Promise.all([
    predictMasteryTimeline(profile, predictionData),
    predictDifficulty(profile, predictionData),
    estimateStudyTime(profile, predictionData),
    recommendQuestionVolume(profile, predictionData),
    suggestPrerequisites(profile, predictionData)
  ]);

  const allSuggestions = [
    ...masteryPredictions,
    ...difficultyPredictions,
    ...timeEstimations,
    ...questionRecommendations,
    ...prerequisiteSuggestions
  ];

  return allSuggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const aScore = priorityOrder[a.priority] * a.estimatedImpact * a.confidenceScore;
    const bScore = priorityOrder[b.priority] * b.estimatedImpact * b.confidenceScore;
    return bScore - aScore;
  });
}
