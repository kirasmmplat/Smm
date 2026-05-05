import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { categoryId: string; name: string; slug?: string };
  if (!body.categoryId || !body.name) {
    return NextResponse.json({ message: "البيانات ناقصة" }, { status: 400 });
  }

  const serviceType = await prisma.serviceType.create({
    data: { categoryId: body.categoryId, name: body.name, isActive: true },
  });
  return NextResponse.json(serviceType, { status: 201 });
}
