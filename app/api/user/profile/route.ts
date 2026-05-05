import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { randomBytes } from "crypto";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true, name: true, email: true, username: true, role: true,
      balance: true, totalSpent: true, discountPercent: true,
      apiKey: true, referralCode: true, language: true, timezone: true,
      telegramChatId: true, telegramNotifications: true, emailNotifications: true,
      twoFactorEnabled: true, createdAt: true, lastLoginAt: true,
      accountLevel: { select: { name: true, color: true } },
    },
  });

  if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  return NextResponse.json({
    ...user,
    balance: user.balance.toString(),
    totalSpent: user.totalSpent.toString(),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json() as {
    name?: string;
    language?: string;
    timezone?: string;
    invoiceDetails?: string;
    regenerateApiKey?: boolean;
    telegramNotifications?: boolean;
    emailNotifications?: boolean;
  };

  const updates: Record<string, unknown> = {};

  if (body.regenerateApiKey === true) {
    updates.apiKey = randomBytes(32).toString("hex");
    const user = await prisma.user.update({ where: { id: auth.user.id }, data: updates, select: { id: true, apiKey: true } });
    return NextResponse.json(user);
  }

  if (body.name !== undefined) {
    const trimmed = body.name.trim();
    if (!trimmed || trimmed.length < 2) return NextResponse.json({ message: "الاسم قصير جداً" }, { status: 400 });
    updates.name = trimmed;
  }
  if (body.language !== undefined && ["ar", "en"].includes(body.language)) {
    updates.language = body.language;
  }
  if (body.timezone !== undefined) {
    updates.timezone = body.timezone;
  }
  if (body.invoiceDetails !== undefined) {
    updates.invoiceDetails = body.invoiceDetails;
  }
  if (body.telegramNotifications !== undefined) {
    updates.telegramNotifications = body.telegramNotifications;
  }
  if (body.emailNotifications !== undefined) {
    updates.emailNotifications = body.emailNotifications;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "لا توجد بيانات للتحديث" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: auth.user.id },
    data: updates,
    select: { id: true, name: true, language: true, timezone: true },
  });

  return NextResponse.json(user);
}
