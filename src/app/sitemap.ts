import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { PRODUCTS, productHref } from "@/components/products/productsData";

// generated once at build time (static site)
export const dynamic = "force-static";

// Every view of the app.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/products`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${SITE.url}/customers`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: "yearly", priority: 0.7 },
    ...PRODUCTS.map((p) => ({
      url: `${SITE.url}${productHref(p)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
