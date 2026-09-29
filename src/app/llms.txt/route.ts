import { SITE } from "@/lib/site";
import { PRODUCTS, productHref } from "@/components/products/productsData";
import { TEAM } from "@/components/team/teamData";
import { aboutSections } from "@/content/about";

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

## Leadership

${TEAM.map((l) => `- ${l.name}, ${l.role}: ${l.bio}`).join("\n")}

## Links

- [Home](${SITE.url}/)
- [About us](${SITE.url}/about)
- [Products](${SITE.url}/products)
- [Leadership team](${SITE.url}/#team)
- [Contact](${SITE.url}/#contact)
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
