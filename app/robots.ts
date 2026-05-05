import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://smmpro.replit.app";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/services", "/blog", "/faq", "/how-to-use", "/terms", "/privacy", "/register", "/login"],
        disallow: ["/dashboard/", "/admin/", "/api/", "/reset-password"],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
