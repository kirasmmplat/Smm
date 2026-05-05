"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type Provider = { id: string; name: string; url: string; apiKey: string; status: string; balance: string | null; _count?: { services: number } };

export default function EditProviderPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [form, setForm] = useState({ name: "", url: "", apiKey: "", status: "ACTIVE" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetch(`/api/providers/${id}`)
      .then((r) => r.json() as Promise<Provider>)
      .then((p) => setForm({ name: p.name, url: p.url, apiKey: p.apiKey, status: p.status }))
      .finally(() => setLoading(false));
  }, [id]);

  function update(key: string, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
  }

  async function onSave() {
    setError(""); setSuccess(""); setSaving(true);
    try {
      const res = await fetch(`/api/providers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { message?: string };
      if (!res.ok) { setError(data.message ?? "خطأ"); } else { setSuccess("تم الحفظ بنجاح"); }
    } catch { setError("خطأ في الاتصال"); }
    finally { setSaving(false); }
  }

  async function onDelete() {
    if (!confirm("هل أنت متأكد من حذف هذا المزود؟")) return;
    const res = await fetch(`/api/providers/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/providers");
    else {
      const d = await res.json() as { message: string };
      setError(d.message);
    }
  }

  if (loading) return <div className="p-6 text-slate-400">جاري التحميل...</div>;

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/providers" className="text-slate-400 hover:text-white">←</Link>
        <h1 className="text-2xl font-bold text-white">تعديل المزود</h1>
      </div>

      <div className="card space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">الاسم</label>
          <input className="input-field" value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">رابط API (الـ endpoint الكامل)</label>
          <input className="input-field" value={form.url} onChange={(e) => update("url", e.target.value)} dir="ltr" placeholder="https://provider.com/api  أو  https://provider.com/api/v2" />
          <p className="text-slate-500 text-xs mt-1">الرابط الكامل لنقطة الـ API — مثال: https://panel.com/api أو https://panel.com/api/v2</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">مفتاح API</label>
          <input className="input-field" value={form.apiKey} onChange={(e) => update("apiKey", e.target.value)} dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">الحالة</label>
          <select className="input-field" value={form.status} onChange={(e) => update("status", e.target.value)}>
            <option value="ACTIVE">نشط</option>
            <option value="INACTIVE">معطل</option>
          </select>
        </div>

        {error && <div className="bg-red-900/30 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">{error}</div>}
        {success && <div className="bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-3 text-green-400 text-sm">{success}</div>}

        <div className="flex gap-3">
          <button onClick={onSave} disabled={saving} className="btn-primary flex-1 py-3">
            {saving ? "جاري الحفظ..." : "حفظ"}
          </button>
          <Link href={`/admin/providers/${id}/browse`} className="btn-secondary px-4 py-3">
            تصفح الخدمات
          </Link>
          <button onClick={onDelete} className="btn-danger px-4 py-3">حذف</button>
        </div>
      </div>
    </div>
  );
}
