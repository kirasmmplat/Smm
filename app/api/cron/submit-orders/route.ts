import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// يُرسل الطلبات PENDING للمزود ويحفظ providerOrderId
export async function GET(req: Request) {
  // Vercel Cron يرسل Authorization: Bearer <CRON_SECRET>
  // أو نقبل طلب Vercel المباشر عبر header خاص
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "cron-secret-smm";
  const vercelCron = req.headers.get("x-vercel-cron");

  if (!vercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // نجيب الطلبات PENDING التي لم تُرسل للمزود بعد
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: "PENDING",
      providerOrderId: null,
    },
    include: {
      provider: true,
      service: { select: { providerServiceId: true, name: true } },
    },
    take: 100,
  });

  if (pendingOrders.length === 0) {
    return NextResponse.json({ submitted: 0, message: "No pending orders to submit" });
  }

  let submitted = 0;
  let failed = 0;

  for (const order of pendingOrders) {
    if (!order.provider || order.provider.status !== "ACTIVE") continue;
    if (!order.service.providerServiceId) continue;

    try {
      const res = await fetch(order.provider.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: order.provider.apiKey,
          action: "add",
          service: order.service.providerServiceId,
          link: order.link,
          quantity: order.quantity,
        }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) {
        failed++;
        continue;
      }

      const data = await res.json() as { order?: number | string; error?: string };

      if (data.order) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            providerOrderId: String(data.order),
            status: "IN_PROGRESS",
          },
        });
        submitted++;
      } else {
        // إذا كان فيه error من المزود
        console.error(`Provider error for order ${order.id}:`, data.error);
        await prisma.order.update({
          where: { id: order.id },
          data: { status: "FAILED" },
        });
        failed++;
      }
    } catch (e) {
      console.error(`Failed to submit order ${order.id}:`, e);
      failed++;
    }
  }

  return NextResponse.json({
    submitted,
    failed,
    checked: pendingOrders.length,
    timestamp: new Date().toISOString(),
  });
}
