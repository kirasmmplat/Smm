import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { renderTransactionInvoice } from "@/lib/invoice-pdf";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const tx = await prisma.transaction.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!tx) return NextResponse.json({ message: "المعاملة غير موجودة" }, { status: 404 });
  if (auth.user.role !== "ADMIN" && tx.userId !== auth.user.id) {
    return NextResponse.json({ message: "غير مصرح" }, { status: 403 });
  }

  const shortId = tx.id.slice(-8).toUpperCase();
  const invoiceNumber = tx.invoiceNumber ?? `INV-TX-${shortId}`;

  const pdfBuffer = await renderTransactionInvoice({
    invoiceNumber,
    createdAt: tx.createdAt,
    userName: tx.user.name,
    userEmail: tx.user.email,
    transactionId: tx.id,
    type: tx.type,
    amount: Number(tx.amount),
    balanceBefore: Number(tx.balanceBefore),
    balanceAfter: Number(tx.balanceAfter),
    status: tx.status,
    paymentMethod: tx.paymentMethod,
    notes: tx.notes,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="invoice-tx-${shortId}.pdf"`,
    },
  });
}
