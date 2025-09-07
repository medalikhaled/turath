"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserIcon, LogOutIcon, MenuIcon, XIcon, SettingsIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  className?: string
  userType?: "student" | "admin"
  userName?: string
  onSignOut?: () => void
}

export function Navigation({ 
  className, 
  userType = "student", 
  userName = "الطالب",
  onSignOut 
}: NavigationProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  return (
    <header className={cn(
      "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
      className
    )}>
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {/* Arabic Logo */}
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-lg font-bold arabic-text">ت</span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-lg font-bold arabic-text">تراث الحنابلة</h1>
              <p className="text-xs text-muted-foreground arabic-text">
                {userType === "admin" ? "لوحة الإدارة" : "منصة التعلم"}
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4">
          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 h-auto p-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium arabic-text">{userName}</span>
                  <Badge variant="secondary" className="text-xs arabic-text">
                    {userType === "admin" ? "مدير" : "طالب"}
                  </Badge>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="arabic-text">الملف الشخصي</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 arabic-text">
                <UserIcon className="h-4 w-4" />
                معلومات الحساب
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 arabic-text">
                <SettingsIcon className="h-4 w-4" />
                الإعدادات
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="gap-2 text-destructive focus:text-destructive arabic-text"
                onClick={onSignOut}
              >
                <LogOutIcon className="h-4 w-4" />
                تسجيل الخروج
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <XIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <div className="container px-4 py-4">
            <div className="grid gap-4">
              {/* Mobile Profile Section */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {userName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-medium arabic-text">{userName}</p>
                  <Badge variant="secondary" className="text-xs arabic-text">
                    {userType === "admin" ? "مدير النظام" : "طالب"}
                  </Badge>
                </div>
              </div>
              
              {/* Mobile Sign Out */}
              <Button 
                variant="destructive" 
                onClick={() => {
                  onSignOut?.()
                  setIsMobileMenuOpen(false)
                }}
                className="gap-2 justify-start"
              >
                <LogOutIcon className="h-4 w-4" />
                <span className="arabic-text">تسجيل الخروج</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}