import { Id } from '@/convex/_generated/dataModel';

// Student data types
export interface StudentData {
  _id: Id<"students">;
  userId?: Id<"users">;
  name: string;
  email: string;
  phone?: string;
  courses: Id<"courses">[];
  isActive: boolean;
  invitationSent?: boolean;
  lastLogin?: number;
  enrollmentDate: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface StudentInvitationData {
  email: string;
  name: string;
  tempPassword: string;
  loginUrl: string;
}

export interface StudentCreationResult {
  studentId: Id<"students">;
  userId: Id<"users">;
  tempPassword?: string;
  invitationData?: StudentInvitationData;
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateName(name: string): boolean {
  return name.trim().length >= 2;
}

export function validatePassword(password: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  
  if (!/\d/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePhone(phone: string): boolean {
  if (!phone) return true; // Phone is optional
  
  // Basic phone validation (adjust regex based on your requirements)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

// Student status utilities
export function getStudentStatus(student: StudentData): {
  status: 'active' | 'inactive' | 'pending_invitation' | 'invited';
  statusText: string;
  statusColor: string;
} {
  if (!student.isActive) {
    return {
      status: 'inactive',
      statusText: 'غير نشط',
      statusColor: 'red',
    };
  }
  
  if (!student.invitationSent) {
    return {
      status: 'pending_invitation',
      statusText: 'في انتظار الدعوة',
      statusColor: 'yellow',
    };
  }
  
  if (!student.lastLogin) {
    return {
      status: 'invited',
      statusText: 'تم إرسال الدعوة',
      statusColor: 'blue',
    };
  }
  
  return {
    status: 'active',
    statusText: 'نشط',
    statusColor: 'green',
  };
}

// Format utilities
export function formatLastLogin(lastLogin?: number): string {
  if (!lastLogin) return 'لم يسجل دخول بعد';
  
  const date = new Date(lastLogin);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    return 'منذ أقل من ساعة';
  } else if (diffInHours < 24) {
    return `منذ ${diffInHours} ساعة`;
  } else {
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
      return 'منذ يوم واحد';
    } else if (diffInDays < 7) {
      return `منذ ${diffInDays} أيام`;
    } else {
      return date.toLocaleDateString('ar-SA');
    }
  }
}

export function formatEnrollmentDate(enrollmentDate: number): string {
  const date = new Date(enrollmentDate);
  return date.toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Bulk operations utilities
export interface BulkStudentData {
  name: string;
  email: string;
  phone?: string;
  courses?: Id<"courses">[];
}

export function validateBulkStudentData(students: BulkStudentData[]): {
  isValid: boolean;
  errors: Array<{ index: number; field: string; message: string }>;
} {
  const errors: Array<{ index: number; field: string; message: string }> = [];
  
  students.forEach((student, index) => {
    if (!validateName(student.name)) {
      errors.push({
        index,
        field: 'name',
        message: 'اسم الطالب يجب أن يكون حرفين على الأقل',
      });
    }
    
    if (!validateEmail(student.email)) {
      errors.push({
        index,
        field: 'email',
        message: 'صيغة البريد الإلكتروني غير صحيحة',
      });
    }
    
    if (student.phone && !validatePhone(student.phone)) {
      errors.push({
        index,
        field: 'phone',
        message: 'رقم الهاتف غير صالح',
      });
    }
  });
  
  // Check for duplicate emails
  const emailSet = new Set();
  students.forEach((student, index) => {
    const email = student.email.toLowerCase().trim();
    if (emailSet.has(email)) {
      errors.push({
        index,
        field: 'email',
        message: 'البريد الإلكتروني مكرر في القائمة',
      });
    }
    emailSet.add(email);
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// CSV parsing utility for bulk import
export function parseStudentCSV(csvContent: string): {
  students: BulkStudentData[];
  errors: string[];
} {
  const lines = csvContent.trim().split('\n');
  const students: BulkStudentData[] = [];
  const errors: string[] = [];
  
  if (lines.length < 2) {
    errors.push('ملف CSV يجب أن يحتوي على رأس الأعمدة وصف واحد على الأقل');
    return { students, errors };
  }
  
  // Expected headers: name, email, phone (optional)
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  const nameIndex = headers.findIndex(h => h.includes('name') || h.includes('اسم'));
  const emailIndex = headers.findIndex(h => h.includes('email') || h.includes('بريد'));
  const phoneIndex = headers.findIndex(h => h.includes('phone') || h.includes('هاتف'));
  
  if (nameIndex === -1 || emailIndex === -1) {
    errors.push('ملف CSV يجب أن يحتوي على أعمدة الاسم والبريد الإلكتروني');
    return { students, errors };
  }
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    
    if (values.length < Math.max(nameIndex, emailIndex) + 1) {
      errors.push(`الصف ${i + 1}: بيانات ناقصة`);
      continue;
    }
    
    const student: BulkStudentData = {
      name: values[nameIndex],
      email: values[emailIndex],
    };
    
    if (phoneIndex !== -1 && values[phoneIndex]) {
      student.phone = values[phoneIndex];
    }
    
    students.push(student);
  }
  
  return { students, errors };
}

// Security utilities
export function sanitizeStudentInput(input: any): any {
  if (typeof input === 'string') {
    return input.trim().replace(/[<>]/g, '');
  }
  
  if (Array.isArray(input)) {
    return input.map(sanitizeStudentInput);
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeStudentInput(value);
    }
    return sanitized;
  }
  
  return input;
}

// Rate limiting for invitation sending
const invitationAttempts = new Map<string, { count: number; lastAttempt: number }>();

export function checkInvitationRateLimit(email: string, maxAttempts: number = 3, windowMs: number = 60000): {
  allowed: boolean;
  remainingAttempts: number;
  resetTime: number;
} {
  const now = Date.now();
  const key = email.toLowerCase();
  const attempts = invitationAttempts.get(key);
  
  if (!attempts || now - attempts.lastAttempt > windowMs) {
    invitationAttempts.set(key, { count: 1, lastAttempt: now });
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1,
      resetTime: now + windowMs,
    };
  }
  
  if (attempts.count >= maxAttempts) {
    return {
      allowed: false,
      remainingAttempts: 0,
      resetTime: attempts.lastAttempt + windowMs,
    };
  }
  
  attempts.count++;
  attempts.lastAttempt = now;
  invitationAttempts.set(key, attempts);
  
  return {
    allowed: true,
    remainingAttempts: maxAttempts - attempts.count,
    resetTime: attempts.lastAttempt + windowMs,
  };
}