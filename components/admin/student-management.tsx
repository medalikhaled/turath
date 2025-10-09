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
    UsersIcon,
    PlusIcon,
    EditIcon,
    TrashIcon,
    MailIcon,
    BookOpenIcon,
    CalendarIcon,
    PhoneIcon,
    CheckCircleIcon,
    XCircleIcon,
    GraduationCapIcon
} from "lucide-react"
import { StudentForm } from "./student-form"
import { formatDistanceToNow } from "date-fns"
import { ar } from "date-fns/locale"

interface Student {
    _id: Id<"students">
    userId?: Id<"users"> // Optional for backward compatibility
    name: string
    email: string
    phone?: string
    courses: Id<"courses">[]
    isActive: boolean
    invitationSent?: boolean // Optional for backward compatibility
    lastLogin?: number
    enrollmentDate: number
    createdAt?: number // Optional for backward compatibility
    updatedAt?: number // Optional for backward compatibility
    courseDetails?: Array<{
        _id: Id<"courses">
        _creationTime: number
        name: string
        description: string
        instructor: string
        isActive: boolean
        createdAt: number
        students: Id<"students">[]
    } | null>
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

function StudentCard({ student, onEdit, onDelete, onSendInvitation, onManageCourses }: {
    student: Student
    onEdit: (student: Student) => void
    onDelete: (studentId: Id<"students">) => void
    onSendInvitation: (studentId: Id<"students">) => void
    onManageCourses: (student: Student) => void
}) {
    return (
        <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="arabic-text text-lg mb-2 truncate">{student.name}</CardTitle>
                        <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground mb-1">
                            <MailIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate">{student.email}</span>
                        </div>
                        {student.phone && (
                            <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
                                <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">{student.phone}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end space-y-2 ml-3">
                        <Badge
                            variant={student.isActive ? "default" : "secondary"}
                            className="arabic-text text-xs"
                        >
                            {student.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        {student.invitationSent ? (
                            <Badge variant="outline" className="arabic-text text-xs bg-green-50 text-green-700 border-green-200">
                                <CheckCircleIcon className="h-3 w-3 ml-1" />
                                تم الإرسال
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="arabic-text text-xs bg-red-50 text-red-700 border-red-200">
                                <XCircleIcon className="h-3 w-3 ml-1" />
                                لم يرسل
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <BookOpenIcon className="h-4 w-4" />
                        <span className="arabic-text font-medium">{student.courses.length} مقرر</span>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="text-xs">{formatArabicDate(student.enrollmentDate)}</span>
                    </div>
                </div>

                {student.courseDetails && student.courseDetails.length > 0 && (
                    <div className="space-y-2">
                        <p className="text-xs text-muted-foreground arabic-text font-medium">المقررات المسجلة:</p>
                        <div className="flex flex-wrap gap-1">
                            {student.courseDetails.slice(0, 2).map((course) =>
                                course ? (
                                    <Badge key={course._id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        {course.name}
                                    </Badge>
                                ) : null
                            )}
                            {student.courseDetails.length > 2 && (
                                <Badge variant="outline" className="text-xs arabic-text bg-gray-50 text-gray-700">
                                    +{student.courseDetails.length - 2} أخرى
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                    {!student.invitationSent && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSendInvitation(student._id)}
                            className="flex-1 h-9 text-xs"
                        >
                            <MailIcon className="h-3 w-3 ml-1" />
                            <span className="arabic-text">إرسال دعوة</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManageCourses(student)}
                        title="إدارة المقررات"
                        className="h-9 w-9 p-0"
                    >
                        <GraduationCapIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(student)}
                        title="تعديل بيانات الطالب"
                        className="h-9 w-9 p-0"
                    >
                        <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(student._id)}
                        className="text-destructive hover:text-destructive h-9 w-9 p-0"
                        title="حذف الطالب"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export function StudentManagement() {
    const [selectedStudent, setSelectedStudent] = React.useState<Student | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isCoursesDialogOpen, setIsCoursesDialogOpen] = React.useState(false)

    const students = useQuery(api.students.getStudentsWithCourses)
    const deleteStudent = useMutation(api.students.deleteStudent)
    const sendInvitation = useMutation(api.students.sendInvitation)

    const handleEdit = (student: Student) => {
        setSelectedStudent(student)
        setIsEditDialogOpen(true)
    }

    const handleManageCourses = (student: Student) => {
        setSelectedStudent(student)
        setIsCoursesDialogOpen(true)
    }

    const handleDelete = async (studentId: Id<"students">) => {
        if (confirm("هل أنت متأكد من حذف هذا الطالب؟ سيتم إلغاء تفعيله فقط.")) {
            try {
                await deleteStudent({ id: studentId })
            } catch (error) {
                console.error("Error deleting student:", error)
                alert("حدث خطأ أثناء حذف الطالب")
            }
        }
    }

    const handleSendInvitation = async (studentId: Id<"students">) => {
        try {
            const result = await sendInvitation({ studentId })
            if (result.invitationData) {
                alert(`تم إرسال الدعوة بنجاح!\n\nبيانات الدخول الجديدة:\nالبريد الإلكتروني: ${result.invitationData.email}\nكلمة المرور المؤقتة: ${result.invitationData.tempPassword}\n\nيرجى مشاركة هذه البيانات مع الطالب.`);
            } else {
                alert("تم إرسال الدعوة بنجاح")
            }
        } catch (error) {
            console.error("Error sending invitation:", error)
            alert("حدث خطأ أثناء إرسال الدعوة")
        }
    }

    const handleFormSuccess = () => {
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setIsCoursesDialogOpen(false)
        setSelectedStudent(null)
    }

    const handleFormCancel = () => {
        setIsCreateDialogOpen(false)
        setIsEditDialogOpen(false)
        setIsCoursesDialogOpen(false)
        setSelectedStudent(null)
    }

    if (!students) {
        return (
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold arabic-text">إدارة الطلاب</h1>
                        <p className="text-muted-foreground arabic-text">
                            إنشاء وإدارة حسابات الطلاب وتسجيلهم في المقررات
                        </p>
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

                {/* Loading Student Grid */}
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
        )
    }

    const activeStudents = students.filter(s => s.isActive)
    const totalEnrollments = students.reduce((total, student) => total + student.courses.length, 0)
    const invitationsSent = students.filter(s => s.invitationSent).length

    return (
        <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold arabic-text">إدارة الطلاب</h1>
                    <p className="text-muted-foreground arabic-text">
                        إنشاء وإدارة حسابات الطلاب وتسجيلهم في المقررات
                    </p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusIcon className="h-4 w-4 ml-1" />
                            <span className="arabic-text">طالب جديد</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl w-[90vw] sm:w-[80vw] lg:w-[70vw]" showCloseButton={false}>
                        <DialogHeader>
                            <DialogTitle className="arabic-text">إنشاء حساب طالب جديد</DialogTitle>
                        </DialogHeader>
                        <StudentForm
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-3 mb-8">
                {/* Total Students Card */}
                <div className="rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <UsersIcon className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">{activeStudents.length}</p>
                            <p className="text-blue-100 text-sm arabic-text">الطلاب النشطون</p>
                        </div>
                    </div>
                    <div className="flex items-center text-blue-100 text-xs">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                        <span className="arabic-text">من أصل {students.length} طالب</span>
                    </div>
                </div>

                {/* Total Enrollments Card */}
                <div className="rounded-xl bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <BookOpenIcon className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">{totalEnrollments}</p>
                            <p className="text-green-100 text-sm arabic-text">إجمالي التسجيلات</p>
                        </div>
                    </div>
                    <div className="flex items-center text-green-100 text-xs">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                        <span className="arabic-text">في جميع المقررات</span>
                    </div>
                </div>

                {/* Invitations Sent Card */}
                <div className="rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <MailIcon className="h-6 w-6" />
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-bold">{invitationsSent}</p>
                            <p className="text-purple-100 text-sm arabic-text">الدعوات المرسلة</p>
                        </div>
                    </div>
                    <div className="flex items-center text-purple-100 text-xs">
                        <div className="w-2 h-2 bg-orange-400 rounded-full mr-2"></div>
                        <span className="arabic-text">من أصل {students.length} طالب</span>
                    </div>
                </div>
            </div>

            {/* Student Grid */}
            {students.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                    {students.map((student) => (
                        <StudentCard
                            key={student._id}
                            student={student}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onSendInvitation={handleSendInvitation}
                            onManageCourses={handleManageCourses}
                        />
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <UsersIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold arabic-text mb-2">لا يوجد طلاب</h3>
                        <p className="text-muted-foreground arabic-text mb-4">
                            ابدأ بإنشاء حساب طالب جديد لإضافته إلى النظام
                        </p>
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                            <PlusIcon className="h-4 w-4 ml-1" />
                            <span className="arabic-text">إنشاء حساب طالب</span>
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Edit Student Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-4xl w-[90vw] sm:w-[80vw] lg:w-[70vw]" showCloseButton={false}>
                    <DialogHeader>
                        <DialogTitle className="arabic-text">تعديل بيانات الطالب</DialogTitle>
                    </DialogHeader>
                    {selectedStudent && (
                        <StudentForm
                            student={selectedStudent}
                            onSuccess={handleFormSuccess}
                            onCancel={handleFormCancel}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Course Management Dialog */}
            <Dialog open={isCoursesDialogOpen} onOpenChange={setIsCoursesDialogOpen}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle className="arabic-text">
                            إدارة مقررات الطالب: {selectedStudent?.name}
                        </DialogTitle>
                    </DialogHeader>
                    {selectedStudent && (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground arabic-text">
                                يمكنك إدارة تسجيل الطالب في المقررات من خلال تعديل بيانات الطالب.
                            </p>
                            <div className="flex items-center justify-end space-x-2 space-x-reverse">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCoursesDialogOpen(false)}
                                >
                                    <span className="arabic-text">إغلاق</span>
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsCoursesDialogOpen(false)
                                        handleEdit(selectedStudent)
                                    }}
                                >
                                    <span className="arabic-text">تعديل المقررات</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}