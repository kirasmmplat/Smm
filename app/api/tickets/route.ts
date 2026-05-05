import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const tickets = await prisma.ticket.findMany({
    where: { userId: auth.user.id },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { messages: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { message: true, isAdminReply: true },
      },
    },
  });

  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as { subject: string; message: string; priority?: string };
    const { subject, message, priority } = body;

    if (!subject?.trim() || !message?.trim()) {
      return NextResponse.json({ message: "الموضوع والرسالة مطلوبان" }, { status: 400 });
    }

    const ticket = await prisma.ticket.create({
      data: {
        userId: auth.user.id,
        subject: subject.trim(),
        priority: (priority as "LOW" | "NORMAL" | "HIGH" | "URGENT") ?? "NORMAL",
        status: "OPEN",
        messages: {
          create: {
            senderId: auth.user.id,
            message: message.trim(),
            isAdminReply: false,
          },
        },
      },
    });

    return NextResponse.json({ id: ticket.id }, { status: 201 });
  } catch {
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}
