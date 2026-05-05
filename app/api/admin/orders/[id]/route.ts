import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { createAuditLog, getIpFromRequest } from "@/lib/audit";
import { OrderStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true, balance: true } },
      service: {
        include: {
          provider: { select: { id: true, name: true, url: true } },
          serviceType: {
            include: {
              category: { include: { platform: { select: { name: true, icon: true } } } },
            },
          },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });

  return NextResponse.json({
    ...order,
    charge: order.charge.toString(),
    user: { ...order.user, balance: order.user.balance.toString() },
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as {
    status?: string;
    remains?: number;
    startCount?: number;
    notes?: string;
  };

  const order = await prisma.order.findUnique({ where: { id: params.id } });
  if (!order) return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });

  const updates: Record<string, unknown> = {};

  if (body.status && Object.values(OrderStatus).includes(body.status as OrderStatus)) {
    updates.status = body.status;

    // Handle refund on CANCELED/REFUNDED
    if ((body.status === "REFUNDED" || body.status === "CANCELED") &&
        order.status !== "REFUNDED" && order.status !== "CANCELED" && order.status !== "COMPLETED") {
      const charge = parseFloat(order.charge.toString());
      if (charge > 0) {
        const user = await prisma.user.findUnique({ where: { id: order.userId }, select: { balance: true } });
        if (user) {
          const newBal = parseFloat(user.balance.toString()) + charge;
          await prisma.user.update({ where: { id: order.userId }, data: { balance: newBal } });
          await prisma.transaction.create({
            data: {
              userId: order.userId, type: "REFUND",
              amount: charge,
              balanceBefore: parseFloat(user.balance.toString()),
              balanceAfter: newBal,
              status: "COMPLETED",
              notes: `استرداد أدمن — طلب #${order.id.slice(-8)}`,
            },
          });
        }
      }
    }
  }

  if (typeof body.remains === "number") updates.remains = body.remains;
  if (typeof body.startCount === "number") updates.startCount = body.startCount;

  const updated = await prisma.order.update({
    where: { id: params.id },
    data: updates,
    select: { id: true, status: true, remains: true, startCount: true },
  });

  if (body.status && body.status !== order.status) {
    const ip = getIpFromRequest(req);
    void createAuditLog({ action: "ORDER_STATUS_CHANGED", userEmail: auth.user?.email ?? "admin", entity: "Order", entityId: params.id, ip, severity: body.status === "FAILED" || body.status === "CANCELED" ? "WARNING" : "INFO", details: { orderId: params.id, oldStatus: order.status, newStatus: body.status, userId: order.userId } });
  }

  return NextResponse.json(updated);
}
