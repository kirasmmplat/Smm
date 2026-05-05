import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlatformsSection } from "@/components/sections/PlatformsSection";
import { FaqAccordion } from "@/components/sections/FaqAccordion";
import { PricingPreview } from "@/components/sections/PricingPreview";
import {
  Zap, DollarSign, ShieldCheck, HeadphonesIcon,
  Users, ShoppingCart, Package, Star,
  CheckCircle, ArrowLeft, TrendingUp, Clock, RefreshCw,
} from "lucide-react";

export const revalidate = 60;

// ── Fetch real data from DB ──────────────────────────────────────────────────
async function getPageData() {
  const [serviceCount, completedOrders, userCount, cheapestServices, faqItems] =
    await Promise.all([
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.order.count({ where: { status: "COMPLETED" } }),
      prisma.user.count({ where: { role: "USER" } }),
      prisma.service.findMany({
        where: { status: "ACTIVE" },
        orderBy: { ourRate: "asc" },
        take: 8,
        include: {
          serviceType: {
            include: { category: { include: { platform: true } } },
          },
        },
      }),
      prisma.faqItem.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        take: 5,
      }),
    ]);

  return { serviceCount, completedOrders, userCount, cheapestServices, faqItems };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function LandingPage() {
  const { serviceCount, completedOrders, userCount, cheapestServices, faqItems } =
    await getPageData();

  const stats = [
    {
      value: serviceCount > 0 ? `${serviceCount.toLocaleString()}+` : "500+",
      label: "خدمة متاحة",
      icon: Package,
      color: "text-violet-600",
    },
    {
      value: completedOrders > 0 ? `${completedOrders.toLocaleString()}+` : "50,000+",
      label: "طلب مكتمل",
      icon: ShoppingCart,
      color: "text-emerald-600",
    },
    {
      value: userCount > 0 ? `${userCount.toLocaleString()}+` : "10,000+",
      label: "عميل راضٍ",
      icon: Users,
      color: "text-blue-600",
    },
    { value: "99.9%", label: "نسبة الإكمال", icon: Star, color: "text-amber-600" },
  ];

  const features = [
    {
      icon: Zap,
      title: "توصيل فائق السرعة",
      desc: "طلباتك تبدأ فور تأكيدها — معظم الخدمات تُكتمل خلال دقائق معدودة",
      color: "bg-amber-50 text-amber-600",
      border: "border-amber-100",
    },
    {
      icon: DollarSign,
      title: "أرخص الأسعار",
      desc: "أسعار تنافسية لا مثيل لها مع خصومات حسب مستوى حسابك وحجم طلباتك",
      color: "bg-violet-50 text-violet-600",
      border: "border-violet-100",
    },
    {
      icon: ShieldCheck,
      title: "جودة مضمونة 100%",
      desc: "جميع خدماتنا حقيقية وعالية الجودة مع ضمان الاسترداد في حال أي مشكلة",
      color: "bg-emerald-50 text-emerald-600",
      border: "border-emerald-100",
    },
    {
      icon: HeadphonesIcon,
      title: "دعم 24/7",
      desc: "فريق الدعم متاح على مدار الساعة عبر نظام التذاكر للرد على جميع استفساراتك",
      color: "bg-blue-50 text-blue-600",
      border: "border-blue-100",
    },
  ];

  const pricingServices = cheapestServices.map((s) => ({
    id: s.id,
    name: s.name,
    ourRate: parseFloat(s.ourRate.toString()),
    min: s.min,
    max: s.max,
    refill: s.refill,
    platform: {
      name: s.serviceType.category.platform.name,
      slug: s.serviceType.category.platform.slug,
      icon: s.serviceType.category.platform.icon,
    },
  }));

  const advantages = [
    "بدون رسوم اشتراك — ادفع فقط عند الطلب",
    "أكثر من 500 خدمة لجميع المنصات",
    "واجهة عربية سهلة الاستخدام",
    "API متاح للمطورين والوكالات",
    "دعم فني متواصل على مدار الساعة",
    "ضمان استرداد المبلغ عند الفشل",
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-white to-violet-50" dir="rtl">

      {/* ── Navbar ─────────────────────────────────────────────────────────── */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-violet-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-lg shadow-md">
              S
            </div>
            <span className="text-lg font-black text-gray-900">
              SMM <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">Pro</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <a href="#platforms" className="px-3 py-2 text-sm text-gray-600 hover:text-violet-700 rounded-xl hover:bg-violet-50 transition-all font-medium">المنصات</a>
            <a href="#features" className="px-3 py-2 text-sm text-gray-600 hover:text-violet-700 rounded-xl hover:bg-violet-50 transition-all font-medium">المميزات</a>
            <a href="#pricing" className="px-3 py-2 text-sm text-gray-600 hover:text-violet-700 rounded-xl hover:bg-violet-50 transition-all font-medium">الأسعار</a>
            <Link href="/services" className="px-3 py-2 text-sm text-gray-600 hover:text-violet-700 rounded-xl hover:bg-violet-50 transition-all font-medium">الخدمات</Link>
            <Link href="/login" className="px-3 py-2 text-sm text-gray-600 hover:text-violet-700 rounded-xl hover:bg-violet-50 transition-all font-medium">تسجيل الدخول</Link>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-gray-700 px-4 py-2 rounded-xl border border-gray-200 hover:border-violet-300 hover:text-violet-700 transition-all">
              دخول
            </Link>
            <Link href="/register" className="bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-violet-200 transition-all hover:shadow-violet-300">
              إنشاء حساب مجاني
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[700px] h-[700px] rounded-full bg-violet-200/25 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-purple-200/20 blur-3xl" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

            {/* Text side */}
            <div className="text-center lg:text-right order-2 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-violet-200">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                الأفضل والأرخص في المنطقة العربية
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 leading-tight mb-6">
                نمِّ حضورك على
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 via-purple-600 to-pink-500">
                  السوشيال ميديا
                </span>
                <br />
                بسرعة وموثوقية
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                أكثر من{" "}
                <strong className="text-violet-700">
                  {serviceCount > 0 ? serviceCount.toLocaleString() : "500"}+ خدمة
                </strong>{" "}
                للمتابعين واللايكات والمشاهدات لجميع المنصات، بأسعار تبدأ من{" "}
                <strong className="text-violet-700">$0.001</strong> فقط
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-black py-4 px-8 rounded-2xl text-lg shadow-xl shadow-violet-200 transition-all hover:shadow-violet-300 hover:-translate-y-0.5"
                >
                  ابدأ مجاناً الآن
                  <ArrowLeft size={20} />
                </Link>
                <Link href="/services" className="inline-flex items-center justify-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-bold py-4 px-8 rounded-2xl text-lg border border-violet-200 hover:border-violet-300 transition-all">
                  تصفح الأسعار
                </Link>
              </div>

              {/* Live stats row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-12">
                {stats.map((stat) => (
                  <div key={stat.label} className="text-center bg-white/60 rounded-2xl p-3 border border-violet-100">
                    <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Card side */}
            <div className="order-1 lg:order-2">
              <div className="bg-white/80 backdrop-blur-sm border border-violet-100 shadow-2xl shadow-violet-100/50 rounded-3xl p-8 max-w-md mx-auto">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-2xl shadow-lg mx-auto mb-3">
                    S
                  </div>
                  <h2 className="text-2xl font-black text-gray-900">تسجيل الدخول</h2>
                  <p className="text-gray-500 text-sm mt-1">ادخل إلى لوحة التحكم</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">البريد الإلكتروني</label>
                    <input type="email" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" placeholder="example@email.com" disabled />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">كلمة المرور</label>
                    <input type="password" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100 transition-all" placeholder="••••••••" disabled />
                  </div>
                  <Link href="/login" className="block text-center bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-black py-3.5 px-6 rounded-xl text-base shadow-md shadow-violet-200 transition-all">
                    تسجيل الدخول
                  </Link>
                </div>
                <div className="mt-5 text-center">
                  <p className="text-sm text-gray-500">
                    ليس لديك حساب؟{" "}
                    <Link href="/register" className="text-violet-600 font-bold hover:underline">
                      إنشاء حساب مجاني
                    </Link>
                  </p>
                </div>
                {/* Trust badges */}
                <div className="mt-5 pt-5 border-t border-gray-100 grid grid-cols-3 gap-2 text-center">
                  {[
                    { icon: ShieldCheck, label: "آمن 100%" },
                    { icon: Clock, label: "24/7 دعم" },
                    { icon: RefreshCw, label: "ضمان رفيل" },
                  ].map(({ icon: Icon, label }) => (
                    <div key={label} className="flex flex-col items-center gap-1">
                      <Icon size={16} className="text-violet-400" />
                      <span className="text-xs text-gray-400">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Platforms ──────────────────────────────────────────────────────── */}
      <PlatformsSection />

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-violet-200">
              <TrendingUp size={14} /> لماذا نحن الأفضل
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              لماذا تختار{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-purple-600">SMM Pro</span>؟
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              نقدم لك أفضل تجربة ممكنة في عالم خدمات السوشيال ميديا
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className={`bg-white border ${f.border} rounded-2xl p-6 hover:shadow-lg transition-all hover:-translate-y-1 group`}
              >
                <div className={`w-12 h-12 rounded-2xl ${f.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200`}>
                  <f.icon size={22} />
                </div>
                <h3 className="text-base font-black text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Advantages checklist */}
          <div className="mt-14 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-3xl p-8 md:p-10">
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-4">
              {advantages.map((adv) => (
                <div key={adv} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-violet-600 shrink-0" />
                  <span className="text-gray-700 text-sm font-medium">{adv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Preview ────────────────────────────────────────────────── */}
      <section id="pricing" className="py-20 bg-gradient-to-b from-white to-violet-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-emerald-200">
              <DollarSign size={14} /> أفضل الأسعار
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
              أسعار{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-600">
                لا تُضاهى
              </span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              أرخص الخدمات المتاحة الآن على منصتنا — تحديث تلقائي
            </p>
          </div>

          {pricingServices.length > 0 ? (
            <>
              <PricingPreview services={pricingServices} />
              <div className="text-center mt-8">
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 bg-white hover:bg-violet-50 text-violet-700 font-bold px-8 py-3.5 rounded-2xl border border-violet-200 hover:border-violet-300 transition-all shadow-sm"
                >
                  عرض جميع الخدمات والأسعار
                  <ArrowLeft size={16} />
                </Link>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-violet-100">
              <Package size={40} className="text-violet-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">قيد الإعداد — سيتم إضافة الخدمات قريباً</p>
              <Link href="/register" className="btn-primary px-6 py-2.5 inline-flex items-center gap-2">
                سجّل وكن أول المستفيدين
              </Link>
            </div>
          )}
        </div>
      </section>

      <section className="py-16 bg-violet-50 border-y border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: "واجهة عربية احترافية", desc: "RTL كامل مع خط Cairo وتباين واضح" },
              { title: "مؤشرات حقيقية", desc: "البيانات تُسحب مباشرة من قاعدة البيانات" },
              { title: "بدء سريع", desc: "من التسجيل إلى الطلب خلال دقائق" },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl border border-violet-100 p-5">
                <h3 className="font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="py-20 bg-gradient-to-br from-violet-600 via-purple-700 to-purple-800 text-white relative overflow-hidden">
        <div className="absolute inset-0 -z-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-purple-400/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-4 py-1.5 rounded-full text-sm font-bold mb-5 border border-white/20">
            <Zap size={14} /> سريع وبسيط
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">كيف تعمل المنصة؟</h2>
          <p className="text-violet-200 mb-14 text-lg">3 خطوات بسيطة وطلبك في طريقه إليك</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector lines */}
            <div className="hidden md:block absolute top-10 right-[16%] left-[16%] h-0.5 bg-white/20 -z-10" />
            {[
              { step: "01", title: "إنشاء حساب مجاني", desc: "سجّل في ثوانٍ بدون رسوم أو تحقق معقد — فقط بريدك الإلكتروني", icon: Users },
              { step: "02", title: "شحن الرصيد", desc: "اختر طريقة الدفع المناسبة وأضف رصيداً بأي مبلغ تريده", icon: DollarSign },
              { step: "03", title: "اطلب خدمتك", desc: "اختر الخدمة وأدخل رابطك وانتظر النتائج السريعة", icon: ShoppingCart },
            ].map((item, i) => (
              <div key={item.step} className="relative flex flex-col items-center">
                <div className="w-20 h-20 rounded-3xl bg-white/15 border border-white/25 flex flex-col items-center justify-center mb-5 mx-auto backdrop-blur-sm">
                  <span className="text-xs font-bold text-white/60 mb-0.5">{item.step}</span>
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-black mb-2">{item.title}</h3>
                <p className="text-violet-200 text-sm leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-3 bg-white text-violet-700 font-black py-4 px-10 rounded-2xl hover:bg-violet-50 transition-all shadow-2xl shadow-purple-900/30 text-lg hover:-translate-y-0.5"
            >
              ابدأ الآن — مجاناً تماماً
              <ArrowLeft size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Live Stats Banner ───────────────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                value: serviceCount > 0 ? `${serviceCount.toLocaleString()}+` : "500+",
                label: "خدمة نشطة",
                sublabel: "عبر 10+ منصة",
                icon: Package,
                color: "text-violet-600",
                bg: "bg-violet-50",
              },
              {
                value: completedOrders > 0 ? `${completedOrders.toLocaleString()}+` : "50,000+",
                label: "طلب مكتمل",
                sublabel: "بنجاح تام",
                icon: CheckCircle,
                color: "text-emerald-600",
                bg: "bg-emerald-50",
              },
              {
                value: userCount > 0 ? `${userCount.toLocaleString()}+` : "10,000+",
                label: "عميل نشط",
                sublabel: "من دول عربية وعالمية",
                icon: Users,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                value: "$0.001",
                label: "أقل سعر",
                sublabel: "بداية من هذا السعر",
                icon: DollarSign,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((stat) => (
              <div key={stat.label} className="text-center group">
                <div className={`w-12 h-12 ${stat.bg} rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <stat.icon size={22} className={stat.color} />
                </div>
                <div className={`text-2xl md:text-3xl font-black ${stat.color}`}>{stat.value}</div>
                <div className="text-gray-700 font-semibold text-sm mt-1">{stat.label}</div>
                <div className="text-gray-400 text-xs mt-0.5">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      {faqItems.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-violet-50 to-white">
          <div className="max-w-3xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 px-4 py-1.5 rounded-full text-sm font-bold mb-4 border border-violet-200">
                الأسئلة الشائعة
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">
                أسئلة يطرحها عملاؤنا
              </h2>
              <p className="text-gray-500">إجابات سريعة على أكثر الاستفسارات شيوعاً</p>
            </div>
            <FaqAccordion items={faqItems} />
          </div>
        </section>
      )}

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="bg-gradient-to-br from-violet-600 via-purple-700 to-purple-800 rounded-3xl p-10 md:p-14 text-white relative overflow-hidden">
            <div className="absolute inset-0 -z-0">
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-400/20 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <div className="inline-flex items-center gap-2 bg-white/20 text-white/90 px-4 py-1.5 rounded-full text-sm font-bold mb-6 border border-white/20">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                متاح الآن — مجاناً
              </div>
              <h2 className="text-3xl md:text-4xl font-black mb-4">
                جاهز لتنمية حضورك الرقمي؟
              </h2>
              <p className="text-violet-200 text-lg mb-8 max-w-xl mx-auto leading-relaxed">
                انضم إلى آلاف العملاء الذين يثقون بـ SMM Pro لتنمية حساباتهم يومياً
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 bg-white text-violet-700 font-black py-4 px-10 rounded-2xl hover:bg-violet-50 transition-all shadow-xl text-lg"
                >
                  إنشاء حساب مجاني الآن
                  <ArrowLeft size={20} />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-bold py-4 px-8 rounded-2xl border border-white/20 hover:border-white/30 transition-all text-lg"
                >
                  تصفح الأسعار أولاً
                </Link>
              </div>
              <p className="text-violet-300 text-sm mt-6">
                لا توجد رسوم مخفية — لا عقود — لا التزامات
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="bg-gray-950 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-base shadow-md">
                  S
                </div>
                <span className="font-black text-white text-lg">SMM Pro</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                منصة احترافية لخدمات التسويق عبر السوشيال ميديا بأسعار تنافسية
              </p>
            </div>
            {/* Links */}
            <div>
              <h4 className="text-white font-bold text-sm mb-4">الخدمات</h4>
              <ul className="space-y-2.5 text-sm">
                {[
                  { label: "جميع الخدمات", href: "/services" },
                  { label: "إنستقرام", href: "/services#platform-instagram" },
                  { label: "تيك توك", href: "/services#platform-tiktok" },
                  { label: "يوتيوب", href: "/services#platform-youtube" },
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
                  { label: "نسيت كلمة المرور", href: "/forgot-password" },
                  { label: "لوحة التحكم", href: "/dashboard" },
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
                  { label: "الأسئلة الشائعة", href: "/faq" },
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
          <div className="border-t border-gray-800 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
            <p className="text-gray-600">© {new Date().getFullYear()} SMM Pro — جميع الحقوق محفوظة</p>
            <div className="flex items-center gap-2 text-gray-600 text-xs">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              جميع الأنظمة تعمل
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
