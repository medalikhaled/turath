import { MeetingManagement } from "@/components/admin/meeting-management"
import { AdminPageWrapper } from "@/components/layouts/admin-page-wrapper"

export default function MeetingsPage() {
  return (
    <AdminPageWrapper currentPage="meetings">
      <MeetingManagement />
    </AdminPageWrapper>
  )
}