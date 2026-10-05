import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PRODUCTS, findProduct, productHref } from "@/components/products/productsData";
import { Breadcrumbs, ContactCta, JsonLd, PageShell, Sections } from "@/components/page/PageBits";
import ProductDetail from "@/components/products/detail/ProductDetail";
import { OG_IMAGE, SITE } from "@/lib/site";

type Params = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const p = findProduct((await params).slug);
  if (!p) return {};
  const title = p.detail ? `${p.name} — ${p.detail.overview.tagline} | Cognavia.ai` : `${p.name} — ${p.tag} | Cognavia.ai`;
  const description = p.detail?.overview.body ?? p.description;
  return {
    title,
    description,
    alternates: { canonical: productHref(p) },
    openGraph: { title, description, url: productHref(p), images: [OG_IMAGE] },
  };
}

export default async function ProductPage({ params }: Params) {
  const p = findProduct((await params).slug);
  if (!p) notFound();
  const index = PRODUCTS.indexOf(p);
  const others = PRODUCTS.filter((o) => o.slug !== p.slug);

  return (
    <PageShell>
      <Breadcrumbs
        trail={[
          { label: "Products", href: "/products" },
          { label: p.name, href: productHref(p) },
        ]}
      />

      {p.detail ? (
        <ProductDetail product={p} index={index} />
      ) : (
        <>
          <header className="page__hero">
            <p className="page__eyebrow">
              0{index + 1} · {p.tag}
            </p>
            <h1 className="page__title">{p.name}</h1>
            <p className="page__lede">{p.description}</p>
          </header>

          <Sections sections={p.sections} pending={`Full details on ${p.name} are coming soon.`} />

          <ContactCta title={`Interested in ${p.name}?`} />
        </>
      )}

      <nav className="page__others" aria-label="Other products">
        <h2 className="page__h2">More from the suite</h2>
        <ul className="suite suite--compact">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={productHref(o)} className="suite__card">
                <span className="suite__tag">{o.tag}</span>
                <h3 className="suite__name">{o.name}</h3>
                <span className="suite__more">
                  View <span aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: p.name,
          description: p.description,
          applicationCategory: "BusinessApplication",
          applicationSubCategory: p.tag,
          operatingSystem: "Web",
          url: `${SITE.url}${productHref(p)}`,
          publisher: { "@id": `${SITE.url}/#organization` },
          ...(p.detail && {
            alternateName: p.detail.overview.tagline,
            featureList: p.detail.features,
            audience: p.detail.useCases.map((u) => ({ "@type": "BusinessAudience", name: u })),
            ...(p.detail.live && { sameAs: [p.detail.live.url], installUrl: p.detail.live.url }),
          }),
        }}
      />
    </PageShell>
  );
}
