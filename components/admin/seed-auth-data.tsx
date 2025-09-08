"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Database, Trash2, Users, BookOpen, Calendar, Newspaper } from "lucide-react"
import { toast } from "sonner"

export function SeedAuthData() {
    const [isSeeding, setIsSeeding] = useState(false)
    const [isClearing, setIsClearing] = useState(false)
    const [seedResult, setSeedResult] = useState<any>(null)

    const seedWithAuth = useMutation(api.simpleSeed.createSimpleTestData)
    const clearData = useMutation(api.simpleSeed.clearAllData)

    const handleSeed = async () => {
        setIsSeeding(true)
        try {
            const result = await seedWithAuth()
            setSeedResult(result)
            toast.success("تم إنشاء البيانات التجريبية بنجاح!")
        } catch (error) {
            console.error("Seed error:", error)
            toast.error("حدث خطأ أثناء إنشاء البيانات")
        } finally {
            setIsSeeding(false)
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
                        إدارة البيانات التجريبية
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4">
                        <Button
                            onClick={handleSeed}
                            disabled={isSeeding || isClearing}
                            className="arabic-text"
                        >
                            {isSeeding ? (
                                <>
                                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                                    جاري الإنشاء...
                                </>
                            ) : (
                                <>
                                    <Database className="h-4 w-4 ml-2" />
                                    إنشاء بيانات تجريبية
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

                    <div className="text-sm text-muted-foreground arabic-text">
                        <p>• إنشاء بيانات تجريبية: ينشئ حسابات طلاب ومدرسين، مقررات، جلسات، وأخبار</p>
                        <p>• حذف البيانات: يحذف جميع البيانات من قاعدة البيانات</p>
                    </div>
                </CardContent>
            </Card>

            {seedResult && (
                <Card>
                    <CardHeader>
                        <CardTitle className="arabic-text flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            حسابات تسجيل الدخول
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4">
                            {seedResult.accounts?.map((account: any, index: number) => (
                                <div key={index} className="p-4 border rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="font-semibold arabic-text">{account.name}</h4>
                                        <Badge variant={account.role === "admin" ? "destructive" : "default"}>
                                            {account.role === "admin" ? "مدرس" : "طالب"}
                                        </Badge>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <p><strong>البريد الإلكتروني:</strong> <code>{account.email}</code></p>
                                        <p><strong>كلمة المرور:</strong> <code>{account.password}</code></p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {seedResult.stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <Users className="h-6 w-6 mx-auto mb-1 text-blue-600" />
                                    <div className="text-2xl font-bold">{seedResult.stats.users}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">مستخدمين</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <BookOpen className="h-6 w-6 mx-auto mb-1 text-green-600" />
                                    <div className="text-2xl font-bold">{seedResult.stats.courses}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">مقررات</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <Calendar className="h-6 w-6 mx-auto mb-1 text-purple-600" />
                                    <div className="text-2xl font-bold">{seedResult.stats.meetings}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">جلسات</div>
                                </div>
                                <div className="text-center p-3 bg-muted rounded-lg">
                                    <Newspaper className="h-6 w-6 mx-auto mb-1 text-orange-600" />
                                    <div className="text-2xl font-bold">{seedResult.stats.news}</div>
                                    <div className="text-sm text-muted-foreground arabic-text">أخبار</div>
                                </div>
                            </div>
                        )}

                        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                            <p className="text-sm arabic-text text-blue-800 dark:text-blue-200">
                                <strong>تعليمات تسجيل الدخول:</strong> استخدم أي من عناوين البريد الإلكتروني وكلمات المرور أعلاه لتسجيل الدخول إلى النظام.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}