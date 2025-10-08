"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, Trash2, Users, BookOpen, Calendar, Newspaper, Key, ArrowRight, Copy } from "lucide-react"
import { toast } from "sonner"

export function ComprehensiveSeed() {
    const [isSeeding, setIsSeeding] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [seedResult, setSeedResult] = useState<any>(null)

    const createData = useMutation(api.simpleSeed.createCompleteTestData)
    const clearData = useMutation(api.simpleSeed.clearAllData)

    const handleSeed = async () => {
        setIsSeeding(true)
        try {
            const result = await createData()
            setSeedResult(result)
            if (result.success) {
                toast.success("🎉 تم إنشاء البيانات التجريبية الشاملة بنجاح!")
            } else {
                toast.info(result.message)
            }
        } catch (error) {
            console.error("Seed error:", error)
            toast.error("حدث خطأ أثناء إنشاء البيانات")
        } finally {
            setIsSeeding(false)
        }
    }

    const copyToClipboard = async (text: string, label: string) => {
        try {
            await navigator.clipboard.writeText(text)
            toast.success(`تم نسخ ${label}`)
        } catch (error) {
            toast.error("فشل في النسخ")
        }
    }

    const handleClear = async () => {
        setIsClearing(true)
        try {
            await clearData()
            setSeedResult(null)
            toast.success("تم حذف جميع البيانات بنجاح!")
        } catch (error) {
            console.error("Clear error:", error)
            toast.error("حدث خطأ أثناء حذف البيانات")
        } finally {
            setIsClearing(false)
        }
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="arabic-text flex items-center gap-2">
                        <Database className="h-5 w-5" />
                        إدارة البيانات التجريبية الشاملة
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSeed}
                            disabled={isSeeding || isClearing}
                            size="lg"
                            className="arabic-text"
                        >
                            {isSeeding ? (
                                <>
                                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                    جاري إنشاء البيانات الشاملة...
                                </>
                            ) : (
                                <>
                                    <Database className="h-4 w-4 ml-2" />
                                    إنشاء بيانات تجريبية شاملة
                                </>
                            )}
                        </Button>

                        <Button
                            onClick={handleClear}
                            disabled={isSeeding || isClearing}
                            variant="destructive"
                            className="arabic-text"
                        >
                            {isClearing ? (
                                <>
                                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                    جاري الحذف...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-4 w-4 ml-2" />
                                    حذف جميع البيانات
                                </>
                            )}
                        </Button>
                    </div>

                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <h4 className="font-semibold arabic-text mb-2">ما سيتم إنشاؤه:</h4>
                        <div className="text-sm text-blue-800 dark:text-blue-200 arabic-text space-y-1">
                            <p>• 5 حسابات مستخدمين (3 طلاب + 2 مدرسين) مع كلمات مرور</p>
                            <p>• 5 مقررات دراسية شاملة (فقه، عقيدة، حديث، تفسير، سيرة)</p>
                            <p>• جدول جلسات لأسبوعين كاملين مع روابط Google Meet</p>
                            <p>• دروس مرتبطة بالجلسات والمقررات</p>
                            <p>• 7 أخبار وإعلانات متنوعة</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {seedResult && seedResult.success && (
                <>
                    {/* Login Credentials */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="arabic-text flex items-center gap-2">
                                <Key className="h-5 w-5" />
                                بيانات تسجيل الدخول
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4">
                                {seedResult.loginCredentials?.map((account: any, index: number) => (
                                    <div key={index} className="p-4 border rounded-lg space-y-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold arabic-text">{account.name}</h4>
                                            <Badge variant={account.role === "admin" ? "destructive" : "default"}>
                                                {account.arabicRole}
                                            </Badge>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div className="space-y-1">
                                                <p className="text-muted-foreground">البريد الإلكتروني:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-muted px-2 py-1 rounded text-xs">{account.email}</code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(account.email, "البريد الإلكتروني")}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <p className="text-muted-foreground">كلمة المرور:</p>
                                                <div className="flex items-center gap-2">
                                                    <code className="bg-muted px-2 py-1 rounded text-xs">{account.password}</code>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => copyToClipboard(account.password, "كلمة المرور")}
                                                        className="h-6 w-6 p-0"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-2 border-t">
                                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground arabic-text">
                                                {account.role === "admin"
                                                    ? "يتوجه إلى لوحة الإدارة بعد تسجيل الدخول"
                                                    : "يتوجه إلى لوحة الطلاب بعد تسجيل الدخول"
                                                }
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Statistics */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="arabic-text flex items-center gap-2">
                                <Database className="h-5 w-5" />
                                إحصائيات البيانات المنشأة
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                                    <div className="text-2xl font-bold">{seedResult.statistics?.totalUsers}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">مستخدمين</div>
                                    <div className="text-xs text-muted-foreground arabic-text mt-1">
                                        {seedResult.statistics?.students} طلاب، {seedResult.statistics?.admins} مدرسين
                                    </div>
                                </div>

                                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <BookOpen className="h-8 w-8 mx-auto mb-2 text-green-600" />
                                    <div className="text-2xl font-bold">{seedResult.statistics?.courses}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">مقررات</div>
                                </div>

                                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                                    <Calendar className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                                    <div className="text-2xl font-bold">{seedResult.statistics?.meetings}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">جلسات</div>
                                    <div className="text-xs text-muted-foreground arabic-text mt-1">
                                        {seedResult.statistics?.lessons} درس
                                    </div>
                                </div>

                                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                                    <Newspaper className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                                    <div className="text-2xl font-bold">{seedResult.statistics?.newsArticles}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">أخبار</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Info & Next Steps */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="arabic-text">معلومات سريعة والخطوات التالية</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {seedResult.quickInfo?.nextMeeting && (
                                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                                    <h4 className="font-semibold arabic-text text-green-800 dark:text-green-200 mb-1">
                                        الجلسة القادمة:
                                    </h4>
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        {seedResult.quickInfo.nextMeeting.courseName} - {seedResult.quickInfo.nextMeeting.time}
                                    </p>
                                </div>
                            )}

                            {seedResult.quickInfo?.latestNews && (
                                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                                    <h4 className="font-semibold arabic-text text-blue-800 dark:text-blue-200 mb-1">
                                        آخر الأخبار:
                                    </h4>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        {seedResult.quickInfo.latestNews}
                                    </p>
                                </div>
                            )}

                            <div className="p-4 bg-gradient-to-r from-primary/10 to-blue-50/20 rounded-lg border border-primary/20">
                                <h4 className="font-semibold arabic-text mb-2">تعليمات الاستخدام:</h4>
                                <p className="text-sm arabic-text leading-relaxed">
                                    {seedResult.instructions?.ar}
                                </p>
                                <div className="mt-3 flex gap-2">
                                    <Badge variant="outline">لوحة الطلاب: /student/dashboard</Badge>
                                    <Badge variant="outline">لوحة الإدارة: /admin/dashboard</Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {seedResult && !seedResult.success && (
                <Card>
                    <CardContent className="p-6">
                        <div className="text-center">
                            <p className="text-muted-foreground arabic-text">{seedResult.message}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}