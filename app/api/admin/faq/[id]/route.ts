import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { question, answer, category, sortOrder, isActive } = body;
  const item = await prisma.faqItem.update({
    where: { id: params.id },
    data: { question, answer, category, sortOrder, isActive },
  });
  return NextResponse.json({ item });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await prisma.faqItem.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "تم الحذف" });
}
