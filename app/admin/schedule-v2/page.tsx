import { AdminLayout } from "@/components/layouts/admin-layout"
import { ModernScheduleManagement } from "@/components/admin/modern-schedule-management"

export default function AdminScheduleV2Page() {
  return (
    <AdminLayout currentPage="schedule">
      <ModernScheduleManagement />
    </AdminLayout>
  )
}