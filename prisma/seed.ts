import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function cuid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

async function main() {
  console.log("Seeding database...");

  // ── 1. Account Levels ──────────────────────────────────────────────────────
  const levels = [
    { name: "جديد", slug: "new", minSpent: 0, discountPercent: 0, color: "#6b7280", icon: "🌱", sortOrder: 1, benefits: JSON.stringify(["وصول لجميع الخدمات", "دعم فني أساسي"]) },
    { name: "برونزي", slug: "bronze", minSpent: 50, discountPercent: 3, color: "#92400e", icon: "🥉", sortOrder: 2, benefits: JSON.stringify(["خصم 3% دائم", "أولوية في الدعم الفني"]) },
    { name: "فضي", slug: "silver", minSpent: 200, discountPercent: 5, color: "#6b7280", icon: "🥈", sortOrder: 3, benefits: JSON.stringify(["خصم 5% دائم", "دعم سريع", "إحصائيات متقدمة"]) },
    { name: "ذهبي", slug: "gold", minSpent: 500, discountPercent: 8, color: "#d97706", icon: "🥇", sortOrder: 4, benefits: JSON.stringify(["خصم 8% دائم", "دعم VIP", "وصول للخدمات الحصرية"]) },
    { name: "بلاتيني", slug: "platinum", minSpent: 2000, discountPercent: 12, color: "#7c3aed", icon: "💎", sortOrder: 5, benefits: JSON.stringify(["خصم 12% دائم", "مدير حساب مخصص", "خدمات Premium"]) },
    { name: "ماسي", slug: "diamond", minSpent: 10000, discountPercent: 15, color: "#0891b2", icon: "💠", sortOrder: 6, benefits: JSON.stringify(["خصم 15% دائم", "خدمة شخصية 24/7", "شروط مخصصة"]) },
  ];

  for (const level of levels) {
    await prisma.accountLevel.upsert({
      where: { slug: level.slug },
      update: level,
      create: level,
    });
  }
  console.log("Account levels: OK");

  // ── 2. Platforms ───────────────────────────────────────────────────────────
  const platforms = [
    { name: "إنستقرام", slug: "instagram", icon: "📸", color: "#E1306C", sortOrder: 1, description: "زيادة المتابعين واللايكات والمشاهدات على إنستقرام" },
    { name: "تيك توك", slug: "tiktok", icon: "🎵", color: "#000000", sortOrder: 2, description: "متابعين ومشاهدات ولايكات تيك توك" },
    { name: "يوتيوب", slug: "youtube", icon: "▶️", color: "#FF0000", sortOrder: 3, description: "مشتركين ومشاهدات ولايكات يوتيوب" },
    { name: "تويتر X", slug: "twitter", icon: "🐦", color: "#1DA1F2", sortOrder: 4, description: "متابعين وريتويت ولايكات تويتر" },
    { name: "فيسبوك", slug: "facebook", icon: "👥", color: "#1877F2", sortOrder: 5, description: "لايكات الصفحة ومتابعين وتفاعلات" },
    { name: "تيليجرام", slug: "telegram", icon: "✈️", color: "#229ED9", sortOrder: 6, description: "أعضاء القنوات والمجموعات ومشاهدات" },
    { name: "سناب شات", slug: "snapchat", icon: "👻", color: "#FFFC00", sortOrder: 7, description: "متابعين سناب شات وتعزيز المشاهدات" },
    { name: "ثريدز", slug: "threads", icon: "🔗", color: "#000000", sortOrder: 8, description: "متابعين ولايكات ثريدز" },
    { name: "ساوند كلاود", slug: "soundcloud", icon: "🎧", color: "#ff5500", sortOrder: 9, description: "مشاهدات وإعجابات ساوند كلاود" },
    { name: "سبوتيفاي", slug: "spotify", icon: "🎼", color: "#1DB954", sortOrder: 10, description: "مشاهدات وإعجابات سبوتيفاي" },
  ];

  const createdPlatforms: Record<string, string> = {};
  for (const platform of platforms) {
    const p = await prisma.platform.upsert({
      where: { slug: platform.slug },
      update: platform,
      create: platform,
    });
    createdPlatforms[platform.slug] = p.id;
  }
  console.log("Platforms: OK");

  // ── 3. Categories & ServiceTypes ──────────────────────────────────────────
  type CatDef = { name: string; slug: string; types: { name: string }[] };
  const categoryDefs: Record<string, CatDef[]> = {
    instagram: [
      { name: "متابعون", slug: "followers", types: [{ name: "متابعون عرب" }, { name: "متابعون عالميون" }, { name: "متابعون حقيقيون" }, { name: "متابعون مميزون" }] },
      { name: "لايكات", slug: "likes", types: [{ name: "لايكات عرب" }, { name: "لايكات عالمية" }, { name: "لايكات مضمونة" }] },
      { name: "مشاهدات", slug: "views", types: [{ name: "مشاهدات ريلز" }, { name: "مشاهدات ستوري" }, { name: "مشاهدات بوست" }] },
      { name: "تعليقات", slug: "comments", types: [{ name: "تعليقات عربية" }, { name: "تعليقات إيجابية" }] },
      { name: "حفظ", slug: "saves", types: [{ name: "حفظ منشور" }] },
    ],
    tiktok: [
      { name: "متابعون", slug: "followers", types: [{ name: "متابعون عرب" }, { name: "متابعون عالميون" }, { name: "متابعون حقيقيون" }] },
      { name: "مشاهدات", slug: "views", types: [{ name: "مشاهدات فيديو" }, { name: "مشاهدات مباشر" }] },
      { name: "لايكات", slug: "likes", types: [{ name: "لايكات عرب" }, { name: "لايكات عالمية" }] },
      { name: "مشاركات", slug: "shares", types: [{ name: "مشاركات فيديو" }] },
    ],
    youtube: [
      { name: "مشتركون", slug: "subscribers", types: [{ name: "مشتركون عالميون" }, { name: "مشتركون حقيقيون" }] },
      { name: "مشاهدات", slug: "views", types: [{ name: "مشاهدات فيديو" }, { name: "مشاهدات محتفظة" }, { name: "مشاهدات عالية الجودة" }] },
      { name: "لايكات", slug: "likes", types: [{ name: "لايكات فيديو" }] },
      { name: "تعليقات", slug: "comments", types: [{ name: "تعليقات عربية" }, { name: "تعليقات مخصصة" }] },
    ],
    twitter: [
      { name: "متابعون", slug: "followers", types: [{ name: "متابعون عرب" }, { name: "متابعون عالميون" }] },
      { name: "ريتويت", slug: "retweets", types: [{ name: "ريتويت عام" }] },
      { name: "لايكات", slug: "likes", types: [{ name: "لايكات تويتة" }] },
    ],
    facebook: [
      { name: "لايكات الصفحة", slug: "page-likes", types: [{ name: "لايكات عرب" }, { name: "لايكات عالمية" }] },
      { name: "متابعون", slug: "followers", types: [{ name: "متابعو الصفحة" }] },
      { name: "مشاهدات", slug: "views", types: [{ name: "مشاهدات فيديو" }] },
    ],
    telegram: [
      { name: "أعضاء", slug: "members", types: [{ name: "أعضاء قناة" }, { name: "أعضاء مجموعة" }, { name: "أعضاء عرب" }] },
      { name: "مشاهدات", slug: "views", types: [{ name: "مشاهدات بوست" }, { name: "مشاهدات سريعة" }] },
    ],
  };

  const createdServiceTypes: string[] = [];

  for (const [platformSlug, cats] of Object.entries(categoryDefs)) {
    const platformId = createdPlatforms[platformSlug];
    if (!platformId) continue;

    for (const catDef of cats) {
      let cat = await prisma.category.findFirst({
        where: { slug: catDef.slug, platformId },
      });
      if (!cat) {
        cat = await prisma.category.create({
          data: { name: catDef.name, slug: catDef.slug, platformId },
        });
      }

      for (const typeDef of catDef.types) {
        let st = await prisma.serviceType.findFirst({
          where: { name: typeDef.name, categoryId: cat.id },
        });
        if (!st) {
          st = await prisma.serviceType.create({
            data: { name: typeDef.name, categoryId: cat.id },
          });
        }
        createdServiceTypes.push(st.id);
      }
    }
  }
  console.log(`Categories/ServiceTypes: OK (${createdServiceTypes.length} types)`);

  // ── 4. Provider ────────────────────────────────────────────────────────────
  let provider = await prisma.provider.findFirst({ where: { name: "Demo Provider" } });
  if (!provider) {
    provider = await prisma.provider.create({
      data: {
        name: "Demo Provider",
        url: "https://demo-provider.example.com/api/v2",
        apiKey: "demo_api_key_replace_me",
        markup: 30,
        status: "ACTIVE",
        currency: "USD",
        balance: 500,
        totalServices: createdServiceTypes.length * 3,
      },
    });
  }
  console.log("Provider: OK");

  // ── 5. Services ───────────────────────────────────────────────────────────
  const existingServices = await prisma.service.count({ where: { providerId: provider.id } });

  if (existingServices === 0 && createdServiceTypes.length > 0) {
    const serviceTemplates = [
      { suffix: "— جودة عالية", rateMultiplier: 1.0, avgTime: 30, refill: true, cancel: true, isFeatured: true },
      { suffix: "— اقتصادي", rateMultiplier: 0.6, avgTime: 60, refill: false, cancel: false, isFeatured: false },
      { suffix: "— فوري سريع", rateMultiplier: 1.5, avgTime: 10, refill: true, cancel: true, isFeatured: true },
    ];

    const services = [];
    let counter = 1000;
    for (const stId of createdServiceTypes.slice(0, 30)) {
      const st = await prisma.serviceType.findUnique({
        where: { id: stId },
        include: { category: { include: { platform: true } } },
      });
      if (!st) continue;

      for (const tmpl of serviceTemplates) {
        const baseRate = 0.5 + Math.random() * 2;
        const providerRate = Number((baseRate * tmpl.rateMultiplier).toFixed(4));
        const ourRate = Number((providerRate * 1.35).toFixed(4));

        services.push({
          name: `${st.category.platform.icon} ${st.name} ${tmpl.suffix}`,
          description: `خدمة ${st.name} لـ ${st.category.platform.name} — تبدأ خلال ${tmpl.avgTime} دقيقة`,
          providerId: provider!.id,
          providerServiceId: String(counter++),
          serviceTypeId: stId,
          providerRate,
          ourRate,
          min: 100,
          max: 50000,
          status: "ACTIVE" as const,
          refill: tmpl.refill,
          cancel: tmpl.cancel,
          isFeatured: tmpl.isFeatured,
          avgTime: tmpl.avgTime,
          avgTimeUnit: "minutes",
          sortOrder: Math.floor(Math.random() * 100),
          totalOrders: Math.floor(Math.random() * 500),
        });
      }
    }

    await prisma.service.createMany({ data: services });
    await prisma.provider.update({
      where: { id: provider.id },
      data: { totalServices: services.length },
    });
    console.log(`Services: OK (${services.length} services created)`);
  } else {
    console.log(`Services: skipped (${existingServices} already exist)`);
  }

  // ── 6. Payment Methods ─────────────────────────────────────────────────────
  const paymentMethods = [
    {
      name: "بطاقة ائتمان / Stripe",
      slug: "stripe",
      type: "STRIPE",
      description: "ادفع بأي بطاقة فيزا أو ماستركارد — الرصيد يُضاف فوراً",
      isActive: true,
      isAutomatic: true,
      minAmount: 5,
      bonusPercent: 0,
      icon: "💳",
      sortOrder: 1,
    },
    {
      name: "USDT TRC20",
      slug: "usdt-trc20",
      type: "CRYPTO",
      description: "تحويل USDT على شبكة TRC20 — سريع وبدون رسوم عالية",
      instructions: "أرسل USDT (TRC20) إلى العنوان: TXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nثم أرسل الإيصال للدعم لتأكيد الإيداع",
      isActive: true,
      isAutomatic: false,
      minAmount: 5,
      bonusPercent: 0,
      icon: "₮",
      sortOrder: 2,
    },
    {
      name: "USDT ERC20",
      slug: "usdt-erc20",
      type: "CRYPTO",
      description: "تحويل USDT على شبكة Ethereum ERC20",
      instructions: "أرسل USDT (ERC20) إلى: 0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxXXXX\nملاحظة: رسوم شبكة إيثيريوم مرتفعة، استخدم TRC20 للمبالغ الصغيرة",
      isActive: true,
      isAutomatic: false,
      minAmount: 10,
      bonusPercent: 0,
      icon: "Ξ",
      sortOrder: 3,
    },
    {
      name: "فودافون كاش / اتصالات",
      slug: "vodafone-cash",
      type: "MANUAL",
      description: "تحويل عبر فودافون كاش أو اتصالات كاش (مصر)",
      instructions: "حوّل المبلغ على الرقم: 01xxxxxxxxx (اسم: محمد ...)\nأرسل صورة الإيصال في تذكرة دعم بعد التحويل",
      isActive: true,
      isAutomatic: false,
      minAmount: 10,
      bonusPercent: 2,
      icon: "📱",
      sortOrder: 4,
    },
    {
      name: "تحويل بنكي محلي",
      slug: "bank-local",
      type: "MANUAL",
      description: "تحويل بنكي داخل المملكة أو مصر أو الإمارات",
      instructions: "بنك الراجحي\nاسم الحساب: [اسم صاحب الموقع]\nرقم الآيبان: SA00 0000 0000 0000 0000 0000\nالسويفت: RJHISARI\nأرسل صورة تأكيد التحويل للدعم الفني",
      isActive: true,
      isAutomatic: false,
      minAmount: 20,
      bonusPercent: 0,
      icon: "🏦",
      sortOrder: 5,
    },
    {
      name: "Bitcoin BTC",
      slug: "btc",
      type: "CRYPTO",
      description: "إيداع بعملة Bitcoin",
      instructions: "أرسل BTC إلى: bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nالحد الأدنى 0.0001 BTC — الإيداع يؤكد بعد تأكيد واحد",
      isActive: true,
      isAutomatic: false,
      minAmount: 10,
      bonusPercent: 0,
      icon: "₿",
      sortOrder: 6,
    },
  ];

  for (const pm of paymentMethods) {
    await prisma.paymentMethod.upsert({
      where: { slug: pm.slug },
      update: pm,
      create: pm,
    });
  }
  console.log("Payment methods: OK");

  // ── 7. Settings ────────────────────────────────────────────────────────────
  const settings = [
    { key: "site_name", value: "SMM Pro", group: "general" },
    { key: "site_tagline", value: "أفضل وأرخص منصة سوشيال ميديا", group: "general" },
    { key: "site_logo", value: "/logo.png", group: "general" },
    { key: "maintenance_mode", value: "false", group: "general" },
    { key: "default_currency", value: "USD", group: "general" },
    { key: "registration_enabled", value: "true", group: "auth" },
    { key: "min_deposit", value: "5", group: "payments" },
    { key: "max_deposit", value: "10000", group: "payments" },
    { key: "affiliate_commission", value: "5", group: "affiliate" },
    { key: "support_email", value: "support@smmpro.com", group: "general" },
    { key: "stripe_enabled", value: "false", group: "payments" },
    { key: "manual_enabled", value: "true", group: "payments" },
    { key: "manual_min", value: "5", group: "payments" },
    { key: "crypto_enabled", value: "true", group: "payments" },
    { key: "google_analytics", value: "", group: "seo" },
    { key: "facebook_pixel", value: "", group: "seo" },
    { key: "seo_title", value: "SMM Pro — أفضل منصة خدمات سوشيال ميديا", group: "seo" },
    { key: "seo_description", value: "أرخص وأفضل خدمات السوشيال ميديا", group: "seo" },
  ];

  for (const s of settings) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }
  console.log("Settings: OK");

  // ── 8. Admin User ─────────────────────────────────────────────────────────
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@smmpro.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "Admin@12345";
  const adminLevel = await prisma.accountLevel.findFirst({ where: { slug: "diamond" } });

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const hashedPwd = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: "مدير النظام",
        username: "admin",
        email: adminEmail,
        password: hashedPwd,
        role: "ADMIN",
        referralCode: "ADMIN001",
        apiKey: "admin_key_" + Date.now(),
        accountLevelId: adminLevel?.id,
        discountPercent: 100,
        balance: 9999,
        totalSpent: 50000,
      },
    });
    console.log(`Admin created: ${adminEmail} / ${adminPassword}`);
  } else {
    console.log("Admin: already exists");
  }

  // ── 9. FAQ Items ──────────────────────────────────────────────────────────
  const existingFaqs = await prisma.faqItem.count();
  if (existingFaqs === 0) {
    const faqs = [
      { question: "كيف أبدأ الطلب؟", answer: "اشحن رصيدك أولاً من صفحة 'شحن الرصيد'، ثم اختر الخدمة المناسبة وأدخل رابط حسابك أو منشورك والكمية المطلوبة وأضغط 'إرسال الطلب'.", sortOrder: 1, category: "orders" },
      { question: "هل الخدمات آمنة لحسابي؟", answer: "نعم، جميع خدماتنا آمنة تماماً ولا نحتاج كلمة مرورك أبداً. نحتاج فقط رابط ملفك الشخصي أو المنشور المحدد.", sortOrder: 2, category: "general" },
      { question: "ما هي طرق الدفع المتاحة؟", answer: "نقبل بطاقات الائتمان (Visa/Mastercard) عبر Stripe، والعملات الرقمية (USDT TRC20, BTC, ETH)، والتحويل البنكي المحلي، وفودافون كاش.", sortOrder: 3, category: "payments" },
      { question: "هل يوجد ضمان للخدمات؟", answer: "نعم، جميع الخدمات التي تحمل علامة (رفيل) مضمونة لفترة 30-60 يوماً ويمكن إعادة تنفيذها مجاناً في حال انخفاض العدد.", sortOrder: 4, category: "orders" },
      { question: "كم يستغرق تنفيذ الطلب؟", answer: "معظم الطلبات تبدأ خلال 1-30 دقيقة وتكتمل في نفس اليوم. بعض الخدمات الكبيرة (أكثر من 50,000) قد تستغرق 24-72 ساعة.", sortOrder: 5, category: "orders" },
      { question: "ماذا أفعل إذا تأخر طلبي؟", answer: "إذا تأخر طلبك عن الوقت المتوقع، يمكنك فتح تذكرة دعم من لوحة التحكم وسنتابع الأمر فوراً مع المزود.", sortOrder: 6, category: "support" },
      { question: "هل يمكن إلغاء الطلب واسترداد الرصيد؟", answer: "يمكن إلغاء الطلب إذا كان في حالة 'انتظار' أو 'جاري التنفيذ' — سيُعاد الرصيد تلقائياً لمحفظتك.", sortOrder: 7, category: "orders" },
      { question: "هل يوجد API للمطورين والوكالات؟", answer: "نعم، لدينا API كاملة متوافقة مع معظم بانلات SMM. يمكنك الحصول على مفتاح API من لوحة التحكم.", sortOrder: 8, category: "api" },
      { question: "ما هو برنامج الإحالة؟", answer: "تحصل على عمولة 5% من كل إيداع يقوم به المستخدمون الذين دعوتهم. يمكن سحب العمولات لرصيدك متى شئت.", sortOrder: 9, category: "affiliate" },
      { question: "كيف أتواصل مع الدعم الفني؟", answer: "يمكنك فتح تذكرة دعم من لوحة التحكم وسيرد عليك فريق الدعم خلال ساعات قليلة. دعمنا متاح 24/7.", sortOrder: 10, category: "support" },
    ];

    await prisma.faqItem.createMany({ data: faqs });
    console.log("FAQ: OK");
  } else {
    console.log("FAQ: already exists");
  }

  // ── 10. Blog Posts (sample) ───────────────────────────────────────────────
  const existingPosts = await prisma.blogPost.count();
  if (existingPosts === 0) {
    const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
    if (adminUser) {
      const posts = [
        {
          title: "كيف تزيد متابعيك على إنستقرام بسرعة وبأمان",
          slug: "how-to-grow-instagram-followers",
          excerpt: "دليل شامل لزيادة المتابعين على إنستقرام باستخدام أفضل الاستراتيجيات والأدوات",
          content: `<h2>مقدمة</h2><p>يبحث الكثيرون عن طرق فعّالة لزيادة متابعيهم على إنستقرام، سواء كانوا أفراداً يريدون تنمية حساباتهم الشخصية، أو أصحاب أعمال يسعون لتعزيز حضورهم الرقمي.</p><h2>أفضل الطرق لزيادة المتابعين</h2><ul><li>نشر محتوى عالي الجودة باستمرار</li><li>استخدام الهاشتاقات المناسبة</li><li>التفاعل مع الجمهور</li><li>استخدام خدمات SMM Panel الموثوقة</li></ul>`,
          isPublished: true,
          publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          authorId: adminUser.id,
          views: 1250,
          seoTitle: "زيادة متابعين إنستقرام — الدليل الشامل 2025",
          seoDesc: "تعرف على أفضل الطرق لزيادة متابعيك على إنستقرام بسرعة وبأمان في 2025",
        },
        {
          title: "مقارنة أفضل بانلات SMM في 2025",
          slug: "best-smm-panels-2025",
          excerpt: "نقارن بين أفضل بانلات خدمات السوشيال ميديا لمساعدتك في اختيار الأنسب لك",
          content: `<h2>ما هو SMM Panel؟</h2><p>SMM Panel هو منصة متخصصة تتيح لك شراء خدمات السوشيال ميديا مثل المتابعين واللايكات والمشاهدات بأسعار منخفضة وبكميات كبيرة.</p><h2>معايير اختيار البانل الأفضل</h2><ul><li>جودة الخدمات وضمان الاسترداد</li><li>سرعة التنفيذ</li><li>طرق الدفع المتاحة</li><li>جودة الدعم الفني</li></ul>`,
          isPublished: true,
          publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          authorId: adminUser.id,
          views: 890,
          seoTitle: "أفضل بانلات SMM Panel في 2025 — مقارنة شاملة",
          seoDesc: "مقارنة شاملة لأفضل منصات SMM Panel في 2025 مع الأسعار والمميزات",
        },
      ];

      for (const post of posts) {
        await prisma.blogPost.create({ data: post }).catch(() => {});
      }
      console.log("Blog posts: OK");
    }
  } else {
    console.log("Blog: already exists");
  }

  console.log("\nSeed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
