import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { amount, type, notes } = await req.json() as {
    amount: number;
    type: "ADD" | "DEDUCT" | "SET";
    notes?: string;
  };

  if (typeof amount !== "number" || isNaN(amount)) {
    return NextResponse.json({ message: "المبلغ غير صالح" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: params.id }, select: { id: true, balance: true } });
  if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  const currentBalance = parseFloat(user.balance.toString());
  let newBalance: number;

  if (type === "SET") newBalance = amount;
  else if (type === "DEDUCT") newBalance = currentBalance - Math.abs(amount);
  else newBalance = currentBalance + Math.abs(amount);

  if (newBalance < 0) return NextResponse.json({ message: "الرصيد لا يمكن أن يكون سالباً" }, { status: 400 });

  const [updatedUser] = await prisma.$transaction([
    prisma.user.update({
      where: { id: params.id },
      data: { balance: newBalance },
      select: { id: true, balance: true },
    }),
    prisma.transaction.create({
      data: {
        userId: params.id,
        type: "ADMIN_ADJUST",
        amount: Math.abs(type === "DEDUCT" ? -amount : amount),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        status: "COMPLETED",
        notes: notes ?? `تعديل يدوي من الأدمن (${type === "ADD" ? "إضافة" : type === "DEDUCT" ? "خصم" : "تحديد"})`,
      },
    }),
  ]);

  await prisma.notification.create({
    data: {
      userId: params.id,
      title: "تعديل في رصيدك",
      message: `تم ${type === "ADD" ? "إضافة" : type === "DEDUCT" ? "خصم" : "تحديد"} $${Math.abs(amount).toFixed(2)} ${notes ? `— ${notes}` : ""}`,
      type: "SYSTEM",
    },
  });

  return NextResponse.json({ user: updatedUser, newBalance });
}
