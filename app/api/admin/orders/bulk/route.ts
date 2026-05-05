import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { ids, status } = await req.json() as { ids: string[]; status: string };

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ message: "لم يتم تحديد أي طلبات" }, { status: 400 });
  }
  if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
    return NextResponse.json({ message: "حالة غير صالحة" }, { status: 400 });
  }

  // Handle refund logic for REFUNDED / CANCELED status
  if (status === "REFUNDED" || status === "CANCELED") {
    const ordersToRefund = await prisma.order.findMany({
      where: {
        id: { in: ids },
        status: { notIn: ["REFUNDED", "CANCELED", "COMPLETED"] },
      },
    });

    await prisma.$transaction(async (tx) => {
      for (const order of ordersToRefund) {
        const charge = parseFloat(order.charge.toString());
        if (charge > 0) {
          const user = await tx.user.findUnique({ where: { id: order.userId }, select: { balance: true } });
          if (user) {
            const newBalance = parseFloat(user.balance.toString()) + charge;
            await tx.user.update({ where: { id: order.userId }, data: { balance: newBalance } });
            await tx.transaction.create({
              data: {
                userId: order.userId,
                type: "REFUND",
                amount: charge,
                balanceBefore: parseFloat(user.balance.toString()),
                balanceAfter: newBalance,
                status: "COMPLETED",
                notes: `استرداد تلقائي — طلب #${order.id.slice(-8)}`,
              },
            });
          }
        }
      }
      await tx.order.updateMany({
        where: { id: { in: ids } },
        data: { status: status as OrderStatus },
      });
    });
  } else {
    await prisma.order.updateMany({
      where: { id: { in: ids } },
      data: { status: status as OrderStatus },
    });
  }

  return NextResponse.json({ message: `تم تحديث ${ids.length} طلب إلى "${status}"`, updated: ids.length });
}
