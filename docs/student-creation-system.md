# Student Creation and Authentication System

## Overview

This document describes the enhanced student creation backend system that provides secure user account creation, email invitation system, and proper password hashing for the Hanbali Heritage Academy platform.

## Features

### 1. Secure Student Creation
- **User Account Linking**: Each student gets a proper user account in the `users` table
- **Password Hashing**: Uses bcrypt with 12 salt rounds for secure password storage
- **Email Validation**: Validates email format and checks for duplicates
- **Input Sanitization**: Prevents XSS and injection attacks

### 2. Email Invitation System
- **Automatic Invitations**: Send email invitations with temporary passwords
- **Professional Templates**: Arabic email templates with proper formatting
- **Development Mode**: Console logging for development testing
- **Production Ready**: Resend email service integration

### 3. Bulk Operations
- **Bulk Creation**: Create multiple students at once
- **CSV Import Support**: Parse CSV files for bulk student import
- **Error Handling**: Detailed error reporting for failed creations
- **Rate Limiting**: Prevent invitation spam

### 4. Security Features
- **Strong Password Generation**: Secure random passwords with mixed character sets
- **Account Deactivation**: Soft delete with proper cleanup
- **Session Management**: Proper authentication and session handling
- **Input Validation**: Comprehensive validation for all inputs

## API Endpoints

### Student Management (`/api/students/manage`)

#### GET - Retrieve Students
```http
GET /api/students/manage?includeInactive=false
```

**Response:**
```json
{
  "success": true,
  "students": [...],
  "count": 10
}
```

#### POST - Create Student(s)
```http
POST /api/students/manage
Content-Type: application/json

{
  "name": "أحمد محمد",
  "email": "ahmed@example.com",
  "phone": "+966501234567",
  "courses": ["course_id_1"],
  "sendInvitation": true
}
```

**Bulk Creation:**
```json
{
  "students": [
    {
      "name": "فاطمة أحمد",
      "email": "fatima@example.com",
      "phone": "+966501111111"
    },
    {
      "name": "محمد علي",
      "email": "mohammed@example.com"
    }
  ],
  "sendInvitations": true
}
```

#### PATCH - Update Student
```http
PATCH /api/students/manage
Content-Type: application/json

{
  "studentId": "student_id",
  "name": "اسم محدث",
  "phone": "+966507654321"
}
```

#### DELETE - Deactivate Student
```http
DELETE /api/students/manage?studentId=student_id&reason=optional_reason
```

### Password Management (`/api/students/password`)

#### POST - Reset/Change Password
```http
POST /api/students/password
Content-Type: application/json

{
  "action": "reset",
  "studentId": "student_id",
  "newPassword": "new_secure_password"
}
```

**Student Password Change:**
```json
{
  "action": "change",
  "email": "student@example.com",
  "currentPassword": "current_password",
  "newPassword": "new_secure_password"
}
```

### Invitation Management (`/api/students/send-invitation`)

#### POST - Send Invitation
```http
POST /api/students/send-invitation
Content-Type: application/json

{
  "studentId": "student_id"
}
```

## Convex Mutations and Queries

### Student Creation
```typescript
// Create student with invitation
const result = await convex.mutation(api.students.createStudentWithInvitation, {
  name: "أحمد محمد",
  email: "ahmed@example.com",
  phone: "+966501234567",
  courses: ["course_id"],
  sendInvitation: true,
});
```

### Bulk Creation
```typescript
// Bulk create students
const result = await convex.mutation(api.students.bulkCreateStudentsWithInvitations, {
  students: [
    { name: "فاطمة", email: "fatima@example.com" },
    { name: "محمد", email: "mohammed@example.com" }
  ],
  sendInvitations: true,
});
```

### Invitation Management
```typescript
// Send invitation
const result = await convex.mutation(api.students.sendInvitation, {
  studentId: "student_id",
});

// Check invitation status
const status = await convex.query(api.students.getStudentInvitationStatus, {
  studentId: "student_id",
});
```

### Authentication
```typescript
// Verify credentials
const credentials = await convex.mutation(api.students.verifyStudentCredentials, {
  email: "student@example.com",
  password: "password",
});
```

## Email Service Configuration

### Development Mode
In development, emails are logged to the console:

