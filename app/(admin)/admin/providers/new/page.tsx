"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type TestResult = {
  balance: unknown;
  currency: unknown;
  serviceCount: number | null;
  balanceError: string | null;
  servicesError: string | null;
  synced?: boolean;
};

export default function NewProviderPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", url: "", apiKey: "" });
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState("");
  const [saveLoading, setSaveLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncStatus, setSyncStatus] = useState("");

  function update(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function testConnection() {
    setTestError("");
    setTestResult(null);
    setSyncStatus("");
    setTestLoading(true);
    try {
      const res = await fetch("/api/providers/test-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.url, apiKey: form.apiKey }),
      });
      const data = await res.json() as TestResult;
      if (!res.ok) {
        setTestError("فشل الاختبار");
      } else {
        setTestResult(data);
      }
    } catch {
      setTestError("خطأ في الاتصال");
    } finally {
      setTestLoading(false);
    }
  }

  async function onSave() {
    setError("");
    if (!form.name || !form.url || !form.apiKey) {
      setError("جميع الحقول مطلوبة");
      return;
    }
    setSaveLoading(true);
    setSyncStatus("");
    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { message?: string; id?: string };
      if (!res.ok) {
        setError(data.message ?? "حدث خطأ");
        setSaveLoading(false);
        return;
      }
      const providerId = data.id;
      if (providerId) {
        setSyncStatus("جاري مزامنة الخدمات تلقائياً...");
        fetch(`/api/providers/${providerId}/sync`, { method: "POST" })
          .then((r) => r.json())
          .then((d: { count?: number }) => {
            if (d.count) setSyncStatus(`تمت مزامنة ${d.count} خدمة`);
          })
          .catch(() => null);
      }
      setTimeout(() => router.push("/admin/providers"), 800);
    } catch {
      setError("خطأ في الاتصال");
      setSaveLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/providers" className="text-slate-400 hover:text-white">←</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">إضافة مزود جديد</h1>
          <p className="text-slate-400 text-sm mt-1">ربط مزود API لاستيراد خدماته</p>
        </div>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">اسم المزود</label>
          <input className="input-field" placeholder="مثال: SmmPanel Pro" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">رابط API (الـ endpoint الكامل)</label>
          <input className="input-field" placeholder="https://provider.com/api  أو  https://provider.com/api/v2" value={form.url} onChange={(e) => update("url", e.target.value)} dir="ltr" />
          <p className="text-slate-500 text-xs mt-1">أدخل الرابط الكامل لنقطة الـ API كما هو (لا تحذف /api أو /v2 من النهاية)</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">مفتاح API</label>
          <input className="input-field" placeholder="your-api-key" value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} dir="ltr" />
        </div>

        <div>
          <button
            onClick={testConnection}
            disabled={testLoading || !form.url || !form.apiKey}
            className="btn-secondary w-full mb-3"
          >
            {testLoading ? "جاري الاختبار والمزامنة..." : "اختبار الاتصال"}
          </button>

          {testError && (
            <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
              {testError}
            </div>
          )}

          {testResult && (
            <div className="bg-green-900/20 border border-green-500/30 rounded-lg px-4 py-3 space-y-2">
              <div className="text-green-400 font-medium">الاتصال ناجح</div>
              <div className="text-sm text-slate-300 space-y-1">
                {testResult.balance !== null && (
                  <div>الرصيد: <span className="text-green-400">{String(testResult.balance)} {String(testResult.currency ?? "")}</span></div>
                )}
                {testResult.serviceCount !== null && (
                  <div>
                    عدد الخدمات: <span className="text-indigo-400">{testResult.serviceCount} خدمة</span>
                  </div>
                )}
              </div>
              <div className="text-xs text-slate-400 bg-indigo-500/10 rounded px-3 py-2">
                عند الحفظ سيتم مزامنة جميع الخدمات تلقائياً لعرضها فوراً لاحقاً
              </div>
            </div>
          )}
        </div>

        {syncStatus && (
          <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-lg px-4 py-3 text-indigo-300 text-sm">
            {syncStatus}
          </div>
        )}

        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>
        )}

        <button onClick={onSave} disabled={saveLoading} className="btn-primary w-full py-3">
          {saveLoading ? "جاري الحفظ والمزامنة..." : "حفظ المزود ومزامنة الخدمات"}
        </button>
      </div>
    </div>
  );
}
