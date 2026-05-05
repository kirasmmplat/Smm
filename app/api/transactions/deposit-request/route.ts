import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { sendTelegramMessage } from "@/lib/telegram";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as { amount: number; notes?: string; paymentMethod?: string; paymentMethodId?: string; paymentMethodName?: string };
    const { amount, notes, paymentMethod, paymentMethodId, paymentMethodName } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "مبلغ غير صحيح" }, { status: 400 });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["min_deposit", "max_deposit", "manual_min"] } },
    });
    const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
    const minDeposit = parseFloat(s.manual_min ?? s.min_deposit ?? "5");
    const maxDeposit = parseFloat(s.max_deposit ?? "10000");

    if (amount < minDeposit) {
      return NextResponse.json({ error: `الحد الأدنى للإيداع هو $${minDeposit}` }, { status: 400 });
    }
    if (amount > maxDeposit) {
      return NextResponse.json({ error: `الحد الأقصى للإيداع هو $${maxDeposit}` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: auth.user.id } });
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

    const method = paymentMethodId
      ? await prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } })
      : null;
    const isAutomatic = method?.isAutomatic ?? false;
    const isManual = !isAutomatic;
    const transactionNotes = isAutomatic
      ? `إيداع تلقائي - ${paymentMethodName ?? method?.name ?? paymentMethod ?? "طريقة دفع"}${notes ? ` - ${notes}` : ""}`
      : `طلب دعم للإيداع - ${paymentMethodName ?? method?.name ?? paymentMethod ?? "طريقة دفع"}${notes ? ` - ${notes}` : ""}`;

    const tx = await prisma.transaction.create({
      data: {
        userId: auth.user.id,
        type: "DEPOSIT",
        amount,
        balanceBefore: user.balance.toNumber(),
        balanceAfter: user.balance.toNumber(),
        status: "PENDING",
        paymentMethod: paymentMethodName ?? paymentMethod ?? method?.name ?? null,
        notes: transactionNotes,
      },
    });

    if (isManual && user.telegramChatId && process.env.TELEGRAM_BOT_TOKEN) {
      void sendTelegramMessage(
        user.telegramChatId,
        `💬 <b>تم استلام طلب الدعم</b>\n\n👤 ${user.name}\n💵 المبلغ: <code>$${amount.toFixed(2)}</code>\n💳 الطريقة: ${paymentMethodName ?? method?.name ?? paymentMethod ?? "طريقة دفع"}\n\nسنقوم بمراجعة الطلب عبر الدعم الفني.`
      );
    }

    return NextResponse.json({
      success: true,
      message: isAutomatic
        ? "تم تسجيل الإيداع التلقائي بنجاح"
        : "تم تحويلك إلى الدعم لإكمال الإيداع اليدوي",
      supportRequired: isManual,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
