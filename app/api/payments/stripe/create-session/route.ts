import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const ip = getClientIp(req);
  const rl = checkRateLimit(`stripe-session:${auth.user.id}:${ip}`, 10, 60 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl);

  if (!stripe) {
    return NextResponse.json({ error: "بوابة Stripe غير مفعّلة حالياً" }, { status: 503 });
  }

  try {
    const body = await req.json() as { amount: number; bonusPercent?: number };
    const { amount, bonusPercent = 0 } = body;

    if (!amount || isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "مبلغ غير صحيح" }, { status: 400 });
    }

    const settings = await prisma.setting.findMany({
      where: { key: { in: ["min_deposit", "max_deposit", "site_name"] } },
    });
    const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
    const minDeposit = parseFloat(s.min_deposit ?? "1");
    const maxDeposit = parseFloat(s.max_deposit ?? "10000");
    const siteName = s.site_name ?? "SMM Pro";

    if (amount < minDeposit) {
      return NextResponse.json({ error: `الحد الأدنى للإيداع هو $${minDeposit}` }, { status: 400 });
    }
    if (amount > maxDeposit) {
      return NextResponse.json({ error: `الحد الأقصى للإيداع هو $${maxDeposit}` }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { id: true, email: true, name: true },
    });
    if (!user) return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });

    const baseUrl = process.env.NEXTAUTH_URL ?? `https://${req.headers.get("host")}`;

    const bonusAmount = bonusPercent > 0 ? (amount * bonusPercent) / 100 : 0;
    const totalCredited = amount + bonusAmount;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      currency: "usd",
      customer_email: user.email,
      metadata: {
        userId: user.id,
        amount: String(amount),
        bonusPercent: String(bonusPercent),
        bonusAmount: String(bonusAmount.toFixed(6)),
        totalCredited: String(totalCredited.toFixed(6)),
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(amount * 100),
            product_data: {
              name: `شحن رصيد — ${siteName}`,
              description: bonusPercent > 0
                ? `إيداع $${amount.toFixed(2)} + مكافأة ${bonusPercent}% = رصيد $${totalCredited.toFixed(2)}`
                : `إيداع $${amount.toFixed(2)} في رصيدك`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/dashboard/add-funds?stripe=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/add-funds?stripe=cancel`,
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[Stripe] create-session error:", err);
    return NextResponse.json({ error: "خطأ في إنشاء جلسة الدفع" }, { status: 500 });
  }
}
