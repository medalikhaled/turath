"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { DatabaseIcon } from "lucide-react"

export function SeedDataButton() {
  const runSeed = useMutation(api.seedRunner.runSeed)
  const [isSeeding, setIsSeeding] = React.useState(false)

  const handleSeed = async () => {
    setIsSeeding(true)
    try {
      const result = await runSeed()
      toast.success("تم إنشاء البيانات التجريبية بنجاح!")
      console.log("Seed result:", result)
      // Refresh the page to load the new data
      window.location.reload()
    } catch (error) {
      console.error("Seed error:", error)
      toast.error("فشل في إنشاء البيانات التجريبية")
    } finally {
      setIsSeeding(false)
    }
  }

  return (
    <Button 
      onClick={handleSeed} 
      disabled={isSeeding}
      className="gap-2"
    >
      <DatabaseIcon className="h-4 w-4" />
      <span className="arabic-text">
        {isSeeding ? "جاري إنشاء البيانات..." : "إنشاء بيانات تجريبية"}
      </span>
    </Button>
  )
}