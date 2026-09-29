// Product content: used by the Home "Our Intelligent Suite" section, the /products view
// and each product's own view (/products/<slug>).
//
// To fill in a product page, add `sections` — each becomes a titled block on that page,
// e.g. { title: "Key features", points: ["…", "…"] } or { title: "Overview", body: "…" }.
// Until a product has sections, its page shows the summary and a "details coming soon" note.
export type ProductSection = { title: string; body?: string; points?: string[] };

export type Product = {
  /** URL name: /products/<slug> */
  slug: string;
  name: string;
  /** Short category pill shown on the 3D card */
  tag: string;
  description: string;
  sections?: ProductSection[];
};

export const PRODUCTS: Product[] = [
  {
    slug: "cognaassist",
    name: "CognaAssist",
    tag: "Customer support",
    description: "Transform your website into a 24/7 customer support powerhouse.",
  },
  {
    slug: "cognabrief",
    name: "CognaBrief",
    tag: "Document intelligence",
    description: "Transform lengthy documents into concise, actionable insights in seconds.",
  },
  {
    slug: "cognafilesearch",
    name: "CognaFileSearch",
    tag: "Technical comparison",
    description: "Automates the comparison of technical specifications, drawings, and documents.",
  },
  {
    slug: "medibook-ai",
    name: "MediBook AI",
    tag: "Patient experience",
    description: "Transforms the patient appointment booking experience through an AI-powered system.",
  },
];

export const productHref = (p: Product) => `/products/${p.slug}`;
export const findProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
