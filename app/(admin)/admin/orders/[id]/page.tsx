"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, BadgeDollarSign, CalendarDays, Link2, Package, Store, UserRound } from "lucide-react";

type Order = {
  id: string; link: string; quantity: number; charge: string; status: string;
  startCount: number | null; remains: number | null; providerOrderId: string | null;
  createdAt: string; updatedAt: string;
  user: { id: string; name: string; email: string; balance: string };
  service: {
    name: string; providerServiceId: string;
    provider: { name: string; url: string };
    serviceType: { name: string; category: { name: string; platform: { name: string; icon?: string } } };
  };
};

const STATUS_OPTIONS = ["PENDING","IN_PROGRESS","PROCESSING","COMPLETED","PARTIAL","CANCELED","REFUNDED","FAILED"];
const statusLabels: Record<string, string> = {
  PENDING:"انتظار",IN_PROGRESS:"جاري",PROCESSING:"يُعالج",
  COMPLETED:"مكتمل",PARTIAL:"جزئي",CANCELED:"ملغي",REFUNDED:"مُسترد",FAILED:"فشل",
};
const statusColors: Record<string, string> = {
  PENDING:"badge-pending",IN_PROGRESS:"badge-pending",PROCESSING:"badge-pending",
  COMPLETED:"badge-active",PARTIAL:"badge-inactive",
  CANCELED:"badge-danger",REFUNDED:"badge-danger",FAILED:"badge-danger",
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState("");
  const [remains, setRemains] = useState("");
  const [startCount, setStartCount] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/orders/${id}`);
    if (!res.ok) return;
    const data = await res.json() as Order;
    setOrder(data);
    setStatus(data.status);
    setRemains(data.remains?.toString() ?? "");
    setStartCount(data.startCount?.toString() ?? "");
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function onSave() {
    setSaving(true); setMsg("");
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status,
        remains: remains ? parseInt(remains) : undefined,
        startCount: startCount ? parseInt(startCount) : undefined,
      }),
    });
    if (res.ok) { setMsg("تم الحفظ بنجاح"); void load(); }
    else { const d = await res.json() as { message: string }; setMsg(d.message); }
    setSaving(false);
  }

  if (!order) return (
    <div className="p-6 space-y-3">
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}
    </div>
  );

  const amount = parseFloat(order.charge).toFixed(4);
  const balance = parseFloat(order.user.balance).toFixed(2);

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/orders" className="text-slate-400 hover:text-white w-10 h-10 rounded-xl border border-slate-700 flex items-center justify-center bg-slate-800">
          <ArrowRight size={18} />
        </Link>
        <div>
          <h1 className="text-xl font-black text-white">تفاصيل الطلب</h1>
          <p className="text-slate-400 text-sm" dir="ltr">#{order.id.slice(-12)}</p>
        </div>
        <span className={`mr-auto ${statusColors[order.status] ?? "badge-inactive"}`}>{statusLabels[order.status] ?? order.status}</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "الكمية", value: order.quantity.toLocaleString(), icon: Package },
          { label: "المبلغ", value: `$${amount}`, icon: BadgeDollarSign },
          { label: "الرصيد", value: `$${balance}`, icon: UserRound },
          { label: "التاريخ", value: new Date(order.createdAt).toLocaleDateString("ar-SA"), icon: CalendarDays },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
              <item.icon size={14} />
              {item.label}
            </div>
            <div className="text-white font-black text-sm break-all">{item.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-slate-400 text-xs font-bold uppercase mb-3">معلومات الطلب</h2>
          <div className="space-y-2.5 text-sm">
            {[
              { label: "الخدمة", value: order.service.name, cls: "text-white text-sm" },
              { label: "المنصة", value: `${order.service.serviceType.category.platform.icon ?? ""} ${order.service.serviceType.category.platform.name}`, cls: "text-slate-300" },
              { label: "المزود", value: order.service.provider.name, cls: "text-slate-300" },
              { label: "نوع الخدمة", value: order.service.serviceType.category.name, cls: "text-slate-300" },
              { label: "الكمية", value: order.quantity.toLocaleString(), cls: "text-slate-200" },
              { label: "المبلغ", value: `$${amount}`, cls: "text-emerald-400 font-bold" },
              { label: "البداية", value: order.startCount?.toLocaleString() ?? "—", cls: "text-slate-300" },
              { label: "المتبقي", value: order.remains?.toLocaleString() ?? "—", cls: "text-slate-300" },
              { label: "ID المزود", value: order.providerOrderId ?? "—", cls: "text-slate-400 text-xs" },
              { label: "التاريخ", value: new Date(order.createdAt).toLocaleString("ar-SA"), cls: "text-slate-400 text-xs" },
            ].map((r) => (
              <div key={r.label} className="flex justify-between items-start gap-2">
                <span className="text-slate-500 shrink-0">{r.label}</span>
                <span className={`text-left break-all ${r.cls}`} dir={r.label === "المبلغ" || r.label === "ID المزود" ? "ltr" : "rtl"}>{r.value}</span>
              </div>
            ))}
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 shrink-0">الرابط</span>
              <a href={order.link} target="_blank" rel="noreferrer" className="text-violet-400 hover:underline text-xs truncate max-w-[180px] inline-flex items-center gap-1" dir="ltr">
                <Link2 size={12} />
                {order.link}
              </a>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h2 className="text-slate-400 text-xs font-bold uppercase mb-3">المستخدم</h2>
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">الاسم</span><span className="text-white">{order.user.name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">الإيميل</span><span className="text-slate-300 text-xs" dir="ltr">{order.user.email}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">الرصيد الحالي</span><span className="text-emerald-400 font-bold" dir="ltr">${balance}</span></div>
            <Link href={`/admin/users/${order.user.id}`} className="block mt-3 text-center text-violet-400 hover:text-violet-300 text-sm border border-violet-500/30 rounded-xl py-2 hover:bg-violet-900/20 transition">
              عرض ملف المستخدم
            </Link>
          </div>
        </div>
      </div>

      {/* Update Form */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 space-y-4">
        <h2 className="text-white font-bold">تحديث الطلب</h2>
        <div>
          <label className="text-slate-300 text-sm mb-1.5 block">الحالة الجديدة</label>
          <select className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{statusLabels[s] ?? s}</option>)}
          </select>
          {(status === "CANCELED" || status === "REFUNDED") && order.status !== "CANCELED" && order.status !== "REFUNDED" && (
            <p className="text-amber-400 text-xs mt-1">سيتم استرداد ${amount} للمستخدم تلقائياً</p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-slate-300 text-sm mb-1.5 block">Start Count</label>
            <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" value={startCount} onChange={(e) => setStartCount(e.target.value)} type="number" min="0" dir="ltr" />
          </div>
          <div>
            <label className="text-slate-300 text-sm mb-1.5 block">Remains</label>
            <input className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" value={remains} onChange={(e) => setRemains(e.target.value)} type="number" min="0" dir="ltr" />
          </div>
        </div>
        {msg && (
          <div className={`px-4 py-3 rounded-xl text-sm border ${msg.startsWith("تم") ? "bg-emerald-900/30 border-emerald-500/30 text-emerald-300" : "bg-red-900/30 border-red-500/30 text-red-300"}`}>
            {msg}
          </div>
        )}
        <button onClick={onSave} disabled={saving} className="btn-primary w-full py-3 text-base">
          {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </button>
      </div>
    </div>
  );
}
