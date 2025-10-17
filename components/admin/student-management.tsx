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

// Type for display (from getStudentsWithCourses query)
interface StudentWithCourses {
    _id: Id<"students">
    userId: Id<"users">
    username: string
    name: string
    email: string
    phone?: string
    courses: Array<{
        _id: Id<"courses">
        _creationTime: number
        name: string
        description: string
        instructor: string
        isActive: boolean
        createdAt: number
        students: Id<"students">[]
    } | null>
    isActive: boolean
    invitationSent?: boolean
    lastLogin?: number
    enrollmentDate: number
    requiresPasswordChange: boolean
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

function StudentCard({ student, onEdit, onDelete, onDeactivate, onReactivate, onSendInvitation, onManageCourses }: {
    student: StudentWithCourses
    onEdit: (student: StudentWithCourses) => void
    onDelete: (studentId: Id<"students">) => void
    onDeactivate: (studentId: Id<"students">) => void
    onReactivate: (studentId: Id<"students">) => void
    onSendInvitation: (studentId: Id<"students">) => void
    onManageCourses: (student: StudentWithCourses) => void
}) {
    return (
        <Card className="hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/20">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <CardTitle className="arabic-text text-lg truncate">{student.name}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <MailIcon className="h-4 w-4 flex-shrink-0" />
                            <span className="truncate block" dir="ltr">{student.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span className="truncate block" dir="ltr">@{student.username}</span>
                        </div>
                        {student.phone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <PhoneIcon className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate block">{student.phone}</span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <Badge
                            variant={student.isActive ? "default" : "secondary"}
                            className="arabic-text text-xs whitespace-nowrap"
                        >
                            {student.isActive ? "نشط" : "غير نشط"}
                        </Badge>
                        {student.invitationSent ? (
                            <Badge variant="outline" className="arabic-text text-xs bg-green-50 text-green-700 border-green-200 whitespace-nowrap">
                                <CheckCircleIcon className="h-3 w-3 ml-1" />
                                تم الإرسال
                            </Badge>
                        ) : (
                            <Badge variant="outline" className="arabic-text text-xs bg-red-50 text-red-700 border-red-200 whitespace-nowrap">
                                <XCircleIcon className="h-3 w-3 ml-1" />
                                لم يرسل
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="arabic-text font-medium whitespace-nowrap">{student.courses.length} مقرر</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 flex-shrink-0" />
                        <span className="text-xs whitespace-nowrap">{formatArabicDate(student.enrollmentDate)}</span>
                    </div>
                </div>

                {student.courses && student.courses.length > 0 && (
                    <div className="space-y-2 -mx-2 px-2">
                        <p className="text-xs text-muted-foreground arabic-text font-medium">المقررات المسجلة:</p>
                        <div className="flex flex-wrap gap-1.5">
                            {student.courses.slice(0, 2).map((course) =>
                                course ? (
                                    <Badge key={course._id} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 whitespace-nowrap">
                                        {course.name}
                                    </Badge>
                                ) : null
                            )}
                            {student.courses.length > 2 && (
                                <Badge variant="outline" className="text-xs arabic-text bg-gray-50 text-gray-700 whitespace-nowrap">
                                    +{student.courses.length - 2} أخرى
                                </Badge>
                            )}
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {!student.invitationSent && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onSendInvitation(student._id)}
                            className="flex-1 min-w-0 h-9 text-xs"
                        >
                            <MailIcon className="h-3 w-3 ml-1 flex-shrink-0" />
                            <span className="arabic-text truncate">إرسال دعوة</span>
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onManageCourses(student)}
                        title="إدارة المقررات"
                        className="h-9 w-9 p-0 flex-shrink-0"
                    >
                        <GraduationCapIcon className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(student)}
                        title="تعديل بيانات الطالب"
                        className="h-9 w-9 p-0 flex-shrink-0"
                    >
                        <EditIcon className="h-4 w-4" />
                    </Button>
                    {student.isActive ? (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onDeactivate(student._id)}
                            className="text-orange-600 hover:text-orange-700 h-9 w-9 p-0 flex-shrink-0"
                            title="إلغاء تفعيل الطالب"
                        >
                            <XCircleIcon className="h-4 w-4" />
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReactivate(student._id)}
                            className="text-green-600 hover:text-green-700 h-9 w-9 p-0 flex-shrink-0"
                            title="إعادة تفعيل الطالب"
                        >
                            <CheckCircleIcon className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(student._id)}
                        className="text-destructive hover:text-destructive h-9 w-9 p-0 flex-shrink-0"
                        title="حذف الطالب نهائياً"
                    >
                        <TrashIcon className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

export function StudentManagement() {
    const [selectedStudent, setSelectedStudent] = React.useState<StudentWithCourses | null>(null)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false)
    const [isCoursesDialogOpen, setIsCoursesDialogOpen] = React.useState(false)

    const students = useQuery(api.students.getStudentsWithCourses)
    const deleteStudent = useMutation(api.students.deleteStudent)
    const deactivateStudent = useMutation(api.students.deactivateStudent)
    const reactivateStudent = useMutation(api.students.reactivateStudent)
    const sendInvitation = useMutation(api.students.sendInvitation)

    const handleEdit = (student: StudentWithCourses) => {
        setSelectedStudent(student)
        setIsEditDialogOpen(true)
    }

    const handleManageCourses = (student: StudentWithCourses) => {
        setSelectedStudent(student)
        setIsCoursesDialogOpen(true)
    }

    const handleDelete = async (studentId: Id<"students">) => {
        if (confirm("هل أنت متأكد من حذف هذا الطالب نهائياً؟ لا يمكن التراجع عن هذا الإجراء!")) {
            try {
                await deleteStudent({ id: studentId })
            } catch (error) {
                console.error("Error deleting student:", error)
                alert("حدث خطأ أثناء حذف الطالب")
            }
        }
    }

    const handleDeactivate = async (studentId: Id<"students">) => {
        if (confirm("هل تريد إلغاء تفعيل هذا الطالب؟ يمكن إعادة تفعيله لاحقاً.")) {
            try {
                await deactivateStudent({ id: studentId })
            } catch (error) {
                console.error("Error deactivating student:", error)
                alert("حدث خطأ أثناء إلغاء تفعيل الطالب")
            }
        }
    }

    const handleReactivate = async (studentId: Id<"students">) => {
        try {
            await reactivateStudent({ id: studentId })
        } catch (error) {
            console.error("Error reactivating student:", error)
            alert("حدث خطأ أثناء إعادة تفعيل الطالب")
        }
    }

    const handleSendInvitation = async (studentId: Id<"students">) => {
        try {
            await sendInvitation({ studentId })
            alert("تم إرسال الدعوة بنجاح")
        } catch (error) {
            console.error("Error sending invitation:", error)
            if (error instanceof Error && error.message.includes("Not implemented")) {
                alert("ميزة إرسال الدعوات غير متاحة حالياً")
            } else {
                alert("حدث خطأ أثناء إرسال الدعوة")
            }
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
                {/* <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold arabic-text">إدارة الطلاب</h1>
                        <p className="text-muted-foreground arabic-text">
                            إنشاء وإدارة حسابات الطلاب وتسجيلهم في المقررات
                        </p>
                    </div>
                    <Skeleton className="h-10 w-32" />
                </div>  */}


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
    const totalEnrollments = students.reduce((total, student) => total + student.courses.filter(c => c !== null).length, 0)
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
                            onDeactivate={handleDeactivate}
                            onReactivate={handleReactivate}
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
                            student={{
                                ...selectedStudent,
                                courses: selectedStudent.courses.map(c => c?._id).filter((id): id is Id<"courses"> => id !== undefined)
                            }}
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