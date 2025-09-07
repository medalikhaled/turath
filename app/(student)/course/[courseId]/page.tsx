"use client"

import * as React from "react"
import { CoursePage } from "@/components/student/course-page"

interface CoursePageProps {
  params: Promise<{
    courseId: string
  }>
}

export default function CourseDetailPage({ params }: CoursePageProps) {
  const { courseId } = React.use(params)
  return <CoursePage courseId={courseId} />
}