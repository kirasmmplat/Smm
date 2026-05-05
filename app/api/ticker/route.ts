import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const recentOrders = await prisma.order.findMany({
      take: 20,
      orderBy: { createdAt: "desc" },
      include: {
        service: {
          include: {
            serviceType: {
              include: {
                category: {
                  include: {
                    platform: { select: { name: true, icon: true } },
                  },
                },
              },
            },
          },
        },
        user: { select: { name: true } },
      },
    });

    const ticker = recentOrders.map((o) => ({
      id: o.id,
      user: o.user?.name ? o.user.name.slice(0, 2) + "***" : "م***",
      service: o.service?.name ?? "خدمة",
      platform: o.service?.serviceType?.category?.platform?.name ?? "",
      icon: o.service?.serviceType?.category?.platform?.icon ?? "⭐",
      quantity: o.quantity,
      status: o.status,
      createdAt: o.createdAt,
    }));

    return NextResponse.json({ ticker });
  } catch {
    return NextResponse.json({ ticker: [] });
  }
}
