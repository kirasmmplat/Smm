/**
 * Cron: مزامنة أسعار وبيانات الخدمات من المزودين تلقائياً
 *
 * يُشغَّل كل 6 ساعات (اضبطه في Vercel Cron أو أي scheduler خارجي)
 * Authorization: Bearer CRON_SECRET
 *
 * ماذا يفعل؟
 *  1. يجلب خدمات كل مزود نشط من API الخاص به
 *  2. يقارن الأسعار والحدود مع ما لدينا في DB
 *  3. يحدّث الخدمات التي تغيّرت ويسجّل التغيير في ServiceUpdate
 *  4. يحدّث رصيد المزود عندنا
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 دقائق كحد أقصى

interface ProviderService {
  service: string | number;
  name: string;
  type?: string;
  category?: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  refill?: boolean | number;
  cancel?: boolean | number;
}

async function fetchProviderServices(
  url: string,
  apiKey: string
): Promise<ProviderService[] | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey, action: "services" }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

async function fetchProviderBalance(
  url: string,
  apiKey: string
): Promise<number | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: apiKey, action: "balance" }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { balance?: string | number };
    return data.balance ? parseFloat(String(data.balance)) : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  // ── التحقق من الصلاحية ──────────────────────────────────────────────────
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET ?? "cron-secret-smm";
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const providers = await prisma.provider.findMany({
    where: { status: "ACTIVE" },
    include: {
      services: {
        select: {
          id: true,
          providerServiceId: true,
          providerRate: true,
          ourRate: true,
          min: true,
          max: true,
          refill: true,
          cancel: true,
        },
      },
    },
  });

  let totalUpdated = 0;
  let totalProvidersFailed = 0;
  const providerResults: Record<string, { updated: number; error?: string }> = {};

  for (const provider of providers) {
    // ── تحديث رصيد المزود ─────────────────────────────────────────────────
    const balance = await fetchProviderBalance(provider.url, provider.apiKey);
    if (balance !== null) {
      await prisma.provider.update({
        where: { id: provider.id },
        data: { balance, lastSyncAt: new Date() },
      });
    }

    // ── جلب الخدمات ────────────────────────────────────────────────────────
    const remoteServices = await fetchProviderServices(provider.url, provider.apiKey);

    if (!remoteServices) {
      totalProvidersFailed++;
      providerResults[provider.name] = { updated: 0, error: "فشل الاتصال بالمزود" };
      continue;
    }

    let providerUpdated = 0;

    for (const remote of remoteServices) {
      const remoteId = String(remote.service);
      const existing = provider.services.find(
        (s) => s.providerServiceId === remoteId
      );

      // نتجاهل الخدمات الجديدة — الأدمن يضيفها يدوياً
      if (!existing) continue;

      const newRate = parseFloat(String(remote.rate));
      const newMin = parseInt(String(remote.min), 10);
      const newMax = parseInt(String(remote.max), 10);
      const newRefill = Boolean(remote.refill);
      const newCancel = Boolean(remote.cancel);

      const currentRate = parseFloat(String(existing.providerRate));
      const rateChanged = Math.abs(newRate - currentRate) > 0.000001;
      const minChanged = existing.min !== newMin;
      const maxChanged = existing.max !== newMax;
      const refillChanged = existing.refill !== newRefill;
      const cancelChanged = existing.cancel !== newCancel;

      if (!rateChanged && !minChanged && !maxChanged && !refillChanged && !cancelChanged) {
        continue;
      }

      // حساب سعرنا الجديد بناءً على نسبة الربح الحالية
      let newOurRate = parseFloat(String(existing.ourRate));
      if (rateChanged && currentRate > 0) {
        const markup = parseFloat(String(existing.ourRate)) / currentRate;
        newOurRate = newRate * markup;
      }

      // تحديث الخدمة
      await prisma.service.update({
        where: { id: existing.id },
        data: {
          providerRate: newRate,
          ourRate: newOurRate,
          min: newMin,
          max: newMax,
          refill: newRefill,
          cancel: newCancel,
          updatedAt: new Date(),
        },
      });

      // تسجيل التغييرات في ServiceUpdate
      const changes: Array<{ changeType: string; oldValue: string; newValue: string }> = [];

      if (rateChanged) {
        changes.push({
          changeType: "PRICE_CHANGE",
          oldValue: currentRate.toFixed(6),
          newValue: newRate.toFixed(6),
        });
      }
      if (minChanged) {
        changes.push({
          changeType: "MIN_CHANGE",
          oldValue: String(existing.min),
          newValue: String(newMin),
        });
      }
      if (maxChanged) {
        changes.push({
          changeType: "MAX_CHANGE",
          oldValue: String(existing.max),
          newValue: String(newMax),
        });
      }

      if (changes.length > 0) {
        await prisma.serviceUpdate.createMany({
          data: changes.map((c) => ({
            serviceId: existing.id,
            changeType: c.changeType,
            oldValue: c.oldValue,
            newValue: c.newValue,
            note: `تحديث تلقائي من مزامنة ${provider.name}`,
          })),
        });
      }

      providerUpdated++;
      totalUpdated++;
    }

    // تحديث عدد الخدمات الإجمالي للمزود
    await prisma.provider.update({
      where: { id: provider.id },
      data: {
        totalServices: remoteServices.length,
        lastSyncAt: new Date(),
      },
    });

    providerResults[provider.name] = { updated: providerUpdated };
  }

  return NextResponse.json({
    ok: true,
    totalUpdated,
    totalProviders: providers.length,
    totalProvidersFailed,
    results: providerResults,
    timestamp: new Date().toISOString(),
  });
}
