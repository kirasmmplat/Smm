import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const favorites = await prisma.favorite.findMany({
    where: { userId: auth.user.id },
    include: {
      service: {
        include: {
          serviceType: {
            include: {
              category: {
                include: { platform: { select: { id: true, name: true, icon: true } } },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    favorites: favorites.map((f) => ({
      ...f.service,
      ourRate: f.service.ourRate.toString(),
      providerRate: f.service.providerRate.toString(),
      isFavorite: true,
      favoritedAt: f.createdAt,
    })),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { serviceId: string };
  if (!body.serviceId) return NextResponse.json({ message: "serviceId مطلوب" }, { status: 400 });

  const service = await prisma.service.findUnique({ where: { id: body.serviceId } });
  if (!service) return NextResponse.json({ message: "الخدمة غير موجودة" }, { status: 404 });

  await prisma.favorite.upsert({
    where: { userId_serviceId: { userId: auth.user.id, serviceId: body.serviceId } },
    create: { userId: auth.user.id, serviceId: body.serviceId },
    update: {},
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const body = await req.json() as { serviceId: string };
  if (!body.serviceId) return NextResponse.json({ message: "serviceId مطلوب" }, { status: 400 });

  await prisma.favorite.deleteMany({
    where: { userId: auth.user.id, serviceId: body.serviceId },
  });

  return NextResponse.json({ success: true });
}
