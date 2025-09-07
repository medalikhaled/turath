import { NextRequest, NextResponse } from "next/server"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const { fileId } = await params
    const fileIdTyped = fileId as Id<"files">
    
    // Get file info and URL from Convex
    const [file, fileUrl] = await Promise.all([
      convex.query(api.files.getFile, { id: fileIdTyped }),
      convex.query(api.files.getFileUrl, { id: fileIdTyped })
    ])
    
    if (!file || !fileUrl) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      )
    }
    
    // Fetch the file from Convex storage
    const response = await fetch(fileUrl)
    
    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch file" },
        { status: 500 }
      )
    }
    
    const fileBuffer = await response.arrayBuffer()
    
    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': file.type,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name)}"`,
        'Content-Length': file.size.toString(),
      },
    })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}