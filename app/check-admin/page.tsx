"use client";

import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';

export default function CheckAdminPage() {
  const adminCheck = useQuery(api.auth.getAdminByEmail, {
    email: "medalikhaled331@gmail.com"
  });

  const allStudents = useQuery(api.students.getActiveStudents);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Check Admin User</h1>
      
      <div className="space-y-4">
        <div className="bg-card p-4 rounded-lg">
          <h2 className="font-semibold mb-2">Admin Check for medalikhaled331@gmail.com:</h2>
          <pre className="text-sm">
            {JSON.stringify(adminCheck, null, 2)}
          </pre>
        </div>

        <div className="bg-card p-4 rounded-lg">
          <h2 className="font-semibold mb-2">All Active Students/Users:</h2>
          <pre className="text-sm">
            {JSON.stringify(allStudents, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}