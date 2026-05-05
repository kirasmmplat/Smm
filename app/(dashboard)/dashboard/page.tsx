import { Wallet, Package, Clock3, CreditCard, PlusCircle, ClipboardList, Ticket, ShieldCheck, Bell, ArrowLeft, BadgeDollarSign, Users } from "lucide-react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  PENDING: "انتظار",
  IN_PROGRESS: "جاري",
  PROCESSING: "يُعالج",
  COMPLETED: "مكتمل",
  PARTIAL: "جزئي",
  CANCELED: "ملغي",
  REFUNDED: "مُسترد",
  FAILED: "فشل",
};

const statusColors: Record<string, string> = {
  PENDING: "badge-pending",
  IN_PROGRESS: "badge-pending",
  PROCESSING: "badge-pending",
  COMPLETED: "badge-active",
  PARTIAL: "badge-warning",
  CANCELED: "badge-danger",
  REFUNDED: "badge-danger",
  FAILED: "badge-danger",
};

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");
  if (session.user.role === "ADMIN") redirect("/admin");

  const [user, recentOrders, stats] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: { accountLevel: true },
    }),
    prisma.order.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        service: {
          include: {
            serviceType: {
              include: {
                category: {
                  include: { platform: { select: { name: true, icon: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: { userId: session.user.id },
      _count: true,
    }),
  ]);

  if (!user) redirect("/login");

  const statMap = Object.fromEntries(stats.map((s) => [s.status, s._count]));
  const totalOrders = stats.reduce((s, c) => s + c._count, 0);
  const completedOrders = statMap["COMPLETED"] ?? 0;
  const activeOrders =
    (statMap["PENDING"] ?? 0) + (statMap["IN_PROGRESS"] ?? 0) + (statMap["PROCESSING"] ?? 0);

  const balance = parseFloat(user.balance.toString());
  const totalSpent = parseFloat(user.totalSpent.toString());

  return (
    <div>
      <div className="mb-8 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-3xl p-5 sm:p-6 md:p-8 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <p className="text-violet-100 text-sm font-medium">لوحتك الشخصية</p>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">مرحباً، {user.name}</h1>
            <p className="text-violet-100 mt-2 max-w-2xl">
              هذه نظرة عملية على رصيدك ونشاطك السريع وطرق الوصول إلى أهم المهام.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { label: "طلبات مكتملة", value: completedOrders, icon: Package },
              { label: "طلبات نشطة", value: activeOrders, icon: Clock3 },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-2xl px-4 py-3">
                <div className="flex items-center gap-2 text-violet-100 text-xs mb-1">
                  <item.icon size={14} />
                  {item.label}
                </div>
                <div className="text-white text-xl font-black">{item.value.toLocaleString()}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat-card col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">رصيدك الحالي</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600"><Wallet size={18} /></div>
          </div>
          <p className="text-3xl font-black text-emerald-600" dir="ltr">
            ${balance.toFixed(2)}
          </p>
          <Link
            href="/dashboard/add-funds"
            className="text-xs text-violet-600 hover:underline font-semibold mt-1 inline-block"
          >
            + شحن الرصيد
          </Link>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">إجمالي الطلبات</span>
            <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center text-violet-600"><Package size={18} /></div>
          </div>
          <p className="text-3xl font-black text-gray-900">{totalOrders}</p>
          <p className="text-xs text-gray-400 mt-1">طلب إجمالي</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">طلبات نشطة</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600"><Clock3 size={18} /></div>
          </div>
          <p className="text-3xl font-black text-amber-600">{activeOrders}</p>
          <p className="text-xs text-gray-400 mt-1">قيد التنفيذ</p>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-500">إجمالي الإنفاق</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><CreditCard size={18} /></div>
          </div>
          <p className="text-3xl font-black text-blue-600" dir="ltr">
            ${totalSpent.toFixed(2)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{completedOrders} طلب مكتمل</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="card border-violet-200 bg-violet-50/60">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-violet-700">إجمالي الأرباح/الاستفادة</span>
            <BadgeDollarSign size={18} className="text-violet-600" />
          </div>
          <p className="text-2xl font-black text-violet-700 mt-3" dir="ltr">${totalSpent.toFixed(2)}</p>
        </div>
        <div className="card border-emerald-200 bg-emerald-50/60">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-emerald-700">عميل/نشاط</span>
            <Users size={18} className="text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-3">{user ? "نشط" : "جديد"}</p>
        </div>
        <div className="card border-blue-200 bg-blue-50/60">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-blue-700">اختصار الطلب الجديد</span>
            <ArrowLeft size={18} className="text-blue-600" />
          </div>
          <Link href="/dashboard/new-order" className="text-blue-700 font-bold text-sm mt-3 inline-flex items-center gap-1 hover:underline">
            إنشاء طلب الآن
          </Link>
        </div>
      </div>

      {/* Account Level Banner */}
      {user.accountLevel && (
        <div className="card mb-8 bg-gradient-to-r from-violet-600 to-purple-700 text-white border-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-violet-200 text-sm font-medium">مستوى حسابك</p>
              <p className="text-2xl font-black mt-1">
                {user.accountLevel.icon} {user.accountLevel.name}
              </p>
              <p className="text-violet-200 text-sm mt-1">
                خصم {user.accountLevel.discountPercent}% على جميع الخدمات
              </p>
            </div>
            <div className="text-right">
              <p className="text-violet-200 text-xs">الإنفاق المطلوب للمستوى التالي</p>
              <p className="text-white font-bold text-sm mt-1" dir="ltr">
                ${(parseFloat(user.accountLevel.minSpent.toString()) - totalSpent).toFixed(2)} متبقي
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { href: "/dashboard/new-order", icon: PlusCircle, label: "طلب جديد", bg: "bg-violet-50 border-violet-200 hover:bg-violet-100" },
          { href: "/dashboard/orders", icon: ClipboardList, label: "طلباتي", bg: "bg-blue-50 border-blue-200 hover:bg-blue-100" },
          { href: "/dashboard/add-funds", icon: CreditCard, label: "شحن رصيد", bg: "bg-emerald-50 border-emerald-200 hover:bg-emerald-100" },
          { href: "/dashboard/tickets", icon: Ticket, label: "الدعم", bg: "bg-amber-50 border-amber-200 hover:bg-amber-100" },
        ].map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className={`${a.bg} border rounded-2xl p-5 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5`}
          >
            <div className="flex justify-center mb-2 text-gray-700"><a.icon size={28} /></div>
            <div className="text-sm font-bold text-gray-700">{a.label}</div>
          </Link>
        ))}
      </div>

      {/* API Key */}
      {user.apiKey && (
        <div className="card mb-8 bg-violet-50/80 border-violet-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-violet-700 flex items-center gap-2"><ShieldCheck size={16} /> مفتاح API الخاص بك</span>
            <Link href="/dashboard/api" className="text-xs text-violet-600 hover:underline">
              إدارة API
            </Link>
          </div>
          <p className="font-mono text-violet-800 text-sm break-all bg-white border border-violet-200 rounded-xl px-4 py-2.5" dir="ltr">
            {user.apiKey.substring(0, 20)}••••••••••••••••••••••••••••
          </p>
        </div>
      )}

      {/* Recent Orders */}
      <div className="card">
        <div className="page-header">
          <h2 className="section-title">آخر الطلبات</h2>
          <Link href="/dashboard/orders" className="text-sm text-violet-600 font-semibold hover:underline">
            عرض الكل ←
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2 flex justify-center"><Bell size={34} /></div>
            <p className="text-gray-500 font-medium">لا توجد طلبات بعد</p>
            <Link href="/dashboard/new-order" className="text-violet-600 font-bold hover:underline text-sm mt-1 inline-block">
              أنشئ طلبك الأول الآن →
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {recentOrders.map((o) => (
                <Link key={o.id} href={`/dashboard/orders/${o.id}`} className="block border border-violet-100 rounded-2xl p-4 hover:border-violet-300 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-gray-800 truncate">{o.service.name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {o.service.serviceType.category.platform.icon}{" "}
                        {o.service.serviceType.category.platform.name}
                      </div>
                    </div>
                    <span className={statusColors[o.status] ?? "badge-inactive"}>
                      {statusLabels[o.status] ?? o.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>الكمية: <strong className="text-gray-700">{o.quantity.toLocaleString("ar")}</strong></span>
                    <span className="text-emerald-600 font-bold" dir="ltr">${parseFloat(o.charge.toString()).toFixed(4)}</span>
                    <span>{new Date(o.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الخدمة</th>
                      <th>الكمية</th>
                      <th>المبلغ</th>
                      <th>الحالة</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td>
                          <div className="text-sm font-medium text-gray-800 max-w-[200px] truncate">
                            {o.service.name}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {o.service.serviceType.category.platform.icon}{" "}
                            {o.service.serviceType.category.platform.name}
                          </div>
                        </td>
                        <td className="font-medium">{o.quantity.toLocaleString("ar")}</td>
                        <td className="text-emerald-600 font-semibold" dir="ltr">
                          ${parseFloat(o.charge.toString()).toFixed(4)}
                        </td>
                        <td>
                          <span className={statusColors[o.status] ?? "badge-inactive"}>
                            {statusLabels[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="text-gray-400 text-xs">
                          {new Date(o.createdAt).toLocaleDateString("ar-SA")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
