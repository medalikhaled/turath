"use client";

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Button } from '@/components/ui/button';

export default function CreateAdminPage() {
  const [result, setResult] = useState<any>(null);
  const createAdmin = useMutation(api.createSpecificAdmin.createSpecificAdmin);

  const handleCreateAdmin = async () => {
    try {
      const result = await createAdmin();
      setResult(result);
    } catch (error) {
      setResult({ error: error.message });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Create Admin User</h1>
      
      <div className="space-y-4">
        <Button onClick={handleCreateAdmin}>
          Create Admin User (medalikhaled331@gmail.com)
        </Button>

        {result && (
          <div className="bg-card p-4 rounded-lg">
            <h2 className="font-semibold mb-2">Result:</h2>
            <pre className="text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}