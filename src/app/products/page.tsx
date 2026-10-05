import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS, productHref } from "@/components/products/productsData";
import { Breadcrumbs, ContactCta, JsonLd, PageShell } from "@/components/page/PageBits";
import { OG_IMAGE, SITE } from "@/lib/site";

const DESCRIPTION = "Powerful AI products designed for specific enterprise needs.";

export const metadata: Metadata = {
  title: "Products — Our Intelligent Suite | Cognavia.ai",
  description: `${DESCRIPTION} ${PRODUCTS.map((p) => p.name).join(", ")}.`,
  alternates: { canonical: "/products" },
  openGraph: { title: "Our Intelligent Suite — Cognavia.ai", description: DESCRIPTION, url: "/products", images: [OG_IMAGE] },
};

export default function ProductsPage() {
  return (
    <PageShell>
      <header className="page__hero">
        <Breadcrumbs trail={[{ label: "Products", href: "/products" }]} />
        <p className="page__eyebrow">Products</p>
        <h1 className="page__title">Our Intelligent Suite</h1>
        <p className="page__lede">{DESCRIPTION}</p>
      </header>

      <ul className="suite">
        {PRODUCTS.map((p, i) => (
          <li key={p.slug}>
            <Link href={productHref(p)} className="suite__card">
              <span className="suite__top">
                <span className="suite__num">0{i + 1}</span>
                <span className="suite__tag">{p.tag}</span>
              </span>
              <h2 className="suite__name">{p.name}</h2>
              <p className="suite__desc">{p.description}</p>
              <span className="suite__more">
                View product <span aria-hidden>→</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <ContactCta />

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Our Intelligent Suite",
          description: DESCRIPTION,
          url: `${SITE.url}/products`,
          publisher: { "@id": `${SITE.url}/#organization` },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: PRODUCTS.map((p, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE.url}${productHref(p)}`,
              name: p.name,
              description: p.detail?.overview.tagline ?? p.description,
            })),
          },
        }}
      />
    </PageShell>
  );
}
