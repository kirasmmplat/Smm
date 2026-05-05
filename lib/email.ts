import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "SMM Pro <onboarding@resend.dev>";
const SITE = process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Pro";
const BASE_URL = process.env.NEXTAUTH_URL ?? "https://smmpro.replit.app";

function baseTemplate(title: string, body: string): string {
  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title></head>
<body style="margin:0;padding:0;background:#F5F3FF;font-family:'Segoe UI',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5F3FF;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <tr><td style="background:linear-gradient(135deg,#7C3AED,#6D28D9);padding:28px 32px;border-radius:16px 16px 0 0;text-align:center;">
          <h1 style="color:#fff;margin:0;font-size:22px;font-weight:900;">${SITE}</h1>
        </td></tr>
        <tr><td style="background:#fff;padding:32px;border-radius:0 0 16px 16px;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          ${body}
          <hr style="border:none;border-top:1px solid #EDE9FE;margin:28px 0;">
          <p style="color:#9CA3AF;font-size:12px;text-align:center;margin:0;">
            هذا البريد أُرسل تلقائياً من ${SITE} · <a href="${BASE_URL}" style="color:#7C3AED;">زيارة الموقع</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export async function sendOrderCompletedEmail(opts: {
  to: string;
  name: string;
  orderId: string;
  serviceName: string;
  quantity: number;
  charge: number;
  status: string;
}) {
  if (!resend) {
    console.log("[Email] RESEND_API_KEY not set — skipping order email:", opts.orderId);
    return;
  }

  const statusLabels: Record<string, string> = {
    COMPLETED: "مكتمل ✅",
    PARTIAL: "جزئي ⚠️",
    CANCELED: "ملغي ❌",
    FAILED: "فشل ❌",
  };

  const body = `
    <h2 style="color:#1E1B4B;font-size:20px;margin:0 0 8px;">مرحباً ${opts.name} 👋</h2>
    <p style="color:#6B7280;margin:0 0 24px;">تم تحديث حالة طلبك.</p>
    <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="6" cellspacing="0">
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">رقم الطلب</td><td style="color:#374151;font-size:13px;" dir="ltr">#${opts.orderId.slice(-10)}</td></tr>
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">الخدمة</td><td style="color:#374151;font-size:13px;">${opts.serviceName}</td></tr>
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">الكمية</td><td style="color:#374151;font-size:13px;">${opts.quantity.toLocaleString()}</td></tr>
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">المبلغ</td><td style="color:#374151;font-size:13px;" dir="ltr">$${opts.charge.toFixed(4)}</td></tr>
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">الحالة</td><td style="color:#374151;font-size:13px;font-weight:700;">${statusLabels[opts.status] ?? opts.status}</td></tr>
      </table>
    </div>
    <a href="${BASE_URL}/dashboard/orders/${opts.orderId}" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">عرض الطلب</a>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `تحديث طلبك — ${statusLabels[opts.status] ?? opts.status} | ${SITE}`,
      html: baseTemplate(`تحديث طلب | ${SITE}`, body),
    });
  } catch (e) {
    console.error("[Email] Failed to send order email:", e);
  }
}

export async function sendDepositConfirmedEmail(opts: {
  to: string;
  name: string;
  amount: number;
  newBalance: number;
  transactionId: string;
}) {
  if (!resend) {
    console.log("[Email] RESEND_API_KEY not set — skipping deposit email");
    return;
  }

  const body = `
    <h2 style="color:#1E1B4B;font-size:20px;margin:0 0 8px;">مرحباً ${opts.name} 👋</h2>
    <p style="color:#6B7280;margin:0 0 24px;">تم تأكيد إيداعك وإضافته لرصيدك.</p>
    <div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
      <div style="color:#059669;font-size:36px;font-weight:900;" dir="ltr">+$${opts.amount.toFixed(2)}</div>
      <div style="color:#6B7280;font-size:13px;margin-top:6px;">تمت إضافته لرصيدك بنجاح</div>
    </div>
    <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:12px;padding:20px;margin-bottom:24px;">
      <table width="100%" cellpadding="6" cellspacing="0">
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">المبلغ المُودَع</td><td style="color:#374151;font-size:14px;font-weight:700;" dir="ltr">$${opts.amount.toFixed(2)}</td></tr>
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">الرصيد الجديد</td><td style="color:#059669;font-size:14px;font-weight:700;" dir="ltr">$${opts.newBalance.toFixed(2)}</td></tr>
        <tr><td style="color:#7C3AED;font-weight:700;font-size:13px;">رقم المعاملة</td><td style="color:#374151;font-size:12px;" dir="ltr">${opts.transactionId.slice(-12)}</td></tr>
      </table>
    </div>
    <a href="${BASE_URL}/dashboard/add-funds" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">عرض المحفظة</a>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `تم تأكيد إيداعك $${opts.amount.toFixed(2)} | ${SITE}`,
      html: baseTemplate(`تأكيد الإيداع | ${SITE}`, body),
    });
  } catch (e) {
    console.error("[Email] Failed to send deposit email:", e);
  }
}

export async function sendTicketReplyEmail(opts: {
  to: string;
  name: string;
  ticketId: string;
  subject: string;
  replyMessage: string;
}) {
  if (!resend) {
    console.log("[Email] RESEND_API_KEY not set — skipping ticket email");
    return;
  }

  const body = `
    <h2 style="color:#1E1B4B;font-size:20px;margin:0 0 8px;">مرحباً ${opts.name} 👋</h2>
    <p style="color:#6B7280;margin:0 0 16px;">فريق الدعم رد على تذكرتك:</p>
    <div style="background:#F5F3FF;border-right:4px solid #7C3AED;border-radius:0 12px 12px 0;padding:16px 20px;margin-bottom:24px;">
      <div style="color:#7C3AED;font-size:12px;font-weight:700;margin-bottom:6px;">الموضوع: ${opts.subject}</div>
      <div style="color:#374151;font-size:14px;line-height:1.6;">${opts.replyMessage.replace(/\n/g, "<br>")}</div>
    </div>
    <a href="${BASE_URL}/dashboard/tickets/${opts.ticketId}" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">عرض التذكرة والرد</a>
  `;

  try {
    await resend.emails.send({
      from: FROM,
      to: opts.to,
      subject: `رد جديد على تذكرتك: ${opts.subject} | ${SITE}`,
      html: baseTemplate(`رد على التذكرة | ${SITE}`, body),
    });
  } catch (e) {
    console.error("[Email] Failed to send ticket email:", e);
  }
}

export async function sendPasswordChangedEmail(opts: { to: string; name: string }) {
  if (!resend) return;
  const body = `
    <h2 style="color:#1E1B4B;font-size:20px;margin:0 0 8px;">مرحباً ${opts.name} 👋</h2>
    <p style="color:#6B7280;margin:0 0 20px;">تم تغيير كلمة مرور حسابك بنجاح.</p>
    <div style="background:#FEF3C7;border:1px solid #FCD34D;border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="color:#92400E;margin:0;font-size:13px;">⚠️ إذا لم تقم بهذا التغيير، يرجى التواصل مع الدعم الفني فوراً.</p>
    </div>
    <a href="${BASE_URL}/dashboard/tickets/new" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;">تواصل مع الدعم</a>
  `;
  try {
    await resend.emails.send({
      from: FROM, to: opts.to,
      subject: `تم تغيير كلمة مرور حسابك | ${SITE}`,
      html: baseTemplate(`تغيير كلمة المرور | ${SITE}`, body),
    });
  } catch (e) {
    console.error("[Email] Failed to send password changed email:", e);
  }
}
