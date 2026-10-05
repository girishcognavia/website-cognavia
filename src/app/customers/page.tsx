import type { Metadata } from "next";
import Customers from "@/components/customers/Customers";
import { JsonLd } from "@/components/page/PageBits";
import { TESTIMONIALS } from "@/components/customers/customersData";
import { OG_IMAGE, SITE } from "@/lib/site";

const TITLE = "Customers — Real Experiences with Cognavia.ai";
const DESCRIPTION =
  "We're building intelligent solutions that make a difference. Here's what our customers have to say about working with Cognavia.ai.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/customers" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/customers", images: [OG_IMAGE] },
};

// only real reviews (not the layout placeholders) are published as structured data
const REAL = TESTIMONIALS.filter((t) => !t.placeholder);

export default function CustomersPage() {
  return (
    <main className="cust-page">
      <Customers />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE.url}/customers`,
          about: { "@id": `${SITE.url}/#organization` },
          ...(REAL.length > 0 && {
            mainEntity: REAL.map((t) => ({
              "@type": "Review",
              author: {
                "@type": "Person",
                name: t.name,
                ...(t.role && { jobTitle: t.role }),
                worksFor: { "@type": "Organization", name: t.company },
              },
              reviewBody: t.quote.join("\n\n"),
              reviewRating: { "@type": "Rating", ratingValue: t.rating, bestRating: 5 },
              itemReviewed: { "@id": `${SITE.url}/#organization` },
            })),
          }),
        }}
      />
    </main>
  );
}
