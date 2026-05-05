import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const providers = await prisma.provider.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { services: true } } },
  });
  return NextResponse.json(providers);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as {
    name: string;
    url: string;
    apiKey: string;
    slug?: string;
  };

  if (!body.name || !body.url || !body.apiKey) {
    return NextResponse.json({ message: "اسم الـ URL ومفتاح API مطلوبان" }, { status: 400 });
  }

  const provider = await prisma.provider.create({
    data: {
      name: body.name,
      url: body.url,
      apiKey: body.apiKey,
      status: "ACTIVE",
    },
  });

  return NextResponse.json(provider, { status: 201 });
}
