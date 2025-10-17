# Implementation Plan

- [x] 1. Set up core cryptographic authentication services





  - Create clean crypto service layer following The Copenhagen Book guidelines
  - Implement Argon2id password hashing, secure OTP generation, and session management
  - Remove dependency on overcomplicated existing auth utilities
  - _Requirements: 8.1, 8.2, 8.3_


- [x] 1.1 Create secure cryptographic service

  - Write `lib/crypto-service.ts` with Argon2id password hashing following Copenhagen Book
  - Implement secure OTP generation using Web Crypto API
  - Add session token creation and verification with proper security
  - _Requirements: 8.1, 8.2, 8.3_


- [x] 1.2 Create clean authentication service layer

  - Write `lib/auth-service.ts` with unified authentication interface
  - Implement admin OTP flow and student password flow
  - Add session management with proper expiration handling
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.1, 3.2_

- [ ]* 1.3 Write unit tests for cryptographic services
  - Test Argon2id password hashing and verification functions
  - Test OTP generation and validation logic
  - Test session token creation and verification
  - _Requirements: 8.1, 8.2, 8.3_

- [x] 2. Update Convex schema and database functions




  - Simplify database schema to remove redundant tables
  - Create clean Convex functions for authentication operations
  - Remove Arabic logging and verbose error messages from backend
  - _Requirements: 1.1, 2.1, 3.4, 6.5_

- [x] 2.1 Update Convex schema for clean authentication


  - Modify `convex/schema.ts` to use simplified user and session tables
  - Remove redundant fields and optimize indexes
  - Add proper TypeScript types for all database operations
  - _Requirements: 1.1, 2.1, 3.4_

- [x] 2.2 Create clean Convex authentication functions


  - Write `convex/auth-functions.ts` with simplified user operations
  - Implement admin email validation and student credential checking
  - Add session storage and validation functions
  - _Requirements: 1.1, 1.2, 2.1, 2.2, 3.4, 3.5_


- [x] 2.3 Remove old authentication files

  - Delete overcomplicated `convex/auth.ts` and `convex/studentAuth.ts`
  - Clean up `lib/auth.ts` and related utility files
  - Remove Arabic logging and verbose error handling
  - _Requirements: 6.5_

- [ ] 3. Implement Resend email service integration
  - Fix OTP email delivery using proper Resend API integration
  - Add development mode console logging for testing
  - Implement proper error handling without exposing details to users
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 3.1 Create working email service
  - Write `lib/email-service.ts` with proper Resend API integration
  - Fix OTP email template and delivery mechanism
  - Add development mode logging for testing OTP codes
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 3.2 Implement email error handling
  - Add graceful fallback when Resend API fails
  - Log email errors for debugging without exposing to users
  - Show generic success message regardless of actual email status
  - _Requirements: 4.4, 4.5, 4.6, 6.1, 6.2_

- [ ]* 3.3 Write email service tests
  - Test OTP email generation and sending
  - Test error handling for API failures
  - Mock Resend API for testing
  - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4. Create Next.js Server Actions for authentication
  - Replace REST API routes with modern Server Actions
  - Implement proper form handling and validation
  - Add clean error responses with toast notifications
  - _Requirements: 5.1, 5.2, 5.4, 6.1, 6.3_

- [ ] 4.1 Create authentication Server Actions
  - Write `app/actions/auth-actions.ts` with admin OTP and student login actions
  - Implement proper input validation and sanitization
  - Add clean error handling with ActionResult type
  - _Requirements: 5.1, 5.2, 6.1, 6.3, 8.6_

- [ ] 4.2 Create admin management Server Actions
  - Write `app/actions/admin-actions.ts` for student management
  - Implement student creation, activation, and password reset
  - Add proper authorization checks for admin-only actions
  - _Requirements: 7.1, 7.2, 7.5, 7.6_

- [ ] 4.3 Implement session management actions
  - Add logout action with proper session cleanup
  - Implement session refresh and validation actions
  - Add middleware integration for route protection
  - _Requirements: 3.5, 3.6, 5.6_

- [ ] 5. Update login UI with clean error handling
  - Simplify login page to remove complex error displays
  - Implement simple toast notifications for all errors
  - Remove technical error details from user interface
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_

- [ ] 5.1 Redesign login page component
  - Update `app/login/page.tsx` to use Server Actions
  - Implement clean email/password flow determination
  - Add proper loading states and form validation
  - _Requirements: 1.1, 2.1, 5.2, 5.5_

