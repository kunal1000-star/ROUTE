// AI System Diagnostic Tool
// ========================

import { groqClient } from '@/lib/ai/providers/groq-client';
import { geminiClient } from '@/lib/ai/providers/gemini-client';
import { mistralClient } from '@/lib/ai/providers/mistral-client';
import { cerebrasClient } from '@/lib/ai/providers/cerebras-client';
import { cohereClient } from '@/lib/ai/providers/cohere-client';
import { openRouterClient } from '@/lib/ai/providers/openrouter-client';
import { aiServiceManager } from '@/lib/ai/ai-service-manager-unified';
import { responseCache } from '@/lib/ai/response-cache';
import { apiUsageLogger } from '@/lib/ai/api-logger';
import { rateLimitTracker } from '@/lib/ai/rate-limit-tracker';

export interface DiagnosticResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  error?: string;
  details?: any;
  responseTime?: number;
}

export interface SystemDiagnostic {
  timestamp: string;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'BROKEN';
  results: DiagnosticResult[];
  recommendations: string[];
  environmentInfo: {
    nodeVersion: string;
    hasApiKeys: boolean;
    availableProviders: string[];
  };
}

export class AISystemDiagnostic {
  private results: DiagnosticResult[] = [];

  async runFullDiagnostic(): Promise<SystemDiagnostic> {
    console.log('🔍 Starting AI System Diagnostic...\n');
    this.results = [];

    // Test environment
    await this.testEnvironment();

    // Test individual providers
    await this.testGroqProvider();
    await this.testGeminiProvider();
    await this.testMistralProvider();
    await this.testCerebrasProvider();
    await this.testCohereProvider();
    await this.testOpenRouterProvider();

    // Test supporting services
    await this.testSupportingServices();

    // Test service manager
    await this.testServiceManager();

    // Test chat integration
    await this.testChatIntegration();

    // Generate recommendations
    const recommendations = this.generateRecommendations();
    
    // Determine overall status
    const overallStatus = this.determineOverallStatus();

    const diagnostic: SystemDiagnostic = {
      timestamp: new Date().toISOString(),
      overallStatus,
      results: this.results,
      recommendations,
      environmentInfo: {
        nodeVersion: process.version,
        hasApiKeys: this.checkApiKeys(),
        availableProviders: this.getAvailableProviders()
      }
    };

    this.printDiagnosticReport(diagnostic);
    return diagnostic;
  }

