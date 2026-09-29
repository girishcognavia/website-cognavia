import { SITE, isFilled } from "@/lib/site";
import { PRODUCTS, productHref } from "@/components/products/productsData";
import { TEAM } from "@/components/team/teamData";
import { FOOTER } from "@/components/footer/footerData";

/**
 * JSON-LD for search engines and AI answer engines: the organisation, the website,
 * the four products and the leadership team. Contact details are included only once
 * they've been filled in (placeholders are skipped).
 */
export default function StructuredData() {
  const org = `${SITE.url}/#organization`;
  const { contact, social } = FOOTER;
  const sameAs = social.map((s) => s.href).filter((h) => h.startsWith("http"));
  const address = contact.address.filter(isFilled);

  const graph = [
    {
      "@type": "Organization",
      "@id": org,
      name: SITE.name,
      url: `${SITE.url}/`,
      logo: `${SITE.url}/icon.svg`,
      description: SITE.description,
      parentOrganization: { "@type": "Organization", name: SITE.legalName },
      ...(isFilled(contact.email) && { email: contact.email }),
      ...(isFilled(contact.phone) && { telephone: contact.phone }),
      ...(address.length && { address: { "@type": "PostalAddress", streetAddress: address.join(", ") } }),
      ...(sameAs.length && { sameAs }),
      founder: TEAM.map((l) => ({ "@id": `${SITE.url}/#${slug(l.name)}` })),
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: `${SITE.url}/`,
      name: SITE.name,
      description: SITE.description,
      publisher: { "@id": org },
      inLanguage: "en",
    },
    {
      "@type": "ItemList",
      name: "Our Intelligent Suite",
      description: "Powerful AI products designed for specific enterprise needs.",
      itemListElement: PRODUCTS.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "SoftwareApplication",
          name: p.name,
          description: p.description,
          applicationCategory: "BusinessApplication",
          applicationSubCategory: p.tag,
          operatingSystem: "Web",
          publisher: { "@id": org },
          url: `${SITE.url}${productHref(p)}`,
        },
      })),
    },
    ...TEAM.map((l) => ({
      "@type": "Person",
      "@id": `${SITE.url}/#${slug(l.name)}`,
      name: l.name,
      jobTitle: l.role,
      description: l.bio,
      worksFor: { "@id": org },
      ...(l.photo && { image: `${SITE.url}${l.photo}` }),
    })),
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }) }}
    />
  );
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-");
