"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Message = { id: string; message: string; isAdminReply: boolean; senderId: string; createdAt: string };
type Ticket = { id: string; subject: string; status: string; priority: string; user: { name: string; email: string }; messages: Message[] };

export default function AdminTicketDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/tickets/${id}`);
    const data = await res.json() as Ticket;
    setTicket(data);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true); setMsg("");
    const res = await fetch(`/api/admin/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    if (res.ok) { setReply(""); void load(); }
    else { setMsg("خطأ في الإرسال"); }
    setSending(false);
  }

  async function closeTicket() {
    await fetch(`/api/admin/tickets/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "CLOSED" }) });
    void load();
  }

  if (!ticket) return <div className="p-6 text-slate-400">جاري التحميل...</div>;

  const statusLabels: Record<string, string> = { OPEN: "مفتوح", PENDING_REPLY: "بانتظار الرد", CLOSED: "مغلق" };

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/tickets" className="text-slate-400 hover:text-white">←</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === "OPEN" ? "bg-green-900 text-green-400" : ticket.status === "PENDING_REPLY" ? "bg-indigo-900 text-indigo-400" : "bg-slate-700 text-slate-400"}`}>
              {statusLabels[ticket.status] ?? ticket.status}
            </span>
          </div>
          <p className="text-slate-400 text-sm mt-0.5">{ticket.user.name} — {ticket.user.email}</p>
        </div>
        {ticket.status !== "CLOSED" && (
          <button onClick={closeTicket} className="btn-secondary text-sm px-4 py-2">إغلاق التذكرة</button>
        )}
      </div>

      {/* Messages */}
      <div className="space-y-4 mb-6 max-h-[500px] overflow-y-auto">
        {ticket.messages.map((m) => (
          <div key={m.id} className={`flex ${m.isAdminReply ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.isAdminReply ? "bg-indigo-600/20 border border-indigo-500/30" : "bg-slate-700 border border-slate-600"}`}>
              <div className={`text-xs mb-1 ${m.isAdminReply ? "text-indigo-400" : "text-slate-400"}`}>
                {m.isAdminReply ? "فريق الدعم" : ticket.user.name}
              </div>
              <div className="text-white text-sm whitespace-pre-wrap">{m.message}</div>
              <div className="text-xs text-slate-500 mt-1">{new Date(m.createdAt).toLocaleString("ar")}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply */}
      {ticket.status !== "CLOSED" && (
        <div className="card">
          <h2 className="text-sm font-medium text-slate-400 mb-3">رد الدعم الفني</h2>
          <textarea
            className="input-field h-28 resize-none mb-3"
            placeholder="اكتب ردك هنا..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          {msg && <div className="text-red-400 text-sm mb-2">{msg}</div>}
          <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn-primary w-full py-3">
            {sending ? "جاري الإرسال..." : "إرسال الرد"}
          </button>
        </div>
      )}
    </div>
  );
}
