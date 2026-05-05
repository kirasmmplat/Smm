import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { renderOrderInvoice } from "@/lib/invoice-pdf";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
      service: {
        include: {
          serviceType: {
            include: { category: { include: { platform: { select: { name: true } } } } },
          },
        },
      },
    },
  });

  if (!order) return NextResponse.json({ message: "الطلب غير موجود" }, { status: 404 });
  if (auth.user.role !== "ADMIN" && order.userId !== auth.user.id) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }

  const platform =
    order.service.serviceType?.category?.platform?.name ?? "SMM";
  const shortId = order.id.slice(-8).toUpperCase();
  const invoiceNumber = `INV-ORD-${shortId}`;

  const pdfBuffer = await renderOrderInvoice({
    invoiceNumber,
    createdAt: order.createdAt,
    userName: order.user.name,
    userEmail: order.user.email,
    orderId: order.id,
    serviceName: order.service.name,
    platform,
    link: order.link,
    quantity: order.quantity,
    charge: Number(order.charge),
    status: order.status,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-order-${shortId}.pdf"`,
    },
  });
}
