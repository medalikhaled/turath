# Convex Backend Documentation

## Overview

This Convex backend provides a complete serverless database and API solution for the Hanbali Heritage Academy platform. It includes schema definitions, CRUD operations, and specialized functions for managing students, courses, meetings, lessons, news, and file storage.

## Schema Structure

### Tables

1. **students** - Student user accounts and enrollment data
2. **courses** - Course information and student associations
3. **meetings** - Google Meet session management
4. **lessons** - Individual lesson scheduling and resources
5. **news** - Announcements and news articles
6. **files** - File storage metadata and access control

### Indexes

All tables include optimized indexes for efficient querying:
- Primary lookups (by ID, by active status)
- Time-based queries (by scheduled time, by creation date)
- Relationship queries (by course, by student, by creator)

## API Functions

### Authentication (`auth.ts`)
- `getOrCreateStudent` - Create or retrieve student from Clerk auth
- `getCurrentStudent` - Get current user's student record
- `isAdmin` - Check admin permissions (placeholder)
- `updateStudentProfile` - Update student information
- `deactivateStudent` - Soft delete student account

### Students (`students.ts`)
- `createStudent` - Create new student account
- `getStudentByClerkId` - Find student by Clerk ID
- `getActiveStudents` - Get all active students
- `updateStudent` - Update student information
- `addCourseToStudent` / `removeCourseFromStudent` - Manage enrollments

### Courses (`courses.ts`)
- `createCourse` - Create new course
- `getActiveCourses` - Get all active courses
- `getCoursesByStudent` - Get student's enrolled courses
- `updateCourse` - Update course information
- `addStudentToCourse` / `removeStudentFromCourse` - Manage enrollment

### Meetings (`meetings.ts`)
- `createMeeting` - Schedule Google Meet session
- `getCurrentMeeting` - Get active or next meeting
- `getUpcomingMeetings` - Get meetings for next N days
- `getMeetingsByDateRange` - Get meetings in date range
- `updateMeeting` - Update meeting details

### Lessons (`lessons.ts`)
- `createLesson` - Create new lesson
- `getLessonsByCourse` - Get all lessons for a course
- `getUpcomingLessonsByCourse` - Get future lessons
- `getPastLessonsByCourse` - Get lesson archive
- `getWeeklySchedule` - Get lessons for a week
- `getNextLessonForStudent` - Get student's next lesson

### News (`news.ts`)
- `createNews` - Create news article
- `getPublishedNews` - Get published articles (student view)
- `getAllNews` / `getDraftNews` - Admin news management
- `publishNews` / `unpublishNews` - Publication control
- `addAttachmentToNews` / `removeAttachmentFromNews` - File management

### Files (`files.ts`)
- `createFile` - Create file record with validation
- `getFileUrl` - Get download URL
- `generateUploadUrl` - Get upload URL for new files
- `getFilesByUploader` - Get user's uploaded files
- `searchFiles` - Search files by name
- `deleteFile` - Remove file and storage
- `getFilesWithUrls` - Get files with download URLs

### Dashboard (`dashboard.ts`)
- `getStudentDashboard` - Complete student dashboard data
- `getAdminDashboard` - Admin statistics and overview
- `getCourseDetails` - Detailed course information

## File Storage

### Supported File Types
- **Images**: JPEG, PNG, GIF, WebP
- **Documents**: PDF, DOC, DOCX
- **Videos**: MP4, WebM, QuickTime
- **Audio**: MP3, WAV, OGG
- **Archives**: ZIP, RAR

### File Size Limits
- Images: 5MB
- Documents: 10MB
- Videos: 100MB
- Audio: 50MB
- Archives: 20MB

### File Validation
All file uploads are validated for:
- File type restrictions
- Size limits per category
- Safe filename generation
- Virus scanning (future enhancement)

## Utility Functions (`utils.ts`)

### File Utilities
- `isValidFileType()` - Validate MIME type
- `isValidFileSize()` - Check size limits
- `generateSafeFilename()` - Create safe filenames
- `formatFileSize()` - Human-readable file sizes

### Time Utilities
- `getStartOfWeek()` / `getEndOfWeek()` - Week boundaries
- `getStartOfDay()` / `getEndOfDay()` - Day boundaries

### Validation Utilities
- `isValidEmail()` - Email format validation
- `isValidGoogleMeetLink()` - Meet link validation

## Error Handling

Custom `ConvexError` class provides structured error handling:
- File validation errors
- Permission errors
- Data validation errors
- Network and storage errors

## Security Features

### Access Control
- Student-based file access
- Admin permission checking
- Soft delete for data retention

### Data Validation
- Input sanitization
- File type restrictions
- Size limit enforcement
- Safe filename generation

### Privacy Protection
- No sensitive data in logs
- Secure file storage
- User data isolation

## Performance Optimizations

### Database Indexes
- Compound indexes for complex queries
- Time-based indexes for scheduling
- Relationship indexes for joins

### Query Optimization
- Efficient filtering and sorting
- Pagination support
- Minimal data transfer

### Caching Strategy
- Convex built-in caching
- Real-time subscriptions
- Optimistic updates

## Real-time Features

### Live Updates
- News feed updates
- Schedule changes
- Meeting status updates
- File upload progress

### Subscriptions
- Student dashboard data
- Admin statistics
- Course content updates
- Meeting notifications

## Development Setup

1. **Install Dependencies**
   ```bash
   pnpm install
   ```

2. **Start Convex Development**
   ```bash
   pnpm convex dev
   ```

3. **Deploy to Production**
   ```bash
   pnpm convex deploy
   ```

## Environment Variables

Required in `.env.local`:
- `CONVEX_DEPLOYMENT` - Auto-generated deployment ID
- `NEXT_PUBLIC_CONVEX_URL` - Public Convex URL

## Testing

### Function Testing
```bash
pnpm convex test
```

### Data Validation
- Schema validation on all mutations
- Input sanitization
- Error boundary testing

## Monitoring

### Built-in Monitoring
- Function execution logs
- Performance metrics
- Error tracking
- Usage analytics

### Custom Metrics
- File upload statistics
- User activity tracking
- System health monitoring

## Future Enhancements

### Planned Features
- Advanced role-based permissions
- File virus scanning
- Advanced search capabilities
- Automated backups
- Performance analytics

### Integration Points
- Clerk authentication
- Google Meet API
- Email notifications
- Mobile push notifications

## Support

For issues or questions:
1. Check Convex documentation: https://docs.convex.dev
2. Review function logs in Convex dashboard
3. Test functions in development environment
4. Contact development team for custom requirements