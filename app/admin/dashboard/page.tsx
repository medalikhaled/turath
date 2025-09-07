"use client"

import { AdminLayout } from "@/components/layouts/admin-layout"
import { AdminDashboard } from "@/components/admin/dashboard"

export default function AdminDashboardPage() {
  return (
    <AdminLayout currentPage="dashboard">
      <AdminDashboard />
    </AdminLayout>
  )
}