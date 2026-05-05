"use client";

import { useState } from "react";
import Link from "next/link";

export default function ManualDepositForm({
  minDeposit,
  paymentMethodId,
  paymentMethodName,
  helperText,
}: {
  minDeposit: string;
  paymentMethodId: string;
  paymentMethodName: string;
  helperText?: string;
}) {
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [supportRequired, setSupportRequired] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt < parseFloat(minDeposit)) {
      setError(`الحد الأدنى للإيداع هو $${minDeposit}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/transactions/deposit-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, notes, paymentMethodId, paymentMethodName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? data.message ?? "فشل إرسال الطلب");
      setSuccess(true);
      setSupportRequired(Boolean(data.supportRequired));
      setAmount("");
      setNotes("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
        <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-emerald-100 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div className="text-emerald-700 font-bold">
          {supportRequired ? "تم توجيهك إلى الدعم!" : "تم إرسال طلب الإيداع!"}
        </div>
        <div className="text-gray-500 text-sm mt-1">
          {supportRequired ? "أنشئ تذكرة أو تواصل عبر الدعم لإكمال العملية." : "سيتم مراجعته وإضافة الرصيد خلال 24 ساعة."}
        </div>
        <div className="flex gap-2 justify-center mt-3">
          {supportRequired && (
            <Link href="/dashboard/tickets/new" className="btn-primary text-sm px-4 py-1.5">
              فتح تذكرة
            </Link>
          )}
          <button onClick={() => setSuccess(false)} className="btn-secondary text-sm px-4 py-1.5">
            طلب آخر
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="input-label">المبلغ ($)</label>
          <input
            type="number"
            className="input-field"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`الأدنى: $${minDeposit}`}
            min={minDeposit}
            step="0.01"
            dir="ltr"
            required
          />
        </div>
        <div>
          <label className="input-label">رقم الحوالة / المرجع</label>
          <input
            className="input-field"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="رقم التحويل..."
          />
        </div>
      </div>
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "جاري الإرسال..." : `متابعة ${paymentMethodName}`}
      </button>
      <p className="text-xs text-gray-400 text-center">
        {helperText ?? "للطُرق غير التلقائية سيقوم الدعم بإرشادك لإكمال الإيداع."}
      </p>
    </form>
  );
}
