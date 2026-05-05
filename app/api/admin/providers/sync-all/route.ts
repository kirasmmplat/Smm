import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

const CACHE_TTL_SECONDS = 6 * 60 * 60; // 6 hours

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const providers = await prisma.provider.findMany({ where: { status: "ACTIVE" } });

  if (providers.length === 0) {
    return NextResponse.json({ refreshed: 0, failed: 0, total: 0, results: [] });
  }

  let refreshed = 0;
  let failed = 0;
  const results: Array<{ id: string; name: string; services?: number; error?: string }> = [];

  for (const provider of providers) {
    try {
      const apiUrl = provider.url.replace(/\/$/, "");
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ key: provider.apiKey, action: "services" }),
        signal: AbortSignal.timeout(30000),
      });

      if (!res.ok) {
        failed++;
        results.push({ id: provider.id, name: provider.name, error: `خطأ HTTP ${res.status}` });
        continue;
      }

      const data = (await res.json()) as unknown[];
      const now = new Date();
      const expiresAt = new Date(now.getTime() + CACHE_TTL_SECONDS * 1000);
      const jsonData = data as unknown as import("@prisma/client").Prisma.InputJsonValue;

      await prisma.providerCache.upsert({
        where: { providerId: provider.id },
        create: { providerId: provider.id, data: jsonData, fetchedAt: now, expiresAt },
        update: { data: jsonData, fetchedAt: now, expiresAt },
      });

      refreshed++;
      results.push({ id: provider.id, name: provider.name, services: data.length });
    } catch (err) {
      failed++;
      results.push({
        id: provider.id,
        name: provider.name,
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  return NextResponse.json({ refreshed, failed, total: providers.length, results });
}
