import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const unreadOnly = searchParams.get("unread") === "true";

  const notifications = await prisma.notification.findMany({
    where: {
      userId: auth.user.id,
      ...(unreadOnly ? { isRead: false } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  const unreadCount = await prisma.notification.count({
    where: { userId: auth.user.id, isRead: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { id?: string; markAll?: boolean };

  if (body.markAll) {
    await prisma.notification.updateMany({
      where: { userId: auth.user.id, isRead: false },
      data: { isRead: true },
    });
  } else if (body.id) {
    await prisma.notification.updateMany({
      where: { id: body.id, userId: auth.user.id },
      data: { isRead: true },
    });
  }

  return NextResponse.json({ success: true });
}
