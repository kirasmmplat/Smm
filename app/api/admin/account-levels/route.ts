import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const levels = await prisma.accountLevel.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ levels });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { name, slug, minSpent, discountPercent, color, icon, benefits, sortOrder } = body;
  if (!name || !slug || minSpent === undefined || discountPercent === undefined) {
    return NextResponse.json({ message: "الحقول المطلوبة ناقصة" }, { status: 400 });
  }
  const level = await prisma.accountLevel.create({
    data: { name, slug, minSpent: Number(minSpent), discountPercent: Number(discountPercent), color: color ?? "#7C3AED", icon: icon ?? "⭐", benefits: benefits ?? [], sortOrder: sortOrder ?? 0 },
  });
  return NextResponse.json({ level }, { status: 201 });
}
