# Admin OTP Authentication System

## Overview

The Admin OTP Authentication System provides secure access to the admin dashboard using email-based One-Time Password (OTP) authentication. This system ensures that only authorized administrators can access sensitive administrative functions.

## Features

### 🔐 Security Features
- **Hardcoded Admin Email List**: Only pre-approved emails can receive OTP codes
- **6-digit OTP Generation**: Secure random OTP codes with 15-minute expiry
- **Rate Limiting**: Maximum 3 OTP requests per email per hour
- **24-hour Sessions**: Long-lasting sessions to reduce authentication frequency
- **JWT-based Session Management**: Secure token-based authentication
- **Automatic Cleanup**: Expired OTPs and sessions are automatically cleaned up

### 📧 Email Integration
- **Development Mode**: OTP codes are logged to console for testing
- **Production Ready**: Supports Resend email service integration
- **Arabic Email Templates**: Professionally designed Arabic email templates
- **Security Warnings**: Email includes security warnings and best practices

### 🛡️ Rate Limiting & Security
- **Request Limiting**: Prevents abuse with hourly request limits
- **Session Validation**: Continuous session validation and renewal
- **Secure Cookies**: HTTP-only, secure cookies for session storage
- **Error Handling**: Comprehensive error handling with Arabic messages

## Admin Email Configuration

The system uses a hardcoded list of authorized admin emails:

```typescript
const ADMIN_EMAILS = [
  'admin@hanbaliacademy.com',
  'superadmin@hanbaliacademy.com',
  'director@hanbaliacademy.com',
];
```

### Adding New Admin Emails

To add new admin emails, update the `ADMIN_EMAILS` array in:
1. `convex/otp.ts` (line 8)
2. `lib/admin-utils.ts` (line 4)

## API Endpoints

### Send OTP
```
POST /api/auth/admin/send-otp
Body: { email: string }
```

### Verify OTP
```
POST /api/auth/admin/verify-otp
Body: { email: string, otp: string }
```

### Validate Session
```
GET /api/auth/admin/validate-session
```

### Logout
```
POST /api/auth/admin/logout
```

## Database Schema

### Admin OTPs Table
```typescript
adminOTPs: {
  email: string,
  otp: string,
  expiresAt: number,
  createdAt: number,
  attempts: number,
  isUsed: boolean,
}
```

### Admin Sessions Table
```typescript
adminSessions: {
  email: string,
  expiresAt: number,
  createdAt: number,
  lastAccessAt: number,
}
```

## React Hook Usage

```typescript
import { useAdminAuth } from '../hooks/use-admin-auth';

function AdminComponent() {
  const { 
    user, 
    session, 
    isLoading, 
    isAuthenticated, 
    sendOTP, 
    verifyOTP, 
    logout 
  } = useAdminAuth();

  // Send OTP
  const handleSendOTP = async () => {
    const result = await sendOTP('admin@hanbaliacademy.com');
    if (result.success) {
      console.log('OTP sent successfully');
    }
  };

  // Verify OTP
  const handleVerifyOTP = async () => {
    const result = await verifyOTP('admin@hanbaliacademy.com', '123456');
    if (result.success) {
      console.log('Authentication successful');
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>Welcome, {user?.email}</div>
      ) : (
        <div>Please authenticate</div>
      )}
    </div>
  );
}
```

## Testing

### Development Testing
1. Visit `/dev/admin-auth-test` for basic authentication testing
2. Visit `/dev/otp-system-test` for comprehensive system testing
3. Visit `/dev/admin-dashboard-test` for authenticated dashboard testing

### Test Scenarios
- ✅ Send OTP to authorized email
- ✅ Verify valid OTP code
- ✅ Handle invalid OTP codes
- ✅ Rate limiting enforcement
- ✅ Session creation and validation
- ✅ Session expiry handling
- ✅ Logout functionality
- ✅ Cleanup expired data

## Configuration

### Environment Variables
```env
JWT_SECRET=your-secret-key-change-in-production
RESEND_API_KEY=your-resend-api-key-for-production
NODE_ENV=development|production
```

### Email Service Configuration
The system supports multiple email services:

#### Development (Mock Service)
- OTP codes are logged to console
- No actual emails are sent
- Useful for testing and development

#### Production (Resend Service)
- Requires `RESEND_API_KEY` environment variable
- Sends professional Arabic email templates
- Includes security warnings and branding

## Security Considerations

### Best Practices Implemented
1. **Email Validation**: Only authorized emails can request OTPs
2. **Rate Limiting**: Prevents brute force attacks
3. **Short OTP Expiry**: 15-minute expiry reduces attack window
4. **Secure Sessions**: HTTP-only cookies with proper security flags
5. **Input Validation**: All inputs are validated and sanitized
6. **Error Handling**: Generic error messages prevent information leakage

### Recommendations
1. **Regular Email List Review**: Periodically review and update admin email list
2. **Monitor Failed Attempts**: Implement logging for failed authentication attempts
3. **Session Monitoring**: Monitor active admin sessions for suspicious activity
4. **Email Security**: Ensure admin email accounts have strong security measures

## Troubleshooting

### Common Issues

#### OTP Not Received
- Check console logs in development mode
- Verify email is in authorized admin list
- Check rate limiting (max 3 requests per hour)

#### Session Expired
- Sessions last 24 hours from creation
- Use the validate session endpoint to check status
- Re-authenticate if session is expired

#### Rate Limiting
- Maximum 3 OTP requests per email per hour
- Wait for the rate limit to reset
- Use cleanup function to clear expired data

### Debug Tools
- Use `/dev/otp-system-test` for comprehensive testing
- Check browser console for detailed error messages
- Monitor Convex dashboard for database operations

## Future Enhancements

### Planned Features
1. **Role-based Permissions**: Different admin roles with specific permissions
2. **Audit Logging**: Comprehensive logging of admin actions
3. **Multi-factor Authentication**: Additional security layers
4. **Admin Management UI**: Interface for managing admin users
5. **Session Management**: View and manage active admin sessions

### Integration Points
- Admin dashboard components
- Protected route middleware
- Audit logging system
- User management interface