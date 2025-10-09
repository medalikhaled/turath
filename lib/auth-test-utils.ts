/**
 * Authentication Test Utilities
 * Provides functions to test and validate the authentication system
 */

export interface AuthTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

/**
 * Test student login functionality
 */
export async function testStudentLogin(email: string, password: string): Promise<AuthTestResult> {
  try {
    const response = await fetch('/api/auth/student/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        message: 'Student login test successful',
        details: {
          user: data.user,
          sessionType: data.sessionType,
          hasToken: !!data.token,
        },
      };
    } else {
      return {
        success: false,
        message: 'Student login test failed',
        error: data.error,
        details: {
          code: data.code,
          status: response.status,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Student login test error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test session validation
 */
export async function testSessionValidation(): Promise<AuthTestResult> {
  try {
    const response = await fetch('/api/auth/validate', {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok && data.valid) {
      return {
        success: true,
        message: 'Session validation test successful',
        details: {
          user: data.user,
          sessionType: data.sessionType,
          expiresAt: data.expiresAt,
          issuedAt: data.issuedAt,
        },
      };
    } else {
      return {
        success: false,
        message: 'Session validation test failed',
        error: data.error,
        details: {
          code: data.code,
          status: response.status,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Session validation test error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test logout functionality
 */
export async function testLogout(): Promise<AuthTestResult> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });

    const data = await response.json();

    if (response.ok && data.success) {
      return {
        success: true,
        message: 'Logout test successful',
        details: data,
      };
    } else {
      return {
        success: false,
        message: 'Logout test failed',
        error: data.error || 'Unknown error',
        details: {
          status: response.status,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: 'Logout test error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Test protected route access
 */
export async function testProtectedRoute(path: string): Promise<AuthTestResult> {
  try {
    const response = await fetch(path, {
      method: 'GET',
      credentials: 'include',
      redirect: 'manual', // Don't follow redirects
    });

    if (response.status === 200) {
      return {
        success: true,
        message: `Protected route access successful: ${path}`,
        details: {
          status: response.status,
          path,
        },
      };
    } else if (response.status === 302 || response.status === 307) {
      const location = response.headers.get('location');
      return {
        success: false,
        message: `Protected route redirected: ${path}`,
        details: {
          status: response.status,
          redirectTo: location,
          path,
        },
      };
    } else {
      return {
        success: false,
        message: `Protected route access failed: ${path}`,
        details: {
          status: response.status,
          path,
        },
      };
    }
  } catch (error) {
    return {
      success: false,
      message: `Protected route test error: ${path}`,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Run comprehensive authentication tests
 */
export async function runAuthenticationTests(testCredentials?: { email: string; password: string }): Promise<{
  overall: boolean;
  results: Record<string, AuthTestResult>;
}> {
  const results: Record<string, AuthTestResult> = {};

  // Test 1: Session validation (current state)
  results.sessionValidation = await testSessionValidation();

  // Test 2: Protected route access (should redirect if not authenticated)
  results.protectedRouteAccess = await testProtectedRoute('/dashboard');

  // Test 3: Student login (if credentials provided)
  if (testCredentials) {
    results.studentLogin = await testStudentLogin(testCredentials.email, testCredentials.password);
    
    // Test 4: Session validation after login
    if (results.studentLogin.success) {
      results.sessionValidationAfterLogin = await testSessionValidation();
      
      // Test 5: Protected route access after login
      results.protectedRouteAccessAfterLogin = await testProtectedRoute('/dashboard');
      
      // Test 6: Logout
      results.logout = await testLogout();
      
      // Test 7: Session validation after logout
      results.sessionValidationAfterLogout = await testSessionValidation();
    }
  }

  // Determine overall success
  const overall = Object.values(results).every(result => result.success);

  return { overall, results };
}

/**
 * Format test results for display
 */
export function formatTestResults(results: Record<string, AuthTestResult>): string {
  let output = 'Authentication Test Results:\n';
  output += '================================\n\n';

  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    output += `${status} ${testName}\n`;
    output += `   Message: ${result.message}\n`;
    
    if (result.error) {
      output += `   Error: ${result.error}\n`;
    }
    
    if (result.details) {
      output += `   Details: ${JSON.stringify(result.details, null, 2)}\n`;
    }
    
    output += '\n';
  });

  return output;
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(userRole: string, requiredRole?: string): boolean {
  if (!requiredRole) return true;
  
  // Allow admins to access student routes
  if (requiredRole === 'student' && userRole === 'admin') {
    return true;
  }
  
  return userRole === requiredRole;
}

/**
 * Get default redirect path for user role
 */
export function getDefaultRedirectPath(userRole: string): string {
  switch (userRole) {
    case 'admin':
      return '/admin/dashboard';
    case 'student':
      return '/dashboard';
    default:
      return '/login';
  }
}