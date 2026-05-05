import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const provider = await prisma.provider.findUnique({
    where: { id: params.id },
    include: { _count: { select: { services: true } } },
  });
  if (!provider) return NextResponse.json({ message: "غير موجود" }, { status: 404 });
  return NextResponse.json(provider);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { name?: string; url?: string; apiKey?: string; status?: string };

  const provider = await prisma.provider.update({
    where: { id: params.id },
    data: {
      ...(body.name && { name: body.name }),
      ...(body.url && { url: body.url }),
      ...(body.apiKey && { apiKey: body.apiKey }),
      ...(body.status && { status: body.status as "ACTIVE" | "INACTIVE" }),
    },
  });
  return NextResponse.json(provider);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const count = await prisma.service.count({ where: { providerId: params.id } });
  if (count > 0) {
    return NextResponse.json({ message: `لا يمكن الحذف — يوجد ${count} خدمة مرتبطة بهذا المزود` }, { status: 400 });
  }

  await prisma.provider.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
