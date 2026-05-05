"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PublicNav from "@/components/PublicNav";
import PublicFooter from "@/components/PublicFooter";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function FaqPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((d: { items?: FaqItem[] }) => { setItems(d.items ?? []); setLoading(false); });
  }, []);

  const categories = Array.from(new Set(items.map((i) => i.category)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white" dir="rtl">
      <PublicNav />

      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-gray-900 mb-3">الأسئلة الشائعة</h1>
          <p className="text-gray-500 text-lg">إجابات على أكثر الأسئلة شيوعاً</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-gray-400">لا توجد أسئلة حتى الآن</div>
        ) : (
          <div className="space-y-8">
            {categories.map((cat) => (
              <div key={cat}>
                <h2 className="text-sm font-bold text-violet-600 uppercase tracking-wider mb-3 px-1">{cat}</h2>
                <div className="space-y-2">
                  {items.filter((i) => i.category === cat).map((item) => (
                    <div key={item.id} className="bg-white border border-violet-100 rounded-2xl overflow-hidden shadow-sm">
                      <button
                        className="w-full flex items-center justify-between p-5 text-right"
                        onClick={() => setOpen(open === item.id ? null : item.id)}
                      >
                        <span className="font-semibold text-gray-800">{item.question}</span>
                        <span className={`text-violet-600 text-xl transition-transform duration-200 ${open === item.id ? "rotate-180" : ""}`}>▼</span>
                      </button>
                      {open === item.id && (
                        <div className="px-5 pb-5 text-gray-600 leading-relaxed border-t border-violet-50 pt-4">
                          {item.answer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-12 text-center bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-8 text-white">
          <h3 className="text-xl font-bold mb-2">لم تجد إجابتك؟</h3>
          <p className="text-violet-200 mb-4">تواصل مع فريق الدعم الفني</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/contact" className="bg-white text-violet-600 font-bold px-6 py-3 rounded-xl hover:bg-violet-50 transition">
              تواصل معنا
            </Link>
            <Link href="/dashboard/tickets/new" className="border border-white/30 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition">
              فتح تذكرة دعم
            </Link>
          </div>
        </div>
      </div>

      <PublicFooter />
    </div>
  );
}
