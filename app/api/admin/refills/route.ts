import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { RefillStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  const { error } = await requireAdmin();
  if (error) return error;

  const statusParam = new URL(req.url).searchParams.get("status");
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? 1));
  const limit = 30;

  const where = statusParam && Object.values(RefillStatus).includes(statusParam as RefillStatus)
    ? { status: statusParam as RefillStatus }
    : {};

  const [refills, total] = await Promise.all([
    prisma.refill.findMany({
      where,
      include: {
        originalOrder: {
          include: {
            service: { select: { name: true } },
            user: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.refill.count({ where }),
  ]);

  return NextResponse.json({
    refills,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
