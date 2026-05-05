"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getPlatformIcon } from "@/components/ui/PlatformIcons";

function getPlatformSlug(name: string): string {
  const map: Record<string, string> = {
    "إنستقرام": "instagram", "تيك توك": "tiktok", "يوتيوب": "youtube",
    "تويتر X": "twitter", "فيسبوك": "facebook", "تيليجرام": "telegram",
    "سناب شات": "snapchat", "ثريدز": "threads", "ساوند كلاود": "soundcloud", "سبوتيفاي": "spotify",
  };
  return map[name] ?? name.toLowerCase();
}

type Platform = { id: string; name: string; icon: string; color?: string };
type ServiceType = { id: string; name: string };
type Category = { id: string; name: string; serviceTypes: ServiceType[] };
type PlatformFull = Platform & { categories: Category[] };

type Service = {
  id: string;
  name: string;
  description: string | null;
  ourRate: string;
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
  isFavorite: boolean;
  serviceType: {
    name: string;
    category: { name: string; platform: Platform };
  };
};

const PLATFORM_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
  "إنستقرام": { bg: "from-pink-500 to-rose-500", border: "border-pink-200", text: "text-pink-600", badge: "bg-pink-50 text-pink-600" },
  "تيك توك":  { bg: "from-gray-800 to-gray-900", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-100 text-gray-700" },
  "يوتيوب":   { bg: "from-red-500 to-red-600",   border: "border-red-200",  text: "text-red-600",  badge: "bg-red-50 text-red-600" },
  "تويتر X":  { bg: "from-gray-700 to-gray-900", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-100 text-gray-700" },
  "فيسبوك":   { bg: "from-blue-600 to-blue-700", border: "border-blue-200", text: "text-blue-600", badge: "bg-blue-50 text-blue-600" },
  "تيليجرام": { bg: "from-sky-500 to-cyan-500",  border: "border-sky-200",  text: "text-sky-600",  badge: "bg-sky-50 text-sky-600" },
  "سناب شات": { bg: "from-yellow-400 to-amber-400", border: "border-yellow-200", text: "text-yellow-600", badge: "bg-yellow-50 text-yellow-600" },
  "ثريدز":    { bg: "from-gray-800 to-gray-900", border: "border-gray-200", text: "text-gray-700", badge: "bg-gray-100 text-gray-700" },
  "ساوند كلاود": { bg: "from-orange-500 to-orange-600", border: "border-orange-200", text: "text-orange-600", badge: "bg-orange-50 text-orange-600" },
  "سبوتيفاي": { bg: "from-green-500 to-emerald-500", border: "border-green-200", text: "text-green-600", badge: "bg-green-50 text-green-600" },
};

const DEFAULT_COLOR = { bg: "from-violet-500 to-purple-600", border: "border-violet-200", text: "text-violet-600", badge: "bg-violet-50 text-violet-600" };

function getPColor(name: string) {
  return PLATFORM_COLORS[name] ?? DEFAULT_COLOR;
}

export default function ServicesPage() {
  const router = useRouter();
  const [platforms, setPlatforms] = useState<PlatformFull[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedType, setSelectedType] = useState<string>("");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [favLoading, setFavLoading] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/taxonomy")
      .then((r) => r.json())
      .then((data: PlatformFull[]) => setPlatforms(data));
  }, []);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (selectedPlatform) params.set("platformId", selectedPlatform);
    if (selectedCategory) params.set("categoryId", selectedCategory);
    if (selectedType) params.set("serviceTypeId", selectedType);
    if (search) params.set("search", search);
    try {
      const res = await fetch(`/api/services?${params.toString()}`);
      const data = await res.json() as { services: Service[]; total: number };
      setServices(data.services ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [selectedPlatform, selectedCategory, selectedType, search]);

  useEffect(() => { void fetchServices(); }, [fetchServices]);

  const activePlatform = platforms.find((p) => p.id === selectedPlatform);
  const activeCategory = activePlatform?.categories.find((c) => c.id === selectedCategory);

  function handlePlatformChange(id: string) {
    setSelectedPlatform(id);
    setSelectedCategory("");
    setSelectedType("");
  }

  async function toggleFavorite(e: React.MouseEvent, serviceId: string, isFav: boolean) {
    e.stopPropagation();
    setFavLoading(serviceId);
    try {
      await fetch(`/api/services/favorites`, {
        method: isFav ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });
      setServices((prev) => prev.map((s) => s.id === serviceId ? { ...s, isFavorite: !isFav } : s));
    } catch { /* ignore */ }
    setFavLoading(null);
  }

  function orderNow(e: React.MouseEvent, serviceId: string) {
    e.stopPropagation();
    router.push(`/dashboard/new-order?serviceId=${serviceId}`);
  }

  const clearFilters = () => {
    setSelectedPlatform(""); setSelectedCategory(""); setSelectedType("");
    setSearch(""); setSearchInput("");
  };

  const hasFilters = selectedPlatform || selectedCategory || selectedType || search;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">الخدمات</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {loading ? "جاري التحميل..." : `${total.toLocaleString("ar")} خدمة متاحة`}
          </p>
        </div>
        <Link href="/dashboard/new-order" className="btn-primary flex items-center gap-2">
          <span>➕</span> طلب جديد
        </Link>
      </div>

      {/* منصات كبطاقات سريعة */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => handlePlatformChange("")}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all border ${
            !selectedPlatform
              ? "bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-200"
              : "bg-white text-gray-600 border-gray-200 hover:border-violet-300"
          }`}
        >
          🌐 الكل
        </button>
        {platforms.map((p) => {
          const c = getPColor(p.name);
          const isActive = selectedPlatform === p.id;
          return (
            <button
              key={p.id}
              onClick={() => handlePlatformChange(p.id)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm whitespace-nowrap transition-all border ${
                isActive
                  ? `bg-gradient-to-r ${c.bg} text-white border-transparent shadow-md`
                  : `bg-white ${c.text} ${c.border} hover:${c.border}`
              }`}
            >
              {(() => { const I = getPlatformIcon(getPlatformSlug(p.name)); return I ? <I size={20} /> : <span>{p.icon}</span>; })()} {p.name}
            </button>
          );
        })}
      </div>

      {/* فلاتر ثانوية */}
      <div className="card mb-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="input-label">التصنيف</label>
            <select className="input-field" value={selectedCategory}
              onChange={(e) => { setSelectedCategory(e.target.value); setSelectedType(""); }}
              disabled={!activePlatform}>
              <option value="">كل التصنيفات</option>
              {activePlatform?.categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">النوع</label>
            <select className="input-field" value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              disabled={!activeCategory}>
              <option value="">كل الأنواع</option>
              {activeCategory?.serviceTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="input-label">بحث عن خدمة</label>
            <div className="flex gap-2">
              <input
                className="input-field flex-1"
                placeholder="اكتب اسم الخدمة..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setSearch(searchInput)}
              />
              <button onClick={() => setSearch(searchInput)} className="btn-primary px-3">🔍</button>
            </div>
          </div>
        </div>
        {hasFilters && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-gray-400">الفلاتر:</span>
            {selectedPlatform && (
              <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${getPColor(activePlatform?.name ?? "").badge}`}>
                {(() => { const I = activePlatform ? getPlatformIcon(getPlatformSlug(activePlatform.name)) : null; return I ? <I size={20} /> : <span>{activePlatform?.icon}</span>; })()} {activePlatform?.name}
              </span>
            )}
            {selectedCategory && (
              <span className="bg-violet-100 text-violet-700 text-xs px-2.5 py-1 rounded-full font-semibold">{activeCategory?.name}</span>
            )}
            {search && (
              <span className="bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full font-semibold">"{search}"</span>
            )}
            <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-700 font-bold mr-auto">
              × مسح الكل
            </button>
          </div>
        )}
      </div>

      {/* المحتوى */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <div className="w-10 h-10 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">جاري تحميل الخدمات...</p>
        </div>
      ) : services.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-5xl mb-3">🔍</div>
          <p className="text-gray-500 font-medium">لا توجد خدمات مطابقة</p>
          <button onClick={clearFilters} className="text-violet-600 font-bold hover:underline text-sm mt-2 inline-block">
            مسح الفلاتر
          </button>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {services.map((s) => {
              const pName = s.serviceType.category.platform.name;
              const c = getPColor(pName);
              return (
                <div key={s.id} className={`card border ${c.border} hover:shadow-md transition-all`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${c.bg} flex items-center justify-center text-white text-base shrink-0`}>
                      {(() => { const I = getPlatformIcon(getPlatformSlug(s.serviceType.category.platform.name)); return I ? <I size={16} /> : <span>{s.serviceType.category.platform.icon}</span>; })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-800 text-sm leading-snug">{s.name}</div>
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.badge}`}>
                              {pName}
                            </span>
                            <span className="text-xs text-gray-400">{s.serviceType.category.name}</span>
                            {s.refill && <span className="text-xs bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-full font-semibold">♻ ضمان</span>}
                          </div>
                        </div>
                        <div className="text-left shrink-0">
                          <div className="text-emerald-600 font-black" dir="ltr">${parseFloat(s.ourRate).toFixed(3)}</div>
                          <div className="text-gray-400 text-xs">/1000</div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          {s.min.toLocaleString("ar")} – {s.max.toLocaleString("ar")}
                        </span>
                        <button
                          onClick={(e) => orderNow(e, s.id)}
                          className={`text-xs bg-gradient-to-r ${c.bg} text-white px-3 py-1.5 rounded-lg font-semibold shadow-sm hover:opacity-90 transition-opacity`}
                        >
                          طلب الآن
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop table */}
          <div className="card hidden md:block overflow-hidden p-0">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-right text-xs font-bold text-gray-500 px-4 py-3 w-16">#</th>
                  <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الخدمة</th>
                  <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">المنصة</th>
                  <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">السعر / 1000</th>
                  <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الحد الأدنى</th>
                  <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">الحد الأقصى</th>
                  <th className="text-right text-xs font-bold text-gray-500 px-4 py-3">المميزات</th>
                  <th className="px-4 py-3 w-32"></th>
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => {
                  const pName = s.serviceType.category.platform.name;
                  const c = getPColor(pName);
                  const isExpanded = expandedId === s.id;
                  return (
                    <>
                      <tr
                        key={s.id}
                        className={`border-b border-gray-50 hover:bg-violet-50/40 transition-colors cursor-pointer ${isExpanded ? "bg-violet-50/60" : ""}`}
                        onClick={() => setExpandedId(isExpanded ? null : s.id)}
                      >
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">{total - i}</td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-gray-800 text-sm max-w-xs">{s.name}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{s.serviceType.name}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${c.bg} flex items-center justify-center text-white text-xs`}>
                              {(() => { const I = getPlatformIcon(getPlatformSlug(s.serviceType.category.platform.name)); return I ? <I size={16} /> : <span>{s.serviceType.category.platform.icon}</span>; })()}
                            </div>
                            <div>
                              <div className={`text-xs font-semibold ${c.text}`}>{pName}</div>
                              <div className="text-xs text-gray-400">{s.serviceType.category.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-emerald-600 font-black text-sm" dir="ltr">
                            ${parseFloat(s.ourRate).toFixed(3)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm font-medium">
                          {s.min.toLocaleString("ar")}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm font-medium">
                          {s.max.toLocaleString("ar")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1 flex-wrap">
                            {s.refill && (
                              <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">♻ ضمان</span>
                            )}
                            {s.cancel && (
                              <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">✖ إلغاء</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => toggleFavorite(e, s.id, s.isFavorite)}
                              disabled={favLoading === s.id}
                              className={`text-lg transition-transform hover:scale-110 ${s.isFavorite ? "opacity-100" : "opacity-30 hover:opacity-60"}`}
                              title={s.isFavorite ? "إزالة من المفضلة" : "إضافة للمفضلة"}
                            >
                              {favLoading === s.id ? "⏳" : s.isFavorite ? "⭐" : "☆"}
                            </button>
                            <button
                              onClick={(e) => orderNow(e, s.id)}
                              className={`text-xs bg-gradient-to-r ${c.bg} text-white px-3 py-1.5 rounded-lg font-bold shadow-sm hover:opacity-90 transition-opacity whitespace-nowrap`}
                            >
                              طلب الآن
                            </button>
                          </div>
                        </td>
                      </tr>
                      {/* تفاصيل موسّعة */}
                      {isExpanded && s.description && (
                        <tr key={`${s.id}-desc`} className="bg-violet-50/60">
                          <td colSpan={8} className="px-4 py-3">
                            <div className="flex items-start gap-2">
                              <span className="text-violet-400 mt-0.5">ℹ</span>
                              <p className="text-sm text-gray-600 leading-relaxed">{s.description}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                يُعرض <span className="font-bold text-gray-700">{services.length.toLocaleString("ar")}</span> من أصل {total.toLocaleString("ar")} خدمة
              </span>
              <span className="text-xs text-gray-400">اضغط على أي خدمة لرؤية التفاصيل</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
