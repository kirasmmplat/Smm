"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

const typeIcon: Record<string, string> = {
  ORDER_UPDATE: "Order",
  DEPOSIT: "Wallet",
  TICKET: "Ticket",
  SYSTEM: "System",
  REFILL: "Refresh",
  AFFILIATE: "Affiliate",
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    setLoading(true);
    const res = await fetch("/api/notifications");
    const data = await res.json();
    setNotifications(data.notifications ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: "PUT" });
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await fetch("/api/notifications/read-all", { method: "PUT" });
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">الإشعارات</h1>
          {unreadCount > 0 && <p className="text-violet-600 text-sm mt-1">{unreadCount} إشعار غير مقروء</p>}
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="btn-secondary text-sm px-3 py-1.5">
            تعليم الكل كمقروء
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card animate-pulse h-20" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">إشعارات</div>
          <h3 className="text-lg font-bold text-gray-700">لا توجد إشعارات</h3>
          <p className="text-gray-400 mt-2">ستظهر هنا إشعارات الطلبات والمدفوعات والتذاكر</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`card p-4 flex items-start gap-3 cursor-pointer transition-all ${!n.isRead ? "border-violet-300 bg-violet-50/50" : ""}`}
              onClick={() => { if (!n.isRead) markRead(n.id); }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${!n.isRead ? "bg-violet-100" : "bg-gray-100"}`}>
                {typeIcon[n.type] ?? "Info"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-sm font-semibold ${!n.isRead ? "text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-violet-600 flex-shrink-0" />}
                </div>
                <p className="text-gray-500 text-sm mt-0.5">{n.message}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-gray-400 text-xs">{new Date(n.createdAt).toLocaleString("ar-SA")}</span>
                  {n.link && (
                    <Link href={n.link} className="text-violet-600 text-xs hover:underline" onClick={(e) => e.stopPropagation()}>
                      عرض التفاصيل ←
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
