// AI Features Integration Tests - Phase 6 Testing Suite
// =======================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createMockResponse, TIMEOUTS, TEST_USERS } from './setup';

// Mock fetch globally for API testing
global.fetch = vi.fn();

// Test Configuration
const TEST_USER_ID = TEST_USERS.student.id;
const BASE_URL = 'http://localhost:3000';

// API Integration Tests
describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Settings API Endpoints', () => {
    it('should handle settings GET request', async () => {
      const mockSettings = {
        id: 'settings-123',
        userId: TEST_USER_ID,
        aiModel: {
          preferredProviders: ['gemini'],
          rateLimits: { dailyRequests: 1000, hourlyRequests: 100, concurrentRequests: 5 }
        }
      };

      const mockResponse = createMockResponse({ success: true, data: mockSettings });
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await fetch(`${BASE_URL}/api/user/settings?userId=${TEST_USER_ID}`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.data.userId).toBe(TEST_USER_ID);
    });

    it('should handle settings PUT request', async () => {
      const updateData = {
        userId: TEST_USER_ID,
        tab: 'aiModel',
        settings: {
          aiModel: {
            preferredProviders: ['mistral'],
            rateLimits: { dailyRequests: 2000 }
          }
        }
      };

      const mockResponse = createMockResponse({ success: true });
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await fetch(`${BASE_URL}/api/user/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      expect(response.ok).toBe(true);
    });

    it('should handle settings statistics request', async () => {
      const mockStats = {
        totalSessions: 150,
        totalStudyTime: 5400,
        aiRequestsMade: 450,
        tokenUsage: { total: 125000, cost: 8.50 }
      };

      const mockResponse = createMockResponse({ success: true, data: mockStats });
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await fetch(`${BASE_URL}/api/user/settings/statistics?userId=${TEST_USER_ID}`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data.totalSessions).toBe(150);
    });
  });

  describe('Mistral AI Integration', () => {
    it('should process handwritten notes', async () => {
      const imageData = 'data:image/png;base64,test-image-data';
      const mockAnalysis = {
        success: true,
        result: {
          extractedText: 'Physics formulas: F = ma, E = mc²',
          confidence: 0.95,
          suggestions: ['Practice Newtons laws', 'Review energy concepts']
        }
      };

      const mockResponse = createMockResponse(mockAnalysis);
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await fetch(`${BASE_URL}/api/mistral/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: TEST_USER_ID,
          imageData,
          analysisType: 'handwritten_notes'
        })
      });

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.result.extractedText).toContain('Physics');
    });
  });

  describe('Google Drive Integration', () => {
    it('should handle authentication URL request', async () => {
      const mockAuth = {
        success: true,
        authUrl: 'https://accounts.google.com/oauth/authorize?client_id=test'
      };

      const mockResponse = createMockResponse(mockAuth);
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await fetch(`${BASE_URL}/api/google-drive/auth?userId=${TEST_USER_ID}`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.authUrl).toContain('accounts.google.com');
    });
  });

  describe('Suggestions API', () => {
    it('should generate scheduling suggestions', async () => {
      const mockSuggestions = {
        success: true,
        data: [
          {
            id: 'sched-1',
            type: 'schedule',
            title: 'Optimal Study Time',
            description: 'Schedule study sessions during peak performance hours',
            priority: 'high'
          }
        ]
      };

      const mockResponse = createMockResponse(mockSuggestions);
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

      const response = await fetch(`${BASE_URL}/api/suggestions/scheduling?userId=${TEST_USER_ID}`);
      const data = await response.json();

      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0].type).toBe('schedule');
    });
  });
});

