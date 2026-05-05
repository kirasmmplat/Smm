import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await prisma.serviceType.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { name?: string; isActive?: boolean; sortOrder?: number };
  const serviceType = await prisma.serviceType.update({
    where: { id: params.id },
    data: body,
  });
  return NextResponse.json(serviceType);
}
