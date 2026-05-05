"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getPlatformIcon } from "@/components/ui/PlatformIcons";
import {
  RefreshCw, ArrowRight, Zap, AlertTriangle, Download, Check, X,
  ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus,
  Package, RotateCcw, CheckSquare, Square, Layers,
  WifiOff, CloudDownload, Clock,
} from "lucide-react";
import { Smartphone } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
type RemoteService = {
  service: string; name: string; category?: string; type?: string;
  rate: string; min: number; max: number; refill: boolean; cancel: boolean;
};
type Platform = { id: string; name: string; slug: string; icon?: string; categories: Category[] };
type Category = { id: string; name: string; serviceTypes: ServiceType[] };
type ServiceType = { id: string; name: string };
type ImportForm = { serviceTypeId: string; name: string; description: string; ourRate: string };
type ApiError = { message: string; hint?: string; providerUrl?: string; raw?: string };
type PriceDiff = {
  serviceId: string; name: string; providerServiceId: string;
  oldProviderRate: number; newProviderRate: number;
  changePct: number; changeDir: "up" | "down" | "same";
  oldMin: number; newMin: number; oldMax: number; newMax: number;
};
type SyncResult = {
  diffs: PriceDiff[];
  newCount: number;
  totalRemote: number;
  totalImported: number;
  cacheAgeSeconds?: number;
  cacheExpired?: boolean;
  cacheFetchedAt?: string;
} | null;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function PlatformIconDisplay({ slug, size = 16 }: { slug: string; size?: number }) {
  const Icon = getPlatformIcon(slug);
  return Icon ? <Icon size={size} /> : <Smartphone size={size} className="text-slate-400" />;
}

function autoMatchServiceType(providerCategory: string, platforms: Platform[]): string {
  if (!providerCategory || !platforms.length) return "";
  const normalized = providerCategory.toLowerCase();
  const keywords: Record<string, string[]> = {
    instagram: ["instagram", "insta", " ig ", "انستقرام"],
    tiktok:    ["tiktok", "tik tok", "tik-tok", "تيك توك"],
    youtube:   ["youtube", " yt ", "يوتيوب"],
    twitter:   ["twitter", " x ", "twit", "تويتر"],
    facebook:  ["facebook", " fb ", "فيسبوك"],
    telegram:  ["telegram", "تيليجرام"],
    snapchat:  ["snapchat", "snap", "سناب"],
    threads:   ["threads", "ثريدز"],
    spotify:   ["spotify", "سبوتيفاي"],
    soundcloud:["soundcloud", "ساوند"],
    pinterest: ["pinterest", "بينترست"],
    linkedin:  ["linkedin", "لينكدإن"],
  };
  for (const [slug, words] of Object.entries(keywords)) {
    if (words.some((w) => normalized.includes(w))) {
      const platform = platforms.find((p) => p.slug === slug || p.name.toLowerCase().includes(slug));
      if (platform) {
        const firstST = platform.categories[0]?.serviceTypes[0];
        if (firstST) return firstST.id;
      }
    }
  }
  return "";
}

