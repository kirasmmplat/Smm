import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT() {
  const { user, error } = await requireAuth();
  if (error) return error;
  await prisma.notification.updateMany({
    where: { userId: user!.id, isRead: false },
    data: { isRead: true },
  });
  return NextResponse.json({ success: true });
}
