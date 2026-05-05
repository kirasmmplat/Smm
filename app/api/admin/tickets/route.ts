import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const tickets = await prisma.ticket.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  return NextResponse.json(tickets);
}
