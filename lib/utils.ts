type ClassValue = string | number | boolean | null | undefined;

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(" ");
}

export function formatMoney(amount: string | number, currency = "$"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currency}${num.toFixed(4)}`;
}

export function formatBalance(amount: string | number, currency = "$"): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `${currency}${num.toFixed(2)}`;
}

export function generateReferralCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function generateApiKey(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let key = "";
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return key;
}

export function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, "0");
  return `INV-${year}-${random}`;
}

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: "قيد الانتظار",
  IN_PROGRESS: "جاري التنفيذ",
  PROCESSING: "يُعالج",
  COMPLETED: "مكتمل",
  PARTIAL: "جزئي",
  CANCELED: "ملغي",
  REFUNDED: "مُسترد",
  FAILED: "فشل",
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: "badge-pending",
  IN_PROGRESS: "badge-pending",
  PROCESSING: "badge-pending",
  COMPLETED: "badge-active",
  PARTIAL: "badge-warning",
  CANCELED: "badge-danger",
  REFUNDED: "badge-danger",
  FAILED: "badge-danger",
};
