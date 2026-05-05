"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";

type Profile = {
  id: string; name: string; email: string; username: string; role: string;
  balance: string; apiKey: string | null; referralCode: string; createdAt: string;
  language: string; timezone: string; discountPercent: number;
  telegramChatId: string | null; telegramNotifications: boolean; emailNotifications: boolean;
  twoFactorEnabled: boolean;
  accountLevel: { name: string; color: string } | null;
};

type TwoFASetup = { secret: string; qrDataUrl: string };

const TIMEZONES = ["UTC","UTC+1","UTC+2","UTC+3","UTC+4","UTC+5","UTC+6","UTC+7","UTC+8","UTC+9","UTC+10","UTC+11","UTC+12","UTC-1","UTC-2","UTC-3","UTC-4","UTC-5","UTC-6","UTC-7","UTC-8","UTC-9","UTC-10","UTC-11","UTC-12"];

export default function AccountPage() {
  const { update } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tab, setTab] = useState<"general" | "security" | "notifications" | "apikey">("general");
  const [msg, setMsg] = useState({ text: "", ok: true });
  const [saving, setSaving] = useState(false);

  const [genForm, setGenForm] = useState({ name: "", language: "ar", timezone: "UTC+3" });
  const [secForm, setSecForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [notifForm, setNotifForm] = useState({ emailNotifications: true, telegramNotifications: false, telegramChatId: "" });

  // 2FA state
  const [tfaSetup, setTfaSetup] = useState<TwoFASetup | null>(null);
  const [tfaCode, setTfaCode] = useState("");
  const [tfaDisablePass, setTfaDisablePass] = useState("");
  const [tfaLoading, setTfaLoading] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/user/profile");
    if (!res.ok) return;
    const data = await res.json() as Profile;
    setProfile(data);
    setGenForm({ name: data.name, language: data.language, timezone: data.timezone });
    setNotifForm({ emailNotifications: data.emailNotifications, telegramNotifications: data.telegramNotifications, telegramChatId: data.telegramChatId ?? "" });
  }, []);

  useEffect(() => { void load(); }, [load]);

  const showMsg = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg({ text: "", ok: true }), 5000); };

  const saveGeneral = async () => {
    if (!genForm.name.trim() || genForm.name.trim().length < 2) { showMsg("الاسم قصير جداً", false); return; }
    setSaving(true);
    const res = await fetch("/api/user/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(genForm) });
    if (res.ok) { await update({ name: genForm.name.trim() }); showMsg("تم حفظ المعلومات"); void load(); }
    else { const d = await res.json(); showMsg(d.message ?? "حدث خطأ", false); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (!secForm.currentPassword) { showMsg("أدخل كلمة المرور الحالية", false); return; }
    if (secForm.newPassword.length < 8) { showMsg("كلمة المرور الجديدة 8 أحرف على الأقل", false); return; }
    if (secForm.newPassword !== secForm.confirmPassword) { showMsg("كلمتا المرور غير متطابقتين", false); return; }
    setSaving(true);
    const res = await fetch("/api/user/password", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: secForm.currentPassword, newPassword: secForm.newPassword }) });
    if (res.ok) { showMsg("تم تغيير كلمة المرور"); setSecForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
    else { const d = await res.json(); showMsg(d.message ?? "حدث خطأ", false); }
    setSaving(false);
  };

  const saveNotifications = async () => {
    setSaving(true);
    const res = await fetch("/api/user/notifications", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ emailNotifications: notifForm.emailNotifications, telegramNotifications: notifForm.telegramNotifications }) });
    if (res.ok) { showMsg("تم حفظ إعدادات الإشعارات"); void load(); }
    else { const d = await res.json(); showMsg(d.message ?? "حدث خطأ", false); }
    setSaving(false);
  };

  const connectTelegram = async () => {
    if (!notifForm.telegramChatId.trim()) { showMsg("أدخل معرف تيليجرام", false); return; }
    setSaving(true);
    const res = await fetch("/api/user/telegram", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telegramChatId: notifForm.telegramChatId.trim() }) });
    if (res.ok) { showMsg("تم ربط حساب تيليجرام"); void load(); }
    else { const d = await res.json(); showMsg(d.message ?? "حدث خطأ", false); }
    setSaving(false);
  };

  const generateKey = async () => {
    setSaving(true);
    const res = await fetch("/api/profile", { method: "PATCH" });
    if (res.ok) { showMsg("تم توليد مفتاح API جديد"); void load(); }
    else showMsg("حدث خطأ", false);
    setSaving(false);
  };

  // 2FA functions
  const setup2FA = async () => {
    setTfaLoading(true);
    const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
    if (res.ok) { const d = await res.json() as TwoFASetup; setTfaSetup(d); setTfaCode(""); }
    else { const d = await res.json(); showMsg(d.message ?? "حدث خطأ", false); }
    setTfaLoading(false);
  };

  const enable2FA = async () => {
    if (tfaCode.length !== 6) { showMsg("أدخل الكود المكوّن من 6 أرقام", false); return; }
    setTfaLoading(true);
    const res = await fetch("/api/auth/2fa/enable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: tfaCode }) });
    const d = await res.json();
    if (res.ok) { showMsg(d.message); setTfaSetup(null); setTfaCode(""); void load(); }
    else showMsg(d.message ?? "حدث خطأ", false);
    setTfaLoading(false);
  };

  const disable2FA = async () => {
    if (!tfaDisablePass) { showMsg("أدخل كلمة المرور لتعطيل 2FA", false); return; }
    setTfaLoading(true);
    const res = await fetch("/api/auth/2fa/disable", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: tfaDisablePass }) });
    const d = await res.json();
    if (res.ok) { showMsg(d.message); setTfaDisablePass(""); void load(); }
    else showMsg(d.message ?? "حدث خطأ", false);
    setTfaLoading(false);
  };

  if (!profile) return (
    <div className="space-y-4 max-w-2xl">
      {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-violet-50 rounded-2xl animate-pulse" />)}
    </div>
  );

  const tabs = [
    { key: "general", label: "المعلومات" },
    { key: "security", label: "الأمان" },
    { key: "notifications", label: "الإشعارات" },
    { key: "apikey", label: "API" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">إعدادات الحساب</h1>
        <p className="text-gray-500 mt-1 text-sm">إدارة معلوماتك الشخصية وإعدادات الأمان</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: "الرصيد", value: `$${parseFloat(profile.balance).toFixed(2)}`, color: "text-emerald-600" },
          { label: "المستوى", value: profile.accountLevel?.name ?? "جديد", color: "text-violet-600" },
          { label: "الخصم", value: `${profile.discountPercent}%`, color: "text-blue-600" },
          { label: "كود الإحالة", value: profile.referralCode, color: "text-orange-600" },
        ].map((s) => (
          <div key={s.label} className="stat-card text-center">
            <div className="text-gray-400 text-xs mb-1">{s.label}</div>
            <div className={`font-black text-sm ${s.color}`} dir="ltr">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 gap-1 bg-gray-100 rounded-2xl p-1 mb-5">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => { setTab(t.key as typeof tab); setMsg({ text: "", ok: true }); }}
            className={`flex items-center justify-center gap-1.5 text-xs sm:text-sm font-semibold px-2 py-2 rounded-xl transition truncate ${tab === t.key ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
            <span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Message */}
      {msg.text && (
        <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium border ${msg.ok ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {msg.text}
        </div>
      )}

      {/* General Tab */}
      {tab === "general" && (
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900">المعلومات الشخصية</h2>
          <div>
            <label className="input-label">الاسم الكامل</label>
            <input className="input-field" value={genForm.name} onChange={(e) => setGenForm({ ...genForm, name: e.target.value })} />
          </div>
          <div>
            <label className="input-label">البريد الإلكتروني</label>
            <input className="input-field opacity-60 cursor-not-allowed" value={profile.email} readOnly dir="ltr" />
          </div>
          <div>
            <label className="input-label">اسم المستخدم</label>
            <input className="input-field opacity-60 cursor-not-allowed" value={`@${profile.username}`} readOnly dir="ltr" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">اللغة</label>
              <select className="input-field" value={genForm.language} onChange={(e) => setGenForm({ ...genForm, language: e.target.value })}>
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="input-label">المنطقة الزمنية</label>
              <select className="input-field" value={genForm.timezone} onChange={(e) => setGenForm({ ...genForm, timezone: e.target.value })} dir="ltr">
                {TIMEZONES.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
              </select>
            </div>
          </div>
          <button onClick={saveGeneral} disabled={saving} className="btn-primary w-full">{saving ? "جاري الحفظ..." : "حفظ التغييرات"}</button>
        </div>
      )}

      {/* Security Tab */}
      {tab === "security" && (
        <div className="space-y-4">
          {/* Password */}
          <div className="card space-y-4">
            <h2 className="font-bold text-gray-900">تغيير كلمة المرور</h2>
            <div>
              <label className="input-label">كلمة المرور الحالية</label>
              <input type="password" className="input-field" value={secForm.currentPassword} onChange={(e) => setSecForm({ ...secForm, currentPassword: e.target.value })} placeholder="••••••••" />
            </div>
            <div>
              <label className="input-label">كلمة المرور الجديدة</label>
              <input type="password" className="input-field" value={secForm.newPassword} onChange={(e) => setSecForm({ ...secForm, newPassword: e.target.value })} placeholder="8 أحرف على الأقل" />
            </div>
            <div>
              <label className="input-label">تأكيد كلمة المرور الجديدة</label>
              <input type="password" className="input-field" value={secForm.confirmPassword} onChange={(e) => setSecForm({ ...secForm, confirmPassword: e.target.value })} placeholder="أعد الكتابة" />
            </div>
            {secForm.newPassword && secForm.confirmPassword && secForm.newPassword !== secForm.confirmPassword && (
              <p className="text-red-500 text-sm">كلمتا المرور غير متطابقتين</p>
            )}
            <button onClick={changePassword} disabled={saving} className="btn-primary w-full">{saving ? "جاري التغيير..." : "تغيير كلمة المرور"}</button>
          </div>

          {/* 2FA */}
          <div className="card space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">التحقق بخطوتين (2FA)</h2>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${profile.twoFactorEnabled ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                {profile.twoFactorEnabled ? "مفعّل" : "معطّل"}
              </span>
            </div>

            {!profile.twoFactorEnabled && !tfaSetup && (
              <>
                <p className="text-gray-500 text-sm">
                  حماية إضافية لحسابك — عند تسجيل الدخول ستحتاج لرمز من تطبيق Google Authenticator.
                </p>
                <button onClick={setup2FA} disabled={tfaLoading} className="btn-primary w-full">
                  {tfaLoading ? "جاري الإعداد..." : "تفعيل التحقق بخطوتين"}
                </button>
              </>
            )}

            {!profile.twoFactorEnabled && tfaSetup && (
              <div className="space-y-4">
                <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 text-sm text-violet-700">
                  <p className="font-bold mb-1">الخطوات:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>افتح تطبيق <strong>Google Authenticator</strong></li>
                    <li>اضغط &quot;+&quot; ثم &quot;Scan a QR code&quot;</li>
                    <li>امسح رمز QR أدناه</li>
                    <li>أدخل الرمز المكوّن من 6 أرقام</li>
                  </ol>
                </div>
                <div className="flex justify-center">
                  <div className="bg-white border-2 border-violet-200 rounded-2xl p-3 inline-block">
                    <img src={tfaSetup.qrDataUrl} alt="QR Code" width={200} height={200} className="block" />
                  </div>
                </div>
                <div>
                  <label className="input-label">أو أدخل المفتاح يدوياً</label>
                  <div className="bg-gray-100 rounded-xl px-3 py-2 font-mono text-sm text-gray-700 break-all select-all" dir="ltr">{tfaSetup.secret}</div>
                </div>
                <div>
                  <label className="input-label">رمز التحقق (6 أرقام)</label>
                  <input
                    type="text"
                    className="input-field text-center text-2xl font-mono tracking-widest"
                    placeholder="000000"
                    value={tfaCode}
                    onChange={(e) => setTfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    dir="ltr"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={enable2FA} disabled={tfaLoading || tfaCode.length !== 6} className="btn-primary flex-1">
                    {tfaLoading ? "جاري التحقق..." : "تأكيد التفعيل"}
                  </button>
                  <button onClick={() => { setTfaSetup(null); setTfaCode(""); }} className="btn-secondary px-4">إلغاء</button>
                </div>
              </div>
            )}

            {profile.twoFactorEnabled && (
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  <div>
                    <div className="font-semibold text-emerald-700 text-sm">التحقق بخطوتين مفعّل</div>
                    <div className="text-emerald-600 text-xs">حسابك محمي بطبقة أمان إضافية</div>
                  </div>
                </div>
                <details className="group">
                  <summary className="text-red-600 text-sm cursor-pointer hover:underline select-none">تعطيل التحقق بخطوتين...</summary>
                  <div className="mt-3 space-y-3 pt-3 border-t border-gray-100">
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      تعطيل التحقق بخطوتين يجعل حسابك أقل أماناً
                    </div>
                    <div>
                      <label className="input-label">كلمة مرورك الحالية للتأكيد</label>
                      <input type="password" className="input-field" placeholder="••••••••" value={tfaDisablePass} onChange={(e) => setTfaDisablePass(e.target.value)} />
                    </div>
                    <button onClick={disable2FA} disabled={tfaLoading || !tfaDisablePass} className="btn-danger w-full">
                      {tfaLoading ? "جاري التعطيل..." : "تعطيل التحقق بخطوتين"}
                    </button>
                  </div>
                </details>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {tab === "notifications" && (
        <div className="space-y-4">
          <div className="card space-y-4">
            <h2 className="font-bold text-gray-900">إعدادات الإشعارات</h2>
            {[
              { key: "emailNotifications", label: "إشعارات البريد الإلكتروني", desc: "اكتمال الطلبات، تأكيد الإيداع، ردود التذاكر" },
              { key: "telegramNotifications", label: "إشعارات تيليجرام", desc: "استقبال الإشعارات على تيليجرام فورياً" },
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer py-2">
                <div>
                  <div className="font-semibold text-gray-800 text-sm">{item.label}</div>
                  <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
                </div>
                <div
                  onClick={() => setNotifForm({ ...notifForm, [item.key]: !notifForm[item.key as keyof typeof notifForm] })}
                  className={`w-12 h-6 rounded-full transition-colors cursor-pointer relative ${notifForm[item.key as keyof typeof notifForm] ? "bg-violet-600" : "bg-gray-300"}`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow absolute top-0.5 transition-all" style={{ [notifForm[item.key as keyof typeof notifForm] ? "right" : "left"]: "2px" }} />
                </div>
              </label>
            ))}
            <button onClick={saveNotifications} disabled={saving} className="btn-primary w-full">{saving ? "جاري الحفظ..." : "حفظ الإعدادات"}</button>
          </div>

          <div className="card space-y-3">
            <h2 className="font-bold text-gray-900">ربط حساب تيليجرام</h2>
            {profile.telegramChatId && (
              <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-emerald-500 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div>
                  <div className="font-semibold text-emerald-700 text-sm">تيليجرام مرتبط</div>
                  <div className="text-emerald-600 text-xs" dir="ltr">Chat ID: {profile.telegramChatId}</div>
                </div>
              </div>
            )}
            {!profile.telegramChatId && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700 space-y-2">
                <p className="font-bold">كيفية ربط تيليجرام:</p>
                <ol className="list-decimal list-inside space-y-1 text-xs">
                  <li>افتح تيليجرام وابحث عن <strong>@smmxrkhbot</strong></li>
                  <li>أرسل <code className="bg-blue-100 px-1 rounded">/start</code></li>
                  <li>البوت سيرسل لك الـ Chat ID — انسخه</li>
                  <li>الصقه في الخانة أدناه واضغط "ربط"</li>
                </ol>
                <a href="https://t.me/smmxrkhbot" target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-blue-700 transition mt-1">
                  فتح البوت @smmxrkhbot
                </a>
              </div>
            )}
            <div>
              <label className="input-label">Chat ID</label>
              <input className="input-field" value={notifForm.telegramChatId} onChange={(e) => setNotifForm({ ...notifForm, telegramChatId: e.target.value })} placeholder="123456789" dir="ltr" />
            </div>
            <button onClick={connectTelegram} disabled={saving || !notifForm.telegramChatId.trim()} className="btn-secondary w-full">
              {saving ? "جاري الربط..." : profile.telegramChatId ? "تحديث Chat ID" : "ربط تيليجرام"}
            </button>
          </div>
        </div>
      )}

      {/* API Key Tab */}
      {tab === "apikey" && (
        <div className="card space-y-4">
          <h2 className="font-bold text-gray-900">مفتاح API</h2>
          <p className="text-gray-500 text-sm">استخدم مفتاح API للوصول البرمجي لحسابك وإنشاء الطلبات تلقائياً.</p>
          {profile.apiKey ? (
            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
              <div className="text-xs text-gray-500 mb-1">المفتاح الحالي</div>
              <div className="font-mono text-violet-700 text-sm break-all select-all" dir="ltr">{profile.apiKey}</div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-gray-400 text-sm">لا يوجد مفتاح API — أنشئ واحداً الآن</div>
          )}
          <button onClick={generateKey} disabled={saving} className="btn-primary w-full">
            {saving ? "جاري التوليد..." : profile.apiKey ? "توليد مفتاح جديد" : "إنشاء مفتاح API"}
          </button>
          {profile.apiKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-sm text-amber-700">
              توليد مفتاح جديد يلغي المفتاح القديم فوراً
            </div>
          )}
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs text-gray-500 mb-2">مثال الاستخدام:</p>
            <div className="bg-gray-900 rounded-xl p-3 font-mono text-xs text-green-400 overflow-x-auto" dir="ltr">
              POST /api/v2<br/>
              {`{ "key": "${profile.apiKey ?? "YOUR_API_KEY"}", "action": "balance" }`}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
