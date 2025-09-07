"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  UsersIcon, 
  BookOpenIcon, 
  VideoIcon, 
  FileIcon,
  PlusIcon,
  CalendarIcon,
  NewspaperIcon,
  TrendingUpIcon,
  ClockIcon,
  DownloadIcon
} from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

interface StatCardProps {
  title: string
  value: number | string
  icon: React.ComponentType<{ className?: string }>
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
}

function StatCard({ title, value, icon: Icon, trend, description }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium arabic-text">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div className="flex items-center text-xs text-muted-foreground">
            <TrendingUpIcon className={`h-3 w-3 mr-1 ${trend.isPositive ? 'text-green-500' : 'text-red-500 rotate-180'}`} />
            <span className={trend.isPositive ? 'text-green-500' : 'text-red-500'}>
              {trend.value}%
            </span>
            <span className="mr-1 arabic-text">من الأسبوع الماضي</span>
          </div>
        )}
        {description && (
          <p className="text-xs text-muted-foreground arabic-text mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickActionProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  href: string
  variant?: "default" | "secondary" | "outline"
}

function QuickActionCard({ title, description, icon: Icon, href, variant = "default" }: QuickActionProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 space-x-reverse">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold arabic-text">{title}</h3>
            <p className="text-sm text-muted-foreground arabic-text">{description}</p>
          </div>
          <Button variant={variant} size="sm" asChild>
            <a href={href}>
              <PlusIcon className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 بايت'
  const k = 1024
  const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatArabicDate(date: number): string {
  try {
    return formatDistanceToNow(new Date(date), { 
      addSuffix: true, 
      locale: ar 
    })
  } catch {
    return 'منذ وقت قريب'
  }
}

export function AdminDashboard() {
  const dashboardData = useQuery(api.dashboard.getAdminDashboard)

  if (!dashboardData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold arabic-text">لوحة التحكم</h1>
        </div>
        
        {/* Loading Statistics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center space-x-4 space-x-reverse">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const { statistics, todaysMeetings, upcomingMeetings, recentNews, recentActivity } = dashboardData

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold arabic-text">لوحة التحكم</h1>
          <p className="text-muted-foreground arabic-text">
            نظرة عامة على أنشطة الأكاديمية
          </p>
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <Badge variant="outline" className="arabic-text">
            <ClockIcon className="h-3 w-3 ml-1" />
            آخر تحديث: الآن
          </Badge>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="إجمالي الطلاب"
          value={statistics.totalStudents}
          icon={UsersIcon}
          description="الطلاب النشطون"
        />
        <StatCard
          title="المقررات الدراسية"
          value={statistics.totalCourses}
          icon={BookOpenIcon}
          description="المقررات المتاحة"
        />
        <StatCard
          title="جلسات اليوم"
          value={statistics.todaysMeetings}
          icon={VideoIcon}
          description="الجلسات المجدولة اليوم"
        />
        <StatCard
          title="الملفات المرفوعة"
          value={statistics.totalFiles}
          icon={FileIcon}
          description={`${formatFileSize(statistics.totalFileSize)} إجمالي`}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4 arabic-text">الإجراءات السريعة</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <QuickActionCard
            title="إنشاء جلسة جديدة"
            description="إضافة جلسة Google Meet جديدة"
            icon={VideoIcon}
            href="/admin/meetings"
          />
          <QuickActionCard
            title="جدولة درس"
            description="إضافة درس جديد للجدول الأسبوعي"
            icon={CalendarIcon}
            href="/admin/schedule"
          />
          <QuickActionCard
            title="إضافة مقرر"
            description="إنشاء مقرر دراسي جديد"
            icon={BookOpenIcon}
            href="/admin/courses"
          />
          <QuickActionCard
            title="نشر إعلان"
            description="إضافة خبر أو إعلان جديد"
            icon={NewspaperIcon}
            href="/admin/news"
          />
          <QuickActionCard
            title="إدارة الطلاب"
            description="عرض وإدارة حسابات الطلاب"
            icon={UsersIcon}
            href="/admin/students"
            variant="secondary"
          />
          <QuickActionCard
            title="رفع ملفات"
            description="إضافة مواد تعليمية ومرفقات"
            icon={FileIcon}
            href="/admin/courses"
            variant="outline"
          />
        </div>
      </div>

      {/* Recent Activity and Upcoming Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Meetings */}
        <Card>
          <CardHeader>
            <CardTitle className="arabic-text">الجلسات القادمة</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-3">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <VideoIcon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium arabic-text">جلسة مباشرة</p>
                        <p className="text-sm text-muted-foreground">
                          {formatArabicDate(meeting.scheduledTime)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="arabic-text">
                      {Math.round(meeting.duration / 60)} دقيقة
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground arabic-text">لا توجد جلسات مجدولة</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="arabic-text">النشاط الأخير</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((file) => (
                  <div key={file._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                        <DownloadIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium text-sm truncate max-w-[150px]" title={file.name}>
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatArabicDate(file.uploadedAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <FileIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground arabic-text">لا يوجد نشاط حديث</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent News */}
      {recentNews.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="arabic-text">آخر الأخبار والإعلانات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentNews.map((news) => (
                <div key={news._id} className="flex items-start justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium arabic-text mb-1">{news.title}</h3>
                    <p className="text-sm text-muted-foreground arabic-text line-clamp-2">
                      {news.content.substring(0, 100)}...
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatArabicDate(news.publishedAt)}
                    </p>
                  </div>
                  <Badge variant="outline" className="arabic-text">
                    إعلان
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}