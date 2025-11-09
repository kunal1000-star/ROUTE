// Layer 4: User Feedback & Learning System - Main Exports
// =======================================================

// Layer 4 Service - Orchestration layer
import { Layer4Service } from './Layer4Service';
export const layer4Service = new Layer4Service();

// Convenience functions that delegate to layer4Service
export const processUserFeedbackAndLearning = (request: any) =>
  layer4Service.processUserFeedbackAndLearning(request);

export const collectQuickFeedback = (userId: string, interactionId: string, feedback: any) =>
  layer4Service.collectQuickFeedback(userId, interactionId, feedback);

export const analyzePatterns = (userId: string, patternType: string, timeRange: any) =>
  layer4Service.analyzePatterns(userId, patternType, timeRange);

export const personalizeForUser = (userId: string, interaction: any, preferences: any) =>
  layer4Service.personalizeForUser(userId, interaction, preferences);

export const learnFromFeedback = (feedback: any, learningType?: string) =>
  layer4Service.learnFromFeedback(feedback, learningType);

// Core component exports
export { FeedbackCollector, feedbackCollector } from './FeedbackCollector';
export { LearningEngine, learningEngine } from './LearningEngine';
export { PatternRecognizer, patternRecognizer } from './PatternRecognizer';

// PersonalizationEngine - class and singleton export for consistency
export { PersonalizationEngine, personalizationEngine } from './PersonalizationEngine';

// Utility exports from components
export {
  collectFeedback,
  collectImplicitFeedback,
  analyzeFeedbackPatterns,
  trackUserSatisfaction,
  identifyCommonIssues,
  correlateFeedbackWithQuality
} from './FeedbackCollector';

export {
  learnFromFeedback as learnFromFeedbackData,
  analyzeCorrections,
  recognizePatterns as recognizePatternData,
  detectHallucinations
} from './LearningEngine';

export {
  recognizePatterns,
  detectBehavioralPatterns,
  detectFeedbackPatterns,
  detectQualityPatterns,
  analyzePatternEvolution,
  getPatternInsights
} from './PatternRecognizer';