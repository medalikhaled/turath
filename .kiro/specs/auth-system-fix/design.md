# Authentication System Fix Design

## Overview

The current authentication system is broken due to a missing `useAuth` hook that components are trying to use. The application uses Convex Auth but lacks proper integration. This design will create a comprehensive authentication system that provides consistent auth state management across the application.

The solution involves creating a custom `useAuth` hook that wraps Convex Auth functionality, ensuring proper error handling, loading states, and consistent API across all components.

## Architecture

### Current State Analysis
- Application uses `@convex-dev/auth` with `ConvexAuthNextjsProvider`
- Components are trying to use a `useAuth()` hook that doesn't exist
- Auth actions are available via `useAuthActions` from Convex Auth
- Current user data is fetched via `useQuery(api.auth.getCurrentUser)`
- No centralized auth state management

### Proposed Architecture
```
┌─────────────────────────────────────────┐
│              Application                │
├─────────────────────────────────────────┤
│         Custom useAuth Hook            │
├─────────────────────────────────────────┤
│    Convex Auth (useAuthActions +        │
│    useQuery for current user)           │
├─────────────────────────────────────────┤
│         Convex Backend                  │
└─────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Custom useAuth Hook

**Location:** `hooks/use-auth.ts`

**Interface:**
```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

interface UseAuthReturn extends AuthState, AuthActions {}
```

**Responsibilities:**
- Combine Convex Auth actions with user state
- Provide consistent loading states
- Handle authentication errors
- Manage sign in/out operations

### 2. Enhanced Auth Provider (Optional)

**Location:** `providers/auth-provider.tsx`

**Purpose:**
- Wrap the existing ConvexAuthNextjsProvider
- Provide additional context if needed
- Handle global auth state

### 3. Updated Protected Route Component

**Location:** `components/auth/protected-route.tsx`

**Enhancements:**
- Use the new `useAuth` hook
- Better loading state handling
- Improved error handling

### 4. Auth Utilities

**Location:** `lib/auth-utils.ts`

**Functions:**
- User role checking utilities
- Auth state validation helpers
- Redirect logic

## Data Models

### User Model
```typescript
interface User {
  _id: string
  name: string
  email: string
  role: 'student' | 'admin'
  createdAt: string
  updatedAt: string
}
```

### Auth State Model
```typescript
interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
}
```

## Error Handling

### 1. Hook-Level Error Handling
- Catch authentication errors in the `useAuth` hook
- Provide meaningful error messages
- Reset error state on successful operations

### 2. Component-Level Error Handling
- Display user-friendly error messages
- Provide retry mechanisms
- Handle network errors gracefully

### 3. Global Error Handling
- Catch unhandled auth errors
- Redirect to appropriate pages on auth failures
- Log errors for debugging

## Testing Strategy

### 1. Unit Tests
- Test `useAuth` hook with different auth states
- Test auth utility functions
- Test error handling scenarios

### 2. Integration Tests
- Test sign in/out flow
- Test protected route behavior
- Test auth state persistence

### 3. Component Tests
- Test components with different auth states
- Test loading states
- Test error states

## Implementation Approach

### Phase 1: Core Auth Hook
1. Create the `useAuth` hook that wraps Convex Auth
2. Implement proper loading and error states
3. Test the hook in isolation

### Phase 2: Component Integration
1. Update components to use the new `useAuth` hook
2. Fix the protected route component
3. Update navigation and layout components

### Phase 3: Error Handling & Polish
1. Implement comprehensive error handling
2. Add proper loading states throughout the app
3. Test the complete auth flow

### Phase 4: Cleanup
1. Remove any unused auth-related code
2. Update documentation
3. Verify all auth-related functionality works

## Security Considerations

1. **Session Management:** Leverage Convex Auth's built-in session management
2. **Token Handling:** Use Convex's secure token handling
3. **Route Protection:** Ensure all protected routes are properly secured
4. **Error Messages:** Avoid exposing sensitive information in error messages

## Performance Considerations

1. **Lazy Loading:** Only load auth state when needed
2. **Caching:** Leverage Convex's built-in caching for user data
3. **Minimal Re-renders:** Optimize hook to minimize unnecessary re-renders
4. **Error Recovery:** Implement efficient error recovery mechanisms