```bash
=== 📧 Student Invitation Email (Development Mode) ===
To: ahmed@example.com
Subject: دعوة للانضمام إلى أكاديمية التراث الحنبلي

--- Email Content ---
مرحباً أحمد محمد,

تم إنشاء حساب لك في أكاديمية التراث الحنبلي.

بيانات الدخول:
البريد الإلكتروني: ahmed@example.com
كلمة المرور المؤقتة: Abc123!@#xyz

رابط تسجيل الدخول: http://localhost:3000/login
=== End Email ===
```

### Production Mode
Set the `RESEND_API_KEY` environment variable to enable email sending:

```bash
RESEND_API_KEY=re_your_resend_api_key
NODE_ENV=production
```

## Security Considerations

### Password Security
- **Bcrypt Hashing**: 12 salt rounds for secure password storage
- **Strong Generation**: Mixed character sets with symbols, numbers, and letters
- **Temporary Passwords**: Secure random generation for invitations
- **Password Validation**: Minimum 8 characters with complexity requirements

### Input Validation
- **Email Format**: RFC-compliant email validation
- **Name Validation**: Minimum 2 characters, trimmed input
- **Phone Validation**: Optional but validated when provided
- **XSS Prevention**: Input sanitization and escaping

### Access Control
- **Role-Based Access**: Proper user roles (admin/student)
- **Account Deactivation**: Soft delete with proper cleanup
- **Session Management**: Secure authentication tokens
- **Rate Limiting**: Prevent invitation spam and abuse

## Error Handling

### Common Error Codes
- `EMAIL_EXISTS`: Email already registered
- `INVALID_EMAIL_FORMAT`: Invalid email format
- `STUDENT_NOT_FOUND`: Student ID not found
- `WEAK_PASSWORD`: Password doesn't meet requirements
- `INVITATION_FAILED`: Failed to send invitation
- `EMAIL_SEND_FAILED`: Email service failure

### Error Response Format
```json
{
  "error": "رسالة الخطأ بالعربية",
  "code": "ERROR_CODE",
  "details": "Additional error details if available"
}
```

## Testing

### Manual Testing
Use the test script to verify functionality:

```bash
node scripts/test-student-creation.js
```

### Test Coverage
- ✅ Student creation with invitation
- ✅ Bulk student creation
- ✅ Email validation
- ✅ Password hashing and verification
- ✅ Invitation sending and resending
- ✅ Account deactivation/reactivation
- ✅ Credential verification
- ✅ Error handling

## Migration from Legacy System

### Backward Compatibility
The system maintains compatibility with existing student records:
- Legacy students without `userId` are supported
- Automatic user account creation when sending invitations
- Gradual migration of existing data

### Migration Steps
1. Existing students continue to work normally
2. When sending invitations to legacy students, user accounts are created automatically
3. New students always get proper user accounts from creation

## Usage Examples

### Admin Creating a Student
```typescript
// Create student with immediate invitation
const student = await createStudentWithInvitation({
  name: "سارة أحمد",
  email: "sara@example.com",
  phone: "+966501234567",
  courses: [courseId],
  sendInvitation: true,
});

// The admin receives invitation data to share manually if email fails
if (student.invitationData) {
  console.log(`Credentials: ${student.invitationData.tempPassword}`);
}
```

### Bulk Import from CSV
```typescript
// Parse CSV file
const csvContent = "name,email,phone\nأحمد محمد,ahmed@example.com,+966501234567";
const { students, errors } = parseStudentCSV(csvContent);

// Create all students
const result = await bulkCreateStudentsWithInvitations({
  students,
  sendInvitations: true,
});
```

### Student Login Flow
```typescript
// Verify credentials
const credentials = await verifyStudentCredentials({
  email: "student@example.com",
  password: "temporary_password",
});

if (credentials) {
  // Login successful, create session
  const session = await createStudentSession({
    studentId: credentials.student._id,
    sessionData: {
      userId: credentials.user._id,
      email: credentials.user.email,
      role: "student",
      sessionType: "student",
      expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
    },
  });
}
```

## Environment Variables

```bash
# Required for production email sending
RESEND_API_KEY=re_your_resend_api_key

# Application URL for invitation links
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Convex configuration
NEXT_PUBLIC_CONVEX_URL=https://your-convex-deployment.convex.cloud

# Environment mode
NODE_ENV=production
```

## Monitoring and Logging

### Success Logging
- Student creation events
- Invitation sending status
- Authentication attempts
- Password changes

### Error Logging
- Failed student creation attempts
- Email sending failures
- Authentication failures
- Validation errors

### Metrics to Track
- Student creation rate
- Invitation success rate
- Login success rate
- Password reset frequency