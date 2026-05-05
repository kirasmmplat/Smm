"use client";

import { useState } from "react";

export default function PayPalButton({
  minDeposit,
  bonusPercent = 0,
}: {
  minDeposit: number;
  bonusPercent?: number;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePay() {
    const amt = parseFloat(amount);
    if (!amt || amt < minDeposit) {
      setError(`الحد الأدنى $${minDeposit}`);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/payments/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      });
      const data = await res.json() as { approveUrl?: string; error?: string };
      if (!res.ok || !data.approveUrl) {
        setError(data.error ?? "فشل إنشاء طلب PayPal");
        setLoading(false);
        return;
      }
      window.location.href = data.approveUrl;
    } catch {
      setError("حدث خطأ، حاول مجدداً");
      setLoading(false);
    }
  }

  const amt = parseFloat(amount) || 0;
  const bonus = bonusPercent > 0 ? amt * (bonusPercent / 100) : 0;

  return (
    <div className="space-y-3">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>
      )}
      <div>
        <label className="input-label">المبلغ ($)</label>
        <input
          type="number"
          className="input-field"
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setError(""); }}
          placeholder={`الأدنى: $${minDeposit}`}
          min={minDeposit}
          step="0.01"
          dir="ltr"
        />
      </div>
      {bonus > 0 && amt > 0 && (
        <div className="text-sm text-emerald-600 font-semibold">
          ستحصل على: ${(amt + bonus).toFixed(2)} (يشمل مكافأة ${bonus.toFixed(2)})
        </div>
      )}
      <button
        onClick={handlePay}
        disabled={loading || !amount}
        className="w-full py-3 px-6 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all disabled:opacity-60"
        style={{ background: loading ? "#94a3b8" : "#003087" }}
      >
        {loading ? (
          <>
            <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            جاري التحويل...
          </>
        ) : (
          <>
            <span className="font-black text-[#009cde]">Pay</span>
            <span className="font-black text-[#012169]">Pal</span>
            — {amt > 0 ? `$${amt.toFixed(2)}` : "ادفع الآن"}
          </>
        )}
      </button>
      <p className="text-xs text-gray-400 text-center">
        ستُحوَّل إلى صفحة PayPal الآمنة — الرصيد يُضاف فور التأكيد
      </p>
    </div>
  );
}
