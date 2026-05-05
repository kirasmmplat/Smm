"use client";

import { useEffect, useState, useCallback } from "react";

interface SystemData {
  database: { status: string; latency: number; message: string };
  stats: {
    users: number; orders: number; services: number;
    pendingOrders: number; failedOrders: number; openTickets: number; pendingTx: number;
  };
  providers: { id: string; name: string; status: string; apiUrl: string }[];
  recentErrors: { action: string; userEmail: string | null; details: unknown; createdAt: string; severity: string }[];
  serverTime: string;
  nodeVersion: string;
  memoryUsage: { heapUsed: number; heapTotal: number; rss: number };
}

interface ProviderTest {
  status: string;
  latency: number;
  message: string;
  balance?: string;
  currency?: string;
  provider?: string;
}

export default function TestingPage() {
  const [data, setData] = useState<SystemData | null>(null);
  const [loading, setLoading] = useState(true);
  const [providerTests, setProviderTests] = useState<Record<string, ProviderTest>>({});
  const [testingProvider, setTestingProvider] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/testing");
    const d = await res.json();
    setData(d);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const testProvider = async (id: string) => {
    setTestingProvider(id);
    const res = await fetch(`/api/admin/testing?type=provider&id=${id}`);
    const d = await res.json();
    setProviderTests((prev) => ({ ...prev, [id]: d }));
    setTestingProvider(null);
  };

  const testAllProviders = async () => {
    if (!data) return;
    for (const p of data.providers) {
      await testProvider(p.id);
    }
  };

  const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1);

  if (loading) return (
    <div className="p-6 flex items-center justify-center h-64">
      <div className="text-center">
        <div className="animate-spin w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-slate-400">جاري فحص النظام...</p>
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
            اختبار النظام
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA")} — {data.serverTime.split("T")[0]}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={testAllProviders} className="btn-secondary text-sm">
            اختبار كل المزودين
          </button>
          <button onClick={fetchData} className="btn-primary text-sm">
            تحديث
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Database Status */}
        <div className={`card border-2 ${data.database.status === "ok" ? "border-emerald-500/30 bg-emerald-900/10" : "border-red-500/30 bg-red-900/10"}`}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">قاعدة البيانات</h2>
            <span className={`w-3 h-3 rounded-full ${data.database.status === "ok" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">الحالة</span>
              <span className={data.database.status === "ok" ? "text-emerald-400 font-bold" : "text-red-400 font-bold"}>
                {data.database.status === "ok" ? "متصل" : "خطأ"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">زمن الاستجابة</span>
              <span className={`font-mono font-bold ${data.database.latency < 100 ? "text-emerald-400" : data.database.latency < 500 ? "text-amber-400" : "text-red-400"}`}>
                {data.database.latency}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">الرسالة</span>
              <span className="text-slate-300 text-xs">{data.database.message}</span>
            </div>
          </div>
        </div>

        {/* Memory */}
        <div className="card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-white">الذاكرة</h2>
            <span className="text-xs text-slate-500 font-mono">{data.nodeVersion}</span>
          </div>
          <div className="space-y-3 text-sm">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-400">Heap المستخدم</span>
                <span className="text-slate-300 font-mono">{mb(data.memoryUsage.heapUsed)} MB</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                  style={{ width: `${(data.memoryUsage.heapUsed / data.memoryUsage.heapTotal) * 100}%` }}
                />
              </div>
              <div className="text-right text-xs text-slate-500 mt-0.5">
                من {mb(data.memoryUsage.heapTotal)} MB
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">RSS</span>
              <span className="text-slate-300 font-mono">{mb(data.memoryUsage.rss)} MB</span>
            </div>
          </div>
        </div>

        {/* System Stats */}
        <div className="card">
          <h2 className="font-bold text-white mb-3">إحصائيات سريعة</h2>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "المستخدمون", value: data.stats.users, color: "text-blue-400" },
              { label: "الطلبات", value: data.stats.orders, color: "text-indigo-400" },
              { label: "الخدمات", value: data.stats.services, color: "text-purple-400" },
              { label: "طلبات معلقة", value: data.stats.pendingOrders, color: "text-amber-400" },
              { label: "طلبات فاشلة", value: data.stats.failedOrders, color: data.stats.failedOrders > 10 ? "text-red-400" : "text-slate-400" },
              { label: "تذاكر مفتوحة", value: data.stats.openTickets, color: data.stats.openTickets > 5 ? "text-orange-400" : "text-slate-400" },
              { label: "معاملات معلقة", value: data.stats.pendingTx, color: data.stats.pendingTx > 0 ? "text-amber-400" : "text-slate-400" },
            ].map((item) => (
              <div key={item.label} className="bg-slate-800/50 rounded-xl p-2.5">
                <p className="text-slate-500 text-xs mb-0.5">{item.label}</p>
                <p className={`text-lg font-black ${item.color}`}>{item.value.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Providers Test */}
      <div className="card">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          اختبار المزودين
          <span className="text-xs text-slate-500 font-normal">({data.providers.length} مزود)</span>
        </h2>
        {data.providers.length === 0 ? (
          <div className="text-center py-8 text-slate-500">لا يوجد مزودون نشطون</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.providers.map((p) => {
              const test = providerTests[p.id];
              const isTesting = testingProvider === p.id;
              return (
                <div key={p.id} className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-semibold">{p.name}</p>
                      <p className="text-slate-500 text-xs font-mono mt-0.5 truncate">{p.apiUrl}</p>
                      {test && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs">
                            <span className={`w-2 h-2 rounded-full ${test.status === "ok" ? "bg-emerald-400" : "bg-red-400"}`} />
                            <span className={test.status === "ok" ? "text-emerald-400" : "text-red-400"}>
                              {test.status === "ok" ? "متصل" : "خطأ"} — {test.latency}ms
                            </span>
                          </div>
                          {test.balance && (
                            <p className="text-xs text-slate-300">
                              الرصيد: <span className="text-emerald-400 font-mono">{test.balance} {test.currency}</span>
                            </p>
                          )}
                          {test.message && test.status !== "ok" && (
                            <p className="text-xs text-red-400 font-mono">{test.message}</p>
                          )}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => testProvider(p.id)}
                      disabled={isTesting}
                      className="text-xs bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                    >
                      {isTesting ? (
                        <span className="flex items-center gap-1.5">
                          <span className="animate-spin w-3 h-3 border border-indigo-400 border-t-transparent rounded-full" />
                          يختبر...
                        </span>
                      ) : "اختبار"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent Errors */}
      <div className="card">
        <h2 className="font-bold text-white mb-4 flex items-center gap-2">
          آخر الأخطاء
          <span className="text-xs text-slate-500 font-normal">من سجلات التدقيق</span>
        </h2>
        {data.recentErrors.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-emerald-900/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <p className="text-emerald-400 font-semibold">لا توجد أخطاء حديثة</p>
            <p className="text-slate-500 text-sm mt-1">النظام يعمل بشكل طبيعي</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.recentErrors.map((err, i) => (
              <div key={i} className="bg-red-900/20 border border-red-700/30 rounded-xl p-3 flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded font-bold">
                      {err.severity}
                    </span>
                    <span className="text-slate-200 text-sm font-medium">{err.action}</span>
                  </div>
                  <p className="text-slate-400 text-xs">{err.userEmail ?? "النظام"}</p>
                </div>
                <span className="text-slate-500 text-xs whitespace-nowrap">
                  {new Date(err.createdAt).toLocaleString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Health Check Summary */}
      <div className="card bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <h2 className="font-bold text-white mb-4">ملخص الصحة</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            {
              label: "قاعدة البيانات",
              ok: data.database.status === "ok",
              detail: `${data.database.latency}ms`,
            },
            {
              label: "طلبات فاشلة",
              ok: data.stats.failedOrders < 10,
              detail: `${data.stats.failedOrders} طلب`,
            },
            {
              label: "تذاكر دعم",
              ok: data.stats.openTickets < 20,
              detail: `${data.stats.openTickets} مفتوح`,
            },
            {
              label: "معاملات معلقة",
              ok: data.stats.pendingTx < 10,
              detail: `${data.stats.pendingTx} معلق`,
            },
          ].map((check) => (
            <div
              key={check.label}
              className={`rounded-2xl p-4 border ${check.ok ? "bg-emerald-900/20 border-emerald-700/30" : "bg-red-900/20 border-red-700/30"}`}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-2.5 h-2.5 rounded-full ${check.ok ? "bg-emerald-400" : "bg-red-400"}`} />
                <p className="text-white text-sm font-semibold">{check.label}</p>
              </div>
              <p className={`text-lg font-black ${check.ok ? "text-emerald-400" : "text-red-400"}`}>
                {check.ok ? "جيد" : "تحتاج انتباه"}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">{check.detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
