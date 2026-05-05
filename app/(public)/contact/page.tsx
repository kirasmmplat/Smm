"use client";

import { useState } from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        setSent(true);
      } else {
        setError(data.error ?? "حدث خطأ، حاول مجدداً");
      }
    } catch {
      setError("حدث خطأ في الاتصال، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white" dir="rtl">
      <PublicNav />

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white mb-4 shadow-lg">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-3">تواصل معنا</h1>
          <p className="text-gray-500 max-w-md mx-auto">فريق الدعم متاح على مدار الساعة للإجابة على استفساراتك</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            {[
              { title: "الدعم الفوري", desc: "عبر نظام التذاكر داخل لوحة التحكم", link: "/dashboard/tickets/new", label: "فتح تذكرة" },
              { title: "تيليجرام", desc: "تواصل معنا عبر بوت التيليجرام للدعم السريع", link: "#", label: "انضم لقناتنا" },
              { title: "البريد الإلكتروني", desc: "support@smmpro.com", link: "mailto:support@smmpro.com", label: "أرسل بريداً" },
            ].map((item) => (
              <div key={item.title} className="card p-5">
                <h3 className="font-black text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.desc}</p>
                <a href={item.link} className="text-violet-600 text-sm font-bold hover:text-violet-700 transition-colors">{item.label} ←</a>
              </div>
            ))}
          </div>

          <div className="md:col-span-2">
            {sent ? (
              <div className="card p-8 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">تم إرسال رسالتك!</h3>
                <p className="text-gray-500 mb-6">سيتواصل معك فريقنا خلال 24 ساعة على أقصى تقدير.</p>
                <button onClick={() => { setSent(false); setForm({ name: "", email: "", subject: "", message: "" }); }} className="btn-primary px-6">إرسال رسالة أخرى</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="card p-6 space-y-4">
                <h2 className="text-lg font-black text-gray-900 mb-4">أرسل لنا رسالة</h2>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="input-label">الاسم الكامل</label>
                    <input className="input-field" placeholder="محمد أحمد" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="input-label">البريد الإلكتروني</label>
                    <input type="email" className="input-field" placeholder="example@email.com" value={form.email} dir="ltr" onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                </div>
                <div>
                  <label className="input-label">الموضوع</label>
                  <select className="input-field" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required>
                    <option value="">اختر الموضوع</option>
                    <option value="support">دعم تقني</option>
                    <option value="billing">مشكلة في الدفع</option>
                    <option value="order">مشكلة في طلب</option>
                    <option value="general">استفسار عام</option>
                    <option value="partnership">شراكة تجارية</option>
                  </select>
                </div>
                <div>
                  <label className="input-label">الرسالة</label>
                  <textarea className="input-field min-h-[140px] resize-none" placeholder="اكتب رسالتك هنا..." value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
                  {loading ? "جاري الإرسال..." : "إرسال الرسالة"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
