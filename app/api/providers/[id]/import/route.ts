import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as {
    providerServiceId: string;
    serviceTypeId: string;
    name: string;
    description?: string;
    providerRate: string;
    ourRate: string;
    min: number;
    max: number;
    refill?: boolean;
    cancel?: boolean;
  };

  if (!body.providerServiceId || !body.serviceTypeId || !body.name || !body.ourRate) {
    return NextResponse.json({ message: "بيانات ناقصة" }, { status: 400 });
  }

  const existing = await prisma.service.findFirst({
    where: { providerId: params.id, providerServiceId: String(body.providerServiceId) },
  });
  if (existing) {
    return NextResponse.json({ message: "هذه الخدمة مستوردة بالفعل", id: existing.id }, { status: 409 });
  }

  const service = await prisma.service.create({
    data: {
      providerId: params.id,
      providerServiceId: String(body.providerServiceId),
      serviceTypeId: body.serviceTypeId,
      name: body.name,
      description: body.description,
      providerRate: parseFloat(body.providerRate),
      ourRate: parseFloat(body.ourRate),
      min: body.min,
      max: body.max,
      refill: body.refill ?? false,
      cancel: body.cancel ?? false,
      status: "ACTIVE",
    },
  });

  return NextResponse.json(service, { status: 201 });
}
