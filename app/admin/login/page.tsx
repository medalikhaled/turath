"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { ArrowLeft, Mail, Shield, Clock } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new unified login page
    router.replace("/login")
  }, [router])

  return null

}
