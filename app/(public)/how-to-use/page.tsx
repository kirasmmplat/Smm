import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

const steps = [
  { step: "01", title: "إنشاء حساب مجاني", desc: "سجّل حسابك في دقيقة واحدة بالبريد الإلكتروني" },
  { step: "02", title: "شحن الرصيد", desc: "أضف رصيداً بـ Stripe أو PayPal أو USDT أو تحويل بنكي" },
  { step: "03", title: "اختر الخدمة", desc: "تصفح مئات الخدمات وفلترها حسب المنصة والنوع" },
  { step: "04", title: "أدخل بياناتك", desc: "أدخل رابط حسابك أو منشورك والكمية المطلوبة" },
  { step: "05", title: "تأكيد الطلب", desc: "راجع السعر وأكّد الطلب — المبلغ يُخصم تلقائياً" },
  { step: "06", title: "تتبع تقدمك", desc: "تابع حالة طلبك في الوقت الفعلي من لوحة التحكم" },
];

const features = [
  { title: "بدء فوري", desc: "معظم الطلبات تبدأ خلال دقائق" },
  { title: "آمن 100%", desc: "لا نطلب كلمات المرور أبداً" },
  { title: "دفع متعدد", desc: "USDT، BTC، ETH وبطاقات ائتمان" },
  { title: "ضمان الاسترداد", desc: "استرداد فوري للطلبات الجزئية" },
  { title: "دعم 24/7", desc: "فريق دعم متاح دائماً" },
  { title: "متوافق موبايل", desc: "استخدمها من أي جهاز" },
];

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white" dir="rtl">
      <PublicNav />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-black text-gray-900 mb-3">كيفية الاستخدام</h1>
          <p className="text-gray-500 text-lg">6 خطوات بسيطة للبدء في تنمية حساباتك</p>
        </div>

        <div className="space-y-4 mb-16">
          {steps.map((s, i) => (
            <div key={s.step} className="bg-white border border-violet-100 rounded-3xl p-6 flex items-center gap-6 shadow-sm">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center font-black text-xl shadow-md">
                {s.step}
              </div>
              <div className="flex-1">
                <span className="text-xs font-bold text-violet-400 uppercase">الخطوة {s.step}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-0.5">{s.title}</h3>
                <p className="text-gray-500 text-sm mt-0.5">{s.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <div className="hidden md:block text-gray-200 text-3xl">←</div>
              )}
            </div>
          ))}
        </div>

        <div className="mb-14">
          <h2 className="text-2xl font-black text-center text-gray-900 mb-8">لماذا تختارنا؟</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="bg-white border border-violet-100 rounded-2xl p-5 text-center shadow-sm">
                <div className="w-10 h-10 mx-auto mb-3 rounded-xl bg-violet-50 border border-violet-100 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-violet-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <h3 className="font-bold text-gray-800 mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-10 text-center text-white shadow-xl">
          <h3 className="text-2xl font-black mb-3">جاهز للبدء؟</h3>
          <p className="text-violet-200 mb-6">انضم لآلاف المستخدمين الذين يثقون بنا</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="bg-white text-violet-600 font-black px-8 py-3 rounded-2xl hover:bg-violet-50 transition text-lg inline-block">
              ابدأ الآن مجاناً
            </Link>
            <Link href="/services" className="border border-white/30 text-white font-bold px-8 py-3 rounded-2xl hover:bg-white/10 transition text-lg">
              تصفح الخدمات
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
