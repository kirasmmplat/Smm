import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendOrderCompletedEmail } from "@/lib/email";
import { sendOrderUpdateTelegram } from "@/lib/telegram";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "cron-secret-smm";
  const vercelCron = req.headers.get("x-vercel-cron");

  if (!vercelCron && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pendingOrders = await prisma.order.findMany({
    where: {
      status: { in: ["PENDING", "IN_PROGRESS", "PROCESSING"] },
      providerOrderId: { not: null },
    },
    include: {
      provider: true,
      service: { select: { name: true, ourRate: true } },
      user: {
        select: {
          id: true, email: true, name: true,
          emailNotifications: true,
          telegramChatId: true, telegramNotifications: true,
        },
      },
    },
    take: 200,
  });

  if (pendingOrders.length === 0) {
    return NextResponse.json({ updated: 0, message: "No pending orders" });
  }

  const byProvider = new Map<string, typeof pendingOrders>();
  for (const order of pendingOrders) {
    const key = order.providerId;
    if (!byProvider.has(key)) byProvider.set(key, []);
    byProvider.get(key)!.push(order);
  }

  let totalUpdated = 0;

  for (const [, orders] of byProvider) {
    const provider = orders[0].provider;
    if (!provider || provider.status !== "ACTIVE") continue;

    const ids = orders.map((o) => o.providerOrderId).filter(Boolean).join(",");

    try {
      const res = await fetch(provider.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: provider.apiKey, action: "status", orders: ids }),
        signal: AbortSignal.timeout(15000),
      });

      if (!res.ok) continue;
      const data = await res.json();

      for (const order of orders) {
        if (!order.providerOrderId) continue;
        const info = data[order.providerOrderId];
        if (!info) continue;

        let newStatus = order.status;
        const raw = String(info.status ?? "").toLowerCase();

        if (raw === "completed") newStatus = "COMPLETED";
        else if (raw === "in progress" || raw === "inprogress") newStatus = "IN_PROGRESS";
        else if (raw === "processing") newStatus = "PROCESSING";
        else if (raw === "partial") newStatus = "PARTIAL";
        else if (raw === "canceled" || raw === "cancelled") newStatus = "CANCELED";
        else if (raw === "failed") newStatus = "FAILED";

        // Always update start_count and remains if provider returns them
        const hasDataUpdate = info.start_count || info.remains;
        const hasStatusChange = newStatus !== order.status;
        
        if (hasStatusChange || hasDataUpdate) {
          await prisma.order.update({
            where: { id: order.id },
            data: {
              ...(hasStatusChange ? { status: newStatus } : {}),
              startCount: info.start_count ? Number(info.start_count) : order.startCount,
              remains: info.remains ? Number(info.remains) : order.remains,
            },
          });

          const terminalStatuses = ["COMPLETED", "PARTIAL", "CANCELED", "FAILED"];
          if (terminalStatuses.includes(newStatus)) {
            await prisma.notification.create({
              data: {
                userId: order.userId,
                title: newStatus === "COMPLETED" ? "تم إكمال طلبك ✅" : `تحديث طلبك #${order.id.slice(-6)}`,
                message:
                  newStatus === "COMPLETED" ? "تم تنفيذ الطلب بنجاح"
                  : newStatus === "PARTIAL" ? "تم تنفيذ الطلب جزئياً"
                  : newStatus === "CANCELED" ? "تم إلغاء الطلب"
                  : "فشل تنفيذ الطلب",
                type: "ORDER_UPDATE",
                link: `/dashboard/orders/${order.id}`,
              },
            });

            // Email notification
            if (order.user.emailNotifications) {
              void sendOrderCompletedEmail({
                to: order.user.email,
                name: order.user.name,
                orderId: order.id,
                serviceName: order.service.name,
                quantity: order.quantity,
                charge: parseFloat(order.charge.toString()),
                status: newStatus,
              });
            }

            // Telegram notification
            if (order.user.telegramNotifications && order.user.telegramChatId) {
              void sendOrderUpdateTelegram({
                chatId: order.user.telegramChatId,
                orderId: order.id,
                serviceName: order.service.name,
                quantity: order.quantity,
                charge: parseFloat(order.charge.toString()),
                status: newStatus,
              });
            }
          }

          // Partial refund
          if (newStatus === "PARTIAL" && order.remains && order.remains > 0) {
            const refundAmount = (Number(order.service.ourRate) * order.remains) / 1000;
            if (refundAmount > 0) {
              const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { balance: true } });
              if (user) {
                const newBalance = Number(user.balance) + refundAmount;
                await prisma.$transaction([
                  prisma.user.update({ where: { id: order.userId }, data: { balance: newBalance } }),
                  prisma.transaction.create({
                    data: {
                      userId: order.userId, type: "REFUND",
                      amount: refundAmount,
                      balanceBefore: Number(user.balance),
                      balanceAfter: newBalance,
                      status: "COMPLETED",
                      notes: `استرداد جزئي للطلب #${order.id.slice(-6)}`,
                    },
                  }),
                ]);
              }
            }
          }

          totalUpdated++;
        }
      }
    } catch {
      continue;
    }
  }

  return NextResponse.json({
    updated: totalUpdated,
    checked: pendingOrders.length,
    timestamp: new Date().toISOString(),
  });
}
