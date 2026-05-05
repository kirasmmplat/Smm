"use client";

import { useEffect, useState } from "react";
import { Search, Globe2, Save, BarChart3 } from "lucide-react";

const seoSettings = [
  { key: "seo_title", label: "عنوان الموقع (Title Tag)", placeholder: "SMM Pro — أفضل منصة خدمات سوشيال ميديا" },
  { key: "seo_description", label: "وصف الموقع (Meta Description)", placeholder: "منصة SMM احترافية تقدم خدمات متابعين ومشاهدات...", textarea: true },
  { key: "seo_keywords", label: "الكلمات المفتاحية", placeholder: "smm panel, متابعين انستقرام, خدمات سوشيال ميديا" },
  { key: "og_image", label: "صورة Open Graph (رابط)", placeholder: "https://yourdomain.com/og-image.png" },
  { key: "og_title", label: "عنوان Open Graph", placeholder: "SMM Pro" },
  { key: "og_description", label: "وصف Open Graph", placeholder: "أفضل منصة SMM في المنطقة العربية", textarea: true },
  { key: "google_analytics_id", label: "Google Analytics ID", placeholder: "G-XXXXXXXXXX" },
  { key: "google_site_verification", label: "Google Search Console Verification", placeholder: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" },
  { key: "twitter_card", label: "نوع Twitter Card", placeholder: "summary_large_image" },
  { key: "canonical_url", label: "الرابط الأساسي (Canonical)", placeholder: "https://yourdomain.com" },
];

export default function SeoSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {};
        (data.settings ?? []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
        setValues(map);
        setLoading(false);
      });
  }, []);

  const save = async () => {
    setSaving(true); setMsg("");
    await Promise.all(
      Object.entries(values).map(([key, value]) =>
        fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) })
      )
    );
    setMsg("تم حفظ إعدادات SEO بنجاح");
    setSaving(false);
  };

  if (loading) return <div className="space-y-4">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">إعدادات SEO</h1>
          <p className="text-slate-400 mt-1">تحسين محركات البحث والظهور على الإنترنت</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "الظهور", value: "أساسي", icon: Search },
            { label: "Open Graph", value: "مفعل", icon: Globe2 },
          ].map((item) => (
            <div key={item.label} className="bg-slate-800 border border-slate-700 rounded-2xl px-3 py-2 flex items-center gap-2">
              <item.icon size={14} className="text-violet-400" />
              <div>
                <div className="text-slate-500 text-[10px]">{item.label}</div>
                <div className="text-white text-xs font-bold">{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {msg && <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-500 rounded-xl text-emerald-300 text-sm">{msg}</div>}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-5">
        {seoSettings.map((s) => (
          <div key={s.key}>
            <label className="text-slate-300 text-sm font-semibold mb-1 block">{s.label}</label>
            {s.textarea ? (
              <textarea
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm h-24 resize-none"
                value={values[s.key] ?? ""}
                onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                placeholder={s.placeholder}
              />
            ) : (
              <input
                type="text"
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm"
                value={values[s.key] ?? ""}
                onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                placeholder={s.placeholder}
                dir="ltr"
              />
            )}
            <p className="text-slate-500 text-xs mt-1">المفتاح: <code className="font-mono">{s.key}</code></p>
          </div>
        ))}

        {/* Preview */}
        <div className="bg-slate-900 rounded-2xl p-4 border border-slate-700">
          <p className="text-slate-400 text-xs font-semibold mb-3 uppercase">معاينة نتيجة البحث</p>
          <div className="bg-white rounded-xl p-4">
            <p className="text-green-700 text-xs mb-1">{values.canonical_url ?? "https://yourdomain.com"}</p>
            <p className="text-blue-600 text-lg font-semibold hover:underline cursor-pointer">
              {values.seo_title || "SMM Pro — أفضل منصة سوشيال ميديا"}
            </p>
            <p className="text-gray-500 text-sm mt-1 line-clamp-2">
              {values.seo_description || "منصة SMM احترافية..."}
            </p>
          </div>
        </div>

        <button onClick={save} disabled={saving} className="btn-primary inline-flex items-center gap-2">
          <Save size={16} />
          {saving ? "جاري الحفظ..." : "حفظ إعدادات SEO"}
        </button>
      </div>
    </div>
  );
}
