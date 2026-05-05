import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const userId = auth.user.id;

  // Last 30 days daily spending
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [recentOrders, statusDist, topServices, monthlySpend] = await Promise.all([
    // Orders grouped by day for last 30 days
    prisma.order.findMany({
      where: { userId, createdAt: { gte: thirtyDaysAgo }, status: { in: ["COMPLETED", "PARTIAL", "IN_PROGRESS", "PROCESSING"] } },
      select: { createdAt: true, charge: true, status: true },
      orderBy: { createdAt: "asc" },
    }),
    // Status distribution
    prisma.order.groupBy({
      by: ["status"],
      where: { userId },
      _count: true,
    }),
    // Top 5 services by spend
    prisma.order.groupBy({
      by: ["serviceId"],
      where: { userId, status: { in: ["COMPLETED", "PARTIAL"] } },
      _sum: { charge: true },
      _count: true,
      orderBy: { _sum: { charge: "desc" } },
      take: 5,
    }),
    // This month spend
    prisma.order.aggregate({
      where: {
        userId,
        status: { in: ["COMPLETED", "PARTIAL", "IN_PROGRESS", "PROCESSING"] },
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { charge: true },
      _count: true,
    }),
  ]);

  // Build daily chart data
  const dailyMap = new Map<string, number>();
  for (const o of recentOrders) {
    const day = o.createdAt.toISOString().slice(0, 10);
    dailyMap.set(day, (dailyMap.get(day) ?? 0) + o.charge.toNumber());
  }

  // Fill last 30 days
  const dailyData: { date: string; spend: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dailyData.push({ date: key.slice(5), spend: parseFloat((dailyMap.get(key) ?? 0).toFixed(4)) });
  }

  // Get service names for top services
  const serviceIds = topServices.map((s) => s.serviceId);
  const services = await prisma.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  });
  const serviceMap = new Map(services.map((s) => [s.id, s.name]));

  const topServiceData = topServices.map((s) => ({
    name: (serviceMap.get(s.serviceId) ?? "خدمة").slice(0, 30),
    spend: parseFloat((s._sum.charge?.toNumber() ?? 0).toFixed(4)),
    orders: s._count,
  }));

  const statusData = statusDist.map((s) => ({ status: s.status, count: s._count }));

  return NextResponse.json({
    dailyData,
    statusData,
    topServices: topServiceData,
    monthlySpend: parseFloat((monthlySpend._sum.charge?.toNumber() ?? 0).toFixed(4)),
    monthlyOrders: monthlySpend._count,
  });
}
