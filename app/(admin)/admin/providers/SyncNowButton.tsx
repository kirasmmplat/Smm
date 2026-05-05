"use client";

import { useState } from "react";
import { RefreshCw, Check, X } from "lucide-react";

type State = "idle" | "loading" | "success" | "error";

export default function SyncNowButton({ providerId }: { providerId: string }) {
  const [state, setState] = useState<State>("idle");
  const [msg, setMsg] = useState("");

  async function handleSync() {
    setState("loading");
    setMsg("");
    try {
      const res = await fetch(`/api/providers/${providerId}/refresh-cache`, { method: "POST" });
      const data = (await res.json()) as { services?: number; message?: string };
      if (res.ok) {
        setState("success");
        setMsg(`${data.services ?? 0} خدمة`);
        setTimeout(() => { setState("idle"); setMsg(""); }, 4000);
      } else {
        setState("error");
        setMsg(data.message ?? "فشل التزامن");
        setTimeout(() => { setState("idle"); setMsg(""); }, 6000);
      }
    } catch {
      setState("error");
      setMsg("خطأ في الاتصال");
      setTimeout(() => { setState("idle"); setMsg(""); }, 6000);
    }
  }

  if (state === "success") {
    return (
      <span className="text-emerald-400 text-xs flex items-center gap-1 font-medium">
        <Check size={12} /> {msg}
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="text-red-400 text-xs flex items-center gap-1" title={msg}>
        <X size={12} /> فشل
      </span>
    );
  }

  return (
    <button
      onClick={handleSync}
      disabled={state === "loading"}
      className="text-violet-400 hover:text-violet-300 text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
    >
      <RefreshCw size={11} className={state === "loading" ? "animate-spin" : ""} />
      {state === "loading" ? "جاري..." : "زامن"}
    </button>
  );
}
