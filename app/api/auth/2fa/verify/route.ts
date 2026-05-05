import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyTOTP } from "@/lib/totp";

// Used during login to verify TOTP code after password is correct
// This is called client-side before re-submitting signIn with twoFactorCode
export async function POST(req: NextRequest) {
  const { email, code } = await req.json() as { email?: string; code?: string };

  if (!email || !code) {
    return NextResponse.json({ valid: false, message: "بيانات ناقصة" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { twoFactorSecret: true, twoFactorEnabled: true, status: true },
  });

  if (!user || user.status !== "ACTIVE" || !user.twoFactorEnabled || !user.twoFactorSecret) {
    return NextResponse.json({ valid: false, message: "خطأ في التحقق" }, { status: 400 });
  }

  const isValid = verifyTOTP(code, user.twoFactorSecret);
  return NextResponse.json({ valid: isValid, message: isValid ? "صحيح" : "الكود غير صحيح" });
}
