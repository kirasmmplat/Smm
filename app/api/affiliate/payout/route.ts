import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { method, details } = body as { method?: string; details?: string };

  if (!method) return NextResponse.json({ message: "طريقة السحب مطلوبة" }, { status: 400 });

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: user!.id } });
  if (!affiliate) return NextResponse.json({ message: "لم يتم تفعيل نظام الإحالة" }, { status: 404 });

  const pending = Number(affiliate.pendingEarnings);
  if (pending < 5) {
    return NextResponse.json({ message: "الحد الأدنى للسحب هو $5" }, { status: 400 });
  }

  const userData = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { balance: true },
  });
  if (!userData) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  const newBalance = Number(userData.balance) + pending;
  const balanceBefore = Number(userData.balance);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user!.id },
      data: { balance: newBalance },
    }),
    prisma.affiliate.update({
      where: { userId: user!.id },
      data: {
        pendingEarnings: 0,
        totalEarnings: { increment: pending },
      },
    }),
    prisma.transaction.create({
      data: {
        userId: user!.id,
        type: "REFERRAL_EARNING",
        amount: pending,
        balanceBefore,
        balanceAfter: newBalance,
        status: "COMPLETED",
        notes: `أرباح الإحالة - ${method}${details ? ` (${details})` : ""}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: user!.id,
        title: "تم تحويل أرباح الإحالة",
        message: `تم إضافة $${pending.toFixed(2)} إلى رصيدك من أرباح الإحالة`,
        type: "AFFILIATE",
        link: "/dashboard/affiliate",
      },
    }),
  ]);

  return NextResponse.json({ message: "تم تحويل الأرباح إلى رصيدك بنجاح", amount: pending });
}
