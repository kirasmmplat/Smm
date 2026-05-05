import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { usages: true } } },
  });
  return NextResponse.json({ coupons });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as {
      code: string; description?: string; type: string;
      value: number; minOrderAmount?: number; maxDiscount?: number;
      usageLimit?: number; perUserLimit?: number; isActive?: boolean;
      startsAt?: string; expiresAt?: string;
    };

    const coupon = await prisma.coupon.create({
      data: {
        code: body.code.trim().toUpperCase(),
        description: body.description ?? null,
        type: body.type,
        value: body.value,
        minOrderAmount: body.minOrderAmount ?? null,
        maxDiscount: body.maxDiscount ?? null,
        usageLimit: body.usageLimit ?? null,
        perUserLimit: body.perUserLimit ?? 1,
        isActive: body.isActive ?? true,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === "P2002") return NextResponse.json({ message: "الكود مستخدم مسبقاً" }, { status: 409 });
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}
