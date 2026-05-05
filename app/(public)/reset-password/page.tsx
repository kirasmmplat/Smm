"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordContent() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params?.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) { setError("كلمة المرور يجب أن تكون 8 أحرف على الأقل"); return; }
    if (password !== confirm) { setError("كلمتا المرور غير متطابقتين"); return; }
    setLoading(true); setError("");
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } else {
      setError(data.message ?? "حدث خطأ");
    }
    setLoading(false);
  };

  if (!token) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-500 mb-4">رابط غير صالح</h1>
        <p className="text-gray-400 mb-6">يرجى طلب رابط إعادة تعيين جديد</p>
        <Link href="/forgot-password" className="text-blue-500 hover:underline">
          طلب رابط جديد
        </Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl p-8 border border-gray-800">
        <h1 className="text-2xl font-bold text-center mb-6">إعادة تعيين كلمة المرور</h1>
        {success ? (
          <div className="text-center">
            <div className="text-green-400 text-lg mb-2">✅ تم تغيير كلمة المرور بنجاح</div>
            <p className="text-gray-400">سيتم تحويلك لتسجيل الدخول...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">{error}</div>}
            <div>
              <label className="block text-sm text-gray-400 mb-1">كلمة المرور الجديدة</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" required minLength={8} />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">تأكيد كلمة المرور</label>
              <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white" required minLength={8} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-semibold transition">
              {loading ? "جاري التحديث..." : "تحديث كلمة المرور"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-400">جاري التحميل...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
