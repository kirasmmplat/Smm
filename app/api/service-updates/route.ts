import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { error } = await requireAuth();
  if (error) return error;
  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? 1));
  const limit = 20;
  const [updates, total] = await Promise.all([
    prisma.serviceUpdate.findMany({
      include: { service: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.serviceUpdate.count(),
  ]);
  return NextResponse.json({ updates, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
}
