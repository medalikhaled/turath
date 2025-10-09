"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuthContext } from '@/providers/auth-provider';
import { 
  testStudentLogin, 
  testSessionValidation, 
  testLogout, 
  runAuthenticationTests, 
  formatTestResults,
  AuthTestResult 
} from '@/lib/auth-test-utils';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Play, User, Shield, RefreshCw } from 'lucide-react';

export function AuthTestPanel() {
  const [testEmail, setTestEmail] = useState('');
  const [testPassword, setTestPassword] = useState('');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<Record<string, AuthTestResult> | null>(null);
  const [overallResult, setOverallResult] = useState<boolean | null>(null);
  
  const { user, isAuthenticated, sessionType, logout } = useAuthContext();

  const runIndividualTest = async (testName: string, testFunction: () => Promise<AuthTestResult>) => {
    setIsRunningTests(true);
    try {
      const result = await testFunction();
      setTestResults(prev => ({ ...prev, [testName]: result }));
      
      if (result.success) {
        toast.success(`✅ ${testName} passed`);
      } else {
        toast.error(`❌ ${testName} failed: ${result.error || result.message}`);
      }
    } catch (error) {
      const errorResult: AuthTestResult = {
        success: false,
        message: `Test execution failed`,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
      setTestResults(prev => ({ ...prev, [testName]: errorResult }));
      toast.error(`❌ ${testName} execution failed`);
    } finally {
      setIsRunningTests(false);
    }
  };

  const runComprehensiveTests = async () => {
    if (!testEmail || !testPassword) {
      toast.error('Please provide test credentials');
      return;
    }

    setIsRunningTests(true);
    setTestResults(null);
    setOverallResult(null);

    try {
      const { overall, results } = await runAuthenticationTests({
        email: testEmail,
        password: testPassword
      });

      setTestResults(results);
      setOverallResult(overall);

      if (overall) {
        toast.success('🎉 All authentication tests passed!');
      } else {
        toast.error('⚠️ Some authentication tests failed');
      }

      // Log detailed results to console
      console.log('Authentication Test Results:');
      console.log(formatTestResults(results));
    } catch (error) {
      toast.error('Failed to run comprehensive tests');
      console.error('Test execution error:', error);
    } finally {
      setIsRunningTests(false);
    }
  };

  const clearResults = () => {
    setTestResults(null);
    setOverallResult(null);
  };

  const TestResultBadge = ({ result }: { result: AuthTestResult }) => (
    <Badge variant={result.success ? "default" : "destructive"} className="ml-2">
      {result.success ? (
        <CheckCircle className="w-3 h-3 mr-1" />
      ) : (
        <XCircle className="w-3 h-3 mr-1" />
      )}
      {result.success ? 'PASS' : 'FAIL'}
    </Badge>
  );

  return (
    <div className="space-y-6">
      {/* Current Authentication Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isAuthenticated ? (
              <Shield className="w-5 h-5 text-green-600" />
            ) : (
              <User className="w-5 h-5 text-gray-400" />
            )}
            Current Authentication Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Authenticated:</span>
              <Badge variant={isAuthenticated ? "default" : "secondary"}>
                {isAuthenticated ? 'Yes' : 'No'}
              </Badge>
            </div>
            {isAuthenticated && (
              <>
                <div className="flex items-center justify-between">
                  <span>User:</span>
                  <span className="font-mono text-sm">{user?.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Role:</span>
                  <Badge variant="outline">{user?.role}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Session Type:</span>
                  <Badge variant="outline">{sessionType}</Badge>
                </div>
                <Button 
                  onClick={logout} 
                  variant="outline" 
                  size="sm" 
                  className="w-full mt-2"
                >
                  Logout Current Session
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Test Credentials */}
      <Card>
        <CardHeader>
          <CardTitle>Test Credentials</CardTitle>
          <CardDescription>
            Provide student credentials to test the authentication system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-email">Test Email</Label>
            <Input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="student@example.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="test-password">Test Password</Label>
            <Input
              id="test-password"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              placeholder="Enter test password"
            />
          </div>
        </CardContent>
      </Card>

      {/* Individual Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Tests</CardTitle>
          <CardDescription>
            Run specific authentication tests individually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            onClick={() => runIndividualTest('sessionValidation', testSessionValidation)}
            disabled={isRunningTests}
            variant="outline"
            className="w-full justify-start"
          >
            <Play className="w-4 h-4 mr-2" />
            Test Session Validation
            {testResults?.sessionValidation && (
              <TestResultBadge result={testResults.sessionValidation} />
            )}
          </Button>

          <Button
            onClick={() => runIndividualTest('studentLogin', () => testStudentLogin(testEmail, testPassword))}
            disabled={isRunningTests || !testEmail || !testPassword}
            variant="outline"
            className="w-full justify-start"
          >
            <Play className="w-4 h-4 mr-2" />
            Test Student Login
            {testResults?.studentLogin && (
              <TestResultBadge result={testResults.studentLogin} />
            )}
          </Button>

          <Button
            onClick={() => runIndividualTest('logout', testLogout)}
            disabled={isRunningTests}
            variant="outline"
            className="w-full justify-start"
          >
            <Play className="w-4 h-4 mr-2" />
            Test Logout
            {testResults?.logout && (
              <TestResultBadge result={testResults.logout} />
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Comprehensive Tests */}
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive Authentication Tests</CardTitle>
          <CardDescription>
            Run all authentication tests in sequence
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={runComprehensiveTests}
              disabled={isRunningTests || !testEmail || !testPassword}
              className="flex-1"
            >
              {isRunningTests ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Run All Tests
            </Button>
            <Button
              onClick={clearResults}
              variant="outline"
              disabled={!testResults}
            >
              Clear Results
            </Button>
          </div>

          {overallResult !== null && (
            <div className="p-4 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                {overallResult ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <span className="font-semibold">
                  Overall Result: {overallResult ? 'PASS' : 'FAIL'}
                </span>
              </div>
              
              {testResults && (
                <div className="space-y-2">
                  <Separator />
                  <div className="text-sm space-y-1">
                    {Object.entries(testResults).map(([testName, result]) => (
                      <div key={testName} className="flex items-center justify-between">
                        <span className="capitalize">{testName.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <TestResultBadge result={result} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Results Details */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Detailed Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-auto max-h-96">
              {formatTestResults(testResults)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}