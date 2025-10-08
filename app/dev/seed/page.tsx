import { ComprehensiveSeed } from "@/components/admin/simple-seed"

export default function SeedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white arabic-text mb-3">
            🎓 أكاديمية تراث الحنابلة
          </h1>
          <h2 className="text-2xl font-semibold text-blue-200 arabic-text mb-2">
            إدارة البيانات التجريبية الشاملة
          </h2>
          <p className="text-blue-300 arabic-text max-w-2xl mx-auto">
            إنشاء بيانات تجريبية كاملة تشمل حسابات المستخدمين، المقررات الدراسية، الجلسات، والأخبار
          </p>
        </div>
        
        <ComprehensiveSeed />
      </div>
    </div>
  )
}