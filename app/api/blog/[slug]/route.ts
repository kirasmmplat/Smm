import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const post = await prisma.blogPost.findUnique({
    where: { slug: params.slug, isPublished: true },
  });
  if (!post) return NextResponse.json({ message: "المقال غير موجود" }, { status: 404 });
  await prisma.blogPost.update({ where: { id: post.id }, data: { views: { increment: 1 } } });
  return NextResponse.json({ post });
}
