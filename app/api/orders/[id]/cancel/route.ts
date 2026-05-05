import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: user!.id },
    include: { service: true, provider: true },
  });

  if (!order) return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });

  // يمكن الإلغاء فقط إذا كان PENDING ولم يُرسل للمزود بعد
  if (order.status !== "PENDING") {
    const msgMap: Record<string, string> = {
      IN_PROGRESS: "لا يمكن الإلغاء — الطلب قيد التنفيذ عند المزود",
      PROCESSING: "لا يمكن الإلغاء — الطلب يُعالج عند المزود",
      COMPLETED: "لا يمكن الإلغاء — الطلب مكتمل بالفعل",
      PARTIAL: "لا يمكن الإلغاء — الطلب مكتمل جزئياً",
      CANCELED: "الطلب ملغي بالفعل",
      FAILED: "الطلب فشل بالفعل",
    };
    return NextResponse.json({
      message: msgMap[order.status] ?? "لا يمكن إلغاء هذا الطلب",
    }, { status: 400 });
  }

  // إذا أُرسل للمزود وله providerOrderId
  if (order.providerOrderId && order.provider) {
    // إذا كانت الخدمة تدعم الإلغاء، نرسل طلب إلغاء للمزود
    if (order.service.cancel) {
      try {
        await fetch(order.provider.url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: order.provider.apiKey,
            action: "cancel",
            orders: order.providerOrderId,
          }),
          signal: AbortSignal.timeout(10000),
        });
      } catch {
        // نكمل حتى لو فشل طلب الإلغاء عند المزود
      }
    } else {
      return NextResponse.json({
        message: "هذه الخدمة لا تدعم الإلغاء بعد الإرسال للمزود",
      }, { status: 400 });
    }
  }

  // نُلغي الطلب ونُعيد الرصيد
  const currentUser = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { balance: true },
  });
  if (!currentUser) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  const refundAmount = parseFloat(order.charge.toString());
  const newBalance = Number(currentUser.balance) + refundAmount;

  await prisma.$transaction([
    prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELED" },
    }),
    prisma.user.update({
      where: { id: user!.id },
      data: { balance: newBalance, totalSpent: { decrement: refundAmount } },
    }),
    prisma.transaction.create({
      data: {
        userId: user!.id,
        type: "REFUND",
        amount: refundAmount,
        balanceBefore: Number(currentUser.balance),
        balanceAfter: newBalance,
        status: "COMPLETED",
        notes: `استرداد كامل — إلغاء الطلب #${order.id.slice(-6)}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: user!.id,
        title: "تم إلغاء الطلب ↩️",
        message: `تم إلغاء الطلب #${order.id.slice(-6)} واسترداد $${refundAmount.toFixed(4)} لرصيدك`,
        type: "ORDER_UPDATE",
        link: `/dashboard/orders/${order.id}`,
      },
    }),
  ]);

  return NextResponse.json({
    message: "تم إلغاء الطلب واسترداد رصيدك بنجاح",
    refunded: refundAmount,
  });
}
