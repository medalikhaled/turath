import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { verifyToken } from '@/lib/auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      tests: {},
    };

    // Test 1: Token validation
    const token = request.cookies.get('auth-token')?.value;
    results.tests.tokenPresent = {
      success: !!token,
      message: token ? 'Authentication token found' : 'No authentication token',
    };

    if (token) {
      // Test 2: Token verification
      const payload = await verifyToken(token);
      results.tests.tokenValid = {
        success: !!payload,
        message: payload ? 'Token is valid' : 'Token is invalid or expired',
        details: payload ? {
          userId: payload.userId,
          email: payload.email,
          role: payload.role,
          sessionType: payload.sessionType,
        } : null,
      };

      if (payload) {
        // Test 3: User data retrieval
        try {
          let userData = null;
          if (payload.role === 'student') {
            userData = await convex.query(api.auth.getStudentById, {
              studentId: payload.userId as any,
            });
          } else if (payload.role === 'admin') {
            userData = await convex.query(api.auth.getAdminByEmail, {
              email: payload.email,
            });
          }

          results.tests.userDataRetrieval = {
            success: !!userData,
            message: userData ? 'User data retrieved successfully' : 'User not found or inactive',
            details: userData ? {
              id: userData.id,
              email: userData.email,
              name: userData.name,
              role: payload.role,
            } : null,
          };

          // Test 4: Dashboard data access (for students)
          if (payload.role === 'student' && userData) {
            try {
              const dashboardData = await convex.query(api.dashboard.getStudentDashboardByStudentId, {
                studentId: userData.id as any,
              });

              results.tests.dashboardDataAccess = {
                success: !!dashboardData,
                message: dashboardData ? 'Dashboard data accessible' : 'Dashboard data not accessible',
                details: dashboardData ? {
                  hasStudent: !!dashboardData.student,
                  coursesCount: dashboardData.courses?.length || 0,
                  lessonsCount: dashboardData.weeklySchedule?.length || 0,
                  newsCount: dashboardData.recentNews?.length || 0,
                } : null,
              };
            } catch (error) {
              results.tests.dashboardDataAccess = {
                success: false,
                message: 'Error accessing dashboard data',
                error: error instanceof Error ? error.message : 'Unknown error',
              };
            }
          }
        } catch (error) {
          results.tests.userDataRetrieval = {
            success: false,
            message: 'Error retrieving user data',
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      }
    }

    // Test 5: Database connectivity
    try {
      const courses = await convex.query(api.dashboard.getAllActiveCourses);
      results.tests.databaseConnectivity = {
        success: true,
        message: 'Database connection successful',
        details: {
          activeCourses: courses.length,
        },
      };
    } catch (error) {
      results.tests.databaseConnectivity = {
        success: false,
        message: 'Database connection failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Calculate overall status
    const testResults = Object.values(results.tests);
    const successCount = testResults.filter((test: any) => test.success).length;
    const totalTests = testResults.length;

    results.summary = {
      overall: successCount === totalTests,
      passed: successCount,
      total: totalTests,
      percentage: Math.round((successCount / totalTests) * 100),
    };

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Comprehensive auth test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Comprehensive test failed',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}