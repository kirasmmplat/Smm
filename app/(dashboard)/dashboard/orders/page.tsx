"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Filter, Package, ChevronRight, ChevronLeft, FileText, RefreshCw } from "lucide-react";

interface Order {
  id: string;
  link: string;
  quantity: number;
  remains: number | null;
  charge: string;
  couponCode: string | null;
  couponDiscount: string | null;
  status: string;
  createdAt: string;
  service: {
    name: string;
    serviceType: { category: { platform: { name: string; icon: string } } };
  };
}

const statusLabels: Record<string, string> = {
  PENDING: "انتظار", IN_PROGRESS: "جاري", PROCESSING: "يُعالج",
  COMPLETED: "مكتمل", PARTIAL: "جزئي", CANCELED: "ملغي",
  REFUNDED: "مُسترد", FAILED: "فشل",
};
const statusColors: Record<string, string> = {
  PENDING: "badge-pending", IN_PROGRESS: "badge-pending", PROCESSING: "badge-pending",
  COMPLETED: "badge-active", PARTIAL: "badge-warning", CANCELED: "badge-danger",
  REFUNDED: "badge-danger", FAILED: "badge-danger",
};

const STATUS_OPTIONS = [
  { value: "ALL", label: "جميع الحالات" },
  { value: "PENDING", label: "انتظار" },
  { value: "IN_PROGRESS", label: "جاري" },
  { value: "PROCESSING", label: "يُعالج" },
  { value: "COMPLETED", label: "مكتمل" },
  { value: "PARTIAL", label: "جزئي" },
  { value: "CANCELED", label: "ملغي" },
  { value: "FAILED", label: "فشل" },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (status !== "ALL") params.set("status", status);
    if (search) params.set("search", search);
    const r = await fetch(`/api/orders?${params.toString()}`);
    const d = await r.json() as { orders: Order[]; total: number; totalPages: number };
    setOrders(d.orders ?? []);
    setTotal(d.total ?? 0);
    setTotalPages(d.totalPages ?? 1);
    setLoading(false);
  }, [page, status, search]);

  useEffect(() => { void load(); }, [load]);

  const applySearch = () => { setSearch(searchInput); setPage(1); };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">طلباتي</h1>
        <p className="text-gray-500 mt-1 text-sm">{total.toLocaleString("ar")} طلب إجمالاً</p>
      </div>

      {/* Filters */}
      <div className="card mb-4 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input-field pr-9 py-2.5 text-sm" placeholder="بحث برابط أو اسم خدمة..."
              value={searchInput} onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applySearch()} />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={15} className="text-gray-400 shrink-0" />
            <select className="input-field py-2.5 text-sm w-40" value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button onClick={applySearch} className="btn-primary px-5 py-2.5 text-sm flex items-center gap-2 shrink-0">
            <Search size={14} /> بحث
          </button>
          {(search || status !== "ALL") && (
            <button onClick={() => { setSearch(""); setSearchInput(""); setStatus("ALL"); setPage(1); }}
              className="btn-secondary px-4 py-2.5 text-sm shrink-0">
              مسح
            </button>
          )}
        </div>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          [...Array(5)].map((_, i) => <div key={i} className="card h-20 animate-pulse bg-gray-100" />)
        ) : orders.length === 0 ? (
          <div className="card text-center py-16">
            <Package size={36} className="text-violet-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">لا توجد طلبات</p>
            <Link href="/dashboard/new-order" className="text-violet-600 font-bold hover:underline text-sm mt-2 inline-block">أنشئ طلبك الأول →</Link>
          </div>
        ) : orders.map((o) => (
          <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="card block hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-2 gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2">{o.service.name}</div>
                <div className="text-xs text-gray-400 mt-0.5">{o.service.serviceType.category.platform.name}</div>
              </div>
              <span className={statusColors[o.status] ?? "badge-inactive"}>{statusLabels[o.status] ?? o.status}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex gap-3 text-gray-500">
                <span>الكمية: <span className="text-gray-800 font-medium">{o.quantity.toLocaleString("ar")}</span></span>
                <span>
                  <span className="text-emerald-600 font-semibold" dir="ltr">${parseFloat(o.charge).toFixed(4)}</span>
                  {o.couponCode && <span className="text-violet-500 mr-1">({o.couponCode})</span>}
                </span>
              </div>
              <span className="text-gray-400">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <div className="card hidden md:block">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(8)].map((_, i) => <div key={i} className="h-10 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>الخدمة</th>
                  <th>الرابط</th>
                  <th>الكمية</th>
                  <th>المتبقي</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                  <th>التاريخ</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o, i) => (
                  <tr key={o.id}>
                    <td className="text-gray-400 text-xs font-mono">{total - ((page - 1) * 20) - i}</td>
                    <td>
                      <div className="text-sm font-medium text-gray-800 line-clamp-1 max-w-xs">{o.service.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{o.service.serviceType.category.platform.name}</div>
                    </td>
                    <td>
                      <a href={o.link} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline text-xs truncate block max-w-[140px]" dir="ltr">
                        {o.link}
                      </a>
                    </td>
                    <td className="font-medium text-gray-700">{o.quantity.toLocaleString("ar")}</td>
                    <td className="text-gray-500">{o.remains !== null ? o.remains.toLocaleString("ar") : "—"}</td>
                    <td>
                      <span className="text-emerald-600 font-semibold" dir="ltr">${parseFloat(o.charge).toFixed(4)}</span>
                      {o.couponCode && (
                        <div className="text-xs text-violet-500 font-medium mt-0.5">{o.couponCode} -{parseFloat(o.couponDiscount ?? "0").toFixed(4)}</div>
                      )}
                    </td>
                    <td><span className={statusColors[o.status] ?? "badge-inactive"}>{statusLabels[o.status] ?? o.status}</span></td>
                    <td className="text-gray-400 text-xs">{new Date(o.createdAt).toLocaleDateString("ar-SA")}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Link href={`/dashboard/orders/${o.id}`} className="text-violet-600 hover:underline text-xs font-semibold">تفاصيل</Link>
                        <a href={`/api/orders/${o.id}/invoice`} target="_blank" rel="noreferrer"
                          className="text-gray-400 hover:text-violet-600 text-xs transition-colors flex items-center gap-0.5" title="فاتورة PDF">
                          <FileText size={12} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center py-16">
                      <Package size={36} className="text-violet-200 mx-auto mb-3" />
                      <p className="text-gray-500 font-medium">لا توجد طلبات</p>
                      <Link href="/dashboard/new-order" className="text-violet-600 font-bold hover:underline text-sm mt-2 inline-block">أنشئ طلبك الأول →</Link>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            صفحة {page} من {totalPages} — {total.toLocaleString("ar")} طلب
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
              className="btn-secondary p-2 disabled:opacity-40">
              <ChevronRight size={16} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
              return (
                <button key={p} onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${p === page ? "bg-violet-600 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-violet-300"}`}>
                  {p}
                </button>
              );
            })}
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="btn-secondary p-2 disabled:opacity-40">
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Refresh button */}
      <div className="mt-4 text-center">
        <button onClick={() => void load()} className="text-sm text-gray-400 hover:text-violet-600 flex items-center gap-1 mx-auto transition-colors">
          <RefreshCw size={13} /> تحديث القائمة
        </button>
      </div>
    </div>
  );
}
