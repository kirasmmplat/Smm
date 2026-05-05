"use client";

import { useEffect, useState } from "react";

const defaultSettings = [
  { key: "primary_color", label: "اللون الأساسي", group: "appearance", placeholder: "#7C3AED", type: "color" },
  { key: "site_logo", label: "رابط الشعار", group: "appearance", placeholder: "/logo.png", type: "text" },
  { key: "site_favicon", label: "رابط Favicon", group: "appearance", placeholder: "/favicon.ico", type: "text" },
  { key: "hero_title", label: "عنوان الصفحة الرئيسية", group: "appearance", placeholder: "منصة SMM الأفضل", type: "text" },
  { key: "hero_subtitle", label: "الوصف التسويقي", group: "appearance", placeholder: "نمّي حضورك على السوشيال ميديا", type: "text" },
  { key: "hero_bg_color", label: "لون خلفية الهيرو", group: "appearance", placeholder: "#7C3AED", type: "color" },
  { key: "footer_text", label: "نص الفوتر", group: "appearance", placeholder: "© 2026 SMM Pro. جميع الحقوق محفوظة", type: "text" },
  { key: "maintenance_mode", label: "وضع الصيانة", group: "general", placeholder: "false", type: "select", options: ["false", "true"] },
];

export default function AppearanceSettingsPage() {
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
    const saves = Object.entries(values).map(([key, value]) =>
      fetch("/api/admin/settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, value }) })
    );
    await Promise.all(saves);
    setMsg("تم حفظ الإعدادات بنجاح");
    setSaving(false);
  };

  if (loading) return <div className="space-y-4">{[...Array(6)].map((_, i) => <div key={i} className="h-16 bg-slate-800 rounded-2xl animate-pulse" />)}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">إعدادات المظهر</h1>
        <p className="text-slate-400 mt-1">تخصيص مظهر وألوان المنصة</p>
      </div>

      {msg && <div className="mb-4 p-3 bg-emerald-900/30 border border-emerald-500 rounded-xl text-emerald-300 text-sm">{msg}</div>}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <div className="grid grid-cols-1 gap-5">
          {defaultSettings.map((s) => (
            <div key={s.key}>
              <label className="text-slate-300 text-sm font-semibold mb-1 block">{s.label}</label>
              {s.type === "select" ? (
                <select
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm"
                  value={values[s.key] ?? s.placeholder}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                >
                  {s.options?.map((opt) => <option key={opt} value={opt}>{opt === "true" ? "مفعّل" : "معطّل"}</option>)}
                </select>
              ) : s.type === "color" ? (
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="w-10 h-10 rounded-xl border border-slate-600 cursor-pointer bg-transparent"
                    value={values[s.key] ?? s.placeholder}
                    onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  />
                  <input
                    type="text"
                    className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm font-mono"
                    value={values[s.key] ?? s.placeholder}
                    onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                    dir="ltr"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-2.5 text-white text-sm"
                  value={values[s.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [s.key]: e.target.value })}
                  placeholder={s.placeholder}
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
          </button>
        </div>
      </div>
    </div>
  );
}
