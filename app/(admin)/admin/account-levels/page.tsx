"use client";

import { useEffect, useState } from "react";

interface Level {
  id: string;
  name: string;
  slug: string;
  minSpent: number;
  discountPercent: number;
  color: string;
  icon: string;
  benefits: string[];
  sortOrder: number;
}

export default function AccountLevelsPage() {
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({ name: "", slug: "", minSpent: "0", discountPercent: "0", color: "#7C3AED", icon: "⭐", benefits: "", sortOrder: "0" });

  const fetchLevels = async () => {
    const res = await fetch("/api/admin/account-levels");
    const data = await res.json();
    setLevels(data.levels ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchLevels(); }, []);

  const openNew = () => {
    setForm({ name: "", slug: "", minSpent: "0", discountPercent: "0", color: "#7C3AED", icon: "⭐", benefits: "", sortOrder: "0" });
    setEditingId(null); setShowForm(true);
  };

  const openEdit = (l: Level) => {
    setForm({ name: l.name, slug: l.slug, minSpent: String(l.minSpent), discountPercent: String(l.discountPercent), color: l.color, icon: l.icon, benefits: (l.benefits ?? []).join("\n"), sortOrder: String(l.sortOrder) });
    setEditingId(l.id); setShowForm(true);
  };

  const save = async () => {
    setSaving(true); setMsg("");
    const url = editingId ? `/api/admin/account-levels/${editingId}` : "/api/admin/account-levels";
    const method = editingId ? "PUT" : "POST";
    const benefitsArr = form.benefits.split("\n").map((b) => b.trim()).filter(Boolean);
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, minSpent: Number(form.minSpent), discountPercent: Number(form.discountPercent), sortOrder: Number(form.sortOrder), benefits: benefitsArr }) });
    const data = await res.json();
    if (res.ok) { setMsg(editingId ? "تم التعديل" : "تمت الإضافة"); setShowForm(false); fetchLevels(); }
    else setMsg(data.message ?? "حدث خطأ");
    setSaving(false);
  };

  const deleteLevel = async (id: string) => {
    if (!confirm("هل تريد حذف هذا المستوى؟")) return;
    const res = await fetch(`/api/admin/account-levels/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) { alert(data.message); return; }
    fetchLevels();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">مستويات الحسابات</h1>
          <p className="text-slate-400 mt-1">تحديد مستويات الولاء والخصومات التلقائية</p>
        </div>
        <button onClick={openNew} className="btn-primary">+ إضافة مستوى</button>
      </div>

      {msg && <div className="mb-4 p-3 bg-violet-900/30 border border-violet-500 rounded-xl text-violet-300 text-sm">{msg}</div>}

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">{editingId ? "تعديل المستوى" : "إضافة مستوى جديد"}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "الاسم *", key: "name", placeholder: "ذهبي" },
              { label: "المعرّف (slug)", key: "slug", placeholder: "gold", dir: "ltr" },
              { label: "الأيقونة", key: "icon", placeholder: "🥇" },
              { label: "اللون (hex)", key: "color", placeholder: "#d97706", dir: "ltr" },
              { label: "الحد الأدنى للإنفاق ($)", key: "minSpent", placeholder: "500" },
              { label: "نسبة الخصم (%)", key: "discountPercent", placeholder: "10" },
              { label: "الترتيب", key: "sortOrder", placeholder: "4" },
            ].map((f) => (
              <div key={f.key}>
                <label className="text-slate-300 text-sm mb-1 block">{f.label}</label>
                <input
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                  value={(form as Record<string, string>)[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  placeholder={f.placeholder}
                  dir={f.dir}
                />
              </div>
            ))}
            <div className="col-span-2">
              <label className="text-slate-300 text-sm mb-1 block">المزايا (سطر لكل ميزة)</label>
              <textarea className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm h-20 resize-none" value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} placeholder={"خصم 10%\nأولوية الدعم\nوصول مبكر للخدمات"} />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "جاري الحفظ..." : "حفظ"}</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {levels.map((l) => (
            <div key={l.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0" style={{ backgroundColor: l.color + "22", border: `2px solid ${l.color}` }}>
                  {l.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-white font-bold truncate">{l.name}</span>
                      <span className="text-xs text-slate-400 font-mono shrink-0">({l.slug})</span>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => openEdit(l)} className="text-violet-400 hover:text-violet-300 text-sm font-semibold">تعديل</button>
                      <button onClick={() => deleteLevel(l.id)} className="text-red-400 hover:text-red-300 text-sm font-semibold">حذف</button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-1 text-sm">
                    <span className="text-slate-400">الحد: <span className="text-white font-semibold" dir="ltr">${l.minSpent}</span></span>
                    <span className="text-slate-400">خصم: <span className="text-emerald-400 font-semibold">{l.discountPercent}%</span></span>
                  </div>
                  {Array.isArray(l.benefits) && l.benefits.length > 0 && (
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {l.benefits.map((b, i) => <span key={i} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{b}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {levels.length === 0 && <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-2xl">لا توجد مستويات</div>}
        </div>
      )}
    </div>
  );
}
