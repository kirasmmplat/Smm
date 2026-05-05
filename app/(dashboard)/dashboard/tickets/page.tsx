"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

type Ticket = { id: string; subject: string; status: string; priority: string; createdAt: string; updatedAt: string; _count: { messages: number }; messages: Array<{ message: string; isAdminReply: boolean }> };

const statusLabels: Record<string, string> = { OPEN: "مفتوح", PENDING_REPLY: "بانتظار الرد", CLOSED: "مغلق" };

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newForm, setNewForm] = useState({ subject: "", message: "", priority: "NORMAL" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/tickets");
    const data = await res.json() as Ticket[];
    setTickets(data);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function onCreate() {
    if (!newForm.subject || !newForm.message) { setError("الرجاء ملء جميع الحقول"); return; }
    setCreating(true); setError("");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newForm),
    });
    if (res.ok) { setShowNew(false); setNewForm({ subject: "", message: "", priority: "NORMAL" }); void load(); }
    else { const d = await res.json() as { message: string }; setError(d.message ?? "خطأ"); }
    setCreating(false);
  }

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">الدعم الفني</h1>
          <p className="text-gray-500 mt-1">تواصل معنا لأي استفسار أو مشكلة</p>
        </div>
        <button onClick={() => setShowNew(true)} className="btn-primary self-start sm:self-auto">تذكرة جديدة</button>
      </div>

      {/* New Ticket Modal */}
      {showNew && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowNew(false)}>
          <div className="bg-white border border-violet-100 rounded-2xl shadow-2xl p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-black text-gray-900 mb-5">تذكرة دعم جديدة</h2>
            <div className="space-y-4">
              <div>
                <label className="input-label">الموضوع</label>
                <input className="input-field" placeholder="اكتب موضوع التذكرة..." value={newForm.subject} onChange={(e) => setNewForm((p) => ({ ...p, subject: e.target.value }))} />
              </div>
              <div>
                <label className="input-label">الأولوية</label>
                <select className="input-field" value={newForm.priority} onChange={(e) => setNewForm((p) => ({ ...p, priority: e.target.value }))}>
                  <option value="LOW">منخفضة</option>
                  <option value="NORMAL">عادية</option>
                  <option value="HIGH">عالية</option>
                  <option value="URGENT">عاجلة</option>
                </select>
              </div>
              <div>
                <label className="input-label">الرسالة</label>
                <textarea className="input-field h-28 resize-none" placeholder="اشرح مشكلتك بالتفصيل..." value={newForm.message} onChange={(e) => setNewForm((p) => ({ ...p, message: e.target.value }))} />
              </div>
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}
              <div className="flex gap-3">
                <button onClick={onCreate} disabled={creating} className="btn-primary flex-1">{creating ? "جاري الإرسال..." : "إرسال التذكرة"}</button>
                <button onClick={() => setShowNew(false)} className="btn-secondary px-6">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((t) => (
            <Link key={t.id} href={`/dashboard/tickets/${t.id}`} className="card block hover:shadow-md hover:border-violet-200 transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold ${t.status === "OPEN" ? "text-emerald-600" : t.status === "PENDING_REPLY" ? "text-violet-600" : "text-gray-400"}`}>
                      ● {statusLabels[t.status] ?? t.status}
                    </span>
                    <span className="text-gray-400 text-xs font-mono">#{t.id.slice(-6)}</span>
                  </div>
                  <div className="text-gray-900 font-semibold">{t.subject}</div>
                  {t.messages[0] && <div className="text-gray-500 text-sm mt-1 line-clamp-1">{t.messages[0].message}</div>}
                </div>
                <div className="text-left shrink-0 mr-4">
                  <div className="text-gray-400 text-xs">{t._count.messages} رسائل</div>
                  <div className="text-gray-400 text-xs mt-1">{new Date(t.updatedAt).toLocaleDateString("ar-SA")}</div>
                </div>
              </div>
            </Link>
          ))}
          {tickets.length === 0 && (
            <div className="card text-center py-16">
              <div className="text-5xl mb-3">الدعم الفني</div>
              <p className="text-gray-500 font-medium">لا توجد تذاكر بعد</p>
              <button onClick={() => setShowNew(true)} className="text-violet-600 font-bold hover:underline text-sm mt-2">افتح أول تذكرة →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
