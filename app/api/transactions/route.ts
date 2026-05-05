import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") ?? "";
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId: user!.id };
  if (type) where.type = type;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    transactions,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
