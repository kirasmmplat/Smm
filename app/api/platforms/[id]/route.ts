import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await prisma.platform.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { name?: string; icon?: string; isActive?: boolean; sortOrder?: number };
  const platform = await prisma.platform.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(platform);
}
