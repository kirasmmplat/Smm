"use client";

import { useState } from "react";
import { RefreshCw, Check, AlertTriangle } from "lucide-react";

type State = "idle" | "loading" | "success" | "partial";

export default function SyncAllButton() {
  const [state, setState] = useState<State>("idle");
  const [result, setResult] = useState<{ refreshed: number; failed: number } | null>(null);

  async function handleSyncAll() {
    setState("loading");
    setResult(null);
    try {
      const res = await fetch("/api/admin/providers/sync-all", { method: "POST" });
      const data = (await res.json()) as { refreshed: number; failed: number; total: number };
      setResult({ refreshed: data.refreshed, failed: data.failed });
      setState(data.failed === 0 ? "success" : "partial");
      setTimeout(() => { setState("idle"); setResult(null); }, 8000);
    } catch {
      setState("idle");
    }
  }

  const baseClass = "btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 disabled:opacity-50 transition-all";

  if (state === "success") {
    return (
      <button disabled className={`${baseClass} !border-emerald-500/40 !text-emerald-400`}>
        <Check size={13} /> تم تزامن {result?.refreshed ?? 0}
      </button>
    );
  }
  if (state === "partial") {
    return (
      <button disabled className={`${baseClass} !border-yellow-500/40 !text-yellow-400`}>
        <AlertTriangle size={13} /> {result?.refreshed} نجح · {result?.failed} فشل
      </button>
    );
  }

  return (
    <button onClick={handleSyncAll} disabled={state === "loading"} className={baseClass}>
      <RefreshCw size={13} className={state === "loading" ? "animate-spin" : ""} />
      {state === "loading" ? "جاري التزامن..." : "تزامن الكل"}
    </button>
  );
}
