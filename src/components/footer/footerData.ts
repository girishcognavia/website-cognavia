// Footer content — edit freely. Anything in [square brackets] is a placeholder to replace.
import { PRODUCTS, productHref } from "@/components/products/productsData";

export const FOOTER = {
  tagline: "Intelligent solutions for a smarter tomorrow.",
  legalName: "Kognavion AI Labs Private Limited",

  columns: [
    {
      title: "Products",
      links: [{ label: "All products", href: "/products" }, ...PRODUCTS.map((p) => ({ label: p.name, href: productHref(p) }))],
    },
    {
      title: "Company",
      links: [
        { label: "About us", href: "/about" },
        { label: "Leadership", href: "/#team-view" },
        { label: "Customer stories", href: "#" }, // [link to reviews / customers page]
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Privacy Policy", href: "#" }, // [link to privacy policy page]
        { label: "Terms & Conditions", href: "#" }, // [link to terms page]
      ],
    },
  ],

  contact: {
    email: "[email address]",
    phone: "[phone number]",
    address: ["[Street address]", "[City, State PIN]", "India"],
  },

  social: [
    { label: "LinkedIn", href: "#" }, // [LinkedIn URL]
    { label: "X", href: "#" }, // [X / Twitter URL]
  ],
};
