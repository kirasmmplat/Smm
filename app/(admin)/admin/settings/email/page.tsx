import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import EmailSettingsForm from "./EmailSettingsForm";
import Link from "next/link";

export default async function EmailSettingsPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") redirect("/dashboard");

  const settings = await prisma.setting.findMany();
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">إعدادات الإيميل</h1>
        <p className="text-slate-400 mt-1">SMTP وإشعارات البريد الإلكتروني</p>
      </div>

      <div className="flex gap-2 mb-6 border-b border-slate-800">
        {[
          { href: "/admin/settings/general", label: "عام" },
          { href: "/admin/settings/payment", label: "الدفع" },
          { href: "/admin/settings/email", label: "الإيميل" },
        ].map((t) => (
          <Link key={t.href} href={t.href}
            className={`px-4 py-2 text-sm rounded-t-lg border-b-2 transition-colors ${
              t.href === "/admin/settings/email"
                ? "text-white border-indigo-500 bg-indigo-500/10"
                : "text-slate-400 border-transparent hover:text-white"
            }`}>
            {t.label}
          </Link>
        ))}
      </div>

      <EmailSettingsForm settings={map} />
    </div>
  );
}
