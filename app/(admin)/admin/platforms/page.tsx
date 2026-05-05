"use client";

import { useEffect, useState, useCallback } from "react";
import { getPlatformIcon, PLATFORM_ICONS } from "@/components/ui/PlatformIcons";
import { Smartphone, ChevronLeft, Plus, Trash2, Tag, Layers, List } from "lucide-react";

type Platform = { id: string; name: string; slug: string; icon?: string; color?: string; status: string; categories: Category[] };
type Category = { id: string; name: string; status: string; serviceTypes: ServiceType[] };
type ServiceType = { id: string; name: string; status: string };

const KNOWN_SLUGS = Object.keys(PLATFORM_ICONS);

function PlatformIconDisplay({ slug, size = 22 }: { slug: string; size?: number }) {
  const IconComponent = getPlatformIcon(slug);
  if (IconComponent) return <IconComponent size={size} />;
  return <Smartphone size={size} className="text-slate-400" />;
}

export default function PlatformsPage() {
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPlatform, setNewPlatform] = useState({ name: "", slug: "" });
  const [newCategory, setNewCategory] = useState<Record<string, { name: string }>>({});
  const [newServiceType, setNewServiceType] = useState<Record<string, { name: string }>>({});

  const loadPlatforms = useCallback(async () => {
    const res = await fetch("/api/platforms");
    const data = await res.json() as Platform[];
    setPlatforms(data);
    setLoading(false);
  }, []);

  useEffect(() => { void loadPlatforms(); }, [loadPlatforms]);

  async function addPlatform() {
    if (!newPlatform.name) return;
    const slug = newPlatform.slug || newPlatform.name.toLowerCase().replace(/\s+/g, "-");
    await fetch("/api/platforms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newPlatform.name, slug, icon: slug }),
    });
    setNewPlatform({ name: "", slug: "" });
    void loadPlatforms();
  }

  async function deletePlatform(id: string) {
    if (!confirm("حذف المنصة وكل تصنيفاتها؟")) return;
    await fetch(`/api/platforms/${id}`, { method: "DELETE" });
    void loadPlatforms();
  }

  async function addCategory(platformId: string) {
    const data = newCategory[platformId];
    if (!data?.name) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platformId, name: data.name }),
    });
    setNewCategory((p) => ({ ...p, [platformId]: { name: "" } }));
    void loadPlatforms();
  }

  async function deleteCategory(id: string) {
    if (!confirm("حذف الفئة وكل أنواعها؟")) return;
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    void loadPlatforms();
  }

  async function addServiceType(categoryId: string) {
    const data = newServiceType[categoryId];
    if (!data?.name) return;
    await fetch("/api/service-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, name: data.name }),
    });
    setNewServiceType((p) => ({ ...p, [categoryId]: { name: "" } }));
    void loadPlatforms();
  }

  async function deleteServiceType(id: string) {
    await fetch(`/api/service-types/${id}`, { method: "DELETE" });
    void loadPlatforms();
  }

  if (loading) return (
    <div className="p-6 flex items-center gap-2 text-slate-400">
      <div className="w-4 h-4 border-2 border-slate-600 border-t-violet-400 rounded-full animate-spin" />
      جاري التحميل...
    </div>
  );

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-white">المنصات والتصنيفات</h1>
        <p className="text-slate-400 mt-1 text-sm">إدارة هرم المنصات ← الفئات ← أنواع الخدمات</p>
      </div>

      {/* ── إضافة منصة جديدة ── */}
      <div className="card mb-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Plus size={16} className="text-violet-400" />
          إضافة منصة جديدة
        </h2>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="text-xs text-slate-400 mb-1 block">اسم المنصة</label>
            <input
              className="input-field"
              placeholder="مثال: Instagram, TikTok..."
              value={newPlatform.name}
              onChange={(e) => {
                const name = e.target.value;
                setNewPlatform((p) => ({
                  name,
                  slug: p.slug || name.toLowerCase().replace(/\s+/g, "-"),
                }));
              }}
            />
          </div>
          <div className="w-44">
            <label className="text-xs text-slate-400 mb-1 block">الـ Slug (للأيقونة)</label>
            <select
              className="input-field"
              value={newPlatform.slug}
              onChange={(e) => setNewPlatform((p) => ({ ...p, slug: e.target.value }))}
            >
              <option value="">— اختر أو اتركه تلقائي —</option>
              {KNOWN_SLUGS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* معاينة الأيقونة */}
          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-2 border border-slate-700 h-10">
            <PlatformIconDisplay
              slug={newPlatform.slug || newPlatform.name.toLowerCase().replace(/\s+/g, "-")}
              size={20}
            />
            <span className="text-xs text-slate-400">معاينة</span>
          </div>

          <button onClick={addPlatform} className="btn-primary px-6 h-10">
            إضافة
          </button>
        </div>

        {/* عرض الأيقونات المتاحة */}
        <div className="mt-4 pt-4 border-t border-slate-700">
          <p className="text-xs text-slate-500 mb-2">الأيقونات المتاحة:</p>
          <div className="flex flex-wrap gap-2">
            {KNOWN_SLUGS.map((slug) => {
              const Icon = getPlatformIcon(slug);
              return (
                <button
                  key={slug}
                  onClick={() => setNewPlatform((p) => ({ ...p, slug }))}
                  title={slug}
                  className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-xs transition-all ${
                    newPlatform.slug === slug
                      ? "border-violet-500 bg-violet-500/10 text-violet-300"
                      : "border-slate-700 hover:border-slate-500 text-slate-400"
                  }`}
                >
                  {Icon && <Icon size={16} />}
                  <span>{slug}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── شجرة المنصات ── */}
      <div className="space-y-4">
        {platforms.map((platform) => (
          <div key={platform.id} className="card">
            {/* رأس المنصة */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-700 flex items-center justify-center shrink-0">
                  <PlatformIconDisplay slug={platform.slug} size={22} />
                </div>
                <div>
                  <div className="text-white font-bold">{platform.name}</div>
                  <div className="text-slate-500 text-xs flex items-center gap-1">
                    <code className="text-violet-400">{platform.slug}</code>
                    <span>·</span>
                    <Layers size={10} />
                    <span>{platform.categories.length} فئة</span>
                    <span>·</span>
                    <List size={10} />
                    <span>{platform.categories.reduce((a, c) => a + c.serviceTypes.length, 0)} نوع خدمة</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => deletePlatform(platform.id)}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-2 rounded-lg transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* إضافة فئة */}
            <div className="flex gap-2 mb-4 mr-3 md:mr-6">
              <input
                className="input-field flex-1 max-w-xs text-sm"
                placeholder="اسم الفئة (Followers, Likes...)"
                value={newCategory[platform.id]?.name ?? ""}
                onChange={(e) => setNewCategory((p) => ({ ...p, [platform.id]: { name: e.target.value } }))}
                onKeyDown={(e) => e.key === "Enter" && addCategory(platform.id)}
              />
              <button onClick={() => addCategory(platform.id)} className="btn-primary text-xs px-4 flex items-center gap-1">
                <Plus size={13} /> فئة
              </button>
            </div>

            {/* الفئات */}
            <div className="space-y-3 mr-3 md:mr-6">
              {platform.categories.map((cat) => (
                <div key={cat.id} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-slate-200 font-medium text-sm">
                      <ChevronLeft size={14} className="text-violet-400 rotate-180" />
                      {cat.name}
                      <span className="text-slate-500 text-xs">({cat.serviceTypes.length})</span>
                    </div>
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {/* إضافة نوع */}
                  <div className="flex gap-2 mb-3 mr-4">
                    <input
                      className="input-field flex-1 max-w-xs text-sm py-1.5"
                      placeholder="نوع الخدمة (Real, Bot, Mixed...)"
                      value={newServiceType[cat.id]?.name ?? ""}
                      onChange={(e) => setNewServiceType((p) => ({ ...p, [cat.id]: { name: e.target.value } }))}
                      onKeyDown={(e) => e.key === "Enter" && addServiceType(cat.id)}
                    />
                    <button onClick={() => addServiceType(cat.id)} className="btn-secondary text-xs px-3 flex items-center gap-1">
                      <Plus size={12} /> نوع
                    </button>
                  </div>

                  {/* أنواع الخدمات */}
                  <div className="flex flex-wrap gap-1.5 mr-4">
                    {cat.serviceTypes.map((st) => (
                      <div key={st.id} className="flex items-center gap-1 bg-slate-700 hover:bg-slate-600 rounded-full px-3 py-1 transition-colors group">
                        <Tag size={10} className="text-slate-400" />
                        <span className="text-slate-300 text-xs">{st.name}</span>
                        <button
                          onClick={() => deleteServiceType(st.id)}
                          className="text-slate-500 hover:text-red-400 transition-colors mr-0.5 opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {cat.serviceTypes.length === 0 && (
                      <span className="text-slate-500 text-xs italic">لا توجد أنواع — أضف نوعاً أولاً</span>
                    )}
                  </div>
                </div>
              ))}
              {platform.categories.length === 0 && (
                <div className="text-slate-500 text-sm text-center py-4 border border-dashed border-slate-700 rounded-xl">
                  لا توجد فئات — أضف فئة للمنصة أولاً
                </div>
              )}
            </div>
          </div>
        ))}

        {platforms.length === 0 && (
          <div className="card text-center text-slate-400 py-16">
            <Layers size={32} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد منصات — ابدأ بإضافة منصة أولاً</p>
          </div>
        )}
      </div>
    </div>
  );
}
