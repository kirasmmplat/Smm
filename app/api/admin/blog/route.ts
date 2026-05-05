import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? 1));
  const limit = 20;
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({ orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
    prisma.blogPost.count(),
  ]);
  return NextResponse.json({ posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}

export async function POST(req: NextRequest) {
  const { error, user } = await requireAdmin();
  if (error) return error;
  const body = await req.json();
  const { title, slug, content, excerpt, coverImage, isPublished, seoTitle, seoDesc } = body;
  if (!title || !slug || !content) return NextResponse.json({ message: "العنوان والـ slug والمحتوى مطلوبة" }, { status: 400 });
  const post = await prisma.blogPost.create({
    data: { title, slug, content, excerpt, coverImage, isPublished: isPublished ?? false, publishedAt: isPublished ? new Date() : null, authorId: user!.id, seoTitle, seoDesc },
  });
  return NextResponse.json({ post }, { status: 201 });
}
