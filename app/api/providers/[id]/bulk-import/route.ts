import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

interface BulkService {
  providerServiceId: string;
  name: string;
  providerRate: string;
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as {
    services: BulkService[];
    serviceTypeId: string;
    markupPercent: number;
  };

  if (!body.serviceTypeId || !body.services?.length) {
    return NextResponse.json({ message: "بيانات ناقصة" }, { status: 400 });
  }

  const providerId = params.id;
  const provider = await prisma.provider.findUnique({ where: { id: providerId } });
  if (!provider) return NextResponse.json({ message: "المزود غير موجود" }, { status: 404 });

  const serviceType = await prisma.serviceType.findUnique({ where: { id: body.serviceTypeId } });
  if (!serviceType) return NextResponse.json({ message: "التصنيف غير موجود" }, { status: 400 });

  // Get already-imported service IDs for this provider
  const existingIds = new Set(
    (await prisma.service.findMany({
      where: { providerId, providerServiceId: { in: body.services.map((s) => s.providerServiceId) } },
      select: { providerServiceId: true },
    })).map((s) => s.providerServiceId)
  );

  const toCreate = body.services.filter((s) => !existingIds.has(s.providerServiceId));
  const markup = Math.max(0, body.markupPercent ?? 30);

  let imported = 0;
  let errors = 0;
  const errorDetails: string[] = [];

  // Process in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < toCreate.length; i += BATCH_SIZE) {
    const batch = toCreate.slice(i, i + BATCH_SIZE);
    try {
      const result = await prisma.service.createMany({
        data: batch.map((s) => ({
          providerId,
          providerServiceId: s.providerServiceId,
          serviceTypeId: body.serviceTypeId,
          name: s.name,
          providerRate: parseFloat(s.providerRate),
          ourRate: parseFloat(s.providerRate) * (1 + markup / 100),
          min: s.min,
          max: s.max,
          refill: s.refill ?? false,
          cancel: s.cancel ?? false,
          status: "ACTIVE" as const,
        })),
        skipDuplicates: true,
      });
      imported += result.count;
    } catch (err) {
      errors += batch.length;
      errorDetails.push(err instanceof Error ? err.message : "unknown");
    }
  }

  return NextResponse.json({
    imported,
    skipped: existingIds.size,
    errors,
    errorDetails: errorDetails.slice(0, 5),
    total: body.services.length,
  });
}
