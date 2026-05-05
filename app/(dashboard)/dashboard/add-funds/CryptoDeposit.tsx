"use client";

import { useEffect, useState } from "react";

interface CryptoAddresses {
  BTC: string | null;
  ETH: string | null;
  USDT: string | null;
}

interface CryptoData {
  enabled: boolean;
  minDeposit?: number;
  addresses?: CryptoAddresses;
}

const COIN_INFO: Record<string, { label: string; network: string; color: string; icon: string }> = {
  BTC: { label: "Bitcoin", network: "Bitcoin Network", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "₿" },
  ETH: { label: "Ethereum", network: "ERC-20", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "Ξ" },
  USDT: { label: "Tether USDT", network: "TRC-20", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "₮" },
};

export default function CryptoDeposit() {
  const [data, setData] = useState<CryptoData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<string>("USDT");

  useEffect(() => {
    fetch("/api/payments/crypto/addresses")
      .then((r) => r.json())
      .then((d) => {
        setData(d as CryptoData);
        if (d.addresses) {
          const first = Object.entries(d.addresses as Record<string, string | null>).find(([, v]) => v)?.[0];
          if (first) setSelectedCoin(first);
        }
      })
      .catch(() => setData({ enabled: false }));
  }, []);

  const copy = (text: string, coin: string) => {
    navigator.clipboard.writeText(text);
    setCopied(coin);
    setTimeout(() => setCopied(null), 2500);
  };

  if (!data || !data.enabled || !data.addresses) return null;

  const availableCoins = Object.entries(data.addresses).filter(([, addr]) => addr) as [string, string][];
  if (availableCoins.length === 0) return null;

  const currentAddr = data.addresses[selectedCoin as keyof CryptoAddresses];
  const coinInfo = COIN_INFO[selectedCoin];

  return (
    <div className="space-y-4">
      {data.minDeposit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          ⚠️ الحد الأدنى للإيداع: <strong>${data.minDeposit}</strong> — بعد التحويل، أرسل إيصالاً لفريق الدعم لتأكيد الإيداع
        </div>
      )}

      {/* Coin Selector */}
      <div className="flex gap-2 flex-wrap">
        {availableCoins.map(([coin]) => {
          const info = COIN_INFO[coin];
          return (
            <button
              key={coin}
              onClick={() => setSelectedCoin(coin)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                selectedCoin === coin
                  ? info?.color ?? "bg-violet-100 text-violet-700 border-violet-200"
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{info?.icon ?? coin}</span>
              {coin}
            </button>
          );
        })}
      </div>

      {/* Address Display */}
      {currentAddr && coinInfo && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-900 text-sm">{coinInfo.label}</div>
              <div className="text-gray-400 text-xs mt-0.5">الشبكة: {coinInfo.network}</div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${coinInfo.color}`}>
              {selectedCoin}
            </span>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-3">
            <div className="text-xs text-gray-400 mb-1.5">عنوان المحفظة</div>
            <div className="font-mono text-xs text-gray-800 break-all leading-relaxed" dir="ltr">
              {currentAddr}
            </div>
          </div>

          <button
            onClick={() => copy(currentAddr, selectedCoin)}
            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              copied === selectedCoin
                ? "bg-emerald-500 text-white"
                : "bg-violet-600 hover:bg-violet-700 text-white"
            }`}
          >
            {copied === selectedCoin ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                تم النسخ!
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                نسخ العنوان
              </>
            )}
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-bold">تعليمات مهمة:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>أرسل المبلغ إلى العنوان أعلاه</li>
          <li>احفظ معرف المعاملة (TX Hash)</li>
          <li>افتح تذكرة دعم مع لقطة الشاشة + TX Hash</li>
          <li>سيتم تأكيد الإيداع خلال ساعة عمل</li>
        </ol>
      </div>
    </div>
  );
}
