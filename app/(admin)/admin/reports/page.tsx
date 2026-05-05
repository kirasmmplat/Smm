"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, DollarSign, Users, ShoppingCart, Download,
  ArrowUpRight, RefreshCw, BarChart2, PieChartIcon, Award,
} from "lucide-react";

interface ReportData {
  period: number;
  stats: {
    totalRevenue: number; totalDeposits: number; totalRefunds: number;
    totalOrders: number; newUsers: number; estimatedProfit: number;
  };
  revenueByDay: { date: string; revenue: number; orders: number }[];
  depositsByDay: { date: string; amount: number; count: number }[];
  topServices: { serviceId: string; name: string; revenue: number; orders: number }[];
  topUsers: { userId: string; name: string; email: string; revenue: number; orders: number }[];
  statusBreakdown: { status: string; count: number; total: number }[];
  paymentMethods: { method: string; amount: number; count: number }[];
}

const PERIOD_OPTIONS = [
  { label: "7 أيام", value: "7" },
  { label: "30 يوم", value: "30" },
  { label: "90 يوم", value: "90" },
  { label: "سنة", value: "365" },
];

const PIE_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"];

const statusAr: Record<string, string> = {
  PENDING: "انتظار", IN_PROGRESS: "جاري", PROCESSING: "يُعالج",
  COMPLETED: "مكتمل", PARTIAL: "جزئي", CANCELED: "ملغي",
  REFUNDED: "مُسترد", FAILED: "فشل",
};

