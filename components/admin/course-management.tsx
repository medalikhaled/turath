"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import {
    BookOpenIcon,
    PlusIcon,
    EditIcon,
    TrashIcon,
    UsersIcon,
    CalendarIcon,
    FileIcon,
    ArrowRightIcon
} from "lucide-react"
import { CourseForm } from "./course-form"
import { CourseContentManager } from "./course-content-manager"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

interface Course {
    _id: Id<"courses">
    name: string
    description: string
    instructor: string
    isActive: boolean
    createdAt: number
    students: Id<"students">[]
}

function formatArabicDate(date: number): string {
    try {
        return formatDistanceToNow(new Date(date), {
            addSuffix: true,
            locale: ar
        })
    } catch {
        return 'منذ وقت قريب'
    }
}

function CourseCard({ course, onEdit, onDelete, onManageContent }: {
    course: Course
    onEdit: (course: Course) => void
    onDelete: (courseId: Id<"courses">) => void
    onManageContent: (course: Course) => void
}) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <CardTitle className="arabic-text text-lg mb-1">{course.name}</CardTitle>
                        <p className="text-sm text-muted-foreground arabic-text">
                            المدرس: {course.instructor}
                        </p>
                    </div>
                    <Badge variant={course.isActive ? "default" : "secondary"} className="arabic-text">
                        {course.isActive ? "نشط" : "غير نشط"}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground arabic-text line-clamp-2">
                    {course.description}
                </p>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <UsersIcon className="h-4 w-4" />
                        <span className="arabic-text">{course.students.length} طالب</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{formatArabicDate(course.createdAt)}</span>
                    </div>
                </div>

                <div className="flex items-center space-x-2 space-x-reverse pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManageContent(course)}
                        className="flex-1"
                    >
                        <FileIcon className="h-4 w-4 ml-1" />
                        <span className="arabic-text">إدارة المحتوى</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(course)}
                    >
                        <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(course._id)}
                        className="text-destructive hover:text-destructive"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export function CourseManagement() {
    const [selectedCourse, setSelectedCourse] = React.useState<Course | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isContentDialogOpen, setIsContentDialogOpen] = React.useState(false)

    const courses = useQuery(api.courses.getActiveCourses)
    const deleteCourse = useMutation(api.courses.deleteCourse)

    const handleEdit = (course: Course) => {
        setSelectedCourse(course)
        setIsEditDialogOpen(true)
    }

    const handleDelete = async (courseId: Id<"courses">) => {
        if (confirm("هل أنت متأكد من حذف هذا المقرر؟ سيتم إلغاء تفعيله فقط.")) {
            try {
                await deleteCourse({ id: courseId })
            } catch (error) {
                console.error("Error deleting course:", error)
                alert("حدث خطأ أثناء حذف المقرر")
            }
        }
    }

    const handleManageContent = (course: Course) => {
        setSelectedCourse(course)
        setIsContentDialogOpen(true)
    }

    const handleFormSuccess = () => {
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setSelectedCourse(null)
    }

    const handleFormCancel = () => {
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setSelectedCourse(null)
    }

    if (!courses) {
        return (
            <div className="min-h-screen bg-background p-6">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4 space-x-reverse">
                            <Button variant="ghost" size="sm">
                                <ArrowRightIcon className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold arabic-text">إدارة المقررات</h1>
                                <p className="text-muted-foreground arabic-text">
                                    إنشاء وإدارة المقررات الدراسية والمحتوى التعليمي
                                </p>
                            </div>
                        </div>
                        <Skeleton className="h-10 w-32" />
                    </div>

                    {/* Loading Statistics Cards */}
                    <div className="grid gap-4 md:grid-cols-3 mb-8">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-400 to-gray-500 p-6 animate-pulse">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="p-3 bg-white/20 rounded-lg">
                                        <Skeleton className="h-6 w-6" />
                                    </div>
                                    <div className="text-right space-y-2">
                                        <Skeleton className="h-8 w-12 bg-white/30" />
                                        <Skeleton className="h-4 w-20 bg-white/20" />
                                    </div>
                                </div>
                                <Skeleton className="h-3 w-24 bg-white/20" />
                            </div>
                        ))}
                    </div>

                    {/* Loading Course Grid */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-5 w-32" />
                                            <Skeleton className="h-4 w-24" />
                                        </div>
                                        <Skeleton className="h-6 w-12" />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-3/4" />
                                    <div className="flex justify-between">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-20" />
                                    </div>
                                    <div className="flex space-x-2 space-x-reverse">
                                        <Skeleton className="h-8 flex-1" />
                                        <Skeleton className="h-8 w-8" />
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center space-x-4 space-x-reverse">
                        <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
                            <ArrowRightIcon className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold arabic-text">إدارة المقررات</h1>
                            <p className="text-muted-foreground arabic-text">
                                إنشاء وإدارة المقررات الدراسية والمحتوى التعليمي
                            </p>
                        </div>
                    </div>
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <PlusIcon className="h-4 w-4 ml-1" />
                                <span className="arabic-text">مقرر جديد</span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl" showCloseButton={false}>
                            <DialogHeader>
                                <DialogTitle className="arabic-text">إنشاء مقرر جديد</DialogTitle>
                            </DialogHeader>
                            <CourseForm
                                onSuccess={handleFormSuccess}
                                onCancel={handleFormCancel}
                            />
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Statistics Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    {/* Total Courses Card */}
                    <div className="rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <BookOpenIcon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold">{courses.length}</p>
                                <p className="text-blue-100 text-sm arabic-text">إجمالي المقررات</p>
                            </div>
                        </div>
                        <div className="flex items-center text-blue-100 text-xs">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                            <span className="arabic-text">نشط ومتاح</span>
                        </div>
                    </div>

                    {/* Total Students Card */}
                    <div className="rounded-xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <UsersIcon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold">
                                    {courses.reduce((total, course) => total + course.students.length, 0)}
                                </p>
                                <p className="text-green-100 text-sm arabic-text">إجمالي الطلاب</p>
                            </div>
                        </div>
                        <div className="flex items-center text-green-100 text-xs">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                            <span className="arabic-text">مسجلون في المقررات</span>
                        </div>
                    </div>

                    {/* Educational Files Card */}
                    <div className="rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                                <FileIcon className="h-6 w-6" />
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-bold">-</p>
                                <p className="text-purple-100 text-sm arabic-text">الملفات التعليمية</p>
                            </div>
                        </div>
                        <div className="flex items-center text-purple-100 text-xs">
                            <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                            <span className="arabic-text">مواد ومرفقات</span>
                        </div>
                    </div>
                </div>

                {/* Course Grid */}
                {courses.length > 0 ? (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {courses.map((course) => (
                            <CourseCard
                                key={course._id}
                                course={course}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onManageContent={handleManageContent}
                            />
                        ))}
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <BookOpenIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold arabic-text mb-2">لا توجد مقررات</h3>
                            <p className="text-muted-foreground arabic-text mb-4">
                                ابدأ بإنشاء مقرر دراسي جديد لإضافة المحتوى التعليمي
                            </p>
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <PlusIcon className="h-4 w-4 ml-1" />
                                <span className="arabic-text">إنشاء مقرر جديد</span>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Edit Course Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="arabic-text">تعديل المقرر</DialogTitle>
                    </DialogHeader>
                    {selectedCourse && (
                        <CourseForm
                            course={selectedCourse}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Course Content Management Dialog */}
            <Dialog open={isContentDialogOpen} onOpenChange={setIsContentDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="arabic-text">
                            إدارة محتوى المقرر: {selectedCourse?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedCourse && (
                        <CourseContentManager
                            courseId={selectedCourse._id}
                            onClose={() => setIsContentDialogOpen(false)}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}