function formatAge(seconds: number) {
  if (seconds < 60) return `${seconds} ثانية`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} دقيقة`;
  return `${Math.floor(seconds / 3600)} ساعة`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function BrowsePage() {
  const params = useParams();
  const id = params?.id as string;

  // ── Cache & loading state ──────────────────────────────────────────────────
  const [services, setServices] = useState<RemoteService[]>([]);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [noCache, setNoCache] = useState(false);

  // Cache refresh (background fetch from provider API)
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [refreshSuccess, setRefreshSuccess] = useState("");

  // Cache metadata
  const [cacheStatus, setCacheStatus] = useState<"HIT" | "STALE" | "EMPTY" | null>(null);
  const [cacheAge, setCacheAge] = useState<number | null>(null);

  // ── UI tabs & filters ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"browse" | "sync">("browse");
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("");

  // ── Selection & bulk import ────────────────────────────────────────────────
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkServiceTypeId, setBulkServiceTypeId] = useState("");
  const [bulkMarkup, setBulkMarkup] = useState("30");
  const [bulkResult, setBulkResult] = useState<{ imported: number; skipped: number; errors: number } | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  // ── Individual import modal ────────────────────────────────────────────────
  const [modalService, setModalService] = useState<RemoteService | null>(null);
  const [importForm, setImportForm] = useState<ImportForm>({ serviceTypeId: "", name: "", description: "", ourRate: "" });
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState("");
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  // ── Sync tab ───────────────────────────────────────────────────────────────
  const [syncResult, setSyncResult] = useState<SyncResult>(null);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [syncNoCacheData, setSyncNoCacheData] = useState(false);
  const [syncSelected, setSyncSelected] = useState<Set<string>>(new Set());
  const [syncApplyMarkup, setSyncApplyMarkup] = useState(false);
  const [syncMarkupPct, setSyncMarkupPct] = useState("30");
  const [applying, setApplying] = useState(false);
  const [applyResult, setApplyResult] = useState("");

  // ─── Load from cache (instant) ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    setLoading(true);
    setApiError(null);
    setNoCache(false);
    try {
      const [sRes, pRes] = await Promise.all([
        fetch(`/api/providers/${id}/services`),
        fetch("/api/taxonomy"),
      ]);

      const cacheHeader = sRes.headers.get("X-Cache") as "HIT" | "STALE" | "EMPTY" | null;
      const ageHeader = sRes.headers.get("X-Cache-Age");
      setCacheStatus(cacheHeader);
      setCacheAge(ageHeader ? parseInt(ageHeader) : null);
      setPlatforms((await pRes.json()) as Platform[]);

      if (!sRes.ok) {
        setApiError((await sRes.json()) as ApiError);
        return;
      }

      const body = (await sRes.json()) as
        | RemoteService[]
        | { noCacheData: true; message: string };

      if (!Array.isArray(body) && "noCacheData" in body && body.noCacheData) {
        setNoCache(true);
        setServices([]);
      } else {
        setServices(body as RemoteService[]);
      }
    } catch (e) {
      setApiError({ message: `خطأ في الاتصال: ${e instanceof Error ? e.message : "unknown"}` });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadData(); }, [loadData]);

  // ─── Refresh cache (calls external provider API) ────────────────────────
  const refreshCache = useCallback(async () => {
    setRefreshing(true);
    setRefreshError("");
    setRefreshSuccess("");
    try {
      const res = await fetch(`/api/providers/${id}/refresh-cache`, { method: "POST" });
      const data = (await res.json()) as {
        success?: boolean; services?: number; message?: string; staleAvailable?: boolean;
      };
      if (!res.ok) {
        setRefreshError(data.message ?? "فشل تحديث الكاش");
        if (data.staleAvailable) void loadData();
        return;
      }
      setRefreshSuccess(`تم جلب ${data.services ?? 0} خدمة بنجاح`);
      setTimeout(() => setRefreshSuccess(""), 5000);
      void loadData();
    } catch (e) {
      setRefreshError(`خطأ في الاتصال: ${e instanceof Error ? e.message : "unknown"}`);
    } finally {
      setRefreshing(false);
    }
  }, [id, loadData]);

  // ─── Filtered services ───────────────────────────────────────────────────
  const providerCategories = useMemo(
    () => [...new Set(services.map((s) => s.category ?? "غير مصنف"))].sort(),
    [services]
  );

  const filtered = useMemo(
    () =>
      services.filter((s) => {
        const matchSearch =
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.service.includes(search);
        const matchCat = !filterCat || (s.category ?? "غير مصنف") === filterCat;
        return matchSearch && matchCat;
      }),
    [services, search, filterCat]
  );

  // ─── Selection helpers ───────────────────────────────────────────────────
  const allFilteredSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.service));
  const someSelected = selected.size > 0;

  function toggleOne(svcId: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(svcId) ? n.delete(svcId) : n.add(svcId); return n; });
  }
  function toggleAllFiltered() {
    if (allFilteredSelected) {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((s) => n.delete(s.service)); return n; });
    } else {
      setSelected((prev) => { const n = new Set(prev); filtered.forEach((s) => n.add(s.service)); return n; });
    }
  }
  function clearSelection() { setSelected(new Set()); }

  // ─── Open modals ─────────────────────────────────────────────────────────
  function openModal(svc: RemoteService) {
    setModalService(svc);
    const markup = (parseFloat(svc.rate) * 1.3).toFixed(4);
    const suggested = autoMatchServiceType(svc.category ?? "", platforms);
    setImportForm({ serviceTypeId: suggested, name: svc.name, description: "", ourRate: markup });
    setImportMsg("");
  }

  function openBulkModal() {
    const firstSvcId = [...selected][0];
    const firstSvc = services.find((s) => s.service === firstSvcId);
    const suggested = firstSvc ? autoMatchServiceType(firstSvc.category ?? "", platforms) : "";
    setBulkServiceTypeId(suggested);
    setBulkMarkup("30");
    setBulkResult(null);
    setBulkModal(true);
  }

  // ─── Individual import ───────────────────────────────────────────────────
  async function doImport() {
    if (!modalService || !importForm.serviceTypeId || !importForm.name || !importForm.ourRate) {
      setImportMsg("error:الرجاء ملء جميع الحقول المطلوبة"); return;
    }
    setImporting(true);
    try {
      const res = await fetch(`/api/providers/${id}/import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          providerServiceId: modalService.service,
          serviceTypeId: importForm.serviceTypeId,
          name: importForm.name,
          description: importForm.description || undefined,
          providerRate: modalService.rate,
          ourRate: importForm.ourRate,
          min: modalService.min,
          max: modalService.max,
          refill: modalService.refill,
          cancel: modalService.cancel,
        }),
      });
      const data = (await res.json()) as { message?: string };
      if (res.ok) {
        setImportMsg("success");
        setImportedIds((prev) => new Set([...prev, modalService.service]));
        setTimeout(() => setModalService(null), 1200);
      } else {
        setImportMsg(`error:${data.message ?? "حدث خطأ"}`);
      }
    } catch { setImportMsg("error:خطأ في الاتصال"); }
    finally { setImporting(false); }
  }

  // ─── Bulk import ─────────────────────────────────────────────────────────
  async function doBulkImport() {
    if (!bulkServiceTypeId) return;
    setBulkLoading(true);
    setBulkResult(null);
    const selectedServices = services.filter((s) => selected.has(s.service));
    try {
      const res = await fetch(`/api/providers/${id}/bulk-import`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          services: selectedServices.map((s) => ({
            providerServiceId: s.service,
            name: s.name,
            providerRate: s.rate,
            min: s.min, max: s.max,
            refill: s.refill, cancel: s.cancel,
          })),
          serviceTypeId: bulkServiceTypeId,
          markupPercent: parseFloat(bulkMarkup) || 30,
        }),
      });
      const data = (await res.json()) as { imported: number; skipped: number; errors: number };
      if (res.ok) {
        setBulkResult(data);
        setImportedIds((prev) => new Set([...prev, ...selectedServices.map((s) => s.service)]));
        clearSelection();
      } else {
        setBulkResult({ imported: 0, skipped: 0, errors: selectedServices.length });
      }
    } catch {
      setBulkResult({ imported: 0, skipped: 0, errors: selectedServices.length });
    } finally {
      setBulkLoading(false);
    }
  }

  // ─── Sync tab: load diffs (uses cache — fast) ─────────────────────────────
  async function loadSyncDiffs() {
    setSyncLoading(true);
    setSyncError("");
    setSyncResult(null);
    setSyncSelected(new Set());
    setApplyResult("");
    setSyncNoCacheData(false);
    try {
      const res = await fetch(`/api/providers/${id}/sync`);
      if (!res.ok) {
        setSyncError(((await res.json()) as { message: string }).message);
        return;
      }
      const data = (await res.json()) as
        | (SyncResult & { noCacheData?: boolean })
        | { noCacheData: true; message: string };

      if (data && "noCacheData" in data && data.noCacheData) {
        setSyncNoCacheData(true);
        return;
      }
      const result = data as Exclude<typeof data, { noCacheData: true; message: string }>;
      setSyncResult(result);
      if (result && "diffs" in result && result.diffs) {
        setSyncSelected(new Set(result.diffs.map((d) => d.serviceId)));
      }
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "خطأ في الاتصال");
    } finally {
      setSyncLoading(false);
    }
  }

  // ─── Sync tab: apply updates ──────────────────────────────────────────────
  async function applySync() {
    if (!syncResult || syncSelected.size === 0) return;
    setApplying(true);
    setApplyResult("");
    const updates = syncResult.diffs
      .filter((d) => syncSelected.has(d.serviceId))
      .map((d) => ({ serviceId: d.serviceId, newProviderRate: d.newProviderRate, newMin: d.newMin, newMax: d.newMax }));
    try {
      const res = await fetch(`/api/providers/${id}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ updates, applyMarkup: syncApplyMarkup, markupPercent: parseFloat(syncMarkupPct) || 30 }),
      });
      const data = (await res.json()) as { updated: number };
      setApplyResult(res.ok ? `success:تم تحديث ${data.updated} خدمة بنجاح` : `error:${(data as { message?: string }).message ?? "خطأ"}`);
      if (res.ok) void loadSyncDiffs();
    } catch { setApplyResult("error:خطأ في الاتصال"); }
    finally { setApplying(false); }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <Link href="/admin/providers" className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors">
          <ArrowRight size={18} />
        </Link>
        <div className="flex-1">
          <h1 className="text-xl md:text-2xl font-bold text-white">تصفح خدمات المزود</h1>
          {!loading && !apiError && !noCache && services.length > 0 && (
            <p className="text-slate-400 mt-0.5 text-sm flex items-center gap-2 flex-wrap">
              <span>{services.length.toLocaleString()} خدمة</span>
              {cacheStatus === "HIT" && cacheAge !== null && (
                <span className="flex items-center gap-1 text-emerald-400 text-xs">
                  <Zap size={11} /> محدّث · منذ {formatAge(cacheAge)}
                </span>
              )}
              {cacheStatus === "STALE" && cacheAge !== null && (
                <span className="flex items-center gap-1 text-yellow-400 text-xs">
                  <AlertTriangle size={11} /> كاش قديم · منذ {formatAge(cacheAge)}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Refresh cache button */}
        {!loading && !noCache && (
          <button
            onClick={refreshCache}
            disabled={refreshing}
            className="btn-secondary text-xs px-3 py-1.5 flex items-center gap-1.5 shrink-0"
            title="جلب بيانات جديدة من المزود وتحديث الكاش"
          >
            <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "جاري الجلب..." : "تحديث الكاش"}
          </button>
        )}
      </div>

      {/* Cache stale warning */}
      {!loading && !noCache && cacheStatus === "STALE" && !refreshing && (
        <div className="flex items-center gap-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
          <AlertTriangle size={15} className="text-yellow-400 shrink-0" />
          <div className="flex-1 text-yellow-400 text-sm">
            الكاش قديم{cacheAge !== null ? ` (منذ ${formatAge(cacheAge)})` : ""} — اضغط <strong>تحديث الكاش</strong> لجلب أحدث الخدمات والأسعار
          </div>
          <button onClick={refreshCache} className="text-yellow-400 hover:text-yellow-300 text-xs underline shrink-0">
            تحديث الآن
          </button>
        </div>
      )}

      {/* Refresh success */}
      {refreshSuccess && (
        <div className="flex items-center gap-2 mb-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 text-emerald-400 text-sm">
          <Check size={14} /> {refreshSuccess}
        </div>
      )}

      {/* Refresh error */}
      {refreshError && (
        <div className="flex items-start gap-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <X size={14} className="text-red-400 mt-0.5 shrink-0" />
          <div>
            <div className="text-red-400 text-sm font-medium mb-0.5">فشل تحديث الكاش</div>
            <div className="text-red-300 text-xs">{refreshError}</div>
          </div>
          <button onClick={() => setRefreshError("")} className="mr-auto text-slate-500 hover:text-white p-0.5"><X size={13} /></button>
        </div>
      )}

      {/* ── Refreshing overlay ── */}
      {refreshing && (
        <div className="flex items-center gap-3 mb-4 bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-3">
          <RefreshCw size={15} className="text-violet-400 animate-spin shrink-0" />
          <div>
            <div className="text-violet-300 text-sm font-medium">جاري الاتصال بالمزود وجلب الخدمات...</div>
            <div className="text-slate-500 text-xs mt-0.5">قد يستغرق حتى 30 ثانية — بعدها يُحفظ الكاش لـ 6 ساعات</div>
          </div>
        </div>
      )}

      {/* ── Loading state (reading from cache) ── */}
      {loading && (
        <div className="card text-center py-14">
          <div className="w-9 h-9 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-slate-300 font-medium">جاري تحميل الخدمات من الكاش...</div>
          <div className="text-slate-500 text-sm mt-2">سيظهر فوراً إذا كان الكاش موجوداً</div>
        </div>
      )}

      {/* ── No Cache state ── */}
      {!loading && noCache && (
        <div className="card text-center py-16 space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto">
            <WifiOff size={28} className="text-slate-500" />
          </div>
          <div>
            <div className="text-white font-bold text-xl mb-2">لا توجد خدمات مخزنة بعد</div>
            <div className="text-slate-400 text-sm max-w-md mx-auto">
              اضغط الزر أدناه لجلب قائمة خدمات المزود وحفظها — بعدها ستُفتح فورياً في كل مرة
            </div>
          </div>
          <button
            onClick={refreshCache}
            disabled={refreshing}
            className="btn-primary mx-auto flex items-center gap-2 px-8 py-3 text-base"
          >
            <CloudDownload size={18} className={refreshing ? "animate-pulse" : ""} />
            {refreshing ? "جاري الجلب..." : "جلب خدمات المزود"}
          </button>
          <div className="text-slate-600 text-xs flex items-center justify-center gap-1.5">
            <Clock size={11} />
            يُحفظ الكاش لمدة 6 ساعات — مزامنة تلقائية متاحة من صفحة المزودين
          </div>
        </div>
      )}

      {/* ── API Error ── */}
      {apiError && !noCache && (
        <div className="card border-red-500/30 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <X size={18} className="text-red-400" />
            </div>
            <div className="flex-1">
              <div className="text-red-400 font-semibold text-base mb-1">خطأ في تحميل البيانات</div>
              <div className="text-red-300 text-sm">{apiError.message}</div>
            </div>
          </div>
          {apiError.hint && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 text-yellow-400 text-sm">
              {apiError.hint}
            </div>
          )}
          <div className="flex gap-3">
            <button onClick={loadData} className="btn-primary flex items-center gap-2">
              <RefreshCw size={14} /> إعادة المحاولة
            </button>
            <Link href={`/admin/providers/${id}`} className="btn-secondary">تعديل إعدادات المزود</Link>
          </div>
        </div>
      )}

      {/* ── Main content (cache loaded) ── */}
      {!loading && !apiError && !noCache && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-5 bg-slate-800/60 border border-slate-700/50 rounded-xl p-1 w-fit">
            <button
              onClick={() => setActiveTab("browse")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === "browse" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              <Package size={14} /> تصفح الخدمات
              {services.length > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === "browse" ? "bg-white/20" : "bg-slate-700 text-slate-400"}`}>
                  {services.length.toLocaleString()}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab("sync");
                if (!syncResult && !syncLoading && !syncNoCacheData) void loadSyncDiffs();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${activeTab === "sync" ? "bg-violet-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
            >
              <RotateCcw size={14} /> مزامنة الأسعار
            </button>
          </div>

          {/* ════ TAB: BROWSE ═══════════════════════════════════════════════════════ */}
          {activeTab === "browse" && (
            <>
              {/* Filters */}
              <div className="flex gap-3 mb-4 flex-wrap items-center">
                <input
                  className="input max-w-xs"
                  placeholder="بحث بالاسم أو الرقم..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <select
                  className="input max-w-xs"
                  value={filterCat}
                  onChange={(e) => setFilterCat(e.target.value)}
                >
                  <option value="">كل الفئات ({providerCategories.length})</option>
                  {providerCategories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                {(search || filterCat) && (
                  <button
                    onClick={() => { setSearch(""); setFilterCat(""); }}
                    className="text-slate-400 hover:text-white text-sm border border-slate-700 px-3 py-2 rounded-lg flex items-center gap-1"
                  >
                    <X size={13} /> مسح
                  </button>
                )}
                <span className="text-slate-500 text-xs mr-auto">{filtered.length.toLocaleString()} نتيجة</span>
              </div>

              {/* Bulk actions bar */}
              {someSelected && (
                <div className="flex items-center gap-3 mb-4 bg-violet-600/10 border border-violet-500/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-2 text-violet-300 font-medium text-sm">
                    <CheckSquare size={16} />
                    <span>{selected.size} خدمة محددة</span>
                  </div>
                  <button onClick={openBulkModal} className="btn-primary text-xs px-4 py-1.5 flex items-center gap-1.5 mr-auto">
                    <Download size={13} /> استيراد المحدد
                  </button>
                  <button onClick={clearSelection} className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-700">
                    <X size={16} />
                  </button>
                </div>
              )}

              {/* Table */}
              <div className="card p-0 overflow-hidden">
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-10">
                          <button onClick={toggleAllFiltered} className="text-slate-400 hover:text-white transition-colors" title="تحديد الكل">
                            {allFilteredSelected
                              ? <CheckSquare size={15} className="text-violet-400" />
                              : <Square size={15} />
                            }
                          </button>
                        </th>
                        <th className="w-16">ID</th>
                        <th>اسم الخدمة</th>
                        <th>الفئة</th>
                        <th className="w-24">السعر/1000</th>
                        <th className="w-20">Min</th>
                        <th className="w-20">Max</th>
                        <th className="w-16 text-center">Refill</th>
                        <th className="w-20">استيراد</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((s) => (
                        <tr
                          key={s.service}
                          className={
                            importedIds.has(s.service)
                              ? "opacity-40"
                              : selected.has(s.service)
                              ? "bg-violet-500/5"
                              : ""
                          }
                        >
                          <td>
                            <button onClick={() => toggleOne(s.service)} className="text-slate-400 hover:text-violet-400 transition-colors">
                              {selected.has(s.service)
                                ? <CheckSquare size={15} className="text-violet-400" />
                                : <Square size={15} />}
                            </button>
                          </td>
                          <td className="text-slate-500 text-xs font-mono" dir="ltr">{s.service}</td>
                          <td className="max-w-xs">
                            <div className="text-sm text-slate-200 line-clamp-2">{s.name}</div>
                            {s.type && <div className="text-xs text-slate-500 mt-0.5">{s.type}</div>}
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              {s.category && (() => {
                                const slug = Object.keys({
                                  instagram: 1, tiktok: 1, youtube: 1, twitter: 1, facebook: 1,
                                  telegram: 1, snapchat: 1, threads: 1, spotify: 1, soundcloud: 1,
                                }).find((k) => (s.category ?? "").toLowerCase().includes(k));
                                return slug ? <PlatformIconDisplay slug={slug} size={13} /> : null;
                              })()}
                              <span className="line-clamp-1">{s.category ?? "—"}</span>
                            </div>
                          </td>
                          <td className="text-emerald-400 text-sm font-medium tabular-nums" dir="ltr">${s.rate}</td>
                          <td className="text-slate-400 text-xs tabular-nums">{s.min.toLocaleString()}</td>
                          <td className="text-slate-400 text-xs tabular-nums">{s.max.toLocaleString()}</td>
                          <td className="text-center">
                            {s.refill
                              ? <Check size={14} className="text-emerald-400 mx-auto" />
                              : <span className="text-slate-600">—</span>}
                          </td>
                          <td>
                            {importedIds.has(s.service) ? (
                              <span className="text-emerald-500 text-xs flex items-center gap-1">
                                <Check size={12} /> مستورد
                              </span>
                            ) : (
                              <button
                                onClick={() => openModal(s)}
                                className="text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 text-xs font-medium px-2 py-1 rounded-lg transition-colors flex items-center gap-1"
                              >
                                <Download size={12} /> فردي
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filtered.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center text-slate-500 py-10">
                            لا توجد نتائج مطابقة
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ════ TAB: SYNC ══════════════════════════════════════════════════════════ */}
          {activeTab === "sync" && (
            <div className="space-y-4">
              {/* Cache info banner for sync */}
              {syncResult && (
                <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/40 rounded-xl px-4 py-2.5 text-xs text-slate-400">
                  <Clock size={12} className="shrink-0" />
                  المقارنة مبنية على كاش عمره{" "}
                  <span className={syncResult.cacheExpired ? "text-yellow-400 font-medium" : "text-slate-300 font-medium"}>
                    {syncResult.cacheAgeSeconds !== undefined ? formatAge(syncResult.cacheAgeSeconds) : "غير معروف"}
                  </span>
                  {syncResult.cacheExpired && (
                    <span className="text-yellow-400 flex items-center gap-1 mr-1">
                      <AlertTriangle size={11} /> (منتهي الصلاحية — يُفضّل تحديث الكاش)
                    </span>
                  )}
                  <button onClick={refreshCache} disabled={refreshing} className="mr-auto text-violet-400 hover:text-violet-300 flex items-center gap-1">
                    <RefreshCw size={11} className={refreshing ? "animate-spin" : ""} />
                    تحديث الكاش
                  </button>
                </div>
              )}

              {/* No cache data state */}
              {syncNoCacheData && !syncLoading && (
                <div className="card text-center py-14 space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/50 flex items-center justify-center mx-auto">
                    <WifiOff size={24} className="text-slate-500" />
                  </div>
                  <div>
                    <div className="text-white font-semibold mb-1">لا يوجد كاش للمقارنة</div>
                    <div className="text-slate-400 text-sm">يجب جلب خدمات المزود أولاً لإجراء مقارنة الأسعار</div>
                  </div>
                  <button onClick={refreshCache} disabled={refreshing} className="btn-primary mx-auto flex items-center gap-2 px-6 py-2.5">
                    <CloudDownload size={15} />
                    {refreshing ? "جاري الجلب..." : "جلب خدمات المزود"}
                  </button>
                </div>
              )}

              {/* Summary cards */}
              {syncResult && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { label: "إجمالي المزود", value: syncResult.totalRemote.toLocaleString(), color: "text-slate-200" },
                    { label: "مستوردة لديك", value: syncResult.totalImported.toLocaleString(), color: "text-violet-400" },
                    { label: "تغيّرت أسعارها", value: syncResult.diffs.length.toLocaleString(), color: "text-amber-400" },
                    { label: "خدمات جديدة", value: syncResult.newCount.toLocaleString(), color: "text-emerald-400" },
                  ].map((card) => (
                    <div key={card.label} className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-3 text-center">
                      <div className={`text-2xl font-black ${card.color}`}>{card.value}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{card.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Controls */}
              {!syncNoCacheData && (
                <div className="flex items-center gap-3 flex-wrap">
                  <button
                    onClick={loadSyncDiffs}
                    disabled={syncLoading}
                    className="btn-primary flex items-center gap-2 px-4 py-2"
                  >
                    <RotateCcw size={14} className={syncLoading ? "animate-spin" : ""} />
                    {syncLoading ? "جاري المقارنة..." : "فحص التغييرات"}
                  </button>
                  {syncResult && syncResult.diffs.length > 0 && (
                    <>
                      <div className="flex items-center gap-2 border border-slate-700 rounded-xl px-3 py-2">
                        <input
                          type="checkbox"
                          id="applyMarkup"
                          checked={syncApplyMarkup}
                          onChange={(e) => setSyncApplyMarkup(e.target.checked)}
                          className="rounded"
                        />
                        <label htmlFor="applyMarkup" className="text-slate-300 text-xs">هامش ربح %</label>
                        {syncApplyMarkup && (
                          <input
                            type="number"
                            value={syncMarkupPct}
                            onChange={(e) => setSyncMarkupPct(e.target.value)}
                            className="w-16 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-white text-xs text-center"
                            min="0" max="500"
                          />
                        )}
                      </div>
                      <button
                        onClick={applySync}
                        disabled={applying || syncSelected.size === 0}
                        className="btn-secondary flex items-center gap-2 px-4 py-2 disabled:opacity-50"
                      >
                        <Check size={14} /> تحديث {syncSelected.size} محدد
                      </button>
                      <button
                        onClick={() => setSyncSelected(new Set(syncResult.diffs.map((d) => d.serviceId)))}
                        className="text-xs text-violet-400 hover:text-violet-300 px-2"
                      >
                        تحديد الكل
                      </button>
                      <button
                        onClick={() => setSyncSelected(new Set())}
                        className="text-xs text-slate-400 hover:text-slate-300 px-2"
                      >
                        إلغاء
                      </button>
                    </>
                  )}
                </div>
              )}

              {syncError && (
                <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm flex items-center gap-2">
                  <X size={14} /> {syncError}
                </div>
              )}
              {applyResult && (
                <div className={`rounded-xl px-4 py-3 text-sm flex items-center gap-2 ${applyResult.startsWith("success") ? "bg-emerald-900/30 border border-emerald-500/30 text-emerald-400" : "bg-red-900/30 border border-red-500/30 text-red-400"}`}>
                  {applyResult.startsWith("success") ? <Check size={14} /> : <X size={14} />}
                  {applyResult.replace(/^(success|error):/, "")}
                </div>
              )}

              {syncLoading && (
                <div className="card text-center py-12">
                  <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <div className="text-slate-300 font-medium">جاري مقارنة الأسعار...</div>
                  <div className="text-slate-500 text-xs mt-1.5">يستخدم الكاش المحلي — سريع جداً</div>
                </div>
              )}

              {syncResult && !syncLoading && (
                syncResult.diffs.length === 0 ? (
                  <div className="card text-center py-12">
                    <Check size={32} className="text-emerald-400 mx-auto mb-3" />
                    <div className="text-emerald-400 font-semibold text-lg">كل الأسعار محدّثة</div>
                    <div className="text-slate-500 text-sm mt-1">لا توجد تغييرات على الخدمات المستوردة</div>
                    {syncResult.newCount > 0 && (
                      <div className="mt-3 text-slate-400 text-sm">
                        يوجد <span className="text-emerald-400 font-bold">{syncResult.newCount}</span> خدمة جديدة غير مستوردة — تصفح لاستيرادها
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="card p-0 overflow-hidden">
                    <div className="table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th className="w-10">
                              <button
                                onClick={() =>
                                  setSyncSelected(
                                    syncSelected.size === syncResult.diffs.length
                                      ? new Set()
                                      : new Set(syncResult.diffs.map((d) => d.serviceId))
                                  )
                                }
                                className="text-slate-400 hover:text-white"
                              >
                                {syncSelected.size === syncResult.diffs.length
                                  ? <CheckSquare size={15} className="text-violet-400" />
                                  : <Square size={15} />}
                              </button>
                            </th>
                            <th>اسم الخدمة</th>
                            <th className="w-28 text-center">السعر القديم</th>
                            <th className="w-28 text-center">السعر الجديد</th>
                            <th className="w-24 text-center">التغيير</th>
                            <th className="w-32 text-center">الكمية (min/max)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {syncResult.diffs.map((d) => (
                            <tr key={d.serviceId} className={syncSelected.has(d.serviceId) ? "bg-violet-500/5" : ""}>
                              <td>
                                <button
                                  onClick={() => {
                                    setSyncSelected((prev) => {
                                      const n = new Set(prev);
                                      n.has(d.serviceId) ? n.delete(d.serviceId) : n.add(d.serviceId);
                                      return n;
                                    });
                                  }}
                                  className="text-slate-400 hover:text-violet-400"
                                >
                                  {syncSelected.has(d.serviceId)
                                    ? <CheckSquare size={15} className="text-violet-400" />
                                    : <Square size={15} />}
                                </button>
                              </td>
                              <td>
                                <div className="text-sm text-slate-200 line-clamp-1">{d.name}</div>
                                <div className="text-xs text-slate-500 font-mono" dir="ltr">#{d.providerServiceId}</div>
                              </td>
                              <td className="text-center text-slate-400 text-sm tabular-nums" dir="ltr">${d.oldProviderRate.toFixed(4)}</td>
                              <td className="text-center text-sm font-semibold tabular-nums" dir="ltr">
                                <span className={d.changeDir === "up" ? "text-red-400" : d.changeDir === "down" ? "text-emerald-400" : "text-slate-300"}>
                                  ${d.newProviderRate.toFixed(4)}
                                </span>
                              </td>
                              <td className="text-center">
                                <span className={`flex items-center justify-center gap-1 text-xs font-bold ${d.changeDir === "up" ? "text-red-400" : d.changeDir === "down" ? "text-emerald-400" : "text-slate-400"}`}>
                                  {d.changeDir === "up" ? <TrendingUp size={13} /> : d.changeDir === "down" ? <TrendingDown size={13} /> : <Minus size={13} />}
                                  {d.changePct > 0 ? "+" : ""}{d.changePct}%
                                </span>
                              </td>
                              <td className="text-center">
                                {(d.oldMin !== d.newMin || d.oldMax !== d.newMax) ? (
                                  <div className="text-xs">
                                    <span className="text-slate-500 line-through">{d.oldMin.toLocaleString()}/{d.oldMax.toLocaleString()}</span>
                                    <br />
                                    <span className="text-amber-400">{d.newMin.toLocaleString()}/{d.newMax.toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <span className="text-slate-600 text-xs">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )
              )}

              {!syncResult && !syncLoading && !syncNoCacheData && (
                <div className="card text-center py-16">
                  <Layers size={32} className="text-slate-600 mx-auto mb-3" />
                  <div className="text-slate-300 font-semibold mb-1">مزامنة الأسعار</div>
                  <div className="text-slate-500 text-sm mb-4">
                    يقارن الأسعار والكميات من الكاش مع ما تم استيراده — سريع ولا يتصل بالمزود
                  </div>
                  <button onClick={loadSyncDiffs} className="btn-primary mx-auto flex items-center gap-2 px-6 py-2.5">
                    <RotateCcw size={15} /> ابدأ الفحص
                  </button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* ════ MODAL: Individual Import ══════════════════════════════════════════════ */}
      {modalService && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setModalService(null)}>
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Download size={18} className="text-violet-400" /> استيراد خدمة
              </h2>
              <button onClick={() => setModalService(null)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-3 mb-5 text-sm grid grid-cols-3 gap-3">
              <div>
                <div className="text-slate-500 text-xs mb-0.5">Service ID</div>
                <div className="text-white font-mono text-xs" dir="ltr">{modalService.service}</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-0.5">سعر المزود</div>
                <div className="text-emerald-400 font-bold" dir="ltr">${modalService.rate}/1K</div>
              </div>
              <div>
                <div className="text-slate-500 text-xs mb-0.5">الكمية</div>
                <div className="text-white text-xs" dir="ltr">{modalService.min.toLocaleString()}—{modalService.max.toLocaleString()}</div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">اسم الخدمة للعميل *</label>
                <input
                  className="input w-full"
                  value={importForm.name}
                  onChange={(e) => setImportForm((p) => ({ ...p, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  التصنيف *
                  {importForm.serviceTypeId && (
                    <span className="text-violet-400 text-xs font-normal mr-2">✓ اقتراح تلقائي</span>
                  )}
                </label>
                <select
                  className="input w-full"
                  value={importForm.serviceTypeId}
                  onChange={(e) => setImportForm((p) => ({ ...p, serviceTypeId: e.target.value }))}
                >
                  <option value="">— اختر التصنيف —</option>
                  {platforms.map((pl) =>
                    pl.categories.map((cat) =>
                      cat.serviceTypes.map((st) => (
                        <option key={st.id} value={st.id}>{pl.name} › {cat.name} › {st.name}</option>
                      ))
                    )
                  )}
                </select>
                {importForm.serviceTypeId && (() => {
                  const pl = platforms.find((p) =>
                    p.categories.some((c) => c.serviceTypes.some((st) => st.id === importForm.serviceTypeId))
                  );
                  return pl ? (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                      <PlatformIconDisplay slug={pl.slug} size={13} />
                      <span>{pl.name}</span>
                    </div>
                  ) : null;
                })()}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">
                  سعرنا ($/1000) *
                  <span className="text-slate-500 font-normal text-xs mr-2">سعر المزود: ${modalService.rate}</span>
                </label>
                <input
                  className="input w-full"
                  value={importForm.ourRate}
                  onChange={(e) => setImportForm((p) => ({ ...p, ourRate: e.target.value }))}
                  type="number" step="0.0001" min="0" dir="ltr"
                />
                {importForm.ourRate && modalService.rate && (
                  <div className="text-xs mt-1">
                    هامش: <span className={parseFloat(importForm.ourRate) > parseFloat(modalService.rate) ? "text-emerald-400" : "text-red-400"}>
                      {((parseFloat(importForm.ourRate) / parseFloat(modalService.rate) - 1) * 100).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">وصف (اختياري)</label>
                <textarea
                  className="input w-full h-16 resize-none"
                  value={importForm.description}
                  onChange={(e) => setImportForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="وصف مختصر..."
                />
              </div>
              {importMsg && importMsg !== "success" && (
                <div className="rounded-lg px-4 py-3 text-sm bg-red-900/30 border border-red-500/30 text-red-400 flex items-center gap-2">
                  <X size={14} /> {importMsg.replace("error:", "")}
                </div>
              )}
              {importMsg === "success" && (
                <div className="rounded-lg px-4 py-3 text-sm bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 flex items-center gap-2">
                  <Check size={14} /> تم الاستيراد بنجاح!
                </div>
              )}
              <div className="flex gap-3 pt-1">
                <button onClick={doImport} disabled={importing} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                  {importing
                    ? <><RefreshCw size={14} className="animate-spin" /> جاري...</>
                    : <><Download size={14} /> استيراد</>
                  }
                </button>
                <button onClick={() => setModalService(null)} className="btn-secondary px-6 py-3">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════ MODAL: Bulk Import ══════════════════════════════════════════════════ */}
      {bulkModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => !bulkLoading && setBulkModal(false)}>
          <div className="bg-[#1E293B] border border-slate-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Download size={18} className="text-violet-400" /> الاستيراد الجماعي
              </h2>
              {!bulkLoading && (
                <button onClick={() => setBulkModal(false)} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700">
                  <X size={18} />
                </button>
              )}
            </div>

            {!bulkResult ? (
              <div className="space-y-5">
                <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
                  <div className="text-violet-300 font-bold text-sm mb-1">{selected.size} خدمة محددة للاستيراد</div>
                  <div className="text-slate-400 text-xs">سيتم تعيين جميعها تحت التصنيف المختار بهامش الربح المحدد</div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">
                    التصنيف (مشترك لكل الخدمات) *
                    {bulkServiceTypeId && <span className="text-violet-400 text-xs font-normal mr-2">✓ اقتراح تلقائي</span>}
                  </label>
                  <select
                    className="input w-full"
                    value={bulkServiceTypeId}
                    onChange={(e) => setBulkServiceTypeId(e.target.value)}
                  >
                    <option value="">— اختر التصنيف —</option>
                    {platforms.map((pl) =>
                      pl.categories.map((cat) =>
                        cat.serviceTypes.map((st) => (
                          <option key={st.id} value={st.id}>{pl.name} › {cat.name} › {st.name}</option>
                        ))
                      )
                    )}
                  </select>
                  {bulkServiceTypeId && (() => {
                    const pl = platforms.find((p) =>
                      p.categories.some((c) => c.serviceTypes.some((st) => st.id === bulkServiceTypeId))
                    );
                    return pl ? (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
                        <PlatformIconDisplay slug={pl.slug} size={13} />
                        <span>{pl.name}</span>
                      </div>
                    ) : null;
                  })()}
                  {platforms.length === 0 && (
                    <p className="text-yellow-400 text-xs mt-1">
                      لا توجد تصنيفات —{" "}
                      <Link href="/admin/platforms" className="underline" target="_blank">أضف منصة أولاً</Link>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">هامش الربح %</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      className="input w-32"
                      value={bulkMarkup}
                      onChange={(e) => setBulkMarkup(e.target.value)}
                      min="0" max="1000" dir="ltr"
                    />
                    <div className="flex gap-2">
                      {[20, 30, 50, 100].map((v) => (
                        <button
                          key={v}
                          onClick={() => setBulkMarkup(String(v))}
                          className={`text-xs px-2 py-1 rounded-lg border transition-colors ${bulkMarkup === String(v) ? "border-violet-500 bg-violet-500/10 text-violet-300" : "border-slate-600 text-slate-400 hover:border-slate-500"}`}
                        >
                          {v}%
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-slate-500 text-xs mt-1">
                    سعرنا = سعر المزود × (1 + {bulkMarkup}%)
                  </p>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-2">معاينة أول 5 خدمات:</div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {services.filter((s) => selected.has(s.service)).slice(0, 5).map((s) => (
                      <div key={s.service} className="flex justify-between text-xs bg-slate-800/40 rounded-lg px-3 py-1.5">
                        <span className="text-slate-300 line-clamp-1 flex-1">{s.name}</span>
                        <span className="text-emerald-400 shrink-0 mr-2" dir="ltr">
                          ${(parseFloat(s.rate) * (1 + (parseFloat(bulkMarkup) || 30) / 100)).toFixed(4)}/1K
                        </span>
                      </div>
                    ))}
                    {selected.size > 5 && (
                      <div className="text-slate-500 text-xs text-center py-1">... و {selected.size - 5} خدمة أخرى</div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={doBulkImport}
                    disabled={bulkLoading || !bulkServiceTypeId}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {bulkLoading
                      ? <><RefreshCw size={14} className="animate-spin" /> جاري الاستيراد...</>
                      : <><Download size={14} /> استيراد {selected.size} خدمة</>
                    }
                  </button>
                  <button onClick={() => setBulkModal(false)} className="btn-secondary px-6 py-3">إلغاء</button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                    <div className="text-emerald-400 text-2xl font-black">{bulkResult.imported}</div>
                    <div className="text-slate-400 text-xs mt-1">تم استيرادها</div>
                  </div>
                  <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
                    <div className="text-slate-300 text-2xl font-black">{bulkResult.skipped}</div>
                    <div className="text-slate-400 text-xs mt-1">موجودة مسبقاً</div>
                  </div>
                  <div className={`${bulkResult.errors > 0 ? "bg-red-500/10 border-red-500/20" : "bg-slate-800/60 border-slate-700/50"} border rounded-xl p-4`}>
                    <div className={`text-2xl font-black ${bulkResult.errors > 0 ? "text-red-400" : "text-slate-500"}`}>
                      {bulkResult.errors}
                    </div>
                    <div className="text-slate-400 text-xs mt-1">فشلت</div>
                  </div>
                </div>
                <button onClick={() => { setBulkModal(false); setBulkResult(null); }} className="btn-primary px-8 py-2.5">
                  تم
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
