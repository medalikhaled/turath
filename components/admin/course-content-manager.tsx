"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

import {
    UploadIcon,
    FileIcon,
    DownloadIcon,
    TrashIcon,
    FolderIcon,
    VideoIcon,
    ImageIcon,
    FileTextIcon,
    MusicIcon,
    ArchiveIcon,
    XIcon,
    CheckIcon,
    AlertCircleIcon
} from "lucide-react"

interface CourseContentManagerProps {
    courseId: Id<"courses">
    onClose: () => void
}

interface FileUpload {
    file: File
    progress: number
    status: 'uploading' | 'completed' | 'error'
    id: string
}

function getFileIcon(type: string) {
    if (type.startsWith('video/')) return VideoIcon
    if (type.startsWith('image/')) return ImageIcon
    if (type.startsWith('audio/')) return MusicIcon
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) return FileTextIcon
    if (type.includes('zip') || type.includes('rar') || type.includes('archive')) return ArchiveIcon
    return FileIcon
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 بايت'
    const k = 1024
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function FileUploadProgress({ upload, onCancel }: {
    upload: FileUpload
    onCancel: (id: string) => void
}) {
    const Icon = getFileIcon(upload.file.type)

    return (
        <div className="flex items-center space-x-3 space-x-reverse p-3 border rounded-lg bg-muted/50">
            <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={upload.file.name}>
                    {upload.file.name}
                </p>
                <div className="flex items-center space-x-2 space-x-reverse mt-1">
                    <div className="flex-1 bg-muted rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-300 ${upload.status === 'error' ? 'bg-destructive' :
                                    upload.status === 'completed' ? 'bg-green-500' : 'bg-primary'
                                }`}
                            style={{ width: `${upload.progress}%` }}
                        />
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {upload.status === 'completed' ? '100%' : `${Math.round(upload.progress)}%`}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {formatFileSize(upload.file.size)}
                </p>
            </div>
            <div className="flex items-center space-x-1 space-x-reverse">
                {upload.status === 'completed' && (
                    <CheckIcon className="h-4 w-4 text-green-500" />
                )}
                {upload.status === 'error' && (
                    <AlertCircleIcon className="h-4 w-4 text-destructive" />
                )}
                {upload.status === 'uploading' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(upload.id)}
                        className="h-6 w-6 p-0"
                    >
                        <XIcon className="h-3 w-3" />
                    </Button>
                )}
            </div>
        </div>
    )
}

function FileCard({ file, onDelete, onDownload }: {
    file: any
    onDelete: (fileId: Id<"files">) => void
    onDownload: (fileId: Id<"files">) => void
}) {
    const Icon = getFileIcon(file.type)

    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
                <div className="flex items-start space-x-3 space-x-reverse">
                    <Icon className="h-8 w-8 text-muted-foreground flex-shrink-0 mt-1" />
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate" title={file.name}>
                            {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.size)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {new Date(file.uploadedAt).toLocaleDateString('ar-SA')}
                        </p>
                    </div>
                    <div className="flex flex-col space-y-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownload(file._id)}
                            className="h-8 w-8 p-0"
                        >
                            <DownloadIcon className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(file._id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                            <TrashIcon className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export function CourseContentManager({ courseId, onClose }: CourseContentManagerProps) {
    const [uploads, setUploads] = React.useState<FileUpload[]>([])
    const [dragActive, setDragActive] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const courseDetails = useQuery(api.courses.getCourseDetails, { courseId })
    const currentUser = useQuery(api.auth.getCurrentUser)
    const generateUploadUrl = useMutation(api.files.generateUploadUrl)
    const createFile = useMutation(api.files.createFile)
    const deleteFile = useMutation(api.files.deleteFile)
    const getFileDownloadUrl = useMutation(api.files.getFileDownloadUrl)

    const handleFileSelect = (files: FileList | null) => {
        if (!files) return

        Array.from(files).forEach(file => {
            // Validate file size (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                alert(`الملف ${file.name} كبير جداً. الحد الأقصى 50 ميجابايت.`)
                return
            }

            // Validate file type
            const allowedTypes = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'video/mp4',
                'video/webm',
                'audio/mpeg',
                'audio/wav',
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/zip',
                'application/x-rar-compressed',
                'text/plain'
            ]

            if (!allowedTypes.includes(file.type)) {
                alert(`نوع الملف ${file.name} غير مدعوم.`)
                return
            }

            const uploadId = Math.random().toString(36).substr(2, 9)
            const newUpload: FileUpload = {
                file,
                progress: 0,
                status: 'uploading',
                id: uploadId
            }

            setUploads(prev => [...prev, newUpload])
            uploadFile(file, uploadId)
        })
    }

    const uploadFile = async (file: File, uploadId: string) => {
        try {
            // Get upload URL
            const uploadUrl = await generateUploadUrl()

            // Upload file with progress tracking
            const xhr = new XMLHttpRequest()

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const progress = (e.loaded / e.total) * 100
                    setUploads(prev => prev.map(upload =>
                        upload.id === uploadId
                            ? { ...upload, progress }
                            : upload
                    ))
                }
            })

            xhr.addEventListener('load', async () => {
                if (xhr.status === 200) {
                    try {
                        const response = JSON.parse(xhr.responseText)
                        const storageId = response.storageId

                        // Create file record in database
                        if (!currentUser) {
                            throw new Error("User not authenticated")
                        }

                        await createFile({
                            storageId,
                            name: file.name,
                            type: file.type,
                            size: file.size,
                            uploadedBy: currentUser.subject as any
                        })

                        setUploads(prev => prev.map(upload =>
                            upload.id === uploadId
                                ? { ...upload, status: 'completed', progress: 100 }
                                : upload
                        ))

                        // Remove completed upload after 3 seconds
                        setTimeout(() => {
                            setUploads(prev => prev.filter(upload => upload.id !== uploadId))
                        }, 3000)
                    } catch (error) {
                        console.error('Error creating file record:', error)
                        setUploads(prev => prev.map(upload =>
                            upload.id === uploadId
                                ? { ...upload, status: 'error' }
                                : upload
                        ))
                    }
                } else {
                    setUploads(prev => prev.map(upload =>
                        upload.id === uploadId
                            ? { ...upload, status: 'error' }
                            : upload
                    ))
                }
            })

            xhr.addEventListener('error', () => {
                setUploads(prev => prev.map(upload =>
                    upload.id === uploadId
                        ? { ...upload, status: 'error' }
                        : upload
                ))
            })

            xhr.open('POST', uploadUrl)
            xhr.send(file)
        } catch (error) {
            console.error('Error uploading file:', error)
            setUploads(prev => prev.map(upload =>
                upload.id === uploadId
                    ? { ...upload, status: 'error' }
                    : upload
            ))
        }
    }

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true)
        } else if (e.type === "dragleave") {
            setDragActive(false)
        }
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setDragActive(false)

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileSelect(e.dataTransfer.files)
        }
    }

    const handleDelete = async (fileId: Id<"files">) => {
        if (confirm("هل أنت متأكد من حذف هذا الملف؟")) {
            try {
                await deleteFile({ id: fileId })
            } catch (error) {
                console.error("Error deleting file:", error)
                alert("حدث خطأ أثناء حذف الملف")
            }
        }
    }

    const handleDownload = async (fileId: Id<"files">) => {
        try {
            const url = await getFileDownloadUrl({ id: fileId })
            if (url) {
                window.open(url, '_blank')
            }
        } catch (error) {
            console.error("Error downloading file:", error)
            alert("حدث خطأ أثناء تحميل الملف")
        }
    }

    const cancelUpload = (uploadId: string) => {
        setUploads(prev => prev.filter(upload => upload.id !== uploadId))
    }

    if (!courseDetails || !currentUser) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-2">
                    <Skeleton className="h-32" />
                    <Skeleton className="h-32" />
                </div>
                <Skeleton className="h-64" />
            </div>
        )
    }

    const { course, allResources } = courseDetails

    return (
        <div className="space-y-6">
            {/* Course Info */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold arabic-text">{course.name}</h2>
                    <p className="text-sm text-muted-foreground arabic-text">
                        المدرس: {course.instructor}
                    </p>
                </div>
                <Button variant="outline" onClick={onClose}>
                    <XIcon className="h-4 w-4" />
                </Button>
            </div>

            {/* Upload Area */}
            <Card>
                <CardHeader>
                    <CardTitle className="arabic-text">رفع ملفات جديدة</CardTitle>
                </CardHeader>
                <CardContent>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                ? 'border-primary bg-primary/5'
                                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                            }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <UploadIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold arabic-text mb-2">
                            اسحب الملفات هنا أو انقر للاختيار
                        </h3>
                        <p className="text-sm text-muted-foreground arabic-text mb-4">
                            يدعم: PDF, Word, PowerPoint, فيديو, صوت, صور, ملفات مضغوطة
                        </p>
                        <p className="text-xs text-muted-foreground arabic-text mb-4">
                            الحد الأقصى: 50 ميجابايت لكل ملف
                        </p>
                        <Button onClick={() => fileInputRef.current?.click()}>
                            <UploadIcon className="h-4 w-4 ml-1" />
                            <span className="arabic-text">اختيار ملفات</span>
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                            accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.webm,.mp3,.wav,.jpg,.jpeg,.png,.gif,.zip,.rar,.txt"
                        />
                    </div>

                    {/* Upload Progress */}
                    {uploads.length > 0 && (
                        <div className="mt-6 space-y-3">
                            <h4 className="font-medium arabic-text">جاري الرفع:</h4>
                            {uploads.map(upload => (
                                <FileUploadProgress
                                    key={upload.id}
                                    upload={upload}
                                    onCancel={cancelUpload}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Existing Files */}
            <Card>
                <CardHeader>
                    <CardTitle className="arabic-text">
                        الملفات الموجودة ({allResources.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {allResources.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {allResources.map((file) => (
                                <FileCard
                                    key={file._id}
                                    file={file}
                                    onDelete={handleDelete}
                                    onDownload={handleDownload}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <FolderIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold arabic-text mb-2">لا توجد ملفات</h3>
                            <p className="text-muted-foreground arabic-text">
                                ابدأ برفع الملفات التعليمية للمقرر
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* File Organization by Lessons */}
            {courseDetails.lessons.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle className="arabic-text">تنظيم الملفات حسب الدروس</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {courseDetails.lessons.map((lesson) => (
                                <div key={lesson._id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <h4 className="font-medium arabic-text">{lesson.title}</h4>
                                            <p className="text-sm text-muted-foreground">
                                                {new Date(lesson.scheduledTime).toLocaleDateString('ar-SA')}
                                            </p>
                                        </div>
                                        <Badge variant="outline" className="arabic-text">
                                            {lesson.resources.length} ملف
                                        </Badge>
                                    </div>

                                    {lesson.resources.length > 0 ? (
                                        <div className="grid gap-2 md:grid-cols-2">
                                            {lesson.resources.map((resource) => {
                                                if (!resource) return null;

                                                return (
                                                    <div key={resource._id} className="flex items-center space-x-2 space-x-reverse p-2 bg-muted/50 rounded">
                                                        {React.createElement(getFileIcon(resource.type), { className: "h-4 w-4 text-muted-foreground" })}
                                                        <span className="text-sm truncate flex-1" title={resource.name}>
                                                            {resource.name}
                                                        </span>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDownload(resource._id)}
                                                            className="h-6 w-6 p-0"
                                                        >
                                                            <DownloadIcon className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground arabic-text">
                                            لا توجد ملفات مرتبطة بهذا الدرس
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}