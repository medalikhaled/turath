import { SeedAuthData } from "@/components/admin/seed-auth-data"

export default function SeedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white arabic-text mb-2">
            صفحة البيانات التجريبية
          </h1>
          <p className="text-blue-200 arabic-text">
            إنشاء وإدارة البيانات التجريبية للنظام
          </p>
        </div>
        
        <SeedAuthData />
      </div>
    </div>
  )
}