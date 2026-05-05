"use client";

import { useState } from "react";

interface Props { settings: Record<string, string>; }

export default function EmailSettingsForm({ settings }: Props) {
  const [form, setForm] = useState({
    smtp_host: settings.smtp_host ?? "",
    smtp_port: settings.smtp_port ?? "587",
    smtp_user: settings.smtp_user ?? "",
    smtp_pass: settings.smtp_pass ?? "",
    smtp_from: settings.smtp_from ?? "",
    smtp_from_name: settings.smtp_from_name ?? "SMM Pro",
    email_order_completed: settings.email_order_completed ?? "true",
    email_deposit_confirmed: settings.email_deposit_confirmed ?? "true",
    email_ticket_reply: settings.email_ticket_reply ?? "true",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 3000); }
    } finally { setSaving(false); }
  }

  const toggle = (key: keyof typeof form) =>
    setForm({ ...form, [key]: form[key] === "true" ? "false" : "true" });

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 text-sm">
          تم حفظ إعدادات الإيميل بنجاح
        </div>
      )}
      {testResult && (
        <div className={`border rounded-lg p-3 text-sm ${testResult.includes("نجح") ? "bg-green-500/10 border-green-500/30 text-green-400" : "bg-red-500/10 border-red-500/30 text-red-400"}`}>
          {testResult}
        </div>
      )}

      {/* SMTP */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-white">إعدادات SMTP</h2>
        <div className="bg-slate-800/40 rounded-lg p-3 text-sm text-slate-400">
          يمكنك استخدام Gmail (مع App Password)، أو Brevo، أو Mailgun، أو أي خدمة SMTP.
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">SMTP Host</label>
            <input className="input w-full font-mono text-sm" value={form.smtp_host} dir="ltr"
              onChange={(e) => setForm({ ...form, smtp_host: e.target.value })}
              placeholder="smtp.gmail.com" />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">المنفذ (Port)</label>
            <input type="number" className="input w-full" value={form.smtp_port} dir="ltr"
              onChange={(e) => setForm({ ...form, smtp_port: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">اسم المستخدم (Email)</label>
          <input type="email" className="input w-full" value={form.smtp_user} dir="ltr"
            onChange={(e) => setForm({ ...form, smtp_user: e.target.value })}
            placeholder="noreply@yourdomain.com" />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">كلمة المرور / App Password</label>
          <input type="password" className="input w-full font-mono" value={form.smtp_pass} dir="ltr"
            onChange={(e) => setForm({ ...form, smtp_pass: e.target.value })} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">اسم المُرسِل</label>
            <input className="input w-full" value={form.smtp_from_name}
              onChange={(e) => setForm({ ...form, smtp_from_name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">إيميل المُرسِل</label>
            <input type="email" className="input w-full" value={form.smtp_from} dir="ltr"
              onChange={(e) => setForm({ ...form, smtp_from: e.target.value })}
              placeholder="noreply@..." />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card space-y-3">
        <h2 className="font-semibold text-white mb-2">الإشعارات</h2>

        {[
          { key: "email_order_completed" as const, label: "إشعار عند اكتمال الطلب", desc: "يرسل إيميل للمستخدم عند اكتمال طلبه" },
          { key: "email_deposit_confirmed" as const, label: "إشعار عند تأكيد الإيداع", desc: "يرسل إيميل عند تأكيد شحن الرصيد" },
          { key: "email_ticket_reply" as const, label: "إشعار عند الرد على التذكرة", desc: "يرسل إيميل عند رد الأدمن على تذكرة" },
        ].map((item) => (
          <div key={item.key} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
            <div>
              <div className="text-slate-200 text-sm font-medium">{item.label}</div>
              <div className="text-slate-500 text-xs">{item.desc}</div>
            </div>
            <button type="button" onClick={() => toggle(item.key)}
              className={`relative w-12 h-6 rounded-full transition-colors ${form[item.key] === "true" ? "bg-green-500" : "bg-slate-600"}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form[item.key] === "true" ? "right-1" : "left-1"}`} />
            </button>
          </div>
        ))}
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "جاري الحفظ..." : "حفظ إعدادات الإيميل"}
      </button>
    </form>
  );
}
