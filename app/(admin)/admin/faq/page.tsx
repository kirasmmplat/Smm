"use client";

import { useEffect, useState } from "react";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
  isActive: boolean;
}

export default function AdminFaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ question: "", answer: "", category: "general", sortOrder: "0", isActive: true });

  const fetchItems = async () => {
    const res = await fetch("/api/admin/faq");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const openNew = () => { setForm({ question: "", answer: "", category: "general", sortOrder: "0", isActive: true }); setEditingId(null); setShowForm(true); };
  const openEdit = (item: FaqItem) => { setForm({ question: item.question, answer: item.answer, category: item.category, sortOrder: String(item.sortOrder), isActive: item.isActive }); setEditingId(item.id); setShowForm(true); };

  const save = async () => {
    setSaving(true); setMsg("");
    const url = editingId ? `/api/admin/faq/${editingId}` : "/api/admin/faq";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }) });
    const data = await res.json();
    if (res.ok) { setMsg(editingId ? "تم التعديل" : "تمت الإضافة"); setShowForm(false); fetchItems(); }
    else setMsg(data.message ?? "حدث خطأ");
    setSaving(false);
  };

  const deleteItem = async (id: string) => {
    if (!confirm("هل تريد حذف هذا السؤال؟")) return;
    await fetch(`/api/admin/faq/${id}`, { method: "DELETE" });
    fetchItems();
  };

  const toggleActive = async (item: FaqItem) => {
    await fetch(`/api/admin/faq/${item.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...item, isActive: !item.isActive }) });
    fetchItems();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">الأسئلة الشائعة</h1>
          <p className="text-slate-400 mt-1">{items.length} سؤال</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ سؤال جديد</button>
      </div>

      {msg && <div className="mb-4 p-3 bg-violet-900/30 border border-violet-500 rounded-xl text-violet-300 text-sm">{msg}</div>}

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">{editingId ? "تعديل السؤال" : "سؤال جديد"}</h2>
          <div className="space-y-4">
            <div><label className="text-slate-300 text-sm mb-1 block">السؤال *</label><input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} /></div>
            <div><label className="text-slate-300 text-sm mb-1 block">الإجابة *</label><textarea className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm h-28 resize-none" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="text-slate-300 text-sm mb-1 block">الفئة</label><input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="general" dir="ltr" /></div>
              <div><label className="text-slate-300 text-sm mb-1 block">الترتيب</label><input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
              <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-violet-600" /><span className="text-slate-300 text-sm">مفعّل</span></label></div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "جاري الحفظ..." : "حفظ"}</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{item.question}</p>
                  <p className="text-slate-400 text-xs mt-1 line-clamp-2">{item.answer}</p>
                  <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full mt-2 inline-block">{item.category}</span>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(item)} className={`text-xs px-2 py-1 rounded-full font-bold ${item.isActive ? "bg-emerald-900/30 text-emerald-400" : "bg-slate-700 text-slate-500"}`}>
                    {item.isActive ? "مفعّل" : "معطّل"}
                  </button>
                  <button onClick={() => openEdit(item)} className="text-violet-400 text-xs font-semibold">تعديل</button>
                  <button onClick={() => deleteItem(item.id)} className="text-red-400 text-xs font-semibold">حذف</button>
                </div>
              </div>
            </div>
          ))}
          {items.length === 0 && <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-2xl">لا توجد أسئلة</div>}
        </div>
      )}
    </div>
  );
}
