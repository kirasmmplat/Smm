"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("البريد الإلكتروني مطلوب"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      await res.json();
      setSent(true);
    } catch {
      setError("حدث خطأ، حاول مجدداً");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-violet-700 font-black text-3xl">SMM Pro</Link>
          <p className="text-gray-500 mt-2">استعادة كلمة المرور</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8 border border-violet-100">
          {sent ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">تم الإرسال!</h2>
              <p className="text-gray-500 text-sm mb-6">
                إذا كان البريد الإلكتروني مسجلاً، ستصل إليك رسالة إعادة تعيين كلمة المرور خلال دقائق.
              </p>
              <Link href="/login" className="btn-primary w-full text-center block">
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-gray-800 mb-2">نسيت كلمة المرور؟</h1>
              <p className="text-gray-400 text-sm mb-6">أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة التعيين</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="input-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="input-field"
                    dir="ltr"
                    required
                  />
                </div>

                {error && <p className="text-red-500 text-sm">{error}</p>}

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? "جاري الإرسال..." : "إرسال رابط الاستعادة"}
                </button>
              </form>

              <p className="text-center text-gray-400 text-sm mt-6">
                تذكرت كلمة المرور؟{" "}
                <Link href="/login" className="text-violet-600 font-semibold hover:underline">تسجيل الدخول</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
