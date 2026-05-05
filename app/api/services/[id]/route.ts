import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const service = await prisma.service.findUnique({
    where: { id: params.id },
    include: {
      provider: true,
      serviceType: {
        include: {
          category: { include: { platform: true } },
        },
      },
    },
  });
  if (!service) return NextResponse.json({ message: "الخدمة غير موجودة" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as {
    name?: string;
    description?: string;
    ourRate?: number;
    min?: number;
    max?: number;
    status?: string;
    refill?: boolean;
    cancel?: boolean;
    serviceTypeId?: string;
  };

  const service = await prisma.service.update({
    where: { id: params.id },
    data: {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.ourRate !== undefined && { ourRate: body.ourRate }),
      ...(body.min !== undefined && { min: body.min }),
      ...(body.max !== undefined && { max: body.max }),
      ...(body.status !== undefined && { status: body.status as "ACTIVE" | "INACTIVE" }),
      ...(body.refill !== undefined && { refill: body.refill }),
      ...(body.cancel !== undefined && { cancel: body.cancel }),
      ...(body.serviceTypeId !== undefined && { serviceTypeId: body.serviceTypeId }),
    },
  });
  return NextResponse.json(service);
}
