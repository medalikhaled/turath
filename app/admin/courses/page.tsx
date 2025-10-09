import { CourseManagement } from "@/components/admin/course-management"
import { AdminPageWrapper } from "@/components/layouts/admin-page-wrapper"

export default function AdminCoursesPage() {
  return (
    <AdminPageWrapper currentPage="courses">
      <CourseManagement />
    </AdminPageWrapper>
  )
}