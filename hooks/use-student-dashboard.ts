"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useStudentDashboard() {
  // For now, we'll get the mock student by clerkId until authentication is implemented
  const data = useQuery(api.dashboard.getStudentDashboard, { 
    studentId: "mock_student_id" as any
  })
  
  return {
    data,
    isLoading: data === undefined,
    error: data === null ? new Error("Student not found") : null
  }
}