"use client";

import { useState, ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  FileText,
  Calendar,
  User,
  Paperclip,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

interface NewsManagementProps {
  className?: string;
}

export function NewsManagement({ className }: NewsManagementProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingNews, setEditingNews] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublished: false,
  });

  // Get current admin user (for now, we'll use a mock admin)
  const currentUser = { _id: "mock_admin_id" as any, name: "المشرف" };

  const allNews = useQuery(api.news.getAllNews, { limit: 100 });
  const createNews = useMutation(api.news.createNews);
  const updateNews = useMutation(api.news.updateNews);
  const deleteNews = useMutation(api.news.deleteNews);
  const publishNews = useMutation(api.news.publishNews);
  const unpublishNews = useMutation(api.news.unpublishNews);

  const handleCreate = async () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await createNews({
        title: formData.title,
        content: formData.content,
        isPublished: formData.isPublished,
        attachments: [],
        createdBy: currentUser._id,
      });

      toast.success("تم إنشاء الخبر بنجاح");
      setFormData({ title: "", content: "", isPublished: false });
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error("Create news error:", error);
      toast.error("حدث خطأ في إنشاء الخبر");
    }
  };

  const handleUpdate = async () => {
    if (!editingNews || !formData.title.trim() || !formData.content.trim()) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await updateNews({
        id: editingNews._id,
        title: formData.title,
        content: formData.content,
        isPublished: formData.isPublished,
      });

      toast.success("تم تحديث الخبر بنجاح");
      setEditingNews(null);
      setFormData({ title: "", content: "", isPublished: false });
    } catch (error) {
      console.error("Update news error:", error);
      toast.error("حدث خطأ في تحديث الخبر");
    }
  };

  const handleDelete = async (newsId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الخبر؟")) return;

    try {
      await deleteNews({ id: newsId as any });
      toast.success("تم حذف الخبر بنجاح");
    } catch (error) {
      console.error("Delete news error:", error);
      toast.error("حدث خطأ في حذف الخبر");
    }
  };

  const handleTogglePublish = async (news: any) => {
    try {
      if (news.isPublished) {
        await unpublishNews({ id: news._id });
        toast.success("تم إلغاء نشر الخبر");
      } else {
        await publishNews({ id: news._id });
        toast.success("تم نشر الخبر");
      }
    } catch (error) {
      console.error("Toggle publish error:", error);
      toast.error("حدث خطأ في تغيير حالة النشر");
    }
  };

  const openEditDialog = (news: any) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      content: news.content,
      isPublished: news.isPublished,
    });
  };

  const closeEditDialog = () => {
    setEditingNews(null);
    setFormData({ title: "", content: "", isPublished: false });
  };

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), "dd/MM/yyyy HH:mm", { locale: ar });
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold arabic-text">
            إدارة الأخبار والإعلانات
          </h2>
          <p className="text-muted-foreground arabic-text">
            إنشاء وإدارة الأخبار والإعلانات للطلاب
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="arabic-text">
              <Plus className="h-4 w-4 ml-2" />
              خبر جديد
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="arabic-text">إنشاء خبر جديد</DialogTitle>
              <DialogDescription className="arabic-text">
                أدخل تفاصيل الخبر الجديد
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="arabic-text">
                  عنوان الخبر
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="أدخل عنوان الخبر"
                  className="arabic-text"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content" className="arabic-text">
                  محتوى الخبر
                </Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="أدخل محتوى الخبر"
                  rows={6}
                  className="arabic-text"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={formData.isPublished}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPublished: e.target.checked,
                    }))
                  }
                  className="rounded"
                />
                <Label htmlFor="isPublished" className="arabic-text">
                  نشر الخبر فوراً
                </Label>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button onClick={handleCreate} className="arabic-text">
                إنشاء الخبر
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* News List */}
      <div className="space-y-4">
        {allNews?.map((news) => (
          <Card key={news._id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg arabic-text mb-2">
                    {news.title}
                  </CardTitle>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(news.publishedAt)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-4 w-4" />
                      <span>{currentUser.name}</span>
                    </div>
                    {news.attachments.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Paperclip className="h-4 w-4" />
                        <span>{news.attachments.length} مرفق</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={news.isPublished ? "default" : "secondary"}>
                    {news.isPublished ? "منشور" : "مسودة"}
                  </Badge>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublish(news)}
                    className="h-8 w-8 p-0"
                  >
                    {news.isPublished ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEditDialog(news)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(news._id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <p className="text-muted-foreground arabic-text line-clamp-3">
                {news.content}
              </p>
            </CardContent>
          </Card>
        ))}

        {(!allNews || allNews.length === 0) && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold arabic-text mb-2">
                لا توجد أخبار
              </h3>
              <p className="text-muted-foreground arabic-text text-center mb-4">
                لم يتم إنشاء أي أخبار بعد. ابدأ بإنشاء خبر جديد.
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="arabic-text"
              >
                <Plus className="h-4 w-4 ml-2" />
                إنشاء أول خبر
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingNews} onOpenChange={() => closeEditDialog()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="arabic-text">تعديل الخبر</DialogTitle>
            <DialogDescription className="arabic-text">
              تعديل تفاصيل الخبر
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title" className="arabic-text">
                عنوان الخبر
              </Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="أدخل عنوان الخبر"
                className="arabic-text"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-content" className="arabic-text">
                محتوى الخبر
              </Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, content: e.target.value }))
                }
                placeholder="أدخل محتوى الخبر"
                rows={6}
                className="arabic-text"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-isPublished"
                checked={formData.isPublished}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    isPublished: e.target.checked,
                  }))
                }
                className="rounded"
              />
              <Label htmlFor="edit-isPublished" className="arabic-text">
                نشر الخبر
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeEditDialog}>
              إلغاء
            </Button>
            <Button onClick={handleUpdate} className="arabic-text">
              حفظ التغييرات
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
