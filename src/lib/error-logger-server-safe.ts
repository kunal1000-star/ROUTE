// Server-safe Error Logger
// This is a version that works on both client and server

import { logError as originalLogError, logWarning, logInfo, type ErrorContext } from './error-logger';

// Server-safe logError that falls back to console.error
export function logError(error: Error, context: ErrorContext = {}): string {
  // Check if we're on the server
  if (typeof window === 'undefined') {
    // Server-side: use console.error
    const errorId = `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.error(`[${errorId}] ${error.message}`, context);
    return errorId;
  } else {
    // Client-side: use original error logger
    return originalLogError(error, context);
  }
}

export { logWarning, logInfo };
export type { ErrorContext };