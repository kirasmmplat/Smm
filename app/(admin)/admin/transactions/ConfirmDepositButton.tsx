"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  transactionId: string;
  userId: string;
  amount: number;
}

export default function ConfirmDepositButton({ transactionId, userId, amount }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (!confirm(`هل تريد تأكيد إيداع $${amount.toFixed(2)} وإضافته لرصيد المستخدم؟`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/transactions/confirm-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, userId, amount }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleReject() {
    if (!confirm("هل تريد رفض طلب الإيداع؟")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/transactions/confirm-deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, userId, amount, reject: true }),
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-1">
      <button onClick={handleConfirm} disabled={loading}
        className="text-xs bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-1 rounded transition-colors">
        {loading ? "..." : "قبول"}
      </button>
      <button onClick={handleReject} disabled={loading}
        className="text-xs bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-1 rounded transition-colors">
        رفض
      </button>
    </div>
  );
}
