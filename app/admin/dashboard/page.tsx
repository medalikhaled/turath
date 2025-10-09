"use client"

import { AdminPageWrapper } from "@/components/layouts/admin-page-wrapper"
import { AdminDashboard } from "@/components/admin/dashboard"

export default function AdminDashboardPage() {
  return (
    <AdminPageWrapper currentPage="dashboard">
      <AdminDashboard />
    </AdminPageWrapper>
  )
}