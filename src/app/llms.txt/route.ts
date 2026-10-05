import { SITE } from "@/lib/site";
import { PRODUCTS, productHref } from "@/components/products/productsData";
import { TEAM } from "@/components/team/teamData";
import { aboutSections } from "@/content/about";
import { TESTIMONIALS } from "@/components/customers/customersData";
import { FOOTER } from "@/components/footer/footerData";

// GEO: a plain-text summary for AI assistants and answer engines (llmstxt.org convention).
// Generated from the same data as the page, so it never drifts out of date.
export const dynamic = "force-static";

export function GET() {
  const body = `# ${SITE.name}

> ${SITE.description}

${SITE.name} is a brand of ${SITE.legalName}. It stands at the intersection of innovation and practical application: founded with a vision to democratize AI technology, it bridges the gap between cutting-edge research and real-world business solutions. Its mission is to empower organizations of all sizes to harness the transformative power of artificial intelligence, driving growth, efficiency, and innovation across industries.

## About

${aboutSections()
  .map((s) => [`### ${s.title}`, ...(s.lead ? [s.lead] : []), ...s.paragraphs.map((p) => p.text)].join("\n\n"))
  .join("\n\n")}

## Products

${PRODUCTS.map((p) => `- [${p.name}](${SITE.url}${productHref(p)}) (${p.tag}): ${p.description}`).join("\n")}

${PRODUCTS.filter((p) => p.detail)
  .map((p) => {
    const d = p.detail!;
    return [
      `### ${p.name}`,
      d.category === d.overview.tagline ? `${d.category}.` : `${d.category}. ${d.overview.tagline}.`,
      d.overview.body,
      ...(d.live ? [`Live product: ${d.live.url}`] : []),
      ...(d.pricing ? [`Pricing: ${d.pricing}`] : []),
      `Key features:\n${d.features.map((f) => `- ${f}`).join("\n")}`,
      `How it works:\n${d.steps.map((s, i) => `${i + 1}. ${s.title} — ${s.text}`).join("\n")}`,
      `Benefits:\n${d.benefits.map((b) => `- ${b.title} — ${b.text}`).join("\n")}`,
      `Use cases:\n${d.useCases.map((u) => `- ${u}`).join("\n")}`,
    ].join("\n\n");
  })
  .join("\n\n")}

## Leadership

${TEAM.map((l) => `- ${l.name}, ${l.role}: ${l.bio}`).join("\n")}

## Customers

${TESTIMONIALS.filter((t) => !t.placeholder)
  .map((t) => `${t.rating}/5 from ${t.name}${t.role ? `, ${t.role}` : ""}, ${t.company}:\n\n${t.quote.map((q) => `> ${q}`).join("\n>\n")}`)
  .join("\n\n")}

## Contact

- Email: ${FOOTER.contact.email}
- Phone: ${FOOTER.contact.phone}
- Office: ${FOOTER.contact.address.join(" ").replace(/,\s*$/, "")}
- Contact form: ${SITE.url}/contact

## Links

- [Home](${SITE.url}/)
- [About us](${SITE.url}/about)
- [Products](${SITE.url}/products)
- [Customers](${SITE.url}/customers)
- [Leadership team](${SITE.url}/#team)
- [Contact](${SITE.url}/contact)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
