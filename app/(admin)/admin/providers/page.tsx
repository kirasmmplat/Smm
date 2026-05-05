import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import SyncNowButton from "./SyncNowButton";
import SyncAllButton from "./SyncAllButton";
import { Clock, Database, Zap, AlertTriangle, WifiOff } from "lucide-react";

function formatAge(ms: number) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)} دقيقة`;
  if (s < 86400) return `${Math.floor(s / 3600)} ساعة`;
  return `${Math.floor(s / 86400)} يوم`;
}

export default async function ProvidersPage() {
  const auth = await requireAdmin();
  if ("error" in auth) redirect("/login");

  const now = new Date();

  const [providers, caches] = await Promise.all([
    prisma.provider.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { services: true } } },
    }),
    prisma.providerCache.findMany({
      select: { providerId: true, fetchedAt: true, expiresAt: true, data: true },
    }),
  ]);

  const cacheMap = new Map(
    caches.map((c) => ({
      providerId: c.providerId,
      fetchedAt: c.fetchedAt,
      expiresAt: c.expiresAt,
      count: Array.isArray(c.data) ? c.data.length : 0,
      isFresh: c.expiresAt > now,
      ageMs: now.getTime() - c.fetchedAt.getTime(),
    })).map((c) => [c.providerId, c])
  );
  const activeProviders = providers.filter((p) => p.status === "ACTIVE").length;
  const cachedProviders = providers.filter((p) => cacheMap.has(p.id)).length;
  const freshProviders = providers.filter((p) => cacheMap.get(p.id)?.isFresh).length;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">المزودون</h1>
          <p className="text-slate-400 mt-1 text-sm">إدارة مزودي خدمات SMM</p>
        </div>
        <div className="flex items-center gap-2">
          <SyncAllButton />
          <Link href="/admin/providers/new" className="btn-primary text-sm">
            + إضافة مزود
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        {[
          { label: "إجمالي المزودين", value: providers.length, tone: "text-violet-300 bg-violet-500/10" },
          { label: "نشطون", value: activeProviders, tone: "text-emerald-300 bg-emerald-500/10" },
          { label: "لديهم كاش", value: cachedProviders, tone: "text-cyan-300 bg-cyan-500/10" },
          { label: "محدثون", value: freshProviders, tone: "text-amber-300 bg-amber-500/10" },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
            <div className="text-slate-400 text-xs">{item.label}</div>
            <div className={`text-2xl font-black mt-1 ${item.tone.split(" ")[0]}`}>{item.value.toLocaleString()}</div>
          </div>
        ))}
      </div>

      {/* Cache legend */}
      <div className="flex items-center gap-4 mb-5 text-xs text-slate-500">
        <span className="flex items-center gap-1.5"><Zap size={11} className="text-emerald-400" /> محدّث (أقل من 6 ساعات)</span>
        <span className="flex items-center gap-1.5"><AlertTriangle size={11} className="text-yellow-400" /> قديم (يفضل تزامن)</span>
        <span className="flex items-center gap-1.5"><WifiOff size={11} className="text-slate-600" /> لا يوجد كاش</span>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {providers.map((p) => {
          const cache = cacheMap.get(p.id);
          return (
            <div key={p.id} className="card p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0 ml-3">
                  <div className="font-semibold text-white truncate">{p.name}</div>
                  <div className="text-slate-400 text-xs mt-0.5 font-mono truncate" dir="ltr">{p.url}</div>
                </div>
                <span className={p.status === "ACTIVE" ? "badge-active shrink-0" : "badge-danger shrink-0"}>
                  {p.status === "ACTIVE" ? "نشط" : "معطل"}
                </span>
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-3 text-sm mb-3 flex-wrap">
                <div>
                  <span className="text-slate-500">الرصيد: </span>
                  <span className="text-green-400">${parseFloat(p.balance?.toString() ?? "0").toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">مستورد: </span>
                  <span className="text-slate-300">{p._count.services}</span>
                </div>
                <div className="flex items-center gap-1">
                  {cache ? (
                    cache.isFresh ? (
                      <span className="flex items-center gap-1 text-emerald-400 text-xs">
                        <Zap size={10} /> {cache.count.toLocaleString()} · منذ {formatAge(cache.ageMs)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-yellow-400 text-xs">
                        <AlertTriangle size={10} /> {cache.count.toLocaleString()} · قديم {formatAge(cache.ageMs)}
                      </span>
                    )
                  ) : (
                    <span className="flex items-center gap-1 text-slate-600 text-xs">
                      <WifiOff size={10} /> لا كاش
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <Link href={`/admin/providers/${p.id}/browse`} className="btn-primary text-xs px-3 py-1.5 flex-1 text-center">
                  تصفح الخدمات
                </Link>
                <Link href={`/admin/providers/${p.id}`} className="btn-secondary text-xs px-3 py-1.5 text-center">
                  تعديل
                </Link>
                <SyncNowButton providerId={p.id} />
              </div>
            </div>
          );
        })}
        {providers.length === 0 && (
          <div className="card text-center text-slate-500 py-12">
            لا يوجد مزودون — ابدأ بإضافة مزود جديد
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="card hidden md:block p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>الاسم</th>
                <th>الرابط</th>
                <th>الرصيد</th>
                <th className="text-center">مستورد</th>
                <th className="text-center">كاش المزود</th>
                <th>آخر تزامن</th>
                <th>الحالة</th>
                <th>إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {providers.map((p) => {
                const cache = cacheMap.get(p.id);
                return (
                  <tr key={p.id}>
                    <td className="font-medium text-white">{p.name}</td>
                    <td className="text-slate-400 text-xs max-w-[180px] truncate font-mono" dir="ltr" title={p.url}>{p.url}</td>
                    <td className="text-green-400">${parseFloat(p.balance?.toString() ?? "0").toFixed(2)}</td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-300">
                        <Database size={12} className="text-slate-500" />
                        {p._count.services}
                      </div>
                    </td>
                    <td className="text-center">
                      {cache ? (
                        <div className={`flex items-center justify-center gap-1 text-xs font-medium ${cache.isFresh ? "text-emerald-400" : "text-yellow-400"}`}>
                          {cache.isFresh ? <Zap size={11} /> : <AlertTriangle size={11} />}
                          {cache.count.toLocaleString()}
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-slate-600 text-xs">
                          <WifiOff size={11} /> —
                        </div>
                      )}
                    </td>
                    <td>
                      {cache ? (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={11} />
                          <span className={cache.isFresh ? "text-slate-300" : "text-yellow-400"}>
                            منذ {formatAge(cache.ageMs)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-600 text-xs">لم يتزامن</span>
                      )}
                    </td>
                    <td>
                      <span className={p.status === "ACTIVE" ? "badge-active" : "badge-danger"}>
                        {p.status === "ACTIVE" ? "نشط" : "معطل"}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Link href={`/admin/providers/${p.id}/browse`} className="text-indigo-400 hover:text-indigo-300 text-xs">
                          تصفح
                        </Link>
                        <span className="text-slate-700">|</span>
                        <Link href={`/admin/providers/${p.id}`} className="text-slate-400 hover:text-white text-xs">
                          تعديل
                        </Link>
                        <span className="text-slate-700">|</span>
                        <SyncNowButton providerId={p.id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
              {providers.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center text-slate-500 py-12">
                    لا يوجد مزودون — ابدأ بإضافة مزود جديد
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
