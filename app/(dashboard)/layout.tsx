"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard, PlusCircle, Package, Wallet, LayoutGrid,
  RefreshCw, Undo2, ClipboardList, Users2, Ticket, Bell, Key, Settings,
  Settings2, LogOut, ListOrdered, BarChart2, Heart,
} from "lucide-react";
import NotificationBell from "@/components/ui/NotificationBell";

const mainLinks = [
  { href: "/dashboard", label: "الرئيسية", Icon: LayoutDashboard, exact: true },
  { href: "/dashboard/new-order", label: "طلب جديد", Icon: PlusCircle },
  { href: "/dashboard/mass-order", label: "طلبات جماعية", Icon: ListOrdered },
  { href: "/dashboard/orders", label: "طلباتي", Icon: Package },
  { href: "/dashboard/add-funds", label: "شحن الرصيد", Icon: Wallet },
  { href: "/dashboard/services", label: "الخدمات", Icon: LayoutGrid },
  { href: "/dashboard/favorites", label: "المفضلة", Icon: Heart },
];

const accountLinks = [
  { href: "/dashboard/analytics", label: "إحصائياتي", Icon: BarChart2 },
  { href: "/dashboard/transactions", label: "المعاملات", Icon: ClipboardList },
  { href: "/dashboard/refills", label: "طلبات الإعادة", Icon: RefreshCw },
  { href: "/dashboard/refund-history", label: "سجل الاسترداد", Icon: Undo2 },
  { href: "/dashboard/updates", label: "تحديثات الخدمات", Icon: ClipboardList },
  { href: "/dashboard/affiliate", label: "الإحالات", Icon: Users2 },
  { href: "/dashboard/tickets", label: "الدعم الفني", Icon: Ticket },
  { href: "/dashboard/notifications", label: "الإشعارات", Icon: Bell },
  { href: "/dashboard/api", label: "مفتاح API", Icon: Key },
  { href: "/dashboard/account", label: "إعدادات الحساب", Icon: Settings },
];

const allLinks = [...mainLinks, ...accountLinks];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (mobileOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (link: { href: string; exact?: boolean }) =>
    link.exact ? pathname === link.href : (pathname ?? "").startsWith(link.href);

  return (
    <div className="min-h-screen bg-violet-50/50" dir="rtl">
      {/* Mobile Header */}
      <header className="md:hidden bg-white border-b border-violet-100 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-sm">S</div>
          <span className="font-black text-gray-900 text-sm">SMM <span className="text-violet-600">Pro</span></span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-emerald-600" dir="ltr">
            ${parseFloat((session?.user as { balance?: string })?.balance ?? "0").toFixed(2)}
          </span>
          <NotificationBell />
          <button onClick={() => setMobileOpen(true)} className="w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex flex-col items-center justify-center gap-1" aria-label="القائمة">
            <span className="block w-4 h-0.5 bg-violet-600 rounded" />
            <span className="block w-4 h-0.5 bg-violet-600 rounded" />
            <span className="block w-3 h-0.5 bg-violet-600 rounded" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div className="absolute top-0 right-0 h-full w-[88vw] max-w-80 bg-white shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-violet-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-sm">S</div>
                <span className="font-black text-gray-900">SMM <span className="text-violet-600">Pro</span></span>
              </div>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400 hover:text-gray-700 w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            {session?.user && (
              <div className="px-4 py-3 bg-violet-50 border-b border-violet-100">
                <p className="text-sm font-bold text-gray-900 truncate">{session.user.name}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-violet-600">{(session.user as { accountLevel?: string }).accountLevel ?? "جديد"}</span>
                  <span className="text-sm font-black text-emerald-600" dir="ltr">${parseFloat((session?.user as { balance?: string })?.balance ?? "0").toFixed(2)}</span>
                </div>
              </div>
            )}
            <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
              {allLinks.map((l) => (
                <Link key={l.href} href={l.href} className={isActive(l) ? "sidebar-link-active" : "sidebar-link"}>
                  <l.Icon size={16} /><span>{l.label}</span>
                </Link>
              ))}
            </nav>
            <div className="border-t border-violet-100 p-3 space-y-1">
              {(session?.user as { role?: string })?.role === "ADMIN" && (
                <Link href="/admin" className="sidebar-link text-orange-600"><Settings2 size={16} /><span>لوحة الأدمن</span></Link>
              )}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="sidebar-link w-full text-red-600 hover:bg-red-50">
                <LogOut size={16} /><span>تسجيل الخروج</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-[260px] flex-col bg-white border-l border-violet-100 fixed right-0 top-0 h-full z-20 shadow-sm">
          <div className="px-4 py-5 border-b border-violet-100">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center text-white font-black text-sm shadow-md">S</div>
              <span className="text-lg font-black text-gray-900">SMM <span className="text-violet-600">Pro</span></span>
            </Link>
            {session?.user && (
              <div className="mt-3 bg-violet-50 rounded-xl p-3">
                <p className="text-sm font-bold text-gray-900 truncate">{session.user.name}</p>
                <p className="text-xs text-gray-500 truncate">{session.user.email}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-violet-600 font-semibold">{(session.user as { accountLevel?: string }).accountLevel ?? "جديد"}</span>
                  <span className="text-sm font-black text-emerald-600" dir="ltr">${parseFloat((session?.user as { balance?: string })?.balance ?? "0").toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
          <nav className="flex flex-col gap-1 p-3 flex-1 overflow-y-auto">
            <p className="text-xs font-bold text-gray-400 uppercase px-3 py-2 mt-1">القائمة الرئيسية</p>
            {mainLinks.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l) ? "sidebar-link-active" : "sidebar-link"}>
                <l.Icon size={16} /><span>{l.label}</span>
              </Link>
            ))}
            <p className="text-xs font-bold text-gray-400 uppercase px-3 py-2 mt-2">الحساب والخدمات</p>
            {accountLinks.map((l) => (
              <Link key={l.href} href={l.href} className={isActive(l) ? "sidebar-link-active" : "sidebar-link"}>
                <l.Icon size={16} /><span>{l.label}</span>
              </Link>
            ))}
          </nav>
          <div className="border-t border-violet-100 p-3 space-y-1">
            {(session?.user as { role?: string })?.role === "ADMIN" && (
              <Link href="/admin" className="sidebar-link text-orange-600 hover:bg-orange-50"><Settings2 size={16} /><span>لوحة الأدمن</span></Link>
            )}
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="sidebar-link w-full text-red-600 hover:bg-red-50">
              <LogOut size={16} /><span>تسجيل الخروج</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:mr-[260px] px-4 py-4 sm:px-5 md:p-8 min-h-screen overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
