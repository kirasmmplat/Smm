"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-violet-50 flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-amber-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">حدث خطأ غير متوقع</h1>
        <p className="text-gray-500 mb-8">نعتذر، حدث خطأ في هذه الصفحة. يمكنك المحاولة مجدداً أو العودة للصفحة الرئيسية.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="btn-primary px-6">المحاولة مجدداً</button>
          <Link href="/" className="btn-secondary px-6">الصفحة الرئيسية</Link>
        </div>
        {process.env.NODE_ENV === "development" && (
          <details className="mt-6 text-left bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700">
            <summary className="cursor-pointer font-bold mb-2">تفاصيل الخطأ (dev)</summary>
            <pre className="whitespace-pre-wrap">{error.message}</pre>
          </details>
        )}
      </div>
    </div>
  );
}
