"use client";

import { useEffect } from "react";
import { CheckCircle2, XCircle, AlertCircle, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function StripeResult({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/dashboard/add-funds");
    }, 7000);
    return () => clearTimeout(t);
  }, [router]);

  if (status === "success") {
    return (
      <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle2 size={24} className="text-emerald-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-emerald-800 font-black text-base">تم شحن رصيدك بنجاح!</h3>
          <p className="text-emerald-700 text-sm mt-1">
            تمت معالجة دفعتك وتم إضافة المبلغ لرصيدك تلقائياً. يمكنك الآن تقديم طلباتك.
          </p>
        </div>
        <button onClick={() => router.replace("/dashboard/add-funds")} className="text-emerald-400 hover:text-emerald-700">
          <X size={16} />
        </button>
      </div>
    );
  }

  if (status === "cancel") {
    return (
      <div className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
          <XCircle size={24} className="text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-amber-800 font-black text-base">تم إلغاء عملية الدفع</h3>
          <p className="text-amber-700 text-sm mt-1">
            لم تُكتمل عملية الدفع ولم يُخصم أي مبلغ. يمكنك المحاولة مجدداً.
          </p>
        </div>
        <button onClick={() => router.replace("/dashboard/add-funds")} className="text-amber-400 hover:text-amber-700">
          <X size={16} />
        </button>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="mb-6 bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
          <AlertCircle size={24} className="text-red-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-red-800 font-black text-base">حدث خطأ في الدفع</h3>
          <p className="text-red-700 text-sm mt-1">
            فشلت عملية الدفع. يرجى المحاولة مجدداً أو التواصل مع الدعم إذا استمر الخطأ.
          </p>
        </div>
        <button onClick={() => router.replace("/dashboard/add-funds")} className="text-red-400 hover:text-red-700">
          <X size={16} />
        </button>
      </div>
    );
  }

  return null;
}
