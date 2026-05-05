"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Refill {
  id: string;
  originalOrderId: string;
  userId: string;
  status: string;
  reason: string | null;
  createdAt: string;
  userName?: string;
  serviceName?: string;
}

const statusColors: Record<string, string> = {
  PENDING: "bg-amber-900/30 text-amber-400",
  APPROVED: "bg-blue-900/30 text-blue-400",
  REJECTED: "bg-red-900/30 text-red-400",
  COMPLETED: "bg-emerald-900/30 text-emerald-400",
};
const statusLabels: Record<string, string> = {
  PENDING: "معلق", APPROVED: "موافق", REJECTED: "مرفوض", COMPLETED: "مكتمل",
};

export default function AdminRefillsPage() {
  const [refills, setRefills] = useState<Refill[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchRefills = async () => {
    const res = await fetch("/api/admin/refills");
    const data = await res.json();
    setRefills(data.refills ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchRefills(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    await fetch(`/api/admin/refills/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchRefills();
    setUpdating(null);
  };

  const pending = refills.filter((r) => r.status === "PENDING").length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-white">طلبات إعادة التعبئة</h1>
          <p className="text-slate-400 mt-1">
            {pending > 0 ? <span className="text-amber-400 font-semibold">{pending} طلب معلق</span> : `${refills.length} طلب إجمالاً`}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-700">
              <tr className="text-slate-400">
                {["رقم الطلب", "الحالة", "السبب", "التاريخ", "إجراءات"].map((h) => (
                  <th key={h} className="text-right px-4 py-3 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {refills.map((r) => (
                <tr key={r.id} className="hover:bg-slate-700/50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${r.originalOrderId}`} className="text-violet-400 hover:text-violet-300 font-mono text-xs">
                      #{r.originalOrderId.slice(-8).toUpperCase()}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${statusColors[r.status] ?? ""}`}>
                      {statusLabels[r.status] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{r.reason ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                    {new Date(r.createdAt).toLocaleString("ar-SA")}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(r.id, "APPROVED")}
                          disabled={updating === r.id}
                          className="text-xs bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 px-2 py-1 rounded-lg font-semibold transition"
                        >
                          موافقة
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "REJECTED")}
                          disabled={updating === r.id}
                          className="text-xs bg-red-900/30 text-red-400 hover:bg-red-900/50 px-2 py-1 rounded-lg font-semibold transition"
                        >
                          رفض
                        </button>
                      </div>
                    )}
                    {r.status === "APPROVED" && (
                      <button
                        onClick={() => updateStatus(r.id, "COMPLETED")}
                        disabled={updating === r.id}
                        className="text-xs bg-blue-900/30 text-blue-400 hover:bg-blue-900/50 px-2 py-1 rounded-lg font-semibold transition"
                      >
                        تعليم كمكتمل
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {refills.length === 0 && <div className="text-center py-12 text-slate-500">لا توجد طلبات إعادة تعبئة</div>}
        </div>
      )}
    </div>
  );
}
