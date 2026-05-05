import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { telegramChatId } = await req.json() as { telegramChatId?: string };

  if (!telegramChatId?.trim()) {
    return NextResponse.json({ message: "Chat ID مطلوب" }, { status: 400 });
  }

  // Validate chat ID is numeric or starts with -
  if (!/^-?\d+$/.test(telegramChatId.trim())) {
    return NextResponse.json({ message: "Chat ID غير صالح — يجب أن يكون رقماً" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { telegramChatId: telegramChatId.trim() },
  });

  return NextResponse.json({ message: "تم ربط حساب تيليجرام بنجاح" });
}

export async function DELETE() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { telegramChatId: null, telegramNotifications: false },
  });

  return NextResponse.json({ message: "تم إلغاء ربط تيليجرام" });
}
