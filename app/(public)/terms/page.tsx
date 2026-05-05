import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white" dir="rtl">
      <PublicNav />

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-black text-gray-900 mb-2">شروط الاستخدام</h1>
        <p className="text-gray-500 mb-10">آخر تحديث: يناير 2025</p>

        <div className="space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">1. القبول بالشروط</h2>
            <p>باستخدامك لمنصة SMM Pro، فإنك توافق على الالتزام بهذه الشروط والأحكام. إذا لم توافق على أي جزء منها، يُرجى عدم استخدام المنصة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">2. وصف الخدمة</h2>
            <p>توفر SMM Pro خدمات التسويق عبر وسائل التواصل الاجتماعي، بما في ذلك زيادة المتابعين، اللايكات، المشاهدات، والتفاعل على مختلف المنصات الاجتماعية.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">3. حساب المستخدم</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>يجب أن تكون المعلومات المقدمة عند التسجيل دقيقة وصحيحة.</li>
              <li>أنت مسؤول عن الحفاظ على سرية معلومات حسابك.</li>
              <li>يُمنع مشاركة الحساب مع أطراف ثالثة.</li>
              <li>نحتفظ بحق تعليق أو إنهاء أي حساب يُخل بهذه الشروط.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">4. سياسة الدفع والاسترداد</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>جميع المدفوعات نهائية وغير قابلة للاسترداد إلا في حالات خاصة.</li>
              <li>في حال فشل الطلب كلياً، يُعاد الرصيد إلى محفظتك تلقائياً.</li>
              <li>في حال الاكتمال الجزئي، يُعاد الجزء المتبقي من الرصيد.</li>
              <li>لا يمكن استرداد الرصيد المشحون نقداً.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">5. الاستخدام المقبول</h2>
            <p className="mb-3">يُحظر استخدام المنصة من أجل:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>انتهاك شروط خدمة المنصات الاجتماعية.</li>
              <li>المحتوى غير القانوني أو المسيء.</li>
              <li>أي نشاط احتيالي أو مخادع.</li>
              <li>محاولة اختراق أو تعطيل أنظمة المنصة.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">6. إخلاء المسؤولية</h2>
            <p>نسعى لتقديم أفضل الخدمات، لكننا لا نضمن نتائج محددة. قد تتأثر الخدمات بتغييرات خوارزميات المنصات الاجتماعية أو سياساتها. SMM Pro غير مسؤولة عن أي خسائر ناتجة عن استخدام خدماتنا.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">7. تعديل الشروط</h2>
            <p>نحتفظ بحق تعديل هذه الشروط في أي وقت. سيتم إخطار المستخدمين بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">8. التواصل</h2>
            <p>
              لأي استفسارات حول هذه الشروط، يُرجى التواصل معنا عبر{" "}
              <Link href="/contact" className="text-violet-600 hover:underline">نموذج التواصل</Link>{" "}
              أو{" "}
              <Link href="/dashboard/tickets" className="text-violet-600 hover:underline">نظام الدعم الفني</Link>.
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-6">
          <Link href="/privacy" className="text-violet-600 hover:underline text-sm font-semibold">سياسة الخصوصية</Link>
          <Link href="/contact" className="text-violet-600 hover:underline text-sm font-semibold">تواصل معنا</Link>
          <Link href="/" className="text-gray-500 hover:text-gray-800 text-sm">العودة للرئيسية</Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
