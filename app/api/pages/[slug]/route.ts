import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_: Request, { params }: { params: { slug: string } }) {
  const page = await prisma.page.findUnique({
    where: { slug: params.slug, isActive: true },
  });
  if (!page) return NextResponse.json({ message: "الصفحة غير موجودة" }, { status: 404 });
  return NextResponse.json({ page });
}
