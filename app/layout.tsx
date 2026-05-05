import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const SITE_URL = process.env.NEXTAUTH_URL ?? "https://smmpro.replit.app";
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME ?? "SMM Pro";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — أفضل منصة خدمات سوشيال ميديا`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "أرخص وأفضل خدمات السوشيال ميديا — متابعين، لايكات، مشاهدات لإنستقرام، تيك توك، يوتيوب، تويتر وجميع المنصات بأسعار لا تُنافس. توصيل فوري وضمان الجودة.",
  keywords: [
    "smm", "متابعين", "لايكات", "مشاهدات", "سوشيال ميديا",
    "تيك توك", "انستقرام", "يوتيوب", "تويتر", "فيسبوك",
    "زيادة متابعين", "شراء متابعين", "SMM panel", "خدمات سوشيال",
  ],
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    locale: "ar_SA",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — أفضل منصة خدمات سوشيال ميديا`,
    description: "أرخص وأفضل خدمات السوشيال ميديا — متابعين، لايكات، مشاهدات لجميع المنصات بأسعار لا تُنافس",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} — منصة خدمات السوشيال ميديا`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} — أفضل منصة خدمات سوشيال ميديا`,
    description: "أرخص وأفضل خدمات السوشيال ميديا — متابعين، لايكات، مشاهدات",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION ?? "",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <meta name="theme-color" content="#7C3AED" />
      </head>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
