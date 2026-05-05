import Link from "next/link";

export default function PublicNav() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-50" dir="rtl">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-sm shadow-md">S</div>
          <span className="font-black text-gray-900">SMM <span className="text-violet-600">Pro</span></span>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-600">
            <Link href="/services" className="hover:text-violet-600 transition-colors">الخدمات</Link>
            <Link href="/faq" className="hover:text-violet-600 transition-colors">الأسئلة الشائعة</Link>
            <Link href="/how-to-use" className="hover:text-violet-600 transition-colors">كيفية الاستخدام</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="btn-secondary text-sm px-4 py-2">دخول</Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">تسجيل</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
