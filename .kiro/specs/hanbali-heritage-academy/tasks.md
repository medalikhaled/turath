# Implementation Plan

- [x] 1. Set up project foundation and dependencies






  - Install and configure Shadcn UI components with Tailwind CSS
  - Set up Arabic font support and RTL text handling
  - Configure dark blue theme with CSS custom properties
  - Install Convex and initialize backend configuration
  - _Requirements: 10.1, 10.2, 10.4_

- [x] 2. Create core UI components and layout system






  - Implement base Shadcn components (Button, Card, Modal, Form inputs)
  - Create responsive navigation header with Arabic logo and profile dropdown
  - Build reusable layout components for student and admin sections
  - Implement loading states and skeleton components
  - _Requirements: 10.1, 10.4, 11.3_

- [x] 3. Set up Convex backend schema and basic functions






  - Define Convex database schema for students, courses, meetings, lessons, news, and files
  - Create database indexes for efficient querying
  - Implement basic CRUD functions for each data model
  - Set up file storage configuration for attachments and resources
  - _Requirements: 6.1, 7.1, 8.1, 9.1_

- [x] 4. Build student dashboard main page






  - Create current lesson section with Google Meet link display and copy functionality
  - Implement countdown timer for next session
  - Build weekly schedule grid showing upcoming lessons
  - Add click navigation from schedule items to course pages
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [x] 5. Implement course detail pages






  - Create course page layout with header, description, and navigation
  - Build lesson archive section with chronological organization
  - Implement resource library with download functionality
  - Add proper error handling for missing content
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 6. Create news and announcements system






  - Build news feed component for student dashboard
  - Implement file attachment display and download functionality
  - Create chronological news organization with proper styling
  - Add real-time updates for new announcements
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 7. Remove existing Convex Auth implementation





  - Remove all Convex Auth dependencies and providers
  - Clean up existing auth-related imports and configurations
  - Remove Convex Auth hooks and components
  - Clear any Convex Auth-specific database schemas or functions
  - _Requirements: 5.1, 6.1_

- [x] 8. Implement unified authentication system with basic auth and OTP





  - [x] 8.1 Create basic authentication infrastructure



    - Implement JWT-based session management using existing database models
    - Create authentication middleware for protected routes
    - Build basic login/logout functionality with session persistence
    - Add user role checking (student vs admin) using existing user schema
    - _Requirements: 5.1, 5.2, 5.3, 5.4_
  


  - [x] 8.2 Implement student authentication





    - Create student login with email/password using existing student model
    - Implement secure password hashing and validation
    - Add student session management and protected route access
    - Build logout functionality with proper session cleanup


    - _Requirements: 5.1, 5.2, 5.3, 5.6_
  
  - [x] 8.3 Implement admin OTP authentication system





    - Create hardcoded admin email list in existing database schema
    - Build 6-digit OTP generation system with 15-minute expiry
    - Implement email service integration for sending OTP codes
    - Add admin email verification against database admin list
    - Create OTP validation and verification system


    - Implement 24-hour session management for authenticated admins
    - Add rate limiting for OTP requests to prevent abuse
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [x] 8.4 Create unified login interface






    - Build shared login page with automatic admin email detection
    - Implement student email/password form
    - Add admin email input with OTP flow trigger
    - Create OTP input form for admin authentication
    - Add proper error handling for invalid/expired credentials
    - Implement loading states and user feedback
    - _Requirements: 5.1, 5.2, 6.7, 6.8, 6.9_

- [x] 9. Implement admin dashboard foundation






  - Create admin layout with navigation sidebar
  - Build admin dashboard overview with statistics display
  - Implement quick action buttons for common admin tasks
  - Add recent activity feed for system monitoring
  - _Requirements: 6.1, 7.1, 8.1, 9.1_

- [x] 10. Create Google Meet management system






  - Build meeting creation and editing forms
  - Implement Google Meet link validation and formatting
  - Create meeting password management functionality
  - Add time calculation and display for student dashboard
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 11. Build schedule management interface






  - Create weekly calendar view for lesson scheduling
  - Implement lesson creation and editing forms
  - Add scheduling conflict detection and warnings
  - Build lesson deletion with confirmation dialogs
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 12. Implement course content management







  - Create course creation and editing interface
  - Build file upload system with progress indicators and validation
  - Implement content organization by course and lesson
  - Add rich text editor for course descriptions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 13. Create news and announcement management


  - Build rich text editor for news creation
  - Implement file attachment system for announcements
  - Add news scheduling functionality for future publication
  - Create news editing and deletion capabilities
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 14. Build student account management system
  - Create admin page for student management at /admin/students
  - Build student list view with search and filtering capabilities
  - Implement student creation form with email, name, and password validation
  - Add student editing functionality with password reset options
  - Build student deletion with confirmation dialogs and access revocation
  - Integrate with existing authentication system for student account management
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 14.1. Fix admin access to student routes

  - Ensure admins can access all student pages (/dashboard, /course/*) for monitoring
  - Add "Student View" navigation option in admin sidebar
  - Update middleware to allow admin access to student routes
  - Update StudentProtectedRoute component to allow admin access
  - Update requireAuth function to allow admins on student routes
  - Create debug and admin creation utilities for troubleshooting
  - Test admin access to all student functi

- [x] 15. Implement file handling and storage

  - Create secure file upload functionality with Convex storage
  - Build file download system with access control
  - Implement file type and size validation
  - Add file organization and management interface
  - _Requirements: 3.3, 4.2, 8.1, 9.4_

- [x] 16. Add responsive design and mobile optimization

  - Implement responsive layouts for all components
  - Optimize touch interactions for mobile devices
  - Add mobile-specific navigation patterns
  - Test and refine mobile user experience
  - _Requirements: 12.1, 12.3_

- [x] 17. Create error handling and validation systems

  - Implement client-side form validation with Arabic error messages
  - Add network error handling with retry mechanisms
  - Create user-friendly error displays for common issues
  - Build error logging and monitoring capabilities
  - _Requirements: 6.3, 7.3, 8.4, 9.4_

- [x] 18. Implement real-time features with Convex

  - Add real-time updates for schedule changes
  - Implement live news feed updates
  - Create real-time meeting status updates
  - Add automatic data synchronization across user sessions
  - _Requirements: 2.4, 4.3, 6.1, 7.2_

- [ ] 19. Add performance optimizations
  - Implement Next.js dynamic imports for route-based code splitting
  - Add Next.js Image component optimization for course materials and attachments
  - Configure proper caching headers and strategies for static content
  - Optimize bundle size using Next.js built-in optimizations
  - remove any potential hydration issues
  - _Requirements: 12.2, 12.4_

- [ ] 20. Create comprehensive testing suite
  - Implement integration tests for authentication flows and core functions
  - Add end-to-end tests for student and admin workflows using Playwright
  - Create mobile-specific testing scenarios for responsive design
  - _Requirements: 12.3, 12.4_

- [ ] 21. Final integration and polish
  - Review and test all user flows for consistency
  - Add final Arabic typography and RTL layout refinements
  - Implement accessibility features (ARIA labels, keyboard navigation, screen reader support)
  - Perform cross-browser testing and fix compatibility issues
  - Add loading states and error boundaries for better UX
  - _Requirements: 10.1, 10.2, 10.3, 12.3_