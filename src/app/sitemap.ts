import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";
import { PRODUCTS, productHref } from "@/components/products/productsData";

// Every view of the app.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE.url}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE.url}/products`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    ...PRODUCTS.map((p) => ({
      url: `${SITE.url}${productHref(p)}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];
}
