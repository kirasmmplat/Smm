import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const page = await prisma.page.findUnique({ where: { slug: params.slug } });
  if (!page) return NextResponse.json({ message: "الصفحة غير موجودة" }, { status: 404 });
  return NextResponse.json({ page });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { title, content, isActive, seoTitle, seoDesc } = body;
  const page = await prisma.page.upsert({
    where: { slug: params.slug },
    update: { title, content, isActive, seoTitle, seoDesc },
    create: { slug: params.slug, title: title ?? params.slug, content: content ?? "", isActive: isActive ?? true, seoTitle, seoDesc },
  });
  return NextResponse.json({ page });
}
