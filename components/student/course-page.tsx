"use client"

import * as React from "react"
import { StudentLayout } from "@/components/layouts/student-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRightIcon, BookOpenIcon } from "lucide-react"
import Link from "next/link"

interface CoursePageProps {
  courseId: string
}

export function CoursePage({ courseId }: CoursePageProps) {
  // This is a placeholder component for now
  // The actual implementation will be done in a later task
  
  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Back Button */}
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowRightIcon className="h-4 w-4" />
              <span className="arabic-text">العودة للوحة التحكم</span>
            </Button>
          </Link>
        </div>

        {/* Course Header */}
        <Card>
          <CardHeader>
            <CardTitle className="arabic-text flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5" />
              تفاصيل الدورة
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold arabic-text mb-2">
                صفحة الدورة قيد التطوير
              </h3>
              <p className="text-muted-foreground arabic-text">
                معرف الدورة: {courseId}
              </p>
              <p className="text-muted-foreground arabic-text mt-2">
                سيتم تطوير هذه الصفحة في المهام القادمة لتشمل تفاصيل الدورة والدروس والموارد.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  )
}