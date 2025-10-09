"use client"

import * as React from "react"
import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Id } from "@/convex/_generated/dataModel"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { MeetingForm } from "./meeting-form"
import { MeetingListCard } from "./meeting-list-card"
import {
    VideoIcon,
    PlusIcon,
    CalendarIcon,
    ClockIcon
} from "lucide-react"

export function MeetingManagement() {
    const [showCreateDialog, setShowCreateDialog] = React.useState(false)
    const [editingMeeting, setEditingMeeting] = React.useState<Id<"meetings"> | null>(null)

    const currentMeeting = useQuery(api.meetings.getCurrentMeetingWithCourse)
    const upcomingMeetings = useQuery(api.meetings.getAllActiveMeetings)
    const courses = useQuery(api.courses.getActiveCourses)

    const handleCreateSuccess = () => {
        setShowCreateDialog(false)
    }

    const handleEditSuccess = () => {
        setEditingMeeting(null)
    }

    const handleEdit = (meetingId: Id<"meetings">) => {
        setEditingMeeting(meetingId)
        setShowCreateDialog(true)
    }

    if (!upcomingMeetings || !courses) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-3xl font-bold arabic-text">إدارة الجلسات</h1>
                        <Skeleton className="h-10 w-32" />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-1 space-y-4">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <Skeleton className="h-4 w-24" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-8 w-16 mb-2" />
                                        <Skeleton className="h-3 w-32" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <div className="lg:col-span-2">
                            <Card>
                                <CardContent className="p-6">
                                    <div className="space-y-4">
                                        {Array.from({ length: 3 }).map((_, i) => (
                                            <div key={i} className="flex items-center justify-between">
                                                <div className="space-y-2">
                                                    <Skeleton className="h-5 w-48" />
                                                    <Skeleton className="h-4 w-32" />
                                                </div>
                                                <Skeleton className="h-8 w-20" />
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const now = Date.now()
    const totalMeetings = upcomingMeetings.length
    const todaysMeetings = upcomingMeetings.filter(meeting => {
        const today = new Date()
        const meetingDate = new Date(meeting.scheduledTime)
        return meetingDate.toDateString() === today.toDateString()
    }).length

    const activeMeetings = upcomingMeetings.filter(meeting => {
        const meetingEnd = meeting.scheduledTime + (meeting.duration * 60 * 1000)
        return meeting.scheduledTime <= now && now <= meetingEnd
    }).length

    // Filter for truly upcoming meetings (future meetings)
    const futureMeetings = upcomingMeetings.filter(meeting => meeting.scheduledTime > now)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold arabic-text">إدارة الجلسات</h1>
                        <p className="text-muted-foreground arabic-text">
                            إنشاء وإدارة جلسات Google Meet للطلاب
                        </p>
                    </div>
                    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                        <DialogTrigger asChild>
                            <Button className="arabic-text">
                                <PlusIcon className="h-4 w-4 ml-2" />
                                إنشاء جلسة جديدة
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden p-0 gap-0" dir="rtl" showCloseButton={false}>
                            <DialogHeader className="px-8 py-6 border-b">
                                <DialogTitle className="arabic-text text-2xl font-bold text-right">
                                    {editingMeeting ? 'تعديل الجلسة' : 'إنشاء جلسة جديدة'}
                                </DialogTitle>
                            </DialogHeader>
                            <div className="overflow-y-auto px-8 py-6 max-h-[calc(90vh-140px)]" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                                <MeetingForm
                                    meetingId={editingMeeting}
                                    courses={courses}
                                    onSuccess={editingMeeting ? handleEditSuccess : handleCreateSuccess}
                                    onCancel={() => {
                                        setShowCreateDialog(false)
                                        setEditingMeeting(null)
                                    }}
                                />
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Bento Box Layout */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left Column - Statistics */}
                    <div className="lg:col-span-1 space-y-4">
                        {/* Statistics Cards */}
                        <div className="space-y-3">
                            <Card className="cursor-pointer transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-indigo-300 dark:hover:border-indigo-600 group">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 arabic-text transition-colors duration-300">إجمالي الجلسات</p>
                                            <p className="text-2xl font-bold group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors duration-300">{totalMeetings}</p>
                                        </div>
                                        <div className="p-3 bg-muted/50 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 rounded-xl transition-all duration-300 group-hover:scale-110">
                                            <VideoIcon className="h-5 w-5 text-muted-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground group-hover:text-indigo-500 dark:group-hover:text-indigo-400 arabic-text mt-2 transition-colors duration-300">
                                        خلال 30 يوم القادمة
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-emerald-300 dark:hover:border-emerald-600 group">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 arabic-text transition-colors duration-300">جلسات اليوم</p>
                                            <p className="text-2xl font-bold group-hover:text-emerald-700 dark:group-hover:text-emerald-300 transition-colors duration-300">{todaysMeetings}</p>
                                        </div>
                                        <div className="p-3 bg-muted/50 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/30 rounded-xl transition-all duration-300 group-hover:scale-110">
                                            <CalendarIcon className="h-5 w-5 text-muted-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-300" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground group-hover:text-emerald-500 dark:group-hover:text-emerald-400 arabic-text mt-2 transition-colors duration-300">
                                        المجدولة اليوم
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="cursor-pointer transition-all duration-500 ease-out hover:shadow-lg hover:-translate-y-1 hover:border-orange-300 dark:hover:border-orange-600 group">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 arabic-text transition-colors duration-300">الجلسات النشطة</p>
                                            <p className="text-2xl font-bold group-hover:text-orange-700 dark:group-hover:text-orange-300 transition-colors duration-300">{activeMeetings}</p>
                                        </div>
                                        <div className="p-3 bg-muted/50 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 rounded-xl transition-all duration-300 group-hover:scale-110">
                                            <ClockIcon className="h-5 w-5 text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors duration-300" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-muted-foreground group-hover:text-orange-500 dark:group-hover:text-orange-400 arabic-text mt-2 transition-colors duration-300">
                                        جارية الآن
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Right Column - Current Meeting and Meetings List */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Current Meeting */}
                        {currentMeeting && (
                            <Card className="border-primary bg-primary/5">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg arabic-text flex items-center">
                                        <VideoIcon className="h-5 w-5 ml-2" />
                                        الجلسة الحالية
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <MeetingListCard
                                        meeting={{
                                            _id: currentMeeting._id,
                                            courseId: currentMeeting.courseId,
                                            googleMeetLink: currentMeeting.googleMeetLink,
                                            password: currentMeeting.password,
                                            scheduledTime: currentMeeting.scheduledTime,
                                            duration: currentMeeting.duration,
                                            isActive: currentMeeting.isActive,
                                            createdBy: currentMeeting.createdBy as any
                                        }}
                                        course={currentMeeting.course || undefined}
                                        onEdit={handleEdit}
                                        isCompact={false}
                                        isCurrent={true}
                                    />
                                </CardContent>
                            </Card>
                        )}

                        {/* Meetings List */}
                        <Card className="h-fit">
                            <CardHeader>
                                <CardTitle className="arabic-text flex items-center justify-between">
                                    <span>الجلسات القادمة</span>
                                    <Badge variant="secondary" className="arabic-text">
                                        {futureMeetings.filter(meeting => meeting._id !== currentMeeting?._id).length} جلسة
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {futureMeetings.filter(meeting => meeting._id !== currentMeeting?._id).length > 0 ? (
                                    <div className="space-y-3 max-h-[500px] overflow-y-auto">
                                        {futureMeetings
                                            .filter(meeting => meeting._id !== currentMeeting?._id)
                                            .sort((a, b) => a.scheduledTime - b.scheduledTime)
                                            .map((meeting) => {
                                                const course = courses.find(c => c._id === meeting.courseId)
                                                return (
                                                    <MeetingListCard
                                                        key={meeting._id}
                                                        meeting={meeting as any}
                                                        course={course || undefined}
                                                        onEdit={handleEdit}
                                                        isCompact={false}
                                                    />
                                                )
                                            })}
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <VideoIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-medium arabic-text mb-2">لا توجد جلسات مجدولة</h3>
                                        <p className="text-muted-foreground arabic-text mb-6">
                                            ابدأ بإنشاء جلسة جديدة للطلاب
                                        </p>
                                        <Button
                                            onClick={() => setShowCreateDialog(true)}
                                            className="arabic-text"
                                        >
                                            <PlusIcon className="h-4 w-4 ml-2" />
                                            إنشاء جلسة جديدة
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}