"use client";

import { Suspense, FormEvent, useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [step, setStep] = useState<"credentials" | "twoFactor">("credentials");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const callbackUrl = searchParams?.get("callbackUrl") ?? "";

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const dest = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : session.user.role === "ADMIN" ? "/admin" : "/dashboard";
      router.replace(dest);
    }
  }, [status, session, callbackUrl, router]);

  useEffect(() => {
    if (searchParams?.get("registered") === "1") {
      setSuccess("تم إنشاء حسابك بنجاح! يمكنك تسجيل الدخول الآن.");
    }
    const err = searchParams?.get("error");
    if (err === "TWO_FACTOR_REQUIRED") {
      setStep("twoFactor");
      setError("");
    } else if (err === "TWO_FACTOR_INVALID") {
      setStep("twoFactor");
      setError("رمز التحقق غير صحيح أو منتهي الصلاحية");
    } else if (err === "RATE_LIMIT") {
      setError("محاولات كثيرة، حاول مجدداً بعد 15 دقيقة");
    }
  }, [searchParams]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      twoFactorCode: step === "twoFactor" ? twoFactorCode : "",
      redirect: false,
      callbackUrl: "/dashboard",
    });

    setLoading(false);

    if (!result) {
      setError("حدث خطأ أثناء تسجيل الدخول");
      return;
    }

    if (!result.ok) {
      const err = result.error ?? "";
      if (err === "TWO_FACTOR_REQUIRED") {
        setStep("twoFactor");
        setError("");
        return;
      }
      if (err === "TWO_FACTOR_INVALID") {
        setStep("twoFactor");
        setError("رمز التحقق غير صحيح أو منتهي الصلاحية");
        return;
      }
      if (err === "RATE_LIMIT") {
        setError("محاولات كثيرة جداً، حاول مجدداً بعد 15 دقيقة");
        return;
      }
      setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      return;
    }

    const safeRedirect = callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
      ? callbackUrl
      : "/dashboard";
    router.replace(safeRedirect);
  }

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <Link href="/" className="inline-flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            S
          </div>
          <span className="text-xl font-black text-gray-900">
            SMM <span className="gradient-text">Pro</span>
          </span>
        </Link>
        {step === "credentials" ? (
          <>
            <h1 className="text-2xl font-black text-gray-900 mt-4">مرحباً بعودتك</h1>
            <p className="text-gray-500 text-sm mt-1">سجّل الدخول للوصول إلى لوحة التحكم</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-black text-gray-900 mt-4">التحقق بخطوتين</h1>
            <p className="text-gray-500 text-sm mt-1">أدخل رمز التحقق من تطبيق المصادقة</p>
          </>
        )}
      </div>

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
          <span>{success}</span>
        </div>
      )}

      <div className="card shadow-lg">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4 flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {step === "credentials" ? (
            <>
              <div>
                <label className="input-label">البريد الإلكتروني</label>
                <input
                  type="email"
                  placeholder="example@email.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  autoComplete="email"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="input-label mb-0">كلمة المرور</label>
                  <Link href="/forgot-password" className="text-xs text-violet-600 hover:underline font-medium">
                    نسيت كلمة المرور؟
                  </Link>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input-field"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  dir="ltr"
                  autoComplete="current-password"
                />
              </div>
            </>
          ) : (
            <div>
              <label className="input-label">رمز التحقق (6 أرقام)</label>
              <input
                type="text"
                placeholder="000000"
                className="input-field text-center text-3xl font-mono tracking-widest"
                value={twoFactorCode}
                onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                required
                maxLength={6}
                dir="ltr"
                autoComplete="one-time-code"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                افتح تطبيق المصادقة (Google Authenticator) وأدخل الرمز المعروض
              </p>
              <button
                type="button"
                onClick={() => { setStep("credentials"); setError(""); setTwoFactorCode(""); }}
                className="text-sm text-violet-600 hover:underline mt-2 block w-full text-center"
              >
                ← العودة لإدخال كلمة المرور
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (step === "twoFactor" && twoFactorCode.length !== 6)}
            className="btn-primary-lg w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                جاري التحقق...
              </>
            ) : step === "credentials" ? "تسجيل الدخول" : "تأكيد الرمز"}
          </button>
        </form>

        {step === "credentials" && (
          <div className="mt-5 pt-5 border-t border-violet-100 text-center">
            <p className="text-sm text-gray-500">
              ليس لديك حساب؟{" "}
              <Link href="/register" className="text-violet-600 font-bold hover:underline">
                إنشاء حساب مجاني
              </Link>
            </p>
          </div>
        )}
      </div>

      <p className="text-center mt-4">
        <Link href="/" className="text-gray-400 hover:text-violet-600 text-sm transition-colors">
          ← العودة للصفحة الرئيسية
        </Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
