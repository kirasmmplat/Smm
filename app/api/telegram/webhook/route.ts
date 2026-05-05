import { NextRequest, NextResponse } from "next/server";

type TelegramUpdate = {
  message?: {
    chat: { id: number; first_name?: string; username?: string };
    text?: string;
  };
};

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE = process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Pro";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://smmpro.replit.app";

async function replyToChat(chatId: number, text: string) {
  if (!BOT_TOKEN) return;
  await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function POST(req: NextRequest) {
  // Telegram sends updates as POST to the webhook URL
  try {
    const update = await req.json() as TelegramUpdate;
    const message = update.message;
    if (!message) return NextResponse.json({ ok: true });

    const chatId = message.chat.id;
    const firstName = message.chat.first_name ?? "مستخدم";
    const text = message.text?.trim() ?? "";

    if (text === "/start" || text.startsWith("/start ")) {
      await replyToChat(chatId, `👋 مرحباً ${firstName}!

🤖 هذا بوت إشعارات <b>${SITE}</b>

لتفعيل الإشعارات على حسابك، اتبع الخطوات:

1️⃣ انسخ الـ Chat ID الخاص بك:
<code>${chatId}</code>

2️⃣ اذهب إلى إعدادات حسابك:
🔗 <a href="${BASE_URL}/dashboard/account">إعدادات الحساب → تبويب الإشعارات</a>

3️⃣ الصق الـ Chat ID في خانة "Chat ID" واضغط "ربط تيليجرام"

بعد الربط ستصلك إشعارات عن:
✅ اكتمال طلباتك
💰 تأكيد إيداعاتك
💬 ردود فريق الدعم
🔐 تغييرات الأمان`);
    } else if (text === "/id" || text === "/chatid") {
      await replyToChat(chatId, `🆔 الـ Chat ID الخاص بك:

<code>${chatId}</code>

انسخه والصقه في إعدادات حسابك لتفعيل الإشعارات.`);
    } else if (text === "/help" || text === "/مساعدة") {
      await replyToChat(chatId, `📚 <b>الأوامر المتاحة:</b>

/start — الترحيب والتعليمات
/id — عرض الـ Chat ID الخاص بك
/help — هذه القائمة

🔗 للوصول للمنصة: <a href="${BASE_URL}">${SITE}</a>`);
    } else {
      // Any other message → remind them of their Chat ID
      await replyToChat(chatId, `🆔 الـ Chat ID الخاص بك: <code>${chatId}</code>

أرسل /start للتعليمات الكاملة.`);
    }
  } catch (e) {
    console.error("[Telegram webhook] Error:", e);
  }

  // Always return 200 to Telegram
  return NextResponse.json({ ok: true });
}
