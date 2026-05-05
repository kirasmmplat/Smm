import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const order = await prisma.order.findFirst({
    where: { id: params.id, userId: user!.id },
    include: { service: true },
  });

  if (!order) return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
  if (order.status !== "PARTIAL" && order.status !== "COMPLETED") {
    return NextResponse.json({ message: "لا يمكن طلب إعادة تعبئة لهذا الطلب" }, { status: 400 });
  }
  if (!order.service.refill) {
    return NextResponse.json({ message: "هذه الخدمة لا تدعم إعادة التعبئة" }, { status: 400 });
  }

  const existingRefill = await prisma.refill.findFirst({
    where: { originalOrderId: params.id, status: { in: ["PENDING", "APPROVED"] } },
  });
  if (existingRefill) {
    return NextResponse.json({ message: "يوجد طلب إعادة تعبئة قيد المعالجة بالفعل" }, { status: 400 });
  }

  const refill = await prisma.refill.create({
    data: {
      originalOrderId: params.id,
      userId: user!.id,
      status: "PENDING",
      reason: "طلب إعادة تعبئة من المستخدم",
    },
  });

  await prisma.notification.create({
    data: {
      userId: user!.id,
      title: "تم إرسال طلب إعادة التعبئة",
      message: `تم استلام طلب إعادة التعبئة للطلب #${params.id.slice(-6)} وسيتم مراجعته`,
      type: "REFILL",
      link: `/dashboard/refills`,
    },
  });

  return NextResponse.json({ refill, message: "تم إرسال طلب إعادة التعبئة" }, { status: 201 });
}
