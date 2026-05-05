import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as Record<string, unknown>;
    const coupon = await prisma.coupon.update({
      where: { id: params.id },
      data: {
        code: (body.code as string)?.trim().toUpperCase(),
        description: (body.description as string) ?? null,
        type: body.type as string,
        value: body.value as number,
        minOrderAmount: (body.minOrderAmount as number) ?? null,
        maxDiscount: (body.maxDiscount as number) ?? null,
        usageLimit: (body.usageLimit as number) ?? null,
        perUserLimit: (body.perUserLimit as number) ?? 1,
        isActive: body.isActive as boolean,
        startsAt: body.startsAt ? new Date(body.startsAt as string) : null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt as string) : null,
      },
    });
    return NextResponse.json({ coupon });
  } catch {
    return NextResponse.json({ message: "خطأ في التعديل" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await prisma.coupon.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