function exportCSV(data: ReportData) {
  const rows = [
    ["التاريخ", "الإيرادات ($)", "الطلبات"],
    ...data.revenueByDay.map((d) => [d.date, d.revenue.toFixed(2), d.orders]),
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `revenue-report-${data.period}d.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30");
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (p: string, showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch(`/api/admin/reports?period=${p}`);
      const d = await res.json() as ReportData;
      setData(d);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    void fetchData(period);
  }, [period, fetchData]);

  const summaryCards = data ? [
    {
      label: "إجمالي الإيرادات", value: `$${data.stats.totalRevenue.toFixed(2)}`,
      Icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10",
      sub: `${data.stats.totalOrders.toLocaleString()} طلب`,
    },
    {
      label: "إجمالي الإيداعات", value: `$${data.stats.totalDeposits.toFixed(2)}`,
      Icon: DollarSign, color: "text-violet-400", bg: "bg-violet-500/10",
      sub: "مدفوعات مؤكدة",
    },
    {
      label: "صافي الربح (تقديري)", value: `$${data.stats.estimatedProfit.toFixed(2)}`,
      Icon: BarChart2, color: "text-blue-400", bg: "bg-blue-500/10",
      sub: "هامش تقديري ~30%",
    },
    {
      label: "المستخدمون الجدد", value: data.stats.newUsers.toLocaleString(),
      Icon: Users, color: "text-cyan-400", bg: "bg-cyan-500/10",
      sub: `خلال ${period} يوم`,
    },
    {
      label: "الاستردادات", value: `$${data.stats.totalRefunds.toFixed(2)}`,
      Icon: ShoppingCart, color: "text-amber-400", bg: "bg-amber-500/10",
      sub: "استرداد للمستخدمين",
    },
    {
      label: "الطلبات", value: data.stats.totalOrders.toLocaleString(),
      Icon: Award, color: "text-purple-400", bg: "bg-purple-500/10",
      sub: "إجمالي الفترة",
    },
  ] : [];

  if (loading) {
    return (
      <div className="p-4 md:p-6 max-w-7xl">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-80 bg-slate-800 rounded-2xl animate-pulse mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-64 bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="p-4 md:p-6 max-w-7xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">التقارير المالية</h1>
          <p className="text-slate-400 mt-1 text-sm">تحليل الإيرادات والأرباح والنشاط</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPeriod(opt.value)}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold transition-all ${
                period === opt.value
                  ? "bg-violet-500 text-white"
                  : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => fetchData(period, true)}
            disabled={refreshing}
            className="flex items-center gap-2 border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 rounded-xl text-sm font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors disabled:opacity-60"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            تحديث
          </button>
          <button
            onClick={() => exportCSV(data)}
            className="flex items-center gap-2 border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 rounded-xl text-sm font-semibold text-emerald-200 hover:bg-emerald-500/20 transition-colors"
          >
            <Download size={13} />
            تصدير CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {summaryCards.map((c) => (
          <div key={c.label} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400 text-xs">{c.label}</span>
              <div className={`w-8 h-8 rounded-xl ${c.bg} flex items-center justify-center`}>
                <c.Icon size={15} className={c.color} />
              </div>
            </div>
            <div className={`text-xl font-black ${c.color} mb-1`} dir="ltr">{c.value}</div>
            <div className="text-slate-500 text-xs">{c.sub}</div>
          </div>
        ))}
      </div>

      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-sm">الإيرادات اليومية</h2>
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" /> إيرادات</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> طلبات</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <AreaChart data={data.revenueByDay} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="revG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="ordG" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis yAxisId="rev" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis yAxisId="ord" orientation="left" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "#F1F5F9", fontSize: 12 }}
              formatter={(val: number, name: string) => [
                name === "revenue" ? `$${val.toFixed(2)}` : val,
                name === "revenue" ? "الإيرادات" : "الطلبات",
              ]}
            />
            <Area yAxisId="rev" type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revG)" />
            <Area yAxisId="ord" type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} fill="url(#ordG)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <BarChart2 size={14} className="text-violet-400" />
            الإيداعات اليومية
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.depositsByDay} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }}
                formatter={(val: number) => [`$${val.toFixed(2)}`, "الإيداعات"]}
              />
              <Bar dataKey="amount" fill="#7C3AED" radius={[5, 5, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <PieChartIcon size={14} className="text-violet-400" />
            توزيع حالات الطلبات
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <ResponsiveContainer width="100%" height={160} className="sm:w-[50%]">
              <PieChart>
                <Pie
                  data={data.statusBreakdown}
                  cx="50%" cy="50%"
                  innerRadius={38} outerRadius={58}
                  dataKey="count" nameKey="status"
                >
                  {data.statusBreakdown.map((_, idx) => (
                    <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }}
                  formatter={(val: number, name: string) => [val, statusAr[name] ?? name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5 self-center">
              {data.statusBreakdown.slice(0, 6).map((s, idx) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-slate-400">{statusAr[s.status] ?? s.status}</span>
                  </div>
                  <span className="text-slate-200 font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Award size={14} className="text-amber-400" />
              أعلى الخدمات إيراداً
            </h2>
            <Link href="/admin/services" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              عرض الكل <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {data.topServices.map((s, idx) => (
              <div key={s.serviceId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-slate-300">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 text-xs font-medium truncate">{s.name}</div>
                  <div className="text-slate-500 text-xs">{s.orders} طلب</div>
                </div>
                <span className="text-emerald-400 font-black text-xs" dir="ltr">${s.revenue.toFixed(2)}</span>
              </div>
            ))}
            {data.topServices.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">لا توجد بيانات للفترة المحددة</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Users size={14} className="text-blue-400" />
              أعلى العملاء إنفاقاً
            </h2>
            <Link href="/admin/users" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              عرض الكل <ArrowUpRight size={11} />
            </Link>
          </div>
          <div className="space-y-2">
            {data.topUsers.map((u, idx) => (
              <div key={u.userId} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-700 flex items-center justify-center text-xs font-black text-slate-300">{idx + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 text-xs font-medium truncate">{u.name}</div>
                  <div className="text-slate-500 text-xs truncate">{u.email}</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-black text-xs" dir="ltr">${u.revenue.toFixed(2)}</div>
                  <div className="text-slate-500 text-xs">{u.orders} طلب</div>
                </div>
              </div>
            ))}
            {data.topUsers.length === 0 && (
              <p className="text-slate-500 text-sm text-center py-4">لا توجد بيانات للفترة المحددة</p>
            )}
          </div>
        </div>
      </div>

      {data.paymentMethods.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4 flex items-center gap-2">
            <DollarSign size={14} className="text-violet-400" />
            طرق الدفع
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {data.paymentMethods.map((pm, idx) => (
              <div key={pm.method} className="bg-slate-700/50 rounded-xl p-3 text-center">
                <div className="w-8 h-8 rounded-xl mx-auto mb-2 flex items-center justify-center"
                  style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] + "20" }}>
                  <DollarSign size={14} style={{ color: PIE_COLORS[idx % PIE_COLORS.length] }} />
                </div>
                <div className="text-slate-200 text-xs font-bold capitalize">{pm.method === "stripe" ? "Stripe" : pm.method === "paypal" ? "PayPal" : "يدوي"}</div>
                <div className="text-emerald-400 font-black text-sm" dir="ltr">${pm.amount.toFixed(2)}</div>
                <div className="text-slate-500 text-xs">{pm.count} عملية</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
