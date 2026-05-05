# SMM Pro — منصة إدارة التسويق الاجتماعي

## نظرة عامة
منصة احترافية لبيع خدمات التسويق على وسائل التواصل الاجتماعي (متابعين، لايكات، مشاهدات...) تدعم أكثر من 12 منصة مع لوحة تحكم متكاملة للمسؤول والمستخدم.

## الميزات الرئيسية
- طلب الخدمات (متابعين، لايكات، مشاهدات) لـ Instagram, TikTok, YouTube, Twitter, Facebook, Telegram وغيرها
- لوحة مستخدم كاملة (الطلبات، الرصيد، إضافة رصيد، التذاكر، API)
- لوحة إدارة شاملة (المستخدمون، الطلبات، الخدمات، المزودون، المعاملات، التذاكر)
- تسجيل دخول آمن مع التحقق بخطوتين (2FA - TOTP)
- سجل نشاطات (Audit Logs) لجميع الإجراءات الإدارية
- صفحة اختبار النظام (DB latency, memory, API providers)
- واجهة عربية RTL بالكامل مع خط Cairo
- ثيم بنفسجي (#7C3AED)

## المتطلبات
- Node.js 18+
- PostgreSQL
- pnpm (أو npm)

## التثبيت والتشغيل

### 1. تثبيت الحزم
```bash
pnpm install
```

### 2. إعداد متغيرات البيئة
```bash
cp .env.example .env
```
عدّل `.env` وضع بيانات قاعدة البيانات والـ secrets:
```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/smmpro"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-random-secret"
SESSION_SECRET="your-random-secret"
```
لإنشاء secret عشوائي:
```bash
openssl rand -hex 32
```

### 3. إعداد قاعدة البيانات
```bash
npx prisma generate
npx prisma db push
npx prisma db seed
```

### 4. تشغيل المشروع
```bash
pnpm dev
```
افتح المتصفح على: http://localhost:3000

## بيانات الدخول الافتراضية

| الدور | البريد | كلمة المرور |
|-------|--------|-------------|
| مسؤول (Admin) | admin@smmpro.com | Admin@123456 |

## هيكل المشروع
```
smm-platform/
├── app/
│   ├── (admin)/admin/      # لوحة الإدارة
│   ├── (dashboard)/        # لوحة المستخدم
│   ├── (public)/           # الصفحات العامة (login, register...)
│   └── api/                # API Routes
├── components/             # مكونات React
│   ├── sections/           # أقسام الصفحات
│   └── ui/                 # مكونات واجهة المستخدم
├── lib/                    # وظائف مساعدة (auth, prisma, audit...)
├── prisma/
│   ├── schema.prisma       # مخطط قاعدة البيانات
│   └── seed.ts             # البيانات الأولية
├── public/                 # ملفات ثابتة
├── types/                  # تعريفات TypeScript
├── .env.example            # مثال متغيرات البيئة
└── middleware.ts           # حماية المسارات
```

## المنصات المدعومة
Instagram · TikTok · YouTube · Twitter/X · Facebook · Telegram · Snapchat · Threads · SoundCloud · Spotify · Pinterest · LinkedIn

## التقنيات المستخدمة
| التقنية | الإصدار | الاستخدام |
|---------|---------|-----------|
| Next.js | 14 | إطار العمل الرئيسي (App Router) |
| PostgreSQL | 15+ | قاعدة البيانات |
| Prisma | 5 | ORM |
| NextAuth.js | 4 | المصادقة |
| Tailwind CSS | 3 | التصميم |
| TypeScript | 5 | اللغة |
| Cairo Font | — | الخط العربي |

## ملاحظات مهمة للإنتاج
- غيّر `NEXTAUTH_SECRET` و `SESSION_SECRET` بقيم عشوائية آمنة
- استخدم HTTPS وعيّن `NEXTAUTH_URL` بـ `https://your-domain.com`
- قم بإعداد SSL لقاعدة البيانات
- لا تشارك ملف `.env` مع أي أحد
