"use client";

import { useEffect, useState } from "react";
import { Tag, Plus, Edit2, Trash2, CheckCircle, XCircle, RefreshCw } from "lucide-react";

interface Coupon {
  id: string; code: string; description: string | null; type: string;
  value: string; minOrderAmount: string | null; maxDiscount: string | null;
  usageLimit: number | null; usedCount: number; perUserLimit: number;
  isActive: boolean; startsAt: string | null; expiresAt: string | null;
  createdAt: string; _count: { usages: number };
}

const empty = {
  code: "", description: "", type: "PERCENT", value: "10",
  minOrderAmount: "", maxDiscount: "", usageLimit: "", perUserLimit: "1",
  isActive: true, startsAt: "", expiresAt: "",
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    const r = await fetch("/api/admin/coupons");
    const d = await r.json() as { coupons: Coupon[] };
    setCoupons(d.coupons ?? []);
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const openNew = () => { setForm(empty); setEditId(null); setShowForm(true); setMsg(null); };
  const openEdit = (c: Coupon) => {
    setForm({
      code: c.code, description: c.description ?? "", type: c.type,
      value: c.value, minOrderAmount: c.minOrderAmount ?? "", maxDiscount: c.maxDiscount ?? "",
      usageLimit: c.usageLimit ? String(c.usageLimit) : "", perUserLimit: String(c.perUserLimit),
      isActive: c.isActive,
      startsAt: c.startsAt ? c.startsAt.slice(0, 16) : "",
      expiresAt: c.expiresAt ? c.expiresAt.slice(0, 16) : "",
    });
    setEditId(c.id); setShowForm(true); setMsg(null);
  };

  const save = async () => {
    if (!form.code || !form.value) { setMsg({ text: "الكود والقيمة مطلوبان", ok: false }); return; }
    setSaving(true);
    const url = editId ? `/api/admin/coupons/${editId}` : "/api/admin/coupons";
    const res = await fetch(url, {
      method: editId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        value: parseFloat(form.value),
        minOrderAmount: form.minOrderAmount ? parseFloat(form.minOrderAmount) : null,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit) : null,
        perUserLimit: parseInt(form.perUserLimit),
        startsAt: form.startsAt || null,
        expiresAt: form.expiresAt || null,
      }),
    });
    const d = await res.json() as { message?: string };
    if (res.ok) { setMsg({ text: editId ? "تم التعديل بنجاح" : "تم الإنشاء بنجاح", ok: true }); setShowForm(false); void load(); }
    else setMsg({ text: d.message ?? "حدث خطأ", ok: false });
    setSaving(false);
  };

  const del = async (id: string, code: string) => {
    if (!confirm(`حذف الكوبون "${code}"؟`)) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    void load();
  };

  const toggle = async (c: Coupon) => {
    await fetch(`/api/admin/coupons/${c.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...c, isActive: !c.isActive }),
    });
    void load();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Tag size={22} className="text-violet-400" /> كوبونات الخصم
          </h1>
          <p className="text-slate-400 mt-1 text-sm">إدارة رموز الخصم وعروض المستخدمين</p>
        </div>
        <button onClick={openNew} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> إضافة كوبون
        </button>
      </div>

      {msg && (
        <div className={`mb-4 p-3 rounded-xl text-sm font-semibold flex items-center gap-2 ${msg.ok ? "bg-emerald-900/30 border border-emerald-500 text-emerald-300" : "bg-red-900/30 border border-red-500 text-red-300"}`}>
          {msg.ok ? <CheckCircle size={15} /> : <XCircle size={15} />}{msg.text}
        </div>
      )}

      {showForm && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-white font-bold mb-5">{editId ? "تعديل الكوبون" : "إضافة كوبون جديد"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-slate-300 text-sm mb-1 block">كود الخصم *</label>
              <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm font-mono uppercase"
                placeholder="SUMMER20" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">الوصف</label>
              <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                placeholder="خصم صيفي" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">نوع الخصم</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="PERCENT">نسبة مئوية (%)</option>
                <option value="FIXED">مبلغ ثابت ($)</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">
                قيمة الخصم * {form.type === "PERCENT" ? "(%" : "($)"}
              </label>
              <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                placeholder={form.type === "PERCENT" ? "10" : "5"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">الحد الأدنى للطلب ($)</label>
              <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                placeholder="1.00" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">أقصى خصم ($)</label>
              <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                placeholder="50.00" value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">حد الاستخدام الكلي</label>
              <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                placeholder="غير محدود" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">حد الاستخدام لكل مستخدم</label>
              <input type="number" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">تاريخ البداية</label>
              <input type="datetime-local" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                value={form.startsAt} onChange={(e) => setForm({ ...form, startsAt: e.target.value })} dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">تاريخ الانتهاء</label>
              <input type="datetime-local" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm"
                value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} dir="ltr" />
            </div>
            <div className="flex items-center gap-3 md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4 accent-violet-600" />
                <span className="text-slate-300 text-sm">مفعّل</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={() => void save()} disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? <RefreshCw size={14} className="animate-spin" /> : null}{saving ? "جاري الحفظ..." : "حفظ"}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">إلغاء</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-16 bg-slate-800 rounded-2xl border border-slate-700">
          <Tag size={36} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">لا توجد كوبونات بعد</p>
        </div>
      ) : (
        <>
        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {coupons.map((c) => {
            const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
            return (
              <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono font-bold text-violet-300 bg-violet-900/30 px-2 py-0.5 rounded-lg text-sm">{c.code}</span>
                    {c.description && <div className="text-slate-500 text-xs mt-1">{c.description}</div>}
                  </div>
                  <button onClick={() => void toggle(c)} className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${c.isActive && !expired ? "bg-emerald-900/30 text-emerald-400" : "bg-slate-700 text-slate-400"}`}>
                    {c.isActive && !expired ? "مفعّل" : "معطّل"}
                  </button>
                </div>
                <div className="flex items-center gap-3 text-xs mb-3">
                  <span className={`font-bold px-2 py-0.5 rounded-full ${c.type === "PERCENT" ? "bg-blue-900/30 text-blue-300" : "bg-emerald-900/30 text-emerald-300"}`}>
                    {c.type === "PERCENT" ? "نسبة" : "ثابت"}
                  </span>
                  <span className="text-white font-bold" dir="ltr">{c.type === "PERCENT" ? `${c.value}%` : `$${c.value}`}</span>
                  <span className="text-slate-400">{c._count.usages}{c.usageLimit ? `/${c.usageLimit}` : ""} استخدام</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${expired ? "text-red-400" : "text-slate-400"}`}>
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("ar-SA") : "دائم"}
                  </span>
                  <div className="flex gap-3">
                    <button onClick={() => openEdit(c)} className="text-violet-400 text-xs flex items-center gap-1"><Edit2 size={12} /> تعديل</button>
                    <button onClick={() => void del(c.id, c.code)} className="text-red-400 text-xs flex items-center gap-1"><Trash2 size={12} /> حذف</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700">
              <tr className="text-slate-400">
                {["الكود", "النوع", "القيمة", "الاستخدامات", "الحد الأدنى", "الانتهاء", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {coupons.map((c) => {
                const expired = c.expiresAt && new Date(c.expiresAt) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono font-bold text-violet-300 bg-violet-900/30 px-2 py-0.5 rounded-lg text-xs">{c.code}</span>
                      {c.description && <div className="text-slate-500 text-xs mt-0.5">{c.description}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.type === "PERCENT" ? "bg-blue-900/30 text-blue-300" : "bg-emerald-900/30 text-emerald-300"}`}>
                        {c.type === "PERCENT" ? "نسبة" : "ثابت"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white font-bold" dir="ltr">
                      {c.type === "PERCENT" ? `${c.value}%` : `$${c.value}`}
                    </td>
                    <td className="px-4 py-3 text-slate-300">
                      {c._count.usages}{c.usageLimit ? `/${c.usageLimit}` : ""}
                    </td>
                    <td className="px-4 py-3 text-slate-400" dir="ltr">
                      {c.minOrderAmount ? `$${c.minOrderAmount}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {c.expiresAt ? (
                        <span className={expired ? "text-red-400" : "text-emerald-400"}>
                          {new Date(c.expiresAt).toLocaleDateString("ar-SA")}
                        </span>
                      ) : "دائم"}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => void toggle(c)} className={`text-xs font-bold px-2 py-1 rounded-full transition-colors ${c.isActive && !expired ? "bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50" : "bg-slate-700 text-slate-400"}`}>
                        {c.isActive && !expired ? "مفعّل" : "معطّل"}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openEdit(c)} className="text-violet-400 hover:text-violet-300 transition-colors" title="تعديل">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => void del(c.id, c.code)} className="text-red-400 hover:text-red-300 transition-colors" title="حذف">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}
