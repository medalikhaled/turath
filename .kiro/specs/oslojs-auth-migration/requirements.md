# Requirements Document

## Introduction

This specification addresses the complete overhaul of the authentication system for the Hanbali Heritage Academy platform. The current system has multiple critical issues including non-functional OTP delivery, overcomplicated error handling, poor user experience, and failure to leverage modern Next.js capabilities. The new system will implement a clean, secure authentication flow following The Copenhagen Book's authentication best practices, using proper Next.js Server Actions, and Convex as the backend database.

## Requirements

### Requirement 1: Admin Authentication System

**User Story:** As an admin, I want to log in using my email and receive an OTP code via Resend email service, so that I can securely access the admin dashboard.

#### Acceptance Criteria

1. WHEN an admin enters their email THEN the system SHALL verify the email against a hardcoded admin list
2. WHEN the email is verified as admin THEN the system SHALL generate a 6-digit OTP using Oslo.js cryptographic functions
3. WHEN the OTP is generated THEN the system SHALL send it via Resend email service with proper error handling
4. WHEN in development mode THEN the system SHALL display the OTP in console logs for testing
5. WHEN the admin enters the correct OTP THEN the system SHALL create a secure session using modern cryptographic practices and redirect to /admin/dashboard
6. WHEN the OTP is invalid or expired THEN the system SHALL show a simple error toast without revealing sensitive information
7. WHEN the admin session expires THEN the system SHALL automatically redirect to login

### Requirement 2: Student Authentication System

**User Story:** As a student, I want to log in using my email and password, so that I can access my courses and learning materials.

#### Acceptance Criteria

1. WHEN a student enters their email THEN the system SHALL check if it exists in the student database
2. WHEN the email is verified as student THEN the system SHALL prompt for password input
3. WHEN the student enters their password THEN the system SHALL verify it using secure password hashing following The Copenhagen Book guidelines
4. WHEN credentials are valid THEN the system SHALL create a secure session and redirect to /dashboard
5. WHEN credentials are invalid THEN the system SHALL show a simple error toast without revealing which field was incorrect
6. WHEN the student account is inactive THEN the system SHALL show an appropriate error message
7. WHEN the student session expires THEN the system SHALL automatically redirect to login

### Requirement 3: Secure Session Management

**User Story:** As a system administrator, I want all user sessions to be securely managed with proper expiration and validation, so that the platform maintains security standards.

#### Acceptance Criteria

1. WHEN a user logs in THEN the system SHALL create a secure session token with appropriate expiration times
2. WHEN an admin logs in THEN the session SHALL expire after 24 hours
3. WHEN a student logs in THEN the session SHALL expire after 7 days
4. WHEN a session is created THEN it SHALL be stored securely using HTTP-only cookies
5. WHEN a session expires THEN the system SHALL automatically log out the user
6. WHEN a user logs out THEN the system SHALL invalidate the session immediately
7. WHEN session validation fails THEN the system SHALL redirect to login without exposing error details

### Requirement 4: Email Service Integration

**User Story:** As a system administrator, I want the email service to work reliably with Resend API, so that OTP codes are delivered consistently to admin users.

#### Acceptance Criteria

1. WHEN the system needs to send an OTP THEN it SHALL use the configured Resend API key
2. WHEN in production mode THEN the system SHALL send actual emails via Resend
3. WHEN in development mode THEN the system SHALL log email content to console and optionally send real emails
4. WHEN email sending fails THEN the system SHALL log the error and show a generic error message to the user
5. WHEN email sending succeeds THEN the system SHALL confirm to the user that the OTP was sent
6. WHEN the Resend API is unavailable THEN the system SHALL gracefully handle the error

### Requirement 5: Modern Next.js Implementation

**User Story:** As a developer, I want the authentication system to use modern Next.js patterns and Server Actions, so that the code is maintainable and follows current best practices.

#### Acceptance Criteria

1. WHEN implementing authentication logic THEN the system SHALL use Next.js Server Actions instead of API routes
2. WHEN handling form submissions THEN the system SHALL use Server Actions with proper validation
3. WHEN managing state THEN the system SHALL use React Server Components where appropriate
4. WHEN handling errors THEN the system SHALL use proper error boundaries and toast notifications
5. WHEN redirecting users THEN the system SHALL use Next.js navigation methods
6. WHEN validating sessions THEN the system SHALL use middleware for route protection

### Requirement 6: Clean Error Handling and User Experience

**User Story:** As a user, I want to receive clear, helpful error messages without technical details, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN an error occurs THEN the system SHALL show a simple toast notification
2. WHEN displaying errors THEN the system SHALL NOT reveal sensitive technical information
3. WHEN authentication fails THEN the system SHALL NOT indicate whether the email or password was incorrect
4. WHEN showing error messages THEN the system SHALL display them in Arabic for the UI language
5. WHEN logging errors THEN the system SHALL log in English for developer debugging
6. WHEN an error is dismissible THEN the user SHALL be able to close it easily
7. WHEN multiple errors occur THEN only the most recent error SHALL be displayed

### Requirement 7: Student Management System

**User Story:** As an admin, I want to create and manage student accounts from the admin dashboard, so that I can control access to the platform.

#### Acceptance Criteria

1. WHEN an admin creates a student THEN the system SHALL generate a secure temporary password
2. WHEN a student account is created THEN the system SHALL send invitation email with login credentials
3. WHEN a student first logs in THEN the system SHALL prompt for password change
4. WHEN an admin deactivates a student THEN the system SHALL prevent login attempts
5. WHEN an admin reactivates a student THEN the system SHALL restore login access
6. WHEN managing students THEN the admin SHALL see a list of all students with their status

### Requirement 8: Security and Compliance

**User Story:** As a security administrator, I want the authentication system to follow security best practices, so that user data and access are properly protected.

#### Acceptance Criteria

1. WHEN storing passwords THEN the system SHALL use secure password hashing following The Copenhagen Book recommendations (Argon2id or scrypt)
2. WHEN generating OTP codes THEN the system SHALL use cryptographically secure random generation
3. WHEN creating sessions THEN the system SHALL use secure JWT tokens with proper signing
4. WHEN handling sensitive data THEN the system SHALL never log passwords or tokens
5. WHEN rate limiting THEN the system SHALL prevent brute force attacks on OTP verification
6. WHEN validating input THEN the system SHALL sanitize and validate all user inputs
7. WHEN storing sessions THEN the system SHALL use HTTP-only, secure cookies