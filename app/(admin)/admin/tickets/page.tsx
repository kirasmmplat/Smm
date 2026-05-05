import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Ticket, MessageSquareMore, Clock3, CircleAlert, CheckCircle2 } from "lucide-react";

const statusLabels: Record<string, string> = { OPEN: "مفتوح", PENDING_REPLY: "بانتظار الرد", CLOSED: "مغلق" };
const priorityLabels: Record<string, string> = { LOW: "منخفض", NORMAL: "عادي", HIGH: "عالي", URGENT: "عاجل" };
const priorityColors: Record<string, string> = { LOW: "text-slate-400", NORMAL: "text-blue-400", HIGH: "text-orange-400", URGENT: "text-red-400" };

export default async function AdminTicketsPage() {
  const auth = await requireAdmin();
  if ("error" in auth) redirect("/login");

  const tickets = await prisma.ticket.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">الدعم الفني</h1>
            <p className="text-slate-400 mt-1">{tickets.filter((t) => t.status === "OPEN").length} تذكرة مفتوحة</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { label: "مفتوحة", value: tickets.filter((t) => t.status === "OPEN").length, icon: Ticket, tone: "text-emerald-300 bg-emerald-500/10" },
            { label: "بانتظار الرد", value: tickets.filter((t) => t.status === "PENDING_REPLY").length, icon: Clock3, tone: "text-amber-300 bg-amber-500/10" },
            { label: "عاجلة", value: tickets.filter((t) => t.priority === "URGENT").length, icon: CircleAlert, tone: "text-red-300 bg-red-500/10" },
            { label: "رسائل", value: tickets.reduce((s, t) => s + t._count.messages, 0), icon: MessageSquareMore, tone: "text-violet-300 bg-violet-500/10" },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${item.tone}`}>
                <item.icon size={16} />
              </div>
              <div>
                <div className="text-slate-400 text-xs">{item.label}</div>
                <div className="text-white font-black">{item.value.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {tickets.map((t) => (
          <Link key={t.id} href={`/admin/tickets/${t.id}`} className="card block hover:border-indigo-500/40 transition-colors">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
                  <span className={`text-xs font-medium ${t.status === "OPEN" ? "text-green-400" : t.status === "PENDING_REPLY" ? "text-indigo-400" : "text-slate-500"}`}>
                    ● {statusLabels[t.status] ?? t.status}
                  </span>
                  <span className={`text-xs ${priorityColors[t.priority] ?? "text-slate-400"}`}>
                    {priorityLabels[t.priority] ?? t.priority}
                  </span>
                  <span className="text-slate-500 text-xs">#{t.id.slice(-6)}</span>
                </div>
                <div className="text-white font-medium">{t.subject}</div>
                <div className="text-slate-500 text-xs mt-1">{t.user.name} — {t.user.email}</div>
                <div className="text-slate-400 text-sm mt-1 line-clamp-1">{t.messages[0]?.message ?? "لا توجد رسالة حديثة"}</div>
              </div>
              <div className="text-left shrink-0">
                <div className="text-slate-400 text-xs">{t._count.messages} رسائل</div>
                <div className="text-slate-500 text-xs mt-1">{new Date(t.updatedAt).toLocaleDateString("ar")}</div>
              </div>
            </div>
          </Link>
        ))}
        {tickets.length === 0 && (
          <div className="card text-center text-slate-400 py-12">لا توجد تذاكر</div>
        )}
      </div>
    </div>
  );
}
