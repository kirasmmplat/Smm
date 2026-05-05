import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const ticket = await prisma.ticket.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!ticket) return NextResponse.json({ message: "التذكرة غير موجودة" }, { status: 404 });
  return NextResponse.json(ticket);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { status?: string };
  await prisma.ticket.update({
    where: { id: params.id },
    data: { status: (body.status as "OPEN" | "PENDING_REPLY" | "CLOSED") ?? "CLOSED" },
  });

  return NextResponse.json({ success: true });
}
