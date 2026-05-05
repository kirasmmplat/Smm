import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import ManualDepositForm from "./ManualDepositForm";
import StripeButton from "./StripeButton";
import StripeResult from "./StripeResult";
import PayPalButton from "./PayPalButton";
import CryptoDeposit from "./CryptoDeposit";
import {
  CreditCard, Ticket, Wallet,
  ShieldCheck, ArrowRight, CheckCircle2, Zap,
} from "lucide-react";

export default async function AddFundsPage({
  searchParams,
}: {
  searchParams: { stripe?: string; paypal?: string; session_id?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const [user, paymentMethods, transactions, settings] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { id: true, name: true, balance: true, email: true },
    }),
    prisma.paymentMethod.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.transaction.findMany({
      where: { userId: session.user.id, type: { in: ["DEPOSIT", "BONUS"] } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    prisma.setting.findMany({
      where: { key: { in: ["min_deposit", "max_deposit", "default_currency", "paypal_enabled", "paypal_client_id", "crypto_enabled", "crypto_address_btc", "crypto_address_eth", "crypto_address_usdt"] } },
    }),
  ]);

  if (!user) redirect("/login");

  const s = Object.fromEntries(settings.map((x) => [x.key, x.value]));
  const symbol = s.default_currency === "EGP" ? "ج.م" : "$";
  const minDeposit = s.min_deposit ?? "5";
  const stripeEnabled = !!process.env.STRIPE_SECRET_KEY;
  const paypalEnabled = s.paypal_enabled === "true" && !!s.paypal_client_id;
  const cryptoEnabled = s.crypto_enabled === "true" && (!!s.crypto_address_btc || !!s.crypto_address_eth || !!s.crypto_address_usdt);
  const typeColors: Record<string, string> = {
    MANUAL: "bg-amber-50 border-amber-200",
    AUTO: "bg-emerald-50 border-emerald-200",
    CRYPTO: "bg-blue-50 border-blue-200",
    STRIPE: "bg-violet-50 border-violet-300",
  };

  const typeBadgeColors: Record<string, string> = {
    MANUAL: "bg-amber-100 text-amber-700",
    AUTO: "bg-emerald-100 text-emerald-700",
    CRYPTO: "bg-blue-100 text-blue-700",
    STRIPE: "bg-violet-100 text-violet-700",
  };

  const typeLabels: Record<string, string> = {
    MANUAL: "يدوي",
    AUTO: "تلقائي",
    CRYPTO: "كريبتو",
    STRIPE: "بطاقة فورية",
  };

  const statusColors: Record<string, string> = {
    COMPLETED: "badge-active",
    PENDING: "badge-pending",
    FAILED: "badge-danger",
    REJECTED: "badge-danger",
  };

  const statusLabels: Record<string, string> = {
    COMPLETED: "مكتمل",
    PENDING: "انتظار",
    FAILED: "فشل",
    REJECTED: "مرفوض",
  };

  return (
    <div className="max-w-2xl">
      {searchParams.stripe && (
        <StripeResult status={searchParams.stripe} />
      )}
      {searchParams.paypal && (
        <StripeResult status={searchParams.paypal === "success" ? "success" : searchParams.paypal === "cancel" ? "cancel" : "error"} />
      )}

      <div className="mb-8 bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-3xl p-5 sm:p-6 md:p-7 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-violet-100 text-sm font-medium">إضافة رصيد</p>
            <h1 className="text-2xl sm:text-3xl font-black mt-1">شحن الرصيد</h1>
            <p className="text-violet-100 mt-2 text-sm">
              رصيدك الحالي:{" "}
              <span className="text-white font-black text-lg" dir="ltr">
                {symbol}{parseFloat(String(user.balance)).toFixed(2)}
              </span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="text-violet-100 text-xs">أقل إيداع</div>
              <div className="text-white font-black" dir="ltr">{symbol}{minDeposit}</div>
            </div>
            <div className="bg-white/10 rounded-2xl px-4 py-3">
              <div className="text-violet-100 text-xs">عمليات سابقة</div>
              <div className="text-white font-black">{transactions.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
        {[
          { label: "آمن ومشفّر", desc: "SSL/TLS — بياناتك محمية دائماً", icon: ShieldCheck },
          { label: "فوري تلقائي", desc: "الإيداع يُضاف للرصيد فوراً", icon: Zap },
          { label: "دعم 24/7", desc: "تذكرة دعم عند أي مشكلة", icon: Ticket },
        ].map((item) => (
          <div key={item.label} className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
              <item.icon size={18} />
            </div>
            <div>
              <div className="text-gray-800 font-bold text-sm">{item.label}</div>
              <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {stripeEnabled && (
        <div className="card border-2 border-violet-300 bg-violet-50 mb-4 relative overflow-hidden">
          <div className="absolute top-3 left-3">
            <span className="bg-violet-600 text-white text-xs font-black px-2.5 py-1 rounded-full flex items-center gap-1">
              <Zap size={11} /> موصى به
            </span>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-violet-100 flex items-center justify-center text-violet-600 font-black text-base">
              S
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900">بطاقة ائتمان / Stripe</h2>
                <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">بطاقة فورية</span>
              </div>
              <p className="text-gray-500 text-sm">
                الحد الأدنى: {symbol}{minDeposit} · دفع فوري وآمن بأي بطاقة
              </p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            ادفع بأي بطاقة فيزا أو ماستركارد — يضاف الرصيد تلقائياً فور اكتمال الدفع
          </p>
          <div className="flex gap-2 mb-4 flex-wrap text-xs text-gray-500">
            {["Visa", "Mastercard", "Amex"].map((c) => (
              <span key={c} className="bg-white border border-gray-200 rounded-lg px-2.5 py-1 font-medium">{c}</span>
            ))}
          </div>
          <StripeButton
            minDeposit={parseFloat(minDeposit)}
            bonusPercent={0}
            paymentMethodId="stripe"
          />
        </div>
      )}

      {paypalEnabled && (
        <div className="card border-2 border-blue-200 bg-blue-50 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-blue-100 flex items-center justify-center font-black text-sm">
              <span className="text-[#003087] font-black">Pay</span><span className="text-[#009cde] font-black">Pal</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900">PayPal</h2>
                <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">دفع تلقائي</span>
              </div>
              <p className="text-gray-500 text-sm">الحد الأدنى: {symbol}{minDeposit} · يضاف الرصيد فور الدفع</p>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4">ادفع عبر حساب PayPal أو البطاقة من خلال بوابة PayPal الآمنة</p>
          <PayPalButton minDeposit={parseFloat(minDeposit)} />
        </div>
      )}

      {cryptoEnabled && (
        <div className="card border-2 border-amber-200 bg-amber-50 mb-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-amber-100 flex items-center justify-center font-black text-xl text-amber-600">₿</div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-gray-900">العملات الرقمية</h2>
                <span className="bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">USDT / BTC / ETH</span>
              </div>
              <p className="text-gray-500 text-sm">الحد الأدنى: {symbol}{minDeposit} · يتطلب تأكيد يدوي</p>
            </div>
          </div>
          <CryptoDeposit />
        </div>
      )}

      {paymentMethods.length === 0 && !stripeEnabled ? (
        <div className="card text-center py-12">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center">
            <CreditCard size={26} />
          </div>
          <p className="text-gray-500">لا توجد طرق دفع متاحة حالياً. تواصل مع الدعم.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paymentMethods.map((pm) => (
            <div key={pm.id} className={`card border-2 ${typeColors[pm.type] ?? "border-violet-200"}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center text-violet-600 font-bold text-lg">
                  {pm.icon ? pm.icon : <CreditCard size={18} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base font-bold text-gray-900">{pm.name}</h2>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeBadgeColors[pm.type] ?? ""}`}>
                      {typeLabels[pm.type] ?? pm.type}
                    </span>
                    {Number(pm.bonusPercent) > 0 && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 flex items-center gap-1">
                        <CheckCircle2 size={10} /> +{String(pm.bonusPercent)}% مكافأة
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm">
                    الحد الأدنى: {symbol}{pm.minAmount.toString()}
                    {pm.maxAmount && ` · الأقصى: ${symbol}${pm.maxAmount.toString()}`}
                  </p>
                </div>
              </div>

              {pm.description && (
                <p className="text-gray-600 text-sm mb-3">{pm.description}</p>
              )}

              {pm.isAutomatic ? (
                <StripeButton
                  minDeposit={parseFloat(pm.minAmount.toString())}
                  bonusPercent={parseFloat(pm.bonusPercent.toString())}
                  paymentMethodId={pm.id}
                />
              ) : (
                <>
                  {pm.instructions && (
                    <div className="bg-white/80 border border-gray-200 rounded-xl p-4 mb-4">
                      <div className="text-xs font-bold text-gray-600 mb-2 uppercase tracking-wider">تعليمات التحويل</div>
                      <pre className="text-gray-700 text-sm whitespace-pre-wrap font-sans" dir="rtl">
                        {pm.instructions}
                      </pre>
                    </div>
                  )}
                  <ManualDepositForm
                    minDeposit={pm.minAmount.toString()}
                    paymentMethodId={pm.id}
                    paymentMethodName={pm.name}
                    helperText="هذه طريقة غير تلقائية. سيتم تحويلك إلى الدعم لإكمال الإيداع."
                  />
                </>
              )}
            </div>
          ))}

          <div className="bg-violet-50 border border-violet-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-xl bg-white border border-violet-100 text-violet-600 flex items-center justify-center">
              <Ticket size={18} />
            </span>
            <div className="flex-1">
              <div className="text-gray-800 text-sm font-semibold">مشكلة في الشحن؟</div>
              <div className="text-gray-500 text-xs">تواصل مع الدعم الفني وسنساعدك فوراً</div>
            </div>
            <Link href="/dashboard/tickets/new" className="btn-secondary text-sm px-3 py-1.5">
              فتح تذكرة
            </Link>
          </div>
        </div>
      )}

      {transactions.length > 0 && (
        <div className="card mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Wallet size={18} className="text-violet-600" />
            سجل الإيداعات
          </h2>
          <div className="space-y-1">
            {transactions.map((t) => (
              <div key={t.id} className="flex justify-between items-center py-3 border-b border-violet-50 last:border-0">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {t.notes ?? (t.type === "BONUS" ? "مكافأة" : "إيداع")}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                    {new Date(t.createdAt).toLocaleDateString("ar-SA")}
                    {t.paymentMethod && (
                      <span className="capitalize">{t.paymentMethod}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={statusColors[t.status] ?? "badge-pending"}>
                    {statusLabels[t.status] ?? t.status}
                  </span>
                  <span className="text-emerald-600 font-bold" dir="ltr">
                    +{symbol}{parseFloat(t.amount.toString()).toFixed(2)}
                  </span>
                  <a
                    href={`/api/transactions/${t.id}/invoice`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-300 hover:text-violet-500 transition-colors text-sm inline-flex items-center gap-1"
                    title="تنزيل فاتورة PDF"
                  >
                    <ArrowRight size={12} />
                    فاتورة
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-100">
            <Link href="/dashboard/transactions" className="text-sm text-violet-600 hover:underline font-semibold">
              عرض كل المعاملات →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
