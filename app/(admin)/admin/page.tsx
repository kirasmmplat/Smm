"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, ShoppingCart, Users, List, Clock, Ticket,
  Plug, DollarSign, Plug2, ArrowUpRight, TrendingDown,
  RefreshCw, AlertCircle, CheckCircle2, ShieldCheck, Activity, Database,
} from "lucide-react";

interface RecentOrder {
  id: string; serviceName: string; userName: string; userEmail: string;
  charge: string; quantity: number; status: string; createdAt: string;
}
interface StatsData {
  totalUsers: number; totalOrders: number; activeOrders: number; openTickets: number;
  totalRevenue: string; totalServices: number; totalProviders: number;
  newUsersToday: number; revenueToday: string; pendingDeposits: number;
  deltas: { revenue: number; orders: number; users: number };
  recentOrders: RecentOrder[];
  dailyChartData: { date: string; revenue: number; orders: number; users: number }[];
  statusDist: { status: string; count: number }[];
}

const statusAr: Record<string, string> = {
  PENDING: "انتظار", IN_PROGRESS: "جاري", PROCESSING: "يُعالج",
  COMPLETED: "مكتمل", PARTIAL: "جزئي", CANCELED: "ملغي", REFUNDED: "مُسترد", FAILED: "فشل",
};
const statusColors: Record<string, string> = {
  COMPLETED: "badge-active", PARTIAL: "badge-inactive",
  PENDING: "badge-pending", IN_PROGRESS: "badge-pending", PROCESSING: "badge-pending",
  CANCELED: "badge-danger", REFUNDED: "badge-danger", FAILED: "badge-danger",
};
const PIE_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"];

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-slate-500 text-xs">= مقارنة بالأمس</span>;
  const up = delta > 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
      {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {up ? "+" : ""}{delta}% مقارنة بالأمس
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const fetchStats = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/stats");
      const d = await res.json();
      setStats(d as StatsData);
      setLastRefresh(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void fetchStats();
    const interval = setInterval(() => { void fetchStats(); }, 30_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  if (loading) return (
    <div className="p-6 max-w-7xl">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[...Array(8)].map((_, i) => <div key={i} className="h-24 bg-slate-800 rounded-2xl animate-pulse" />)}
      </div>
    </div>
  );

  if (!stats) return null;

  const statCards = [
    {
      label: "إجمالي الإيرادات",
      value: `$${parseFloat(stats.totalRevenue).toFixed(2)}`,
      Icon: TrendingUp, iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400", valueColor: "text-emerald-400",
      sub: `اليوم: $${parseFloat(stats.revenueToday).toFixed(2)}`,
      delta: stats.deltas.revenue,
    },
    {
      label: "إجمالي الطلبات",
      value: stats.totalOrders.toLocaleString(),
      Icon: ShoppingCart, iconBg: "bg-violet-500/10", iconColor: "text-violet-400", valueColor: "text-violet-400",
      sub: `${stats.activeOrders} نشط`,
      delta: stats.deltas.orders,
    },
    {
      label: "المستخدمون",
      value: stats.totalUsers.toLocaleString(),
      Icon: Users, iconBg: "bg-blue-500/10", iconColor: "text-blue-400", valueColor: "text-blue-400",
      sub: `+${stats.newUsersToday} اليوم`,
      delta: stats.deltas.users,
    },
    {
      label: "الخدمات النشطة",
      value: stats.totalServices.toLocaleString(),
      Icon: List, iconBg: "bg-purple-500/10", iconColor: "text-purple-400", valueColor: "text-purple-400",
      sub: `${stats.totalProviders} مزود`,
      delta: null,
    },
    {
      label: "طلبات نشطة",
      value: stats.activeOrders.toLocaleString(),
      Icon: Clock, iconBg: "bg-amber-500/10", iconColor: "text-amber-400", valueColor: "text-amber-400",
      sub: "قيد التنفيذ",
      delta: null,
    },
    {
      label: "تذاكر مفتوحة",
      value: stats.openTickets.toLocaleString(),
      Icon: Ticket, iconBg: "bg-red-500/10", iconColor: "text-red-400", valueColor: "text-red-400",
      sub: "تحتاج رد",
      delta: null,
    },
    {
      label: "المزودون",
      value: stats.totalProviders.toLocaleString(),
      Icon: Plug, iconBg: "bg-cyan-500/10", iconColor: "text-cyan-400", valueColor: "text-cyan-400",
      sub: "مزود نشط",
      delta: null,
    },
    {
      label: "إيرادات اليوم",
      value: `$${parseFloat(stats.revenueToday).toFixed(2)}`,
      Icon: DollarSign, iconBg: "bg-green-500/10", iconColor: "text-green-400", valueColor: "text-green-400",
      sub: "منذ منتصف الليل",
      delta: stats.deltas.revenue,
    },
  ];

  const quickLinks = [
    { href: "/admin/providers/new", label: "مزود جديد", Icon: Plug2, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { href: "/admin/services", label: "الخدمات", Icon: List, color: "text-purple-400", bg: "bg-purple-500/10" },
    { href: "/admin/orders", label: "الطلبات", Icon: ShoppingCart, color: "text-violet-400", bg: "bg-violet-500/10" },
    { href: "/admin/users", label: "المستخدمون", Icon: Users, color: "text-blue-400", bg: "bg-blue-500/10" },
    { href: "/admin/transactions", label: "المعاملات", Icon: DollarSign, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { href: "/admin/tickets", label: "الدعم", Icon: Ticket, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  const healthCards = [
    {
      label: "النظام",
      value: "سليم",
      desc: "الواجهة تعمل بشكل طبيعي",
      Icon: ShieldCheck,
      tone: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "قاعدة البيانات",
      value: "متصلة",
      desc: "القراءة والكتابة متاحتان",
      Icon: Database,
      tone: "text-violet-400",
      bg: "bg-violet-500/10",
    },
    {
      label: "النشاط",
      value: "حي",
      desc: "تحديث تلقائي كل 30 ثانية",
      Icon: Activity,
      tone: "text-cyan-400",
      bg: "bg-cyan-500/10",
    },
  ];

  return (
    <div className="p-4 md:p-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white">لوحة التحكم</h1>
          <p className="text-slate-400 mt-1 text-sm">
            نظرة عامة — آخر تحديث: {lastRefresh.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </p>
        </div>
        <button
          onClick={() => fetchStats(true)}
          disabled={refreshing}
          className="flex items-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors disabled:opacity-60 self-start sm:self-auto"
        >
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          تحديث
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        {healthCards.map((card) => (
          <div key={card.label} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center shrink-0`}>
              <card.Icon size={18} className={card.tone} />
            </div>
            <div>
              <div className="text-slate-400 text-xs">{card.label}</div>
              <div className="text-white font-black text-lg">{card.value}</div>
              <div className="text-slate-500 text-xs mt-1">{card.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions Bar */}
      {(stats.pendingDeposits > 0 || stats.openTickets > 0 || stats.activeOrders > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          {stats.pendingDeposits > 0 && (
            <Link href="/admin/transactions?status=PENDING&type=DEPOSIT"
              className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl px-4 py-3 hover:bg-yellow-500/15 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                <AlertCircle size={16} className="text-yellow-400" />
              </div>
              <div>
                <p className="text-yellow-300 font-bold text-sm">{stats.pendingDeposits} إيداع معلق</p>
                <p className="text-yellow-500/70 text-xs">ينتظر التأكيد — انقر للمراجعة</p>
              </div>
            </Link>
          )}
          {stats.openTickets > 0 && (
            <Link href="/admin/tickets"
              className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 hover:bg-red-500/15 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                <Ticket size={16} className="text-red-400" />
              </div>
              <div>
                <p className="text-red-300 font-bold text-sm">{stats.openTickets} تذكرة مفتوحة</p>
                <p className="text-red-500/70 text-xs">تحتاج رد — انقر للمراجعة</p>
              </div>
            </Link>
          )}
          {stats.activeOrders > 0 && (
            <Link href="/admin/orders?status=IN_PROGRESS"
              className="flex items-center gap-3 bg-violet-500/10 border border-violet-500/30 rounded-2xl px-4 py-3 hover:bg-violet-500/15 transition-colors">
              <div className="w-9 h-9 rounded-xl bg-violet-500/20 flex items-center justify-center shrink-0">
                <Clock size={16} className="text-violet-400" />
              </div>
              <div>
                <p className="text-violet-300 font-bold text-sm">{stats.activeOrders} طلب نشط</p>
                <p className="text-violet-500/70 text-xs">قيد التنفيذ حالياً</p>
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-4 hover:border-slate-600 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-slate-400 text-xs font-medium">{s.label}</span>
              <div className={`w-8 h-8 rounded-xl ${s.iconBg} flex items-center justify-center`}>
                <s.Icon size={15} className={s.iconColor} />
              </div>
            </div>
            <div className={`text-xl font-black ${s.valueColor} mb-1`} dir="ltr">{s.value}</div>
            <div className="text-slate-500 text-xs mb-1">{s.sub}</div>
            {s.delta !== null && <DeltaBadge delta={s.delta} />}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-6">
        {quickLinks.map((l) => (
          <Link key={l.href} href={l.href}
            className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-3 text-center hover:border-violet-500/50 hover:bg-slate-700/50 transition-all group">
            <div className={`w-9 h-9 rounded-xl ${l.bg} flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}>
              <l.Icon size={16} className={l.color} />
            </div>
            <div className="text-xs text-slate-300 font-medium">{l.label}</div>
          </Link>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">الإيرادات والطلبات — آخر 7 أيام</h2>
            <Link href="/admin/transactions" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              عرض الكل <ArrowUpRight size={12} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={stats.dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="ordGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
              <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: 10, color: "#F1F5F9", fontSize: 12 }}
                formatter={(val: number, name: string) => [
                  name === "revenue" ? `$${val.toFixed(2)}` : val,
                  name === "revenue" ? "الإيرادات" : "الطلبات",
                ]}
              />
              <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revGrad)" />
              <Area type="monotone" dataKey="orders" stroke="#10B981" strokeWidth={2} fill="url(#ordGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <h2 className="text-white font-bold text-sm mb-4">توزيع حالات الطلبات</h2>
          <ResponsiveContainer width="100%" height={150}>
            <PieChart>
              <Pie data={stats.statusDist} cx="50%" cy="50%" innerRadius={40} outerRadius={62}
                dataKey="count" nameKey="status">
                {stats.statusDist.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }}
                formatter={(val: number, name: string) => [val, statusAr[name] ?? name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {stats.statusDist.slice(0, 5).map((s, idx) => (
              <div key={s.status} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  <span className="text-slate-400">{statusAr[s.status] ?? s.status}</span>
                </div>
                <span className="text-slate-200 font-semibold tabular-nums">{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Users Bar Chart */}
      <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-bold text-sm">المستخدمون الجدد — آخر 7 أيام</h2>
          <Link href="/admin/users" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
            عرض الكل <ArrowUpRight size={12} />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={stats.dailyChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
            <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} />
            <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} allowDecimals={false} />
            <Tooltip
              contentStyle={{ backgroundColor: "#0F172A", border: "1px solid #334155", borderRadius: 8, color: "#F1F5F9", fontSize: 11 }}
              formatter={(val: number) => [val, "مستخدم جديد"]}
            />
            <Bar dataKey="users" fill="#7C3AED" radius={[5, 5, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Orders Table */}
      {stats.recentOrders.length > 0 && (
        <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold text-sm">آخر الطلبات</h2>
            <Link href="/admin/orders" className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1">
              عرض الكل <ArrowUpRight size={12} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-700">
                  {["المستخدم", "الخدمة", "الكمية", "المبلغ", "الحالة", "التوقيت"].map((h) => (
                    <th key={h} className="pb-2 text-right text-slate-400 font-semibold px-2">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {stats.recentOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="py-2.5 px-2">
                      <div className="text-slate-200 font-medium">{o.userName}</div>
                      <div className="text-slate-500 text-[10px]">{o.userEmail}</div>
                    </td>
                    <td className="py-2.5 px-2 max-w-[180px]">
                      <div className="text-slate-300 line-clamp-1">{o.serviceName}</div>
                    </td>
                    <td className="py-2.5 px-2 text-slate-400">{o.quantity.toLocaleString()}</td>
                    <td className="py-2.5 px-2 text-emerald-400 font-medium" dir="ltr">
                      ${parseFloat(o.charge).toFixed(4)}
                    </td>
                    <td className="py-2.5 px-2">
                      <span className={statusColors[o.status] ?? "badge-inactive"}>
                        {statusAr[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-slate-500 whitespace-nowrap">
                      {new Date(o.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 size={12} className="text-emerald-500" />
            يتحدث تلقائياً كل 30 ثانية
          </div>
        </div>
      )}
    </div>
  );
}
