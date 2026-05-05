"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams?.get("ref") ?? "";

  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    referralCode: refCode,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          password: form.password,
          referralCode: form.referralCode,
        }),
      });

      const data = (await res.json()) as { message: string };

      if (!res.ok) {
        setError(data.message ?? "حدث خطأ أثناء إنشاء الحساب");
        setLoading(false);
        return;
      }

      router.push("/login?registered=1");
    } catch {
      setError("حدث خطأ في الاتصال بالخادم");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md py-8">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            S
          </div>
          <span className="text-xl font-black text-gray-900">
            SMM <span className="gradient-text">Pro</span>
          </span>
        </Link>
        <h1 className="text-2xl font-black text-gray-900 mt-4">أنشئ حسابك مجاناً</h1>
        <p className="text-gray-500 text-sm mt-1">انضم إلى آلاف المستخدمين الراضين</p>
      </div>

      <div className="card shadow-lg">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="input-label">الاسم الكامل</label>
              <input
                type="text"
                placeholder="محمد أحمد"
                className="input-field"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                required
                minLength={2}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="input-label">اسم المستخدم</label>
              <input
                type="text"
                placeholder="username123"
                className="input-field"
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                required
                minLength={3}
                maxLength={20}
                pattern="[a-zA-Z0-9_]+"
                dir="ltr"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="input-label">البريد الإلكتروني</label>
              <input
                type="email"
                placeholder="example@email.com"
                className="input-field"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                required
                dir="ltr"
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="input-label">كلمة المرور</label>
            <input
              type="password"
              placeholder="8 أحرف على الأقل"
              className="input-field"
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              required
              minLength={8}
              dir="ltr"
            />
          </div>

          <div>
            <label className="input-label">تأكيد كلمة المرور</label>
            <input
              type="password"
              placeholder="••••••••"
              className="input-field"
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              required
              minLength={8}
              dir="ltr"
            />
          </div>

          <div>
            <label className="input-label">
              كود الإحالة{" "}
              <span className="text-gray-400 font-normal">(اختياري)</span>
            </label>
            <input
              type="text"
              placeholder="REFERRAL123"
              className="input-field"
              value={form.referralCode}
              onChange={(e) => update("referralCode", e.target.value)}
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-lg w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري إنشاء الحساب...
              </>
            ) : (
              "إنشاء الحساب مجاناً"
            )}
          </button>
        </form>

        <div className="mt-5 pt-5 border-t border-violet-100 text-center">
          <p className="text-sm text-gray-500">
            لديك حساب بالفعل؟{" "}
            <Link href="/login" className="text-violet-600 font-bold hover:underline">
              تسجيل الدخول
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center mt-4 text-xs text-gray-400">
        بإنشاء الحساب أنت توافق على{" "}
        <a href="#" className="text-violet-600 hover:underline">شروط الاستخدام</a>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
