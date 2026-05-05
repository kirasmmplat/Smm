import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PUT(_: Request, { params }: { params: { id: string } }) {
  const { user, error } = await requireAuth();
  if (error) return error;
  await prisma.notification.updateMany({
    where: { id: params.id, userId: user!.id },
    data: { isRead: true },
  });
  return NextResponse.json({ success: true });
}
