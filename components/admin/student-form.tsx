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
import { Loader2Icon, UserIcon, BookOpenIcon } from "lucide-react"

const studentFormSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون على الأقل حرفين"),
  username: z.string()
    .min(3, "اسم المستخدم يجب أن يكون على الأقل 3 أحرف")
    .max(20, "اسم المستخدم يجب ألا يتجاوز 20 حرف")
    .regex(/^[a-zA-Z0-9_-]+$/, "اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط"),
  email: z.string().email("البريد الإلكتروني غير صحيح").optional().or(z.literal("")),
  password: z.string().min(6, "كلمة المرور يجب أن تكون على الأقل 6 أحرف").optional(),
  courses: z.array(z.string()),
  isActive: z.boolean(),
  sendInvitation: z.boolean(),
})

type StudentFormData = z.infer<typeof studentFormSchema>

interface Student {
  _id: Id<"students">
  userId?: Id<"users"> // Optional for backward compatibility
  username: string
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
      username: student?.username || "",
      email: student?.email || "",
      password: "",
      courses: student?.courses.map(id => id.toString()) || [],
      isActive: student?.isActive ?? true,
      sendInvitation: !student,
    }
  })

  React.useEffect(() => {
    if (student) {
      reset({
        name: student.name,
        username: student.username,
        email: student.email || "",
        password: "",
        courses: [],
        isActive: student.isActive,
        sendInvitation: false,
      })
    }
  }, [student, reset])

  const onSubmit = async (data: StudentFormData) => {
    setIsSubmitting(true)
    try {
      // Get all active courses to assign to student
      //TODO: make this more configurable in the future 
      const allCourseIds = courses?.map(c => c._id) || []

      if (student) {
        // Update existing student
        await updateStudent({
          id: student._id,
          name: data.name,
          courses: allCourseIds, // Assign all courses
        })
      } else {
        // Create new student via API (which hashes the password)
        if (!data.password) {
          throw new Error("كلمة المرور مطلوبة")
        }
        
        const response = await fetch('/api/auth/student/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: data.name,
            username: data.username,
            email: data.email || `${data.username}@student.local`,
            password: data.password,
            courses: allCourseIds,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'فشل إنشاء الطالب');
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 space-x-reverse arabic-text">
            <UserIcon className="h-5 w-5" />
            <span>المعلومات الشخصية</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="username" className="arabic-text">اسم المستخدم *</Label>
              <Input
                id="username"
                {...register("username")}
                placeholder="username123"
                disabled={!!student} // Don't allow username changes for existing students
                dir="ltr"
              />
              {errors.username && (
                <p className="text-sm text-destructive arabic-text">{errors.username.message}</p>
              )}
              <p className="text-xs text-muted-foreground arabic-text">
                3-20 حرف، أحرف وأرقام فقط
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="arabic-text">البريد الإلكتروني (اختياري)</Label>
              <Input
                id="email"
                type="email"
                {...register("email")}
                placeholder="student@example.com"
                disabled={!!student} // Don't allow email changes for existing students
                dir="ltr"
              />
              {errors.email && (
                <p className="text-sm text-destructive arabic-text">{errors.email.message}</p>
              )}
              <p className="text-xs text-muted-foreground arabic-text">
                يمكن للطالب تسجيل الدخول باسم المستخدم فقط
              </p>
            </div>
          </div>

          {!student && (
            <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
              <Label htmlFor="password" className="arabic-text text-base font-semibold">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                {...register("password")}
                placeholder="أدخل كلمة المرور (6 أحرف على الأقل)"
                dir="ltr"
              />
              {errors.password && (
                <p className="text-sm text-destructive arabic-text">{errors.password.message}</p>
              )}
              <p className="text-xs text-muted-foreground arabic-text">
                سيستخدم الطالب اسم المستخدم أو البريد الإلكتروني مع كلمة المرور لتسجيل الدخول
              </p>
            </div>
          )}

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

          <div className="pt-2 border-t">
            <p className="text-sm text-muted-foreground arabic-text flex items-center gap-2">
              <BookOpenIcon className="h-4 w-4" />
              سيتم تسجيل الطالب تلقائياً في جميع المقررات المتاحة
            </p>
          </div>
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