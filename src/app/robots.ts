import type { MetadataRoute } from "next";

import { resolveAppUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = resolveAppUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/inbox/", "/settings/", "/ai-agent/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
