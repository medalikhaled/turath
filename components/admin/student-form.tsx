"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2Icon, UserIcon, BookOpenIcon } from "lucide-react"

const studentFormSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  email: z.string().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().optional(),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف").optional(),
  courses: z.array(z.string()),
  isActive: z.boolean(),
  sendInvitation: z.boolean(),
})

type StudentFormData = z.infer<typeof studentFormSchema>

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
}

interface StudentFormProps {
  student?: Student
  onSuccess: () => void
  onCancel: () => void
}

export function StudentForm({ student, onSuccess, onCancel }: StudentFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  
  const courses = useQuery(api.courses.getActiveCourses)
  const createStudent = useMutation(api.students.createStudentWithUser)
  const createStudentWithInvitation = useMutation(api.students.createStudentWithInvitation)
  const updateStudent = useMutation(api.students.updateStudent)

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: student?.name || "",
      email: student?.email || "",
      phone: student?.phone || "",
      password: "",
      courses: student?.courses.map(id => id.toString()) || [],
      isActive: student?.isActive ?? true,
      sendInvitation: !student, // Default to true for new students
    }
  })

  const selectedCourses = watch("courses")

  React.useEffect(() => {
    if (student) {
      reset({
        name: student.name,
        email: student.email,
        phone: student.phone || "",
        password: "",
        courses: student.courses.map(id => id.toString()),
        isActive: student.isActive,
        sendInvitation: false, // Don't send invitation for existing students
      })
    }
  }, [student, reset])

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true)
    try {
      if (student) {
        // Update existing student
        await updateStudent({
          id: student._id,
          name: data.name,
          email: data.email,
          phone: data.phone || undefined,
          courses: data.courses.map(id => id as Id<"courses">),
          isActive: data.isActive,
        })
      } else {
        // Create new student
        if (data.sendInvitation) {
          // Create student with invitation (auto-generated password)
          const result = await createStudentWithInvitation({
            name: data.name,
            email: data.email,
            phone: data.phone || undefined,
            courses: data.courses.map(id => id as Id<"courses">),
            sendInvitation: true,
          });
          
          // Show invitation details to admin
          if (result.invitationData) {
            alert(`تم إنشاء الحساب بنجاح!\n\nبيانات الدخول:\nالبريد الإلكتروني: ${result.invitationData.email}\nكلمة المرور المؤقتة: ${result.invitationData.tempPassword}\n\nيرجى مشاركة هذه البيانات مع الطالب.`);
          }
        } else {
          // Create student with manual password
          if (!data.password) {
            throw new Error("كلمة المرور مطلوبة عند عدم إرسال دعوة")
          }
          await createStudent({
            name: data.name,
            email: data.email,
            phone: data.phone || undefined,
            password: data.password,
            courses: data.courses.map(id => id as Id<"courses">),
          });
        }
      }
      onSuccess()
    } catch (error) {
      console.error("Error saving student:", error)
      alert(error instanceof Error ? error.message : "حدث خطأ أثناء حفظ بيانات الطالب")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCourseToggle = (courseId: string, checked: boolean | string) => {
    const currentCourses = selectedCourses || []
    if (checked) {
      setValue("courses", [...currentCourses, courseId])
    } else {
      setValue("courses", currentCourses.filter(id => id !== courseId))
    }
  }

  if (!courses) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse arabic-text">
              <UserIcon className="h-5 w-5" />
              <span>المعلومات الشخصية</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name" className="arabic-text">الاسم الكامل *</Label>
                <Input
                  id="name"
                  {...register("name")}
                  placeholder="أدخل الاسم الكامل"
                  className="arabic-text"
                />
                {errors.name && (
                  <p className="text-sm text-destructive arabic-text">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="arabic-text">البريد الإلكتروني *</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="student@example.com"
                  disabled={!!student} // Don't allow email changes for existing students
                />
                {errors.email && (
                  <p className="text-sm text-destructive arabic-text">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone" className="arabic-text">رقم الهاتف</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="+966 50 123 4567"
                  className="arabic-text"
                />
                {errors.phone && (
                  <p className="text-sm text-destructive arabic-text">{errors.phone.message}</p>
                )}
              </div>

              {!student && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 space-x-reverse mb-3">
                    <Checkbox
                      id="sendInvitation"
                      checked={watch("sendInvitation")}
                      onCheckedChange={(checked: boolean | string) => setValue("sendInvitation", !!checked)}
                    />
                    <Label htmlFor="sendInvitation" className="arabic-text">
                      إرسال دعوة بكلمة مرور مؤقتة
                    </Label>
                  </div>
                  
                  {!watch("sendInvitation") && (
                    <>
                      <Label htmlFor="password" className="arabic-text">كلمة المرور *</Label>
                      <Input
                        id="password"
                        type="password"
                        {...register("password")}
                        placeholder="أدخل كلمة المرور"
                      />
                      {errors.password && (
                        <p className="text-sm text-destructive arabic-text">{errors.password.message}</p>
                      )}
                    </>
                  )}
                  
                  {watch("sendInvitation") && (
                    <p className="text-sm text-muted-foreground arabic-text">
                      سيتم إنشاء كلمة مرور مؤقتة وعرضها لك لمشاركتها مع الطالب
                    </p>
                  )}
                </div>
              )}
            </div>

            {student && (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id="isActive"
                  checked={watch("isActive")}
                  onCheckedChange={(checked: boolean | string) => setValue("isActive", !!checked)}
                />
                <Label htmlFor="isActive" className="arabic-text">
                  الحساب نشط
                </Label>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Enrollment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 space-x-reverse arabic-text">
              <BookOpenIcon className="h-5 w-5" />
              <span>تسجيل المقررات</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {courses.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground arabic-text">
                  اختر المقررات التي تريد تسجيل الطالب فيها:
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {courses.map((course) => {
                    const isSelected = selectedCourses?.includes(course._id.toString()) || false
                    return (
                      <div
                        key={course._id}
                        className="flex items-start space-x-3 space-x-reverse p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`course-${course._id}`}
                          checked={isSelected}
                          onCheckedChange={(checked: boolean | string) => 
                            handleCourseToggle(course._id.toString(), !!checked)
                          }
                        />
                        <div className="flex-1 min-w-0">
                          <Label 
                            htmlFor={`course-${course._id}`}
                            className="font-medium arabic-text cursor-pointer"
                          >
                            {course.name}
                          </Label>
                          <p className="text-sm text-muted-foreground arabic-text mt-1">
                            المدرس: {course.instructor}
                          </p>
                          {course.description && (
                            <p className="text-xs text-muted-foreground arabic-text mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                {selectedCourses && selectedCourses.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium arabic-text mb-2">
                      المقررات المختارة ({selectedCourses.length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCourses.map((courseId) => {
                        const course = courses.find(c => c._id.toString() === courseId)
                        return course ? (
                          <Badge key={courseId} variant="secondary" className="arabic-text">
                            {course.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <BookOpenIcon className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground arabic-text">
                  لا توجد مقررات متاحة حالياً
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 space-x-reverse pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            <span className="arabic-text">إلغاء</span>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2Icon className="h-4 w-4 ml-2 animate-spin" />}
            <span className="arabic-text">
              {student ? "حفظ التغييرات" : "إنشاء الحساب"}
            </span>
          </Button>
        </div>
      </form>
  )
}