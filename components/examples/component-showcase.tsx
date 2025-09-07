"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Navigation } from "@/components/shared/navigation"
import { StudentLayout } from "@/components/layouts/student-layout"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { 
  CardSkeleton, 
  DashboardSkeleton, 
  LoadingSpinner, 
  PageLoading,
  FormSkeleton 
} from "@/components/shared/loading-states"
import { Skeleton } from "@/components/ui/skeleton"

export function ComponentShowcase() {
  const [currentView, setCurrentView] = React.useState<"components" | "student" | "admin" | "loading">("components")
  const [isLoading, setIsLoading] = React.useState(false)

  const handleSignOut = () => {
    alert("تسجيل الخروج")
  }

  if (currentView === "student") {
    return (
      <StudentLayout userName="أحمد محمد" onSignOut={handleSignOut}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold arabic-text">مرحباً أحمد</h1>
              <p className="text-muted-foreground arabic-text">استكمل دراستك في تراث الحنابلة</p>
            </div>
            <Button onClick={() => setCurrentView("components")}>
              العودة للمكونات
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">المقررات الحالية</CardTitle>
                <CardDescription className="arabic-text">3 مقررات نشطة</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="arabic-text">فقه العبادات، أصول الفقه، السيرة النبوية</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">الجلسات القادمة</CardTitle>
                <CardDescription className="arabic-text">جلستان هذا الأسبوع</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="arabic-text">الأحد: فقه العبادات<br/>الثلاثاء: أصول الفقه</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">التقدم الأكاديمي</CardTitle>
                <CardDescription className="arabic-text">85% مكتمل</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: "85%" }}></div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </StudentLayout>
    )
  }

  if (currentView === "admin") {
    return (
      <AdminLayout userName="د. محمد الأحمد" onSignOut={handleSignOut} currentPage="dashboard">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold arabic-text">لوحة التحكم</h1>
              <p className="text-muted-foreground arabic-text">إدارة منصة تراث الحنابلة</p>
            </div>
            <Button onClick={() => setCurrentView("components")}>
              العودة للمكونات
            </Button>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">إجمالي الطلاب</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground arabic-text">+12 هذا الشهر</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">الجلسات النشطة</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground arabic-text">جلسات هذا الأسبوع</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">المقررات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground arabic-text">مقرر متاح</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="arabic-text">معدل الحضور</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92%</div>
                <p className="text-xs text-muted-foreground arabic-text">هذا الشهر</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (currentView === "loading") {
    return (
      <div className="container mx-auto px-4 py-6 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold arabic-text">حالات التحميل</h1>
          <Button onClick={() => setCurrentView("components")}>
            العودة للمكونات
          </Button>
        </div>

        <div className="grid gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">Loading Spinner</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-4 items-center">
              <LoadingSpinner size="sm" />
              <LoadingSpinner size="default" />
              <LoadingSpinner size="lg" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">Page Loading</CardTitle>
            </CardHeader>
            <CardContent>
              <PageLoading message="جاري تحميل البيانات..." />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">Card Skeleton</CardTitle>
            </CardHeader>
            <CardContent>
              <CardSkeleton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">Form Skeleton</CardTitle>
            </CardHeader>
            <CardContent>
              <FormSkeleton />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="arabic-text">Dashboard Skeleton</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardSkeleton />
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold arabic-text">مكونات تراث الحنابلة</h1>
        <p className="text-lg text-muted-foreground arabic-text">
          عرض شامل لجميع مكونات واجهة المستخدم
        </p>
      </div>

      {/* Navigation Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-text">شريط التنقل</CardTitle>
          <CardDescription className="arabic-text">
            شريط تنقل متجاوب مع شعار عربي وقائمة المستخدم
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Navigation userName="أحمد محمد" userType="student" onSignOut={handleSignOut} />
        </CardContent>
      </Card>

      {/* Layout Demos */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="arabic-text">تخطيط الطالب</CardTitle>
            <CardDescription className="arabic-text">
              تخطيط بسيط ونظيف للطلاب
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentView("student")}
              className="w-full"
            >
              عرض تخطيط الطالب
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="arabic-text">تخطيط المدير</CardTitle>
            <CardDescription className="arabic-text">
              تخطيط متقدم مع شريط جانبي للإدارة
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setCurrentView("admin")}
              className="w-full"
            >
              عرض تخطيط المدير
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* UI Components */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-text">المكونات الأساسية</CardTitle>
          <CardDescription className="arabic-text">
            أزرار، بطاقات، نماذج وحقول الإدخال
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Buttons */}
          <div className="space-y-3">
            <h3 className="font-semibold arabic-text">الأزرار</h3>
            <div className="flex flex-wrap gap-2">
              <Button>افتراضي</Button>
              <Button variant="secondary">ثانوي</Button>
              <Button variant="outline">محدد</Button>
              <Button variant="ghost">شفاف</Button>
              <Button variant="destructive">حذف</Button>
              <Button variant="link">رابط</Button>
            </div>
          </div>

          {/* Form Elements */}
          <div className="space-y-3">
            <h3 className="font-semibold arabic-text">عناصر النموذج</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="arabic-text">الاسم</Label>
                <Input id="name" placeholder="أدخل اسمك" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="arabic-text">البريد الإلكتروني</Label>
                <Input id="email" type="email" placeholder="example@email.com" />
              </div>
            </div>
          </div>

          {/* Cards */}
          <div className="space-y-3">
            <h3 className="font-semibold arabic-text">البطاقات</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">بطاقة بسيطة</CardTitle>
                  <CardDescription className="arabic-text">وصف البطاقة</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="arabic-text">محتوى البطاقة هنا</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">بطاقة مع إجراء</CardTitle>
                  <CardDescription className="arabic-text">بطاقة تحتوي على زر</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="arabic-text">إجراء</Button>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="arabic-text">بطاقة ملونة</CardTitle>
                  <CardDescription className="arabic-text">بطاقة بخلفية ملونة</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gradient-to-r from-primary to-primary/60 rounded-md"></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading States */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-text">حالات التحميل</CardTitle>
          <CardDescription className="arabic-text">
            مكونات التحميل والهياكل العظمية
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={() => setCurrentView("loading")}
            className="w-full"
          >
            عرض حالات التحميل
          </Button>
        </CardContent>
      </Card>

      {/* Interactive Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="arabic-text">عرض تفاعلي</CardTitle>
          <CardDescription className="arabic-text">
            اختبر التفاعل مع المكونات
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => setIsLoading(!isLoading)}
              disabled={isLoading}
            >
              {isLoading ? "جاري التحميل..." : "ابدأ التحميل"}
            </Button>
            {isLoading && <LoadingSpinner />}
          </div>
          
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}