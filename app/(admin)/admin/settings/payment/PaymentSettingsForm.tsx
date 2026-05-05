"use client";

import { useState } from "react";

interface Props { settings: Record<string, string>; }

export default function PaymentSettingsForm({ settings }: Props) {
  const [form, setForm] = useState({
    stripe_enabled: settings.stripe_enabled ?? "false",
    stripe_publishable_key: settings.stripe_publishable_key ?? "",
    stripe_secret_key: settings.stripe_secret_key ?? "",
    stripe_webhook_secret: settings.stripe_webhook_secret ?? "",
    paypal_enabled: settings.paypal_enabled ?? "false",
    paypal_client_id: settings.paypal_client_id ?? "",
    paypal_secret: settings.paypal_secret ?? "",
    paypal_mode: settings.paypal_mode ?? "sandbox",
    manual_enabled: settings.manual_enabled ?? "true",
    manual_details: settings.manual_details ?? "",
    manual_min: settings.manual_min ?? "5",
    crypto_enabled: settings.crypto_enabled ?? "false",
    crypto_address_btc: settings.crypto_address_btc ?? "",
    crypto_address_eth: settings.crypto_address_eth ?? "",
    crypto_address_usdt: settings.crypto_address_usdt ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
          تم حفظ إعدادات الدفع بنجاح
        </div>
      )}

      {/* Stripe */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-black flex items-center justify-center">S</span>
              Stripe — بطاقة ائتمان
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">دفع فوري بفيزا / ماستركارد — يُضاف الرصيد تلقائياً</p>
          </div>
          <button type="button" onClick={() => toggle("stripe_enabled")}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.stripe_enabled === "true" ? "bg-emerald-500" : "bg-slate-600"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.stripe_enabled === "true" ? "right-1" : "left-1"}`} />
          </button>
        </div>
        {form.stripe_enabled === "true" && (
          <>
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-3 text-xs text-violet-300">
              أضف المتغيرات في Secrets (Replit):<br />
              <code className="text-violet-200 font-mono">STRIPE_SECRET_KEY</code> و <code className="text-violet-200 font-mono">STRIPE_WEBHOOK_SECRET</code><br />
              Webhook URL: <code className="text-violet-200 font-mono" dir="ltr">/api/payments/stripe/webhook</code>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Stripe Publishable Key (pk_live_... أو pk_test_...)</label>
              <input className="input w-full font-mono text-xs" value={form.stripe_publishable_key} dir="ltr"
                onChange={(e) => setForm({ ...form, stripe_publishable_key: e.target.value })}
                placeholder="pk_live_..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Stripe Secret Key (sk_live_...)</label>
              <input type="password" className="input w-full font-mono text-xs" value={form.stripe_secret_key} dir="ltr"
                onChange={(e) => setForm({ ...form, stripe_secret_key: e.target.value })}
                placeholder="sk_live_..." />
              <p className="text-xs text-slate-500 mt-1">أضفه كـ Secret في متغيرات البيئة للحماية</p>
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">Webhook Secret (whsec_...)</label>
              <input type="password" className="input w-full font-mono text-xs" value={form.stripe_webhook_secret} dir="ltr"
                onChange={(e) => setForm({ ...form, stripe_webhook_secret: e.target.value })}
                placeholder="whsec_..." />
            </div>
          </>
        )}
      </div>

      {/* Manual Transfer */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">التحويل اليدوي</h2>
            <p className="text-slate-400 text-sm">يرسل المستخدم الحوالة ويرفع الإيصال، والأدمن يؤكد</p>
          </div>
          <button type="button" onClick={() => toggle("manual_enabled")}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.manual_enabled === "true" ? "bg-green-500" : "bg-slate-600"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.manual_enabled === "true" ? "right-1" : "left-1"}`} />
          </button>
        </div>
        {form.manual_enabled === "true" && (
          <>
            <div>
              <label className="block text-sm text-slate-300 mb-2">تفاصيل التحويل (تظهر للمستخدم)</label>
              <textarea
                className="input w-full"
                rows={4}
                value={form.manual_details}
                placeholder={"مثال:\nبنك الراجحي\nاسم الحساب: ...\nرقم الآيبان: SA...\nملاحظة: اكتب اسمك في خانة الملاحظات"}
                onChange={(e) => setForm({ ...form, manual_details: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">الحد الأدنى للإيداع اليدوي ($)</label>
              <input type="number" className="input w-full" value={form.manual_min} dir="ltr"
                onChange={(e) => setForm({ ...form, manual_min: e.target.value })} min="0" step="0.01" />
            </div>
          </>
        )}
      </div>

      {/* PayPal */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">PayPal</h2>
            <p className="text-slate-400 text-sm">دفع بالبطاقة أو حساب PayPal</p>
          </div>
          <button type="button" onClick={() => toggle("paypal_enabled")}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.paypal_enabled === "true" ? "bg-green-500" : "bg-slate-600"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.paypal_enabled === "true" ? "right-1" : "left-1"}`} />
          </button>
        </div>
        {form.paypal_enabled === "true" && (
          <>
            <div>
              <label className="block text-sm text-slate-300 mb-2">PayPal Client ID</label>
              <input className="input w-full font-mono text-sm" value={form.paypal_client_id} dir="ltr"
                onChange={(e) => setForm({ ...form, paypal_client_id: e.target.value })}
                placeholder="AXxx..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">PayPal Secret</label>
              <input type="password" className="input w-full font-mono text-sm" value={form.paypal_secret} dir="ltr"
                onChange={(e) => setForm({ ...form, paypal_secret: e.target.value })}
                placeholder="ELxx..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">البيئة</label>
              <select className="input w-full" value={form.paypal_mode}
                onChange={(e) => setForm({ ...form, paypal_mode: e.target.value })}>
                <option value="sandbox">Sandbox (اختبار)</option>
                <option value="live">Live (إنتاج)</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Crypto */}
      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">العملات الرقمية</h2>
            <p className="text-slate-400 text-sm">استقبال BTC و ETH و USDT</p>
          </div>
          <button type="button" onClick={() => toggle("crypto_enabled")}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.crypto_enabled === "true" ? "bg-green-500" : "bg-slate-600"}`}>
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.crypto_enabled === "true" ? "right-1" : "left-1"}`} />
          </button>
        </div>
        {form.crypto_enabled === "true" && (
          <>
            <div>
              <label className="block text-sm text-slate-300 mb-2">عنوان Bitcoin (BTC)</label>
              <input className="input w-full font-mono text-sm" value={form.crypto_address_btc} dir="ltr"
                onChange={(e) => setForm({ ...form, crypto_address_btc: e.target.value })}
                placeholder="bc1q..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">عنوان Ethereum (ETH)</label>
              <input className="input w-full font-mono text-sm" value={form.crypto_address_eth} dir="ltr"
                onChange={(e) => setForm({ ...form, crypto_address_eth: e.target.value })}
                placeholder="0x..." />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-2">عنوان USDT (TRC20)</label>
              <input className="input w-full font-mono text-sm" value={form.crypto_address_usdt} dir="ltr"
                onChange={(e) => setForm({ ...form, crypto_address_usdt: e.target.value })}
                placeholder="T..." />
            </div>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-xs text-yellow-400">
              شبكة USDT الحالية: TRC20. أضف عنوان المحفظة وسيتم عرضها للمستخدمين للإيداع التلقائي.
            </div>
          </>
        )}
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "جاري الحفظ..." : "حفظ إعدادات الدفع"}
      </button>
    </form>
  );
}
