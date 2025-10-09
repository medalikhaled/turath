"use client"

import * as React from "react"
import { Navigation } from "@/components/shared/navigation"
import { useAuthContext } from "@/providers/auth-provider"
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
  XIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from "lucide-react"
import { Breadcrumb, BreadcrumbItem } from "@/components/shared/breadcrumb"

interface AdminLayoutProps {
  children: React.ReactNode
  className?: string
  userName?: string
  onSignOut?: () => void
  currentPage?: string
  showBackButton?: boolean
  backUrl?: string
  breadcrumbs?: BreadcrumbItem[]
}

const sidebarItems = [
  {
    id: "dashboard",
    label: "لوحة التحكم",
    icon: LayoutDashboardIcon,
    href: "/admin/dashboard"
  },
  {
    id: "student-view",
    label: "عرض الطلاب",
    icon: LayoutDashboardIcon,
    href: "/dashboard"
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
  userName,
  onSignOut,
  currentPage = "dashboard",
  showBackButton = false,
  backUrl,
  breadcrumbs
}: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(() => {
    // Load sidebar state from localStorage
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('admin-sidebar-collapsed')
      return saved ? JSON.parse(saved) : false
    }
    return false
  })
  
  const { user, logout } = useAuthContext()
  
  // Use the authenticated user's name if not provided
  const displayName = userName || user?.name || "المدير"
  
  const handleSignOut = onSignOut || logout

  // Persist sidebar state
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin-sidebar-collapsed', JSON.stringify(isSidebarCollapsed))
    }
  }, [isSidebarCollapsed])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation 
        userType="admin" 
        userName={displayName}
        onSignOut={handleSignOut}
      />
        
      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className={cn(
          "hidden lg:flex lg:flex-col lg:fixed lg:top-16 lg:bottom-0 lg:right-0 lg:z-40 transition-all duration-300",
          isSidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}>
          <div className="flex-1 flex flex-col min-h-0 border-l bg-card shadow-sm">
            {/* Sidebar Toggle Button */}
            <div className="flex justify-start p-2 border-b bg-muted/30">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="h-8 w-8 hover:bg-muted"
                title={isSidebarCollapsed ? "توسيع القائمة الجانبية" : "طي القائمة الجانبية"}
              >
                {isSidebarCollapsed ? (
                  <ChevronLeftIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="flex-1 flex flex-col pt-3 pb-4 overflow-y-auto">
              <nav className="mt-2 flex-1 px-2 space-y-1">
                {sidebarItems.map((item) => {
                  const Icon = item.icon
                  const isActive = currentPage === item.id
                  
                  return (
                    <Button
                      key={item.id}
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full h-11 transition-all duration-200 relative group",
                        isSidebarCollapsed 
                          ? "justify-center px-2" 
                          : "justify-start gap-3 px-3",
                        isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                      )}
                      title={isSidebarCollapsed ? item.label : undefined}
                      asChild
                    >
                      <a href={item.href}>
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!isSidebarCollapsed && (
                          <span className="arabic-text truncate">{item.label}</span>
                        )}
                        
                        {/* Tooltip for collapsed state */}
                        {isSidebarCollapsed && (
                          <div className="absolute right-full mr-2 px-2 py-1 bg-popover text-popover-foreground text-sm rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                            <span className="arabic-text">{item.label}</span>
                          </div>
                        )}
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
          <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
            <div className="fixed inset-0 bg-black/50" onClick={() => setIsSidebarOpen(false)} />
            <div className="relative flex flex-col max-w-xs w-full bg-card border-l shadow-xl">
              {/* Mobile Sidebar Header */}
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="text-lg font-semibold arabic-text">القائمة الرئيسية</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                  className="h-8 w-8"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                <nav className="p-2 space-y-1">
                  {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = currentPage === item.id
                    
                    return (
                      <Button
                        key={item.id}
                        variant={isActive ? "secondary" : "ghost"}
                        className={cn(
                          "w-full justify-start gap-3 h-12 text-base",
                          isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                        onClick={() => setIsSidebarOpen(false)}
                        asChild
                      >
                        <a href={item.href}>
                          <Icon className="h-5 w-5 flex-shrink-0" />
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
        <div className="lg:hidden fixed bottom-4 right-4 z-40">
          <Button
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            aria-label="فتح القائمة الرئيسية"
          >
            <MenuIcon className="h-6 w-6" />
          </Button>
        </div>

        {/* Main Content */}
        <main className={cn(
          "flex-1 transition-all duration-300 min-h-screen",
          isSidebarCollapsed ? "lg:mr-16" : "lg:mr-64",
          "container mx-auto px-4 sm:px-6 py-4 sm:py-6",
          className
        )}>
          {/* Breadcrumb Navigation */}
          {(breadcrumbs || showBackButton) && (
            <div className="mb-4 sm:mb-6">
              <Breadcrumb
                items={breadcrumbs || []}
                showBackButton={showBackButton}
                backUrl={backUrl}
                onBack={() => {
                  if (backUrl) {
                    window.location.href = backUrl
                  } else {
                    window.history.back()
                  }
                }}
              />
            </div>
          )}
          
          {children}
        </main>
      </div>
    </div>
  )
}