import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { generateApiKey } from "@/lib/utils";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const user = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      username: true,
      role: true,
      balance: true,
      apiKey: true,
      referralCode: true,
      createdAt: true,
    },
  });

  if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

  return NextResponse.json({
    ...user,
    balance: user.balance.toString(),
  });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as {
      name?: string;
      generateApiKey?: boolean;
      revokeApiKey?: boolean;
    };

    const updateData: Record<string, unknown> = {};

    if (body.name !== undefined) {
      if (!body.name.trim() || body.name.trim().length < 2) {
        return NextResponse.json({ message: "الاسم قصير جداً" }, { status: 400 });
      }
      updateData.name = body.name.trim();
    }

    if (body.generateApiKey) {
      updateData.apiKey = generateApiKey();
    }

    if (body.revokeApiKey) {
      updateData.apiKey = null;
    }

    const user = await prisma.user.update({
      where: { id: auth.user.id },
      data: updateData,
      select: { id: true, name: true, apiKey: true },
    });

    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}

export async function PATCH() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const newKey = generateApiKey();
  await prisma.user.update({
    where: { id: auth.user.id },
    data: { apiKey: newKey },
  });

  return NextResponse.json({ apiKey: newKey });
}
