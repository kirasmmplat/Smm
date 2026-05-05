import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const ticket = await prisma.ticket.findFirst({
    where: { id: params.id, userId: auth.user.id },
  });

  if (!ticket) return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  if (ticket.status === "CLOSED") {
    return NextResponse.json({ message: "التذكرة مغلقة" }, { status: 400 });
  }

  const body = await req.json() as { message: string };
  if (!body.message?.trim()) {
    return NextResponse.json({ message: "الرسالة فارغة" }, { status: 400 });
  }

  const msg = await prisma.ticketMessage.create({
    data: {
      ticketId: params.id,
      senderId: auth.user.id,
      message: body.message.trim(),
      isAdminReply: false,
    },
  });

  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: "OPEN", updatedAt: new Date() },
  });

  return NextResponse.json(msg, { status: 201 });
}
