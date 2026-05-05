"use client";

import { useEffect, useState } from "react";

interface Post {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  isPublished: boolean;
  views: number;
  createdAt: string;
}

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ title: "", slug: "", content: "", excerpt: "", coverImage: "", isPublished: false, seoTitle: "", seoDesc: "" });

  const fetchPosts = async () => {
    const res = await fetch("/api/admin/blog");
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, []);

  const openNew = () => {
    setForm({ title: "", slug: "", content: "", excerpt: "", coverImage: "", isPublished: false, seoTitle: "", seoDesc: "" });
    setEditingId(null); setShowForm(true);
  };

  const openEdit = async (id: string) => {
    const res = await fetch(`/api/admin/blog/${id}`);
    // We don't have a GET for individual, so use the list
    const post = posts.find((p) => p.id === id);
    if (post) {
      setForm({ title: post.title, slug: post.slug, content: "", excerpt: post.excerpt ?? "", coverImage: "", isPublished: post.isPublished, seoTitle: "", seoDesc: "" });
      setEditingId(id); setShowForm(true);
    }
  };

  const slugify = (title: string) => title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

  const save = async () => {
    setSaving(true); setMsg("");
    const url = editingId ? `/api/admin/blog/${editingId}` : "/api/admin/blog";
    const method = editingId ? "PUT" : "POST";
    if (!form.slug && form.title) form.slug = slugify(form.title);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { setMsg(editingId ? "تم التعديل" : "تم النشر"); setShowForm(false); fetchPosts(); }
    else setMsg(data.message ?? "حدث خطأ");
    setSaving(false);
  };

  const deletePost = async (id: string) => {
    if (!confirm("هل تريد حذف هذا المقال؟")) return;
    await fetch(`/api/admin/blog/${id}`, { method: "DELETE" });
    fetchPosts();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">إدارة المدونة</h1>
          <p className="text-slate-400 mt-1">{posts.length} مقال</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ مقال جديد</button>
      </div>

      {msg && <div className="mb-4 p-3 bg-violet-900/30 border border-violet-500 rounded-xl text-violet-300 text-sm">{msg}</div>}

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">{editingId ? "تعديل المقال" : "مقال جديد"}</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm mb-1 block">العنوان *</label>
                <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: !editingId ? slugify(e.target.value) : form.slug })} />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1 block">Slug (URL)</label>
                <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm font-mono" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} dir="ltr" />
              </div>
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">المحتوى (HTML مدعوم) *</label>
              <textarea className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm h-48 resize-none" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="محتوى المقال..." />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">مقتطف</label>
              <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm mb-1 block">صورة الغلاف (URL)</label>
                <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.coverImage} onChange={(e) => setForm({ ...form, coverImage: e.target.value })} dir="ltr" />
              </div>
              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} className="w-4 h-4 accent-violet-600" />
                  <span className="text-slate-300 text-sm">نشر المقال</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "جاري الحفظ..." : "حفظ"}</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700"><tr className="text-slate-400">{["العنوان", "الحالة", "المشاهدات", "التاريخ", "إجراءات"].map((h) => <th key={h} className="text-right px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700">
              {posts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-white font-semibold">{p.title}</td>
                  <td className="px-4 py-3"><span className={p.isPublished ? "text-xs bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded-full" : "text-xs bg-slate-700 text-slate-400 px-2 py-1 rounded-full"}>{p.isPublished ? "منشور" : "مسودة"}</span></td>
                  <td className="px-4 py-3 text-slate-300">{p.views}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(p.createdAt).toLocaleDateString("ar-SA")}</td>
                  <td className="px-4 py-3"><div className="flex gap-2"><button onClick={() => openEdit(p.id)} className="text-violet-400 text-xs font-semibold">تعديل</button><button onClick={() => deletePost(p.id)} className="text-red-400 text-xs font-semibold">حذف</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {posts.length === 0 && <div className="text-center py-12 text-slate-500">لا توجد مقالات</div>}
        </div>
      )}
    </div>
  );
}
