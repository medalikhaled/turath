"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

export function useStudentDashboard() {
  // For now, we'll get the mock student by clerkId until authentication is implemented
  const data = useQuery(api.dashboard.getStudentDashboardByClerkId, { 
    clerkId: "mock_student_id" 
  })
  
  return {
    data,
    isLoading: data === undefined,
    error: data === null ? new Error("Student not found") : null
  }
}