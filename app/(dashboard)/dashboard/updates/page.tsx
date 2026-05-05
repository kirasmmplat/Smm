import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

const changeTypeLabel: Record<string, { label: string; cls: string }> = {
  PRICE_UP: { label: "ارتفاع السعر", cls: "text-red-600" },
  PRICE_DOWN: { label: "انخفاض السعر", cls: "text-emerald-600" },
  DISABLED: { label: "تم التعطيل", cls: "text-gray-500" },
  ENABLED: { label: "تم التفعيل", cls: "text-violet-600" },
  MIN_CHANGED: { label: "تغيير الحد الأدنى", cls: "text-amber-600" },
  MAX_CHANGED: { label: "تغيير الحد الأقصى", cls: "text-amber-600" },
  DESCRIPTION_UPDATED: { label: "تحديث الوصف", cls: "text-blue-600" },
};

export default async function UpdatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const updates = await prisma.serviceUpdate.findMany({
    include: { service: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">تحديثات الخدمات</h1>
        <p className="text-gray-500 mt-1">سجل بجميع تغييرات الأسعار والخدمات</p>
      </div>

      {updates.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700">لا توجد تحديثات حتى الآن</h3>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {updates.map((u) => {
              const ct = changeTypeLabel[u.changeType] ?? { label: u.changeType, cls: "text-gray-600" };
              return (
                <div key={u.id} className="card">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="text-sm font-semibold text-gray-800 line-clamp-1 flex-1">{u.service?.name ?? "—"}</div>
                    <span className={`text-xs font-semibold shrink-0 ${ct.cls}`}>{ct.label}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    {u.oldValue && (
                      <span>قبل: <span className="font-mono text-gray-600">{u.oldValue}</span></span>
                    )}
                    {u.newValue && (
                      <span>بعد: <span className="font-mono text-gray-800 font-semibold">{u.newValue}</span></span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1.5">{new Date(u.createdAt).toLocaleString("ar-SA")}</div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الخدمة</th>
                  <th>نوع التغيير</th>
                  <th>القيمة القديمة</th>
                  <th>القيمة الجديدة</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {updates.map((u) => {
                  const ct = changeTypeLabel[u.changeType] ?? { label: u.changeType, cls: "text-gray-600" };
                  return (
                    <tr key={u.id}>
                      <td className="text-sm font-medium text-gray-800">{u.service?.name ?? "—"}</td>
                      <td><span className={`text-sm font-semibold ${ct.cls}`}>{ct.label}</span></td>
                      <td className="text-sm text-gray-500 font-mono">{u.oldValue ?? "—"}</td>
                      <td className="text-sm font-mono text-gray-800">{u.newValue ?? "—"}</td>
                      <td className="text-sm text-gray-500 whitespace-nowrap">
                        {new Date(u.createdAt).toLocaleString("ar-SA")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
