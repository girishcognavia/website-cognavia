// Product content: used by the Home "Our Intelligent Suite" section, the /products view
// and each product's own view (/products/<slug>).
//
// To fill in a product page, add `sections` — each becomes a titled block on that page,
// e.g. { title: "Key features", points: ["…", "…"] } or { title: "Overview", body: "…" }.
// Until a product has sections, its page shows the summary and a "details coming soon" note.
export type ProductSection = { title: string; body?: string; points?: string[] };

/** The full product story, shown on the product's own view. Text is used exactly as supplied. */
export type ProductDetail = {
  company: string;
  category: string;
  live?: { label: string; url: string };
  pricing?: string;
  overview: { tagline: string; body: string };
  features: string[];
  steps: { title: string; text: string }[];
  benefits: { title: string; text: string }[];
  useCases: string[];
};

export type Product = {
  /** URL name: /products/<slug> */
  slug: string;
  name: string;
  /** Short category label */
  tag: string;
  /** One-line tagline shown on the Home card */
  tagline: string;
  description: string;
  sections?: ProductSection[];
  detail?: ProductDetail;
};

export const PRODUCTS: Product[] = [
  {
    slug: "cognaassist",
    name: "CognaAssist",
    tag: "Customer support",
    tagline: "Instant answers. Real support.",
    description: "Transform your website into a 24/7 customer support powerhouse.",
    detail: {
      company: "Cognavia.ai",
      category: "AI-Powered Customer Support Chatbot",
      live: { label: "chat.cognavia.ai", url: "https://chat.cognavia.ai" },
      pricing: "Starter plan available",
      overview: {
        tagline: "AI-Powered Customer Support Chatbot for Your Website",
        body: "CognaAssist is an intelligent, self-learning chatbot platform that transforms your website into a 24/7 customer support powerhouse. Add two lines of code, and your visitors get instant, accurate answers based on your actual website content.",
      },
      features: [
        "Instant Website Integration (60 seconds)",
        "Automatic Content Learning & Crawling",
        "Intelligent AI Responses via RAG",
        "24/7 Availability",
        "Multi-Tenant Architecture",
        "Real-Time Analytics",
      ],
      steps: [
        { title: "Register", text: "Sign up with your company details and website URL." },
        { title: "Crawl", text: "CognaAssist automatically crawls and indexes your website content." },
        { title: "Train", text: "AI processes your content to create a knowledge base." },
        { title: "Integrate", text: "Add two lines of code to your website." },
        { title: "Serve", text: "Start serving customers instantly, 24/7." },
      ],
      benefits: [
        { title: "Reduce Support Costs", text: "Handle thousands of inquiries without hiring more staff." },
        { title: "Increase Satisfaction", text: "Instant responses mean happier customers." },
        { title: "Capture Leads", text: "Engage visitors the moment they have questions." },
      ],
      useCases: [
        "E-Commerce Businesses",
        "Service Providers",
        "SaaS Companies",
        "Educational Institutions",
        "Healthcare Providers",
        "Real Estate Agencies",
      ],
    },
  },
  {
    slug: "cognabrief",
    name: "CognaBrief",
    tag: "Document intelligence",
    tagline: "Turn insights into action.",
    description: "Transform lengthy documents into concise, actionable insights in seconds.",
    detail: {
      company: "Cognavia.ai",
      category: "AI-Powered Document Summarization Platform",
      pricing: "Flexible plans",
      overview: {
        tagline: "AI-Powered Document Summarization Platform",
        body: "Transform lengthy documents into concise, actionable insights in seconds. CognaBrief leverages advanced AI to deliver professional-grade summaries with unmatched accuracy.",
      },
      features: [
        "Multi-Format Support (PDF, DOCX, TXT)",
        "Three Summary Levels (Quick, Standard, Detailed)",
        "Dual-AI Quality Assurance",
        "Page-Level Citations",
        "Visual Element Detection",
        "Professional Output Format",
      ],
      steps: [
        { title: "Upload", text: "Drag and drop PDF, DOCX, or TXT files." },
        { title: "Select", text: "Choose from Quick, Standard, or Detailed summary types." },
        { title: "Process", text: "AI analyzes, extracts, and generates the summary." },
        { title: "Review", text: "Access your professional summary with citations." },
      ],
      benefits: [
        { title: "Save Time", text: "Summarize 50-page documents in under a minute." },
        { title: "Improve Accuracy", text: "Dual-AI verification ensures no critical info is missed." },
        { title: "Maintain Consistency", text: "Consistent, professionally formatted summaries every time." },
      ],
      useCases: [
        "Research & Academia",
        "Legal & Compliance",
        "Business & Finance",
        "Healthcare & Life Sciences",
        "Technical & Engineering",
      ],
    },
  },
  {
    slug: "cognafilesearch",
    name: "CognaFileSearch",
    tag: "Technical comparison",
    tagline: "Find what matters.",
    description: "Automates the comparison of technical specifications, drawings, and documents.",
    detail: {
      company: "Cognavia.ai",
      category: "Intelligent Document Similarity Matching System",
      pricing: "Contact for pricing",
      overview: {
        tagline: "Intelligent Document Similarity Matching System",
        body: "CognaFileSearch automates the comparison of technical specifications, drawings, and documents against your existing repository — transforming hours of manual searching into seconds of AI-powered matching for engineering and manufacturing. Find matches in seconds, not hours.",
      },
      features: [
        "Instant Results (10,000+ docs in < 3s)",
        "Intelligent PDF Processing & OCR",
        "Advanced Similarity Matching",
        "Flexible Repository Management",
        "Weighted Scoring Algorithm",
        "Enterprise-Ready Security",
      ],
      steps: [
        { title: "Configure", text: "Point to your existing document repository." },
        { title: "Batch Process", text: "System indexes your existing documents." },
        { title: "Upload & Search", text: "Upload a new document to find matches." },
        { title: "Review", text: "See ranked similarity matches with scores." },
      ],
      benefits: [
        { title: "Instant Results", text: "Search 10,000+ documents in under 3 seconds." },
        { title: "Prevent Duplication", text: "Instantly surface existing similar designs." },
        { title: "Consistent Matching", text: "Algorithmic approach ensures reliable results." },
      ],
      useCases: ["Manufacturing Industry", "Engineering Firms", "Quality Assurance", "Procurement"],
    },
  },
  {
    slug: "medibook-ai",
    name: "MediBook AI",
    tag: "Patient experience",
    tagline: "Smarter healthcare. Faster.",
    description: "Transforms the patient appointment booking experience through an AI-powered system.",
    detail: {
      company: "Cognavia.ai",
      category: "Intelligent Hospital Appointment Booking System",
      pricing: "Starter, Professional, Enterprise",
      overview: {
        tagline: "Intelligent Hospital Appointment Booking System",
        body: "MediBook AI transforms the patient appointment booking experience through an AI-powered, multilingual chatbot that understands symptoms and intelligently matches patients with the right specialists.",
      },
      features: [
        "AI-Powered Symptom Understanding",
        "True Bilingual Support (Hindi/English)",
        "Intelligent Doctor Matching (90%+ Accuracy)",
        "24/7 Availability",
        "DPDPA 2023 Compliant",
        "WhatsApp Integration",
      ],
      steps: [
        { title: "Chat", text: "Patient describes symptoms in plain language." },
        { title: "Analyze", text: "AI analyzes symptoms and recommends a specialty." },
        { title: "Select", text: "Patient chooses doctor and time slot." },
        { title: "Confirm", text: "Instant confirmation via SMS and Email." },
      ],
      benefits: [
        { title: "For Patients", text: "24/7 booking, no medical knowledge needed." },
        { title: "For Hospitals", text: "Reduce call volume by 50–60%." },
        { title: "For Doctors", text: "See the right patients with pre-screening." },
      ],
      useCases: ["Multi-specialty Hospitals", "Clinics & Medical Centers", "Healthcare Networks"],
    },
  },
];

export const productHref = (p: Product) => `/products/${p.slug}`;
export const findProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug);
