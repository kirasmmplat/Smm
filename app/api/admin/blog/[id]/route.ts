import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { title, content, excerpt, coverImage, isPublished, seoTitle, seoDesc } = body;
  const existing = await prisma.blogPost.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ message: "المقال غير موجود" }, { status: 404 });
  const post = await prisma.blogPost.update({
    where: { id: params.id },
    data: { title, content, excerpt, coverImage, isPublished, publishedAt: isPublished && !existing.publishedAt ? new Date() : existing.publishedAt, seoTitle, seoDesc },
  });
  return NextResponse.json({ post });
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;
  await prisma.blogPost.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "تم حذف المقال" });
}
