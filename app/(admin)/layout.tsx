"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import {
  LayoutDashboard, ShoppingCart, Users, Wallet, MessageSquare,
  Plug, List, Layers, CreditCard, Trophy, RefreshCw, FileText,
  HelpCircle, File, Settings, DollarSign, Mail, Palette, Search,
  ClipboardList, FlaskConical, Home, LogOut, Menu, X, Zap, Tag,
  BarChart2, History,
} from "lucide-react";

type NavLink = { href: string; label: string; icon: ReactNode; exact?: boolean };
type NavSection = { label: string; links: NavLink[] };

const adminSections: NavSection[] = [
  {
    label: "الإدارة الرئيسية",
    links: [
      { href: "/admin", label: "لوحة التحكم", icon: <LayoutDashboard size={15} />, exact: true },
      { href: "/admin/orders", label: "الطلبات", icon: <ShoppingCart size={15} /> },
      { href: "/admin/users", label: "المستخدمون", icon: <Users size={15} /> },
      { href: "/admin/transactions", label: "المعاملات", icon: <Wallet size={15} /> },
      { href: "/admin/tickets", label: "الدعم الفني", icon: <MessageSquare size={15} /> },
    ],
  },
  {
    label: "الخدمات",
    links: [
      { href: "/admin/providers", label: "المزودون", icon: <Plug size={15} /> },
      { href: "/admin/services", label: "الخدمات", icon: <List size={15} /> },
      { href: "/admin/platforms", label: "المنصات والتصنيفات", icon: <Layers size={15} /> },
    ],
  },
  {
    label: "الإعدادات",
    links: [
      { href: "/admin/payment-methods", label: "طرق الدفع", icon: <CreditCard size={15} /> },
      { href: "/admin/coupons", label: "كوبونات الخصم", icon: <Tag size={15} /> },
      { href: "/admin/account-levels", label: "مستويات الحسابات", icon: <Trophy size={15} /> },
      { href: "/admin/refills", label: "إعادة التعبئة", icon: <RefreshCw size={15} /> },
      { href: "/admin/service-updates", label: "تحديثات الخدمات", icon: <History size={15} /> },
      { href: "/admin/blog", label: "المدونة", icon: <FileText size={15} /> },
      { href: "/admin/faq", label: "الأسئلة الشائعة", icon: <HelpCircle size={15} /> },
      { href: "/admin/pages", label: "الصفحات الثابتة", icon: <File size={15} /> },
    ],
  },
  {
    label: "الإعدادات العامة",
    links: [
      { href: "/admin/settings/general", label: "إعدادات عامة", icon: <Settings size={15} /> },
      { href: "/admin/settings/payment", label: "إعدادات الدفع", icon: <DollarSign size={15} /> },
      { href: "/admin/settings/email", label: "إعدادات الإيميل", icon: <Mail size={15} /> },
      { href: "/admin/settings/appearance", label: "المظهر", icon: <Palette size={15} /> },
      { href: "/admin/settings/seo", label: "SEO", icon: <Search size={15} /> },
    ],
  },
  {
    label: "التحليلات والمراقبة",
    links: [
      { href: "/admin/reports", label: "التقارير المالية", icon: <BarChart2 size={15} /> },
      { href: "/admin/audit-logs", label: "سجلات التدقيق", icon: <ClipboardList size={15} /> },
      { href: "/admin/testing", label: "اختبار النظام", icon: <FlaskConical size={15} /> },
    ],
  },
];

function NavItems({ pathname, isActive }: { pathname: string; isActive: (l: NavLink) => boolean }) {
  return (
    <>
      <nav className="flex flex-col flex-1 overflow-y-auto gap-0">
        {adminSections.map((section) => (
          <div key={section.label} className="mb-1">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 pt-3 pb-1.5">
              {section.label}
            </p>
            {section.links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`sidebar-link ${isActive(l) ? "active" : ""}`}
              >
                <span className="shrink-0 text-current">{l.icon}</span>
                <span>{l.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="border-t border-slate-800 pt-3 space-y-0.5 shrink-0">
        <Link href="/dashboard" className="sidebar-link">
          <Home size={15} />
          <span>لوحة المستخدم</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="sidebar-link w-full text-red-400 hover:text-red-300 hover:bg-red-900/20"
        >
          <LogOut size={15} />
          <span>تسجيل الخروج</span>
        </button>
      </div>
    </>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-xl bg-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-violet-900/50">
        <Zap size={15} className="text-white" strokeWidth={2.5} />
      </div>
      <div>
        <div className="text-sm font-black text-white leading-tight">
          SMM <span className="text-violet-400">Pro</span>
        </div>
        <div className="text-[10px] text-slate-500 leading-tight">لوحة الإدارة</div>
      </div>
    </div>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMobileOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const isActive = (link: NavLink) =>
    link.exact ? pathname === link.href : (pathname ?? "").startsWith(link.href);

  return (
    <div className="min-h-screen bg-[#0F172A]" dir="rtl">
      {/* Mobile header */}
      <div className="md:hidden border-b border-slate-800 px-4 py-3 flex items-center justify-between bg-[#0D1627] sticky top-0 z-40">
        <Logo />
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          aria-label="فتح القائمة"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/70 z-50 md:hidden" onClick={() => setMobileOpen(false)}>
          <div
            className="absolute top-0 right-0 h-full w-68 bg-[#0D1627] border-l border-slate-800 flex flex-col shadow-2xl"
            style={{ width: "17rem" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800 shrink-0">
              <Logo />
              <button
                onClick={() => setMobileOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col flex-1 overflow-hidden px-3 py-2">
              <NavItems pathname={pathname ?? ""} isActive={isActive} />
            </div>
          </div>
        </div>
      )}

      <div className="flex min-h-[calc(100vh-53px)] md:min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-60 flex-col border-l border-slate-800 bg-[#0D1627] px-3 py-4 fixed h-full z-10">
          <div className="mb-4 px-1">
            <Logo />
          </div>
          <NavItems pathname={pathname ?? ""} isActive={isActive} />
        </aside>

        {/* Main content */}
        <div className="flex-1 md:mr-60 min-h-screen overflow-x-hidden">{children}</div>
      </div>
    </div>
  );
}
