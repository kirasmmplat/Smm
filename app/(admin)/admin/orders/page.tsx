"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Download, ShoppingCart, ShieldCheck, CheckCircle2, Ban, Search } from "lucide-react";
import { downloadCsv } from "@/lib/export";

interface Order {
  id: string;
  status: string;
  quantity: number;
  charge: string;
  link: string;
  createdAt: string;
  user: { name: string; email: string };
  service: { name: string; serviceType: { category: { platform: { name: string; icon: string } } } };
}

const statusColors: Record<string, string> = {
  PENDING: "badge-pending",
  IN_PROGRESS: "badge-pending",
  PROCESSING: "badge-pending",
  COMPLETED: "badge-active",
  PARTIAL: "badge-inactive",
  CANCELED: "badge-danger",
  REFUNDED: "badge-danger",
  FAILED: "badge-danger",
};

const statusLabels: Record<string, string> = {
  PENDING: "انتظار",
  IN_PROGRESS: "جاري",
  PROCESSING: "يُعالج",
  COMPLETED: "مكتمل",
  PARTIAL: "جزئي",
  CANCELED: "ملغي",
  REFUNDED: "مُسترد",
  FAILED: "فشل",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("CANCELED");
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [exporting, setExporting] = useState(false);
  const LIMIT = 50;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json() as { orders?: Order[]; pagination?: { total?: number } };
    setOrders(data.orders ?? []);
    setTotal(data.pagination?.total ?? 0);
    setLoading(false);
    setSelected(new Set());
  }, [page, filterStatus, search]);

  useEffect(() => { void fetchOrders(); }, [fetchOrders]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length && orders.length > 0) setSelected(new Set());
    else setSelected(new Set(orders.map((o) => o.id)));
  };

  const applyBulkAction = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    setBulkMsg("");
    const res = await fetch("/api/admin/orders/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), status: bulkStatus }),
    });
    const data = await res.json() as { message?: string; updated?: number };
    setBulkMsg(data.message ?? `تم تحديث ${data.updated ?? 0} طلب`);
    setBulkLoading(false);
    void fetchOrders();
  };

  const pages = Math.ceil(total / LIMIT);
  const completedCount = orders.filter((o) => o.status === "COMPLETED").length;
  const activeCount = orders.filter((o) => ["PENDING", "IN_PROGRESS", "PROCESSING"].includes(o.status)).length;
  const closedCount = orders.filter((o) => ["CANCELED", "REFUNDED", "FAILED"].includes(o.status)).length;

  async function exportCsv() {
    setExporting(true);
    const params = new URLSearchParams({ page: "1", limit: "9999" });
    if (filterStatus) params.set("status", filterStatus);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/orders?${params}`);
    const data = await res.json() as { orders: Order[] };
    downloadCsv(
      (data.orders ?? []).map((o) => ({
        المستخدم: o.user.name,
        البريد: o.user.email,
        الخدمة: o.service.name,
        المنصة: o.service.serviceType.category.platform.name,
        الكمية: o.quantity,
        المبلغ: parseFloat(o.charge).toFixed(4),
        الحالة: statusLabels[o.status] ?? o.status,
        الرابط: o.link,
        التاريخ: new Date(o.createdAt).toLocaleDateString("ar"),
      })),
      "orders"
    );
    setExporting(false);
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">الطلبات</h1>
          <p className="text-slate-400 mt-1 text-sm">{total.toLocaleString()} طلب إجمالاً</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={exporting}
          className="btn-secondary text-sm flex items-center gap-2 px-4 py-2"
        >
          <Download size={14} />
          {exporting ? "جاري التصدير..." : "تصدير CSV"}
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "الطلبات الحالية", value: orders.length, icon: ShoppingCart, tone: "text-violet-300 bg-violet-500/10" },
          { label: "نشطة", value: activeCount, icon: ShieldCheck, tone: "text-amber-300 bg-amber-500/10" },
          { label: "مكتملة", value: completedCount, icon: CheckCircle2, tone: "text-emerald-300 bg-emerald-500/10" },
          { label: "مغلقة", value: closedCount, icon: Ban, tone: "text-red-300 bg-red-500/10" },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tone}`}>
              <item.icon size={18} />
            </div>
            <div>
              <div className="text-slate-400 text-xs">{item.label}</div>
              <div className="text-white font-black text-lg">{item.value.toLocaleString()}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث باسم المستخدم أو الرابط..."
            className="bg-slate-800 border border-slate-700 rounded-xl pr-9 pl-4 py-2 text-white text-sm w-full focus:border-violet-500 focus:outline-none transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">كل الحالات</option>
          {Object.entries(statusLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
      </div>

      {selected.size > 0 && (
        <div className="bg-violet-900/30 border border-violet-500 rounded-2xl p-4 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-violet-300 text-sm font-semibold">{selected.size} طلب محدد</span>
          <select
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-white text-sm"
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
          >
            <option value="CANCELED">إلغاء</option>
            <option value="COMPLETED">اكتمل</option>
            <option value="REFUNDED">استرداد</option>
            <option value="IN_PROGRESS">جاري التنفيذ</option>
          </select>
          <button
            onClick={applyBulkAction}
            disabled={bulkLoading}
            className="btn-primary text-sm px-4 py-1.5"
          >
            {bulkLoading ? "جاري التطبيق..." : "تطبيق"}
          </button>
          {bulkMsg && <span className="text-emerald-400 text-sm">{bulkMsg}</span>}
          <button onClick={() => setSelected(new Set())} className="text-slate-400 text-sm hover:text-white mr-auto">
            إلغاء التحديد
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr className="text-slate-400">
                  <th className="px-4 py-3 text-right w-10">
                    <input
                      type="checkbox"
                      checked={selected.size === orders.length && orders.length > 0}
                      onChange={toggleAll}
                      className="accent-violet-600 w-4 h-4"
                    />
                  </th>
                  {["المستخدم", "الخدمة", "الكمية", "المبلغ", "الحالة", "التاريخ", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {orders.map((o) => (
                  <tr key={o.id} className={`hover:bg-slate-700/50 ${selected.has(o.id) ? "bg-violet-900/20" : ""}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="accent-violet-600 w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white text-sm font-medium">{o.user.name}</div>
                      <div className="text-slate-500 text-xs">{o.user.email}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-slate-200 text-sm line-clamp-1">{o.service.name}</div>
                      <div className="text-slate-500 text-xs">
                        {o.service.serviceType.category.platform.icon} {o.service.serviceType.category.platform.name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{o.quantity.toLocaleString()}</td>
                    <td className="px-4 py-3 text-emerald-400 font-medium" dir="ltr">${parseFloat(o.charge).toFixed(4)}</td>
                    <td className="px-4 py-3">
                      <span className={statusColors[o.status] ?? "badge-inactive"}>{statusLabels[o.status] ?? o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${o.id}`} className="text-violet-400 hover:text-violet-300 text-xs font-semibold">
                        تفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {orders.length === 0 && (
              <div className="text-center py-16 text-slate-500">لا توجد طلبات</div>
            )}
          </div>

          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <div key={o.id} className={`bg-slate-800 border rounded-2xl p-4 ${selected.has(o.id) ? "border-violet-500" : "border-slate-700"}`}>
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleSelect(o.id)} className="accent-violet-600 w-4 h-4 mt-1" />
                  <div className="flex-1">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-sm font-medium text-white line-clamp-1">{o.service.name}</div>
                      <span className={statusColors[o.status] ?? "badge-inactive"}>{statusLabels[o.status] ?? o.status}</span>
                    </div>
                    <div className="text-slate-500 text-xs mt-1">
                      {o.user.name} · {o.quantity.toLocaleString()} · <span className="text-emerald-400" dir="ltr">${parseFloat(o.charge).toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-slate-500 text-xs">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</span>
                      <Link href={`/admin/orders/${o.id}`} className="text-violet-400 text-xs">تفاصيل</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {orders.length === 0 && <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-2xl">لا توجد طلبات</div>}
          </div>

          {pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">←</button>
              <span className="text-slate-400 text-sm">صفحة {page} من {pages}</span>
              <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">→</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}