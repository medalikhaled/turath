"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  DownloadIcon, 
  CalendarIcon, 
  Newspaper, 
  FileIcon, 
  AlertCircle,
  Clock,
  Paperclip,
  RefreshCw
} from "lucide-react"
import { cn } from "@/lib/utils"
import { formatArabicDate } from "@/lib/arabic-date"
import { useNewsWithFiles } from "@/hooks/use-news"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"

interface FileWithUrl {
  _id: Id<"files">
  storageId: Id<"_storage">
  name: string
  type: string
  size: number
  uploadedBy: Id<"students">
  uploadedAt: number
  url?: string
}

interface NewsItem {
  _id: Id<"news">
  title: string
  content: string
  publishedAt: number
  isPublished: boolean
  createdBy: Id<"users">
  attachments: FileWithUrl[]
}

interface EnhancedNewsFeedProps {
  limit?: number
  showHeader?: boolean
  className?: string
}

export function EnhancedNewsFeed({ 
  limit = 10, 
  showHeader = true,
  className 
}: EnhancedNewsFeedProps) {
  const { news, isLoading, error } = useNewsWithFiles(limit)
  const [loadingFiles, setLoadingFiles] = React.useState<Set<string>>(new Set())
  const [refreshing, setRefreshing] = React.useState(false)

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

  const handleDownload = async (fileId: string, fileName: string, fileUrl?: string) => {
    if (loadingFiles.has(fileId)) return
    
    setLoadingFiles(prev => new Set(prev).add(fileId))
    
    try {
      if (fileUrl) {
        // Direct download using the file URL
        const link = document.createElement('a')
        link.href = fileUrl
        link.download = fileName
        link.target = '_blank'
        link.rel = 'noopener noreferrer'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        toast.success(`تم تحميل ${fileName} بنجاح`)
      } else {
        // Fallback: try to get URL from API
        const response = await fetch(`/api/files/${fileId}/download`)
        if (response.ok) {
          const blob = await response.blob()
          const url = window.URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = fileName
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          
          toast.success(`تم تحميل ${fileName} بنجاح`)
        } else {
          throw new Error('فشل في تحميل الملف')
        }
      }
    } catch (error) {
      console.error('Download failed:', error)
      toast.error(`فشل في تحميل ${fileName}. يرجى المحاولة مرة أخرى.`)
    } finally {
      setLoadingFiles(prev => {
        const newSet = new Set(prev)
        newSet.delete(fileId)
        return newSet
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    // The useQuery hook will automatically refetch
    setTimeout(() => setRefreshing(false), 1000)
  }

  const getTimeAgo = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / (1000 * 60))
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (minutes < 1) return 'الآن'
    if (minutes < 60) return `منذ ${minutes} دقيقة`
    if (hours < 24) return `منذ ${hours} ساعة`
    if (days < 7) return `منذ ${days} يوم`
    return formatDate(timestamp)
  }

  // Show loading state
  if (isLoading) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="arabic-text flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              الأخبار والإعلانات
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-16 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show error state
  if (error) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="arabic-text flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              الأخبار والإعلانات
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="font-semibold arabic-text mb-2 text-destructive">
              خطأ في تحميل الأخبار
            </h3>
            <p className="text-muted-foreground arabic-text mb-4">
              حدث خطأ أثناء تحميل الأخبار. يرجى المحاولة مرة أخرى.
            </p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 ml-2" />
              إعادة المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show empty state
  if (!news || news.length === 0) {
    return (
      <Card className={className}>
        {showHeader && (
          <CardHeader>
            <CardTitle className="arabic-text flex items-center gap-2">
              <Newspaper className="h-5 w-5" />
              الأخبار والإعلانات
            </CardTitle>
          </CardHeader>
        )}
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
    <Card className={cn("border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-blue-50/10", className)}>
      {showHeader && (
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="arabic-text flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-blue-600 text-white">
                <Newspaper className="h-5 w-5" />
              </div>
              الأخبار والإعلانات
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="arabic-text"
            >
              <RefreshCw className={cn("h-4 w-4 ml-2", refreshing && "animate-spin")} />
              تحديث
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="space-y-6">
        {news.map((item, index) => {
          const isLatest = index === 0
          const attachmentFiles = item.attachments || []

          return (
            <div key={item._id}>
              <div
                className={cn(
                  "p-6 rounded-xl border-2 transition-all duration-300 hover:shadow-lg",
                  isLatest 
                    ? "border-primary bg-gradient-to-r from-primary/10 to-blue-50/20 shadow-lg shadow-primary/20" 
                    : "border-primary/20 bg-gradient-to-r from-primary/5 to-blue-50/10 hover:border-primary/40"
                )}
              >
                {/* News Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="font-semibold arabic-text mb-2 text-lg">
                      {item.title}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <CalendarIcon className="h-3 w-3" />
                        <span className="arabic-text">
                          {formatDate(item.publishedAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span className="arabic-text">
                          {getTimeAgo(item.publishedAt)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isLatest && (
                    <Badge className="arabic-text bg-gradient-to-r from-primary to-blue-600 text-white shadow-lg">
                      ✨ جديد
                    </Badge>
                  )}
                </div>

                {/* News Content */}
                <div className="mb-6">
                  <p className="arabic-text leading-relaxed text-foreground/90 whitespace-pre-wrap">
                    {item.content}
                  </p>
                </div>

                {/* Attachments */}
                {attachmentFiles.length > 0 && (
                  <div className="space-y-3">
                    <Separator />
                    <div className="flex items-center gap-2 text-sm font-medium arabic-text">
                      <Paperclip className="h-4 w-4" />
                      المرفقات ({attachmentFiles.length})
                    </div>
                    <div className="grid gap-3">
                      {attachmentFiles.map(file => (
                        <div
                          key={file._id}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-muted-foreground/20 hover:bg-muted/70 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-xl">{getFileIcon(file.type)}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {file.name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>{formatFileSize(file.size)}</span>
                                <span>•</span>
                                <span>{file.type.split('/')[1]?.toUpperCase()}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(file._id, file.name, file.url || undefined)}
                            disabled={loadingFiles.has(file._id)}
                            className="shrink-0 arabic-text"
                          >
                            {loadingFiles.has(file._id) ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              <>
                                <DownloadIcon className="h-3 w-3 ml-1" />
                                تحميل
                              </>
                            )}
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Separator between news items */}
              {index < news.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}