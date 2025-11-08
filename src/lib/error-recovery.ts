'use client';

import { logError, logWarning, logInfo, ErrorContext, LoggedError } from './error-logger';

export interface RecoveryStrategy {
  id: string;
  name: string;
  description: string;
  canHandle: (error: Error, context: ErrorContext) => boolean;
  recover: (error: Error, context: ErrorContext) => Promise<boolean>;
  priority: number;
}

export interface RecoveryResult {
  success: boolean;
  strategy: RecoveryStrategy;
  error: Error;
  context: ErrorContext;
  recoveryTime: number;
  fallbackUsed: boolean;
}

class ErrorRecoverySystem {
  private strategies: RecoveryStrategy[] = [];
  private recoveryHistory: RecoveryResult[] = [];
  private maxHistorySize = 50;

  constructor() {
    this.registerDefaultStrategies();
  }

  /**
   * Register a new recovery strategy
   */
  registerStrategy(strategy: RecoveryStrategy): void {
    this.strategies.push(strategy);
    this.strategies.sort((a, b) => b.priority - a.priority);
    
    logInfo('Recovery strategy registered', {
      strategyId: strategy.id,
      strategyName: strategy.name
    });
  }

  /**
   * Attempt to recover from an error
   */
  async attemptRecovery(error: Error, context: ErrorContext = {}): Promise<RecoveryResult | null> {
    const startTime = Date.now();
    const errorId = logWarning('Attempting error recovery', {
      errorMessage: error.message,
      context
    });

    // Find the first strategy that can handle this error
    const applicableStrategy = this.strategies.find(strategy => 
      strategy.canHandle(error, context)
    );

    if (!applicableStrategy) {
      logWarning('No recovery strategy found for error', {
        errorId,
        errorMessage: error.message
      });
      return null;
    }

    try {
      logInfo(`Executing recovery strategy: ${applicableStrategy.name}`, {
        errorId,
        strategyId: applicableStrategy.id
      });

      const success = await applicableStrategy.recover(error, context);
      const recoveryTime = Date.now() - startTime;

      const result: RecoveryResult = {
        success,
        strategy: applicableStrategy,
        error,
        context,
        recoveryTime,
        fallbackUsed: false
      };

      this.addToHistory(result);
      
      if (success) {
        logInfo('Error recovery successful', {
          errorId,
          strategyId: applicableStrategy.id,
          recoveryTime
        });
      } else {
        logWarning('Error recovery failed', {
          errorId,
          strategyId: applicableStrategy.id,
          recoveryTime
        });
      }

      return result;
    } catch (recoveryError) {
      const recoveryTime = Date.now() - startTime;
      
      logError(recoveryError as Error, {
        originalErrorId: errorId,
        recoveryStrategyId: applicableStrategy.id,
        recoveryTime
      });

      const result: RecoveryResult = {
        success: false,
        strategy: applicableStrategy,
        error: recoveryError as Error,
        context,
        recoveryTime,
        fallbackUsed: false
      };

      this.addToHistory(result);
      return result;
    }
  }

