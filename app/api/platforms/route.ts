import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: { serviceTypes: { where: { isActive: true }, orderBy: { sortOrder: "asc" } } },
      },
    },
  });
  return NextResponse.json(platforms);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { name: string; icon?: string; slug?: string };
  if (!body.name) return NextResponse.json({ message: "الاسم مطلوب" }, { status: 400 });

  const slug = body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-");
  const platform = await prisma.platform.create({
    data: { name: body.name, icon: body.icon ?? "📱", slug, isActive: true },
  });
  return NextResponse.json(platform, { status: 201 });
}
