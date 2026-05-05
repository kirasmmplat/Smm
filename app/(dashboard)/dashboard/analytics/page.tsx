"use client";

import { useEffect, useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Package, DollarSign, RefreshCw, BarChart2 } from "lucide-react";

interface StatsData {
  dailyData: { date: string; spend: number }[];
  statusData: { status: string; count: number }[];
  topServices: { name: string; spend: number; orders: number }[];
  monthlySpend: number;
  monthlyOrders: number;
}

const statusLabels: Record<string, string> = {
  PENDING: "انتظار", IN_PROGRESS: "جاري", PROCESSING: "يُعالج",
  COMPLETED: "مكتمل", PARTIAL: "جزئي", CANCELED: "ملغي",
  REFUNDED: "مُسترد", FAILED: "فشل",
};

const PIE_COLORS = ["#7C3AED", "#10B981", "#F59E0B", "#EF4444", "#3B82F6", "#8B5CF6", "#EC4899", "#6B7280"];

export default function AnalyticsPage() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch("/api/dashboard/stats")
      .then((r) => r.json() as Promise<StatsData>)
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading) return (
    <div>
      <h1 className="text-2xl font-black text-gray-900 mb-6">إحصائياتي</h1>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="card h-24 animate-pulse bg-gray-100" />)}
      </div>
    </div>
  );

  if (!data) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          <BarChart2 size={24} className="text-violet-600" /> إحصائياتي
        </h1>
        <p className="text-gray-500 mt-1 text-sm">تحليل إنفاقك وطلباتك خلال آخر 30 يوماً</p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card col-span-2 md:col-span-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">إنفاق هذا الشهر</span>
            <div className="w-8 h-8 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600"><DollarSign size={15} /></div>
          </div>
          <p className="text-2xl font-black text-violet-600" dir="ltr">${data.monthlySpend.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">طلبات الشهر</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><Package size={15} /></div>
          </div>
          <p className="text-2xl font-black text-emerald-600">{data.monthlyOrders}</p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">مكتملة</span>
            <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><TrendingUp size={15} /></div>
          </div>
          <p className="text-2xl font-black text-blue-600">
            {data.statusData.find((s) => s.status === "COMPLETED")?.count ?? 0}
          </p>
        </div>
        <div className="stat-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-gray-500">قيد التنفيذ</span>
            <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><RefreshCw size={15} /></div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {(data.statusData.find((s) => s.status === "PENDING")?.count ?? 0) +
              (data.statusData.find((s) => s.status === "IN_PROGRESS")?.count ?? 0)}
          </p>
        </div>
      </div>

      {/* Spending chart */}
      <div className="card mb-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">الإنفاق اليومي — آخر 30 يوماً</h2>
        {data.dailyData.some((d) => d.spend > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={data.dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="spendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="date" tick={{ fill: "#94A3B8", fontSize: 10 }} interval={4} />
              <YAxis tick={{ fill: "#94A3B8", fontSize: 10 }} />
              <Tooltip
                contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: 10, color: "#1E293B", fontSize: 12 }}
                formatter={(val: number) => [`$${val.toFixed(4)}`, "الإنفاق"]}
              />
              <Area type="monotone" dataKey="spend" stroke="#7C3AED" strokeWidth={2} fill="url(#spendGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400">
            <p>لا يوجد إنفاق في آخر 30 يوماً</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Status pie */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4">توزيع حالات الطلبات</h2>
          {data.statusData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.statusData} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                    dataKey="count" nameKey="status">
                    {data.statusData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 11 }}
                    formatter={(val: number, name: string) => [val, statusLabels[name] ?? name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {data.statusData.map((s, idx) => (
                  <div key={s.status} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="text-gray-500">{statusLabels[s.status] ?? s.status}</span>
                    <span className="text-gray-900 font-semibold mr-auto">{s.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات</div>
          )}
        </div>

        {/* Top services */}
        <div className="card">
          <h2 className="text-base font-bold text-gray-900 mb-4">أعلى الخدمات إنفاقاً</h2>
          {data.topServices.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.topServices} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: "#64748B", fontSize: 10 }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#fff", border: "1px solid #E2E8F0", borderRadius: 8, fontSize: 11 }}
                  formatter={(val: number) => [`$${val.toFixed(4)}`, "الإنفاق"]}
                />
                <Bar dataKey="spend" fill="#7C3AED" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-40 flex items-center justify-center text-gray-400 text-sm">لا توجد بيانات بعد</div>
          )}
        </div>
      </div>
    </div>
  );
}
