import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(5, parseInt(searchParams.get("limit") ?? "20")));
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const role = searchParams.get("role") ?? "";

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true, name: true, email: true, username: true, role: true, status: true,
        balance: true, totalSpent: true, createdAt: true, lastLoginAt: true,
        _count: { select: { orders: true, tickets: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  });
}
