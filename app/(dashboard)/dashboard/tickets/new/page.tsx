"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewTicketPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    subject: "",
    message: "",
    priority: "NORMAL",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      setError("يرجى ملء جميع الحقول");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "فشل إنشاء التذكرة");
      router.push(`/dashboard/tickets/${data.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/tickets" className="text-gray-500 hover:text-violet-600 transition-colors font-medium">← الدعم الفني</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-black text-gray-900">فتح تذكرة جديدة</h1>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
          )}

          <div>
            <label className="input-label">موضوع التذكرة *</label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="input-field"
              placeholder="اكتب موضوع المشكلة أو الاستفسار..."
              maxLength={200}
              required
            />
          </div>

          <div>
            <label className="input-label">الأولوية</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="input-field"
            >
              <option value="LOW">منخفضة</option>
              <option value="NORMAL">عادية</option>
              <option value="HIGH">عالية</option>
              <option value="URGENT">عاجلة</option>
            </select>
          </div>

          <div>
            <label className="input-label">رسالتك *</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="input-field min-h-[140px] resize-y"
              placeholder="اشرح مشكلتك أو استفسارك بالتفصيل..."
              maxLength={2000}
              required
            />
            <div className="text-xs text-gray-400 text-left mt-1">{form.message.length}/2000</div>
          </div>

            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-gray-600">
            <div className="font-bold text-violet-700 mb-2">نصائح لاستجابة أسرع:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>أرفق رقم الطلب إذا كانت المشكلة تتعلق بطلب معين</li>
              <li>اشرح المشكلة بالتفصيل</li>
              <li>أذكر ما جربته حتى الآن</li>
            </ul>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? "جاري الإرسال..." : "إرسال التذكرة"}
            </button>
            <Link href="/dashboard/tickets" className="btn-secondary">إلغاء</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
