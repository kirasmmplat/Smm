import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_WEBHOOK_SECRET } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { sendDepositConfirmedEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
  }

  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Stripe webhook] signature verification failed:", err);
    return NextResponse.json({ error: "Webhook signature invalid" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as import("stripe").Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true, skipped: "not paid" });
    }

    const userId = session.metadata?.userId;
    const amount = parseFloat(session.metadata?.amount ?? "0");
    const bonusAmount = parseFloat(session.metadata?.bonusAmount ?? "0");
    const totalCredited = parseFloat(session.metadata?.totalCredited ?? String(amount));

    if (!userId || !amount) {
      return NextResponse.json({ error: "Invalid metadata" }, { status: 400 });
    }

    const existingTx = await prisma.transaction.findFirst({
      where: { paymentReference: session.id },
    });
    if (existingTx) {
      return NextResponse.json({ received: true, skipped: "already processed" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, balance: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const balanceBefore = user.balance.toNumber();
    const balanceAfter = balanceBefore + totalCredited;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { balance: balanceAfter },
      });

      await tx.transaction.create({
        data: {
          userId,
          type: "DEPOSIT",
          amount: totalCredited,
          balanceBefore,
          balanceAfter,
          status: "COMPLETED",
          paymentMethod: "stripe",
          paymentReference: session.id,
          notes: bonusAmount > 0
            ? `Stripe — $${amount.toFixed(2)} + مكافأة $${bonusAmount.toFixed(2)}`
            : `Stripe — $${amount.toFixed(2)}`,
        },
      });

      if (bonusAmount > 0) {
        await tx.transaction.create({
          data: {
            userId,
            type: "BONUS",
            amount: bonusAmount,
            balanceBefore: balanceAfter - bonusAmount,
            balanceAfter,
            status: "COMPLETED",
            notes: `مكافأة Stripe ${((bonusAmount / amount) * 100).toFixed(0)}%`,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          title: "تم شحن رصيدك بنجاح",
          message: `تم إضافة $${totalCredited.toFixed(2)} لرصيدك عبر بطاقة Stripe`,
          type: "DEPOSIT",
          link: "/dashboard/add-funds",
        },
      });
    });

    void sendDepositConfirmedEmail({
      to: user.email,
      name: user.name,
      amount: totalCredited,
      newBalance: balanceAfter,
      transactionId: session.id,
    });

    console.log(`[Stripe webhook] Credited $${totalCredited} to user ${userId}`);
  }

  return NextResponse.json({ received: true });
}
