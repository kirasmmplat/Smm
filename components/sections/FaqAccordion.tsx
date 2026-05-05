"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import Link from "next/link";

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  if (!items.length) return null;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div
          key={item.id}
          className="bg-white border border-violet-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        >
          <button
            className="w-full flex items-center justify-between p-5 text-right gap-4"
            onClick={() => setOpen(open === item.id ? null : item.id)}
          >
            <span className="font-semibold text-gray-800 text-sm leading-relaxed">
              {item.question}
            </span>
            <ChevronDown
              size={18}
              className={`text-violet-500 shrink-0 transition-transform duration-200 ${open === item.id ? "rotate-180" : ""}`}
            />
          </button>
          {open === item.id && (
            <div className="px-5 pb-5 text-gray-600 text-sm leading-relaxed border-t border-violet-50 pt-4">
              {item.answer}
            </div>
          )}
        </div>
      ))}
      <div className="text-center pt-2">
        <Link
          href="/faq"
          className="text-violet-600 font-semibold text-sm hover:text-violet-700 hover:underline transition-colors"
        >
          عرض جميع الأسئلة ←
        </Link>
      </div>
    </div>
  );
}