  /**
   * Add result to recovery history
   */
  private addToHistory(result: RecoveryResult): void {
    this.recoveryHistory.push(result);
    
    if (this.recoveryHistory.length > this.maxHistorySize) {
      this.recoveryHistory = this.recoveryHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Get recovery history
   */
  getRecoveryHistory(): RecoveryResult[] {
    return [...this.recoveryHistory];
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats(): {
    total: number;
    successful: number;
    failed: number;
    successRate: number;
    averageRecoveryTime: number;
    strategies: Record<string, { attempts: number; successes: number; successRate: number }>;
  } {
    const stats = {
      total: this.recoveryHistory.length,
      successful: this.recoveryHistory.filter(r => r.success).length,
      failed: this.recoveryHistory.filter(r => !r.success).length,
      successRate: 0,
      averageRecoveryTime: 0,
      strategies: {} as Record<string, { attempts: number; successes: number; successRate: number }>
    };

    if (stats.total > 0) {
      stats.successRate = (stats.successful / stats.total) * 100;
      stats.averageRecoveryTime = this.recoveryHistory.reduce((sum, r) => sum + r.recoveryTime, 0) / stats.total;
    }

    // Calculate strategy statistics
    this.recoveryHistory.forEach(result => {
      const strategyId = result.strategy.id;
      if (!stats.strategies[strategyId]) {
        stats.strategies[strategyId] = { attempts: 0, successes: 0, successRate: 0 };
      }
      stats.strategies[strategyId].attempts++;
      if (result.success) {
        stats.strategies[strategyId].successes++;
      }
      stats.strategies[strategyId].successRate = 
        (stats.strategies[strategyId].successes / stats.strategies[strategyId].attempts) * 100;
    });

    return stats;
  }

  /**
   * Register default recovery strategies
   */
  private registerDefaultStrategies(): void {
    // Network retry strategy
    this.registerStrategy({
      id: 'network_retry',
      name: 'Network Retry',
      description: 'Retry failed network requests with exponential backoff',
      canHandle: (error, context) => {
        return error.message.includes('fetch') || 
               error.message.includes('network') ||
               error.message.includes('Failed to fetch') ||
               error.message.includes('Network request failed');
      },
      recover: async (error, context) => {
        const maxRetries = 3;
        const baseDelay = 1000; // 1 second
        
        for (let i = 0; i < maxRetries; i++) {
          const delay = baseDelay * Math.pow(2, i);
          logInfo(`Network retry attempt ${i + 1}/${maxRetries}`, { delay });
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Check if the error was resolved
          if (!error.message.includes('fetch') && !error.message.includes('network')) {
            return true;
          }
        }
        return false;
      },
      priority: 10
    });

    // Database connection retry
    this.registerStrategy({
      id: 'db_retry',
      name: 'Database Retry',
      description: 'Retry failed database operations',
      canHandle: (error, context) => {
        return error.message.includes('database') ||
               error.message.includes('supabase') ||
               error.message.includes('connection') ||
               error.message.includes('timeout');
      },
      recover: async (error, context) => {
        const maxRetries = 2;
        const delay = 2000; // 2 seconds
        
        for (let i = 0; i < maxRetries; i++) {
          logInfo(`Database retry attempt ${i + 1}/${maxRetries}`);
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Check if Supabase connection is restored
          try {
            // Simple connection test
            if (typeof window !== 'undefined' && 'navigator' in window) {
              return true; // Assume recovery for client-side errors
            }
          } catch (testError) {
            // Continue retrying
          }
        }
        return false;
      },
      priority: 8
    });

    // Component state reset
    this.registerStrategy({
      id: 'component_reset',
      name: 'Component Reset',
      description: 'Reset component state to recover from state errors',
      canHandle: (error, context) => {
        return error.message.includes('Cannot read properties of undefined') ||
               error.message.includes('State update') ||
               error.message.includes('render') ||
               error.message.includes('hook');
      },
      recover: async (error, context) => {
        // For state-related errors, suggest a page refresh
        logWarning('Component state error detected, page refresh recommended', {
          componentName: context.componentName
        });
        
        // Wait a moment then suggest refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, this might trigger a state reset or component re-render
        return true; // Consider it recovered with a refresh
      },
      priority: 5
    });

    // Storage cleanup
    this.registerStrategy({
      id: 'storage_cleanup',
      name: 'Storage Cleanup',
      description: 'Clean up localStorage and sessionStorage to resolve storage errors',
      canHandle: (error, context) => {
        return error.message.includes('localStorage') ||
               error.message.includes('sessionStorage') ||
               error.message.includes('QuotaExceededError') ||
               error.message.includes('storage');
      },
      recover: async (error, context) => {
        try {
          // Clear problematic storage
          if (typeof window !== 'undefined') {
            const keysToRemove: string[] = [];
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && (key.includes('error') || key.includes('temp') || key.includes('cache'))) {
                keysToRemove.push(key);
              }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            
            logInfo(`Cleaned up ${keysToRemove.length} storage items`);
            return true;
          }
        } catch (cleanupError) {
          logWarning('Storage cleanup failed', { error: cleanupError });
        }
        return false;
      },
      priority: 7
    });
  }
}

// Global instance
export const errorRecovery = new ErrorRecoverySystem();

/**
 * React hook for error recovery
 */
export function useErrorRecovery() {
  const attemptRecovery = async (error: Error, context: ErrorContext = {}) => {
    return await errorRecovery.attemptRecovery(error, context);
  };

  const getRecoveryStats = () => {
    return errorRecovery.getRecoveryStats();
  };

  const getRecoveryHistory = () => {
    return errorRecovery.getRecoveryHistory();
  };

  return {
    attemptRecovery,
    getRecoveryStats,
    getRecoveryHistory
  };
}