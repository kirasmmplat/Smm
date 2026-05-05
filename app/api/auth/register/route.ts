import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { generateReferralCode, generateApiKey } from "@/lib/utils";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json();
    const { name, username, email, password, referralCode } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json({ message: "جميع الحقول مطلوبة" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" }, { status: 400 });
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      return NextResponse.json(
        { message: "اسم المستخدم يجب أن يكون 3-20 حرف (أحرف إنجليزية وأرقام فقط)" },
        { status: 400 }
      );
    }

    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ message: "البريد الإلكتروني مستخدم بالفعل" }, { status: 400 });
    }

    const existingUsername = await prisma.user.findUnique({ where: { username } });
    if (existingUsername) {
      return NextResponse.json({ message: "اسم المستخدم مستخدم بالفعل" }, { status: 400 });
    }

    let referredById: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({ where: { referralCode } });
      if (referrer) referredById = referrer.id;
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const userReferralCode = generateReferralCode();
    const apiKey = generateApiKey();

    const defaultLevel = await prisma.accountLevel.findFirst({
      where: { slug: "new" },
    });

    const user = await prisma.user.create({
      data: {
        name,
        username,
        email,
        password: hashedPassword,
        referralCode: userReferralCode,
        apiKey,
        accountLevelId: defaultLevel?.id,
        referredById,
      },
    });

    if (referredById) {
      await prisma.notification.create({
        data: {
          userId: referredById,
          title: "مستخدم جديد سجّل برابط الإحالة",
          message: `${name} سجّل باستخدام رابط الإحالة الخاص بك`,
          type: "AFFILIATE",
          link: "/dashboard/affiliate",
        },
      });
    }

    return NextResponse.json(
      { message: "تم إنشاء الحساب بنجاح", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json({ message: "خطأ في الخادم، حاول مرة أخرى" }, { status: 500 });
  }
}
