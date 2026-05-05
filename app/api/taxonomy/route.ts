import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const platforms = await prisma.platform.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        categories: {
          where: { isActive: true },
          orderBy: { sortOrder: "asc" },
          include: {
            serviceTypes: {
              where: { isActive: true },
              orderBy: { sortOrder: "asc" },
            },
          },
        },
      },
    });
    return NextResponse.json(platforms);
  } catch {
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}
