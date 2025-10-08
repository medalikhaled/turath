# Requirements Document

## Introduction

The Hanbali Heritage Academy Online Coaching Platform (تراث الحنابلة) is a simplified online coaching/course platform designed for multiple students. The platform provides students with an intuitive Arabic interface to join live sessions, view schedules, access past lessons, and stay updated with news and attachments. A comprehensive admin dashboard allows the superadmin to manage all content efficiently. The platform will be built using Next.js 15 with a modern dark blue theme and Arabic language support.

## Requirements

### Requirement 1

**User Story:** As a student, I want to access current lesson information on the main dashboard, so that I can quickly join live sessions and prepare for upcoming classes.

#### Acceptance Criteria

1. WHEN a student accesses the main dashboard THEN the system SHALL display the current lesson section with Google Meet link, meeting password, and time remaining until next session
2. WHEN a student clicks on the Google Meet link THEN the system SHALL allow the link to be copied to clipboard
3. WHEN there is no active session THEN the system SHALL display the next upcoming session information
4. IF a session is currently live THEN the system SHALL highlight this with visual indicators

### Requirement 2

**User Story:** As a student, I want to view my weekly schedule, so that I can plan my time and prepare for upcoming lessons.

#### Acceptance Criteria

1. WHEN a student views the weekly schedule section THEN the system SHALL display all upcoming lessons for the current week
2. WHEN displaying each lesson THEN the system SHALL show course name and meeting time
3. WHEN a student clicks on a lesson entry THEN the system SHALL navigate to the course-specific page
4. WHEN the week changes THEN the system SHALL automatically update to show the new week's schedule

### Requirement 3

**User Story:** As a student, I want to access course-specific pages, so that I can review past lessons and access additional resources.

#### Acceptance Criteria

1. WHEN a student accesses a course page THEN the system SHALL display course description, recordings/notes from old lessons, and additional resources
2. WHEN viewing past lessons THEN the system SHALL organize content chronologically
3. WHEN resources are available THEN the system SHALL provide download links for files
4. WHEN no content is available THEN the system SHALL display an appropriate message

### Requirement 4

**User Story:** As a student, I want to stay updated with academy news and download attachments, so that I can remain informed about important announcements.

#### Acceptance Criteria

1. WHEN a student views the news section THEN the system SHALL display all published announcements in chronological order
2. WHEN attachments are available THEN the system SHALL provide download functionality
3. WHEN new announcements are published THEN the system SHALL display them without requiring page refresh
4. WHEN downloading files THEN the system SHALL handle the download process securely

### Requirement 5

**User Story:** As a student, I want to authenticate securely with the platform, so that I can access my learning content with minimal complexity.

#### Acceptance Criteria

1. WHEN a student accesses the platform THEN the system SHALL require authentication using Convex Auth or compatible Next.js framework
2. WHEN a student signs in THEN the system SHALL authenticate credentials and redirect to the student dashboard
3. WHEN a student signs out THEN the system SHALL securely end the session and redirect to login page
4. IF a user is not authenticated THEN the system SHALL redirect to the login page
5. WHEN authenticated THEN the system SHALL display a simple logout option in the navigation
6. WHEN managing student accounts THEN the system SHALL only allow superadmin to create, edit, or delete student profiles

### Requirement 6

**User Story:** As a superadmin, I want to authenticate with enhanced security using email OTP, so that I can securely access administrative functions with minimal disruption to my workflow.

#### Acceptance Criteria

1. WHEN a superadmin enters their email on the login page THEN the system SHALL verify the email exists in the hardcoded admin list in the database
2. WHEN the admin email is verified THEN the system SHALL generate a 6-digit OTP and send it via email
3. WHEN the OTP is generated THEN the system SHALL set expiration to 15 minutes for security
4. WHEN the admin enters the correct OTP THEN the system SHALL authenticate the admin session
5. WHEN admin authentication is successful THEN the system SHALL maintain the session for 24 hours to reduce authentication frequency
6. WHEN the admin session expires THEN the system SHALL redirect to admin login with clear messaging
7. WHEN implementing admin auth THEN the system SHALL use the same login page as students but detect admin email addresses and trigger OTP flow
8. WHEN managing admin access THEN the system SHALL only allow admin emails to be added/removed directly in the database, not through the UI
9. IF OTP requests are made too frequently THEN the system SHALL implement rate limiting to prevent abuse

