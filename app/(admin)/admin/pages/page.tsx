"use client";

import { useEffect, useState } from "react";

const staticPages = [
  { slug: "terms", label: "الشروط والأحكام" },
  { slug: "privacy", label: "سياسة الخصوصية" },
  { slug: "how-to-use", label: "كيفية الاستخدام" },
];

interface Page {
  slug: string;
  title: string;
  content: string;
  isActive: boolean;
  seoTitle: string | null;
  seoDesc: string | null;
}

export default function AdminPagesPage() {
  const [pages, setPages] = useState<Record<string, Page>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", content: "", isActive: true, seoTitle: "", seoDesc: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const fetchPages = async () => {
    const res = await fetch("/api/admin/pages");
    const data = await res.json();
    const map: Record<string, Page> = {};
    for (const p of data.pages ?? []) map[p.slug] = p;
    setPages(map);
  };

  useEffect(() => { fetchPages(); }, []);

  const openEdit = (slug: string) => {
    const page = pages[slug];
    const info = staticPages.find((p) => p.slug === slug);
    setForm({
      title: page?.title ?? info?.label ?? slug,
      content: page?.content ?? "",
      isActive: page?.isActive ?? true,
      seoTitle: page?.seoTitle ?? "",
      seoDesc: page?.seoDesc ?? "",
    });
    setEditing(slug);
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/pages/${editing}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setMsg("تم الحفظ بنجاح"); setEditing(null); fetchPages(); }
    else setMsg("حدث خطأ في الحفظ");
    setSaving(false);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">الصفحات الثابتة</h1>
        <p className="text-slate-400 mt-1">تعديل محتوى الصفحات الثابتة</p>
      </div>

      {msg && <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-500 rounded-xl text-emerald-300 text-sm">{msg}</div>}

      {editing ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">تعديل: {staticPages.find((p) => p.slug === editing)?.label}</h2>
            <button onClick={() => setEditing(null)} className="text-slate-400 hover:text-white text-sm">إلغاء</button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm mb-1 block">عنوان الصفحة</label>
              <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">المحتوى (HTML مدعوم)</label>
              <textarea className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm h-64 resize-none font-mono" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="<p>محتوى الصفحة...</p>" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-slate-300 text-sm mb-1 block">عنوان SEO</label>
                <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.seoTitle} onChange={(e) => setForm({ ...form, seoTitle: e.target.value })} />
              </div>
              <div>
                <label className="text-slate-300 text-sm mb-1 block">وصف SEO</label>
                <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.seoDesc} onChange={(e) => setForm({ ...form, seoDesc: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-violet-600" />
              <span className="text-slate-300 text-sm">الصفحة مفعّلة</span>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
            <button onClick={() => setEditing(null)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {staticPages.map((p) => {
            const page = pages[p.slug];
            return (
              <div key={p.slug} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-9 h-9 rounded-xl bg-slate-700 flex items-center justify-center shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold">{p.label}</h3>
                  <p className="text-slate-400 text-sm mt-0.5">
                    {page ? (
                      <>آخر تعديل · <span className={page.isActive ? "text-emerald-400" : "text-red-400"}>{page.isActive ? "مفعّلة" : "معطّلة"}</span></>
                    ) : (
                      <span className="text-amber-400">لم يتم التعديل بعد (يستخدم المحتوى الافتراضي)</span>
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <a href={`/${p.slug}`} target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:text-slate-200 text-sm font-semibold">معاينة ↗</a>
                  <button onClick={() => openEdit(p.slug)} className="btn-primary text-sm px-4 py-2">تعديل</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
