import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { password } = await req.json() as { password?: string };

  if (!password) {
    return NextResponse.json({ message: "كلمة المرور مطلوبة" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { password: true, twoFactorEnabled: true },
  });

  if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  if (!user.twoFactorEnabled) {
    return NextResponse.json({ message: "التحقق بخطوتين غير مفعّل" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    return NextResponse.json({ message: "كلمة المرور غير صحيحة" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: auth.user.id },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  return NextResponse.json({ message: "تم تعطيل التحقق بخطوتين" });
}
