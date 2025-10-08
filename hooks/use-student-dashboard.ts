"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"

const defaultReturn = {
  data: null,
  isLoading: true,
  error: null
}

export function useStudentDashboard() {
  try {
    const [mounted, setMounted] = React.useState(false)
    
    React.useEffect(() => {
      setMounted(true)
    }, [])
    
    // Get the first student for demo purposes (no auth required)
    const firstStudent = useQuery(api.demo.getFirstStudentForDemo, mounted ? {} : "skip")
    
    // Get dashboard data using the first student's ID
    const data = useQuery(
      api.dashboard.getStudentDashboard, 
      mounted && firstStudent ? { studentId: firstStudent._id } : "skip"
    )
    
    return {
      data: data || null,
      isLoading: !mounted || data === undefined || firstStudent === undefined,
      error: data === null && firstStudent !== undefined && mounted ? new Error("Student not found") : null
    }
  } catch (error) {
    return defaultReturn
  }
}
