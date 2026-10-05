// Footer content — edit freely. Links left as "#" are hidden until a real address is filled in.
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
        { label: "Customer stories", href: "/customers" },
        { label: "Contact", href: "/contact" },
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
    email: "hello@cognavia.ai",
    phone: "+91 9019538667",
    address: ["Kristal Jasper, Villa No.3J123", "Near Amrita Engineering College,", "Bangalore"],
  },

  social: [
    { label: "LinkedIn", href: "#" }, // [LinkedIn URL]
    { label: "X", href: "#" }, // [X / Twitter URL]
  ],
};
