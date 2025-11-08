'use client';

// Error logging and tracking system
export interface ErrorContext {
  componentName?: string;
  errorId?: string;
  componentStack?: string;
  timestamp?: string;
  userAgent?: string;
  url?: string;
  type?: string;
  context?: any;
  [key: string]: any;
}

export interface LoggedError {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  resolved: boolean;
}

// In-memory error storage (in production, this would go to a service like Sentry)
let errorStore: LoggedError[] = [];
let errorListeners: ((error: LoggedError) => void)[] = [];

const ERROR_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info'
} as const;

/**
 * Generate a unique error ID
 */
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Main error logging function
 */
export function logError(error: Error, context: ErrorContext = {}): string {
  const errorId = context.errorId || generateErrorId();
  const timestamp = new Date().toISOString();
  
  // Merge context with additional info
  const fullContext: ErrorContext = {
    ...context,
    errorId,
    timestamp,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    ...getExtraContext()
  };

  const loggedError: LoggedError = {
    id: errorId,
    message: error.message,
    stack: error.stack,
    context: fullContext,
    timestamp,
    level: ERROR_LEVELS.ERROR,
    resolved: false
  };

  // Store error
  errorStore.push(loggedError);
  
  // Keep only last 100 errors to prevent memory issues
  if (errorStore.length > 100) {
    errorStore = errorStore.slice(-100);
  }

  // Notify listeners
  errorListeners.forEach(listener => {
    try {
      listener(loggedError);
    } catch (listenerError) {
      console.error('Error in error listener:', listenerError);
    }
  });

  // Console logging for development
  if (process.env.NODE_ENV === 'development') {
    console.group(`🚨 Error Logged [${errorId}]`);
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('Context:', fullContext);
    console.groupEnd();
  }

  return errorId;
}

/**
 * Log warnings
 */
export function logWarning(message: string, context: ErrorContext = {}): string {
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();

  const loggedError: LoggedError = {
    id: errorId,
    message,
    context: {
      ...context,
      errorId,
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      ...getExtraContext()
    },
    timestamp,
    level: ERROR_LEVELS.WARN,
    resolved: false
  };

  errorStore.push(loggedError);

  if (errorStore.length > 100) {
    errorStore = errorStore.slice(-100);
  }

  errorListeners.forEach(listener => {
    try {
      listener(loggedError);
    } catch (listenerError) {
      console.error('Error in warning listener:', listenerError);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.warn(`⚠️ Warning Logged [${errorId}]`, message, context);
  }

  return errorId;
}

/**
 * Log info messages
 */
export function logInfo(message: string, context: ErrorContext = {}): string {
  const errorId = generateErrorId();
  const timestamp = new Date().toISOString();

  const loggedError: LoggedError = {
    id: errorId,
    message,
    context: {
      ...context,
      errorId,
      timestamp,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
      ...getExtraContext()
    },
    timestamp,
    level: ERROR_LEVELS.INFO,
    resolved: false
  };

  errorStore.push(loggedError);

  if (errorStore.length > 100) {
    errorStore = errorStore.slice(-100);
  }

  errorListeners.forEach(listener => {
    try {
      listener(loggedError);
    } catch (listenerError) {
      console.error('Error in info listener:', listenerError);
    }
  });

  if (process.env.NODE_ENV === 'development') {
    console.info(`ℹ️ Info Logged [${errorId}]`, message, context);
  }

  return errorId;
}

/**
 * Get additional context information
 */
function getExtraContext(): Record<string, any> {
  try {
    return {
      viewport: typeof window !== 'undefined' ? {
        width: window.innerWidth,
        height: window.innerHeight
      } : null,
      timestamp: new Date().toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    };
  } catch {
    return {};
  }
}

/**
 * Get all logged errors
 */
export function getLoggedErrors(): LoggedError[] {
  return [...errorStore];
}

/**
 * Get errors by level
 */
export function getErrorsByLevel(level: 'error' | 'warn' | 'info'): LoggedError[] {
  return errorStore.filter(error => error.level === level);
}

/**
 * Get errors by component
 */
export function getErrorsByComponent(componentName: string): LoggedError[] {
  return errorStore.filter(error => error.context.componentName === componentName);
}

/**
 * Mark error as resolved
 */
export function markErrorResolved(errorId: string): boolean {
  const error = errorStore.find(e => e.id === errorId);
  if (error) {
    error.resolved = true;
    return true;
  }
  return false;
}

/**
 * Clear all errors
 */
export function clearErrors(): void {
  errorStore = [];
}

/**
 * Add error listener
 */
export function addErrorListener(listener: (error: LoggedError) => void): () => void {
  errorListeners.push(listener);
  return () => {
    const index = errorListeners.indexOf(listener);
    if (index > -1) {
      errorListeners.splice(index, 1);
    }
  };
}

/**
 * Get error statistics
 */
export function getErrorStats(): {
  total: number;
  errors: number;
  warnings: number;
  info: number;
  resolved: number;
  unresolved: number;
  byComponent: Record<string, number>;
} {
  const stats = {
    total: errorStore.length,
    errors: errorStore.filter(e => e.level === 'error').length,
    warnings: errorStore.filter(e => e.level === 'warn').length,
    info: errorStore.filter(e => e.level === 'info').length,
    resolved: errorStore.filter(e => e.resolved).length,
    unresolved: errorStore.filter(e => !e.resolved).length,
    byComponent: {} as Record<string, number>
  };

  // Count by component
  errorStore.forEach(error => {
    const component = error.context.componentName || 'Unknown';
    stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;
  });

  return stats;
}

/**
 * Export errors for debugging
 */
export function exportErrors(): string {
  const data = {
    exportDate: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'Unknown',
    errors: errorStore,
    stats: getErrorStats()
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Handle unhandled promise rejections
 */
export function setupGlobalErrorHandling() {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = new Error(`Unhandled Promise Rejection: ${event.reason}`);
    logError(error, {
      type: 'unhandled_rejection',
      reason: event.reason
    });
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = new Error(`Global Error: ${event.error?.message || event.message}`);
    logError(error, {
      type: 'global_error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });
}

// Auto-setup global error handling
if (typeof window !== 'undefined') {
  setupGlobalErrorHandling();
}