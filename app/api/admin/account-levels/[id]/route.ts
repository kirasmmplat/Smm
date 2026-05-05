import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { name, minSpent, discountPercent, color, icon, benefits, sortOrder } = body;
  const level = await prisma.accountLevel.update({
    where: { id: params.id },
    data: { name, minSpent: minSpent !== undefined ? Number(minSpent) : undefined, discountPercent: discountPercent !== undefined ? Number(discountPercent) : undefined, color, icon, benefits, sortOrder },
  });
  return NextResponse.json({ level });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const count = await prisma.user.count({ where: { accountLevelId: params.id } });
  if (count > 0) return NextResponse.json({ message: `لا يمكن الحذف — ${count} مستخدم على هذا المستوى` }, { status: 400 });
  await prisma.accountLevel.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "تم الحذف" });
}
