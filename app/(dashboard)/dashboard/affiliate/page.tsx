"use client";

import { useEffect, useState } from "react";

interface AffiliateStats {
  referralCode: string;
  referralLink: string;
  commissionRate: number;
  totalReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  isActive: boolean;
}

interface Referral {
  id: string;
  depositAmount: number;
  commissionEarned: number;
  status: string;
  createdAt: string;
  referredUser?: { name: string; email: string; createdAt: string };
}

export default function AffiliatePage() {
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutMsg, setPayoutMsg] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/affiliate/stats").then((r) => r.json()),
      fetch("/api/affiliate/referrals").then((r) => r.json()),
    ]).then(([s, r]) => {
      setStats(s);
      setReferrals(r.referrals ?? []);
      setLoading(false);
    });
  }, []);

  const copyLink = () => {
    if (stats?.referralLink) {
      navigator.clipboard.writeText(stats.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const requestPayout = async () => {
    if (!payoutMethod.trim()) { setPayoutMsg("أدخل طريقة الاستلام"); return; }
    setPayoutLoading(true);
    const res = await fetch("/api/affiliate/payout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: payoutMethod }),
    });
    const data = await res.json();
    setPayoutMsg(data.message);
    setPayoutLoading(false);
    if (res.ok) {
      setStats((prev) => prev ? { ...prev, pendingEarnings: 0, totalEarnings: prev.totalEarnings + (prev.pendingEarnings ?? 0) } : prev);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="card animate-pulse h-32" />)}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">نظام الإحالة</h1>
        <p className="text-gray-500 mt-1">اكسب عمولة {stats?.commissionRate}% من كل إيداع لمن تدعوه</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "إجمالي المُحالين", value: stats?.totalReferrals ?? 0 },
          { label: "إجمالي الأرباح", value: `$${(stats?.totalEarnings ?? 0).toFixed(2)}` },
          { label: "أرباح معلقة", value: `$${(stats?.pendingEarnings ?? 0).toFixed(2)}` },
        ].map((s) => (
          <div key={s.label} className="card text-center py-4">
            <div className="text-xl font-black text-gray-900" dir="ltr">{s.value}</div>
            <div className="text-gray-400 text-xs mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="card mb-4">
        <h2 className="font-bold text-gray-900 mb-3">رابط الإحالة الخاص بك</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={stats?.referralLink ?? ""}
            readOnly
            className="input-field flex-1 text-sm font-mono"
            dir="ltr"
          />
          <button onClick={copyLink} className={`btn-primary px-4 ${copied ? "bg-emerald-600" : ""}`}>
            {copied ? "تم" : "نسخ"}
          </button>
        </div>
        <p className="text-gray-400 text-xs mt-2">كود الإحالة: <span className="font-mono font-bold text-violet-600">{stats?.referralCode}</span></p>
      </div>

      {/* Payout */}
      {(stats?.pendingEarnings ?? 0) >= 5 && (
        <div className="card mb-4">
          <h2 className="font-bold text-gray-900 mb-3">سحب الأرباح — ${(stats?.pendingEarnings ?? 0).toFixed(2)}</h2>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="طريقة الاستلام (مثل: USDT TRC20)"
              value={payoutMethod}
              onChange={(e) => setPayoutMethod(e.target.value)}
              className="input-field flex-1"
            />
            <button onClick={requestPayout} disabled={payoutLoading} className="btn-primary px-4">
              {payoutLoading ? "..." : "سحب إلى الرصيد"}
            </button>
          </div>
          {payoutMsg && <p className="text-sm mt-2 text-violet-600">{payoutMsg}</p>}
        </div>
      )}

      {/* Referrals List */}
      <div className="card">
        <h2 className="font-bold text-gray-900 mb-4">المُحالون ({referrals.length})</h2>
        {referrals.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="w-10 h-10 mx-auto mb-2 rounded-xl bg-violet-50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <p className="text-sm">لم تُحِل أحداً بعد. شارك رابطك لتبدأ الكسب!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex justify-between items-center py-3 border-b border-violet-50 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.referredUser?.name ?? "مستخدم"}</p>
                  <p className="text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("ar-SA")}</p>
                </div>
                <div className="text-left" dir="ltr">
                  <p className="text-sm font-bold text-emerald-600">+${Number(r.commissionEarned).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">إيداع: ${Number(r.depositAmount).toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
