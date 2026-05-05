"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Heart, ShoppingCart, Trash2, Star } from "lucide-react";

type Platform = { id: string; name: string; icon: string };
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
  serviceType: { name: string; category: { name: string; platform: Platform } };
  favoritedAt: string;
};

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/services/favorites");
    const data = await res.json() as { favorites: Service[] };
    setFavorites(data.favorites ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function removeFavorite(serviceId: string) {
    setRemoving(serviceId);
    try {
      await fetch("/api/services/favorites", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId }),
      });
      setFavorites((prev) => prev.filter((s) => s.id !== serviceId));
    } finally {
      setRemoving(null);
    }
  }

  if (loading) {
    return (
      <div className="max-w-5xl">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-gray-900">خدماتي المفضلة</h1>
          <p className="text-gray-500 mt-1 text-sm">الخدمات التي أضفتها للمفضلة</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <Heart size={22} className="text-rose-500 fill-rose-500" />
            خدماتي المفضلة
          </h1>
          <p className="text-gray-500 mt-1 text-sm">
            {favorites.length > 0 ? `${favorites.length} خدمة في المفضلة` : "لا توجد خدمات مفضلة بعد"}
          </p>
        </div>
        <Link href="/dashboard/services" className="btn-primary text-sm flex items-center gap-2">
          <Star size={15} />
          تصفح الخدمات
        </Link>
      </div>

      {favorites.length === 0 ? (
        <div className="card py-16 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 flex items-center justify-center">
            <Heart size={28} className="text-rose-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 mb-2">لا توجد مفضلات</h3>
          <p className="text-gray-500 text-sm mb-5">أضف خدمات للمفضلة من صفحة الخدمات للوصول إليها بسرعة</p>
          <Link href="/dashboard/services" className="btn-primary text-sm inline-flex items-center gap-2">
            <ShoppingCart size={15} />
            تصفح الخدمات الآن
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="card hidden md:block mb-4">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>الخدمة</th>
                    <th>المنصة</th>
                    <th>السعر / 1000</th>
                    <th>الحد الأدنى</th>
                    <th>الحد الأقصى</th>
                    <th>المميزات</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {favorites.map((s) => (
                    <tr key={s.id}>
                      <td className="text-violet-600 font-bold text-xs">#{s.id.slice(-4)}</td>
                      <td>
                        <div className="font-medium text-gray-800 max-w-xs line-clamp-1">{s.name}</div>
                        {s.description && (
                          <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{s.description}</div>
                        )}
                      </td>
                      <td>
                        <span className="text-sm text-gray-600">
                          {s.serviceType.category.platform.icon} {s.serviceType.category.platform.name}
                        </span>
                      </td>
                      <td>
                        <span className="text-emerald-600 font-black" dir="ltr">
                          ${parseFloat(s.ourRate).toFixed(3)}
                        </span>
                      </td>
                      <td className="font-medium text-gray-700">{s.min.toLocaleString("ar")}</td>
                      <td className="font-medium text-gray-700">{s.max.toLocaleString("ar")}</td>
                      <td>
                        <div className="flex gap-1">
                          {s.refill && <span className="badge-active text-xs">إعادة</span>}
                          {s.cancel && <span className="badge-info text-xs">إلغاء</span>}
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/new-order?serviceId=${s.id}`}
                            className="btn-primary text-xs px-3 py-1.5"
                          >
                            طلب
                          </Link>
                          <button
                            onClick={() => removeFavorite(s.id)}
                            disabled={removing === s.id}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-40"
                            title="إزالة من المفضلة"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {favorites.map((s) => (
              <div key={s.id} className="card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs text-violet-600 font-bold bg-violet-50 px-2 py-0.5 rounded-full">
                        #{s.id.slice(-4)}
                      </span>
                      {s.refill && <span className="text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-semibold">إعادة</span>}
                    </div>
                    <div className="font-semibold text-gray-800 text-sm leading-snug">{s.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {s.serviceType.category.platform.icon} {s.serviceType.category.platform.name} · {s.serviceType.category.name}
                    </div>
                  </div>
                  <div className="text-left shrink-0">
                    <div className="text-emerald-600 font-black text-sm" dir="ltr">
                      ${parseFloat(s.ourRate).toFixed(3)}
                    </div>
                    <div className="text-gray-400 text-xs text-center">/1000</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-violet-50">
                  <span className="text-xs text-gray-500">
                    {s.min.toLocaleString("ar")} – {s.max.toLocaleString("ar")}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => removeFavorite(s.id)}
                      disabled={removing === s.id}
                      className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-50 transition-colors disabled:opacity-40"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={`/dashboard/new-order?serviceId=${s.id}`}
                      className="text-xs bg-violet-600 text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-violet-700 transition-colors"
                    >
                      طلب الآن
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
