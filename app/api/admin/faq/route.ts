import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const items = await prisma.faqItem.findMany({ orderBy: { sortOrder: "asc" } });
  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { question, answer, category, sortOrder } = body;
  if (!question || !answer) return NextResponse.json({ message: "السؤال والإجابة مطلوبان" }, { status: 400 });
  const item = await prisma.faqItem.create({
    data: { question, answer, category: category ?? "general", sortOrder: sortOrder ?? 0, isActive: true },
  });
  return NextResponse.json({ item }, { status: 201 });
}
