import Link from "next/link";

export default function PublicFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="bg-gray-950 text-gray-400 mt-16" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-sm">S</div>
              <span className="font-black text-white text-lg">SMM <span className="text-violet-400">Pro</span></span>
            </div>
            <p className="text-sm leading-relaxed text-gray-500">
              منصة احترافية لخدمات التسويق عبر وسائل التواصل الاجتماعي — متابعين، لايكات، مشاهدات وأكثر.
            </p>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-4">المنصة</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "الرئيسية", href: "/" },
                { label: "الخدمات", href: "/services" },
                { label: "كيفية الاستخدام", href: "/how-to-use" },
                { label: "المدونة", href: "/blog" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-violet-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-4">الحساب</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "تسجيل الدخول", href: "/login" },
                { label: "إنشاء حساب", href: "/register" },
                { label: "لوحة التحكم", href: "/dashboard" },
                { label: "الأسئلة الشائعة", href: "/faq" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-violet-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-4">المساعدة</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { label: "تواصل معنا", href: "/contact" },
                { label: "شروط الاستخدام", href: "/terms" },
                { label: "سياسة الخصوصية", href: "/privacy" },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="hover:text-violet-400 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          <p className="text-gray-600">© {year} SMM Pro — جميع الحقوق محفوظة</p>
          <div className="flex items-center gap-4 text-gray-600">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              جميع الأنظمة تعمل
            </div>
            <Link href="/terms" className="hover:text-violet-400 transition-colors">الشروط</Link>
            <Link href="/privacy" className="hover:text-violet-400 transition-colors">الخصوصية</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
