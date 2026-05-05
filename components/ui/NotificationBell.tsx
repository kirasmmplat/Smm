"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Bell, CheckCheck, BellRing } from "lucide-react";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const fetchCount = async () => {
    try {
      const r = await fetch("/api/notifications?unread=1", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json() as { unreadCount: number };
        setUnread(d.unreadCount ?? 0);
      }
    } catch { /* silent */ }
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      if (r.ok) {
        const d = await r.json() as { notifications: Notification[]; unreadCount: number };
        setNotifications(d.notifications ?? []);
        setUnread(d.unreadCount ?? 0);
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  const markAll = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    setUnread(0);
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markOne = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    setUnread((c) => Math.max(0, c - 1));
  };

  // Poll unread count every 30s
  useEffect(() => {
    void fetchCount();
    const interval = setInterval(() => { void fetchCount(); }, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleOpen = () => {
    if (!open) void fetchAll();
    setOpen((v) => !v);
  };

  const typeIcon: Record<string, string> = {
    LEVEL_UP: "🏆",
    ORDER_CANCELED: "❌",
    REFILL: "🔄",
    SYSTEM: "ℹ️",
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative w-9 h-9 rounded-xl bg-violet-50 border border-violet-200 flex items-center justify-center text-violet-600 hover:bg-violet-100 transition-colors"
        aria-label="الإشعارات"
      >
        {unread > 0 ? <BellRing size={16} className="animate-pulse" /> : <Bell size={16} />}
        {unread > 0 && (
          <span className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 text-white text-[10px] font-black rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 w-80 bg-white border border-violet-100 rounded-2xl shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-violet-50">
            <span className="font-bold text-gray-900 text-sm">الإشعارات</span>
            {unread > 0 && (
              <button onClick={() => void markAll()} className="text-xs text-violet-600 font-semibold hover:text-violet-800 flex items-center gap-1 transition-colors">
                <CheckCheck size={12} /> تحديد الكل مقروء
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="space-y-2 p-3">
                {[...Array(3)].map((_, i) => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-10">
                <Bell size={28} className="text-violet-200 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((n) => {
                const content = (
                  <div className={`px-4 py-3 border-b border-gray-50 transition-colors hover:bg-violet-50 cursor-pointer ${!n.isRead ? "bg-violet-50/60" : ""}`}
                    onClick={() => { if (!n.isRead) void markOne(n.id); }}>
                    <div className="flex items-start gap-2.5">
                      <span className="text-base shrink-0 mt-0.5">{typeIcon[n.type] ?? "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-sm leading-snug ${!n.isRead ? "font-bold text-gray-900" : "font-medium text-gray-700"}`}>{n.title}</p>
                          {!n.isRead && <span className="w-2 h-2 bg-violet-500 rounded-full shrink-0 mt-1.5" />}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{new Date(n.createdAt).toLocaleDateString("ar-SA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </div>
                );

                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>{content}</Link>
                ) : (
                  <div key={n.id}>{content}</div>
                );
              })
            )}
          </div>

          <div className="border-t border-violet-50 px-4 py-2.5">
            <Link href="/dashboard/notifications" onClick={() => setOpen(false)} className="text-xs text-violet-600 font-semibold hover:text-violet-800 flex items-center justify-center gap-1 transition-colors">
              عرض جميع الإشعارات
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
