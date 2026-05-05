import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export async function GET() {
  const settings = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  const result = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as Record<string, string>;

  await Promise.all(
    Object.entries(body).map(([key, value]) =>
      prisma.setting.upsert({
        where: { key },
        create: { key, value: String(value) },
        update: { value: String(value) },
      })
    )
  );

  return NextResponse.json({ success: true });
}
