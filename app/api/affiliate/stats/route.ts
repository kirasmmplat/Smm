import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, error } = await requireAuth();
  if (error) return error;

  const userData = await prisma.user.findUnique({
    where: { id: user!.id },
    select: { referralCode: true },
  });

  let affiliate = await prisma.affiliate.findUnique({
    where: { userId: user!.id },
    include: {
      referrals: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!affiliate) {
    affiliate = await prisma.affiliate.create({
      data: {
        userId: user!.id,
        referralCode: userData?.referralCode ?? `REF${user!.id.slice(-8).toUpperCase()}`,
        commissionRate: 5,
      },
      include: { referrals: true },
    });
  }

  const settings = await prisma.setting.findFirst({
    where: { key: "affiliate_commission" },
  });

  const referralLink = `${process.env.NEXTAUTH_URL ?? ""}/register?ref=${affiliate.referralCode}`;

  return NextResponse.json({
    referralCode: affiliate.referralCode,
    referralLink,
    commissionRate: Number(affiliate.commissionRate),
    totalReferrals: affiliate.totalReferrals,
    totalEarnings: Number(affiliate.totalEarnings),
    pendingEarnings: Number(affiliate.pendingEarnings),
    isActive: affiliate.isActive,
    defaultCommission: Number(settings?.value ?? 5),
  });
}
