import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-auth";
import { sendNewOrderAdminTelegram } from "@/lib/telegram";
import { submitOrderToProvider } from "@/lib/provider-api";

export async function GET(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = req.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search");
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const where: Record<string, unknown> = { userId: auth.user.id };
  if (status && status !== "ALL") where.status = status;
  if (search) {
    where.OR = [
      { link: { contains: search, mode: "insensitive" } },
      { service: { name: { contains: search, mode: "insensitive" } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        service: {
          include: {
            serviceType: {
              include: {
                category: {
                  include: { platform: { select: { name: true, icon: true } } },
                },
              },
            },
          },
        },
      },
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, totalPages: Math.ceil(total / limit) });
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json() as {
      serviceId: string; link: string; quantity: number;
      couponCode?: string; dripFeed?: boolean; dripInterval?: number; dripQuantity?: number;
    };
    const { serviceId, link, quantity, couponCode, dripFeed, dripInterval, dripQuantity } = body;

    if (!serviceId || !link || !quantity) {
      return NextResponse.json({ message: "بيانات ناقصة" }, { status: 400 });
    }

    const service = await prisma.service.findFirst({
      where: { id: serviceId, status: "ACTIVE" },
      include: { provider: true },
    });

    if (!service) return NextResponse.json({ message: "الخدمة غير متاحة" }, { status: 404 });

    if (quantity < service.min || quantity > service.max) {
      return NextResponse.json({
        message: `الكمية يجب أن تكون بين ${service.min} و ${service.max}`,
      }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      include: { accountLevel: true },
    });
    if (!user) return NextResponse.json({ message: "المستخدم غير موجود" }, { status: 404 });

    // Apply account level discount
    const userDiscount = user.discountPercent ?? 0;
    let rate = service.ourRate.toNumber();
    if (userDiscount > 0) rate = rate * (1 - userDiscount / 100);

    const originalCharge = (rate * quantity) / 1000;
    let finalCharge = originalCharge;
    let appliedCoupon: { id: string; code: string } | null = null;
    let couponDiscountAmt = 0;

    // Validate and apply coupon
    if (couponCode) {
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.trim().toUpperCase() } });
      if (coupon && coupon.isActive) {
        const now = new Date();
        const validTime = (!coupon.startsAt || coupon.startsAt <= now) && (!coupon.expiresAt || coupon.expiresAt >= now);
        const validUsage = !coupon.usageLimit || coupon.usedCount < coupon.usageLimit;
        const userUsage = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId: auth.user.id } });
        const validUserLimit = userUsage < coupon.perUserLimit;
        const validMin = !coupon.minOrderAmount || originalCharge >= coupon.minOrderAmount.toNumber();

        if (validTime && validUsage && validUserLimit && validMin) {
          if (coupon.type === "PERCENT") {
            couponDiscountAmt = (originalCharge * coupon.value.toNumber()) / 100;
            if (coupon.maxDiscount) couponDiscountAmt = Math.min(couponDiscountAmt, coupon.maxDiscount.toNumber());
          } else {
            couponDiscountAmt = Math.min(coupon.value.toNumber(), originalCharge);
          }
          finalCharge = Math.max(0, originalCharge - couponDiscountAmt);
          appliedCoupon = { id: coupon.id, code: coupon.code };
        }
      }
    }

    if (user.balance.toNumber() < finalCharge) {
      return NextResponse.json({ message: "رصيدك غير كافٍ، يرجى شحن الرصيد أولاً" }, { status: 402 });
    }

    // Create order + deduct balance in a transaction
    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: {
          userId: auth.user.id,
          serviceId,
          providerId: service.providerId,
          link,
          quantity,
          charge: finalCharge,
          originalCharge: couponDiscountAmt > 0 ? originalCharge : null,
          couponCode: appliedCoupon?.code ?? null,
          couponDiscount: couponDiscountAmt > 0 ? parseFloat(couponDiscountAmt.toFixed(6)) : null,
          dripFeed: dripFeed ?? false,
          dripInterval: dripFeed ? (dripInterval ?? null) : null,
          dripQuantity: dripFeed ? (dripQuantity ?? null) : null,
          notes: null,
          status: "PENDING",
        },
      }),
      prisma.user.update({
        where: { id: auth.user.id },
        data: { balance: { decrement: finalCharge }, totalSpent: { increment: finalCharge } },
      }),
      prisma.transaction.create({
        data: {
          userId: auth.user.id,
          type: "ORDER_CHARGE",
          amount: -finalCharge,
          balanceBefore: user.balance.toNumber(),
          balanceAfter: user.balance.toNumber() - finalCharge,
          status: "COMPLETED",
          notes: `طلب خدمة: ${service.name}${appliedCoupon ? ` (كوبون: ${appliedCoupon.code})` : ""}`,
        },
      }),
    ]);

    // Update coupon usage count + record usage (outside main tx to avoid coupling)
    if (appliedCoupon) {
      await prisma.$transaction([
        prisma.coupon.update({
          where: { id: appliedCoupon.id },
          data: { usedCount: { increment: 1 } },
        }),
        prisma.couponUsage.create({
          data: {
            couponId: appliedCoupon.id,
            userId: auth.user.id,
            orderId: order.id,
            discount: couponDiscountAmt,
          },
        }),
      ]);
    }

    // Auto account level upgrade
    const newTotalSpent = user.totalSpent.toNumber() + finalCharge;
    const nextLevel = await prisma.accountLevel.findFirst({
      where: { minSpent: { lte: newTotalSpent } },
      orderBy: { minSpent: "desc" },
    });
    if (nextLevel && nextLevel.id !== user.accountLevelId) {
      await prisma.user.update({
        where: { id: auth.user.id },
        data: { accountLevelId: nextLevel.id, discountPercent: nextLevel.discountPercent },
      });
      await prisma.notification.create({
        data: {
          userId: auth.user.id,
          title: "ترقية مستوى الحساب",
          message: `تهانينا! تم ترقية حسابك إلى مستوى "${nextLevel.name}" مع خصم ${nextLevel.discountPercent.toString()}% على جميع الطلبات`,
          type: "LEVEL_UP",
          link: "/dashboard",
        },
      });
    }

    // Auto-submit to provider
    if (service.provider && service.provider.status === "ACTIVE") {
      void (async () => {
        const result = await submitOrderToProvider({
          apiUrl: service.provider.url,
          apiKey: service.provider.apiKey,
          providerServiceId: service.providerServiceId,
          link,
          quantity,
        });
        if (result.success) {
          await prisma.order.update({
            where: { id: order.id },
            data: { providerOrderId: result.providerOrderId, status: "IN_PROGRESS" },
          });
        } else {
          await prisma.order.update({
            where: { id: order.id },
            data: { notes: `فشل إرسال للمزود: ${result.error}` },
          });
        }
      })();
    }

    // Telegram notifications to admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN", telegramChatId: { not: null } },
      select: { telegramChatId: true },
    });
    for (const admin of admins) {
      if (admin.telegramChatId) {
        void sendNewOrderAdminTelegram({
          adminChatId: admin.telegramChatId,
          orderId: order.id,
          userName: user.name,
          serviceName: service.name,
          quantity,
          charge: finalCharge,
        });
      }
    }

    return NextResponse.json({
      id: order.id,
      message: "تم إنشاء الطلب بنجاح",
      charge: finalCharge,
      discount: couponDiscountAmt,
    }, { status: 201 });
  } catch (err) {
    console.error("Order creation error:", err);
    return NextResponse.json({ message: "خطأ في الخادم" }, { status: 500 });
  }
}
