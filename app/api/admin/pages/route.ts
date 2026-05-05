import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;
  const pages = await prisma.page.findMany({ orderBy: { slug: "asc" } });
  return NextResponse.json({ pages });
}
