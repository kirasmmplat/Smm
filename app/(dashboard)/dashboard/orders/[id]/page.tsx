"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  PENDING: "انتظار", IN_PROGRESS: "جاري التنفيذ", PROCESSING: "يُعالج",
  COMPLETED: "مكتمل", PARTIAL: "مكتمل جزئياً", CANCELED: "ملغي",
  REFUNDED: "مُسترد", FAILED: "فشل",
};
const statusColors: Record<string, string> = {
  PENDING: "badge-pending", IN_PROGRESS: "badge-pending", PROCESSING: "badge-pending",
  COMPLETED: "badge-active", PARTIAL: "badge-warning", CANCELED: "badge-danger",
  REFUNDED: "badge-danger", FAILED: "badge-danger",
};

type Order = {
  id: string;
  status: string;
  link: string;
  quantity: number;
  charge: string;
  startCount: number | null;
  remains: number | null;
  providerOrderId: string | null;
  createdAt: string;
  updatedAt: string;
  service: {
    name: string;
    min: number;
    max: number;
    ourRate: string;
    refill: boolean;
    cancel: boolean;
    serviceType: {
      name: string;
      category: {
        name: string;
        platform: { name: string; icon: string };
      };
    };
  };
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [refillLoading, setRefillLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrder(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("هل أنت متأكد من إلغاء الطلب؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    setCancelLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/cancel`, { method: "POST" });
      const data = await res.json() as { message?: string };
      if (res.ok) {
        setMsg({ type: "success", text: "تم إلغاء الطلب وسيُسترد رصيدك خلال لحظات" });
        setOrder((prev) => prev ? { ...prev, status: "CANCELED" } : prev);
      } else {
        setMsg({ type: "error", text: data.message ?? "تعذّر إلغاء الطلب" });
      }
    } catch {
      setMsg({ type: "error", text: "خطأ في الاتصال" });
    }
    setCancelLoading(false);
  };

  const handleRefill = async () => {
    setRefillLoading(true);
    try {
      const res = await fetch(`/api/orders/${id}/refill`, { method: "POST" });
      const data = await res.json() as { message?: string };
      if (res.ok) {
        setMsg({ type: "success", text: "تم إرسال طلب إعادة التعبئة بنجاح ✅" });
      } else {
        setMsg({ type: "error", text: data.message ?? "تعذّر طلب الإعادة" });
      }
    } catch {
      setMsg({ type: "error", text: "خطأ في الاتصال" });
    }
    setRefillLoading(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 text-gray-500">
      <div className="text-5xl mb-3">❓</div>
      <p className="font-medium">الطلب غير موجود</p>
      <Link href="/dashboard/orders" className="text-violet-600 font-bold hover:underline text-sm mt-2 inline-block">← العودة للطلبات</Link>
    </div>
  );

  const platform = order.service.serviceType.category.platform;
  const isPending = order.status === "PENDING";
  const isActive = ["PENDING", "IN_PROGRESS", "PROCESSING"].includes(order.status);
  const isCompleted = ["COMPLETED", "PARTIAL"].includes(order.status);
  const isCanceled = ["CANCELED", "FAILED", "REFUNDED"].includes(order.status);
  const canCancel = isPending && order.service.cancel; // فقط PENDING وما بدأ التنفيذ
  const canRefill = isCompleted && order.service.refill;

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard/orders" className="text-gray-500 hover:text-violet-600 transition-colors font-medium">
          ← الطلبات
        </Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-black text-gray-900">تفاصيل الطلب</h1>
      </div>

      {/* رسالة النظام */}
      {msg && (
        <div className={`mb-4 rounded-xl p-4 flex items-center gap-3 ${msg.type === "success" ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
          <span>{msg.type === "success" ? "✅" : "❌"}</span>
          <span className="font-medium text-sm">{msg.text}</span>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* المعلومات الرئيسية */}
        <div className="md:col-span-2 space-y-6">
          <div className="card">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{order.service.name}</h2>
                <p className="text-gray-500 text-sm mt-1">
                  {platform.icon} {platform.name} › {order.service.serviceType.category.name} › {order.service.serviceType.name}
                </p>
              </div>
              <span className={`${statusColors[order.status] ?? "badge-inactive"} text-sm font-bold px-3 py-1 rounded-full`}>
                {statusLabels[order.status] ?? order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-violet-50 rounded-xl p-3 border border-violet-100 col-span-2">
                <div className="text-violet-500 text-xs font-semibold mb-1">الرابط المُرشَق</div>
                <div className="text-gray-700 text-sm break-all font-mono" dir="ltr">{order.link}</div>
              </div>
              <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                <div className="text-violet-500 text-xs font-semibold mb-1">الكمية المطلوبة</div>
                <div className="text-gray-900 font-bold text-xl">{order.quantity.toLocaleString("ar")}</div>
              </div>
              <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100">
                <div className="text-emerald-600 text-xs font-semibold mb-1">المبلغ المدفوع</div>
                <div className="text-emerald-700 font-bold text-xl" dir="ltr">
                  ${parseFloat(order.charge).toFixed(4)}
                </div>
              </div>

              {/* عدد البداية - يظهر بعد إرسال الطلب للمزود */}
              {order.startCount != null ? (
                <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                  <div className="text-blue-600 text-xs font-semibold mb-1">العدد عند البدء</div>
                  <div className="text-blue-700 font-bold text-xl">{order.startCount.toLocaleString("ar")}</div>
                </div>
              ) : isActive ? (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="text-gray-400 text-xs font-semibold mb-1">العدد عند البدء</div>
                  <div className="text-gray-400 text-sm animate-pulse">جاري الجلب...</div>
                </div>
              ) : null}

              {/* المتبقي */}
              {order.remains != null ? (
                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <div className="text-amber-600 text-xs font-semibold mb-1">المكتمل / المتبقي</div>
                  <div className="text-amber-700 font-bold text-xl">
                    {(order.quantity - order.remains).toLocaleString("ar")} / {order.remains.toLocaleString("ar")}
                  </div>
                </div>
              ) : isActive ? (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
                  <div className="text-gray-400 text-xs font-semibold mb-1">المكتمل / المتبقي</div>
                  <div className="text-gray-400 text-sm animate-pulse">جاري التنفيذ...</div>
                </div>
              ) : null}

              {order.providerOrderId && (
                <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                  <div className="text-violet-500 text-xs font-semibold mb-1">رقم الطلب عند المزود</div>
                  <div className="text-gray-700 text-sm font-mono" dir="ltr">{order.providerOrderId}</div>
                </div>
              )}
              <div className="bg-violet-50 rounded-xl p-3 border border-violet-100">
                <div className="text-violet-500 text-xs font-semibold mb-1">رقم الطلب</div>
                <div className="text-gray-600 text-xs font-mono" dir="ltr">{order.id.slice(-12).toUpperCase()}</div>
              </div>
            </div>
          </div>

          {/* معلومات الخدمة */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-4">معلومات الخدمة</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between py-2 border-b border-violet-50">
                <span className="text-gray-500">الحد الأدنى</span>
                <span className="font-semibold text-gray-800">{order.service.min.toLocaleString("ar")}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-violet-50">
                <span className="text-gray-500">الحد الأقصى</span>
                <span className="font-semibold text-gray-800">{order.service.max.toLocaleString("ar")}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-violet-50">
                <span className="text-gray-500">السعر / 1000</span>
                <span className="text-emerald-600 font-bold" dir="ltr">${parseFloat(order.service.ourRate).toFixed(3)}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-violet-50">
                <span className="text-gray-500">ضمان الإعادة</span>
                <span className={order.service.refill ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                  {order.service.refill ? "✓ متاح" : "✗ غير متاح"}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">قابل للإلغاء</span>
                <span className={order.service.cancel ? "text-emerald-600 font-semibold" : "text-gray-400"}>
                  {order.service.cancel ? "✓ متاح (قبل التنفيذ)" : "✗ غير متاح"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* الشريط الجانبي */}
        <div className="space-y-4">
          {/* مراحل التنفيذ */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">مراحل التنفيذ</h3>
            <div className="flex flex-col gap-3">
              {(["PENDING","IN_PROGRESS","COMPLETED"] as const).map((s) => {
                const done = isCompleted && s !== "COMPLETED" ? true :
                             order.status === "IN_PROGRESS" && s === "PENDING" ? true : false;
                const active = order.status === s ||
                               (order.status === "PROCESSING" && s === "IN_PROGRESS");
                return (
                  <div key={s} className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full transition-all ${
                      done ? "bg-emerald-500" : active ? "bg-violet-500 ring-4 ring-violet-100" : "bg-gray-200"
                    }`} />
                    <span className={`text-sm ${active ? "text-violet-700 font-bold" : done ? "text-emerald-600 font-medium" : "text-gray-400"}`}>
                      {statusLabels[s]}
                    </span>
                    {active && <span className="text-xs text-violet-400 animate-pulse">← الآن</span>}
                  </div>
                );
              })}
              {isCanceled && (
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="text-sm text-red-600 font-bold">{statusLabels[order.status]}</span>
                </div>
              )}
            </div>
          </div>

          {/* التواريخ */}
          <div className="card">
            <h3 className="font-bold text-gray-900 mb-3">التواريخ</h3>
            <div className="space-y-3 text-sm">
              <div>
                <div className="text-gray-400 text-xs font-semibold mb-1">تاريخ الطلب</div>
                <div className="text-gray-700 font-medium">{new Date(order.createdAt).toLocaleString("ar-SA")}</div>
              </div>
              <div>
                <div className="text-gray-400 text-xs font-semibold mb-1">آخر تحديث</div>
                <div className="text-gray-700 font-medium">{new Date(order.updatedAt).toLocaleString("ar-SA")}</div>
              </div>
            </div>
          </div>

          {/* الأزرار */}
          <div className="space-y-3">
            {/* زر إعادة التعبئة - فقط للمكتمل */}
            {canRefill && (
              <button onClick={handleRefill} disabled={refillLoading}
                className="btn-primary w-full flex items-center justify-center gap-2">
                {refillLoading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : "🔄"}
                إعادة التعبئة
              </button>
            )}

            {/* زر الإلغاء - فقط PENDING وقبل الإرسال للمزود */}
            {canCancel && !isCanceled && (
              <button onClick={handleCancel} disabled={cancelLoading}
                className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 font-semibold rounded-xl py-2.5 transition-colors flex items-center justify-center gap-2">
                {cancelLoading ? <span className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : "✖"}
                إلغاء الطلب
              </button>
            )}

            {/* رسالة توضيح إذا الطلب جاري ولا يمكن إلغاؤه */}
            {isActive && !isPending && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-700 text-xs text-center font-medium">
                ⚠️ الطلب قيد التنفيذ ولا يمكن إلغاؤه
              </div>
            )}

            <a href={`/api/orders/${order.id}/invoice`} target="_blank" rel="noreferrer"
              className="btn-secondary block text-center w-full">
              📄 تنزيل فاتورة PDF
            </a>
            <Link href="/dashboard/tickets/new" className="btn-secondary block text-center w-full">
              🎫 فتح تذكرة دعم
            </Link>
            <Link href="/dashboard/new-order" className="btn-primary block text-center w-full">
              ➕ طلب جديد
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
