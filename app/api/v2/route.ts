import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

function err(msg: string) {
  return NextResponse.json({ error: msg });
}

export async function POST(req: NextRequest) {
  let body: Record<string, string> = {};
  const contentType = req.headers.get("content-type") ?? "";

  try {
    if (contentType.includes("application/json")) {
      body = await req.json();
    } else {
      const text = await req.text();
      for (const pair of text.split("&")) {
        const [k, v] = pair.split("=");
        if (k) body[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
      }
    }
  } catch {
    return err("Invalid request body");
  }

  const { key, action } = body;
  if (!key) return err("API key is required");
  if (!action) return err("Action is required");

  const rlKey = key ? `v2:${key}` : `v2:ip:${getClientIp(req)}`;
  const rl = checkRateLimit(rlKey, 60, 60 * 1000);
  if (!rl.success) return NextResponse.json({ error: "Too many requests. Limit: 60/minute." }, { status: 429 });

  const user = await prisma.user.findFirst({
    where: { apiKey: key, apiEnabled: true, status: "ACTIVE" },
    select: {
      id: true, balance: true, discountPercent: true, role: true,
      accountLevel: { select: { discountPercent: true } },
    },
  });

  if (!user) return err("Invalid API key");

  switch (action) {
    case "services": {
      const services = await prisma.service.findMany({
        where: { status: "ACTIVE" },
        include: { serviceType: { include: { category: { include: { platform: true } } } } },
        orderBy: { id: "asc" },
      });
      return NextResponse.json(
        services.map((s) => ({
          service: s.id,
          name: s.name,
          type: s.serviceType?.category?.platform?.name ?? "General",
          category: `${s.serviceType?.category?.name ?? ""} - ${s.serviceType?.name ?? ""}`,
          rate: (Number(s.ourRate) / 1000).toFixed(6),
          min: s.min,
          max: s.max,
          refill: s.refill,
          cancel: s.cancel,
        }))
      );
    }

    case "add": {
      const { service: serviceId, link, quantity } = body;
      if (!serviceId || !link || !quantity) return err("Missing required fields: service, link, quantity");

      const qty = parseInt(quantity);
      if (isNaN(qty) || qty <= 0) return err("Invalid quantity");

      const service = await prisma.service.findUnique({ where: { id: serviceId, status: "ACTIVE" } });
      if (!service) return err("Service not found or inactive");
      if (qty < service.min || qty > service.max) return err(`Quantity must be between ${service.min} and ${service.max}`);

      const discount = user.discountPercent / 100;
      const charge = (Number(service.ourRate) * qty / 1000) * (1 - discount);
      const balance = Number(user.balance);

      if (balance < charge) return err("Insufficient balance");

      const [order] = await prisma.$transaction([
        prisma.order.create({
          data: {
            userId: user.id,
            serviceId: service.id,
            providerId: service.providerId,
            link,
            quantity: qty,
            charge,
            status: "PENDING",
          },
        }),
        prisma.user.update({
          where: { id: user.id },
          data: { balance: { decrement: charge }, totalSpent: { increment: charge } },
        }),
        prisma.transaction.create({
          data: {
            userId: user.id,
            type: "ORDER_CHARGE",
            amount: charge,
            balanceBefore: balance,
            balanceAfter: balance - charge,
            status: "COMPLETED",
            notes: `طلب عبر API - ${service.name}`,
          },
        }),
        prisma.service.update({ where: { id: service.id }, data: { totalOrders: { increment: 1 } } }),
      ]);

      return NextResponse.json({ order: order.id });
    }

    case "status": {
      const { order: orderId } = body;
      if (!orderId) return err("Order ID required");

      const order = await prisma.order.findFirst({
        where: { id: orderId, userId: user.id },
      });
      if (!order) return err("Order not found");

      return NextResponse.json({
        charge: Number(order.charge).toFixed(6),
        start_count: order.startCount ?? 0,
        status: order.status,
        remains: order.remains ?? 0,
        currency: "USD",
      });
    }

    case "multiple_status": {
      const { orders } = body;
      if (!orders) return err("Orders IDs required");

      const ids = orders.split(",").map((s) => s.trim()).filter(Boolean);
      const found = await prisma.order.findMany({ where: { id: { in: ids }, userId: user.id } });
      const result: Record<string, unknown> = {};

      for (const o of found) {
        result[o.id] = {
          charge: Number(o.charge).toFixed(6),
          start_count: o.startCount ?? 0,
          status: o.status,
          remains: o.remains ?? 0,
          currency: "USD",
        };
      }
      return NextResponse.json(result);
    }

    case "balance": {
      return NextResponse.json({ balance: Number(user.balance).toFixed(6), currency: "USD" });
    }

    case "refill": {
      const { order: orderId } = body;
      if (!orderId) return err("Order ID required");

      const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { service: true } });
      if (!order) return err("Order not found");
      if (!order.service.refill) return err("Refill not supported for this service");

      const refill = await prisma.refill.create({
        data: { originalOrderId: orderId, userId: user.id, status: "PENDING" },
      });
      return NextResponse.json({ refill: refill.id });
    }

    case "refill_status": {
      const { refill: refillId } = body;
      if (!refillId) return err("Refill ID required");

      const refill = await prisma.refill.findFirst({ where: { id: refillId, userId: user.id } });
      if (!refill) return err("Refill not found");

      return NextResponse.json({ status: refill.status });
    }

    case "cancel": {
      const { order: orderId } = body;
      if (!orderId) return err("Order ID required");

      const order = await prisma.order.findFirst({ where: { id: orderId, userId: user.id }, include: { service: true } });
      if (!order) return err("Order not found");
      if (!["PENDING", "IN_PROGRESS"].includes(order.status)) return err("Order cannot be canceled");
      if (!order.service.cancel) return err("Cancel not supported for this service");

      await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELED" } });
      return NextResponse.json({ cancel: 1 });
    }

    default:
      return err(`Unknown action: ${action}`);
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
