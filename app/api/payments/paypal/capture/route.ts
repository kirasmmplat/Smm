import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendDepositConfirmedEmail } from "@/lib/email";

async function getPayPalToken(clientId: string, secret: string, mode: string) {
  const base = mode === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
  const res = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error("PayPal token failed");
  const data = await res.json() as { access_token: string };
  return { token: data.access_token, base };
}

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://smmpro.replit.app";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const payerId = searchParams.get("PayerID");

  if (!token || !payerId) {
    return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=cancel`);
  }

  try {
    const settings = await prisma.setting.findMany({
      where: { key: { in: ["paypal_client_id", "paypal_secret", "paypal_mode"] } },
    });
    const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));

    if (!s.paypal_client_id || !s.paypal_secret) {
      return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=error`);
    }

    const mode = s.paypal_mode ?? "sandbox";
    const { token: accessToken, base } = await getPayPalToken(s.paypal_client_id, s.paypal_secret, mode);

    const captureRes = await fetch(`${base}/v2/checkout/orders/${token}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!captureRes.ok) {
      console.error("[PayPal] capture failed:", await captureRes.text());
      return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=error`);
    }

    const captureData = await captureRes.json() as {
      status: string;
      purchase_units: { custom_id?: string; payments: { captures: { id: string; amount: { value: string } }[] } }[];
    };

    if (captureData.status !== "COMPLETED") {
      return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=error`);
    }

    const capture = captureData.purchase_units[0]?.payments?.captures?.[0];
    const userId = captureData.purchase_units[0]?.custom_id;
    const amount = parseFloat(capture?.amount?.value ?? "0");
    const captureId = capture?.id;

    if (!userId || !amount || !captureId) {
      return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=error`);
    }

    const existing = await prisma.transaction.findFirst({ where: { paymentReference: captureId } });
    if (existing) {
      return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=success`);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, balance: true },
    });

    if (!user) {
      return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=error`);
    }

    const balanceBefore = user.balance.toNumber();
    const balanceAfter = balanceBefore + amount;

    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: userId }, data: { balance: balanceAfter } });

      await tx.transaction.updateMany({
        where: { userId, paymentReference: token, status: "PENDING" },
        data: { status: "COMPLETED", balanceAfter, notes: `PayPal — $${amount.toFixed(2)}`, paymentReference: captureId },
      });

      const existing2 = await tx.transaction.findFirst({ where: { paymentReference: captureId, status: "COMPLETED" } });
      if (!existing2) {
        await tx.transaction.create({
          data: {
            userId,
            type: "DEPOSIT",
            amount,
            balanceBefore,
            balanceAfter,
            status: "COMPLETED",
            paymentMethod: "paypal",
            paymentReference: captureId,
            notes: `PayPal — $${amount.toFixed(2)}`,
          },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          title: "تم شحن رصيدك بنجاح",
          message: `تم إضافة $${amount.toFixed(2)} لرصيدك عبر PayPal`,
          type: "DEPOSIT",
          link: "/dashboard/add-funds",
        },
      });
    });

    void sendDepositConfirmedEmail({
      to: user.email,
      name: user.name,
      amount,
      newBalance: balanceAfter,
      transactionId: captureId,
    });

    return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=success`);
  } catch (e) {
    console.error("[PayPal] capture error:", e);
    return NextResponse.redirect(`${BASE_URL}/dashboard/add-funds?paypal=error`);
  }
}
