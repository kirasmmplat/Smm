import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as { code: string; orderAmount?: number };
    const { code, orderAmount = 0 } = body;

    if (!code) return NextResponse.json({ message: "الكود مطلوب" }, { status: 400 });

    const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

    if (!coupon) return NextResponse.json({ message: "كود الخصم غير صحيح" }, { status: 404 });
    if (!coupon.isActive) return NextResponse.json({ message: "كود الخصم غير مفعّل" }, { status: 400 });

    const now = new Date();
    if (coupon.startsAt && coupon.startsAt > now) return NextResponse.json({ message: "كود الخصم لم يبدأ بعد" }, { status: 400 });
    if (coupon.expiresAt && coupon.expiresAt < now) return NextResponse.json({ message: "انتهت صلاحية كود الخصم" }, { status: 400 });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return NextResponse.json({ message: "تم استنفاد استخدامات هذا الكود" }, { status: 400 });
    if (coupon.minOrderAmount && orderAmount < coupon.minOrderAmount.toNumber()) {
      return NextResponse.json({ message: `الحد الأدنى للطلب $${coupon.minOrderAmount.toString()} لاستخدام هذا الكود` }, { status: 400 });
    }

    const userUsage = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: auth.user.id } });
    if (userUsage >= coupon.perUserLimit) return NextResponse.json({ message: "لقد استخدمت هذا الكود من قبل" }, { status: 400 });

    let discount = 0;
    if (coupon.type === "PERCENT") {
      discount = (orderAmount * coupon.value.toNumber()) / 100;
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount.toNumber());
    } else {
      discount = Math.min(coupon.value.toNumber(), orderAmount);
    }

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        type: coupon.type,
        value: coupon.value.toString(),
        description: coupon.description,
      },
      discount: parseFloat(discount.toFixed(6)),
      finalAmount: parseFloat((orderAmount - discount).toFixed(6)),
    });
  } catch {
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}
