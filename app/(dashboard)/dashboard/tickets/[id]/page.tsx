"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";

type Message = { id: string; message: string; isAdminReply: boolean; senderId: string; createdAt: string };
type Ticket = { id: string; subject: string; status: string; user: { name: string }; messages: Message[] };

export default function TicketDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { data: session } = useSession();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tickets/${id}`);
    const data = await res.json() as Ticket;
    setTicket(data);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  async function sendReply() {
    if (!reply.trim()) return;
    setSending(true);
    const res = await fetch(`/api/tickets/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: reply }),
    });
    if (res.ok) { setReply(""); void load(); }
    setSending(false);
  }

  if (!ticket) return <div className="p-6 text-slate-400">جاري التحميل...</div>;

  const statusLabels: Record<string, string> = { OPEN: "مفتوح", PENDING_REPLY: "بانتظار الرد", CLOSED: "مغلق" };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/tickets" className="text-gray-500 hover:text-violet-600 transition-colors font-medium">← الدعم الفني</Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-gray-900">{ticket.subject}</h1>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${ticket.status === "OPEN" ? "bg-emerald-100 text-emerald-700" : ticket.status === "PENDING_REPLY" ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"}`}>
              {statusLabels[ticket.status] ?? ticket.status}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mb-6 max-h-[520px] overflow-y-auto">
        {ticket.messages.map((m) => (
          <div key={m.id} className={`flex ${m.isAdminReply ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${m.isAdminReply ? "bg-violet-50 border border-violet-200" : "bg-gray-100 border border-gray-200"}`}>
              <div className={`text-xs font-semibold mb-1.5 ${m.isAdminReply ? "text-violet-600" : "text-gray-500"}`}>
                {m.isAdminReply ? "فريق الدعم" : session?.user?.name ?? "أنت"}
              </div>
              <div className="text-gray-800 text-sm whitespace-pre-wrap">{m.message}</div>
              <div className="text-xs text-gray-400 mt-1.5">{new Date(m.createdAt).toLocaleString("ar-SA")}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {ticket.status !== "CLOSED" ? (
        <div className="card">
          <textarea
            className="input-field h-24 resize-none mb-3"
            placeholder="اكتب ردك هنا..."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <button onClick={sendReply} disabled={sending || !reply.trim()} className="btn-primary w-full">
            {sending ? "جاري الإرسال..." : "إرسال الرد"}
          </button>
        </div>
      ) : (
        <div className="card text-center py-6">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gray-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          </div>
          <p className="text-gray-500 font-medium">هذه التذكرة مغلقة</p>
        </div>
      )}
    </div>
  );
}