- [ ] 5.2 Create clean error handling components
  - Write simple toast notification system
  - Remove complex error display cards and verbose messages
  - Implement Arabic error messages for users, English for logs
  - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.6_

- [ ] 5.3 Add OTP input component
  - Create `components/auth/otp-input.tsx` with 6-digit input
  - Add paste support and auto-focus functionality
  - Implement resend functionality with proper cooldown
  - _Requirements: 1.3, 1.4, 1.5_

- [ ] 6. Implement middleware for route protection
  - Create Next.js middleware for session validation
  - Add automatic redirects for expired sessions
  - Implement role-based route protection
  - _Requirements: 3.7, 5.6, 8.7_

- [ ] 6.1 Create authentication middleware
  - Write `middleware.ts` with session validation
  - Implement automatic redirects for unauthenticated users
  - Add role-based access control for admin routes
  - _Requirements: 3.7, 5.6_

- [ ] 6.2 Add session management to middleware
  - Implement automatic session refresh before expiration
  - Add proper cookie handling with security flags
  - Handle session expiration with clean redirects
  - _Requirements: 3.1, 3.2, 3.7, 8.7_

- [ ] 7. Create student management system
  - Implement admin dashboard for student creation
  - Add student invitation email system
  - Create password reset functionality for students
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

- [ ] 7.1 Create student management interface
  - Add student creation form to admin dashboard
  - Implement student list with activation/deactivation controls
  - Add search and filtering functionality for student management
  - _Requirements: 7.1, 7.5, 7.6_

- [ ] 7.2 Implement student invitation system
  - Create secure temporary password generation
  - Send invitation emails with login credentials
  - Add first-login password change requirement
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 7.3 Add student account management
  - Implement student activation/deactivation functionality
  - Add password reset capability for admins
  - Create student status tracking and reporting
  - _Requirements: 7.4, 7.5, 7.6_

- [ ] 8. Add security enhancements and rate limiting
  - Implement rate limiting for OTP requests
  - Add brute force protection for login attempts
  - Create security monitoring and logging
  - _Requirements: 8.4, 8.5, 8.6_

- [ ] 8.1 Implement rate limiting
  - Add OTP request rate limiting (3 per hour per email)
  - Implement login attempt rate limiting
  - Create IP-based rate limiting for additional security
  - _Requirements: 8.5_

- [ ] 8.2 Add security monitoring
  - Implement failed login attempt logging
  - Add suspicious activity detection
  - Create security event logging for audit trails
  - _Requirements: 8.4, 8.5_

- [ ] 8.3 Enhance input validation and sanitization
  - Add comprehensive input validation for all forms
  - Implement XSS protection and input sanitization
  - Add CSRF protection for all Server Actions
  - _Requirements: 8.6_

- [ ] 9. Create seed data and testing utilities
  - Add test student accounts for development
  - Create admin utilities for user management
  - Implement database seeding for development environment
  - _Requirements: 2.1, 7.1_

- [ ] 9.1 Create development seed data
  - Add test student accounts with known credentials
  - Create admin user seeding functionality
  - Implement course and enrollment test data
  - _Requirements: 2.1, 7.1_

- [ ] 9.2 Add admin management utilities
  - Create command-line tools for admin management
  - Add database cleanup and maintenance utilities
  - Implement user migration tools if needed
  - _Requirements: 7.1, 7.6_

- [ ]* 9.3 Write integration tests
  - Test complete authentication flows
  - Test admin and student management functionality
  - Test email delivery and error handling
  - _Requirements: 1.1, 2.1, 4.1, 7.1_

- [ ] 10. Final cleanup and optimization
  - Remove all old authentication code and utilities
  - Clean up unused dependencies and imports
  - Optimize performance and add monitoring
  - _Requirements: 6.5_

- [ ] 10.1 Remove legacy authentication code
  - Delete old auth utilities and complex error handlers
  - Remove Arabic logging and verbose error messages
  - Clean up unused imports and dependencies
  - _Requirements: 6.5_

- [ ] 10.2 Optimize performance and add monitoring
  - Add performance monitoring for authentication flows
  - Implement caching for frequently accessed data
  - Add health checks and system monitoring
  - _Requirements: 3.1, 3.2_

- [ ] 10.3 Update documentation and configuration
  - Update environment variable documentation
  - Add deployment and configuration guides
  - Create troubleshooting documentation for common issues
  - _Requirements: 4.1, 8.1_