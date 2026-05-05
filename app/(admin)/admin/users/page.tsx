"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Download, Users, UserCheck, UserX, ChevronRight, ChevronLeft, ShieldCheck, Wallet, ShoppingCart, Mail } from "lucide-react";
import { downloadCsv } from "@/lib/export";

interface User {
  id: string; name: string; email: string; username: string | null;
  role: string; status: string; balance: string; totalSpent: string;
  createdAt: string; lastLoginAt: string | null;
  _count: { orders: number; tickets: number };
}

const roleLabels: Record<string, string> = { ADMIN: "أدمن", USER: "مستخدم" };
const statusLabels: Record<string, string> = { ACTIVE: "نشط", BANNED: "محظور", SUSPENDED: "موقوف" };

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [exporting, setExporting] = useState(false);
  const LIMIT = 20;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterRole) params.set("role", filterRole);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json() as { users: User[]; pagination: { total: number } };
    setUsers(data.users ?? []);
    setTotal(data.pagination?.total ?? 0);
    setLoading(false);
  }, [page, search, filterStatus, filterRole]);

  useEffect(() => { void fetchUsers(); }, [fetchUsers]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, filterStatus, filterRole]);

  async function exportCsv() {
    setExporting(true);
    const params = new URLSearchParams({ page: "1", limit: "9999" });
    if (search) params.set("search", search);
    if (filterStatus) params.set("status", filterStatus);
    if (filterRole) params.set("role", filterRole);
    const res = await fetch(`/api/admin/users?${params}`);
    const data = await res.json() as { users: User[] };
    downloadCsv(
      data.users.map((u) => ({
        الاسم: u.name, البريد: u.email,
        الدور: roleLabels[u.role] ?? u.role,
        الحالة: statusLabels[u.status] ?? u.status,
        الرصيد: parseFloat(u.balance).toFixed(2),
        المنفق: parseFloat(u.totalSpent).toFixed(2),
        الطلبات: u._count.orders, التذاكر: u._count.tickets,
        التسجيل: new Date(u.createdAt).toLocaleDateString("ar"),
      })),
      "users"
    );
    setExporting(false);
  }

  const pages = Math.max(1, Math.ceil(total / LIMIT));
  const activeCount = users.filter((u) => u.status === "ACTIVE").length;
  const bannedCount = users.filter((u) => u.status === "BANNED").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-white">المستخدمون</h1>
          <p className="text-slate-400 mt-1 text-sm">{total.toLocaleString()} مستخدم مسجل</p>
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
          { label: "إجمالي النتائج", value: total, icon: Users, tone: "text-violet-300 bg-violet-500/10" },
          { label: "نشطون", value: activeCount, icon: UserCheck, tone: "text-emerald-300 bg-emerald-500/10" },
          { label: "محظورون", value: bannedCount, icon: UserX, tone: "text-red-300 bg-red-500/10" },
          { label: "أدمن", value: adminCount, icon: ShieldCheck, tone: "text-amber-300 bg-amber-500/10" },
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
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          <input
            type="text"
            placeholder="بحث بالاسم أو البريد..."
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
          <option value="ACTIVE">نشط</option>
          <option value="BANNED">محظور</option>
          <option value="SUSPENDED">موقوف</option>
        </select>
        <select
          className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:border-violet-500 focus:outline-none"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">كل الأدوار</option>
          <option value="USER">مستخدم</option>
          <option value="ADMIN">أدمن</option>
        </select>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { icon: Users, label: "الكل", value: total, color: "text-slate-300", bg: "bg-slate-700/50" },
          { icon: UserCheck, label: "نشط الفلتر", value: users.filter(u => u.status === "ACTIVE").length, color: "text-emerald-400", bg: "bg-emerald-500/10" },
          { icon: UserX, label: "محظور الفلتر", value: users.filter(u => u.status === "BANNED").length, color: "text-red-400", bg: "bg-red-500/10" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} border border-slate-700/60 rounded-xl p-3 flex items-center gap-2`}>
            <s.icon size={16} className={s.color} />
            <div>
              <p className={`text-base font-black ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => <div key={i} className="h-14 bg-slate-800 rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {users.map((u) => (
              <div key={u.id} className="bg-slate-800 border border-slate-700 rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="text-white font-semibold">{u.name}</div>
                    <div className="text-slate-400 text-xs">{u.email}</div>
                  </div>
                  <span className={u.status === "ACTIVE" ? "badge-active" : u.status === "BANNED" ? "badge-danger" : "badge-pending"}>
                    {statusLabels[u.status] ?? u.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs mb-3">
                  <span className={u.role === "ADMIN" ? "text-purple-400" : "text-slate-400"}>{roleLabels[u.role] ?? u.role}</span>
                  <span className="text-slate-500">رصيد: <span className="text-green-400" dir="ltr">${parseFloat(u.balance).toFixed(2)}</span></span>
                  <span className="text-slate-500">طلبات: <span className="text-indigo-400">{u._count.orders}</span></span>
                </div>
                <Link href={`/admin/users/${u.id}`} className="btn-secondary text-xs py-1.5 text-center w-full block">إدارة</Link>
              </div>
            ))}
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-slate-800 rounded-2xl">لا يوجد مستخدمون</div>
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr className="text-slate-400">
                  {["المستخدم", "الدور", "الرصيد", "المنفق", "الطلبات", "التذاكر", "الحالة", "تاريخ التسجيل", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-right font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-700/40 transition-colors">
                    <td className="px-4 py-3">
                      <div className="text-white font-medium">{u.name}</div>
                      <div className="text-slate-500 text-xs">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold ${u.role === "ADMIN" ? "text-purple-400" : "text-slate-400"}`}>
                        {roleLabels[u.role] ?? u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-green-400 font-medium" dir="ltr">${parseFloat(u.balance).toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-400" dir="ltr">${parseFloat(u.totalSpent).toFixed(2)}</td>
                    <td className="px-4 py-3 text-indigo-400 font-semibold">{u._count.orders}</td>
                    <td className="px-4 py-3 text-yellow-400">{u._count.tickets}</td>
                    <td className="px-4 py-3">
                      <span className={u.status === "ACTIVE" ? "badge-active" : u.status === "BANNED" ? "badge-danger" : "badge-pending"}>
                        {statusLabels[u.status] ?? u.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {new Date(u.createdAt).toLocaleDateString("ar")}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${u.id}`} className="text-violet-400 hover:text-violet-300 text-xs font-semibold">إدارة</Link>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-16 text-slate-500">لا يوجد مستخدمون</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <span className="text-slate-500 text-sm">
                عرض {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} من {total.toLocaleString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-secondary p-2 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                    let pageNum: number;
                    if (pages <= 5) pageNum = i + 1;
                    else if (page <= 3) pageNum = i + 1;
                    else if (page >= pages - 2) pageNum = pages - 4 + i;
                    else pageNum = page - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                          page === pageNum
                            ? "bg-violet-600 text-white"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="btn-secondary p-2 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
