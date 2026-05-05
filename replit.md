# SMM Pro — منصة إدارة السوشيال ميديا

## المعلومات الأساسية

- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL + Prisma ORM (23 جدول)
- **Auth**: NextAuth.js v4 (JWT)
- **Styling**: Tailwind CSS v3 — ثيم بنفسجي/violet (#7C3AED)
- **Language**: عربي RTL، خط Cairo
- **Port**: 22001
- **Charts**: Recharts (للوحة الأدمن)

## بيانات الدخول (Seed)

- **أدمن**: `admin@smmpro.com` / `Admin@123456`
- **مستخدم عادي**: `user@smmpro.com` / `User@123456`

## هيكل الملفات الرئيسي

```
artifacts/smm-platform/
├── app/
│   ├── (auth)/              # login, register
│   ├── (public)/            # صفحات عامة: services, faq, blog, terms, privacy, how-to-use
│   │   ├── forgot-password/ # طلب استعادة كلمة المرور
│   │   └── reset-password/  # صفحة تعيين كلمة المرور الجديدة (token param)
│   ├── (dashboard)/         # لوحة المستخدم — ثيم فاتح بنفسجي
│   │   └── dashboard/
│   │       ├── page.tsx          # الرئيسية
│   │       ├── new-order/        # طلب جديد (4 خطوات)
│   │       ├── orders/           # قائمة الطلبات + [id]/
│   │       ├── services/         # تصفح الخدمات
│   │       ├── add-funds/        # شحن الرصيد
│   │       ├── refills/          # طلبات إعادة التعبئة
│   │       ├── refund-history/   # سجل الاسترداد
│   │       ├── updates/          # تحديثات الخدمات
│   │       ├── affiliate/        # التسويق بالعمولة
│   │       ├── notifications/    # الإشعارات
│   │       ├── api/              # Developer API docs + key
│   │       ├── tickets/          # الدعم الفني
│   │       └── account/          # الإعدادات + API key
│   ├── (admin)/             # لوحة الأدمن — ثيم داكن (#0F172A)
│   │   └── admin/
│   │       ├── page.tsx          # رسوم بيانية (Recharts) + 8 إحصائيات + 7 أيام
│   │       ├── orders/           # جدول + bulk actions (checkbox) + فلتر + pagination
│   │       ├── orders/[id]/      # تفاصيل طلب + تعديل
│   │       ├── services/         # قائمة + تعديل
│   │       ├── services/[id]/edit/
│   │       ├── platforms/        # إدارة المنصات/الفئات/الأنواع
│   │       ├── providers/        # قائمة + new + [id]/ + [id]/browse
│   │       ├── tickets/          # قائمة + [id]/
│   │       ├── transactions/     # قائمة + تأكيد/رفض الإيداعات
│   │       ├── users/            # قائمة + بحث
│   │       ├── users/[id]/       # تبويبات: تعديل حساب / تعديل رصيد (ADD|DEDUCT|SET) / طلبات / معاملات
│   │       ├── payment-methods/  # إدارة ديناميكية
│   │       ├── account-levels/   # مستويات + خصومات
│   │       ├── blog/             # إدارة المقالات
│   │       ├── faq/              # إدارة الأسئلة
│   │       ├── pages/            # صفحات ثابتة (terms/privacy/how-to-use)
│   │       ├── services/[id]/   # GET/PUT/DELETE (admin-only CRUD)
│   │       ├── refills/          # إدارة طلبات Refill
│   │       └── settings/         # general / email / payment / appearance / seo
│   ├── api/                 # API Routes
│   │   ├── auth/
│   │   │   ├── [...nextauth]/   # NextAuth
│   │   │   ├── register/        # POST
│   │   │   ├── forgot-password/ # POST — يولد token + يُسجّل في DB
│   │   │   └── reset-password/  # POST — يتحقق من token + يُحدّث password
│   │   ├── taxonomy/        # GET: platforms+categories+serviceTypes
│   │   ├── services/        # GET paginated, [id] GET
│   │   ├── orders/          # GET/POST, [id]/ GET, [id]/refill POST
│   │   ├── user/
│   │   │   ├── profile/     # GET/PUT — معلومات شاملة (language/timezone/invoiceDetails)
│   │   │   ├── password/    # PUT — تغيير كلمة المرور (يتحقق من الحالية)
│   │   │   ├── notifications/ # PUT — emailNotifications / telegramNotifications
│   │   │   └── telegram/    # POST (ربط) / DELETE (إلغاء الربط)
│   │   ├── tickets/         # GET/POST, [id]/ GET/PUT, [id]/messages POST
│   │   ├── notifications/   # GET, [id]/read PUT, read-all PUT
│   │   ├── affiliate/       # stats GET, referrals GET, payout POST
│   │   ├── wallet/          # GET
│   │   ├── transactions/    # GET, deposit-request POST
│   │   ├── refills/         # GET
│   │   ├── service-updates/ # GET
│   │   ├── blog/            # GET, [slug] GET
│   │   ├── faq/             # GET
│   │   ├── pages/[slug]/    # GET
│   │   ├── v2/              # Developer API v2 (POST, key-based)
│   │   ├── cron/update-orders/  # GET — Cron job تحديث الطلبات
│   │   └── admin/
│   │       ├── stats/           # GET — 8 إحصائيات + 7 أيام charts + statusDist
│   │       ├── orders/          # GET (pagination+search+filter), bulk POST
│   │       ├── orders/[id]/     # GET/PUT (مع استرداد تلقائي عند CANCELED/REFUNDED)
│   │       ├── users/           # GET
│   │       ├── users/[id]/      # GET/PUT (role/status/discountPercent)
│   │       ├── users/[id]/adjust-balance/  # POST (ADD|DEDUCT|SET + notes)
│   │       ├── tickets/         # GET, [id]/ GET/PUT, [id]/messages POST
│   │       ├── transactions/confirm-deposit/  # POST
│   │       ├── services/        # GET (pagination+search+filter)
│   │       ├── providers/       # GET/POST, [id]/ GET/PUT
│   │       ├── platforms/       # GET/POST
│   │       ├── categories/      # POST
│   │       ├── service-types/   # POST
│   │       ├── refills/         # GET, [id]/approve + [id]/reject POST
│   │       └── settings/        # GET/PUT (group-based)
│   ├── sitemap.ts           # auto-generated sitemap.xml
│   ├── robots.ts            # robots.txt
│   ├── error.tsx            # Global error boundary
│   └── not-found.tsx        # 404 page
├── lib/
│   ├── api-auth.ts      # requireAuth() / requireAdmin() — يُعيدان { user, error }
│   ├── auth.ts          # NextAuth config
│   ├── prisma.ts        # Prisma client singleton
│   └── utils.ts         # cn(), formatMoney(), generateApiKey()
├── components/
│   ├── providers/       # SessionProvider
│   └── dashboard/       # DashboardLayout, Sidebar
└── prisma/
    ├── schema.prisma    # 23-table schema
    └── seed.ts          # بيانات تجريبية
```

## هيكل الـ Schema (أهم النقاط)

- **User**: يحتوي على `resetToken` + `resetTokenExpiry` لاستعادة كلمة المرور
- **Platform/Category/ServiceType**: `isActive: Boolean` (وليس `status`)
- **Service**: `status: ServiceStatus` (ACTIVE/INACTIVE)، لها `refill` و`cancel` بدون `dripFeed`
- **TicketStatus enum**: `OPEN | PENDING_REPLY | CLOSED`
- **TransactionType**: `DEPOSIT | WITHDRAWAL | ORDER_CHARGE | REFUND | BONUS | REFERRAL_EARNING | ADMIN_ADJUST`
- **RefillStatus**: `PENDING | APPROVED | REJECTED | COMPLETED`
- **TicketMessage**: `isAdminReply: Boolean` (وليس `isAdmin`)
- **Role enum**: `USER | ADMIN` فقط
- **OrderStatus**: `PENDING | IN_PROGRESS | PROCESSING | COMPLETED | PARTIAL | CANCELED | REFUNDED | FAILED`

## CSS Classes (globals.css)

- `.card` — بطاقة بيضاء (dashboard) / داكنة (admin)
- `.btn-primary` — زر بنفسجي gradient
- `.btn-secondary` — زر ثانوي رمادي
- `.btn-danger` — زر أحمر
- `.input-field` — حقل إدخال
- `.input-label` — تسمية الحقل
- `.stat-card` — بطاقة إحصائية
- `.badge-active/pending/danger/warning/info/inactive` — شارات الحالة
- `.table-container` / `.data-table` — جداول موحدة

## قواعد مهمة

- **lib/api-auth.ts**: `requireAuth()` و`requireAdmin()` يُعيدان `{ user, error }` — لا مدخلات
- **Decimal fields**: استخدم `.toString()` قبل JSX وليس `Number()` مباشرةً
- **Admin theme**: داكن (#0F172A) — استخدم `bg-slate-800`, `border-slate-700`, `text-white`
- **Dashboard theme**: فاتح (white/violet) — استخدم `.card`, `.btn-primary`
- **لا تستخدم `omit`** في Prisma queries — استخدم `select` بدلاً منها
- الـ middleware يحمي `/dashboard/*` (تسجيل دخول) و `/admin/*` (ADMIN role)
- Admin Dashboard: Client Component (يجلب من `/api/admin/stats`)
- Admin Orders: Client Component مع bulk actions و pagination
- Admin Users [id]: Client Component مع 4 تبويبات
- Admin Services: Client Component مع search + bulk toggle + pagination
- Dashboard Account: Client Component مع 4 تبويبات (المعلومات / الأمان+2FA / الإشعارات / API key)

## المكتبات المضافة (Phase 6)

- `resend` — إرسال الإيميل (lib/email.ts)
- `otplib` — TOTP / 2FA (lib/totp.ts)
- `qrcode` + `@types/qrcode` — توليد QR codes للـ 2FA

## متغيرات البيئة المطلوبة

- `RESEND_API_KEY` — مطلوب لإرسال الإيميلات (اختياري في dev — يتجاهل بدونه)
- `EMAIL_FROM` — عنوان المرسل (افتراضي: `SMM Pro <onboarding@resend.dev>`)
- `NEXTAUTH_URL` — URL الموقع للروابط في الإيميلات

## API routes الـ 2FA

- `POST /api/auth/2fa/setup` — توليد TOTP secret + QR code (يخزن secret مؤقتاً)
- `POST /api/auth/2fa/enable` — التحقق من الكود وتفعيل 2FA
- `POST /api/auth/2fa/disable` — تعطيل 2FA بكلمة المرور
- `POST /api/auth/2fa/verify` — التحقق أثناء تسجيل الدخول

## تدفق الـ 2FA في تسجيل الدخول

1. المستخدم يدخل email + password
2. إذا كان 2FA مفعّلاً → `authorize` يرمي خطأ `TWO_FACTOR_REQUIRED`
3. صفحة الدخول تستقبل الخطأ وتُظهر حقل رمز التحقق (6 أرقام)
4. المستخدم يدخل الرمز → يُعاد إرسال البيانات الثلاثة معاً
5. إذا كان الكود صحيحاً → تسجيل الدخول يكتمل

## حالة المراحل

- ✅ Phase 1 — البنية التحتية (100%)
- ✅ Phase 2 — لوحة المستخدم (100%)
- ✅ Phase 3 — المدفوعات (90% — ناقص فواتير PDF فقط)
- ✅ Phase 4 — الميزات المتقدمة (95% — ناقص Telegram Bot فقط)
- ✅ Phase 5 — لوحة الإدارة (100%)
- ✅ Phase 6 — التلميع (85% — 2FA + Email ✅، ناقص PDF + Rate Limiting)

## Telegram Bot

- **اسم البوت**: `@smmxrkhbot`
- **Webhook**: `https://{REPLIT_DEV_DOMAIN}/api/telegram/webhook`
- **lib/telegram.ts**: sendOrderUpdateTelegram, sendDepositConfirmedTelegram, sendTicketReplyTelegram, sendPasswordChangedTelegram, sendNewOrderAdminTelegram, sendNewDepositAdminTelegram
- **الأوامر**: `/start` → يعطي Chat ID، `/id`، `/help`
- **إشعارات الأدمن**: عند طلب جديد أو إيداع جديد يصل إشعار لكل أدمن لديه telegramChatId مربوط
- لإعادة تسجيل الـ webhook: `POST /api/telegram/setup-webhook` (admin only)

## Rate Limiting (مكتمل)

- **lib/rate-limit.ts**: `checkRateLimit(key, limit, windowMs)` — in-memory Map-based
- `/api/auth/register` → 3 حسابات / ساعة / IP
- `/api/auth/[...nextauth]` login → 5 محاولات / 15 دقيقة / IP  
- `/api/v2` → 60 طلب / دقيقة / API key
- رسالة خطأ 429 عربية مع `Retry-After` header
- صفحة login تعرض "محاولات كثيرة، حاول بعد 15 دقيقة"

## فواتير PDF (مكتمل)

- **lib/invoice-pdf.tsx**: مكوّن React PDF بخط Cairo العربي
- `GET /api/orders/[id]/invoice` → PDF تنزيل فاتورة الطلب
- `GET /api/transactions/[id]/invoice` → PDF تنزيل فاتورة المعاملة
- زر 📄 في صفحة الطلبات (جدول) + صفحة تفاصيل الطلب + سجل الإيداعات
- الخط: Cairo Regular + Bold من `/public/fonts/`

## مكوّنات مشتركة للصفحات العامة

- `components/PublicNav.tsx` — شريط تنقل موحّد مع روابط (خدمات / FAQ / كيفية الاستخدام / دخول / تسجيل)
- `components/PublicFooter.tsx` — فوتر موحّد لجميع الصفحات العامة مع 4 أعمدة روابط + حقوق النشر

## بوابات الدفع (مكتملة)

### Stripe (تلقائي)
- `POST /api/payments/stripe/create-session` — ينشئ Checkout Session
- `POST /api/payments/stripe/webhook` — يستقبل أحداث Stripe ويُضيف الرصيد تلقائياً
- التكوين في Secrets: `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`

### PayPal (تلقائي - جديد)
- `POST /api/payments/paypal/create-order` — ينشئ طلب PayPal ويُعيد رابط الموافقة
- `GET /api/payments/paypal/capture` — يلتقط الدفع بعد الموافقة ويُضيف الرصيد تلقائياً
- التكوين عبر لوحة الأدمن: admin/settings/payment → PayPal (client_id + secret + mode sandbox/live)
- يظهر في صفحة شحن الرصيد فقط عند تفعيله من الإعدادات

### USDT / Crypto (يدوي)
- `GET /api/payments/crypto/addresses` — يُعيد عناوين المحافظ من إعدادات الأدمن
- `components/(dashboard)/CryptoDeposit.tsx` — عرض عناوين BTC/ETH/USDT مع زر نسخ وتعليمات
- يظهر في صفحة شحن الرصيد فقط عند تفعيله وإدخال عنوان واحد على الأقل

## Security Headers (مكتملة - next.config.mjs)

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(self)
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
Content-Security-Policy: [شاملة لـ Stripe + PayPal + Google Fonts]
```

## Contact Form API

- `POST /api/contact` — يستقبل رسالة التواصل (name/email/subject/message)، ينشئ تذكرة تلقائياً في نظام الدعم
- rate limited: 3 رسائل / ساعة / IP

## نظام المفضلة (مكتمل)

- **`GET /api/services/favorites`** — يُعيد قائمة الخدمات المفضلة للمستخدم مع كامل بياناتها
- **`POST /api/services/favorites`** — يُضيف خدمة للمفضلة (upsert آمن)
- **`DELETE /api/services/favorites`** — يُزيل خدمة من المفضلة
- **`/dashboard/favorites`** — صفحة المفضلة: جدول كامل desktop + بطاقات mobile، زر "طلب الآن"، زر إزالة
- **صفحة الخدمات** (`/dashboard/services`): يحتوي زر ♥ لكل خدمة — يتحول لـ fill عند الإضافة
- **السايدبار**: رابط "المفضلة" بأيقونة Heart ضمن القائمة الرئيسية

## تحسينات Session الأخيرة

- **إصلاح `/api/admin/reports`**: خطأ PostgreSQL `42702 createdAt is ambiguous` — جرى تأهيل جميع أعمدة `"createdAt"` بـ alias الجدول (`o."createdAt"`, `t."createdAt"`)
- **صفحة admin/service-updates**: صفحة إدارية جديدة لعرض سجل تغييرات الخدمات مع pagination، رُبطت بالسايدبار
- **إصلاح profile page**: كانت تستدعي `/api/profile` الخاطئ — صُحِّحت لـ `/api/user/profile`، ورُفع نوع البيانات المعروض (totalSpent + accountLevel)
- **تحسين `/api/user/profile`**: يدعم الآن `regenerateApiKey: true` لتوليد API key جديد، وأيضاً `telegramNotifications` و`emailNotifications`

## الحالة النهائية

**المنصة مكتملة 100%** — جاهزة للنشر الإنتاجي
- TypeScript: 0 أخطاء
- جميع صفحات الـ public لها PublicNav + PublicFooter موحّد
- PayPal تلقائي بالكامل (create → redirect → capture → credit balance)
- Crypto يدوي مع نسخ عناوين وتعليمات واضحة
- CSP كاملة + 6 security headers إضافية
- نموذج تواصل حقيقي يُنشئ تذاكر دعم تلقائياً
- نظام المفضلة كامل (API + صفحة + زر toggle في الخدمات)
- صفحة admin/service-updates لمتابعة تغييرات الخدمات
