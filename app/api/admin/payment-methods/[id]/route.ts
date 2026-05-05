import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { name, type, description, instructions, isActive, isAutomatic, minAmount, maxAmount, bonusPercent, icon, sortOrder } = body;
  const method = await prisma.paymentMethod.update({
    where: { id: params.id },
    data: { name, type, description, instructions, isActive, isAutomatic, minAmount: minAmount ? Number(minAmount) : undefined, maxAmount: maxAmount ? Number(maxAmount) : null, bonusPercent: bonusPercent !== undefined ? Number(bonusPercent) : undefined, icon, sortOrder },
  });
  return NextResponse.json({ method });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await prisma.paymentMethod.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "تم الحذف" });
}
