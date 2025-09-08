"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { SaveIcon } from "lucide-react"

interface Course {
  _id: Id<"courses">
  name: string
  description: string
  instructor: string
  isActive: boolean
  createdAt: number
  students: Id<"students">[]
}

interface CourseFormProps {
  course?: Course
  onSuccess: () => void
  onCancel: () => void
}

interface FormData {
  name: string
  description: string
  instructor: string
}

// Rich text editor component (simplified for now)
function RichTextEditor({ 
  value, 
  onChange, 
  placeholder 
}: { 
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="space-y-2">
      <div className="border rounded-md">
        {/* Toolbar */}
        <div className="border-b p-2 flex items-center space-x-2 space-x-reverse bg-muted/50">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const textarea = document.getElementById('description-textarea') as HTMLTextAreaElement
              if (textarea) {
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const text = textarea.value
                const before = text.substring(0, start)
                const after = text.substring(end)
                const newText = before + '**' + text.substring(start, end) + '**' + after
                onChange(newText)
                setTimeout(() => {
                  textarea.focus()
                  textarea.setSelectionRange(start + 2, end + 2)
                }, 0)
              }
            }}
            className="text-xs arabic-text"
          >
            <strong>غامق</strong>
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const textarea = document.getElementById('description-textarea') as HTMLTextAreaElement
              if (textarea) {
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const text = textarea.value
                const before = text.substring(0, start)
                const after = text.substring(end)
                const newText = before + '*' + text.substring(start, end) + '*' + after
                onChange(newText)
                setTimeout(() => {
                  textarea.focus()
                  textarea.setSelectionRange(start + 1, end + 1)
                }, 0)
              }
            }}
            className="text-xs arabic-text"
          >
            <em>مائل</em>
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const textarea = document.getElementById('description-textarea') as HTMLTextAreaElement
              if (textarea) {
                const start = textarea.selectionStart
                const text = textarea.value
                const before = text.substring(0, start)
                const after = text.substring(start)
                const newText = before + '\n• ' + after
                onChange(newText)
                setTimeout(() => {
                  textarea.focus()
                  textarea.setSelectionRange(start + 3, start + 3)
                }, 0)
              }
            }}
            className="text-xs arabic-text"
          >
            قائمة
          </Button>
        </div>
        
        {/* Text Area */}
        <textarea
          id="description-textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-3 border-0 resize-none focus:outline-none focus:ring-0 min-h-[120px] arabic-text"
          dir="rtl"
        />
      </div>
      
      {/* Preview */}
      {value && (
        <div className="mt-2">
          <Label className="text-xs text-muted-foreground arabic-text">معاينة:</Label>
          <div className="mt-1 p-3 bg-muted/50 rounded-md text-sm arabic-text" dir="rtl">
            {value.split('\n').map((line, index) => {
              // Simple markdown parsing
              let processedLine = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/^• (.*)/, '<li>$1</li>')
              
              if (processedLine.includes('<li>')) {
                return <ul key={index} className="list-disc list-inside"><li dangerouslySetInnerHTML={{ __html: processedLine.replace('<li>', '').replace('</li>', '') }} /></ul>
              }
              
              return (
                <p key={index} dangerouslySetInnerHTML={{ __html: processedLine }} />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function CourseForm({ course, onSuccess, onCancel }: CourseFormProps) {
  const [formData, setFormData] = React.useState<FormData>({
    name: course?.name || '',
    description: course?.description || '',
    instructor: course?.instructor || '',
  })
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<FormData>>({})

  const createCourse = useMutation(api.courses.createCourse)
  const updateCourse = useMutation(api.courses.updateCourse)

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'اسم المقرر مطلوب'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'وصف المقرر مطلوب'
    }

    if (!formData.instructor.trim()) {
      newErrors.instructor = 'اسم المدرس مطلوب'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      if (course) {
        // Update existing course
        await updateCourse({
          id: course._id,
          name: formData.name.trim(),
          description: formData.description.trim(),
          instructor: formData.instructor.trim(),
        })
      } else {
        // Create new course
        await createCourse({
          name: formData.name.trim(),
          description: formData.description.trim(),
          instructor: formData.instructor.trim(),
        })
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error saving course:', error)
      alert('حدث خطأ أثناء حفظ المقرر')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Course Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="arabic-text">اسم المقرر *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange('name', e.target.value)}
          placeholder="أدخل اسم المقرر"
          className={`arabic-text ${errors.name ? 'border-destructive' : ''}`}
          dir="rtl"
        />
        {errors.name && (
          <p className="text-sm text-destructive arabic-text">{errors.name}</p>
        )}
      </div>

      {/* Instructor Name */}
      <div className="space-y-2">
        <Label htmlFor="instructor" className="arabic-text">اسم المدرس *</Label>
        <Input
          id="instructor"
          value={formData.instructor}
          onChange={(e) => handleInputChange('instructor', e.target.value)}
          placeholder="أدخل اسم المدرس"
          className={`arabic-text ${errors.instructor ? 'border-destructive' : ''}`}
          dir="rtl"
        />
        {errors.instructor && (
          <p className="text-sm text-destructive arabic-text">{errors.instructor}</p>
        )}
      </div>

      {/* Course Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="arabic-text">وصف المقرر *</Label>
        <RichTextEditor
          value={formData.description}
          onChange={(value) => handleInputChange('description', value)}
          placeholder="أدخل وصف المقرر... يمكنك استخدام التنسيق البسيط مثل **غامق** و *مائل*"
        />
        {errors.description && (
          <p className="text-sm text-destructive arabic-text">{errors.description}</p>
        )}
      </div>

      {/* Form Actions */}
      <div className="flex items-center justify-end space-x-3 space-x-reverse pt-6 border-t">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          <span className="arabic-text">إلغاء</span>
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          <SaveIcon className="h-4 w-4 ml-1" />
          <span className="arabic-text">
            {isSubmitting ? 'جاري الحفظ...' : course ? 'تحديث المقرر' : 'إنشاء المقرر'}
          </span>
        </Button>
      </div>
    </form>
  )
}