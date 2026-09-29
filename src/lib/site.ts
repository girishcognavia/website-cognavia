// One place for site-wide SEO facts. Set NEXT_PUBLIC_SITE_URL if the domain differs.
export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://cognavia.ai").replace(/\/$/, ""),
  name: "Cognavia.ai",
  legalName: "Kognavion AI Labs Private Limited",
  title: "Cognavia.ai — Build smarter with AI",
  description:
    "Cognavia.ai, a brand of Kognavion AI Labs, builds enterprise AI products — CognaAssist, CognaBrief, CognaFileSearch and MediBook AI — bridging cutting-edge research and real-world business solutions.",
  keywords: [
    "Cognavia",
    "Cognavia.ai",
    "Kognavion AI Labs",
    "enterprise AI",
    "AI products",
    "AI chatbot",
    "document intelligence",
    "AI document summarization",
    "technical document comparison",
    "AI appointment booking",
    "agentic AI",
  ],
};

/** True once a footer/contact value has been filled in (placeholders are in [brackets]). */
export const isFilled = (v?: string) => !!v && !/^\[.*\]$/.test(v.trim());
