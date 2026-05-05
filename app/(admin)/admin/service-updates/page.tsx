"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Power, PowerOff, AlignLeft, Hash } from "lucide-react";

interface ServiceUpdate {
  id: string;
  serviceId: string;
  changeType: string;
  oldValue: string | null;
  newValue: string | null;
  note: string | null;
  createdAt: string;
  service: { id: string; name: string } | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

const CHANGE_META: Record<string, { label: string; icon: React.ReactNode; cls: string }> = {
  PRICE_UP:            { label: "ارتفاع السعر",       icon: <TrendingUp  size={13} />, cls: "text-red-400 bg-red-500/10 border-red-500/30" },
  PRICE_DOWN:          { label: "انخفاض السعر",       icon: <TrendingDown size={13} />, cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" },
  ENABLED:             { label: "تم التفعيل",          icon: <Power       size={13} />, cls: "text-violet-400 bg-violet-500/10 border-violet-500/30" },
  DISABLED:            { label: "تم التعطيل",          icon: <PowerOff    size={13} />, cls: "text-slate-400 bg-slate-500/10 border-slate-500/20" },
  MIN_CHANGED:         { label: "تغيير الحد الأدنى",  icon: <Hash        size={13} />, cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  MAX_CHANGED:         { label: "تغيير الحد الأقصى",  icon: <Hash        size={13} />, cls: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
  DESCRIPTION_UPDATED: { label: "تحديث الوصف",         icon: <AlignLeft   size={13} />, cls: "text-blue-400 bg-blue-500/10 border-blue-500/30" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("ar-SA", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function AdminServiceUpdatesPage() {
  const [updates, setUpdates] = useState<ServiceUpdate[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 30, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    const res = await fetch(`/api/admin/service-updates?page=${p}`);
    const data = await res.json() as { updates: ServiceUpdate[]; pagination: Pagination };
    setUpdates(data.updates ?? []);
    setPagination(data.pagination ?? { page: 1, limit: 30, total: 0, pages: 1 });
    setLoading(false);
  }, []);

  useEffect(() => { void load(page); }, [page, load]);

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">تحديثات الخدمات</h1>
          <p className="text-slate-400 mt-1 text-sm">سجل تغييرات الأسعار والخدمات</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm">{pagination.total.toLocaleString()} سجل</span>
          <button
            onClick={() => load(page)}
            className="flex items-center gap-2 bg-slate-800 border border-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-xl text-sm font-semibold transition-colors"
          >
            <RefreshCw size={13} />
            تحديث
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-slate-700 flex items-center justify-center">
            <RefreshCw size={24} className="text-slate-400" />
          </div>
          <h3 className="text-slate-300 font-bold">لا توجد تحديثات بعد</h3>
          <p className="text-slate-500 text-sm mt-1">ستظهر هنا عند تغيير أسعار أو حالة الخدمات</p>
        </div>
      ) : (
        <>
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-right text-xs font-bold text-slate-400 px-4 py-3">الخدمة</th>
                    <th className="text-right text-xs font-bold text-slate-400 px-4 py-3">نوع التغيير</th>
                    <th className="text-right text-xs font-bold text-slate-400 px-4 py-3">القيمة القديمة</th>
                    <th className="text-right text-xs font-bold text-slate-400 px-4 py-3">القيمة الجديدة</th>
                    <th className="text-right text-xs font-bold text-slate-400 px-4 py-3">التاريخ</th>
                  </tr>
                </thead>
                <tbody>
                  {updates.map((u) => {
                    const meta = CHANGE_META[u.changeType] ?? { label: u.changeType, icon: null, cls: "text-slate-400 bg-slate-500/10 border-slate-500/20" };
                    return (
                      <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="text-slate-200 text-sm font-medium truncate max-w-[200px]">
                            {u.service?.name ?? "خدمة محذوفة"}
                          </div>
                          <div className="text-slate-500 text-xs font-mono">#{u.serviceId.slice(-6)}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold ${meta.cls}`}>
                            {meta.icon}
                            {meta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-400 bg-slate-700/50 px-2 py-0.5 rounded-lg">
                            {u.oldValue ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-slate-200 bg-slate-700/50 px-2 py-0.5 rounded-lg">
                            {u.newValue ?? "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-slate-500 text-sm">
                صفحة {pagination.page} من {pagination.pages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold disabled:opacity-40 transition-colors"
                >
                  السابق
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page >= pagination.pages}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-sm font-semibold disabled:opacity-40 transition-colors"
                >
                  التالي
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
