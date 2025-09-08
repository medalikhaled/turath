"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DownloadIcon, CalendarIcon, Newspaper } from "lucide-react"
import { cn } from "@/lib/utils"
import { formatArabicDate } from "@/lib/arabic-date"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { toast } from "sonner"
import { Id } from "@/convex/_generated/dataModel"

interface FileAttachment {
    _id: Id<"files">
    storageId: Id<"_storage">
    name: string
    type: string
    size: number
    uploadedBy: Id<"users">
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
    attachments: Array<FileAttachment | null>
}

interface NewsFeedProps {
    news?: NewsItem[]
    showRealTimeUpdates?: boolean
}

export function NewsFeed({ news: propNews, showRealTimeUpdates = true }: NewsFeedProps) {
    // Use real-time updates if enabled, otherwise use prop data
    const realtimeNews = useQuery(
        api.news.getPublishedNewsWithFiles,
        showRealTimeUpdates ? { limit: 10 } : "skip"
    )

    // Get file URLs for attachments
    const [newsWithUrls, setNewsWithUrls] = React.useState<NewsItem[]>([])
    const [loadingFiles, setLoadingFiles] = React.useState<Set<Id<"files">>>(new Set())
    
    // Transform the realtime news to match our interface
    const transformedRealtimeNews = React.useMemo(() => {
        if (!realtimeNews) return undefined
        return realtimeNews.map((item: any) => ({
            ...item,
            attachments: (item.attachments || []) as FileAttachment[]
        }))
    }, [realtimeNews])

    const news = showRealTimeUpdates ? transformedRealtimeNews : propNews
    // For real-time updates, files are already included with URLs
    // For prop news, we might need to fetch URLs
    React.useEffect(() => {
        if (!news) return

        if (showRealTimeUpdates) {
            // Files already have URLs from the Convex function
            setNewsWithUrls(news)
            return
        }

        // For prop news, fetch file URLs if needed
        const fetchFileUrls = async () => {
            const newsWithFileUrls = await Promise.all(
                news.map(async (newsItem: NewsItem) => {
                    if (!newsItem.attachments || newsItem.attachments.length === 0) {
                        return newsItem
                    }

                    const attachmentsWithUrls = await Promise.all(
                        newsItem.attachments.map(async (file: FileAttachment | null) => {
                            if (!file) return null

                            // If file already has URL, use it
                            if (file.url) return file

                            try {
                                // Fetch URL from API
                                const response = await fetch(`/api/files/${file._id}/url`)
                                const urlData = await response.json()

                                return {
                                    ...file,
                                    url: urlData?.url || undefined
                                }
                            } catch (error) {
                                console.error('Error fetching file URL:', error)
                                return file
                            }
                        })
                    )

                    return {
                        ...newsItem,
                        attachments: attachmentsWithUrls
                    }
                })
            )

            setNewsWithUrls(newsWithFileUrls)
        }

        fetchFileUrls()
    }, [news, showRealTimeUpdates])

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

    const handleDownload = async (fileId: Id<"files">, fileName: string, fileUrl?: string) => {
        if (loadingFiles.has(fileId)) return

        setLoadingFiles(prev => new Set(prev).add(fileId))

        try {
            if (fileUrl) {
                // Direct download using the file URL
                const link = document.createElement('a')
                link.href = fileUrl
                link.download = fileName
                link.target = '_blank'
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

    // Show loading state for real-time updates
    if (showRealTimeUpdates && news === undefined) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="arabic-text flex items-center gap-2">
                        <Newspaper className="h-5 w-5" />
                        الأخبار والإعلانات
                    </CardTitle>
                </CardHeader>
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

    if (!news || news.length === 0) {
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
                {(newsWithUrls.length > 0 ? newsWithUrls : news).map((item: NewsItem, index: number) => (
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
                                    {item.attachments.filter((file: FileAttachment | null) => file !== null).map((file: FileAttachment | null) => {
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
                                                    onClick={() => handleDownload(file._id, file.name, file.url)}
                                                    disabled={loadingFiles.has(file._id)}
                                                    className="shrink-0"
                                                >
                                                    {loadingFiles.has(file._id) ? (
                                                        <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                    ) : (
                                                        <DownloadIcon className="h-3 w-3" />
                                                    )}
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