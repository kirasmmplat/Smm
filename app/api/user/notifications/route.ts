import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { emailNotifications, telegramNotifications } = await req.json() as {
    emailNotifications?: boolean;
    telegramNotifications?: boolean;
  };

  const updates: Record<string, unknown> = {};
  if (typeof emailNotifications === "boolean") updates.emailNotifications = emailNotifications;
  if (typeof telegramNotifications === "boolean") updates.telegramNotifications = telegramNotifications;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ message: "لا توجد بيانات" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: updates,
  });

  return NextResponse.json({ message: "تم حفظ إعدادات الإشعارات" });
}
