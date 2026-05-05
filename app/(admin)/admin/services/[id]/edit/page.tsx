"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Copy, Check, TrendingUp, TrendingDown, Minus, History } from "lucide-react";

type ServiceUpdate = {
  id: string; changeType: string; oldValue: string | null; newValue: string | null; note: string | null; createdAt: string;
};
type Service = {
  id: string; name: string; description: string | null; status: string;
  ourRate: string; providerRate: string; min: number; max: number;
  refill: boolean; cancel: boolean; serviceTypeId: string;
  provider: { name: string };
  serviceType: { name: string; category: { name: string; platform: { name: string; icon?: string } } };
  serviceUpdates?: ServiceUpdate[];
};
type Platform = {
  id: string; name: string; icon?: string;
  categories: Array<{ id: string; name: string; serviceTypes: Array<{ id: string; name: string }> }>;
};

const changeTypeLabels: Record<string, string> = {
  PRICE_UPDATE: "تغيير سعر", STATUS_CHANGE: "تغيير حالة",
  NAME_CHANGE: "تغيير اسم", SYNC: "مزامنة",
};

export default function EditServicePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const [service, setService] = useState<Service | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [form, setForm] = useState({ name: "", description: "", serviceTypeId: "", ourRate: "", status: "ACTIVE", refill: false, cancel: false });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"edit" | "history">("edit");

  const load = useCallback(async () => {
    const [sRes, pRes] = await Promise.all([
      fetch(`/api/admin/services/${id}`),
      fetch("/api/taxonomy"),
    ]);
    const [s, p] = await Promise.all([sRes.json() as Promise<Service>, pRes.json() as Promise<Platform[]>]);
    setService(s);
    setPlatforms(p);
    setForm({
      name: s.name, description: s.description ?? "", serviceTypeId: s.serviceTypeId,
      ourRate: s.ourRate.toString(), status: s.status, refill: s.refill, cancel: s.cancel,
    });
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  function upd(key: string, val: unknown) { setForm((p) => ({ ...p, [key]: val })); }

  async function onSave() {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await fetch(`/api/admin/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { message?: string };
      if (res.ok) { setSuccess("تم الحفظ بنجاح"); void load(); }
      else setError(data.message ?? "خطأ");
    } catch { setError("خطأ في الاتصال"); }
    finally { setSaving(false); }
  }

  async function onDelete() {
    if (!confirm("حذف هذه الخدمة؟")) return;
    const res = await fetch(`/api/admin/services/${id}`, { method: "DELETE" });
    if (res.ok) router.push("/admin/services");
    else { const d = await res.json() as { message: string }; setError(d.message); }
  }

  function copyId() {
    void navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function priceDelta(oldVal: string | null, newVal: string | null) {
    if (!oldVal || !newVal) return null;
    const diff = parseFloat(newVal) - parseFloat(oldVal);
    const pct = ((diff / parseFloat(oldVal)) * 100).toFixed(1);
    return { diff, pct: parseFloat(pct) };
  }

  if (!service) return (
    <div className="p-6">
      <div className="space-y-3 max-w-2xl">
        {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-800 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  const priceUpdates = (service.serviceUpdates ?? []).filter(u => u.changeType === "PRICE_UPDATE");

  return (
    <div className="p-4 md:p-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/services" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors text-lg">←</Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-2xl font-black text-white truncate">{service.name}</h1>
          <p className="text-slate-400 text-sm mt-0.5">المزود: {service.provider.name} · {service.serviceType.category.platform.name}</p>
        </div>
      </div>

      {/* Service ID */}
      <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl px-4 py-3 mb-5 flex items-center justify-between">
        <div>
          <span className="text-slate-500 text-xs">Service ID</span>
          <p className="text-slate-300 text-xs font-mono mt-0.5 select-all" dir="ltr">{id}</p>
        </div>
        <button
          onClick={copyId}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-violet-400 transition-colors px-3 py-1.5 rounded-lg hover:bg-violet-500/10"
        >
          {copied ? <><Check size={13} className="text-emerald-400" /><span className="text-emerald-400">نُسخ!</span></> : <><Copy size={13} />نسخ</>}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-slate-800/60 rounded-xl p-1">
        {[
          { key: "edit", label: "تعديل البيانات" },
          { key: "history", label: `سجل التغييرات${priceUpdates.length > 0 ? ` (${priceUpdates.length})` : ""}` },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as "edit" | "history")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === t.key
                ? "bg-violet-600 text-white shadow-md"
                : "text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Edit Tab */}
      {activeTab === "edit" && (
        <div className="card space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">اسم الخدمة</label>
            <input className="input-field" value={form.name} onChange={(e) => upd("name", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">الوصف</label>
            <textarea className="input-field h-20 resize-none" value={form.description} onChange={(e) => upd("description", e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">التصنيف</label>
            <select className="input-field" value={form.serviceTypeId} onChange={(e) => upd("serviceTypeId", e.target.value)}>
              <option value="">اختر...</option>
              {platforms.map((pl) => pl.categories.map((cat) => cat.serviceTypes.map((st) => (
                <option key={st.id} value={st.id}>{pl.name} › {cat.name} › {st.name}</option>
              ))))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">سعر المزود/1000</label>
              <input className="input-field bg-slate-700/50 cursor-not-allowed" value={`$${service.providerRate}`} readOnly dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">سعرنا/1000 *</label>
              <input className="input-field" value={form.ourRate} onChange={(e) => upd("ourRate", e.target.value)} type="number" step="0.0001" dir="ltr" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">الحد الأدنى</label>
              <input className="input-field bg-slate-700/50 cursor-not-allowed" value={service.min} readOnly dir="ltr" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">الحد الأقصى</label>
              <input className="input-field bg-slate-700/50 cursor-not-allowed" value={service.max} readOnly dir="ltr" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">الحالة</label>
            <select className="input-field" value={form.status} onChange={(e) => upd("status", e.target.value)}>
              <option value="ACTIVE">نشط</option>
              <option value="INACTIVE">معطل</option>
            </select>
          </div>
          <div className="flex gap-6">
            {[["refill", "Refill (إعادة تعبئة)"], ["cancel", "Cancel (إلغاء)"]].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-indigo-600"
                  checked={form[key as keyof typeof form] as boolean}
                  onChange={(e) => upd(key, e.target.checked)}
                />
                <span className="text-slate-300 text-sm">{label}</span>
              </label>
            ))}
          </div>
          {error && <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>}
          {success && <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">{success}</div>}
          <div className="flex gap-3 pt-1">
            <button onClick={onSave} disabled={saving} className="btn-primary flex-1 py-3">
              {saving ? "جاري الحفظ..." : "حفظ التغييرات"}
            </button>
            <button onClick={onDelete} className="btn-danger px-5 py-3">حذف</button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === "history" && (
        <div className="card">
          {(service.serviceUpdates ?? []).length === 0 ? (
            <div className="text-center py-10">
              <History size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500">لا يوجد سجل تغييرات بعد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(service.serviceUpdates ?? []).map((upd) => {
                const delta = upd.changeType === "PRICE_UPDATE" ? priceDelta(upd.oldValue, upd.newValue) : null;
                return (
                  <div key={upd.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-700/30 border border-slate-700/50">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      delta && delta.diff > 0 ? "bg-red-500/20" :
                      delta && delta.diff < 0 ? "bg-emerald-500/20" :
                      "bg-slate-600/50"
                    }`}>
                      {delta && delta.diff > 0 ? <TrendingUp size={14} className="text-red-400" /> :
                       delta && delta.diff < 0 ? <TrendingDown size={14} className="text-emerald-400" /> :
                       <Minus size={14} className="text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-200 text-sm font-semibold">
                          {changeTypeLabels[upd.changeType] ?? upd.changeType}
                        </span>
                        <span className="text-slate-500 text-xs whitespace-nowrap">
                          {new Date(upd.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      {upd.changeType === "PRICE_UPDATE" && upd.oldValue && upd.newValue && (
                        <div className="flex items-center gap-2 mt-1 text-xs" dir="ltr">
                          <span className="text-slate-400">${parseFloat(upd.oldValue).toFixed(4)}</span>
                          <span className="text-slate-600">→</span>
                          <span className={`font-semibold ${delta && delta.diff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                            ${parseFloat(upd.newValue).toFixed(4)}
                          </span>
                          {delta && (
                            <span className={`font-bold ${delta.diff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                              ({delta.diff > 0 ? "+" : ""}{delta.pct}%)
                            </span>
                          )}
                        </div>
                      )}
                      {upd.changeType !== "PRICE_UPDATE" && upd.oldValue && upd.newValue && (
                        <div className="flex items-center gap-2 mt-1 text-xs">
                          <span className="text-slate-400">{upd.oldValue}</span>
                          <span className="text-slate-600">→</span>
                          <span className="text-violet-400 font-semibold">{upd.newValue}</span>
                        </div>
                      )}
                      {upd.note && <p className="text-slate-500 text-xs mt-1">{upd.note}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
