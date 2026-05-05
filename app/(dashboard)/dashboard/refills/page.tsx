import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusLabel: Record<string, { label: string; cls: string }> = {
  PENDING: { label: "قيد المراجعة", cls: "badge-pending" },
  APPROVED: { label: "موافق عليه", cls: "badge-active" },
  REJECTED: { label: "مرفوض", cls: "badge-danger" },
  COMPLETED: { label: "مكتمل", cls: "badge-active" },
};

export default async function RefillsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const refills = await prisma.refill.findMany({
    where: { userId: session.user.id },
    include: {
      originalOrder: {
        include: { service: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">إعادة التعبئة</h1>
        <p className="text-gray-500 mt-1">طلبات إعادة تعبئة الخدمات المضمونة</p>
      </div>

      {refills.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700">لا توجد طلبات إعادة تعبئة</h3>
          <p className="text-gray-400 mt-2 text-sm">يمكنك طلب إعادة التعبئة من صفحة تفاصيل الطلب للخدمات المضمونة</p>
          <Link href="/dashboard/orders" className="btn-primary mt-4 inline-block">عرض طلباتي</Link>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>الطلب الأصلي</th>
                <th>الخدمة</th>
                <th>الحالة</th>
                <th>السبب</th>
                <th>التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {refills.map((r) => {
                const s = statusLabel[r.status] ?? { label: r.status, cls: "badge-pending" };
                return (
                  <tr key={r.id}>
                    <td>
                      <Link href={`/dashboard/orders/${r.originalOrderId}`} className="text-violet-600 hover:underline font-mono text-sm">
                        #{r.originalOrderId.slice(-8).toUpperCase()}
                      </Link>
                    </td>
                    <td className="text-sm">{r.originalOrder?.service?.name ?? "—"}</td>
                    <td><span className={s.cls}>{s.label}</span></td>
                    <td className="text-sm text-gray-500">{r.reason ?? "—"}</td>
                    <td className="text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
