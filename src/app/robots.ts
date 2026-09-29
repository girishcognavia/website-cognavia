import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

// generated once at build time (static site)
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  // Search engines and AI crawlers are all welcome.
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
