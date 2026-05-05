"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { ListOrdered, Upload, CheckCircle, XCircle, AlertCircle, RefreshCw, Trash2 } from "lucide-react";

type Platform = { id: string; name: string; slug: string; categories: Category[] };
type Category = { id: string; name: string; serviceTypes: ServiceType[] };
type ServiceType = { id: string; name: string };
type Service = { id: string; name: string; ourRate: string; min: number; max: number };

interface OrderRow {
  id: string; serviceId: string; link: string; quantity: string;
  serviceName?: string; status: "idle" | "processing" | "success" | "error";
  error?: string; orderId?: string;
}

export default function MassOrderPage() {
  const { data: session } = useSession();
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selPlatform, setSelPlatform] = useState("");
  const [selCategory, setSelCategory] = useState("");
  const [selServiceType, setSelServiceType] = useState("");
  const [rows, setRows] = useState<OrderRow[]>([]);
  const [bulkText, setBulkText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const [serviceSearch, setServiceSearch] = useState("");

  const userBalance = parseFloat((session?.user as { balance?: string })?.balance ?? "0");

  useEffect(() => {
    void fetch("/api/taxonomy").then((r) => r.json() as Promise<Platform[]>).then(setPlatforms);
  }, []);

  useEffect(() => {
    if (!selServiceType) { setServices([]); return; }
    void fetch(`/api/services?serviceTypeId=${selServiceType}&limit=500`)
      .then((r) => r.json() as Promise<{ services: Service[] }>)
      .then((d) => setServices(d.services ?? []));
  }, [selServiceType]);

  const selectedPlatform = platforms.find((p) => p.id === selPlatform);
  const categories = selectedPlatform?.categories ?? [];
  const serviceTypes = categories.find((c) => c.id === selCategory)?.serviceTypes ?? [];
  const filteredServices = services.filter((s) =>
    !serviceSearch || s.name.toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const addRow = (service?: Service) => {
    setRows((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        serviceId: service?.id ?? "",
        link: "",
        quantity: service ? String(service.min) : "",
        serviceName: service?.name,
        status: "idle",
      },
    ]);
  };

  const parseBulkText = () => {
    const lines = bulkText.trim().split("\n").filter(Boolean);
    const newRows: OrderRow[] = lines.map((line) => {
      const parts = line.split(",").map((p) => p.trim());
      const serviceId = parts[0] ?? "";
      const link = parts[1] ?? "";
      const quantity = parts[2] ?? "";
      const foundService = services.find((s) => s.id === serviceId);
      return {
        id: crypto.randomUUID(),
        serviceId,
        link,
        quantity,
        serviceName: foundService?.name ?? serviceId.slice(0, 20),
        status: "idle" as const,
      };
    });
    setRows((prev) => [...prev, ...newRows]);
    setBulkText("");
  };

  const updateRow = (id: string, field: keyof OrderRow, value: string) => {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };

  const removeRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const processOrders = async () => {
    const validRows = rows.filter((r) => r.serviceId && r.link && r.quantity);
    if (validRows.length === 0) return;
    setProcessing(true);
    setSubmitted(0);
    let done = 0;

    for (const row of validRows) {
      setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "processing" } : r));
      try {
        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceId: row.serviceId, link: row.link, quantity: parseInt(row.quantity) }),
        });
        const d = await res.json() as { id?: string; message?: string };
        if (res.ok) {
          setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "success", orderId: d.id } : r));
          done++;
        } else {
          setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "error", error: d.message ?? "خطأ" } : r));
        }
      } catch {
        setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, status: "error", error: "فشل الاتصال" } : r));
      }
      setSubmitted(done);
      await new Promise((res) => setTimeout(res, 300));
    }
    setProcessing(false);
  };

  const successCount = rows.filter((r) => r.status === "success").length;
  const errorCount = rows.filter((r) => r.status === "error").length;
  const pendingCount = rows.filter((r) => r.status === "idle").length;

  const totalCharge = rows.reduce((sum, row) => {
    const svc = services.find((s) => s.id === row.serviceId);
    if (!svc || !row.quantity) return sum;
    return sum + (parseFloat(svc.ourRate) * parseInt(row.quantity || "0")) / 1000;
  }, 0);

  return (
    <div>
      <div className="mb-6 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-3xl p-5 sm:p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-violet-100 text-sm font-medium">إنشاء طلبات متعددة</p>
            <h1 className="text-2xl sm:text-3xl font-black mt-1 flex items-center gap-2">
              <ListOrdered size={26} /> الطلبات الجماعية
            </h1>
            <p className="text-violet-100 mt-1 text-sm">أرسل عشرات الطلبات دفعة واحدة بكفاءة عالية</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-white/10 rounded-2xl px-3 py-2">
              <div className="text-violet-100 text-xs">الرصيد</div>
              <div className="text-white font-black text-sm" dir="ltr">${userBalance.toFixed(2)}</div>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-2">
              <div className="text-violet-100 text-xs">الطلبات</div>
              <div className="text-white font-black text-sm">{rows.length}</div>
            </div>
            <div className="bg-white/10 rounded-2xl px-3 py-2">
              <div className="text-violet-100 text-xs">الإجمالي</div>
              <div className={`font-black text-sm ${totalCharge > userBalance ? "text-red-200" : "text-emerald-200"}`} dir="ltr">
                ${totalCharge.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Service selector */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-4">اختر الخدمة</h2>
            <select className="input-field mb-3" value={selPlatform} onChange={(e) => { setSelPlatform(e.target.value); setSelCategory(""); setSelServiceType(""); }}>
              <option value="">اختر المنصة</option>
              {platforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            {selPlatform && (
              <select className="input-field mb-3" value={selCategory} onChange={(e) => { setSelCategory(e.target.value); setSelServiceType(""); }}>
                <option value="">اختر الفئة</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            )}
            {selCategory && (
              <select className="input-field mb-3" value={selServiceType} onChange={(e) => setSelServiceType(e.target.value)}>
                <option value="">اختر نوع الخدمة</option>
                {serviceTypes.map((st) => <option key={st.id} value={st.id}>{st.name}</option>)}
              </select>
            )}
            {selServiceType && (
              <>
                <input className="input-field mb-2" placeholder="بحث عن خدمة..." value={serviceSearch} onChange={(e) => setServiceSearch(e.target.value)} />
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {filteredServices.map((s) => (
                    <button key={s.id} onClick={() => addRow(s)} className="w-full text-right bg-violet-50 hover:bg-violet-100 border border-violet-200 rounded-xl px-3 py-2 transition-colors">
                      <div className="text-xs font-semibold text-gray-800 line-clamp-1">{s.name}</div>
                      <div className="text-xs text-violet-600 font-bold" dir="ltr">${parseFloat(s.ourRate).toFixed(3)}/1K</div>
                    </button>
                  ))}
                </div>
                <button onClick={() => addRow()} className="btn-secondary w-full mt-3 text-sm">
                  + إضافة صف فارغ
                </button>
              </>
            )}
          </div>

          <div className="card">
            <h2 className="text-base font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Upload size={16} /> استيراد دفعي (CSV)
            </h2>
            <p className="text-xs text-gray-500 mb-2">صيغة كل سطر: <code className="bg-gray-100 px-1 rounded" dir="ltr">serviceId,link,quantity</code></p>
            <textarea className="input-field h-24 text-xs font-mono resize-none" dir="ltr" placeholder="cld1abc...,https://instagram.com/user,1000&#10;cld2def...,https://twitter.com/user,500"
              value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            <button onClick={parseBulkText} disabled={!bulkText.trim()} className="btn-primary w-full mt-3 text-sm disabled:opacity-50">
              تحليل وإضافة
            </button>
          </div>
        </div>

        {/* Right: Orders table */}
        <div className="lg:col-span-2">
          {rows.length === 0 ? (
            <div className="card text-center py-16">
              <ListOrdered size={40} className="text-violet-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">اختر خدمة من القائمة لإضافة طلب</p>
              <p className="text-gray-400 text-sm mt-1">يمكنك إضافة عشرات الطلبات دفعة واحدة</p>
            </div>
          ) : (
            <div className="card p-0 overflow-hidden">
              {/* Summary bar */}
              {(successCount > 0 || errorCount > 0) && (
                <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm">
                  <span className="flex items-center gap-1 text-emerald-600 font-semibold"><CheckCircle size={14} /> {successCount} نجح</span>
                  {errorCount > 0 && <span className="flex items-center gap-1 text-red-600 font-semibold"><XCircle size={14} /> {errorCount} فشل</span>}
                  {pendingCount > 0 && <span className="flex items-center gap-1 text-amber-600 font-semibold"><AlertCircle size={14} /> {pendingCount} منتظر</span>}
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">الخدمة</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">الرابط</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">الكمية</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">التكلفة</th>
                      <th className="text-right px-3 py-2 text-xs text-gray-500 font-semibold">الحالة</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {rows.map((row) => {
                      const svc = services.find((s) => s.id === row.serviceId);
                      const charge = svc && row.quantity ? (parseFloat(svc.ourRate) * parseInt(row.quantity || "0")) / 1000 : 0;
                      return (
                        <tr key={row.id} className={`${row.status === "success" ? "bg-emerald-50/30" : row.status === "error" ? "bg-red-50/30" : ""}`}>
                          <td className="px-3 py-2 max-w-[160px]">
                            {row.serviceId ? (
                              <div className="text-xs text-gray-700 line-clamp-2 font-medium">{row.serviceName ?? row.serviceId.slice(0, 16)}</div>
                            ) : (
                              <select className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-full"
                                value={row.serviceId} onChange={(e) => {
                                  const s = services.find((sv) => sv.id === e.target.value);
                                  updateRow(row.id, "serviceId", e.target.value);
                                  if (s) setRows((prev) => prev.map((r) => r.id === row.id ? { ...r, serviceId: s.id, serviceName: s.name, quantity: String(s.min) } : r));
                                }}>
                                <option value="">اختر...</option>
                                {services.map((s) => <option key={s.id} value={s.id}>{s.name.slice(0, 40)}</option>)}
                              </select>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-36" dir="ltr"
                              placeholder="https://..." value={row.link} onChange={(e) => updateRow(row.id, "link", e.target.value)} disabled={row.status !== "idle"} />
                          </td>
                          <td className="px-3 py-2">
                            <input type="number" className="text-xs border border-gray-200 rounded-lg px-2 py-1 w-20" dir="ltr"
                              placeholder="1000" value={row.quantity} onChange={(e) => updateRow(row.id, "quantity", e.target.value)} disabled={row.status !== "idle"}
                              min={svc?.min} max={svc?.max} />
                            {svc && <div className="text-xs text-gray-400 mt-0.5">{svc.min}–{svc.max}</div>}
                          </td>
                          <td className="px-3 py-2 text-xs text-emerald-600 font-semibold" dir="ltr">
                            {charge > 0 ? `$${charge.toFixed(4)}` : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {row.status === "idle" && <span className="text-xs text-gray-400">—</span>}
                            {row.status === "processing" && <RefreshCw size={13} className="animate-spin text-violet-500" />}
                            {row.status === "success" && (
                              <div>
                                <CheckCircle size={14} className="text-emerald-500" />
                                {row.orderId && <div className="text-xs text-gray-400 font-mono mt-0.5">{row.orderId.slice(-8)}</div>}
                              </div>
                            )}
                            {row.status === "error" && (
                              <div title={row.error}>
                                <XCircle size={14} className="text-red-500" />
                                <div className="text-xs text-red-500 mt-0.5 max-w-[100px] truncate">{row.error}</div>
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            {row.status === "idle" && (
                              <button onClick={() => removeRow(row.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                <Trash2 size={13} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-4 flex-wrap">
                <div className="text-sm text-gray-600">
                  <span className="font-bold">{rows.length}</span> طلب
                  {totalCharge > 0 && <span> — إجمالي: <strong className="text-violet-700" dir="ltr">${totalCharge.toFixed(4)}</strong></span>}
                  {totalCharge > userBalance && <span className="text-red-500 font-semibold mr-2">رصيدك غير كافٍ</span>}
                </div>
                <div className="flex gap-2">
                  {!processing && successCount === 0 && (
                    <button onClick={() => setRows([])} className="btn-secondary text-sm px-4 py-2 flex items-center gap-1">
                      <Trash2 size={13} /> مسح الكل
                    </button>
                  )}
                  <button onClick={() => void processOrders()} disabled={processing || rows.filter((r) => r.status === "idle").length === 0}
                    className="btn-primary text-sm px-6 py-2 flex items-center gap-2 disabled:opacity-50">
                    {processing ? <><RefreshCw size={14} className="animate-spin" /> جاري الإرسال ({submitted}/{rows.filter((r) => r.status !== "idle").length + submitted})...</>
                      : `إرسال ${rows.filter((r) => r.status === "idle").length} طلب`}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
