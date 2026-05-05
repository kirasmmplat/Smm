import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? 1));
  const limit = 12;
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, slug: true, excerpt: true, coverImage: true, publishedAt: true, views: true, createdAt: true },
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blogPost.count({ where: { isPublished: true } }),
  ]);
  return NextResponse.json({ posts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
