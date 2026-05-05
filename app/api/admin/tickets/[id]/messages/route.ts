import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { sendTicketReplyEmail } from "@/lib/email";
import { sendTicketReplyTelegram } from "@/lib/telegram";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { message: string };
  if (!body.message?.trim()) {
    return NextResponse.json({ message: "الرسالة فارغة" }, { status: 400 });
  }

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: params.id,
      senderId: auth.user.id,
      message: body.message.trim(),
      isAdminReply: true,
    },
  });

  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: "PENDING_REPLY", updatedAt: new Date() },
  });

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    select: {
      userId: true, subject: true,
      user: {
        select: {
          name: true, email: true,
          emailNotifications: true,
          telegramChatId: true, telegramNotifications: true,
        },
      },
    },
  });

  if (ticket) {
    await prisma.notification.create({
      data: {
        userId: ticket.userId,
        title: "رد جديد على تذكرتك",
        message: `فريق الدعم رد على تذكرة: ${ticket.subject}`,
        type: "TICKET",
        link: `/dashboard/tickets/${params.id}`,
      },
    });

    // Email
    if (ticket.user.emailNotifications) {
      void sendTicketReplyEmail({
        to: ticket.user.email, name: ticket.user.name,
        ticketId: params.id, subject: ticket.subject,
        replyMessage: body.message.trim(),
      });
    }

    // Telegram
    if (ticket.user.telegramNotifications && ticket.user.telegramChatId) {
      void sendTicketReplyTelegram({
        chatId: ticket.user.telegramChatId,
        ticketId: params.id,
        subject: ticket.subject,
        replyMessage: body.message.trim(),
      });
    }
  }

  return NextResponse.json(msg, { status: 201 });
}
