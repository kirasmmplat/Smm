import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json() as { token?: string; password?: string };

  if (!token || !password || password.length < 8) {
    return NextResponse.json({ message: "بيانات غير صالحة" }, { status: 400 });
  }

  // Find user with valid reset token
  const user = await prisma.user.findFirst({
    where: {
      resetToken: token,
      resetTokenExpiry: { gt: new Date() },
    },
  });

  if (!user) {
    return NextResponse.json({ message: "الرابط غير صالح أو منتهي الصلاحية" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetTokenExpiry: null,
    },
  });

  return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح" });
}
