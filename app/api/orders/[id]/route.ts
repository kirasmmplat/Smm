import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

/** Sync order status with provider in real-time */
async function syncWithProvider(order: any) {
  if (!order.providerOrderId || !order.service?.provider) return order;
  const activeStatuses = ["PENDING", "IN_PROGRESS", "PROCESSING"];
  // Also sync if startCount is missing (even for completed orders)
  if (!activeStatuses.includes(order.status) && order.startCount !== null) return order;

  const provider = order.service.provider;
  if (!provider.url || !provider.apiKey) return order;

  try {
    const res = await fetch(provider.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: provider.apiKey, action: "status", orders: order.providerOrderId }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return order;
    const data = await res.json();
    const info = data[order.providerOrderId];
    if (!info) return order;

    const raw = String(info.status ?? "").toLowerCase();
    let newStatus = order.status;
    if (raw === "completed") newStatus = "COMPLETED";
    else if (raw === "in progress" || raw === "inprogress") newStatus = "IN_PROGRESS";
    else if (raw === "processing") newStatus = "PROCESSING";
    else if (raw === "partial") newStatus = "PARTIAL";
    else if (raw === "canceled" || raw === "cancelled") newStatus = "CANCELED";
    else if (raw === "failed") newStatus = "FAILED";

    const updates: any = {};
    if (newStatus !== order.status) updates.status = newStatus;
    if (info.start_count) updates.startCount = Number(info.start_count);
    if (info.remains !== undefined) updates.remains = Number(info.remains);

    if (Object.keys(updates).length > 0) {
      const updated = await prisma.order.update({ where: { id: order.id }, data: updates });
      return { ...order, ...updated };
    }
  } catch {
    // Silently fail — return cached data
  }
  return order;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      service: {
        include: {
          provider: { select: { name: true, url: true, apiKey: true } },
          serviceType: { include: { category: { include: { platform: { select: { name: true, icon: true } } } } } },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });

  if (auth.user.role !== "ADMIN" && order.userId !== auth.user.id) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }

  // Real-time sync with provider
  const synced = await syncWithProvider(order);

  // Remove sensitive provider data before sending
  const { service, ...rest } = synced;
  const { provider, ...serviceRest } = service;
  const safeProvider = { name: provider?.name, url: provider?.url };

  return NextResponse.json({ ...rest, service: { ...serviceRest, provider: safeProvider } });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  if (auth.user.role !== "ADMIN") {
    return NextResponse.json({ message: "للأدمن فقط" }, { status: 403 });
  }

  const body = await req.json() as {
    status?: string;
    remains?: number;
    startCount?: number;
    providerOrderId?: string;
  };

  const order = await prisma.order.update({
    where: { id: params.id },
    data: {
      ...(body.status && { status: body.status as "PENDING" | "IN_PROGRESS" | "PROCESSING" | "COMPLETED" | "PARTIAL" | "CANCELED" | "REFUNDED" | "FAILED" }),
      ...(body.remains !== undefined && { remains: body.remains }),
      ...(body.startCount !== undefined && { startCount: body.startCount }),
      ...(body.providerOrderId && { providerOrderId: body.providerOrderId }),
    },
  });

  return NextResponse.json(order);
}
