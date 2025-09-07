"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DownloadIcon, CalendarIcon, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatArabicDate } from "@/lib/arabic-date"

interface NewsFeedProps {
  news: Array<{
    _id: string
    title: string
    content: string
    publishedAt: number
    isPublished: boolean
    createdBy: string
    attachments: Array<{
      _id: string
      storageId: string
      name: string
      type: string
      size: number
      uploadedBy: string
      uploadedAt: number
    } | null>
  }>
}

export function NewsFeed({ news }: NewsFeedProps) {
  const formatDate = (timestamp: number) => {
    return formatArabicDate(timestamp, { includeTime: true })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 بايت'
    const k = 1024
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎥'
    if (type.startsWith('audio/')) return '🎵'
    if (type.includes('pdf')) return '📄'
    if (type.includes('document') || type.includes('word')) return '📝'
    if (type.includes('spreadsheet') || type.includes('excel')) return '📊'
    return '📎'
  }

  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      // This would be implemented with the actual file download logic
      console.log('Downloading file:', fileId, fileName)
      // For now, just show a placeholder
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (news.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="arabic-text flex items-center gap-2">
            <Newspaper className="h-5 w-5" />
            الأخبار والإعلانات
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold arabic-text mb-2">لا توجد أخبار جديدة</h3>
            <p className="text-muted-foreground arabic-text">
              لا توجد أخبار أو إعلانات جديدة في الوقت الحالي.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/10">
      <CardHeader className="pb-4">
        <CardTitle className="arabic-text flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-white">
            <Newspaper className="h-5 w-5" />
          </div>
          الأخبار والإعلانات
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {news.map((item, index) => (
          <div
            key={item._id}
            className={cn(
              "p-5 rounded-xl border-2 transition-all duration-300",
              index === 0 
                ? "border-primary bg-gradient-to-r from-primary/10 to-blue-50/20 shadow-lg shadow-primary/20" 
                : "border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/10 hover:border-primary/40"
            )}
          >
            {/* News Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold arabic-text mb-1">
                  {item.title}
                </h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarIcon className="h-3 w-3" />
                  <span className="arabic-text">
                    {formatDate(item.publishedAt)}
                  </span>
                </div>
              </div>
              {index === 0 && (
                <Badge className="arabic-text bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg">
                  ✨ جديد
                </Badge>
              )}
            </div>

            {/* News Content */}
            <div className="mb-4">
              <p className="text-sm arabic-text leading-relaxed">
                {item.content}
              </p>
            </div>

            {/* Attachments */}
            {item.attachments && item.attachments.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium arabic-text">المرفقات:</h4>
                <div className="grid gap-2">
                  {item.attachments.filter(file => file !== null).map(file => {
                    if (!file) return null
                    return (
                      <div
                        key={file._id}
                        className="flex items-center justify-between p-2 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg">{getFileIcon(file.type)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(file._id, file.name)}
                          className="shrink-0"
                        >
                          <DownloadIcon className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}