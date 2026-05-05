import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const group = new URL(req.url).searchParams.get("group");
  const settings = await prisma.setting.findMany({
    where: group ? { group } : undefined,
    orderBy: { group: "asc" },
  });
  return NextResponse.json({ settings });
}

export async function PUT(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;
  const body = await req.json() as { key: string; value: string; group?: string; description?: string };
  if (!body.key) return NextResponse.json({ message: "المفتاح مطلوب" }, { status: 400 });
  const setting = await prisma.setting.upsert({
    where: { key: body.key },
    update: { value: body.value, ...(body.group ? { group: body.group } : {}), ...(body.description ? { description: body.description } : {}) },
    create: { key: body.key, value: body.value, group: body.group ?? "general", description: body.description },
  });
  return NextResponse.json({ setting });
}
