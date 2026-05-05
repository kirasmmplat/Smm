import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Wallet, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";

const typeLabels: Record<string, string> = {
  DEPOSIT: "إيداع",
  WITHDRAWAL: "سحب",
  ORDER_CHARGE: "خصم طلب",
  REFUND: "استرداد",
  BONUS: "مكافأة",
  REFERRAL_EARNING: "عمولة إحالة",
  ADMIN_ADJUST: "تعديل إداري",
};

const typeColors: Record<string, string> = {
  DEPOSIT: "text-emerald-600",
  WITHDRAWAL: "text-red-600",
  ORDER_CHARGE: "text-red-600",
  REFUND: "text-emerald-600",
  BONUS: "text-violet-600",
  REFERRAL_EARNING: "text-blue-600",
  ADMIN_ADJUST: "text-amber-600",
};

const typePrefix: Record<string, string> = {
  DEPOSIT: "+",
  WITHDRAWAL: "-",
  ORDER_CHARGE: "-",
  REFUND: "+",
  BONUS: "+",
  REFERRAL_EARNING: "+",
  ADMIN_ADJUST: "",
};

const statusColors: Record<string, string> = {
  COMPLETED: "badge-active",
  PENDING: "badge-pending",
  FAILED: "badge-danger",
  REJECTED: "badge-danger",
};

const statusLabels: Record<string, string> = {
  COMPLETED: "مكتمل",
  PENDING: "انتظار",
  FAILED: "فشل",
  REJECTED: "مرفوض",
};

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; type?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const page = Math.max(1, parseInt(searchParams.page ?? "1"));
  const perPage = 20;
  const skip = (page - 1) * perPage;
  const typeFilter = searchParams.type;

  const where = {
    userId: session.user.id,
    ...(typeFilter ? { type: typeFilter as never } : {}),
  };

  const [transactions, total, summary] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: perPage,
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ["type"],
      where: { userId: session.user.id, status: "COMPLETED" },
      _sum: { amount: true },
    }),
  ]);

  const totalPages = Math.ceil(total / perPage);
  const summaryMap = Object.fromEntries(
    summary.map((s) => [s.type, Number(s._sum.amount ?? 0)])
  );

  const totalDeposited = (summaryMap["DEPOSIT"] ?? 0) + (summaryMap["BONUS"] ?? 0);
  const totalSpent = summaryMap["ORDER_CHARGE"] ?? 0;
  const totalRefunded = (summaryMap["REFUND"] ?? 0) + (summaryMap["REFERRAL_EARNING"] ?? 0);

  return (
    <div className="max-w-3xl">
      <div className="mb-6 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-3xl p-6 shadow-lg">
        <h1 className="text-2xl font-black">سجل المعاملات</h1>
        <p className="text-violet-100 text-sm mt-1">كل حركات رصيدك في مكان واحد</p>
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-violet-100 text-xs">إجمالي الإيداعات</div>
            <div className="text-white font-black text-sm mt-1" dir="ltr">${totalDeposited.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-violet-100 text-xs">إجمالي الإنفاق</div>
            <div className="text-white font-black text-sm mt-1" dir="ltr">${totalSpent.toFixed(2)}</div>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 text-center">
            <div className="text-violet-100 text-xs">المسترد</div>
            <div className="text-white font-black text-sm mt-1" dir="ltr">${totalRefunded.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap mb-5">
        {[
          { label: "الكل", value: "" },
          { label: "إيداعات", value: "DEPOSIT" },
          { label: "طلبات", value: "ORDER_CHARGE" },
          { label: "استردادات", value: "REFUND" },
          { label: "مكافآت", value: "BONUS" },
        ].map((f) => (
          <Link
            key={f.value}
            href={`/dashboard/transactions${f.value ? `?type=${f.value}` : ""}`}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
              (typeFilter ?? "") === f.value
                ? "bg-violet-600 text-white border-violet-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-700"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="card">
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <Wallet size={36} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">لا توجد معاملات بعد</p>
            <Link href="/dashboard/add-funds" className="text-violet-600 font-semibold text-sm mt-2 inline-block hover:underline">
              شحن الرصيد الآن
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((t) => (
              <div key={t.id} className="py-3.5 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                  typePrefix[t.type] === "+" ? "bg-emerald-50" : "bg-red-50"
                }`}>
                  {typePrefix[t.type] === "+" ? (
                    <TrendingUp size={16} className="text-emerald-600" />
                  ) : (
                    <TrendingDown size={16} className="text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">
                    {typeLabels[t.type] ?? t.type}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    {t.notes ?? t.paymentMethod ?? "—"} · {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={statusColors[t.status] ?? "badge-pending"}>
                    {statusLabels[t.status] ?? t.status}
                  </span>
                  <span className={`font-black text-sm ${typeColors[t.type] ?? "text-gray-700"}`} dir="ltr">
                    {typePrefix[t.type]}{Math.abs(parseFloat(t.amount.toString())).toFixed(2)}$
                  </span>
                  <a
                    href={`/api/transactions/${t.id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-300 hover:text-violet-500 transition-colors"
                    title="فاتورة PDF"
                  >
                    <ArrowRight size={14} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          {page > 1 && (
            <Link
              href={`/dashboard/transactions?page=${page - 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              السابق
            </Link>
          )}
          <span className="text-sm text-gray-500 px-3">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/dashboard/transactions?page=${page + 1}${typeFilter ? `&type=${typeFilter}` : ""}`}
              className="btn-secondary px-4 py-2 text-sm"
            >
              التالي
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
