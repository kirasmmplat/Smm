"use client";

import Link from "next/link";
import {
  InstagramIcon, TikTokIcon, YouTubeIcon, TwitterXIcon, FacebookIcon,
  TelegramIcon, SnapchatIcon, ThreadsIcon, SoundCloudIcon, SpotifyIcon,
} from "@/components/ui/PlatformIcons";

const platforms = [
  {
    slug: "instagram", name: "إنستقرام", desc: "متابعين، لايكات، مشاهدات",
    Icon: InstagramIcon, gradient: "from-pink-500 via-rose-500 to-purple-600", glow: "#E1306C",
  },
  {
    slug: "tiktok", name: "تيك توك", desc: "متابعين، لايكات، مشاهدات",
    Icon: TikTokIcon, gradient: "from-gray-800 to-gray-900", glow: "#69C9D0",
  },
  {
    slug: "youtube", name: "يوتيوب", desc: "مشاهدات، مشتركين، لايكات",
    Icon: YouTubeIcon, gradient: "from-red-500 to-red-700", glow: "#FF0000",
  },
  {
    slug: "twitter", name: "تويتر X", desc: "متابعين، ريتويت، لايكات",
    Icon: TwitterXIcon, gradient: "from-gray-800 to-black", glow: "#888",
  },
  {
    slug: "facebook", name: "فيسبوك", desc: "متابعين، لايكات، مشاهدات",
    Icon: FacebookIcon, gradient: "from-blue-600 to-blue-800", glow: "#1877F2",
  },
  {
    slug: "telegram", name: "تيليجرام", desc: "أعضاء، مشاهدات، تصويتات",
    Icon: TelegramIcon, gradient: "from-sky-400 to-blue-500", glow: "#229ED9",
  },
  {
    slug: "snapchat", name: "سناب شات", desc: "متابعين، مشاهدات القصة",
    Icon: SnapchatIcon, gradient: "from-yellow-300 to-yellow-500", glow: "#FFFC00",
  },
  {
    slug: "threads", name: "ثريدز", desc: "متابعين، لايكات، تعليقات",
    Icon: ThreadsIcon, gradient: "from-gray-800 to-black", glow: "#aaa",
  },
  {
    slug: "soundcloud", name: "ساوند كلاود", desc: "استماعات، متابعين",
    Icon: SoundCloudIcon, gradient: "from-orange-500 to-orange-700", glow: "#FF5500",
  },
  {
    slug: "spotify", name: "سبوتيفاي", desc: "متابعين، استماعات",
    Icon: SpotifyIcon, gradient: "from-green-500 to-green-700", glow: "#1DB954",
  },
];

export function PlatformsSection() {
  return (
    <section id="platforms" className="py-20 bg-gradient-to-b from-gray-950 to-gray-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 px-4 py-1.5 rounded-full text-sm font-semibold mb-5 border border-white/10">
            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse" />
            جميع المنصات في مكان واحد
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            خدمات متكاملة لـ
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-pink-400"> 10+ منصة</span>
          </h2>
          <p className="text-gray-400 max-w-lg mx-auto">
            من إنستقرام وتيك توك إلى يوتيوب وفيسبوك — كل ما تحتاجه لتنمية حساباتك
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {platforms.map((p) => (
            <PlatformCard key={p.slug} platform={p} />
          ))}
        </div>

        <div className="text-center mt-10">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold px-8 py-3.5 rounded-2xl transition-all duration-200 shadow-lg shadow-violet-900/30"
          >
            استعرض جميع الخدمات
            <span>←</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function PlatformCard({ platform }: { platform: (typeof platforms)[0] }) {
  const { Icon, gradient, glow, name, desc } = platform;
  return (
    <Link
      href="/services"
      className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-2xl p-5 flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1 cursor-pointer overflow-hidden"
      style={{ "--glow": glow } as React.CSSProperties}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = `0 0 28px 0 ${glow}50`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      <div
        className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon size={30} />
      </div>
      <div className="text-center">
        <p className="text-white font-bold text-sm">{name}</p>
        <p className="text-gray-500 text-xs mt-0.5 group-hover:text-gray-400 transition-colors">{desc}</p>
      </div>
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 0%, ${glow}15, transparent 70%)` }}
      />
    </Link>
  );
}
