import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// This route ONLY reads from the ProviderCache (DB).
// It NEVER calls the external provider API.
// To refresh the cache, use POST /api/providers/[id]/refresh-cache.

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const provider = await prisma.provider.findUnique({ where: { id: params.id } });
  if (!provider) return NextResponse.json({ message: "المزود غير موجود" }, { status: 404 });

  const now = new Date();
  const cached = await prisma.providerCache.findUnique({ where: { providerId: params.id } });

  if (!cached) {
    return NextResponse.json(
      { noCacheData: true, message: "لا توجد بيانات مخزنة — اضغط تحديث الكاش لجلب الخدمات لأول مرة" },
      { status: 200, headers: { "X-Cache": "EMPTY" } }
    );
  }

  const ageSeconds = Math.floor((now.getTime() - cached.fetchedAt.getTime()) / 1000);
  const isFresh = cached.expiresAt > now;

  return NextResponse.json(cached.data, {
    headers: {
      "X-Cache": isFresh ? "HIT" : "STALE",
      "X-Cache-Age": String(ageSeconds),
      "X-Cache-Expires": cached.expiresAt.toISOString(),
      "X-Cache-Count": String(Array.isArray(cached.data) ? cached.data.length : 0),
    },
  });
}