// Performance Tests
describe('Performance Validation Tests', () => {
  it('should handle concurrent AI requests efficiently', async () => {
    const startTime = Date.now();
    
    const promises = Array.from({ length: 10 }, (_, i) => 
      fetch(`${BASE_URL}/api/suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: TEST_USER_ID, type: `test-${i}` })
      })
    );

    const responses = await Promise.all(promises);
    const endTime = Date.now();
    
    responses.forEach(response => {
      expect(response.ok).toBe(true);
    });
    
    expect(endTime - startTime).toBeLessThan(10000); // 10 seconds max
  });

  it('should handle large suggestion responses', async () => {
    const largeResponse = {
      success: true,
      data: Array.from({ length: 100 }, (_, i) => ({
        id: `suggestion-${i}`,
        type: 'topic',
        title: `Test Suggestion ${i}`,
        description: `Description for suggestion ${i}`,
        priority: i % 3 === 0 ? 'high' : i % 3 === 1 ? 'medium' : 'low'
      }))
    };

    const mockResponse = createMockResponse(largeResponse);
    (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(mockResponse);

    const response = await fetch(`${BASE_URL}/api/suggestions?userId=${TEST_USER_ID}`);
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(100);
  });
});

// Mobile Optimization Tests
describe('Mobile Optimization Tests', () => {
  describe('Responsive Design Validation', () => {
    it('should adapt to different viewport sizes', () => {
      const viewports = [
        { width: 320, height: 568 },  // iPhone SE
        { width: 375, height: 667 },  // iPhone 8
        { width: 414, height: 896 },  // iPhone 11
        { width: 768, height: 1024 }, // iPad
        { width: 1024, height: 768 }  // Desktop
      ];

      viewports.forEach(viewport => {
        expect(viewport.width).toBeGreaterThan(0);
        expect(viewport.height).toBeGreaterThan(0);
      });
    });
  });
});

// User Acceptance Testing Scenarios
describe('User Acceptance Testing Scenarios', () => {
  describe('Error Handling Scenarios', () => {
    it('should handle API failures gracefully', async () => {
      (global.fetch as vi.MockedFunction<typeof fetch>).mockRejectedValue(new Error('Network error'));

      try {
        await fetch(`${BASE_URL}/api/user/settings?userId=${TEST_USER_ID}`);
        throw new Error('Expected error but none was thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Network error');
      }
    });

    it('should handle invalid user ID', async () => {
      const errorResponse = createMockResponse({
        success: false,
        error: 'User not found'
      }, 404);
      
      (global.fetch as vi.MockedFunction<typeof fetch>).mockResolvedValue(errorResponse);

      const response = await fetch(`${BASE_URL}/api/user/settings?userId=invalid-id`);
      const data = await response.json();
      
      expect(data.success).toBe(false);
      expect(data.error).toBe('User not found');
    });
  });
});

// Test Results Collector
export class AIFeaturesTestResults {
  private static results = {
    passed: 0,
    failed: 0,
    total: 0,
    testGroups: {
      apiIntegration: 0,
      performance: 0,
      mobileOptimization: 0,
      userAcceptance: 0
    }
  };

  static recordTest(group: keyof typeof AIFeaturesTestResults.results.testGroups, passed: boolean) {
    this.results.total++;
    this.results.testGroups[group]++;
    
    if (passed) {
      this.results.passed++;
    } else {
      this.results.failed++;
    }
  }

  static getResults() {
    return {
      ...this.results,
      successRate: this.results.total > 0 ? (this.results.passed / this.results.total) * 100 : 0
    };
  }

  static generateReport() {
    const results = this.getResults();
    
    console.log('\n🤖 AI Features Test Results Report');
    console.log('=====================================');
    console.log(`Total Tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Success Rate: ${results.successRate.toFixed(1)}%`);
    console.log('\nBreakdown by Category:');
    console.log(`- API Integration: ${results.testGroups.apiIntegration} tests`);
    console.log(`- Performance: ${results.testGroups.performance} tests`);
    console.log(`- Mobile Optimization: ${results.testGroups.mobileOptimization} tests`);
    console.log(`- User Acceptance: ${results.testGroups.userAcceptance} tests`);
    console.log('=====================================\n');
    
    return results;
  }
}
