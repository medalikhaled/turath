# Student Authentication System

## Overview

The student authentication system for Hanbali Heritage Academy is now fully implemented with secure password hashing, JWT-based sessions, and proper session management.

## Features Implemented

### ✅ Secure Password Hashing
- Uses bcrypt with 12 salt rounds for maximum security
- Passwords are hashed before storage in the database
- Password verification during login

### ✅ Student Login with Email/Password
- API endpoint: `POST /api/auth/student/login`
- Validates email and password
- Returns JWT token and user information
- Sets secure HTTP-only cookie

### ✅ Session Management
- JWT-based sessions with 7-day expiration for students
- Secure token storage in HTTP-only cookies
- Session validation middleware
- Automatic session refresh

### ✅ Protected Route Access
- Middleware protects student routes (`/dashboard`, `/course/*`)
- Automatic redirection to login for unauthenticated users
- Role-based access control (student vs admin)

### ✅ Logout Functionality
- API endpoint: `POST /api/auth/logout`
- Clears JWT token and cookies
- Server-side session cleanup
- Redirects to login page

## API Endpoints

### Student Authentication
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/student/create` - Create new student (admin only)
- `POST /api/auth/student/update-password` - Update student password (admin only)
- `POST /api/auth/logout` - Logout (both student and admin)
- `GET /api/auth/validate` - Validate current session

### Development/Testing
- `GET /api/auth/test` - Check authentication system status (dev only)
- `POST /api/auth/test` - Create test student (dev only)

## Database Schema

### Students Table
```typescript
{
  email: string,           // Unique email address
  password: string,        // Bcrypt hashed password
  name: string,           // Student full name
  role: "student",        // User role
  isActive: boolean,      // Account status
  enrollmentDate: number, // Timestamp of enrollment
  courses: Id<"courses">[] // Array of enrolled course IDs
}
```

## Security Features

### Password Security
- Bcrypt hashing with 12 salt rounds
- No plain text passwords stored
- Secure password verification

### Session Security
- JWT tokens with expiration
- HTTP-only cookies prevent XSS
- Secure flag in production
- SameSite protection

### Route Protection
- Middleware validates all protected routes
- Automatic role-based redirection
- Session expiry handling

## Usage Examples

### Creating a Student (Admin)
```typescript
const response = await fetch('/api/auth/student/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'student@example.com',
    name: 'اسم الطالب',
    password: 'securePassword123',
    courses: [] // Optional course IDs
  })
});
```

### Student Login
```typescript
const { loginStudent } = useAuthContext();

const result = await loginStudent({
  email: 'student@example.com',
  password: 'securePassword123'
});

if (result.success) {
  // User is now logged in and redirected to dashboard
}
```

### Checking Authentication Status
```typescript
const { user, isAuthenticated, isLoading } = useAuthContext();

if (isLoading) {
  return <LoadingSpinner />;
}

if (!isAuthenticated) {
  return <LoginForm />;
}

return <StudentDashboard user={user} />;
```

## Development Testing

### Test Page
Visit `/dev/auth-test` in development mode to:
- Create test students
- Test login functionality
- Check system status
- View authentication state

### Test Student Creation
```bash
# Create a test student via API
curl -X POST http://localhost:3000/api/auth/test \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create-test-student",
    "email": "test@student.com",
    "name": "طالب تجريبي",
    "password": "password123"
  }'
```

## Error Handling

### Common Error Codes
- `INVALID_CREDENTIALS` - Wrong email or password
- `STUDENT_INACTIVE` - Student account is deactivated
- `STUDENT_NOT_FOUND` - Student doesn't exist
- `STUDENT_EXISTS` - Email already registered
- `NO_TOKEN` - No authentication token provided
- `INVALID_TOKEN` - Token is invalid or expired

### Error Messages (Arabic)
All error messages are provided in Arabic for better user experience:
- "البريد الإلكتروني أو كلمة المرور غير صحيحة" - Invalid credentials
- "حساب الطالب غير نشط" - Student account inactive
- "تم تسجيل الدخول بنجاح" - Login successful
- "تم تسجيل الخروج بنجاح" - Logout successful

## Integration with UI

### Login Page
The unified login page at `/login` automatically detects student emails and shows the password form. The system integrates seamlessly with the existing UI components.

### Auth Provider
The `AuthProvider` component wraps the entire application and provides authentication context to all components.

### Protected Routes
The middleware automatically protects routes and redirects users based on their authentication status and role.

## Next Steps

The student authentication system is now complete and ready for production use. The system includes:

1. ✅ Secure password hashing and validation
2. ✅ JWT-based session management
3. ✅ Protected route access control
4. ✅ Proper logout functionality with session cleanup
5. ✅ Development tools for testing
6. ✅ Comprehensive error handling
7. ✅ Arabic language support

All requirements from task 8.2 have been successfully implemented.