  private async testEnvironment() {
    console.log('📋 Testing Environment...');
    
    try {
      // Check if all required environment variables are present
      const requiredEnvVars = [
        'GROQ_API_KEY',
        'GEMINI_API_KEY', 
        'MISTRAL_API_KEY',
        'CEREBRAS_API_KEY',
        'COHERE_API_KEY',
        'OPENROUTER_API_KEY'
      ];

      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        this.addResult('Environment', 'WARN', `Missing environment variables: ${missingVars.join(', ')}`, { missingVars });
      } else {
        this.addResult('Environment', 'PASS', 'All required environment variables present');
      }

      // Check API key formats
      const apiKeyValidation = this.validateApiKeys();
      this.addResult('API Key Format', apiKeyValidation.status, apiKeyValidation.error, apiKeyValidation.details);

    } catch (error) {
      this.addResult('Environment', 'FAIL', `Environment test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async testGroqProvider() {
    console.log('🔧 Testing Groq Provider...');
    await this.testProvider('Groq', groqClient, 'gsk_');
  }

  private async testGeminiProvider() {
    console.log('🔧 Testing Gemini Provider...');
    await this.testProvider('Gemini', geminiClient, 'AIza');
  }

  private async testMistralProvider() {
    console.log('🔧 Testing Mistral Provider...');
    await this.testProvider('Mistral', mistralClient, null); // Mistral keys don't have specific prefix
  }

  private async testCerebrasProvider() {
    console.log('🔧 Testing Cerebras Provider...');
    await this.testProvider('Cerebras', cerebrasClient, 'csk-');
  }

  private async testCohereProvider() {
    console.log('🔧 Testing Cohere Provider...');
    await this.testProvider('Cohere', cohereClient, null); // Cohere keys don't have specific prefix
  }

  private async testOpenRouterProvider() {
    console.log('🔧 Testing OpenRouter Provider...');
    await this.testProvider('OpenRouter', openRouterClient, 'sk-or-');
  }

  private async testProvider(name: string, client: any, expectedPrefix: string | null) {
    const startTime = Date.now();
    
    try {
      // Test client initialization
      if (!client) {
        this.addResult(`${name} Client`, 'FAIL', 'Client not initialized');
        return;
      }

      // Test health check
      const healthResult = await client.healthCheck();
      const responseTime = Date.now() - startTime;

      if (healthResult.healthy) {
        this.addResult(`${name} Health Check`, 'PASS', 'Provider is healthy', { 
          responseTime: healthResult.responseTime,
          responseTimeMs: responseTime
        });
      } else {
        this.addResult(`${name} Health Check`, 'FAIL', `Provider health check failed: ${healthResult.error}`, {
          responseTime: healthResult.responseTime,
          error: healthResult.error
        });
      }

      // Test API key format if prefix is specified
      if (expectedPrefix) {
        const apiKeyStatus = this.validateApiKeyFormat(name, expectedPrefix);
        this.addResult(`${name} API Key Format`, apiKeyStatus.status, apiKeyStatus.error, apiKeyStatus.details);
      }

    } catch (error) {
      this.addResult(`${name} Provider`, 'FAIL', `${name} test failed: ${error instanceof Error ? error.message : String(error)}`, {
        responseTime: Date.now() - startTime
      });
    }
  }

  private async testSupportingServices() {
    console.log('🛠️ Testing Supporting Services...');

    try {
      // Test response cache
      if (responseCache) {
        const testKey = 'test-key';
        const testValue = { content: 'test', cached: true };
        responseCache.set({ userId: 'test', message: 'test', conversationId: 'test', chatType: 'general' }, testValue as any);
        const retrieved = responseCache.get({ userId: 'test', message: 'test', conversationId: 'test', chatType: 'general' });
        this.addResult('Response Cache', retrieved ? 'PASS' : 'FAIL', retrieved ? 'Cache working' : 'Cache not working');
      } else {
        this.addResult('Response Cache', 'FAIL', 'Response cache not available');
      }
    } catch (error) {
      this.addResult('Response Cache', 'FAIL', `Cache test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      // Test API logger
      if (apiUsageLogger) {
        await apiUsageLogger.logEntry({
          userId: 'test',
          featureName: 'diagnostic',
          provider: 'test',
          modelUsed: 'test',
          tokensInput: 1,
          tokensOutput: 1,
          latencyMs: 100,
          cached: false,
          success: true
        });
        this.addResult('API Logger', 'PASS', 'API logger working');
      } else {
        this.addResult('API Logger', 'FAIL', 'API logger not available');
      }
    } catch (error) {
      this.addResult('API Logger', 'FAIL', `Logger test failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      // Test rate limit tracker
      if (rateLimitTracker) {
        const status = rateLimitTracker.checkRateLimit('groq');
        this.addResult('Rate Limit Tracker', status ? 'PASS' : 'FAIL', status ? 'Rate limiter working' : 'Rate limiter not working');
      } else {
        this.addResult('Rate Limit Tracker', 'FAIL', 'Rate limit tracker not available');
      }
    } catch (error) {
      this.addResult('Rate Limit Tracker', 'FAIL', `Rate limit test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async testServiceManager() {
    console.log('🎛️ Testing AI Service Manager...');

    try {
      if (!aiServiceManager) {
        this.addResult('Service Manager', 'FAIL', 'Service manager not available');
        return;
      }

      // Test service manager health check
      const healthResult = await aiServiceManager.healthCheck();
      const healthyProviders = Object.entries(healthResult).filter(([_, result]) => result.healthy).length;
      const totalProviders = Object.keys(healthResult).length;

      if (healthyProviders === totalProviders) {
        this.addResult('Service Manager', 'PASS', `All ${totalProviders} providers healthy`, { healthResult });
      } else if (healthyProviders > 0) {
        this.addResult('Service Manager', 'WARN', `${healthyProviders}/${totalProviders} providers healthy`, { 
          healthResult,
          healthyProviders,
          totalProviders
        });
      } else {
        this.addResult('Service Manager', 'FAIL', 'No providers healthy', { healthResult });
      }

    } catch (error) {
      this.addResult('Service Manager', 'FAIL', `Service manager test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async testChatIntegration() {
    console.log('💬 Testing Chat Integration...');

    try {
      // Test a simple query through the service manager
      const testRequest = {
        userId: 'diagnostic-test-user',
        conversationId: 'diagnostic-test-conversation',
        message: 'Hello, this is a diagnostic test. Please respond with a simple greeting.',
        chatType: 'general',
        includeAppData: false
      };

      const startTime = Date.now();
      const response = await aiServiceManager.processQuery(testRequest);
      const responseTime = Date.now() - startTime;

      if (response && response.content) {
        this.addResult('Chat Integration', 'PASS', 'Chat API working', { 
          responseTime,
          provider: response.provider,
          model: response.model_used,
          contentLength: response.content.length,
          isFallback: response.fallback_used
        });
      } else {
        this.addResult('Chat Integration', 'FAIL', 'Chat API returned empty response', { response });
      }

    } catch (error) {
      this.addResult('Chat Integration', 'FAIL', `Chat integration test failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private validateApiKeys(): { status: 'PASS' | 'FAIL' | 'WARN', error?: string, details?: any } {
    const apiKeys = {
      GROQ: process.env.GROQ_API_KEY,
      GEMINI: process.env.GEMINI_API_KEY,
      MISTRAL: process.env.MISTRAL_API_KEY,
      CEREBRAS: process.env.CEREBRAS_API_KEY,
      COHERE: process.env.COHERE_API_KEY,
      OPENROUTER: process.env.OPENROUTER_API_KEY
    };

    const validationResults: Record<string, { present: boolean, valid: boolean, error?: string }> = {};

    // Test Groq
    if (apiKeys.GROQ) {
      const valid = apiKeys.GROQ.startsWith('gsk_') && apiKeys.GROQ.length > 20;
      validationResults.groq = { present: true, valid, error: valid ? undefined : 'Invalid Groq API key format' };
    } else {
      validationResults.groq = { present: false, valid: false };
    }

    // Test Gemini
    if (apiKeys.GEMINI) {
      const valid = apiKeys.GEMINI.length > 20;
      validationResults.gemini = { present: true, valid, error: valid ? undefined : 'Invalid Gemini API key format' };
    } else {
      validationResults.gemini = { present: false, valid: false };
    }

    // Test other providers similarly
    const otherProviders = ['MISTRAL', 'CEREBRAS', 'COHERE', 'OPENROUTER'] as const;
    for (const provider of otherProviders) {
      if (apiKeys[provider]) {
        validationResults[provider.toLowerCase()] = { present: true, valid: true };
      } else {
        validationResults[provider.toLowerCase()] = { present: false, valid: false };
      }
    }

    const missingKeys = Object.entries(validationResults).filter(([_, result]) => !result.present).map(([name]) => name);
    const invalidKeys = Object.entries(validationResults).filter(([_, result]) => result.present && !result.valid).map(([name]) => name);

    if (missingKeys.length > 0) {
      return { 
        status: 'FAIL', 
        error: `Missing API keys: ${missingKeys.join(', ')}`, 
        details: validationResults 
      };
    } else if (invalidKeys.length > 0) {
      return { 
        status: 'WARN', 
        error: `Invalid API key formats: ${invalidKeys.join(', ')}`, 
        details: validationResults 
      };
    } else {
      return { 
        status: 'PASS', 
        details: validationResults 
      };
    }
  }

  private validateApiKeyFormat(provider: string, expectedPrefix: string): { status: 'PASS' | 'FAIL' | 'WARN', error?: string, details?: any } {
    const envVarMap: Record<string, string> = {
      'Groq': 'GROQ_API_KEY',
      'Gemini': 'GEMINI_API_KEY',
      'Mistral': 'MISTRAL_API_KEY',
      'Cerebras': 'CEREBRAS_API_KEY',
      'Cohere': 'COHERE_API_KEY',
      'OpenRouter': 'OPENROUTER_API_KEY'
    };

    const envVar = envVarMap[provider];
    const apiKey = process.env[envVar];

    if (!apiKey) {
      return { status: 'FAIL', error: `${provider} API key not found` };
    }

    if (expectedPrefix && !apiKey.startsWith(expectedPrefix)) {
      return { status: 'WARN', error: `${provider} API key format may be invalid (expected to start with ${expectedPrefix})` };
    }

    return { status: 'PASS' };
  }

  private checkApiKeys(): boolean {
    const requiredKeys = ['GROQ_API_KEY', 'GEMINI_API_KEY', 'MISTRAL_API_KEY', 'CEREBRAS_API_KEY', 'COHERE_API_KEY', 'OPENROUTER_API_KEY'];
    return requiredKeys.every(key => !!process.env[key]);
  }

  private getAvailableProviders(): string[] {
    const available: string[] = [];
    if (process.env.GROQ_API_KEY) available.push('groq');
    if (process.env.GEMINI_API_KEY) available.push('gemini');
    if (process.env.MISTRAL_API_KEY) available.push('mistral');
    if (process.env.CEREBRAS_API_KEY) available.push('cerebras');
    if (process.env.COHERE_API_KEY) available.push('cohere');
    if (process.env.OPENROUTER_API_KEY) available.push('openrouter');
    return available;
  }

  private generateRecommendations(): string[] {
    const recommendations: string[] = [];
    const results = this.results;

    // Check for common issues
    const failedComponents = results.filter(r => r.status === 'FAIL').map(r => r.component);
    const warnComponents = results.filter(r => r.status === 'WARN').map(r => r.component);

    if (failedComponents.length > 0) {
      recommendations.push(`🔴 Critical: Fix failed components: ${failedComponents.join(', ')}`);
    }

    if (warnComponents.length > 0) {
      recommendations.push(`🟡 Warning: Address components with warnings: ${warnComponents.join(', ')}`);
    }

    // Specific recommendations based on results
    const serviceManagerResult = results.find(r => r.component === 'Service Manager');
    if (serviceManagerResult?.status === 'FAIL') {
      recommendations.push('🔧 Service Manager: Check provider import compatibility and health check logic');
    }

    const chatIntegrationResult = results.find(r => r.component === 'Chat Integration');
    if (chatIntegrationResult?.status === 'FAIL') {
      recommendations.push('💬 Chat Integration: Verify chat API routes and service manager integration');
    }

    const environmentResult = results.find(r => r.component === 'Environment');
    if (environmentResult?.status === 'FAIL') {
      recommendations.push('📋 Environment: Ensure all required environment variables are set');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All systems appear to be functioning correctly');
    }

    return recommendations;
  }

  private determineOverallStatus(): 'HEALTHY' | 'DEGRADED' | 'BROKEN' {
    const results = this.results;
    const failCount = results.filter(r => r.status === 'FAIL').length;
    const warnCount = results.filter(r => r.status === 'WARN').length;
    const passCount = results.filter(r => r.status === 'PASS').length;

    if (failCount > 0) {
      if (failCount >= results.length * 0.5) {
        return 'BROKEN';
      } else {
        return 'DEGRADED';
      }
    } else if (warnCount > 0) {
      return 'DEGRADED';
    } else if (passCount > 0) {
      return 'HEALTHY';
    } else {
      return 'BROKEN';
    }
  }

  private addResult(component: string, status: 'PASS' | 'FAIL' | 'WARN', message: string, details?: any) {
    this.results.push({ component, status, error: status === 'PASS' ? undefined : message, details });
  }

  private printDiagnosticReport(diagnostic: SystemDiagnostic) {
    console.log('\n' + '='.repeat(80));
    console.log('🔍 AI SYSTEM DIAGNOSTIC REPORT');
    console.log('='.repeat(80));

    console.log(`\n📅 Timestamp: ${diagnostic.timestamp}`);
    console.log(`🎯 Overall Status: ${this.getStatusEmoji(diagnostic.overallStatus)} ${diagnostic.overallStatus}`);

    console.log('\n📋 Component Status:');
    for (const result of diagnostic.results) {
      const emoji = this.getStatusEmoji(result.status);
      console.log(`  ${emoji} ${result.component}: ${result.status}`);
      if (result.error) {
        console.log(`    └─ ${result.error}`);
      }
    }

    console.log('\n🔧 Environment Info:');
    console.log(`  • Node.js Version: ${diagnostic.environmentInfo.nodeVersion}`);
    console.log(`  • API Keys Available: ${diagnostic.environmentInfo.hasApiKeys ? '✅' : '❌'}`);
    console.log(`  • Providers: ${diagnostic.environmentInfo.availableProviders.join(', ')}`);

    console.log('\n💡 Recommendations:');
    for (const recommendation of diagnostic.recommendations) {
      console.log(`  ${recommendation}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'PASS':
      case 'HEALTHY':
        return '✅';
      case 'FAIL':
      case 'BROKEN':
        return '❌';
      case 'WARN':
      case 'DEGRADED':
        return '⚠️';
      default:
        return '❓';
    }
  }
}

// Export for use in other modules
export const diagnostic = new AISystemDiagnostic();

// Quick test function
export async function runQuickTest(): Promise<void> {
  const diagnostic = new AISystemDiagnostic();
  const result = await diagnostic.runFullDiagnostic();
  return result.overallStatus;
}

// Main execution
if (require.main === module) {
  runQuickTest().catch(console.error);
}
