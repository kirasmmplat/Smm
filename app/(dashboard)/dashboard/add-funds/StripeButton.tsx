"use client";

import { useState } from "react";
import { CreditCard, Loader2, ExternalLink, AlertCircle } from "lucide-react";

interface StripeButtonProps {
  minDeposit: number;
  bonusPercent: number;
  paymentMethodId: string;
}

const QUICK_AMOUNTS = [5, 10, 25, 50, 100, 200];

export default function StripeButton({ minDeposit, bonusPercent, paymentMethodId }: StripeButtonProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const numAmount = parseFloat(amount) || 0;
  const bonus = bonusPercent > 0 ? (numAmount * bonusPercent) / 100 : 0;
  const total = numAmount + bonus;

  async function handlePay() {
    const amt = parseFloat(amount);
    if (!amt || amt < minDeposit) {
      setError(`الحد الأدنى للإيداع هو $${minDeposit}`);
      return;
    }
    if (amt > 10000) {
      setError("الحد الأقصى للإيداع هو $10,000");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/payments/stripe/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt, bonusPercent, paymentMethodId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "فشل إنشاء جلسة الدفع");
      }
      window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "حدث خطأ، حاول مجدداً");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex flex-wrap gap-2 mb-3">
          {QUICK_AMOUNTS.filter((a) => a >= minDeposit).map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => { setAmount(String(a)); setError(""); }}
              className={`px-4 py-1.5 rounded-xl text-sm font-bold border transition-all ${
                amount === String(a)
                  ? "bg-violet-600 border-violet-600 text-white shadow-sm"
                  : "bg-white border-gray-200 text-gray-700 hover:border-violet-400 hover:text-violet-700"
              }`}
            >
              ${a}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-sm">$</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => { setAmount(e.target.value); setError(""); }}
            placeholder={`أدخل المبلغ (الحد الأدنى $${minDeposit})`}
            min={minDeposit}
            step="0.01"
            className="w-full bg-white border border-gray-200 rounded-xl pr-10 pl-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all text-sm"
            dir="ltr"
          />
        </div>
      </div>

      {bonusPercent > 0 && numAmount >= minDeposit && (
        <div className="bg-violet-50 border border-violet-200 rounded-xl p-3 text-sm">
          <div className="flex justify-between text-gray-700">
            <span>المبلغ المدفوع</span>
            <span dir="ltr" className="font-bold">${numAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-violet-700 mt-1">
            <span>مكافأة {bonusPercent}%</span>
            <span dir="ltr" className="font-bold">+${bonus.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-emerald-700 font-black mt-1 pt-1 border-t border-violet-200">
            <span>إجمالي الرصيد</span>
            <span dir="ltr">${total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
          <AlertCircle size={14} className="shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading || !amount || parseFloat(amount) < minDeposit}
        className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-black py-3.5 rounded-xl transition-all shadow-md shadow-violet-200 hover:shadow-violet-300"
      >
        {loading ? (
          <><Loader2 size={18} className="animate-spin" /> جارٍ التحويل للدفع...</>
        ) : (
          <><CreditCard size={18} /> الدفع بالبطاقة عبر Stripe <ExternalLink size={14} /></>
        )}
      </button>

      <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
        <span className="text-emerald-600">🔒</span>
        معالجة آمنة بواسطة Stripe — بياناتك محمية بتشفير SSL/TLS
      </p>
    </div>
  );
}
