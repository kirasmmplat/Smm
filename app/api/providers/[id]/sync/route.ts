import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

// GET — compare cached provider prices vs DB prices and return diffs (fast, uses ProviderCache)
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const provider = await prisma.provider.findUnique({ where: { id: params.id } });
  if (!provider) return NextResponse.json({ message: "المزود غير موجود" }, { status: 404 });

  const cached = await prisma.providerCache.findUnique({ where: { providerId: params.id } });
  if (!cached) {
    return NextResponse.json(
      { noCacheData: true, message: "لا توجد بيانات مخزنة — قم بتحديث الكاش أولاً للمقارنة" },
      { status: 200 }
    );
  }

  const now = new Date();
  const cacheAgeSeconds = Math.floor((now.getTime() - cached.fetchedAt.getTime()) / 1000);
  const cacheExpired = cached.expiresAt < now;

  const remoteServices = cached.data as Array<{
    service: string;
    name: string;
    rate: string;
    min: number;
    max: number;
    refill?: boolean;
    cancel?: boolean;
  }>;

  // Build a map: providerServiceId → remote data
  const remoteMap = new Map(remoteServices.map((s) => [String(s.service), s]));

  // Get all imported services for this provider
  const dbServices = await prisma.service.findMany({
    where: { providerId: params.id },
    select: {
      id: true,
      name: true,
      providerServiceId: true,
      providerRate: true,
      ourRate: true,
      min: true,
      max: true,
    },
  });

  const diffs: Array<{
    serviceId: string;
    name: string;
    providerServiceId: string;
    oldProviderRate: number;
    newProviderRate: number;
    changePct: number;
    changeDir: "up" | "down" | "same";
    oldMin: number;
    newMin: number;
    oldMax: number;
    newMax: number;
  }> = [];

  for (const dbSvc of dbServices) {
    const remote = remoteMap.get(dbSvc.providerServiceId);
    if (!remote) continue;

    const oldRate = parseFloat(String(dbSvc.providerRate));
    const newRate = parseFloat(remote.rate);
    const changePct = oldRate > 0 ? ((newRate - oldRate) / oldRate) * 100 : 0;

    const rateChanged = Math.abs(changePct) >= 0.01;
    const minChanged = dbSvc.min !== remote.min;
    const maxChanged = dbSvc.max !== remote.max;

    if (rateChanged || minChanged || maxChanged) {
      diffs.push({
        serviceId: dbSvc.id,
        name: dbSvc.name,
        providerServiceId: dbSvc.providerServiceId,
        oldProviderRate: oldRate,
        newProviderRate: newRate,
        changePct: Math.round(changePct * 10) / 10,
        changeDir: newRate > oldRate ? "up" : newRate < oldRate ? "down" : "same",
        oldMin: dbSvc.min,
        newMin: remote.min,
        oldMax: dbSvc.max,
        newMax: remote.max,
      });
    }
  }

  const importedIds = new Set(dbServices.map((s) => s.providerServiceId));
  const newCount = remoteServices.filter((s) => !importedIds.has(String(s.service))).length;

  return NextResponse.json({
    diffs,
    newCount,
    totalRemote: remoteServices.length,
    totalImported: dbServices.length,
    cacheAgeSeconds,
    cacheExpired,
    cacheFetchedAt: cached.fetchedAt.toISOString(),
  });
}

// POST — apply selected price updates
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = (await req.json()) as {
    updates: Array<{ serviceId: string; newProviderRate: number; newMin?: number; newMax?: number }>;
    applyMarkup?: boolean;
    markupPercent?: number;
  };

  if (!body.updates?.length) {
    return NextResponse.json({ message: "لا توجد تحديثات مطلوبة" }, { status: 400 });
  }

  let updated = 0;

  await prisma.$transaction(async (tx) => {
    for (const u of body.updates) {
      const existing = await tx.service.findFirst({ where: { id: u.serviceId, providerId: params.id } });
      if (!existing) continue;

      const newProviderRate = u.newProviderRate;
      let newOurRate = parseFloat(String(existing.ourRate));

      if (body.applyMarkup && body.markupPercent !== undefined) {
        newOurRate = newProviderRate * (1 + body.markupPercent / 100);
      }

      await tx.service.update({
        where: { id: u.serviceId },
        data: {
          providerRate: newProviderRate,
          ourRate: newOurRate,
          ...(u.newMin !== undefined ? { min: u.newMin } : {}),
          ...(u.newMax !== undefined ? { max: u.newMax } : {}),
        },
      });

      await tx.serviceUpdate.create({
        data: {
          serviceId: u.serviceId,
          changeType: "PRICE_UPDATE",
          oldValue: String(parseFloat(String(existing.providerRate))),
          newValue: String(newProviderRate),
          note: "تحديث تلقائي من مزامنة المزود",
        },
      });

      updated++;
    }
  });

  await prisma.provider.update({
    where: { id: params.id },
    data: { lastSyncAt: new Date() },
  });

  return NextResponse.json({ updated, total: body.updates.length });
}
