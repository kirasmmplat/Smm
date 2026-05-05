import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const methods = await prisma.paymentMethod.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ methods });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { name, slug, type, description, instructions, isActive, isAutomatic, minAmount, maxAmount, bonusPercent, icon, sortOrder } = body;
  if (!name || !slug || !type || !minAmount) return NextResponse.json({ message: "الحقول المطلوبة: name, slug, type, minAmount" }, { status: 400 });
  const method = await prisma.paymentMethod.create({
    data: { name, slug, type, description, instructions, isActive: isActive ?? true, isAutomatic: isAutomatic ?? false, minAmount: Number(minAmount), maxAmount: maxAmount ? Number(maxAmount) : null, bonusPercent: bonusPercent ? Number(bonusPercent) : 0, icon, sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json({ method }, { status: 201 });
}
