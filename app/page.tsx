import { redirect } from "next/navigation"

export default function Home() {
  // For now, redirect to student dashboard
  // This will be updated when authentication is implemented
  redirect("/login")
}
