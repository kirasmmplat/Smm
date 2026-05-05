"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ShieldCheck, Database, FileText } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  entity: string | null;
  entityId: string | null;
  details: Record<string, unknown> | null;
  ip: string | null;
  severity: string;
  createdAt: string;
  user: { name: string; email: string; username: string } | null;
}

const SEVERITY_COLORS: Record<string, string> = {
  INFO: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  WARNING: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  ERROR: "bg-red-500/20 text-red-300 border-red-500/30",
  CRITICAL: "bg-rose-600/20 text-rose-300 border-rose-600/30",
};

const ACTION_ICONS: Record<string, string> = {
  LOGIN: "Auth",
  LOGOUT: "Auth",
  LOGIN_FAILED: "Auth",
  PASSWORD_CHANGED: "Account",
  USER_CREATED: "User",
  USER_BANNED: "User",
  USER_UNBANNED: "User",
  BALANCE_ADJUSTED: "Finance",
  ORDER_CREATED: "Order",
  ORDER_STATUS_CHANGED: "Order",
  ORDER_CANCELLED: "Order",
  ORDER_REFUNDED: "Order",
  TRANSACTION_CREATED: "Finance",
  TRANSACTION_APPROVED: "Finance",
  TRANSACTION_REJECTED: "Finance",
  SERVICE_CREATED: "Catalog",
  SERVICE_UPDATED: "Catalog",
  SERVICE_DELETED: "Catalog",
  PROVIDER_CREATED: "Provider",
  PROVIDER_TESTED: "Provider",
  SETTINGS_UPDATED: "System",
  API_KEY_GENERATED: "Security",
  ADMIN_ACTION: "Security",
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterSeverity, setFilterSeverity] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [actions, setActions] = useState<{ action: string; _count: number }[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page), limit: String(limit),
      ...(search ? { search } : {}),
      ...(filterAction ? { action: filterAction } : {}),
      ...(filterSeverity ? { severity: filterSeverity } : {}),
      ...(filterFrom ? { from: filterFrom } : {}),
      ...(filterTo ? { to: filterTo } : {}),
    });
    const res = await fetch(`/api/admin/audit-logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setActions(data.actions ?? []);
    setLoading(false);
  }, [page, search, filterAction, filterSeverity, filterFrom, filterTo]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const clearOldLogs = async () => {
    if (!confirm("هل تريد حذف السجلات الأقدم من 30 يوماً؟")) return;
    setClearing(true);
    const d = new Date(); d.setDate(d.getDate() - 30);
    const res = await fetch(`/api/admin/audit-logs?before=${d.toISOString()}`, { method: "DELETE" });
    const data = await res.json();
    alert(`تم حذف ${data.deleted} سجل`);
    setClearing(false);
    fetchLogs();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-white">سجلات التدقيق</h1>
          <p className="text-slate-400 mt-1 text-sm">
            تتبع جميع الأنشطة والتغييرات في النظام — {total.toLocaleString()} سجل
          </p>
        </div>
        <button
          onClick={clearOldLogs}
          disabled={clearing}
          className="text-sm bg-red-900/30 hover:bg-red-900/50 text-red-400 border border-red-700/30 px-4 py-2 rounded-xl transition-colors"
        >
          {clearing ? "جاري الحذف..." : "حذف القديمة (+30 يوم)"}
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="بحث بالإيميل أو الإجراء..."
            className="input-field text-sm col-span-2 md:col-span-1 lg:col-span-2"
          />
          <select
            value={filterSeverity}
            onChange={(e) => { setFilterSeverity(e.target.value); setPage(1); }}
            className="input-field text-sm"
          >
            <option value="">كل الأهمية</option>
            <option value="INFO">معلومات</option>
            <option value="WARNING">تحذير</option>
            <option value="ERROR">خطأ</option>
            <option value="CRITICAL">حرج</option>
          </select>
          <select
            value={filterAction}
            onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
            className="input-field text-sm"
          >
            <option value="">كل الإجراءات</option>
            {actions.map((a) => (
              <option key={a.action} value={a.action}>
                {a.action} ({a._count})
              </option>
            ))}
          </select>
          <div className="flex gap-2 col-span-2 md:col-span-1">
            <input type="date" value={filterFrom} onChange={(e) => { setFilterFrom(e.target.value); setPage(1); }} className="input-field text-xs flex-1" />
            <input type="date" value={filterTo} onChange={(e) => { setFilterTo(e.target.value); setPage(1); }} className="input-field text-xs flex-1" />
          </div>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {["INFO", "WARNING", "ERROR", "CRITICAL"].map((s) => {
          const count = logs.filter((l) => l.severity === s).length;
          return (
            <button
              key={s}
              onClick={() => setFilterSeverity(filterSeverity === s ? "" : s)}
              className={`px-3 py-1 rounded-lg border text-xs font-semibold transition-all ${SEVERITY_COLORS[s]} ${filterSeverity === s ? "ring-2 ring-white/30" : ""}`}
            >
              {s === "INFO" ? "معلومات" : s === "WARNING" ? "تحذير" : s === "ERROR" ? "خطأ" : "حرج"}: {count}
            </button>
          );
        })}
        <button
          onClick={() => { setSearch(""); setFilterAction(""); setFilterSeverity(""); setFilterFrom(""); setFilterTo(""); setPage(1); }}
          className="px-3 py-1 rounded-lg border border-slate-600 text-slate-400 text-xs hover:bg-slate-700 transition-colors"
        >
          مسح الفلاتر
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {[
          { label: "إجمالي السجلات", value: total, icon: FileText, tone: "text-violet-300 bg-violet-500/10" },
          { label: "أحداث حرجة", value: logs.filter((l) => l.severity === "CRITICAL").length, icon: AlertTriangle, tone: "text-red-300 bg-red-500/10" },
          { label: "أنشطة أمنية", value: logs.filter((l) => ["LOGIN", "LOGIN_FAILED", "API_KEY_GENERATED", "ADMIN_ACTION"].includes(l.action)).length, icon: ShieldCheck, tone: "text-emerald-300 bg-emerald-500/10" },
          { label: "أحداث النظام", value: logs.filter((l) => ["SETTINGS_UPDATED", "PROVIDER_CREATED", "SERVICE_UPDATED"].includes(l.action)).length, icon: Activity, tone: "text-cyan-300 bg-cyan-500/10" },
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

      {/* Logs Table */}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-slate-400 text-sm">جاري التحميل...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-slate-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </div>
            <p className="text-slate-400">لا توجد سجلات تطابق البحث</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 bg-slate-800/50">
                  <th className="text-right text-slate-400 font-semibold py-3 px-4">الإجراء</th>
                  <th className="text-right text-slate-400 font-semibold py-3 px-4 hidden md:table-cell">المستخدم</th>
                  <th className="text-right text-slate-400 font-semibold py-3 px-4 hidden lg:table-cell">الكيان</th>
                  <th className="text-right text-slate-400 font-semibold py-3 px-4">الأهمية</th>
                  <th className="text-right text-slate-400 font-semibold py-3 px-4 hidden md:table-cell">IP</th>
                  <th className="text-right text-slate-400 font-semibold py-3 px-4">الوقت</th>
                  <th className="py-3 px-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {logs.map((log) => (
                  <>
                    <tr
                      key={log.id}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer"
                      onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{ACTION_ICONS[log.action] ?? "·"}</span>
                          <span className="text-slate-200 font-medium text-xs">{log.action}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <div className="text-slate-300 text-xs">{log.userEmail ?? log.user?.email ?? "—"}</div>
                        <div className="text-slate-500 text-xs">{log.user?.name}</div>
                      </td>
                      <td className="py-3 px-4 hidden lg:table-cell">
                        {log.entity ? (
                          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">
                            {log.entity}{log.entityId ? ` #${log.entityId.slice(-6)}` : ""}
                          </span>
                        ) : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded border font-semibold ${SEVERITY_COLORS[log.severity]}`}>
                          {log.severity === "INFO" ? "معلومات" : log.severity === "WARNING" ? "تحذير" : log.severity === "ERROR" ? "خطأ" : "حرج"}
                        </span>
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="text-slate-500 text-xs font-mono">{log.ip ?? "—"}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-slate-400 text-xs whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-xs">
                        {log.details ? (expanded === log.id ? "▲" : "▼") : ""}
                      </td>
                    </tr>
                    {expanded === log.id && log.details && (
                      <tr key={`${log.id}-details`} className="bg-slate-900/60">
                        <td colSpan={7} className="px-4 py-3">
                          <pre className="text-xs text-slate-300 bg-slate-800 rounded-lg p-3 overflow-x-auto max-h-48 font-mono">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
          <p className="text-slate-400 text-sm">
            عرض {Math.min((page - 1) * limit + 1, total)}–{Math.min(page * limit, total)} من {total.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">
              السابق
            </button>
            <span className="text-slate-400 text-sm px-2 py-1.5">{page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="btn-secondary text-sm px-3 py-1.5 disabled:opacity-40">
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
