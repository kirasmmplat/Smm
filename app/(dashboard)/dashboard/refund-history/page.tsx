import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function RefundHistoryPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const refunds = await prisma.transaction.findMany({
    where: { userId: session.user.id, type: "REFUND" },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const totalRefunded = refunds
    .filter((r) => r.status === "COMPLETED")
    .reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">سجل الاسترداد</h1>
        <p className="text-gray-500 mt-1">
          إجمالي المبالغ المستردة:{" "}
          <span className="text-emerald-600 font-bold" dir="ltr">${totalRefunded.toFixed(2)}</span>
        </p>
      </div>

      {refunds.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">↩️</div>
          <h3 className="text-lg font-bold text-gray-700">لا توجد مبالغ مستردة</h3>
          <p className="text-gray-400 mt-2 text-sm">تظهر هنا المبالغ المستردة من الطلبات الجزئية أو الملغاة</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {refunds.map((r, i) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-xs">#{i + 1}</span>
                  <span className="text-emerald-600 font-black" dir="ltr">+${Number(r.amount).toFixed(2)}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-400">الرصيد قبل</span>
                    <div className="font-mono text-gray-700 mt-0.5" dir="ltr">${Number(r.balanceBefore).toFixed(2)}</div>
                  </div>
                  <div>
                    <span className="text-gray-400">الرصيد بعد</span>
                    <div className="font-mono text-gray-700 mt-0.5" dir="ltr">${Number(r.balanceAfter).toFixed(2)}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-400">الملاحظات</span>
                    <div className="text-gray-600 mt-0.5">{r.notes ?? "استرداد"}</div>
                  </div>
                  <div className="col-span-2 text-gray-400">{new Date(r.createdAt).toLocaleString("ar-SA")}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>المبلغ</th>
                  <th>الرصيد قبل</th>
                  <th>الرصيد بعد</th>
                  <th>الملاحظات</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r, i) => (
                  <tr key={r.id}>
                    <td className="text-gray-400 text-sm">{i + 1}</td>
                    <td>
                      <span className="text-emerald-600 font-bold" dir="ltr">+${Number(r.amount).toFixed(2)}</span>
                    </td>
                    <td className="font-mono text-sm text-gray-600" dir="ltr">${Number(r.balanceBefore).toFixed(2)}</td>
                    <td className="font-mono text-sm text-gray-600" dir="ltr">${Number(r.balanceAfter).toFixed(2)}</td>
                    <td className="text-sm text-gray-500">{r.notes ?? "استرداد"}</td>
                    <td className="text-sm text-gray-500 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleString("ar-SA")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
