# Implementation Plan

- [x] 1. Implement schedule validation and past date prevention





  - Add date validation logic to prevent scheduling lessons in the past
  - Update lesson form with real-time validation feedback
  - Fix weekly schedule display to show current week lessons properly
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 1.1 Create date validation utilities


  - Write utility functions for date validation and past date detection
  - Implement time conflict detection logic
  - Add validation error message constants
  - _Requirements: 1.1, 1.2_

- [x] 1.2 Update lesson form with validation


  - Add past date validation to lesson form component
  - Implement real-time validation feedback UI
  - Prevent form submission for invalid dates
  - _Requirements: 1.1, 1.2_

- [x] 1.3 Fix weekly schedule display logic


  - Update dashboard hook to properly filter current week lessons
  - Fix lesson display timing for current week but different day
  - Ensure proper sorting and filtering of lessons
  - _Requirements: 1.3, 1.4_

- [-] 2. Add course section to student dashboard



  - Create dedicated course display section in student dashboard
  - Implement course cards with navigation to individual pages
  - Add proper empty states for courses section
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 2.1 Create course display components


  - Build CourseCard component with course information
  - Create CourseSection component for dashboard
  - Add course navigation and interaction handlers
  - _Requirements: 2.1, 2.2_

- [x] 2.2 Update student dashboard layout


  - Integrate course section into existing dashboard
  - Update dashboard grid layout to accommodate courses
  - Ensure responsive design for course section
  - _Requirements: 2.1, 2.2_

- [x] 2.3 Implement course page navigation


  - Add routing logic for individual course pages
  - Update course card click handlers for navigation
  - Ensure proper course data loading on individual pages
  - _Requirements: 2.2_

- [-] 2.4 Add course empty states

  - Create empty state component for no courses
  - Add loading states for course data
  - Implement error states for course loading failures
  - _Requirements: 2.3_

- [ ] 3. Create unified lesson-meeting scheduling system
  - Modify lesson creation to optionally auto-create meetings
  - Add unified scheduling interface with lesson and meeting options
  - Maintain backward compatibility with existing data
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ] 3.1 Update lesson form for meeting integration
  - Add toggle option for auto-creating meetings during lesson creation
  - Integrate meeting form fields into lesson creation flow
  - Update lesson creation mutation to handle meeting creation
  - _Requirements: 3.1, 3.2_

- [ ] 3.2 Modify backend queries for unified scheduling
  - Update lesson creation mutation to optionally create meetings
  - Add relationship linking between lessons and meetings
  - Ensure proper data consistency for linked events
  - _Requirements: 3.1, 3.2_

- [ ] 3.3 Create unified scheduling interface
  - Build tabbed interface for lesson and meeting creation
  - Add unified event display in schedule management
  - Update calendar view to show both lessons and meetings
  - _Requirements: 3.3, 3.4_

- [ ] 3.4 Update existing schedule displays
  - Modify weekly calendar to show unified events
  - Update admin dashboard to display linked events
  - Ensure proper event editing for linked lesson-meetings
  - _Requirements: 3.3, 3.4_

- [ ] 4. Implement consistent navigation system
  - Add collapsible sidebar functionality to admin layout
  - Implement breadcrumb navigation for admin sub-routes
  - Add back buttons to deep navigation pages
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 4.1 Create collapsible sidebar component
  - Add sidebar collapse/expand functionality
  - Implement sidebar state persistence
  - Update admin layout to support collapsible sidebar
  - _Requirements: 4.1, 4.2_

- [ ] 4.2 Implement breadcrumb navigation system
  - Create breadcrumb component with dynamic path generation
  - Add breadcrumb integration to admin layout
  - Update all admin pages to use breadcrumb navigation
  - _Requirements: 4.1, 4.2_

- [ ] 4.3 Add back navigation to admin routes
  - Implement back button component for sub-routes
  - Add back navigation to course management, lesson editing, etc.
  - Ensure proper navigation history handling
  - _Requirements: 4.1, 4.2_

- [ ] 4.4 Ensure responsive navigation consistency
  - Update mobile navigation for consistency
  - Test navigation on various screen sizes
  - Ensure sidebar works properly on mobile devices
  - _Requirements: 4.3, 4.4_

- [ ] 5. Implement student user creation and authentication system
  - Create student management interface for admins
  - Implement student account creation with email invitations
  - Add proper authentication system for student login
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [ ] 5.1 Create student management interface
  - Build student list component with CRUD operations
  - Create student creation form with validation
  - Add student editing and deletion functionality
  - _Requirements: 5.1, 5.2_

- [ ] 5.2 Implement student creation backend
  - Create student creation mutation with user account linking
  - Add email invitation system for new students
  - Implement proper password hashing and security
  - _Requirements: 5.2, 5.3_

- [ ] 5.3 Add student authentication system
  - Create student login form and authentication flow
  - Implement role-based access control
  - Add session management for student users
  - _Requirements: 5.4, 5.5_

- [ ] 5.4 Update dashboard for authenticated students
  - Modify student dashboard to use authenticated user data
  - Implement proper course enrollment filtering
  - Add personalized content based on student profile
  - _Requirements: 5.5, 5.6_

- [ ] 5.5 Create student course enrollment system
  - Add course assignment functionality in student management
  - Implement course enrollment/unenrollment for students
  - Update dashboard to show only enrolled courses
  - _Requirements: 5.6_

- [ ]* 5.6 Add comprehensive authentication testing
  - Write unit tests for authentication flows
  - Test role-based access control
  - Verify student data isolation and security
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_