import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { createAuditLog, getIpFromRequest } from "@/lib/audit";
import { UserStatus, Role } from "@prisma/client";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await requireAdmin();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: params.id },
    select: {
      id: true, name: true, email: true, username: true, role: true, status: true,
      balance: true, totalSpent: true, discountPercent: true, apiKey: true,
      emailNotifications: true, createdAt: true, lastLoginAt: true,
      accountLevel: { select: { name: true, color: true } },
      _count: { select: { orders: true, tickets: true, transactions: true } },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, status: true, charge: true, quantity: true, createdAt: true,
          service: { select: { name: true } },
        },
      },
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
        select: {
          id: true, type: true, amount: true, status: true, createdAt: true, notes: true,
        },
      },
    },
  });

  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  return NextResponse.json({
    ...user,
    balance: user.balance.toString(),
    totalSpent: user.totalSpent.toString(),
    orders: user.orders.map((o) => ({ ...o, charge: o.charge.toString() })),
    transactions: user.transactions.map((t) => ({ ...t, amount: t.amount.toString() })),
  });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json() as {
    role?: string;
    status?: string;
    discountPercent?: number;
    addBalance?: number;
    notes?: string;
  };

  const user = await prisma.user.findUnique({ where: { id: params.id } });
  if (!user) return NextResponse.json({ message: "User not found" }, { status: 404 });

  const updates: Record<string, unknown> = {};
  if (body.role && Object.values(Role).includes(body.role as Role)) updates.role = body.role;
  if (body.status && Object.values(UserStatus).includes(body.status as UserStatus)) updates.status = body.status;
  if (typeof body.discountPercent === "number") updates.discountPercent = Math.min(100, Math.max(0, body.discountPercent));

  // Handle balance adjustment (legacy support)
  if (body.addBalance !== undefined) {
    const currentBalance = parseFloat(user.balance.toString());
    const newBalance = currentBalance + body.addBalance;
    if (newBalance < 0) return NextResponse.json({ message: "الرصيد لا يمكن أن يكون سالباً" }, { status: 400 });
    updates.balance = newBalance;
    await prisma.transaction.create({
      data: {
        userId: params.id,
        type: "ADMIN_ADJUST",
        amount: Math.abs(body.addBalance),
        balanceBefore: currentBalance,
        balanceAfter: newBalance,
        status: "COMPLETED",
        notes: body.notes ?? "تعديل يدوي من الأدمن",
      },
    });
  }

  const updated = await prisma.user.update({
    where: { id: params.id },
    data: updates,
    select: { id: true, role: true, status: true, balance: true, discountPercent: true },
  });

  const ip = getIpFromRequest(req);
  const adminEmail = auth.user?.email ?? "admin";
  if (body.status && body.status !== user.status) {
    void createAuditLog({ action: body.status === "BANNED" ? "USER_BANNED" : "USER_UNBANNED", userId: params.id, userEmail: adminEmail, entity: "User", entityId: params.id, ip, severity: body.status === "BANNED" ? "WARNING" : "INFO", details: { targetEmail: user.email, oldStatus: user.status, newStatus: body.status } });
  }
  if (body.role && body.role !== user.role) {
    void createAuditLog({ action: "USER_ROLE_CHANGED", userId: params.id, userEmail: adminEmail, entity: "User", entityId: params.id, ip, severity: "WARNING", details: { targetEmail: user.email, oldRole: user.role, newRole: body.role } });
  }
  if (body.addBalance !== undefined) {
    void createAuditLog({ action: "BALANCE_ADJUSTED", userId: params.id, userEmail: adminEmail, entity: "User", entityId: params.id, ip, severity: "INFO", details: { targetEmail: user.email, amount: body.addBalance, notes: body.notes } });
  }

  return NextResponse.json({ ...updated, balance: updated.balance.toString() });
}
