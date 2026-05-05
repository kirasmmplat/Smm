import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ApiKeyManager from "./ApiKeyManager";

export default async function ApiPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { apiKey: true, name: true, email: true },
  });

  if (!user) redirect("/login");

  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">مفتاح API</h1>
        <p className="text-slate-400 mt-1">استخدم مفتاح API للتكامل مع أنظمتك الخارجية</p>
      </div>

      <ApiKeyManager apiKey={user.apiKey} baseUrl={baseUrl} />

      {/* Documentation */}
      <div className="card mt-6">
        <h2 className="text-lg font-semibold text-white mb-4">توثيق API</h2>
        <p className="text-slate-400 text-sm mb-4">
          تستخدم منصتنا معيار SMM Panel API القياسي. أرسل طلباتك كـ POST إلى:
        </p>
        <div className="bg-slate-900 rounded-lg p-3 font-mono text-sm text-indigo-300 mb-6" dir="ltr">
          {baseUrl}/api/v2
        </div>

        <div className="space-y-6">
          {/* Get services */}
          <div>
            <h3 className="text-slate-200 font-medium mb-2">جلب الخدمات</h3>
            <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300" dir="ltr">
              <div className="text-slate-500 mb-2"># POST /api/v2</div>
              <div>key=YOUR_API_KEY</div>
              <div>action=services</div>
            </div>
          </div>

          {/* Add order */}
          <div>
            <h3 className="text-slate-200 font-medium mb-2">إنشاء طلب</h3>
            <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300" dir="ltr">
              <div className="text-slate-500 mb-2"># POST /api/v2</div>
              <div>key=YOUR_API_KEY</div>
              <div>action=add</div>
              <div>service=SERVICE_ID</div>
              <div>link=https://...</div>
              <div>quantity=1000</div>
            </div>
          </div>

          {/* Check status */}
          <div>
            <h3 className="text-slate-200 font-medium mb-2">التحقق من حالة الطلب</h3>
            <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300" dir="ltr">
              <div className="text-slate-500 mb-2"># POST /api/v2</div>
              <div>key=YOUR_API_KEY</div>
              <div>action=status</div>
              <div>order=ORDER_ID</div>
            </div>
          </div>

          {/* Balance */}
          <div>
            <h3 className="text-slate-200 font-medium mb-2">رصيد الحساب</h3>
            <div className="bg-slate-900 rounded-lg p-4 text-xs font-mono text-slate-300" dir="ltr">
              <div className="text-slate-500 mb-2"># POST /api/v2</div>
              <div>key=YOUR_API_KEY</div>
              <div>action=balance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
