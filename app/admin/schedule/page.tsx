"use client"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { ScheduleManagement } from "@/components/admin/schedule-management"

export default function AdminSchedulePage() {
  return (
    <AdminLayout currentPage="schedule">
      <ScheduleManagement />
    </AdminLayout>
  )
}