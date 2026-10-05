// Contact view: where enquiries go and the choices offered in the form. Edit freely.
import { PRODUCTS } from "@/components/products/productsData";
import { FOOTER } from "@/components/footer/footerData";

/**
 * Enquiries are delivered by email through FormSubmit (formsubmit.co), which works from a
 * static site with no server or API key. The very first submission sends a one-time
 * activation email to this address: open it and click "Activate Form" once. Every enquiry
 * after that arrives in this inbox, with the sender's email as the reply-to.
 */
export const INBOX = FOOTER.contact.email; // hello@cognavia.ai
export const FORM_ENDPOINT = `https://formsubmit.co/ajax/${INBOX}`;

/** "Interested in": the four products, plus a custom project or anything else. */
export const INTEREST_OPTIONS = [
  ...PRODUCTS.map((p) => ({ value: p.slug, label: p.name })),
  { value: "custom", label: "Custom AI solution" },
  { value: "other", label: "Something else" },
];
