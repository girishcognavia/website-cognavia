// Customers view content.
//
// TESTIMONIALS: one entry per customer review, shown in the carousel (newest first).
// The quote is the customer's own words, one string per paragraph, exactly as written.
// Add the next completed project's review as a new entry; the arrows and dots appear
// automatically once there is more than one.
export type Testimonial = {
  name: string;
  role?: string;
  company: string;
  /** paragraphs, verbatim */
  quote: string[];
  /** optional, shown as written, e.g. "Apr 2025" */
  date?: string;
  /** 1–5 */
  rating: number;
  /** optional photo in /public/customers/, rendered in black & white */
  photo?: string;
  placeholder?: boolean;
};

export const TESTIMONIALS: Testimonial[] = [
  {
    name: "Gautam Shankar",
    role: "Director",
    company: "SANPAR Industries Pvt Ltd",
    rating: 5,
    quote: [
      "We would like to extend our sincere appreciation to Cognavia for the excellent work in developing and launching the SANPAR website, www.sanpar.com to life.",
      "From translating our technical content into a compelling digital experience to carefully curating product and industry imagery, aligning the design language with our brand guidelines, and delivering a responsive, intuitive UI across devices and screen sizes, the team demonstrated a strong understanding of our brand and business requirements.",
      "We particularly appreciate the seamless backend that enables us to manage content, modify images, and continuously update the website with ease, ensuring that our digital presence evolves alongside our business.",
      "Looking ahead, we envision further enhancing the platform with AI-powered agents to better engage visitors, provide relevant technical information, and strengthen our lead-generation capabilities.",
      "Thank you, Cognavia, for being a valuable partner in strengthening SANPAR's digital presence, brand value, and marketing capabilities. We look forward to building on this foundation together.",
    ],
  },
];

/** The overall score beside the reviews: the average of the real reviews' ratings. */
const REAL = TESTIMONIALS.filter((t) => !t.placeholder);
export const SATISFACTION = {
  score: REAL.length ? REAL.reduce((sum, t) => sum + t.rating, 0) / REAL.length : 0,
  outOf: 5,
  note: "Based on customer reviews",
};

export const PROMISES = [
  { icon: "shield", title: "Reliable & Secure", text: "Your data, our priority." },
  { icon: "bolt", title: "Responsive Support", text: "Always here when you need us." },
  { icon: "people", title: "Long-Term Partnership", text: "Building for what's next." },
] as const;

export const CUSTOMERS_COPY = {
  eyebrow: "Customer Feedback",
  titleA: "Real Customers.",
  titleB: "Real Experiences.",
  sub: ["We're building intelligent solutions that make a difference.", "Here's what our customers have to say."],
};
