import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { sendPasswordChangedEmail } from "@/lib/email";
import { sendPasswordChangedTelegram } from "@/lib/telegram";
import bcrypt from "bcryptjs";

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { currentPassword, newPassword } = await req.json() as {
    currentPassword?: string;
    newPassword?: string;
  };

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: "كل الحقول مطلوبة" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ message: "كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true, password: true, email: true, name: true,
      emailNotifications: true,
      telegramChatId: true, telegramNotifications: true,
    },
  });

  if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  const valid = await bcrypt.compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json({ message: "كلمة المرور الحالية غير صحيحة" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  // Email notification
  if (user.emailNotifications) {
    void sendPasswordChangedEmail({ to: user.email, name: user.name });
  }

  // Telegram notification
  if (user.telegramNotifications && user.telegramChatId) {
    void sendPasswordChangedTelegram(user.telegramChatId);
  }

  return NextResponse.json({ message: "تم تغيير كلمة المرور بنجاح" });
}
