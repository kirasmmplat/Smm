import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { OrderStatus } from "@prisma/client";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const userId = searchParams.get("userId");
  const search = searchParams.get("search");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "50"));
  const skip = (page - 1) * limit;

  const where = {
    ...(status && Object.values(OrderStatus).includes(status as OrderStatus)
      ? { status: status as OrderStatus }
      : {}),
    ...(userId ? { userId } : {}),
    ...(search
      ? {
          OR: [
            { user: { name: { contains: search, mode: "insensitive" as const } } },
            { user: { email: { contains: search, mode: "insensitive" as const } } },
            { link: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: {
          include: {
            serviceType: {
              include: {
                category: { include: { platform: { select: { name: true, icon: true } } } },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({
    orders,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
