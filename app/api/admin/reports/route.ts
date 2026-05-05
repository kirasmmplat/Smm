import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const url = new URL(req.url);
  const period = url.searchParams.get("period") ?? "30";
  const days = Math.min(parseInt(period) || 30, 365);

  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const [
    ordersByDay,
    depositsByDay,
    topServices,
    topUsers,
    statusBreakdown,
    paymentMethodBreakdown,
    totalStats,
  ] = await Promise.all([
    prisma.$queryRaw<{ date: string; revenue: number; count: number }[]>`
      SELECT
        DATE(o."createdAt")::text AS date,
        COALESCE(SUM(CAST(o.charge AS numeric)), 0)::float AS revenue,
        COUNT(*)::int AS count
      FROM "Order" o
      JOIN "Service" s ON s.id = o."serviceId"
      JOIN "Provider" p ON p.id = o."providerId"
      WHERE o."createdAt" >= ${from} AND o.status NOT IN ('CANCELED', 'FAILED')
      GROUP BY DATE(o."createdAt")
      ORDER BY date ASC
    `,

    prisma.$queryRaw<{ date: string; amount: number; count: number }[]>`
      SELECT
        DATE(t."createdAt")::text AS date,
        COALESCE(SUM(CAST(t.amount AS numeric)), 0)::float AS amount,
        COUNT(*)::int AS count
      FROM "Transaction" t
      WHERE t.type = 'DEPOSIT' AND t.status = 'COMPLETED' AND t."createdAt" >= ${from}
      GROUP BY DATE(t."createdAt")
      ORDER BY date ASC
    `,

    prisma.$queryRaw<{ serviceId: string; name: string; revenue: number; orders: number }[]>`
      SELECT
        s.id AS "serviceId",
        s.name,
        COALESCE(SUM(CAST(o.charge AS numeric)), 0)::float AS revenue,
        COUNT(o.id)::int AS orders
      FROM "Order" o
      JOIN "Service" s ON s.id = o."serviceId"
      WHERE o."createdAt" >= ${from} AND o.status NOT IN ('CANCELED', 'FAILED')
      GROUP BY s.id, s.name
      ORDER BY revenue DESC
      LIMIT 10
    `,

    prisma.$queryRaw<{ userId: string; name: string; email: string; revenue: number; orders: number }[]>`
      SELECT
        u.id AS "userId",
        u.name,
        u.email,
        COALESCE(SUM(CAST(o.charge AS numeric)), 0)::float AS revenue,
        COUNT(o.id)::int AS orders
      FROM "Order" o
      JOIN "User" u ON u.id = o."userId"
      WHERE o."createdAt" >= ${from} AND o.status NOT IN ('CANCELED', 'FAILED')
      GROUP BY u.id, u.name, u.email
      ORDER BY revenue DESC
      LIMIT 10
    `,

    prisma.order.groupBy({
      by: ["status"],
      where: { createdAt: { gte: from } },
      _count: true,
      _sum: { charge: true },
    }),

    prisma.$queryRaw<{ method: string; amount: number; count: number }[]>`
      SELECT
        COALESCE(t."paymentMethod", 'manual') AS method,
        COALESCE(SUM(CAST(t.amount AS numeric)), 0)::float AS amount,
        COUNT(*)::int AS count
      FROM "Transaction" t
      WHERE t.type = 'DEPOSIT' AND t.status = 'COMPLETED' AND t."createdAt" >= ${from}
      GROUP BY t."paymentMethod"
      ORDER BY amount DESC
    `,

    prisma.$queryRaw<{ totalRevenue: number; totalDeposits: number; totalRefunds: number; totalOrders: number; newUsers: number }[]>`
      SELECT
        (SELECT COALESCE(SUM(CAST(charge AS numeric)), 0) FROM "Order" WHERE "createdAt" >= ${from} AND status NOT IN ('CANCELED','FAILED'))::float AS "totalRevenue",
        (SELECT COALESCE(SUM(CAST(amount AS numeric)), 0) FROM "Transaction" WHERE type='DEPOSIT' AND status='COMPLETED' AND "createdAt" >= ${from})::float AS "totalDeposits",
        (SELECT COALESCE(SUM(CAST(amount AS numeric)), 0) FROM "Transaction" WHERE type='REFUND' AND status='COMPLETED' AND "createdAt" >= ${from})::float AS "totalRefunds",
        (SELECT COUNT(*) FROM "Order" WHERE "createdAt" >= ${from})::int AS "totalOrders",
        (SELECT COUNT(*) FROM "User" WHERE "createdAt" >= ${from} AND role='USER')::int AS "newUsers"
    `,
  ]);

  const stats = totalStats[0] ?? { totalRevenue: 0, totalDeposits: 0, totalRefunds: 0, totalOrders: 0, newUsers: 0 };

  const revenueByDay = ordersByDay.map((d) => ({
    date: d.date,
    revenue: Number(d.revenue),
    orders: Number(d.count),
  }));

  const depositsByDayMapped = depositsByDay.map((d) => ({
    date: d.date,
    amount: Number(d.amount),
    count: Number(d.count),
  }));

  const statusStats = statusBreakdown.map((s) => ({
    status: s.status,
    count: s._count,
    total: Number(s._sum.charge ?? 0),
  }));

  return NextResponse.json({
    period: days,
    stats: {
      totalRevenue: Number(stats.totalRevenue),
      totalDeposits: Number(stats.totalDeposits),
      totalRefunds: Number(stats.totalRefunds),
      totalOrders: Number(stats.totalOrders),
      newUsers: Number(stats.newUsers),
      estimatedProfit: Number(stats.totalRevenue) * 0.3,
    },
    revenueByDay,
    depositsByDay: depositsByDayMapped,
    topServices: topServices.map((s) => ({ ...s, revenue: Number(s.revenue), orders: Number(s.orders) })),
    topUsers: topUsers.map((u) => ({ ...u, revenue: Number(u.revenue), orders: Number(u.orders) })),
    statusBreakdown: statusStats,
    paymentMethods: paymentMethodBreakdown.map((p) => ({ ...p, amount: Number(p.amount), count: Number(p.count) })),
  });
}
