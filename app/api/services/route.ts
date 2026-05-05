import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const platformId = searchParams.get("platformId");
    const categoryId = searchParams.get("categoryId");
    const serviceTypeId = searchParams.get("serviceTypeId");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "50");

    const where: Record<string, unknown> = { status: "ACTIVE" };

    if (serviceTypeId) {
      where.serviceTypeId = serviceTypeId;
    } else if (categoryId) {
      where.serviceType = { categoryId };
    } else if (platformId) {
      where.serviceType = { category: { platformId } };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
        where,
        orderBy: { sortOrder: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          serviceType: {
            include: {
              category: {
                include: { platform: { select: { id: true, name: true, icon: true } } },
              },
            },
          },
        },
      }),
      prisma.service.count({ where }),
    ]);

    // Get user favorites if logged in
    const session = await getServerSession(authOptions);
    let favoriteIds: Set<string> = new Set();
    if (session?.user?.id) {
      const favs = await prisma.favorite.findMany({
        where: { userId: session.user.id },
        select: { serviceId: true },
      });
      favoriteIds = new Set(favs.map((f) => f.serviceId));
    }

    return NextResponse.json({
      services: services.map((s) => ({
        ...s,
        isFavorite: favoriteIds.has(s.id),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch {
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}
