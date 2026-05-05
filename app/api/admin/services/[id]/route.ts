import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { ServiceStatus } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: {
      provider: { select: { id: true, name: true } },
      serviceType: {
        include: {
          category: { include: { platform: { select: { id: true, name: true, icon: true } } } },
        },
      },
      _count: { select: { orders: true } },
      serviceUpdates: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
    },
  });

  if (!service) return NextResponse.json({ message: "الخدمة غير موجودة" }, { status: 404 });

  return NextResponse.json({
    ...service,
    ourRate: service.ourRate.toString(),
    providerRate: service.providerRate.toString(),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const body = await req.json() as {
    name?: string;
    description?: string;
    ourRate?: string | number;
    status?: string;
    refill?: boolean;
    cancel?: boolean;
    serviceTypeId?: string;
  };

  const updates: Record<string, unknown> = {};

  if (body.name?.trim()) updates.name = body.name.trim();
  if (body.description !== undefined) updates.description = body.description || null;
  if (body.ourRate !== undefined) {
    const rate = parseFloat(String(body.ourRate));
    if (isNaN(rate) || rate <= 0) return NextResponse.json({ message: "السعر غير صالح" }, { status: 400 });
    updates.ourRate = rate;
  }
  if (body.status && Object.values(ServiceStatus).includes(body.status as ServiceStatus)) {
    updates.status = body.status;
  }
  if (typeof body.refill === "boolean") updates.refill = body.refill;
  if (typeof body.cancel === "boolean") updates.cancel = body.cancel;
  if (body.serviceTypeId) updates.serviceTypeId = body.serviceTypeId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  const service = await prisma.service.update({
    where: { id: params.id },
    data: updates,
    select: { id: true, name: true, ourRate: true, status: true },
  });

  return NextResponse.json({ ...service, ourRate: service.ourRate.toString() });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const existing = await prisma.service.findUnique({ where: { id: params.id }, select: { _count: { select: { orders: true } } } });
  if (!existing) return NextResponse.json({ message: "الخدمة غير موجودة" }, { status: 404 });
  if (existing._count.orders > 0) return NextResponse.json({ message: "لا يمكن حذف خدمة لها طلبات" }, { status: 400 });

  await prisma.service.delete({ where: { id: params.id } });
  return NextResponse.json({ message: "تم الحذف" });
}
