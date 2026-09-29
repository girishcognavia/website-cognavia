import type { Metadata } from "next";
import Link from "next/link";
import { PRODUCTS, productHref } from "@/components/products/productsData";
import { Breadcrumbs, ContactCta, PageShell } from "@/components/page/PageBits";

const DESCRIPTION = "Powerful AI products designed for specific enterprise needs.";

export const metadata: Metadata = {
  title: "Products — Our Intelligent Suite | Cognavia.ai",
  description: `${DESCRIPTION} ${PRODUCTS.map((p) => p.name).join(", ")}.`,
  alternates: { canonical: "/products" },
  openGraph: { title: "Our Intelligent Suite — Cognavia.ai", description: DESCRIPTION, url: "/products" },
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
    </PageShell>
  );
}
