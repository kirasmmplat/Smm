"use client";

import { useState } from "react";

interface Props {
  settings: Record<string, string>;
}

export default function GeneralSettingsForm({ settings }: Props) {
  const [form, setForm] = useState({
    site_name: settings.site_name ?? "SMM Pro",
    site_logo: settings.site_logo ?? "",
    currency: settings.currency ?? "USD",
    currency_symbol: settings.currency_symbol ?? "$",
    min_deposit: settings.min_deposit ?? "5",
    max_deposit: settings.max_deposit ?? "1000",
    announcement: settings.announcement ?? "",
    maintenance_mode: settings.maintenance_mode ?? "false",
    registration_enabled: settings.registration_enabled ?? "true",
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
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSave} className="max-w-2xl space-y-6">
      {saved && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg p-3 text-sm">
          تم حفظ الإعدادات بنجاح
        </div>
      )}

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">معلومات الموقع</h2>

        <div>
          <label className="block text-sm text-slate-300 mb-2">اسم الموقع</label>
          <input
            className="input w-full"
            value={form.site_name}
            onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-2">رابط الشعار (Logo URL)</label>
          <input
            className="input w-full"
            value={form.site_logo}
            placeholder="https://..."
            onChange={(e) => setForm({ ...form, site_logo: e.target.value })}
            dir="ltr"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">العملة</label>
            <select
              className="input w-full"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
            >
              <option value="USD">USD — الدولار الأمريكي</option>
              <option value="EUR">EUR — اليورو</option>
              <option value="SAR">SAR — الريال السعودي</option>
              <option value="AED">AED — الدرهم الإماراتي</option>
              <option value="EGP">EGP — الجنيه المصري</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">رمز العملة</label>
            <input
              className="input w-full"
              value={form.currency_symbol}
              onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
              dir="ltr"
              maxLength={5}
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">حدود الإيداع</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-slate-300 mb-2">الحد الأدنى للإيداع</label>
            <input
              type="number"
              className="input w-full"
              value={form.min_deposit}
              onChange={(e) => setForm({ ...form, min_deposit: e.target.value })}
              min="0"
              step="0.01"
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-2">الحد الأقصى للإيداع</label>
            <input
              type="number"
              className="input w-full"
              value={form.max_deposit}
              onChange={(e) => setForm({ ...form, max_deposit: e.target.value })}
              min="0"
              step="0.01"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      <div className="card space-y-4">
        <h2 className="font-semibold text-white">الإعلانات والحالة</h2>

        <div>
          <label className="block text-sm text-slate-300 mb-2">إعلان الموقع (شريط في الأعلى)</label>
          <textarea
            className="input w-full"
            value={form.announcement}
            placeholder="اكتب رسالة إعلانية هنا... (اتركها فارغة للإخفاء)"
            rows={3}
            onChange={(e) => setForm({ ...form, announcement: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <div>
            <div className="text-slate-200 text-sm font-medium">وضع الصيانة</div>
            <div className="text-slate-500 text-xs">تعطيل الوصول لجميع المستخدمين ما عدا الأدمن</div>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, maintenance_mode: form.maintenance_mode === "true" ? "false" : "true" })}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.maintenance_mode === "true" ? "bg-red-500" : "bg-slate-600"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.maintenance_mode === "true" ? "right-1" : "left-1"}`} />
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <div>
            <div className="text-slate-200 text-sm font-medium">تفعيل التسجيل</div>
            <div className="text-slate-500 text-xs">السماح للمستخدمين الجدد بإنشاء حسابات</div>
          </div>
          <button
            type="button"
            onClick={() => setForm({ ...form, registration_enabled: form.registration_enabled === "true" ? "false" : "true" })}
            className={`relative w-12 h-6 rounded-full transition-colors ${form.registration_enabled === "true" ? "bg-green-500" : "bg-slate-600"}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.registration_enabled === "true" ? "right-1" : "left-1"}`} />
          </button>
        </div>
      </div>

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
      </button>
    </form>
  );
}
