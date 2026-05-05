// @ts-nocheck
import fs from "fs";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  renderToBuffer,
} from "@react-pdf/renderer";
import React from "react";

Font.register({
  family: "Cairo",
  fonts: [
    { src: fs.readFileSync("public/fonts/Cairo-Regular.ttf"), fontWeight: 400 },
    { src: fs.readFileSync("public/fonts/Cairo-Bold.ttf"), fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Cairo",
    fontSize: 11,
    padding: 40,
    backgroundColor: "#ffffff",
    direction: "rtl",
  },
  header: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 30,
    borderBottom: "2px solid #7C3AED",
    paddingBottom: 20,
  },
  brand: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  brandName: {
    fontSize: 24,
    fontWeight: 700,
    color: "#7C3AED",
  },
  brandSub: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
  },
  invoiceLabel: {
    fontSize: 18,
    fontWeight: 700,
    color: "#1E1B4B",
    textAlign: "right",
  },
  invoiceNum: {
    fontSize: 12,
    color: "#7C3AED",
    textAlign: "right",
    marginTop: 4,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 700,
    color: "#1E1B4B",
    marginBottom: 8,
    textAlign: "right",
    borderBottom: "1px solid #DDD6FE",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderBottom: "1px solid #F3F4F6",
  },
  rowLabel: {
    color: "#6B7280",
    fontSize: 10,
    textAlign: "right",
  },
  rowValue: {
    color: "#1E1B4B",
    fontSize: 10,
    fontWeight: 700,
    textAlign: "left",
  },
  totalRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    paddingVertical: 8,
    backgroundColor: "#F5F3FF",
    paddingHorizontal: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: 700,
    color: "#1E1B4B",
    textAlign: "right",
  },
  totalValue: {
    fontSize: 13,
    fontWeight: 700,
    color: "#7C3AED",
    textAlign: "left",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 10,
    fontWeight: 700,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#9CA3AF",
    borderTop: "1px solid #E5E7EB",
    paddingTop: 10,
  },
});

function statusLabel(s: string) {
  const map: Record<string, string> = {
    COMPLETED: "مكتمل",
    PENDING: "قيد الانتظار",
    IN_PROGRESS: "جاري التنفيذ",
    PROCESSING: "معالجة",
    PARTIAL: "جزئي",
    CANCELED: "ملغي",
    REFUNDED: "مسترد",
    FAILED: "فشل",
  };
  return map[s] ?? s;
}

function txStatusLabel(s: string) {
  const map: Record<string, string> = {
    PENDING: "قيد المراجعة",
    COMPLETED: "مؤكد",
    FAILED: "فشل",
    REJECTED: "مرفوض",
  };
  return map[s] ?? s;
}

function txTypeLabel(t: string) {
  const map: Record<string, string> = {
    DEPOSIT: "إيداع",
    ORDER_CHARGE: "خصم طلب",
    REFUND: "استرداد",
    BONUS: "مكافأة",
    REFERRAL_EARNING: "عمولة إحالة",
    ADMIN_ADJUST: "تعديل إداري",
  };
  return map[t] ?? t;
}

export interface OrderInvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  userName: string;
  userEmail: string;
  orderId: string;
  serviceName: string;
  platform: string;
  link: string;
  quantity: number;
  charge: number;
  status: string;
}

export interface TransactionInvoiceData {
  invoiceNumber: string;
  createdAt: Date;
  userName: string;
  userEmail: string;
  transactionId: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: string;
  paymentMethod?: string | null;
  notes?: string | null;
}

function OrderInvoiceDoc({ data }: { data: OrderInvoiceData }) {
  const dateStr = new Date(data.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>SMM Pro</Text>
            <Text style={styles.brandSub}>منصة التسويق الاجتماعي</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>فاتورة طلب</Text>
            <Text style={styles.invoiceNum}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بيانات العميل</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الاسم</Text>
            <Text style={styles.rowValue}>{data.userName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>البريد الإلكتروني</Text>
            <Text style={styles.rowValue}>{data.userEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>التاريخ</Text>
            <Text style={styles.rowValue}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل الطلب</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>رقم الطلب</Text>
            <Text style={styles.rowValue}>{data.orderId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الخدمة</Text>
            <Text style={styles.rowValue}>{data.serviceName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>المنصة</Text>
            <Text style={styles.rowValue}>{data.platform}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الرابط</Text>
            <Text style={styles.rowValue}>{data.link}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الكمية</Text>
            <Text style={styles.rowValue}>{data.quantity.toLocaleString()}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الحالة</Text>
            <Text style={styles.rowValue}>{statusLabel(data.status)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>المبلغ الإجمالي</Text>
            <Text style={styles.totalValue}>${data.charge.toFixed(4)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          SMM Pro — شكراً لاستخدامكم منصتنا | هذه الفاتورة صادرة إلكترونياً
        </Text>
      </Page>
    </Document>
  );
}

function TransactionInvoiceDoc({ data }: { data: TransactionInvoiceData }) {
  const dateStr = new Date(data.createdAt).toLocaleDateString("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Text style={styles.brandName}>SMM Pro</Text>
            <Text style={styles.brandSub}>منصة التسويق الاجتماعي</Text>
          </View>
          <View>
            <Text style={styles.invoiceLabel}>فاتورة معاملة مالية</Text>
            <Text style={styles.invoiceNum}>{data.invoiceNumber}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>بيانات العميل</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الاسم</Text>
            <Text style={styles.rowValue}>{data.userName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>البريد الإلكتروني</Text>
            <Text style={styles.rowValue}>{data.userEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>التاريخ</Text>
            <Text style={styles.rowValue}>{dateStr}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تفاصيل المعاملة</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>رقم المعاملة</Text>
            <Text style={styles.rowValue}>{data.transactionId}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>النوع</Text>
            <Text style={styles.rowValue}>{txTypeLabel(data.type)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>طريقة الدفع</Text>
            <Text style={styles.rowValue}>{data.paymentMethod ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الرصيد قبل</Text>
            <Text style={styles.rowValue}>${data.balanceBefore.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الرصيد بعد</Text>
            <Text style={styles.rowValue}>${data.balanceAfter.toFixed(2)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>الحالة</Text>
            <Text style={styles.rowValue}>{txStatusLabel(data.status)}</Text>
          </View>
          {data.notes ? (
            <View style={styles.row}>
              <Text style={styles.rowLabel}>ملاحظات</Text>
              <Text style={styles.rowValue}>{data.notes}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>المبلغ</Text>
            <Text style={styles.totalValue}>${data.amount.toFixed(2)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          SMM Pro — شكراً لاستخدامكم منصتنا | هذه الفاتورة صادرة إلكترونياً
        </Text>
      </Page>
    </Document>
  );
}

export async function renderOrderInvoice(data: OrderInvoiceData): Promise<Buffer> {
  return renderToBuffer(<OrderInvoiceDoc data={data} />);
}

export async function renderTransactionInvoice(data: TransactionInvoiceData): Promise<Buffer> {
  return renderToBuffer(<TransactionInvoiceDoc data={data} />);
}
