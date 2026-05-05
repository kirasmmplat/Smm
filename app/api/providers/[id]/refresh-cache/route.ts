import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const provider = await prisma.provider.findUnique({ where: { id: params.id } });
  if (!provider) return NextResponse.json({ message: "المزود غير موجود" }, { status: 404 });
  if (provider.status !== "ACTIVE") {
    return NextResponse.json({ message: "المزود معطل — فعّله أولاً من إعدادات المزود" }, { status: 400 });
  }

  const apiUrl = provider.url.replace(/\/$/, "");

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ key: provider.apiKey, action: "services" }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const raw = await res.text().catch(() => "");
      return NextResponse.json(
        {
          message: `المزود أرجع خطأ ${res.status}`,
          hint: "تحقق من رابط API ومفتاح API في إعدادات المزود",
          raw: raw.slice(0, 500),
        },
        { status: 502 }
      );
    }

    const data = (await res.json()) as unknown[];
    const now = new Date();
    const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000);
    const jsonData = data as unknown as import("@prisma/client").Prisma.InputJsonValue;

    await prisma.providerCache.upsert({
      where: { providerId: params.id },
      create: { providerId: params.id, data: jsonData, fetchedAt: now, expiresAt },
      update: { data: jsonData, fetchedAt: now, expiresAt },
    });

    return NextResponse.json({
      success: true,
      services: data.length,
      fetchedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    // Try to return stale cache if available
    const stale = await prisma.providerCache.findUnique({ where: { providerId: params.id } }).catch(() => null);
    return NextResponse.json(
      {
        message: `فشل الاتصال بالمزود: ${msg}`,
        hint: stale ? "يوجد كاش قديم — التصفح متاح لكن البيانات ليست محدّثة" : "لا يوجد كاش",
        staleAvailable: !!stale,
      },
      { status: 502 }
    );
  }
}
