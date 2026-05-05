import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://smmpro.replit.app";

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

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as { amount: number; paymentMethodId?: string };
    const { amount } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "مبلغ غير صحيح" }, { status: 400 });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["paypal_enabled", "paypal_client_id", "paypal_secret", "paypal_mode", "min_deposit", "max_deposit"] } },
    });
    const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));

    if (s.paypal_enabled !== "true") {
      return NextResponse.json({ error: "PayPal غير مفعّل حالياً" }, { status: 400 });
    }
    if (!s.paypal_client_id || !s.paypal_secret) {
      return NextResponse.json({ error: "PayPal غير مضبوط — تواصل مع الإدارة" }, { status: 400 });
    }

    const minDeposit = parseFloat(s.min_deposit ?? "5");
    const maxDeposit = parseFloat(s.max_deposit ?? "10000");
    if (amount < minDeposit) return NextResponse.json({ error: `الحد الأدنى $${minDeposit}` }, { status: 400 });
    if (amount > maxDeposit) return NextResponse.json({ error: `الحد الأقصى $${maxDeposit}` }, { status: 400 });

    const mode = s.paypal_mode ?? "sandbox";
    const { token, base } = await getPayPalToken(s.paypal_client_id, s.paypal_secret, mode);

    const orderRes = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [{
          amount: { currency_code: "USD", value: amount.toFixed(2) },
          description: `SMM Pro Deposit - ${auth.user.id}`,
          custom_id: auth.user.id,
        }],
        application_context: {
          return_url: `${BASE_URL}/api/payments/paypal/capture`,
          cancel_url: `${BASE_URL}/dashboard/add-funds?paypal=cancel`,
          brand_name: "SMM Pro",
          locale: "ar-SA",
          landing_page: "BILLING",
          user_action: "PAY_NOW",
        },
      }),
    });

    if (!orderRes.ok) {
      const errData = await orderRes.json();
      console.error("[PayPal] create order error:", errData);
      return NextResponse.json({ error: "فشل إنشاء طلب PayPal" }, { status: 500 });
    }

    const orderData = await orderRes.json() as {
      id: string;
      links: { rel: string; href: string }[];
    };
    const approveLink = orderData.links.find((l) => l.rel === "approve")?.href;

    if (!approveLink) {
      return NextResponse.json({ error: "لم يتم الحصول على رابط PayPal" }, { status: 500 });
    }

    await prisma.transaction.create({
      data: {
        userId: auth.user.id,
        type: "DEPOSIT",
        amount,
        balanceBefore: (await prisma.user.findUnique({ where: { id: auth.user.id }, select: { balance: true } }))?.balance.toNumber() ?? 0,
        balanceAfter: 0,
        status: "PENDING",
        paymentMethod: "paypal",
        paymentReference: orderData.id,
        notes: `PayPal — $${amount.toFixed(2)} — معلق`,
      },
    });

    return NextResponse.json({ approveUrl: approveLink, orderId: orderData.id });
  } catch (e) {
    console.error("[PayPal] create-order error:", e);
    return NextResponse.json({ error: "خطأ في الخادم" }, { status: 500 });
  }
}
