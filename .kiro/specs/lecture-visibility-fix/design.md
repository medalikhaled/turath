# Design Document

## Overview

The issue where scheduled lectures don't appear in the student view is caused by overly complex filtering logic in the student dashboard. The current system tries to filter lessons based on student course enrollment, but this creates unnecessary complexity and potential points of failure. The solution is to simplify the approach: the student dashboard should display all data from the database, just like the admin dashboard does.

## Architecture

### Current Problem
The current `getStudentDashboard` query:
1. Gets a student by ID
2. Iterates through the student's enrolled courses
3. Queries lessons for each course individually
4. This complex logic can fail if student-course relationships are not properly maintained

### Proposed Solution
Simplify the student dashboard to:
1. Query all lessons directly from the database
2. Query all courses directly from the database
3. Query all news directly from the database
4. Display everything that exists, with empty states when there's no data

## Components and Interfaces

### Student Dashboard Query
- Replace complex `getStudentDashboard` with simple direct queries
- Remove dependency on student-course enrollment filtering
- Use the same data sources that admin dashboard uses

### Data Display Logic
- Show all lessons in chronological order
- Show all active courses
- Show all published news
- Display appropriate empty states when no data exists

## Data Models

### Current Approach (Complex)
```typescript
// Current: Complex filtering by student enrollment
for (const courseId of student.courses) {
  const courseLessons = await ctx.db
    .query("lessons")
    .withIndex("by_course_and_time", (q) => 
      q.eq("courseId", courseId)
        .gte("scheduledTime", startOfWeek)
        .lte("scheduledTime", endOfWeek)
    )
    .collect();
}
```

### Proposed Approach (Simple)
```typescript
// Proposed: Direct query for all lessons
const allLessons = await ctx.db
  .query("lessons")
  .withIndex("by_scheduled_time")
  .filter((q) => 
    q.and(
      q.gte(q.field("scheduledTime"), startOfWeek),
      q.lte(q.field("scheduledTime"), endOfWeek)
    )
  )
  .collect();
```

## Error Handling

### Simplified Error Handling
- Remove complex relationship validation
- Use standard database query error handling
- Display clear error messages when queries fail
- Show empty states when no data is available

## Testing Strategy

### Manual Testing
- Verify that lessons created by admin appear in student dashboard
- Test that all courses are visible to students
- Confirm that news items appear for students
- Validate empty states when no data exists

### Integration Testing
- Test lesson creation → student visibility workflow
- Test course creation → student visibility workflow
- Test news creation → student visibility workflow

## Implementation Approach

### Phase 1: Simplify Dashboard Queries
1. Create new simplified dashboard query functions
2. Remove complex student-course filtering logic
3. Use direct database queries for all data

### Phase 2: Update Student Dashboard Hook
1. Modify `useStudentDashboard` to use simplified queries
2. Remove dependency on student enrollment data
3. Add proper error handling for simple queries

### Phase 3: Test and Validate
1. Test that admin-created content appears in student dashboard
2. Verify empty states work correctly
3. Confirm real-time updates work properly