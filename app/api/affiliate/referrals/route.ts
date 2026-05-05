import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { user, error } = await requireAuth();
  if (error) return error;

  const page = Math.max(1, Number(new URL(req.url).searchParams.get("page") ?? 1));
  const limit = 20;
  const skip = (page - 1) * limit;

  const affiliate = await prisma.affiliate.findUnique({ where: { userId: user!.id } });
  if (!affiliate) return NextResponse.json({ referrals: [], pagination: { page, limit, total: 0, pages: 0 } });

  const [referrals, total] = await Promise.all([
    prisma.affiliateReferral.findMany({
      where: { affiliateId: affiliate.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.affiliateReferral.count({ where: { affiliateId: affiliate.id } }),
  ]);

  const referralIds = referrals.map((r) => r.referredUserId);
  const users = await prisma.user.findMany({
    where: { id: { in: referralIds } },
    select: { id: true, name: true, email: true, createdAt: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const data = referrals.map((r) => ({
    ...r,
    referredUser: userMap.get(r.referredUserId) ?? null,
  }));

  return NextResponse.json({
    referrals: data,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
}
