import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = parseInt(url.searchParams.get("limit") ?? "50");
  const action = url.searchParams.get("action") ?? "";
  const severity = url.searchParams.get("severity") ?? "";
  const search = url.searchParams.get("search") ?? "";
  const from = url.searchParams.get("from") ?? "";
  const to = url.searchParams.get("to") ?? "";

  try {
    const where: Record<string, unknown> = {};
    if (action) where.action = action;
    if (severity) where.severity = severity;
    if (search) {
      where.OR = [
        { userEmail: { contains: search, mode: "insensitive" } },
        { action: { contains: search, mode: "insensitive" } },
        { entity: { contains: search, mode: "insensitive" } },
      ];
    }
    if (from || to) {
      where.createdAt = {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(to + "T23:59:59Z") } : {}),
      };
    }

    const [logs, total, actions] = await Promise.all([
      (prisma as any).auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        include: { user: { select: { name: true, email: true, username: true } } },
      }),
      (prisma as any).auditLog.count({ where }),
      (prisma as any).auditLog.groupBy({
        by: ["action"],
        _count: true,
        orderBy: { _count: { action: "desc" } },
        take: 20,
      }),
    ]);

    return NextResponse.json({ logs, total, page, limit, actions });
  } catch (e: any) {
    return NextResponse.json({ logs: [], total: 0, page: 1, limit, actions: [], error: e.message });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const before = url.searchParams.get("before");
  if (!before) return NextResponse.json({ error: "Missing before date" }, { status: 400 });

  try {
    const deleted = await (prisma as any).auditLog.deleteMany({
      where: { createdAt: { lt: new Date(before) } },
    });
    return NextResponse.json({ deleted: deleted.count });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
