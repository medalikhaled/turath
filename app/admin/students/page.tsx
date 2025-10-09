"use client"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { StudentManagement } from "@/components/admin/student-management"

export default function StudentsPage() {
  return (
    <AdminLayout 
      currentPage="students"
      breadcrumbs={[
        { label: "لوحة التحكم", href: "/admin/dashboard" },
        { label: "إدارة الطلاب", isActive: true }
      ]}
    >
      <StudentManagement />
    </AdminLayout>
  )
}