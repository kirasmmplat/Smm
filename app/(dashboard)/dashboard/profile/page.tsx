"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { User, ShieldCheck, KeyRound, RotateCcw, Save, AlertTriangle, CheckCircle2 } from "lucide-react";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  balance: string;
  totalSpent: string;
  apiKey: string | null;
  createdAt: string;
  accountLevel: { name: string; color: string } | null;
};

export default function ProfilePage() {
  const { update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [genKey, setGenKey] = useState(false);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/user/profile");
    const data = await res.json() as Profile;
    setProfile(data);
    setName(data.name);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function onSave() {
    setSaving(true); setMsg("");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      await update({ name });
      setMsg("تم حفظ التغييرات");
      void load();
    } else setMsg("حدث خطأ، حاول مجدداً");
    setSaving(false);
  }

  async function onGenerateKey() {
    setGenKey(true); setMsg("");
    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ regenerateApiKey: true }),
    });
    if (res.ok) { setMsg("تم توليد مفتاح API جديد"); void load(); }
    else setMsg("حدث خطأ");
    setGenKey(false);
  }

  const roleLabels: Record<string, string> = { ADMIN: "أدمن", USER: "مستخدم" };

  if (!profile) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">حسابي</h1>
        <p className="text-gray-500 mt-1">إدارة معلومات حسابك الشخصي</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="stat-card">
          <div className="text-gray-500 text-xs font-semibold mb-1">الرصيد الحالي</div>
          <div className="text-emerald-600 font-black text-xl" dir="ltr">${parseFloat(profile.balance).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="text-gray-500 text-xs font-semibold mb-1">إجمالي الإنفاق</div>
          <div className="text-violet-600 font-black text-xl" dir="ltr">${parseFloat(profile.totalSpent).toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="text-gray-500 text-xs font-semibold mb-1">نوع الحساب</div>
          <div className="text-violet-600 font-bold">{roleLabels[profile.role] ?? profile.role}</div>
        </div>
        <div className="stat-card">
          <div className="text-gray-500 text-xs font-semibold mb-1">مستوى الحساب</div>
          <div className="font-bold" style={{ color: profile.accountLevel?.color ?? "#7C3AED" }}>
            {profile.accountLevel?.name ?? "جديد"}
          </div>
        </div>
        <div className="stat-card col-span-2">
          <div className="text-gray-500 text-xs font-semibold mb-1">البريد الإلكتروني</div>
          <div className="text-gray-800 font-medium" dir="ltr">{profile.email}</div>
        </div>
      </div>

      {/* Edit Profile */}
      <div className="card space-y-4 mb-5">
        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <User size={16} /> تعديل المعلومات
        </h2>
        <div>
          <label className="input-label">الاسم الكامل</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك الكامل" />
        </div>
        <div>
          <label className="input-label">البريد الإلكتروني</label>
          <input className="input-field opacity-60 cursor-not-allowed" value={profile.email} readOnly dir="ltr" />
        </div>
        {msg && (
          <div className={`rounded-xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${msg.includes("تم") ? "bg-emerald-50 border border-emerald-200 text-emerald-700" : "bg-red-50 border border-red-200 text-red-700"}`}>
            {msg.includes("تم") ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{msg}</span>
          </div>
        )}
        <button onClick={onSave} disabled={saving} className="btn-primary w-full">
          {saving ? "جاري الحفظ..." : <span className="inline-flex items-center gap-2"><Save size={16} /> حفظ التغييرات</span>}
        </button>
      </div>

      {/* API Key */}
      <div className="card space-y-4">
        <h2 className="text-base font-bold text-gray-900 inline-flex items-center gap-2">
          <KeyRound size={16} /> مفتاح API
        </h2>
        <p className="text-gray-500 text-sm">استخدم مفتاح API للوصول البرمجي لحسابك (للموزعين).</p>
        {profile.apiKey ? (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-3">
            <div className="font-mono text-violet-700 text-sm break-all" dir="ltr">{profile.apiKey}</div>
          </div>
        ) : (
          <p className="text-gray-400 text-sm">لا يوجد مفتاح API — أنشئ واحداً الآن</p>
        )}
        <button onClick={onGenerateKey} disabled={genKey} className="btn-secondary w-full">
          {genKey ? "جاري التوليد..." : profile.apiKey
            ? <span className="inline-flex items-center gap-2"><RotateCcw size={16} /> توليد مفتاح جديد</span>
            : <span className="inline-flex items-center gap-2"><KeyRound size={16} /> إنشاء مفتاح API</span>
          }
        </button>
        {profile.apiKey && (
          <p className="text-amber-600 text-xs bg-amber-50 border border-amber-200 rounded-lg p-2">
            <ShieldCheck size={13} className="inline ml-1" />
            تنبيه: توليد مفتاح جديد يلغي المفتاح القديم فوراً
          </p>
        )}
      </div>
    </div>
  );
}
