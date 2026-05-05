import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { verifyTOTP } from "@/lib/totp";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { code } = await req.json() as { code?: string };

  if (!code || code.replace(/\s/g, "").length !== 6) {
    return NextResponse.json({ message: "أدخل الكود المكوّن من 6 أرقام" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { twoFactorSecret: true, twoFactorEnabled: true },
  });

  if (!user?.twoFactorSecret) {
    return NextResponse.json({ message: "ابدأ بإعداد التحقق بخطوتين أولاً" }, { status: 400 });
  }

  if (user.twoFactorEnabled) {
    return NextResponse.json({ message: "التحقق بخطوتين مفعّل مسبقاً" }, { status: 400 });
  }

  const isValid = verifyTOTP(code, user.twoFactorSecret);
  if (!isValid) {
    return NextResponse.json({ message: "الكود غير صحيح أو انتهت صلاحيته" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { twoFactorEnabled: true },
  });

  return NextResponse.json({ message: "تم تفعيل التحقق بخطوتين بنجاح" });
}
