"use client";

import { useAuthContext } from '@/providers/auth-provider';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function DebugAuthPage() {
  const { user, isLoading, isAuthenticated, sessionType } = useAuthContext();
  
  // Try to get admin user data
  const adminData = useQuery(api.auth.getAdminByEmail, 
    user?.email ? { email: user.email } : "skip"
  );

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Debug Authentication</h1>
      
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Current Auth State:</h2>
          <pre className="text-sm">
            {JSON.stringify({
              isLoading,
              isAuthenticated,
              sessionType,
              user
            }, null, 2)}
          </pre>
        </div>

        {user?.email && (
          <div className="bg-card p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Admin Data from Database:</h2>
            <pre className="text-sm">
              {JSON.stringify(adminData, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-card p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Test Links:</h2>
          <div className="space-y-2">
            <a href="/dashboard" className="block text-blue-500 hover:underline">
              Student Dashboard (/dashboard)
            </a>
            <a href="/admin/dashboard" className="block text-blue-500 hover:underline">
              Admin Dashboard (/admin/dashboard)
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}