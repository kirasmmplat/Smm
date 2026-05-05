import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white" dir="rtl">
      <PublicNav />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">سياسة الخصوصية</h1>
        <p className="text-gray-500 mb-10">آخر تحديث: يناير 2025</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. البيانات التي نجمعها</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-gray-800">بيانات التسجيل:</strong> الاسم، البريد الإلكتروني، كلمة المرور (مشفرة).</li>
              <li><strong className="text-gray-800">بيانات الاستخدام:</strong> الطلبات، المعاملات المالية، سجل النشاط.</li>
              <li><strong className="text-gray-800">البيانات التقنية:</strong> عنوان IP، نوع المتصفح (للأمان فقط).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. كيف نستخدم بياناتك</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>تقديم وتحسين خدماتنا.</li>
              <li>معالجة الطلبات والمدفوعات.</li>
              <li>التواصل بشأن حسابك أو خدماتك.</li>
              <li>الامتثال للمتطلبات القانونية.</li>
              <li>حماية أمان المنصة والمستخدمين.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. حماية البيانات</h2>
            <p>نحن نتخذ إجراءات أمنية صارمة لحماية بياناتك، بما في ذلك تشفير كلمات المرور، وتشفير الاتصالات (HTTPS)، والوصول المحدود للبيانات الحساسة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. مشاركة البيانات</h2>
            <p className="mb-3">لا نبيع بياناتك الشخصية. قد نشارك معلومات محدودة مع:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>مزودي الخدمات (لتنفيذ طلباتك فقط).</li>
              <li>معالجي الدفع (لإتمام المعاملات المالية).</li>
              <li>الجهات القانونية عند الضرورة القانونية.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. حقوقك</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>الوصول إلى بياناتك الشخصية.</li>
              <li>تصحيح أو تحديث بياناتك.</li>
              <li>طلب حذف حسابك وبياناتك.</li>
              <li>سحب الموافقة على معالجة بياناتك.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. ملفات تعريف الارتباط (Cookies)</h2>
            <p>نستخدم ملفات الارتباط الضرورية لتشغيل جلسة تسجيل الدخول فقط. لا نستخدم ملفات ارتباط تتبعية أو تحليلية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. الاحتفاظ بالبيانات</h2>
            <p>نحتفظ ببياناتك طالما حسابك نشط. عند حذف الحساب، يتم حذف البيانات الشخصية خلال 30 يوماً، مع الاحتفاظ بالسجلات المالية لأغراض قانونية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. التواصل</h2>
            <p>
              لممارسة حقوقك أو للاستفسار عن خصوصيتك، تواصل معنا عبر{" "}
              <Link href="/contact" className="text-violet-600 hover:underline">نموذج التواصل</Link>{" "}
              أو{" "}
              <Link href="/dashboard/tickets" className="text-violet-600 hover:underline">نظام الدعم الفني</Link>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6">
          <Link href="/terms" className="text-violet-600 hover:underline text-sm font-semibold">شروط الاستخدام</Link>
          <Link href="/contact" className="text-violet-600 hover:underline text-sm font-semibold">تواصل معنا</Link>
          <Link href="/" className="text-gray-500 hover:text-gray-800 text-sm">العودة للرئيسية</Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
