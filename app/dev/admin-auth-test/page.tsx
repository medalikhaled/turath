import { AdminAuthTest } from '../../../components/auth/AdminAuthTest';

export default function AdminAuthTestPage() {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">اختبار نظام المصادقة للمدراء</h1>
          <p className="text-muted-foreground">
            اختبار نظام OTP مع إدارة الجلسات لمدة 24 ساعة
          </p>
        </div>
        
        <AdminAuthTest />
      </div>
    </div>
  );
}