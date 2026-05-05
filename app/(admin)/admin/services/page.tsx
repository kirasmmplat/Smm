"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Layers, ShoppingCart, CheckCircle2, Ban } from "lucide-react";

interface Service {
  id: string; name: string; status: string; ourRate: string; providerRate: string;
  min: number; max: number; providerServiceId: string;
  provider: { id: string; name: string };
  serviceType: { name: string; category: { name: string; platform: { name: string; icon: string } } };
  _count: { orders: number };
}

export default function ServicesAdminPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const LIMIT = 100;

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    const res = await fetch(`/api/admin/services?${params}`);
    const data = await res.json();
    setServices(data.services ?? []);
    setTotal(data.pagination?.total ?? 0);
    setLoading(false);
    setSelected(new Set());
  }, [page, search, filterStatus]);

  useEffect(() => { void fetchServices(); }, [fetchServices]);

  const toggleAll = () => setSelected(selected.size === services.length ? new Set() : new Set(services.map((s) => s.id)));
  const toggleOne = (id: string) => { const n = new Set(selected); n.has(id) ? n.delete(id) : n.add(id); setSelected(n); };

  const bulkToggleStatus = async (status: string) => {
    if (selected.size === 0) return;
    setBulkLoading(true); setBulkMsg("");
    const results = await Promise.all(
      Array.from(selected).map((id) =>
        fetch(`/api/admin/services/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        })
      )
    );
    const ok = results.filter((r) => r.ok).length;
    setBulkMsg(`تم تحديث ${ok} خدمة`);
    setBulkLoading(false);
    void fetchServices();
  };

  const pages = Math.ceil(total / LIMIT);
  const activeCount = services.filter((s) => s.status === "ACTIVE").length;
  const inactiveCount = services.filter((s) => s.status === "INACTIVE").length;
  const totalOrders = services.reduce((sum, s) => sum + s._count.orders, 0);
  const totalPages = Math.max(1, Math.ceil(total / LIMIT));

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">الخدمات</h1>
          <p className="text-slate-400 text-sm mt-1">{total.toLocaleString()} خدمة</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {[
          { label: "إجمالي النتائج", value: total, icon: Layers, tone: "text-violet-300 bg-violet-500/10" },
          { label: "نشطة", value: activeCount, icon: CheckCircle2, tone: "text-emerald-300 bg-emerald-500/10" },
          { label: "معطلة", value: inactiveCount, icon: Ban, tone: "text-red-300 bg-red-500/10" },
          { label: "طلبات مرتبطة", value: totalOrders, icon: ShoppingCart, tone: "text-cyan-300 bg-cyan-500/10" },
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

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="بحث بالاسم أو ID..."
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm flex-1 min-w-48"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
        <select
          className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 text-white text-sm"
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
        >
          <option value="">كل الحالات</option>
          <option value="ACTIVE">نشط</option>
          <option value="INACTIVE">معطل</option>
        </select>
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="bg-violet-900/30 border border-violet-500 rounded-2xl p-3 mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-violet-300 text-sm font-semibold">{selected.size} خدمة محددة</span>
          <button onClick={() => bulkToggleStatus("ACTIVE")} disabled={bulkLoading} className="btn-primary text-xs px-3 py-1.5">تفعيل الكل</button>
          <button onClick={() => bulkToggleStatus("INACTIVE")} disabled={bulkLoading} className="btn-secondary text-xs px-3 py-1.5">تعطيل الكل</button>
          {bulkMsg && <span className="text-emerald-400 text-sm">{bulkMsg}</span>}
          <button onClick={() => setSelected(new Set())} className="text-slate-400 text-sm hover:text-white mr-auto">إلغاء</button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr className="text-slate-400">
                  <th className="px-4 py-3 text-right w-10">
                    <input type="checkbox" checked={selected.size === services.length && services.length > 0} onChange={toggleAll} className="accent-violet-600 w-4 h-4" />
                  </th>
                  {["الخدمة", "المنصة", "المزود", "سعر المزود", "سعرنا", "Min/Max", "الطلبات", "الحالة", ""].map((h) => (
                    <th key={h} className="px-3 py-3 text-right font-semibold text-xs">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {services.map((s) => (
                  <tr key={s.id} className={`hover:bg-slate-700/50 ${selected.has(s.id) ? "bg-violet-900/20" : ""}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="accent-violet-600 w-4 h-4" />
                    </td>
                    <td className="px-3 py-3 max-w-[200px]">
                      <div className="text-white text-sm line-clamp-1">{s.name}</div>
                      <div className="text-slate-500 text-xs" dir="ltr">#{s.providerServiceId}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs whitespace-nowrap">
                      {s.serviceType.category.platform.icon} {s.serviceType.category.platform.name}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs">{s.provider.name}</td>
                    <td className="px-3 py-2.5 text-slate-300 text-xs font-mono" dir="ltr">${parseFloat(s.providerRate).toFixed(4)}</td>
                    <td className="px-3 py-2.5 text-emerald-400 text-xs font-mono font-bold" dir="ltr">${parseFloat(s.ourRate).toFixed(4)}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-xs whitespace-nowrap">{s.min.toLocaleString()} / {s.max.toLocaleString()}</td>
                    <td className="px-3 py-2.5 text-violet-400 text-xs">{s._count.orders}</td>
                    <td className="px-3 py-2.5">
                      <span className={s.status === "ACTIVE" ? "badge-active" : "badge-inactive"}>
                        {s.status === "ACTIVE" ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <Link href={`/admin/services/${s.id}/edit`} className="text-violet-400 hover:text-violet-300 text-xs font-semibold">تعديل</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {services.length === 0 && (
              <div className="text-center py-16 text-slate-500">لا توجد خدمات مطابقة</div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-2">
            {services.map((s) => (
              <div key={s.id} className={`bg-slate-800 border rounded-2xl p-3 ${selected.has(s.id) ? "border-violet-500" : "border-slate-700"}`}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} className="accent-violet-600 w-4 h-4 mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="text-white text-sm font-medium line-clamp-1">{s.name}</div>
                      <span className={s.status === "ACTIVE" ? "badge-active shrink-0" : "badge-inactive shrink-0"}>
                        {s.status === "ACTIVE" ? "نشط" : "معطل"}
                      </span>
                    </div>
                    <div className="text-slate-500 text-xs mt-0.5">{s.serviceType.category.platform.icon} {s.serviceType.category.platform.name} · <span className="text-emerald-400" dir="ltr">${parseFloat(s.ourRate).toFixed(4)}</span></div>
                    <div className="flex justify-between mt-1.5">
                      <span className="text-slate-500 text-xs">{s._count.orders} طلب</span>
                      <Link href={`/admin/services/${s.id}/edit`} className="text-violet-400 text-xs">تعديل</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">السابق</button>
              <span className="text-slate-400 text-sm">صفحة {page} من {pages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm px-4 py-2 disabled:opacity-40">التالي</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
