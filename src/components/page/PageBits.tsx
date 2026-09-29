import Link from "next/link";
import type { ProductSection } from "@/components/products/productsData";
import { SITE } from "@/lib/site";

/** Shared pieces for the inner views (About us, Products, product pages). */

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="page">
      <div className="page__backdrop" aria-hidden />
      {children}
    </main>
  );
}

export function Breadcrumbs({ trail }: { trail: { label: string; href: string }[] }) {
  const all = [{ label: "Home", href: "/" }, ...trail];
  return (
    <>
      <nav className="crumbs" aria-label="Breadcrumb">
        <ol>
          {all.map((c, i) => (
            <li key={c.href}>
              {i < all.length - 1 ? <Link href={c.href}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.label,
            item: `${SITE.url}${c.href === "/" ? "/" : c.href}`,
          })),
        }}
      />
    </>
  );
}

export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

/** Content blocks supplied in the data files; shows a quiet note until there are any. */
export function Sections({ sections, pending }: { sections?: ProductSection[]; pending: string }) {
  if (!sections?.length) {
    return (
      <p className="page__pending">
        <span aria-hidden />
        {pending}
      </p>
    );
  }
  return (
    <div className="page__sections">
      {sections.map((s) => (
        <section key={s.title} className="page__block">
          <h2>{s.title}</h2>
          {s.body && <p>{s.body}</p>}
          {s.points && (
            <ul>
              {s.points.map((pt) => (
                <li key={pt}>{pt}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}

export function ContactCta({ title = "Want to see it in action?" }: { title?: string }) {
  return (
    <aside className="page__cta">
      <p>{title}</p>
      <a href="#contact" className="page__cta-link">
        Contact us
        <span className="page__arrow" aria-hidden>
          →
        </span>
      </a>
    </aside>
  );
}
