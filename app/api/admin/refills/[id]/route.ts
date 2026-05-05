import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { RefillStatus } from "@prisma/client";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { status } = await req.json() as { status: string };

  if (!Object.values(RefillStatus).includes(status as RefillStatus)) {
    return NextResponse.json({ message: "حالة غير صالحة" }, { status: 400 });
  }

  const refill = await prisma.refill.update({
    where: { id: params.id },
    data: { status: status as RefillStatus },
  });

  if (status === "APPROVED" || status === "REJECTED") {
    await prisma.notification.create({
      data: {
        userId: refill.userId,
        title:
          status === "APPROVED"
            ? "تمت الموافقة على طلب إعادة التعبئة"
            : "تم رفض طلب إعادة التعبئة",
        message:
          status === "APPROVED"
            ? "تمت الموافقة على طلب إعادة التعبئة الخاص بك وسيتم تنفيذه قريباً"
            : "تم رفض طلب إعادة التعبئة الخاص بك",
        type: "REFILL",
        link: "/dashboard/refills",
      },
    });
  }

  return NextResponse.json({ refill });
}
