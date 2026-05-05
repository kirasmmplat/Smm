import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { generateTOTPSecret, generateTOTPKeyUri } from "@/lib/totp";
import QRCode from "qrcode";

export async function POST() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { email: true, twoFactorEnabled: true },
  });

  if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });
  if (user.twoFactorEnabled) {
    return NextResponse.json({ message: "التحقق بخطوتين مفعّل مسبقاً" }, { status: 400 });
  }

  const secret = generateTOTPSecret();
  const keyUri = generateTOTPKeyUri(secret, user.email);
  const qrDataUrl = await QRCode.toDataURL(keyUri, { width: 256, margin: 1 });

  // Store secret temporarily (not enabled yet until verified)
  await prisma.user.update({
    where: { id: auth.user.id },
    data: { twoFactorSecret: secret },
  });

  return NextResponse.json({
    secret,
    qrDataUrl,
    keyUri,
  });
}