### Requirement 7

**User Story:** As a superadmin, I want to manage Google Meet sessions, so that I can provide students with current meeting information.

#### Acceptance Criteria

1. WHEN the admin updates Google Meet information THEN the system SHALL immediately reflect changes on student dashboard
2. WHEN creating a new meeting THEN the system SHALL allow manual entry of Google Meet link and password
3. WHEN managing meetings THEN the system SHALL validate Google Meet link format
4. WHEN a meeting is scheduled THEN the system SHALL calculate and display time remaining accurately

### Requirement 7

**User Story:** As a superadmin, I want to manage the weekly schedule, so that I can keep students informed about upcoming lessons.

#### Acceptance Criteria

1. WHEN the admin creates a lesson THEN the system SHALL require course name, date, and time
2. WHEN updating the schedule THEN the system SHALL immediately update the student view
3. WHEN scheduling conflicts exist THEN the system SHALL warn the admin
4. WHEN deleting a lesson THEN the system SHALL require confirmation and update all related views

### Requirement 8

**User Story:** As a superadmin, I want to manage course content, so that I can provide students with comprehensive learning materials.

#### Acceptance Criteria

1. WHEN the admin uploads course content THEN the system SHALL support multiple file formats (video, audio, PDF, documents)
2. WHEN organizing content THEN the system SHALL allow categorization by course and lesson date
3. WHEN updating course descriptions THEN the system SHALL support rich text formatting
4. WHEN managing resources THEN the system SHALL provide file size and format validation

### Requirement 9

**User Story:** As a superadmin, I want to publish news and announcements, so that I can communicate important information to all students.

#### Acceptance Criteria

1. WHEN publishing news THEN the system SHALL support rich text content and file attachments
2. WHEN creating announcements THEN the system SHALL allow scheduling for future publication
3. WHEN managing news THEN the system SHALL provide edit and delete functionality
4. WHEN attaching files THEN the system SHALL validate file types and sizes for security

### Requirement 10

**User Story:** As a user, I want the platform to support Arabic language and cultural preferences, so that I can use the platform in my native language.

#### Acceptance Criteria

1. WHEN accessing any page THEN the system SHALL display all text in Arabic
2. WHEN displaying content THEN the system SHALL use left-to-right layout appropriate for Arabic text
3. WHEN showing dates and times THEN the system SHALL use Arabic/Islamic calendar options where appropriate
4. WHEN displaying the interface THEN the system SHALL use the dark blue theme consistently

### Requirement 11

**User Story:** As a superadmin, I want to manage student accounts, so that I can control access to the platform and maintain student information.

#### Acceptance Criteria

1. WHEN the admin accesses student management THEN the system SHALL display all registered students
2. WHEN creating a new student THEN the system SHALL require name, email, and initial password
3. WHEN editing student information THEN the system SHALL allow updating name, email, and password reset
4. WHEN deleting a student THEN the system SHALL require confirmation and revoke platform access
5. WHEN managing students THEN the system SHALL prevent students from self-registering or editing their profiles

### Requirement 12

**User Story:** As a user, I want the platform to be responsive and performant, so that I can access it from any device efficiently.

#### Acceptance Criteria

1. WHEN accessing from mobile devices THEN the system SHALL provide a responsive layout
2. WHEN loading pages THEN the system SHALL complete initial load within 3 seconds
3. WHEN using the platform THEN the system SHALL work consistently across modern browsers
4. WHEN handling file uploads/downloads THEN the system SHALL provide progress indicators