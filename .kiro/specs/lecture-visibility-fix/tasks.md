# Implementation Plan

- [x] 1. Create simplified dashboard queries





  - Replace complex student-course filtering with direct database queries
  - Create new query functions that fetch all data without enrollment filtering
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 1.1 Create simplified lesson query


  - Write a new query function to get all lessons for a time period
  - Remove dependency on student course enrollment
  - _Requirements: 1.1, 2.1_

- [x] 1.2 Create simplified course query


  - Write a query function to get all active courses
  - Remove complex student-course relationship filtering
  - _Requirements: 1.4, 2.2_

- [x] 1.3 Create simplified news query


  - Write a query function to get all published news
  - Ensure it matches what admin dashboard shows
  - _Requirements: 1.3, 2.3_

- [x] 2. Update student dashboard hook





  - Modify useStudentDashboard to use the new simplified queries
  - Remove complex student enrollment logic
  - Add proper error handling and empty states
  - _Requirements: 1.1, 1.2, 1.3, 3.2, 3.4_

- [x] 2.1 Update dashboard hook implementation


  - Replace complex getStudentDashboard call with direct queries
  - Remove dependency on student ID and course enrollment
  - _Requirements: 2.1, 2.2, 3.1_

- [x] 2.2 Add proper error handling


  - Handle query failures gracefully
  - Display appropriate error messages to users
  - _Requirements: 3.4_

- [x] 2.3 Implement empty state handling


  - Show empty states when no lessons exist
  - Show empty states when no courses exist
  - Show empty states when no news exists
  - _Requirements: 1.3, 2.3_

- [ ] 3. Test the simplified solution
  - Verify that admin-created content appears in student dashboard
  - Test that empty states work correctly
  - Confirm real-time updates work properly
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3_

- [ ] 3.1 Test lesson visibility
  - Create a lesson in admin dashboard
  - Verify it appears immediately in student dashboard
  - _Requirements: 1.1, 2.1_

- [ ] 3.2 Test course visibility
  - Create a course in admin dashboard
  - Verify it appears in student dashboard
  - _Requirements: 1.4, 2.2_

- [ ] 3.3 Test news visibility
  - Create news in admin dashboard
  - Verify it appears in student dashboard
  - _Requirements: 1.3, 2.3_

- [ ]* 3.4 Test empty states and error handling
  - Test dashboard behavior with no data
  - Test error handling when queries fail
  - _Requirements: 1.3, 2.3, 3.4_