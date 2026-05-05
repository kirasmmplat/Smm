"use client";

import { useEffect, useState } from "react";

interface PaymentMethod {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  instructions: string | null;
  isActive: boolean;
  isAutomatic: boolean;
  minAmount: number;
  maxAmount: number | null;
  bonusPercent: number;
  icon: string | null;
  sortOrder: number;
}

const typeColors: Record<string, string> = {
  MANUAL: "bg-amber-100 text-amber-700",
  AUTO: "bg-emerald-100 text-emerald-700",
  CRYPTO: "bg-blue-100 text-blue-700",
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", type: "MANUAL", description: "", instructions: "", isActive: true, isAutomatic: false, minAmount: "5", maxAmount: "", bonusPercent: "0", icon: "", sortOrder: "0" });
  const [msg, setMsg] = useState("");

  const fetchMethods = async () => {
    const res = await fetch("/api/admin/payment-methods");
    const data = await res.json();
    setMethods(data.methods ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchMethods(); }, []);

  const openNew = () => {
    setForm({ name: "", slug: "", type: "MANUAL", description: "", instructions: "", isActive: true, isAutomatic: false, minAmount: "5", maxAmount: "", bonusPercent: "0", icon: "", sortOrder: "0" });
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (m: PaymentMethod) => {
    setForm({ name: m.name, slug: m.slug, type: m.type, description: m.description ?? "", instructions: m.instructions ?? "", isActive: m.isActive, isAutomatic: m.isAutomatic, minAmount: String(m.minAmount), maxAmount: m.maxAmount ? String(m.maxAmount) : "", bonusPercent: String(m.bonusPercent), icon: m.icon ?? "", sortOrder: String(m.sortOrder) });
    setEditingId(m.id);
    setShowForm(true);
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    const url = editingId ? `/api/admin/payment-methods/${editingId}` : "/api/admin/payment-methods";
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, minAmount: Number(form.minAmount), maxAmount: form.maxAmount ? Number(form.maxAmount) : null, bonusPercent: Number(form.bonusPercent), sortOrder: Number(form.sortOrder) }) });
    const data = await res.json();
    if (res.ok) { setMsg(editingId ? "تم التعديل" : "تمت الإضافة"); setShowForm(false); fetchMethods(); }
    else setMsg(data.message ?? "حدث خطأ");
    setSaving(false);
  };

  const toggleActive = async (m: PaymentMethod) => {
    await fetch(`/api/admin/payment-methods/${m.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...m, isActive: !m.isActive }) });
    fetchMethods();
  };

  const deleteMethod = async (id: string) => {
    if (!confirm("هل تريد حذف طريقة الدفع هذه؟")) return;
    await fetch(`/api/admin/payment-methods/${id}`, { method: "DELETE" });
    fetchMethods();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">طرق الدفع</h1>
          <p className="text-slate-400 mt-1">إدارة طرق الدفع المتاحة للمستخدمين</p>
        </div>
        <button onClick={openNew} className="btn-primary">إضافة طريقة</button>
      </div>

      {msg && <div className="mb-4 p-3 bg-violet-900/30 border border-violet-500 rounded-xl text-violet-300 text-sm">{msg}</div>}

      {/* Form */}
      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold mb-4">{editingId ? "تعديل طريقة الدفع" : "إضافة طريقة دفع جديدة"}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-slate-300 text-sm mb-1 block">الاسم *</label><input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="فودافون كاش" /></div>
            <div><label className="text-slate-300 text-sm mb-1 block">المعرّف (slug) *</label><input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm font-mono" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="vodafone-cash" dir="ltr" /></div>
            <div><label className="text-slate-300 text-sm mb-1 block">النوع</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="MANUAL">يدوي</option><option value="AUTO">تلقائي</option><option value="CRYPTO">كريبتو</option>
              </select>
            </div>
            <div><label className="text-slate-300 text-sm mb-1 block">الأيقونة</label><input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} placeholder="card" /></div>
            <div><label className="text-slate-300 text-sm mb-1 block">الحد الأدنى ($)</label><input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.minAmount} onChange={(e) => setForm({ ...form, minAmount: e.target.value })} /></div>
            <div><label className="text-slate-300 text-sm mb-1 block">الحد الأقصى ($)</label><input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.maxAmount} onChange={(e) => setForm({ ...form, maxAmount: e.target.value })} placeholder="غير محدود" /></div>
            <div><label className="text-slate-300 text-sm mb-1 block">مكافأة الإيداع (%)</label><input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.bonusPercent} onChange={(e) => setForm({ ...form, bonusPercent: e.target.value })} /></div>
            <div><label className="text-slate-300 text-sm mb-1 block">الترتيب</label><input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-slate-300 text-sm mb-1 block">الوصف</label><input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="col-span-2"><label className="text-slate-300 text-sm mb-1 block">تعليمات الدفع</label><textarea className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm h-24 resize-none" value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} placeholder="اكتب تعليمات التحويل هنا..." /></div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-violet-600" /><span className="text-slate-300 text-sm">مفعّل</span></label>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={save} disabled={saving} className="btn-primary">{saving ? "جاري الحفظ..." : "حفظ"}</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700"><tr className="text-slate-400">{["الأيقونة", "الاسم", "النوع", "الحد الأدنى", "المكافأة", "الحالة", "إجراءات"].map((h) => <th key={h} className="text-right px-4 py-3 font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700">
              {methods.map((m) => (
                <tr key={m.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-xl">{m.icon ?? "card"}</td>
                  <td className="px-4 py-3 text-white font-semibold">{m.name}</td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${typeColors[m.type] ?? ""}`}>{m.type}</span></td>
                  <td className="px-4 py-3 text-slate-300" dir="ltr">${m.minAmount}</td>
                  <td className="px-4 py-3 text-slate-300">{m.bonusPercent > 0 ? <span className="text-emerald-400">+{m.bonusPercent}%</span> : "—"}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(m)} className={`text-xs font-bold px-2 py-1 rounded-full ${m.isActive ? "bg-emerald-900/30 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                      {m.isActive ? "مفعّل" : "معطّل"}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(m)} className="text-violet-400 hover:text-violet-300 text-xs font-semibold">تعديل</button>
                      <button onClick={() => deleteMethod(m.id)} className="text-red-400 hover:text-red-300 text-xs font-semibold">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {methods.length === 0 && <div className="text-center py-12 text-slate-500">لا توجد طرق دفع</div>}
        </div>
      )}
    </div>
  );
}
