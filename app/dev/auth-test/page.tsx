import { StudentAuthTest } from '@/components/auth/StudentAuthTest';

export default function AuthTestPage() {
  if (process.env.NODE_ENV === 'production') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>هذه الصفحة متاحة فقط في بيئة التطوير</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-2">
            اختبار نظام المصادقة
          </h1>
          <p className="text-blue-200">
            صفحة تطوير لاختبار نظام مصادقة الطلاب
          </p>
        </div>

        <StudentAuthTest />

        <div className="text-center">
          <p className="text-white/60 text-sm">
            هذه الصفحة متاحة فقط في بيئة التطوير
          </p>
        </div>
      </div>
    </div>
  );
}