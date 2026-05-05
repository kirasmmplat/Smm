const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : null;
const SITE = process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Pro";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://smmpro.replit.app";

async function send(chatId: string, text: string): Promise<boolean> {
  if (!API) {
    console.log("[Telegram] TELEGRAM_BOT_TOKEN not set — skipping message to", chatId);
    return false;
  }
  try {
    const res = await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const err = await res.json();
      console.error("[Telegram] sendMessage failed:", err);
      return false;
    }
    return true;
  } catch (e) {
    console.error("[Telegram] sendMessage error:", e);
    return false;
  }
}

export async function sendTelegramMessage(chatId: string, text: string): Promise<boolean> {
  return send(chatId, text);
}

export async function sendOrderUpdateTelegram(opts: {
  chatId: string;
  orderId: string;
  serviceName: string;
  quantity: number;
  charge: number;
  status: string;
}) {
  const statusEmoji: Record<string, string> = {
    COMPLETED: "✅", PARTIAL: "⚠️", CANCELED: "❌", FAILED: "❌",
    IN_PROGRESS: "⏳", PROCESSING: "🔄",
  };
  const statusLabel: Record<string, string> = {
    COMPLETED: "مكتمل", PARTIAL: "جزئي", CANCELED: "ملغي", FAILED: "فشل",
    IN_PROGRESS: "قيد التنفيذ", PROCESSING: "جاري المعالجة",
  };
  const emoji = statusEmoji[opts.status] ?? "📋";
  const label = statusLabel[opts.status] ?? opts.status;

  const text = `${emoji} <b>تحديث طلب | ${SITE}</b>

📌 رقم الطلب: <code>#${opts.orderId.slice(-10)}</code>
🛠 الخدمة: ${opts.serviceName}
📊 الكمية: ${opts.quantity.toLocaleString()}
💰 المبلغ: <code>$${opts.charge.toFixed(4)}</code>
📌 الحالة: <b>${label}</b>

🔗 <a href="${BASE_URL}/dashboard/orders/${opts.orderId}">عرض الطلب</a>`;

  return send(opts.chatId, text);
}

export async function sendDepositConfirmedTelegram(opts: {
  chatId: string;
  amount: number;
  newBalance: number;
  rejected?: boolean;
  rejectReason?: string;
}) {
  if (opts.rejected) {
    const text = `❌ <b>رُفض طلب الإيداع | ${SITE}</b>

💸 المبلغ: <code>$${opts.amount.toFixed(2)}</code>${opts.rejectReason ? `\n📝 السبب: ${opts.rejectReason}` : ""}

للاستفسار تواصل مع الدعم: <a href="${BASE_URL}/dashboard/tickets/new">فتح تذكرة</a>`;
    return send(opts.chatId, text);
  }

  const text = `✅ <b>تم تأكيد الإيداع | ${SITE}</b>

💵 المبلغ المُضاف: <code>+$${opts.amount.toFixed(2)}</code>
💰 رصيدك الجديد: <code>$${opts.newBalance.toFixed(2)}</code>

🚀 <a href="${BASE_URL}/dashboard/new-order">إنشاء طلب جديد</a>`;

  return send(opts.chatId, text);
}

export async function sendTicketReplyTelegram(opts: {
  chatId: string;
  ticketId: string;
  subject: string;
  replyMessage: string;
}) {
  const preview = opts.replyMessage.length > 200
    ? opts.replyMessage.slice(0, 200) + "..."
    : opts.replyMessage;

  const text = `💬 <b>رد جديد على تذكرتك | ${SITE}</b>

📋 الموضوع: ${opts.subject}

<blockquote>${preview}</blockquote>

🔗 <a href="${BASE_URL}/dashboard/tickets/${opts.ticketId}">عرض التذكرة والرد</a>`;

  return send(opts.chatId, text);
}

export async function sendPasswordChangedTelegram(chatId: string) {
  const text = `🔐 <b>تغيير كلمة المرور | ${SITE}</b>

تم تغيير كلمة مرور حسابك بنجاح.

⚠️ إذا لم تقم بهذا، تواصل مع الدعم فوراً:
🔗 <a href="${BASE_URL}/dashboard/tickets/new">فتح تذكرة طارئة</a>`;

  return send(chatId, text);
}

export async function sendNewOrderAdminTelegram(opts: {
  adminChatId: string;
  orderId: string;
  userName: string;
  serviceName: string;
  quantity: number;
  charge: number;
}) {
  const text = `🆕 <b>طلب جديد | ${SITE}</b>

👤 المستخدم: ${opts.userName}
🛠 الخدمة: ${opts.serviceName}
📊 الكمية: ${opts.quantity.toLocaleString()}
💰 المبلغ: <code>$${opts.charge.toFixed(4)}</code>

🔗 <a href="${BASE_URL}/admin/orders/${opts.orderId}">عرض في لوحة الأدمن</a>`;

  return send(opts.adminChatId, text);
}

export async function sendNewDepositAdminTelegram(opts: {
  adminChatId: string;
  transactionId: string;
  userName: string;
  amount: number;
  method: string;
}) {
  const text = `💳 <b>طلب إيداع جديد | ${SITE}</b>

👤 المستخدم: ${opts.userName}
💵 المبلغ: <code>$${opts.amount.toFixed(2)}</code>
💳 الطريقة: ${opts.method}

🔗 <a href="${BASE_URL}/admin/transactions">مراجعة وتأكيد</a>`;

  return send(opts.adminChatId, text);
}

// Register webhook with Telegram
export async function registerWebhook(webhookUrl: string): Promise<{ ok: boolean; description?: string }> {
  if (!API) return { ok: false, description: "TELEGRAM_BOT_TOKEN not set" };
  try {
    const res = await fetch(`${API}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: webhookUrl, allowed_updates: ["message"] }),
    });
    return await res.json() as { ok: boolean; description?: string };
  } catch (e) {
    return { ok: false, description: String(e) };
  }
}

// Get bot info (username etc.)
export async function getBotInfo(): Promise<{ ok: boolean; result?: { username: string; first_name: string } }> {
  if (!API) return { ok: false };
  try {
    const res = await fetch(`${API}/getMe`);
    return await res.json() as { ok: boolean; result?: { username: string; first_name: string } };
  } catch {
    return { ok: false };
  }
}
