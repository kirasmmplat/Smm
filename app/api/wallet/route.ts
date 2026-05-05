import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const userData = await prisma.user.findUnique({
    where: { id: user!.id },
    select: {
      balance: true,
      totalSpent: true,
      discountPercent: true,
      accountLevel: { select: { id: true, name: true, slug: true, color: true, icon: true, discountPercent: true } },
    },
  });

  if (!userData) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  const deposited = await prisma.transaction.aggregate({
    where: { userId: user!.id, type: "DEPOSIT", status: "COMPLETED" },
    _sum: { amount: true },
  });

  return NextResponse.json({
    balance: Number(userData.balance),
    totalSpent: Number(userData.totalSpent),
    totalDeposited: Number(deposited._sum.amount ?? 0),
    discountPercent: userData.discountPercent,
    accountLevel: userData.accountLevel,
  });
}
