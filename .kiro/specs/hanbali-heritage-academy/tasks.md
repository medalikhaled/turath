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

- [x] 7. Implement basic authentication UI components



  - Create login page with Convex Auth integration
  - Implement logout functionality in navigation
  - Add authentication state management
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 8. Implement OTP-based admin authentication system
  - Create hardcoded admin email list in database schema (no UI management)
  - Build 6-digit OTP generation system with 15-minute expiry
  - Implement email service integration for sending OTP codes to admin emails
  - Add admin email verification against hardcoded database list
  - Create OTP validation and verification system
  - Implement 24-hour session management for authenticated admin users
  - Add rate limiting for OTP requests to prevent abuse
  - Implement shared login page with admin email detection and OTP flow
  - Add error handling for invalid/expired OTPs with clear messaging
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

- [x] 9. Implement admin dashboard foundation






  - Create admin layout with navigation sidebar
  - Build admin dashboard overview with statistics display
  - Implement quick action buttons for common admin tasks
  - Add recent activity feed for system monitoring
  - _Requirements: 6.1, 7.1, 8.1, 9.1_

- [x] 9. Create Google Meet management system






  - Build meeting creation and editing forms
  - Implement Google Meet link validation and formatting
  - Create meeting password management functionality
  - Add time calculation and display for student dashboard
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 10. Build schedule management interface






  - Create weekly calendar view for lesson scheduling
  - Implement lesson creation and editing forms
  - Add scheduling conflict detection and warnings
  - Build lesson deletion with confirmation dialogs
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 11. Implement course content management







  - Create course creation and editing interface
  - Build file upload system with progress indicators and validation
  - Implement content organization by course and lesson
  - Add rich text editor for course descriptions
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [ ] 12. Create news and announcement management
  - Build rich text editor for news creation
  - Implement file attachment system for announcements
  - Add news scheduling functionality for future publication
  - Create news editing and deletion capabilities
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ] 13. Build student account management system
  - Create student list view with search and filtering
  - Implement student creation form with validation
  - Add student editing and password reset functionality
  - Build student deletion with confirmation and access revocation
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 14. Implement file handling and storage
  - Create secure file upload functionality with Convex storage
  - Build file download system with access control
  - Implement file type and size validation
  - Add file organization and management interface
  - _Requirements: 3.3, 4.2, 8.1, 9.4_

- [ ] 15. Add responsive design and mobile optimization
  - Implement responsive layouts for all components
  - Optimize touch interactions for mobile devices
  - Add mobile-specific navigation patterns
  - Test and refine mobile user experience
  - _Requirements: 12.1, 12.3_

- [ ] 16. Create error handling and validation systems
  - Implement client-side form validation with Arabic error messages
  - Add network error handling with retry mechanisms
  - Create user-friendly error displays for common issues
  - Build error logging and monitoring capabilities
  - _Requirements: 6.3, 7.3, 8.4, 9.4_

- [ ] 17. Implement real-time features with Convex
  - Add real-time updates for schedule changes
  - Implement live news feed updates
  - Create real-time meeting status updates
  - Add automatic data synchronization across user sessions
  - _Requirements: 2.4, 4.3, 6.1, 7.2_

- [ ] 18. Add performance optimizations
  - Implement code splitting for route-based loading
  - Add image optimization for course materials and attachments
  - Create efficient caching strategies for static content
  - Optimize bundle size and loading performance
  - _Requirements: 12.2, 12.4_

- [ ] 19. Create comprehensive testing suite
  - Write unit tests for all UI components
  - Implement integration tests for Convex functions
  - Add end-to-end tests for critical user workflows
  - Create mobile-specific testing scenarios
  - _Requirements: 12.3, 12.4_

- [ ] 20. Complete authentication system integration
  - Set up Better Auth configuration with Next.js
  - Implement protected route middleware
  - Create user role checking for admin vs student access
  - Add session management and persistence
  - Integrate admin enhanced authentication with student auth system
  - _Requirements: 5.1, 5.4, 5.6, 6.5, 6.7_

- [ ] 21. Final integration and polish
  - Integrate all components into cohesive user flows
  - Add final styling touches and theme consistency
  - Implement accessibility features for Arabic content
  - Perform cross-browser testing and bug fixes
  - _Requirements: 10.1, 10.2, 10.3, 12.3_