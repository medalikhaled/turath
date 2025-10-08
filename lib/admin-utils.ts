// Admin email management utilities

// Hardcoded admin emails - these should match the ones in convex/otp.ts
export const ADMIN_EMAILS = [
  'admin@hanbaliacademy.com',
  'superadmin@hanbaliacademy.com',
  'director@hanbaliacademy.com',
] as const;

export type AdminEmail = typeof ADMIN_EMAILS[number];

// Check if an email is in the admin list
export function isAdminEmail(email: string): email is AdminEmail {
  return ADMIN_EMAILS.includes(email as AdminEmail);
}

// Get admin email display name
export function getAdminDisplayName(email: AdminEmail): string {
  const displayNames: Record<AdminEmail, string> = {
    'admin@hanbaliacademy.com': 'مدير النظام',
    'superadmin@hanbaliacademy.com': 'المدير العام',
    'director@hanbaliacademy.com': 'مدير الأكاديمية',
  };

  return displayNames[email] || 'مدير';
}

// Validate email format
export function isValidEmailFormat(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Format OTP for display (add spaces for readability)
export function formatOTP(otp: string): string {
  return otp.replace(/(\d{3})(\d{3})/, '$1 $2');
}

// Calculate time remaining until expiry
export function getTimeRemaining(expiresAt: number): {
  minutes: number;
  seconds: number;
  isExpired: boolean;
} {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) {
    return { minutes: 0, seconds: 0, isExpired: true };
  }

  const minutes = Math.floor(remaining / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);

  return { minutes, seconds, isExpired: false };
}

// Format time remaining as string
export function formatTimeRemaining(expiresAt: number): string {
  const { minutes, seconds, isExpired } = getTimeRemaining(expiresAt);

  if (isExpired) {
    return 'منتهي الصلاحية';
  }

  if (minutes > 0) {
    return `${minutes} دقيقة و ${seconds} ثانية`;
  }

  return `${seconds} ثانية`;
}

// Session duration constants
export const SESSION_DURATION = {
  OTP_EXPIRY_MINUTES: 15,
  ADMIN_SESSION_HOURS: 24,
  MAX_OTP_REQUESTS_PER_HOUR: 3,
} as const;

// Rate limiting helper
export function canRequestOTP(recentRequestsCount: number): boolean {
  return recentRequestsCount < SESSION_DURATION.MAX_OTP_REQUESTS_PER_HOUR;
}

// Calculate next allowed OTP request time
export function getNextOTPRequestTime(lastRequestTime: number): number {
  return lastRequestTime + (60 * 60 * 1000); // 1 hour from last request
}

// Admin role permissions (for future use)
export const ADMIN_PERMISSIONS = {
  MANAGE_STUDENTS: 'manage_students',
  MANAGE_COURSES: 'manage_courses',
  MANAGE_MEETINGS: 'manage_meetings',
  MANAGE_NEWS: 'manage_news',
  MANAGE_FILES: 'manage_files',
  VIEW_ANALYTICS: 'view_analytics',
} as const;

export type AdminPermission = typeof ADMIN_PERMISSIONS[keyof typeof ADMIN_PERMISSIONS];

// Get permissions for admin email (for future role-based access)
export function getAdminPermissions(email: AdminEmail): AdminPermission[] {
  // For now, all admins have all permissions
  // In the future, you could implement role-based permissions
  return Object.values(ADMIN_PERMISSIONS);
}

// Check if admin has specific permission
export function hasPermission(email: AdminEmail, permission: AdminPermission): boolean {
  const permissions = getAdminPermissions(email);
  return permissions.includes(permission);
}