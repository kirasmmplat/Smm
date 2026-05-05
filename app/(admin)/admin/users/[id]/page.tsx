"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CalendarDays, CreditCard, ShoppingCart, Ticket, UserRound } from "lucide-react";

type User = {
  id: string; name: string; email: string; username: string; role: string; status: string;
  balance: string; totalSpent: string; discountPercent: number; apiKey: string | null;
  emailNotifications: boolean; createdAt: string; lastLoginAt: string | null;
  accountLevel: { name: string; color: string } | null;
  _count: { orders: number; tickets: number; transactions: number };
  orders: Array<{ id: string; status: string; charge: string; quantity: number; createdAt: string; service: { name: string } }>;
  transactions: Array<{ id: string; type: string; amount: string; status: string; createdAt: string; notes: string | null }>;
};

const txTypeMap: Record<string, string> = {
  DEPOSIT: "إيداع", WITHDRAWAL: "سحب", ORDER_CHARGE: "طلب", REFUND: "استرداد",
  BONUS: "مكافأة", REFERRAL_EARNING: "إحالة", ADMIN_ADJUST: "تعديل أدمن",
};
const statusMap: Record<string, string> = {
  PENDING: "انتظار", IN_PROGRESS: "جاري", COMPLETED: "مكتمل",
  PARTIAL: "جزئي", CANCELED: "ملغي", REFUNDED: "مُسترد", FAILED: "فشل",
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<"edit" | "balance" | "orders" | "transactions">("edit");
  const [editForm, setEditForm] = useState({ role: "USER", status: "ACTIVE", discountPercent: "0" });
  const [balForm, setBalForm] = useState({ amount: "", type: "ADD" as "ADD" | "DEDUCT" | "SET", notes: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/users/${id}`);
    const data = await res.json() as User;
    setUser(data);
    setEditForm({ role: data.role, status: data.status, discountPercent: String(data.discountPercent) });
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const saveEdit = async () => {
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: editForm.role, status: editForm.status, discountPercent: Number(editForm.discountPercent) }),
    });
    const data = await res.json();
    setMsg(res.ok ? "تم التحديث بنجاح" : (data.message ?? "حدث خطأ"));
    if (res.ok) void load();
    setSaving(false);
  };

  const adjustBalance = async () => {
    if (!balForm.amount) { setMsg("أدخل المبلغ"); return; }
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/users/${id}/adjust-balance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(balForm.amount), type: balForm.type, notes: balForm.notes }),
    });
    const data = await res.json();
    setMsg(res.ok ? `تم — الرصيد الجديد: $${Number(data.newBalance).toFixed(2)}` : (data.message ?? "حدث خطأ"));
    if (res.ok) { void load(); setBalForm({ amount: "", type: "ADD", notes: "" }); }
    setSaving(false);
  };

  if (!user) return (
    <div className="p-6 space-y-4">
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}
    </div>
  );

  const balance = parseFloat(user.balance).toFixed(2);
  const spent = parseFloat(user.totalSpent).toFixed(2);
  const availableAfterSet = balForm.amount
    ? balForm.type === "SET"
      ? Number(balForm.amount).toFixed(2)
      : balForm.type === "ADD"
        ? (parseFloat(user.balance) + Number(balForm.amount)).toFixed(2)
        : Math.max(0, parseFloat(user.balance) - Number(balForm.amount)).toFixed(2)
    : null;

  return (
    <div className="p-4 md:p-6 max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/users" className="text-slate-400 hover:text-white w-10 h-10 rounded-xl border border-slate-700 flex items-center justify-center bg-slate-800">
          <ArrowRight size={18} />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-black text-white">{user.name}</h1>
            {user.accountLevel && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: user.accountLevel.color + "33", color: user.accountLevel.color }}>
                {user.accountLevel.name}
              </span>
            )}
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${user.status === "ACTIVE" ? "bg-emerald-900/30 text-emerald-400" : "bg-red-900/30 text-red-400"}`}>
              {user.status === "ACTIVE" ? "نشط" : user.status === "BANNED" ? "محظور" : "موقوف"}
            </span>
          </div>
          <p className="text-slate-400 text-sm">{user.email} · @{user.username}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "الرصيد", value: `$${balance}`, color: "text-emerald-400", icon: BadgeDollarSign },
          { label: "إجمالي الإنفاق", value: `$${spent}`, color: "text-violet-400", icon: CreditCard },
          { label: "الطلبات", value: user._count.orders, color: "text-indigo-400", icon: ShoppingCart },
          { label: "التذاكر", value: user._count.tickets, color: "text-amber-400", icon: Ticket },
        ].map((s) => (
          <div key={s.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mb-1">
              <s.icon size={14} />
              {s.label}
            </div>
            <div className={`text-xl font-black ${s.color}`} dir="ltr">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-slate-800 border border-slate-700 rounded-2xl p-1 mb-4 flex-wrap">
        {[
          { key: "edit", label: "تعديل الحساب" },
          { key: "balance", label: "تعديل الرصيد" },
          { key: "orders", label: `الطلبات (${user._count.orders})` },
          { key: "transactions", label: `المعاملات (${user._count.transactions})` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as typeof tab); setMsg(""); }}
            className={`flex-1 text-sm font-semibold px-3 py-2 rounded-xl transition ${tab === t.key ? "bg-violet-600 text-white" : "text-slate-400 hover:text-white"}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${msg.startsWith("تم") ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-300" : "bg-red-900/30 border-red-500/30 text-red-300"}`}>
          {msg}
        </div>
      )}

      {tab === "edit" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
          <h2 className="text-white font-bold">بيانات الحساب</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 text-sm mb-1 block">الدور</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                <option value="USER">مستخدم</option>
                <option value="ADMIN">أدمن</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">الحالة</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}>
                <option value="ACTIVE">نشط</option>
                <option value="SUSPENDED">موقوف</option>
                <option value="BANNED">محظور</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">نسبة الخصم (%)</label>
              <input type="number" min="0" max="100" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={editForm.discountPercent} onChange={(e) => setEditForm({ ...editForm, discountPercent: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-400">
            <div>آخر تسجيل دخول: <span className="text-slate-200">{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString("ar-SA") : "—"}</span></div>
            <div>تاريخ التسجيل: <span className="text-slate-200">{new Date(user.createdAt).toLocaleDateString("ar-SA")}</span></div>
          </div>
          {user.apiKey && <div className="text-sm text-slate-400">مفتاح API: <code className="font-mono text-violet-400 text-xs">{user.apiKey.slice(0, 20)}...</code></div>}
          <button onClick={saveEdit} disabled={saving} className="btn-primary">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      )}

      {tab === "balance" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white font-bold">تعديل الرصيد</h2>
            <div className="text-2xl font-black text-emerald-400" dir="ltr">${balance}</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-slate-300 text-sm mb-1 block">نوع العملية</label>
              <select className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={balForm.type} onChange={(e) => setBalForm({ ...balForm, type: e.target.value as "ADD" | "DEDUCT" | "SET" })}>
                <option value="ADD">إضافة رصيد</option>
                <option value="DEDUCT">خصم رصيد</option>
                <option value="SET">تحديد الرصيد</option>
              </select>
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">المبلغ ($)</label>
              <input type="number" step="0.01" min="0" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={balForm.amount} onChange={(e) => setBalForm({ ...balForm, amount: e.target.value })} placeholder="0.00" dir="ltr" />
            </div>
            <div>
              <label className="text-slate-300 text-sm mb-1 block">السبب (اختياري)</label>
              <input type="text" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2 text-white text-sm" value={balForm.notes} onChange={(e) => setBalForm({ ...balForm, notes: e.target.value })} placeholder="تعديل يدوي..." />
            </div>
          </div>
          {availableAfterSet && (
            <div className="bg-slate-700/50 rounded-xl p-3 text-sm text-slate-300">
              سيصبح الرصيد:{" "}
              <span className="text-white font-bold" dir="ltr">${availableAfterSet}</span>
            </div>
          )}
          <button onClick={adjustBalance} disabled={saving} className="btn-primary">
            {saving ? "جاري التطبيق..." : "تطبيق التعديل"}
          </button>
        </div>
      )}

      {tab === "orders" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700"><tr className="text-slate-400">{["الخدمة", "الكمية", "المبلغ", "الحالة", "التاريخ"].map((h) => <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700">
              {user.orders.map((o) => (
                <tr key={o.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-slate-200 text-sm max-w-xs line-clamp-1">{o.service.name}</td>
                  <td className="px-4 py-3 text-slate-300">{o.quantity.toLocaleString()}</td>
                  <td className="px-4 py-3 text-emerald-400 font-mono text-sm" dir="ltr">${parseFloat(o.charge).toFixed(4)}</td>
                  <td className="px-4 py-3"><span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{statusMap[o.status] ?? o.status}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</td>
                </tr>
              ))}
              {user.orders.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-500">لا توجد طلبات</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {tab === "transactions" && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700"><tr className="text-slate-400">{["النوع", "المبلغ", "الحالة", "الملاحظة", "التاريخ"].map((h) => <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-slate-700">
              {user.transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3 text-slate-200">{txTypeMap[t.type] ?? t.type}</td>
                  <td className={`px-4 py-3 font-mono font-bold text-sm ${t.type === "ORDER_CHARGE" || t.type === "WITHDRAWAL" ? "text-red-400" : "text-emerald-400"}`} dir="ltr">
                    {t.type === "ORDER_CHARGE" || t.type === "WITHDRAWAL" ? "-" : "+"}${parseFloat(t.amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "COMPLETED" ? "bg-emerald-900/30 text-emerald-400" : "bg-amber-900/30 text-amber-400"}`}>{t.status === "COMPLETED" ? "مكتمل" : "انتظار"}</span></td>
                  <td className="px-4 py-3 text-slate-500 text-xs">{t.notes ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{new Date(t.createdAt).toLocaleDateString("ar-SA")}</td>
                </tr>
              ))}
              {user.transactions.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-slate-500">لا توجد معاملات</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
