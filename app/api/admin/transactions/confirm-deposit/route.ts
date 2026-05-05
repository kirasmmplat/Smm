import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendDepositConfirmedEmail } from "@/lib/email";
import { sendDepositConfirmedTelegram } from "@/lib/telegram";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json() as {
    transactionId?: string; userId?: string;
    amount?: number; reject?: boolean; rejectReason?: string;
  };
  const { transactionId, userId, amount, reject, rejectReason } = body;

  if (!transactionId || !userId || typeof amount !== "number" || amount <= 0) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const transaction = await prisma.transaction.findFirst({
    where: { id: transactionId, userId, type: "DEPOSIT", status: "PENDING" },
  });

  if (!transaction) {
    return NextResponse.json({ error: "Transaction not found or already processed" }, { status: 404 });
  }

  // Fetch user for notifications
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      balance: true, name: true, email: true,
      emailNotifications: true,
      telegramChatId: true, telegramNotifications: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (reject) {
    await prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "FAILED", notes: (transaction.notes ?? "") + ` [مرفوض: ${rejectReason ?? "بدون سبب"}]` },
    });

    await prisma.notification.create({
      data: {
        userId,
        title: "تم رفض طلب الإيداع",
        message: `تم رفض إيداعك بمبلغ $${amount.toFixed(2)}${rejectReason ? ` — السبب: ${rejectReason}` : ""}`,
        type: "DEPOSIT",
        link: "/dashboard/add-funds",
      },
    });

    // Telegram
    if (user.telegramNotifications && user.telegramChatId) {
      void sendDepositConfirmedTelegram({
        chatId: user.telegramChatId,
        amount,
        newBalance: parseFloat(user.balance.toString()),
        rejected: true,
        rejectReason,
      });
    }

    return NextResponse.json({ message: "Rejected" });
  }

  const newBalance = parseFloat(user.balance.toString()) + amount;

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { balance: newBalance } }),
    prisma.transaction.update({
      where: { id: transactionId },
      data: { status: "COMPLETED", balanceBefore: user.balance, balanceAfter: newBalance },
    }),
  ]);

  await prisma.notification.create({
    data: {
      userId,
      title: "تم تأكيد إيداعك ✅",
      message: `تمت إضافة $${amount.toFixed(2)} لرصيدك. الرصيد الجديد: $${newBalance.toFixed(2)}`,
      type: "DEPOSIT",
      link: "/dashboard/add-funds",
    },
  });

  // Email
  if (user.emailNotifications) {
    void sendDepositConfirmedEmail({
      to: user.email, name: user.name,
      amount, newBalance, transactionId,
    });
  }

  // Telegram
  if (user.telegramNotifications && user.telegramChatId) {
    void sendDepositConfirmedTelegram({
      chatId: user.telegramChatId,
      amount, newBalance,
    });
  }

  return NextResponse.json({ message: "Confirmed", newBalance });
}
