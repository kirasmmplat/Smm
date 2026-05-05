import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const yesterdayEnd = new Date(todayStart); yesterdayEnd.setMilliseconds(-1);

  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    return d;
  });

  const [
    totalUsers, totalOrders, activeOrders, openTickets,
    totalRevenue, totalServices, totalProviders,
    newUsersToday, revenueToday,
    newUsersYesterday, revYesterday, ordersYesterday,
    pendingDeposits,
    recentOrders,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: { in: ["PENDING", "IN_PROGRESS", "PROCESSING"] } } }),
    prisma.ticket.count({ where: { status: "OPEN" } }),
    prisma.order.aggregate({ where: { status: { in: ["COMPLETED", "PARTIAL"] } }, _sum: { charge: true } }),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.provider.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.order.aggregate({
      where: { status: { in: ["COMPLETED", "PARTIAL"] }, createdAt: { gte: todayStart } },
      _sum: { charge: true },
    }),
    prisma.user.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    prisma.order.aggregate({
      where: { status: { in: ["COMPLETED", "PARTIAL"] }, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
      _sum: { charge: true },
    }),
    prisma.order.count({ where: { createdAt: { gte: yesterdayStart, lte: yesterdayEnd } } }),
    prisma.transaction.count({ where: { type: "DEPOSIT", status: "PENDING" } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
        service: { select: { name: true } },
      },
    }),
  ]);

  const dailyChartData = await Promise.all(
    last7.map(async (day) => {
      const start = new Date(day); start.setHours(0, 0, 0, 0);
      const end = new Date(day); end.setHours(23, 59, 59, 999);
      const [rev, orders, users] = await Promise.all([
        prisma.order.aggregate({
          where: { status: { in: ["COMPLETED", "PARTIAL"] }, createdAt: { gte: start, lte: end } },
          _sum: { charge: true },
        }),
        prisma.order.count({ where: { createdAt: { gte: start, lte: end } } }),
        prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
      ]);
      return {
        date: day.toLocaleDateString("ar-SA", { weekday: "short", day: "numeric" }),
        revenue: parseFloat(rev._sum.charge?.toString() ?? "0"),
        orders,
        users,
      };
    })
  );

  const statusDist = await prisma.order.groupBy({
    by: ["status"],
    _count: { status: true },
  });

  // compute deltas
  const revTodayVal = parseFloat(revenueToday._sum.charge?.toString() ?? "0");
  const revYesterdayVal = parseFloat(revYesterday._sum.charge?.toString() ?? "0");
  const totalOrdersToday = dailyChartData[dailyChartData.length - 1]?.orders ?? 0;

  function pct(today: number, yesterday: number) {
    if (yesterday === 0) return today > 0 ? 100 : 0;
    return Math.round(((today - yesterday) / yesterday) * 100);
  }

  return NextResponse.json({
    totalUsers, totalOrders, activeOrders, openTickets,
    totalRevenue: totalRevenue._sum.charge?.toString() ?? "0",
    totalServices, totalProviders,
    newUsersToday, revenueToday: revTodayVal.toString(),
    pendingDeposits,
    deltas: {
      revenue: pct(revTodayVal, revYesterdayVal),
      orders: pct(totalOrdersToday, ordersYesterday),
      users: pct(newUsersToday, newUsersYesterday),
    },
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      serviceName: o.service.name,
      userName: o.user.name,
      userEmail: o.user.email,
      charge: o.charge.toString(),
      quantity: o.quantity,
      status: o.status,
      createdAt: o.createdAt.toISOString(),
    })),
    dailyChartData,
    statusDist: statusDist.map((s) => ({ status: s.status, count: s._count.status })),
  });
}
