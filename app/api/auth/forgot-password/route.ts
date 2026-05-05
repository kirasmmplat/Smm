import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const { email } = await req.json() as { email?: string };

  if (!email) {
    return NextResponse.json({ message: "البريد الإلكتروني مطلوب" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, name: true } });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ message: "إذا كان البريد مسجلاً، ستصل رسالة الاستعادة خلال دقائق" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.user.update({
    where: { id: user.id },
    data: { resetToken: token, resetTokenExpiry: expiry },
  });

  // In production: send email with reset link
  // For now: log the link (replace with Resend/Nodemailer in production)
  const resetLink = `${process.env.NEXTAUTH_URL ?? "http://localhost:22001"}/reset-password?token=${token}`;
  console.log(`[Reset Password] ${user.name}: ${resetLink}`);

  return NextResponse.json({ message: "إذا كان البريد مسجلاً، ستصل رسالة الاستعادة خلال دقائق" });
}
