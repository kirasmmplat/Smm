import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

async function testDatabase() {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: "ok", latency: Date.now() - start, message: "الاتصال بقاعدة البيانات ناجح" };
  } catch (e: any) {
    return { status: "error", latency: Date.now() - start, message: e.message };
  }
}

async function testProvider(providerId: string) {
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return { status: "error", message: "المزود غير موجود" };

  const start = Date.now();
  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ key: provider.apiKey, action: "balance" }).toString(),
      signal: AbortSignal.timeout(8000),
    });
    const latency = Date.now() - start;
    if (!res.ok) return { status: "error", latency, message: `HTTP ${res.status}`, provider: provider.name };
    const data = await res.json();
    return {
      status: data.error ? "error" : "ok",
      latency,
      message: data.error ?? "متصل",
      balance: data.balance,
      currency: data.currency,
      provider: provider.name,
    };
  } catch (e: any) {
    return { status: "error", latency: Date.now() - start, message: e.message, provider: provider.name };
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const type = url.searchParams.get("type") ?? "all";

  if (type === "provider") {
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const result = await testProvider(id);
    return NextResponse.json(result);
  }

  const [dbResult, users, orders, services, pendingOrders, failedOrders, openTickets, pendingTx, providers] =
    await Promise.all([
      testDatabase(),
      prisma.user.count(),
      prisma.order.count(),
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.order.count({ where: { status: { in: ["PENDING", "IN_PROGRESS", "PROCESSING"] } } }),
      prisma.order.count({ where: { status: "FAILED" } }),
      prisma.ticket.count({ where: { status: "OPEN" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.provider.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true, url: true, apiKey: true, status: true },
      }),
    ]);

  // Try fetching recent error logs — may not exist yet if DB just migrated
  let recentErrors: unknown[] = [];
  try {
    recentErrors = await (prisma as any).auditLog.findMany({
      where: { severity: { in: ["ERROR", "CRITICAL"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { action: true, userEmail: true, details: true, createdAt: true, severity: true },
    });
  } catch {
    recentErrors = [];
  }

  return NextResponse.json({
    database: dbResult,
    stats: { users, orders, services, pendingOrders, failedOrders, openTickets, pendingTx },
    providers: providers.map((p) => ({
      id: p.id,
      name: p.name,
      status: p.status,
      apiUrl: p.url.replace(/https?:\/\//, "").split("/")[0],
    })),
    recentErrors,
    serverTime: new Date().toISOString(),
    nodeVersion: process.version,
    memoryUsage: process.memoryUsage(),
  });
}
