"use client";

import { useEffect, useState, useMemo, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { getPlatformIcon } from "@/components/ui/PlatformIcons";
import { useSession } from "next-auth/react";

type Platform = { id: string; name: string; icon?: string; color?: string; categories: Category[] };
type Category = { id: string; name: string; serviceTypes: ServiceType[] };
type ServiceType = { id: string; name: string };
type Service = {
  id: string;
  name: string;
  description: string | null;
  ourRate: string;
  min: number;
  max: number;
  refill: boolean;
  cancel: boolean;
};

const PLATFORM_GRADIENTS: Record<string, string> = {
  instagram: "from-pink-500 via-rose-500 to-orange-400",
  tiktok: "from-gray-900 via-gray-800 to-gray-700",
  youtube: "from-red-600 to-red-500",
  twitter: "from-sky-500 to-blue-500",
  facebook: "from-blue-700 to-blue-500",
  telegram: "from-sky-400 to-cyan-500",
  snapchat: "from-yellow-400 to-yellow-300",
  threads: "from-gray-900 to-gray-700",
  soundcloud: "from-orange-500 to-orange-400",
  spotify: "from-green-500 to-emerald-400",
};

const PLATFORM_BG: Record<string, string> = {
  instagram: "bg-gradient-to-br from-pink-50 to-orange-50 border-pink-200",
  tiktok: "bg-gradient-to-br from-gray-50 to-slate-100 border-gray-200",
  youtube: "bg-red-50 border-red-200",
  twitter: "bg-sky-50 border-sky-200",
  facebook: "bg-blue-50 border-blue-200",
  telegram: "bg-cyan-50 border-cyan-200",
  snapchat: "bg-yellow-50 border-yellow-200",
  threads: "bg-gray-50 border-gray-200",
  soundcloud: "bg-orange-50 border-orange-200",
  spotify: "bg-green-50 border-green-200",
};

function getPlatformSlug(name: string): string {
  const map: Record<string, string> = {
    "إنستقرام": "instagram",
    "تيك توك": "tiktok",
    "يوتيوب": "youtube",
    "تويتر X": "twitter",
    "فيسبوك": "facebook",
    "تيليجرام": "telegram",
    "سناب شات": "snapchat",
    "ثريدز": "threads",
    "ساوند كلاود": "soundcloud",
    "سبوتيفاي": "spotify",
  };
  return map[name] ?? name.toLowerCase();
}

function NewOrderContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const preselectedServiceId = searchParams.get("serviceId");
  const router = useRouter();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingServices, setLoadingServices] = useState(false);

  const [selPlatform, setSelPlatform] = useState<Platform | null>(null);
  const [selCategory, setSelCategory] = useState<Category | null>(null);
  const [selServiceType, setSelServiceType] = useState<ServiceType | null>(null);
  const [selService, setSelService] = useState<Service | null>(null);
  const [search, setSearch] = useState("");

  const [link, setLink] = useState("");
  const [quantity, setQuantity] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    fetch("/api/taxonomy")
      .then((r) => r.json() as Promise<Platform[]>)
      .then((data) => { setPlatforms(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selServiceType) { setServices([]); setSelService(null); return; }
    setLoadingServices(true);
    fetch(`/api/services?serviceTypeId=${selServiceType.id}&limit=200`)
      .then((r) => r.json() as Promise<{ services: Service[] } | Service[]>)
      .then((data) => {
        if (Array.isArray(data)) setServices(data);
        else setServices((data as { services: Service[] }).services ?? []);
      })
      .finally(() => setLoadingServices(false));
  }, [selServiceType]);

  // Auto-select service from URL parameter
  useEffect(() => {
    if (!preselectedServiceId || platforms.length === 0) return;
    
    // Fetch the service details to find its platform/category/type
    fetch(`/api/services/${preselectedServiceId}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        const serviceData = data as any;
        const st = serviceData.serviceType;
        if (!st?.category?.platform) return;
        
        // Find matching platform
        const platform = platforms.find(p => p.name === st.category.platform.name);
        if (!platform) return;
        setSelPlatform(platform);
        
        // Find matching category
        const cat = platform.categories.find((c: any) => c.name === st.category.name);
        if (!cat) return;
        setSelCategory(cat);
        
        // Find matching service type
        const sType = cat.serviceTypes.find((s: any) => s.name === st.name);
        if (sType) {
          setSelServiceType(sType);
          // Services will be loaded by the other useEffect, then auto-select
        }
      })
      .catch(() => {});
  }, [preselectedServiceId, platforms]);

  // Auto-select the specific service once services are loaded
  useEffect(() => {
    if (!preselectedServiceId || services.length === 0) return;
    const target = services.find(s => s.id === preselectedServiceId);
    if (target) {
      setSelService(target);
      setQuantity(String(target.min));
      setResult(null);
    }
  }, [preselectedServiceId, services]);


  const categories = selPlatform?.categories ?? [];
  const serviceTypes = selCategory?.serviceTypes ?? [];

  const filteredServices = useMemo(() => {
    if (!search) return services;
    return services.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  }, [services, search]);

  const charge = useMemo(() => {
    if (!selService || !quantity) return null;
    const q = parseInt(quantity);
    if (isNaN(q) || q <= 0) return null;
    return ((parseFloat(selService.ourRate) * q) / 1000).toFixed(4);
  }, [selService, quantity]);

  const handlePlatformSelect = useCallback((p: Platform) => {
    setSelPlatform(p);
    setSelCategory(null);
    setSelServiceType(null);
    setSelService(null);
    setServices([]);
    setSearch("");
    setResult(null);
  }, []);

  const handleCategorySelect = useCallback((c: Category) => {
    setSelCategory(c);
    setSelServiceType(null);
    setSelService(null);
    setServices([]);
    setSearch("");
  }, []);

  const handleServiceTypeSelect = useCallback((st: ServiceType) => {
    setSelServiceType(st);
    setSelService(null);
  }, []);

  const handleServiceSelect = useCallback((s: Service) => {
    setSelService(s);
    setQuantity(String(s.min));
    setResult(null);
  }, []);

  async function onSubmit() {
    if (!selService || !link || !quantity) {
      setResult({ type: "error", message: "الرجاء ملء جميع الحقول" });
      return;
    }
    const q = parseInt(quantity);
    if (q < selService.min || q > selService.max) {
      setResult({ type: "error", message: `الكمية يجب أن تكون بين ${selService.min.toLocaleString()} و ${selService.max.toLocaleString()}` });
      return;
    }
    setSubmitting(true);
    setResult(null);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serviceId: selService.id, link, quantity: q }),
    });
    const data = await res.json() as { message?: string; id?: string };
    if (res.ok) {
      setResult({ type: "success", message: `تم إنشاء الطلب بنجاح! رقم الطلب: #${(data.id ?? "").slice(-8).toUpperCase()}` });
      setLink("");
      setQuantity(String(selService.min));
      // توجيه لصفحة الطلب بعد 1.5 ثانية
      setTimeout(() => {
        router.push(`/dashboard/orders/${data.id}`);
      }, 1500);
    } else {
      setResult({ type: "error", message: data.message ?? "حدث خطأ، حاول مجدداً" });
    }
    setSubmitting(false);
  }

  const platformSlug = selPlatform ? getPlatformSlug(selPlatform.name) : "";
  const platformGradient = PLATFORM_GRADIENTS[platformSlug] ?? "from-violet-600 to-purple-600";
  const platformBg = PLATFORM_BG[platformSlug] ?? "bg-violet-50 border-violet-200";

  // Step indicator
  const currentStep = !selPlatform ? 1 : !selCategory ? 2 : !selServiceType ? 3 : !selService ? 4 : 5;

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">طلب جديد 🚀</h1>
        <p className="text-gray-500 mt-1">اختر منصتك والخدمة المناسبة في خطوات سهلة</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center gap-1 md:gap-2">
          {[
            { n: 1, label: "المنصة" },
            { n: 2, label: "الفئة" },
            { n: 3, label: "النوع" },
            { n: 4, label: "الخدمة" },
            { n: 5, label: "الطلب" },
          ].map((step, i, arr) => (
            <div key={step.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all duration-300 ${
                  currentStep > step.n
                    ? "bg-emerald-500 text-white shadow-md"
                    : currentStep === step.n
                    ? "bg-violet-600 text-white shadow-lg scale-110"
                    : "bg-gray-100 text-gray-400"
                }`}>
                  {currentStep > step.n ? "✓" : step.n}
                </div>
                <span className={`text-xs mt-1 font-semibold hidden md:block transition-colors ${
                  currentStep >= step.n ? "text-gray-700" : "text-gray-400"
                }`}>{step.label}</span>
              </div>
              {i < arr.length - 1 && (
                <div className={`h-1 flex-1 rounded-full mx-1 transition-all duration-500 ${
                  currentStep > step.n ? "bg-emerald-400" : "bg-gray-100"
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Platform Selection */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
            selPlatform ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"
          }`}>
            {selPlatform ? "✓" : "1"}
          </div>
          <h2 className="text-lg font-black text-gray-900">اختر المنصة</h2>
          {selPlatform && (
            <button
              className="text-xs text-violet-500 hover:text-violet-700 font-semibold mr-auto"
              onClick={() => { setSelPlatform(null); setSelCategory(null); setSelServiceType(null); setSelService(null); setServices([]); }}
            >
              تغيير
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-20 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
            {platforms.map((p) => {
              const slug = getPlatformSlug(p.name);
              const grad = PLATFORM_GRADIENTS[slug] ?? "from-violet-600 to-purple-600";
              const isSelected = selPlatform?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => handlePlatformSelect(p)}
                  className={`relative rounded-2xl p-3 text-center transition-all duration-200 border-2 group ${
                    isSelected
                      ? "border-transparent shadow-lg scale-105"
                      : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-md hover:scale-102"
                  }`}
                  style={isSelected ? {} : {}}
                >
                  {isSelected && (
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${grad} opacity-10`} />
                  )}
                  {isSelected && (
                    <div className="absolute top-1.5 left-1.5 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  )}
                  <div className={`mb-1 transition-transform duration-200 flex items-center justify-center ${isSelected ? "scale-110" : "group-hover:scale-110"}`}>
                    {(() => { const I = getPlatformIcon(getPlatformSlug(p.name)); return I ? <I size={36} /> : <span className="text-3xl">{p.icon ?? "📱"}</span>; })()}
                  </div>
                  <div className={`text-xs font-bold truncate ${isSelected ? "text-violet-700" : "text-gray-600"}`}>
                    {p.name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Step 2: Category */}
      {selPlatform && (
        <div className={`mb-6 rounded-2xl border-2 p-5 transition-all duration-300 ${platformBg}`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
              selCategory ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"
            }`}>
              {selCategory ? "✓" : "2"}
            </div>
            <h2 className="text-lg font-black text-gray-900">اختر الفئة</h2>
            <span className="mr-2 flex items-center">{(() => { const I = getPlatformIcon(getPlatformSlug(selPlatform.name)); return I ? <I size={24} /> : <span className="text-xl">{selPlatform.icon}</span>; })()}</span>
          </div>

          {categories.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <div className="text-4xl mb-2">📭</div>
              <p className="font-medium">لا توجد فئات لهذه المنصة بعد</p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {categories.map((c) => {
                const isSelected = selCategory?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleCategorySelect(c)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 border-2 ${
                      isSelected
                        ? `bg-gradient-to-r ${platformGradient} text-white border-transparent shadow-md`
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-300 hover:shadow-sm"
                    }`}
                  >
                    {c.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Service Type */}
      {selCategory && (
        <div className="mb-6 rounded-2xl border-2 border-violet-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
              selServiceType ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"
            }`}>
              {selServiceType ? "✓" : "3"}
            </div>
            <h2 className="text-lg font-black text-gray-900">نوع الخدمة</h2>
          </div>

          {serviceTypes.length === 0 ? (
            <p className="text-gray-400 text-sm">لا توجد أنواع لهذه الفئة</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {serviceTypes.map((st) => {
                const isSelected = selServiceType?.id === st.id;
                const icons: Record<string, string> = {
                  "عادي": "⚡",
                  "عالي الجودة": "💎",
                  "سريع": "🚀",
                  "حقيقي": "✅",
                  "بوت": "🤖",
                };
                const icon = Object.entries(icons).find(([k]) => st.name.includes(k))?.[1] ?? "📦";
                return (
                  <button
                    key={st.id}
                    onClick={() => handleServiceTypeSelect(st)}
                    className={`rounded-2xl p-4 text-center border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 shadow-md"
                        : "border-gray-100 bg-gray-50 hover:border-violet-200 hover:bg-violet-50/50"
                    }`}
                  >
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className={`text-sm font-bold ${isSelected ? "text-violet-700" : "text-gray-700"}`}>{st.name}</div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Service Selection */}
      {selServiceType && (
        <div className="mb-6 rounded-2xl border-2 border-violet-100 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${
              selService ? "bg-emerald-500 text-white" : "bg-violet-600 text-white"
            }`}>
              {selService ? "✓" : "4"}
            </div>
            <h2 className="text-lg font-black text-gray-900">اختر الخدمة</h2>
            {services.length > 0 && (
              <span className="text-xs text-gray-400 font-semibold mr-auto bg-gray-100 px-2 py-1 rounded-lg">
                {filteredServices.length} خدمة
              </span>
            )}
          </div>

          {/* Search */}
          {services.length > 3 && (
            <div className="relative mb-4">
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl py-3 pr-10 pl-4 text-sm focus:outline-none focus:border-violet-300 transition-colors"
                placeholder="ابحث عن خدمة..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          )}

          {/* Services List */}
          {loadingServices ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p className="font-medium">لا توجد خدمات</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pl-1">
              {filteredServices.map((s) => {
                const isSelected = selService?.id === s.id;
                const ratePerK = parseFloat(s.ourRate);
                return (
                  <button
                    key={s.id}
                    onClick={() => handleServiceSelect(s)}
                    className={`w-full text-right rounded-xl p-4 border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-violet-500 bg-violet-50 shadow-md"
                        : "border-gray-100 bg-white hover:border-violet-200 hover:shadow-sm"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-bold leading-snug ${isSelected ? "text-violet-800" : "text-gray-800"}`}>
                          {s.name}
                        </div>
                        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                          <span className="text-xs text-gray-400">أدنى: <span className="font-semibold text-gray-600">{s.min.toLocaleString("ar")}</span></span>
                          <span className="text-xs text-gray-400">أقصى: <span className="font-semibold text-gray-600">{s.max.toLocaleString("ar")}</span></span>
                          {s.refill && (
                            <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-200">♻ رفيل</span>
                          )}
                          {s.cancel && (
                            <span className="text-xs bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded-full border border-blue-200">إلغاء</span>
                          )}
                        </div>
                      </div>
                      <div className="text-left shrink-0">
                        <div className="text-base font-black text-emerald-600" dir="ltr">${ratePerK.toFixed(3)}</div>
                        <div className="text-xs text-gray-400 text-left">لكل 1000</div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="mt-2 flex items-center gap-1 text-violet-600 text-xs font-bold">
                        <span>✅</span>
                        <span>تم الاختيار</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 5: Order Form */}
      {selService && (
        <div className="rounded-2xl border-2 border-violet-200 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-black text-white">5</div>
            <h2 className="text-lg font-black text-gray-900">أكمل الطلب</h2>
          </div>

          {/* Service Summary Banner */}
          <div className={`rounded-2xl p-4 mb-6 border-2 ${platformBg}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="flex items-center">{(() => { const I = selPlatform ? getPlatformIcon(getPlatformSlug(selPlatform.name)) : null; return I ? <I size={24} /> : <span className="text-xl">{selPlatform?.icon}</span>; })()}</span>
              <span className="text-sm font-black text-gray-700">{selCategory?.name} · {selServiceType?.name}</span>
            </div>
            <div className="text-gray-900 font-bold text-sm mb-3 leading-relaxed">{selService.name}</div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white/70 rounded-xl p-3 text-center border border-white">
                <div className="text-xs text-gray-500 font-semibold mb-1">الحد الأدنى</div>
                <div className="text-base font-black text-gray-800">{selService.min.toLocaleString()}</div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center border border-white">
                <div className="text-xs text-gray-500 font-semibold mb-1">الحد الأقصى</div>
                <div className="text-base font-black text-gray-800">{selService.max >= 999999999 ? "غير محدود" : selService.max.toLocaleString()}</div>
              </div>
              <div className="bg-white/70 rounded-xl p-3 text-center border border-white">
                <div className="text-xs text-gray-500 font-semibold mb-1">السعر / 1K</div>
                <div className="text-base font-black text-emerald-600" dir="ltr">${parseFloat(selService.ourRate).toFixed(3)}</div>
              </div>
            </div>
          </div>

          {/* Link Input */}
          <div className="mb-4">
            <label className="block text-sm font-black text-gray-700 mb-2">
              🔗 الرابط
              <span className="text-gray-400 font-normal text-xs mr-2">رابط الحساب أو المنشور</span>
            </label>
            <input
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-violet-400 transition-colors font-mono"
              placeholder="https://..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              dir="ltr"
            />
          </div>

          {/* Quantity Input */}
          <div className="mb-6">
            <label className="block text-sm font-black text-gray-700 mb-2">
              🔢 الكمية
              <span className="text-gray-400 font-normal text-xs mr-2">
                ({selService.min.toLocaleString()} – {selService.max >= 999999999 ? "غير محدود" : selService.max.toLocaleString()})
              </span>
            </label>
            <input
              className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-3.5 px-4 text-sm focus:outline-none focus:border-violet-400 transition-colors"
              type="number"
              min={selService.min}
              max={selService.max}
              placeholder={String(selService.min)}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              dir="ltr"
            />
            {/* Quick quantity buttons */}
            <div className="flex gap-2 mt-2 flex-wrap">
              {[selService.min, selService.min * 5, selService.min * 10, selService.min * 50]
                .filter((v, i, arr) => v <= selService.max && arr.indexOf(v) === i)
                .slice(0, 4)
                .map((v) => (
                <button
                  key={v}
                  onClick={() => setQuantity(String(v))}
                  className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                    quantity === String(v)
                      ? "bg-violet-100 text-violet-700 border-violet-300"
                      : "bg-gray-50 text-gray-500 border-gray-200 hover:border-violet-200 hover:text-violet-600"
                  }`}
                >
                  {v.toLocaleString()}
                </button>
              ))}
            </div>
          </div>

          {/* Price Display */}
          {charge && (
            <div className="mb-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-violet-200 text-sm font-semibold mb-1">إجمالي الطلب</div>
                  <div className="text-white/70 text-xs">
                    {parseInt(quantity).toLocaleString()} × ${parseFloat(selService.ourRate).toFixed(4)} / 1K
                  </div>
                </div>
                <div className="text-left">
                  <div className="text-4xl font-black" dir="ltr">${charge}</div>
                  <div className="text-violet-200 text-xs text-left">دولار أمريكي</div>
                </div>
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`mb-4 rounded-xl px-5 py-4 text-sm font-bold flex items-center gap-2 ${
              result.type === "success"
                ? "bg-emerald-50 border-2 border-emerald-200 text-emerald-700"
                : "bg-red-50 border-2 border-red-200 text-red-700"
            }`}>
              <span>{result.type === "success" ? "✅" : "❌"}</span>
              <span>{result.message}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={onSubmit}
            disabled={submitting || !link || !quantity || !selService}
            className={`w-full py-4 rounded-2xl text-base font-black transition-all duration-200 ${
              submitting || !link || !quantity
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : `bg-gradient-to-r ${platformGradient} text-white shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99]`
            }`}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                جاري إنشاء الطلب...
              </span>
            ) : (
              "🚀 إنشاء الطلب الآن"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="text-center py-20 text-gray-400">جاري التحميل...</div>}>
      <NewOrderContent />
    </Suspense>
  );
}
