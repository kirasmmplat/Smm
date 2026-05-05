"use client";

import { useState } from "react";
import { Key, Copy, RefreshCw, Trash2, Check } from "lucide-react";

export default function ApiKeyManager({ apiKey, baseUrl }: { apiKey: string | null; baseUrl: string }) {
  const [key, setKey] = useState(apiKey);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generateKey() {
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ generateApiKey: true }),
      });
      const data = await res.json();
      if (data.apiKey) setKey(data.apiKey);
    } finally {
      setLoading(false);
    }
  }

  async function revokeKey() {
    if (!confirm("هل أنت متأكد من حذف مفتاح API الحالي؟")) return;
    setLoading(true);
    try {
      await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ revokeApiKey: true }),
      });
      setKey(null);
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="card">
      <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
        <Key size={16} className="text-violet-600" />
        مفتاح API الخاص بك
      </h2>

      {key ? (
        <div className="space-y-4">
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 flex items-center justify-between gap-3">
            <div className="font-mono text-violet-700 text-sm break-all" dir="ltr">{key}</div>
            <button onClick={() => copyToClipboard(key)} className="btn-secondary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1.5">
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "تم النسخ" : "نسخ"}
            </button>
          </div>

          <div className="flex gap-3">
            <button onClick={generateKey} disabled={loading} className="btn-secondary text-sm flex items-center gap-1.5">
              <RefreshCw size={14} />
              {loading ? "جاري..." : "تجديد المفتاح"}
            </button>
            <button onClick={revokeKey} disabled={loading} className="text-red-600 hover:text-red-700 text-sm border border-red-200 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5">
              <Trash2 size={14} />
              حذف المفتاح
            </button>
          </div>

          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl p-3">
            احتفظ بمفتاح API سرياً. تجديد المفتاح سيبطل المفتاح القديم فوراً.
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-violet-50 border border-violet-100 flex items-center justify-center">
            <Key size={24} className="text-violet-400" />
          </div>
          <p className="text-gray-500 mb-5 font-medium">لا يوجد مفتاح API بعد. أنشئ مفتاحاً للبدء.</p>
          <button onClick={generateKey} disabled={loading} className="btn-primary">
            {loading ? "جاري الإنشاء..." : "إنشاء مفتاح API"}
          </button>
        </div>
      )}
    </div>
  );
}
