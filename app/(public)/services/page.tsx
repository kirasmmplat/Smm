import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getPlatformIcon, PLATFORM_COLORS } from "@/components/ui/PlatformIcons";
import PublicFooter from "@/components/PublicFooter";

export const revalidate = 60;

export default async function ServicesPage() {
  const platforms = await prisma.platform.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
    include: {
      categories: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
        include: {
          serviceTypes: {
            where: { isActive: true },
            orderBy: { sortOrder: "asc" },
            include: {
              services: {
                where: { status: "ACTIVE" },
                orderBy: { ourRate: "asc" },
                take: 5,
              },
            },
          },
        },
      },
    },
  });

  const totalServices = await prisma.service.count({ where: { status: "ACTIVE" } });

  return (
    <div className="min-h-screen bg-gray-950" dir="rtl">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-white/10 sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-sm shadow-md">
              S
            </div>
            <span className="font-black text-white">SMM <span className="text-violet-400">Pro</span></span>
          </Link>
          <div className="flex gap-3">
            <Link href="/login" className="text-sm text-gray-300 hover:text-white px-4 py-2 rounded-xl border border-white/10 hover:border-white/20 transition-all">
              تسجيل الدخول
            </Link>
            <Link href="/register" className="btn-primary text-sm px-4 py-2">إنشاء حساب</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-violet-900/40 text-violet-300 border border-violet-700/50 px-4 py-1.5 rounded-full text-sm font-semibold mb-5">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            جميع خدماتنا
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
            أكثر من{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400">
              {totalServices > 0 ? totalServices.toLocaleString() : "500"}+ خدمة
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-lg mx-auto">
            لجميع منصات التواصل الاجتماعي — اختر المنصة وابدأ بتنمية حساباتك الآن
          </p>
        </div>

        {/* Platform Quick Nav */}
        {platforms.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {platforms.map((platform) => {
              const PlatformIcon = getPlatformIcon(platform.slug);
              const colors = PLATFORM_COLORS[platform.slug] ?? {};
              return (
                <a
                  key={platform.id}
                  href={`#platform-${platform.slug}`}
                  className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 px-4 py-2 rounded-xl transition-all text-sm text-gray-300 hover:text-white"
                >
                  {PlatformIcon ? (
                    <PlatformIcon size={20} />
                  ) : (
                    <span className="text-lg">{platform.icon}</span>
                  )}
                  {platform.name}
                </a>
              );
            })}
          </div>
        )}

        {platforms.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-24 h-24 rounded-3xl bg-violet-900/30 border border-violet-700/30 flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
            </div>
            <h2 className="text-2xl font-black text-white mb-3">الخدمات قيد الإعداد</h2>
            <p className="text-gray-400 mb-8">نعمل على إضافة المئات من الخدمات، تابعنا قريباً!</p>
            <Link href="/register" className="btn-primary px-8 py-3">
              سجّل وكن أول المستفيدين
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            {platforms.map((platform) => {
              const PlatformIcon = getPlatformIcon(platform.slug);
              const colors = PLATFORM_COLORS[platform.slug];
              const serviceCount = platform.categories.reduce(
                (sum, c) => sum + c.serviceTypes.reduce((s2, st) => s2 + st.services.length, 0),
                0
              );
              return (
                <div
                  key={platform.id}
                  id={`platform-${platform.slug}`}
                  className="bg-gray-900/60 border border-white/10 rounded-3xl overflow-hidden"
                >
                  <div
                    className="px-6 py-5 border-b border-white/10 flex items-center gap-4"
                    style={{
                      background: colors
                        ? `linear-gradient(135deg, ${colors.glow}20, transparent)`
                        : undefined,
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0"
                      style={{
                        background: colors
                          ? `linear-gradient(135deg, ${colors.glow}, ${colors.glow}88)`
                          : "linear-gradient(135deg, #7C3AED, #6D28D9)",
                      }}
                    >
                      {PlatformIcon ? (
                        <PlatformIcon size={26} />
                      ) : (
                        <span className="text-2xl">{platform.icon}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-white flex items-center gap-3">
                        {platform.name}
                        {serviceCount > 0 && (
                          <span className="text-xs font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full">
                            {serviceCount} خدمة
                          </span>
                        )}
                      </h2>
                      <p className="text-gray-400 text-sm mt-0.5">اختر الخدمة المناسبة لتنمية حسابك</p>
                    </div>
                  </div>

                  <div className="p-6 grid md:grid-cols-2 gap-6">
                    {platform.categories.map((cat) => (
                      <div key={cat.id}>
                        <h3 className="font-bold text-gray-300 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                          <span className="w-1 h-4 rounded-full bg-violet-500" />
                          {cat.name}
                        </h3>
                        {cat.serviceTypes.map((st) => (
                          <div key={st.id} className="mb-4">
                            <div className="text-xs text-gray-500 mb-2 font-medium pr-3">{st.name}</div>
                            <div className="space-y-2">
                              {st.services.map((svc) => (
                                <Link
                                  key={svc.id}
                                  href="/dashboard/new-order"
                                  className="group bg-gray-800/50 hover:bg-gray-800 border border-white/5 hover:border-violet-500/30 rounded-xl p-3.5 flex items-center justify-between transition-all"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-gray-200 text-sm font-medium truncate group-hover:text-white transition-colors">
                                      {svc.name}
                                    </div>
                                    <div className="text-gray-500 text-xs mt-0.5 flex items-center gap-2">
                                      <span>الحد الأدنى: {svc.min.toLocaleString()}</span>
                                      <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                      <span>الأقصى: {svc.max.toLocaleString()}</span>
                                      {svc.refill && (
                                        <>
                                          <span className="w-1 h-1 bg-gray-600 rounded-full" />
                                          <span className="text-emerald-400">رفيل</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-left mr-3 flex-shrink-0">
                                    <div className="text-emerald-400 font-black text-base" dir="ltr">
                                      ${parseFloat(svc.ourRate.toString()).toFixed(3)}
                                    </div>
                                    <div className="text-gray-500 text-xs text-center">/ 1000</div>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16 p-10 bg-gradient-to-br from-violet-900/50 to-purple-900/50 border border-violet-700/30 rounded-3xl">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-600/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/></svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-3">ابدأ الآن مجاناً</h2>
          <p className="text-gray-400 mb-6">سجل حساباً وأنشئ طلبك الأول في دقيقة واحدة</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="/register" className="btn-primary px-8 py-3 text-base">إنشاء حساب مجاني</Link>
            <Link href="/login" className="text-white border border-white/20 hover:border-white/40 px-8 py-3 rounded-2xl font-bold transition-all text-base">
              تسجيل الدخول
            </Link>
          </div>
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}
