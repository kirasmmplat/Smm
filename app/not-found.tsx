import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center px-4" dir="rtl">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black text-violet-200 mb-4">404</div>
        <h1 className="text-2xl font-black text-gray-900 mb-3">الصفحة غير موجودة</h1>
        <p className="text-gray-500 mb-8">الصفحة التي تبحث عنها غير موجودة أو تم نقلها.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-primary px-6">الصفحة الرئيسية</Link>
          <Link href="/dashboard" className="btn-secondary px-6">لوحة التحكم</Link>
        </div>
      </div>
    </div>
  );
}
