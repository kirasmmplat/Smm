"use client";

import { useEffect, useState } from "react";
import { useState as useQrState } from "react";

interface AddressMap {
  [key: string]: string | null;
}

interface CryptoData {
  enabled: boolean;
  minDeposit?: number;
  addresses?: AddressMap;
}

const COIN_INFO: Record<string, { label: string; network: string; color: string; icon: string }> = {
  "USDT-TRC20": { label: "Tether USDT", network: "TRC-20 (Tron)", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "₮" },
  "USDT-BEP20": { label: "Tether USDT", network: "BEP-20 (BSC)", color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "₮" },
  "USDT-ERC20": { label: "Tether USDT", network: "ERC-20 (ETH)", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "₮" },
  BTC: { label: "Bitcoin", network: "Bitcoin Network", color: "bg-orange-100 text-orange-700 border-orange-200", icon: "₿" },
  ETH: { label: "Ethereum", network: "ERC-20", color: "bg-blue-100 text-blue-700 border-blue-200", icon: "Ξ" },
  USDT: { label: "Tether USDT", network: "TRC-20", color: "bg-emerald-100 text-emerald-700 border-emerald-200", icon: "₮" },
};

export default function CryptoDeposit() {
  const [data, setData] = useState<CryptoData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<string>("");

  useEffect(() => {
    fetch("/api/payments/crypto/addresses")
      .then((r) => r.json())
      .then((d) => {
        setData(d as CryptoData);
        if (d.addresses) {
          const first = Object.entries(d.addresses as AddressMap).find(([, v]) => v)?.[0];
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

  const currentAddr = data.addresses[selectedCoin];
  const coinInfo = COIN_INFO[selectedCoin] ?? { label: selectedCoin, network: selectedCoin, color: "bg-violet-100 text-violet-700 border-violet-200", icon: "₮" };

  return (
    <div className="space-y-4">
      {data.minDeposit && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
          ⚠️ الحد الأدنى للإيداع: <strong>${data.minDeposit}</strong>
        </div>
      )}

      {/* Coin Selector */}
      <div className="flex gap-2 flex-wrap">
        {availableCoins.map(([coin]) => {
          const info = COIN_INFO[coin] ?? { color: "bg-violet-100 text-violet-700 border-violet-200", icon: "₮", network: coin };
          return (
            <button
              key={coin}
              onClick={() => setSelectedCoin(coin)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                selectedCoin === coin
                  ? info.color
                  : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
              }`}
            >
              <span className="text-base">{info.icon}</span>
              <span>{coin}</span>
            </button>
          );
        })}
      </div>

      {/* Address Display */}
      {currentAddr && (
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
              <>✓ تم النسخ!</>
            ) : (
              <>📋 نسخ العنوان</>
            )}
          </button>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-700 space-y-1">
        <p className="font-bold">تعليمات مهمة:</p>
        <ol className="list-decimal list-inside space-y-1">
          <li>أرسل المبلغ إلى العنوان أعلاه بنفس الشبكة المحددة</li>
          <li>احفظ معرف المعاملة (TX Hash)</li>
          <li>افتح تذكرة دعم مع لقطة الشاشة + TX Hash</li>
          <li>سيتم تأكيد الإيداع خلال ساعة عمل</li>
        </ol>
      </div>
    </div>
  );
}
