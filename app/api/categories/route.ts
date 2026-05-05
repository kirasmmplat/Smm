import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { platformId: string; name: string; slug?: string };
  if (!body.platformId || !body.name) {
    return NextResponse.json({ message: "البيانات ناقصة" }, { status: 400 });
  }

  const slug = body.slug ?? body.name.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
  const category = await prisma.category.create({
    data: { platformId: body.platformId, name: body.name, slug, isActive: true },
  });
  return NextResponse.json(category, { status: 201 });
}
