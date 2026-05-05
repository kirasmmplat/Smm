import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { ServiceStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");
  const status = searchParams.get("status");
  const platformId = searchParams.get("platformId");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(200, parseInt(searchParams.get("limit") ?? "100"));
  const skip = (page - 1) * limit;

  const where = {
    ...(status && Object.values(ServiceStatus).includes(status as ServiceStatus) ? { status: status as ServiceStatus } : {}),
    ...(search ? {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { providerServiceId: { contains: search, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(platformId ? {
      serviceType: { category: { platformId } },
    } : {}),
  };

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        provider: { select: { id: true, name: true } },
        serviceType: {
          include: {
            category: { include: { platform: { select: { id: true, name: true, icon: true } } } },
          },
        },
        _count: { select: { orders: true } },
      },
    }),
    prisma.service.count({ where }),
  ]);

  return NextResponse.json({
    services: services.map((s) => ({
      ...s,
      ourRate: s.ourRate.toString(),
      providerRate: s.providerRate.toString(),
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
