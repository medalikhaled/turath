import { StudentProtectedRoute } from '@/components/auth/protected-route';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <StudentProtectedRoute>
      {children}
    </StudentProtectedRoute>
  );
}