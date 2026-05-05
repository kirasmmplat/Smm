import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, rateLimitResponse, getClientIp } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = checkRateLimit(`contact:${ip}`, 3, 60 * 60 * 1000);
  if (!rl.success) return rateLimitResponse(rl);

  try {
    const body = await req.json() as { name: string; email: string; subject: string; message: string };
    const { name, email, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: "جميع الحقول مطلوبة" }, { status: 400 });
    }
    if (message.length < 10) {
      return NextResponse.json({ error: "الرسالة قصيرة جداً" }, { status: 400 });
    }

    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (adminUser) {
      await prisma.ticket.create({
        data: {
          userId: adminUser.id,
          subject: `[تواصل] ${subject} — ${name} <${email}>`,
          status: "OPEN",
          priority: "NORMAL",
          messages: {
            create: {
              senderId: adminUser.id,
              message: `من: ${name}\nالبريد: ${email}\n\n${message}`,
            },
          },
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[Contact] error:", e);
    return NextResponse.json({ error: "حدث خطأ، حاول مجدداً" }, { status: 500 });
  }
}
