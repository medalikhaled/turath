"use client"

import * as React from "react"
import { Navigation } from "@/components/shared/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { 
  CalendarIcon, 
  BookOpenIcon, 
  UsersIcon, 
  NewspaperIcon,
  LayoutDashboardIcon,
  VideoIcon,
  MenuIcon,
  XIcon
} from "lucide-react"

interface AdminLayoutProps {
  children: React.ReactNode
  className?: string
  userName?: string
  onSignOut?: () => void
  currentPage?: string
}

const sidebarItems = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    icon: LayoutDashboardIcon,
    href: "/admin/dashboard"
  },
  {
    id: "meetings",
    label: "إدارة الجلسات",
    icon: VideoIcon,
    href: "/admin/meetings"
  },
  {
    id: "schedule",
    label: "الجدول الأسبوعي",
    icon: CalendarIcon,
    href: "/admin/schedule"
  },
  {
    id: "courses",
    label: "إدارة المقررات",
    icon: BookOpenIcon,
    href: "/admin/courses"
  },
  {
    id: "news",
    label: "الأخبار والإعلانات",
    icon: NewspaperIcon,
    href: "/admin/news"
  },
  {
    id: "students",
    label: "إدارة الطلاب",
    icon: UsersIcon,
    href: "/admin/students"
  }
]

export function AdminLayout({ 
  children, 
  className,
  userName = "المدير",
  onSignOut,
  currentPage = "dashboard"
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        userType="admin" 
        userName={userName}
        onSignOut={onSignOut}
      />
      
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:right-0 lg:z-40">
          <div className="flex-1 flex flex-col min-h-0 border-l bg-card">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <nav className="mt-5 flex-1 px-2 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start gap-3 h-11",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      asChild
                    >
                      <a href={item.href}>
                        <Icon className="h-5 w-5" />
                        <span className="arabic-text">{item.label}</span>
                      </a>
                    </Button>
                  )
                })}
              </nav>
            </div>
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex justify-end">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative flex flex-col max-w-xs w-full bg-card">
              <div className="absolute top-0 left-0 -ml-12 pt-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="text-white hover:text-white hover:bg-white/10"
                >
                  <XIcon className="h-6 w-6" />
                </Button>
              </div>
              <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                <nav className="mt-5 px-2 space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPage === item.id
                    
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-11",
                          isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        onClick={() => setIsSidebarOpen(false)}
                        asChild
                      >
                        <a href={item.href}>
                          <Icon className="h-5 w-5" />
                          <span className="arabic-text">{item.label}</span>
                        </a>
                      </Button>
                    )
                  })}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Sidebar Toggle */}
        <div className="lg:hidden fixed bottom-4 right-4 z-50">
          <Button
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="h-12 w-12 rounded-full shadow-lg"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Main Content */}
        <main className={cn(
          "flex-1 lg:mr-64",
          "container mx-auto px-4 py-6",
          className
        )}>
          {children}
        </main>
      </div>
    </div>
  )
}