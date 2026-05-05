import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ConfirmDepositButton from "./ConfirmDepositButton";
import { CreditCard, Clock3, CheckCircle2, Wallet } from "lucide-react";

const typeLabels: Record<string, string> = {
  DEPOSIT: "إيداع", WITHDRAWAL: "سحب", ORDER_CHARGE: "طلب", REFUND: "استرداد", BONUS: "مكافأة", REFERRAL_EARNING: "عمولة", ADMIN_ADJUST: "تعديل",
};
const statusLabels: Record<string, string> = {
  PENDING: "انتظار", COMPLETED: "مكتمل", FAILED: "فشل", CANCELED: "ملغي",
};

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams?: { type?: string; status?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const page = parseInt(searchParams?.page ?? "1");
  const pageSize = 50;

  const where: Record<string, unknown> = {};
  if (searchParams?.type) where.type = searchParams.type;
  if (searchParams?.status) where.status = searchParams.status;

  const [transactions, total, stats, pendingDeposits] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.aggregate({ _sum: { amount: true }, where: { type: "DEPOSIT", status: "COMPLETED" } }),
    prisma.transaction.count({ where: { type: "DEPOSIT", status: "PENDING" } }),
  ]);

  const totalDeposited = stats._sum.amount ?? 0;
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">المعاملات المالية</h1>
          <p className="text-slate-400 mt-1">إجمالي: {total.toLocaleString()} معاملة</p>
        </div>
        {pendingDeposits > 0 && (
          <div className="bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg px-4 py-2 text-sm font-medium self-start sm:self-auto">
            {pendingDeposits} إيداع ينتظر التأكيد
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "إجمالي الإيداعات", value: parseFloat(totalDeposited.toString()).toFixed(2), icon: Wallet, tone: "text-emerald-300 bg-emerald-500/10" },
          { label: "معلقة", value: pendingDeposits, icon: Clock3, tone: "text-amber-300 bg-amber-500/10" },
          { label: "إجمالي المعاملات", value: total, icon: CreditCard, tone: "text-violet-300 bg-violet-500/10" },
          { label: "مكتملة", value: transactions.filter((t) => t.status === "COMPLETED").length, icon: CheckCircle2, tone: "text-cyan-300 bg-cyan-500/10" },
        ].map((item) => (
          <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-2xl p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.tone}`}>
              <item.icon size={18} />
            </div>
            <div>
              <div className="text-slate-400 text-xs">{item.label}</div>
              <div className="text-white font-black text-lg">{String(item.value).toLocaleString?.() ?? item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[
          { label: "الكل", type: "", status: "" },
          { label: "إيداعات معلقة", type: "DEPOSIT", status: "PENDING" },
          { label: "إيداعات مكتملة", type: "DEPOSIT", status: "COMPLETED" },
          { label: "طلبات", type: "ORDER_CHARGE", status: "" },
          { label: "استرداد", type: "REFUND", status: "" },
          { label: "مكافآت", type: "BONUS", status: "" },
        ].map((f) => {
          const active = (searchParams?.type ?? "") === f.type && (searchParams?.status ?? "") === f.status;
          const params = new URLSearchParams();
          if (f.type) params.set("type", f.type);
          if (f.status) params.set("status", f.status);
          return (
            <Link key={f.label} href={`/admin/transactions?${params.toString()}`}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${active ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
              {f.label}
            </Link>
          );
        })}
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3 mb-4">
        {transactions.map((t) => (
          <div key={t.id} className={`bg-slate-800 border rounded-2xl p-4 ${t.type === "DEPOSIT" && t.status === "PENDING" ? "border-yellow-500/40" : "border-slate-700"}`}>
            <div className="flex justify-between items-start gap-2 mb-2">
              <div>
                <div className="text-slate-200 text-sm font-medium">{t.user.name}</div>
                <div className="text-slate-500 text-xs">{t.user.email}</div>
              </div>
              <span className={t.status === "COMPLETED" ? "badge-active" : t.status === "PENDING" ? "badge-pending" : "badge-danger"}>
                {statusLabels[t.status] ?? t.status}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${["DEPOSIT","BONUS","REFUND"].includes(t.type) ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"}`}>
                  {typeLabels[t.type] ?? t.type}
                </span>
                <span className={`text-sm font-bold ${t.type === "ORDER_CHARGE" ? "text-red-400" : "text-green-400"}`} dir="ltr">
                  {t.type === "ORDER_CHARGE" ? "-" : "+"}${parseFloat(t.amount.toString()).toFixed(2)}
                </span>
              </div>
              <span className="text-slate-500 text-xs">{new Date(t.createdAt).toLocaleDateString("ar")}</span>
            </div>
            {t.type === "DEPOSIT" && t.status === "PENDING" && (
              <div className="mt-3">
                <ConfirmDepositButton transactionId={t.id} userId={t.userId} amount={parseFloat(t.amount.toString())} />
              </div>
            )}
          </div>
        ))}
        {transactions.length === 0 && (
          <div className="text-center text-slate-500 py-10 bg-slate-800 rounded-2xl">لا توجد معاملات</div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block card p-0 overflow-hidden">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>النوع</th>
                <th>المبلغ</th>
                <th>الرصيد قبل</th>
                <th>الرصيد بعد</th>
                <th>الطريقة</th>
                <th>الحالة</th>
                <th>ملاحظات</th>
                <th>التاريخ</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id} className={t.type === "DEPOSIT" && t.status === "PENDING" ? "bg-yellow-500/5" : ""}>
                  <td>
                    <div className="text-slate-200 text-sm">{t.user.name}</div>
                    <div className="text-slate-500 text-xs">{t.user.email}</div>
                  </td>
                  <td>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      ["DEPOSIT","BONUS","REFUND"].includes(t.type) ? "text-green-400 bg-green-400/10" : "text-red-400 bg-red-400/10"
                    }`}>
                      {typeLabels[t.type] ?? t.type}
                    </span>
                  </td>
                  <td className={`font-medium text-sm ${t.type === "ORDER_CHARGE" ? "text-red-400" : "text-green-400"}`} dir="ltr">
                    {t.type === "ORDER_CHARGE" ? "-" : "+"}${parseFloat(t.amount.toString()).toFixed(2)}
                  </td>
                  <td className="text-slate-400 text-sm" dir="ltr">${parseFloat(t.balanceBefore.toString()).toFixed(2)}</td>
                  <td className="text-slate-300 text-sm" dir="ltr">${parseFloat(t.balanceAfter.toString()).toFixed(2)}</td>
                  <td className="text-slate-500 text-sm">{t.paymentMethod ?? "—"}</td>
                  <td>
                    <span className={t.status === "COMPLETED" ? "badge-active" : t.status === "PENDING" ? "badge-pending" : "badge-danger"}>
                      {statusLabels[t.status] ?? t.status}
                    </span>
                  </td>
                  <td className="text-slate-500 text-xs max-w-[120px] truncate">{t.notes ?? "—"}</td>
                  <td className="text-slate-500 text-xs">{new Date(t.createdAt).toLocaleDateString("ar")}</td>
                  <td>
                    {t.type === "DEPOSIT" && t.status === "PENDING" ? (
                      <ConfirmDepositButton
                        transactionId={t.id}
                        userId={t.userId}
                        amount={parseFloat(t.amount.toString())}
                      />
                    ) : <span className="text-slate-700">—</span>}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={10} className="text-center text-slate-500 py-10">لا توجد معاملات</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => {
            const params = new URLSearchParams(searchParams as Record<string, string>);
            params.set("page", String(p));
            return (
              <Link key={p} href={`/admin/transactions?${params.toString()}`}
                className={`w-8 h-8 rounded flex items-center justify-center text-sm ${p === page ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-400 hover:text-white"}`}>
                {p}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
