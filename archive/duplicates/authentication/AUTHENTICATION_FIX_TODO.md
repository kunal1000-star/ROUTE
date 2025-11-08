# Authentication Fix for AI Suggestions - TODO List

## Objective
Fix "Suggestions Unavailable - Received HTML response - please check authentication" error by implementing proper authentication integration between frontend and backend.

## Root Cause
The `safeApiCall` function makes API requests without including authentication headers, causing the backend to return HTML error pages (login redirects) instead of JSON responses.

## Implementation Steps

### 1. Enhanced Authentication Integration
- [ ] Update `safeApiCall` to automatically include auth headers
- [ ] Connect `useAuth` context to API request headers
- [ ] Add automatic token refresh handling

### 2. Improved Error Handling
- [ ] Enhance authentication error messages
- [ ] Add proper user feedback for auth issues
- [ ] Implement retry mechanisms for expired tokens

### 3. Session Management
- [ ] Ensure proper session handling across API calls
- [ ] Add logout handling for auth failures
- [ ] Implement session state synchronization

### 4. Fallback Mechanisms
- [ ] Add offline/cached data fallbacks
- [ ] Implement graceful degradation when auth fails
- [ ] Provide clear user guidance for auth issues

### 5. Testing and Validation
- [ ] Test authentication flow
- [ ] Validate all API endpoints work with auth
- [ ] Test error handling and fallbacks

## Target Files
- `src/lib/utils/safe-api.ts` - Core API utility enhancement
- `src/hooks/use-auth-listener.tsx` - Auth context enhancement
- `src/components/ai/AISuggestionsDashboard.tsx` - Error handling improvements

## Expected Outcome
- AI Suggestions load without "HTML response" errors
- Proper authentication flow throughout the app
- Better user experience with clear error messages
- Robust fallback mechanisms for network/auth issues
