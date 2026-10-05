import type { Metadata } from "next";
import { Breadcrumbs, JsonLd, PageShell } from "@/components/page/PageBits";
import ContactForm from "@/components/contact/ContactForm";
import { FOOTER } from "@/components/footer/footerData";
import { OG_IMAGE, SITE } from "@/lib/site";
import "@/components/contact/contact.css";

const TITLE = "Contact us — Cognavia.ai";
const DESCRIPTION =
  "Talk to Cognavia.ai about CognaAssist, CognaBrief, CognaFileSearch, MediBook AI or a custom AI project. Tell us what you need and our team will get back to you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/contact" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/contact", images: [OG_IMAGE] },
};

const { email, phone, address } = FOOTER.contact;

export default function ContactPage() {
  return (
    <PageShell>
      <div className="contact">
        <aside className="contact__info">
          <Breadcrumbs trail={[{ label: "Contact us", href: "/contact" }]} />
          <p className="page__eyebrow contact-rise" style={{ ["--d" as string]: "0ms" }}>
            Contact us
          </p>
          <h1 className="contact__title contact-rise" style={{ ["--d" as string]: "80ms" }}>
            Let&apos;s talk about <span>what you need.</span>
          </h1>
          <p className="contact__lede contact-rise" style={{ ["--d" as string]: "160ms" }}>
            Tell us a little about yourself and what you&apos;re looking for, whether it&apos;s one of our products or a
            project of your own. Our team reads every message and will get back to you.
          </p>

          <ul className="contact__ways contact-rise" style={{ ["--d" as string]: "240ms" }}>
            <li>
              <span className="contact__icon" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
                  <path d="m4 7 8 6 8-6" />
                </svg>
              </span>
              <span>
                <em>Email</em>
                <a href={`mailto:${email}`}>{email}</a>
              </span>
            </li>
            <li>
              <span className="contact__icon" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M6.5 3.5h3l1.5 4.5-2 1.3a11 11 0 0 0 5.7 5.7l1.3-2 4.5 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2z" />
                </svg>
              </span>
              <span>
                <em>Phone</em>
                <a href={`tel:${phone.replace(/\s/g, "")}`}>{phone}</a>
              </span>
            </li>
            <li>
              <span className="contact__icon" aria-hidden>
                <svg viewBox="0 0 24 24">
                  <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
                  <circle cx="12" cy="10" r="2.4" />
                </svg>
              </span>
              <span>
                <em>Office</em>
                <address>
                  {address.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </address>
              </span>
            </li>
          </ul>
        </aside>

        <div className="contact__form contact-rise" style={{ ["--d" as string]: "200ms" }}>
          <ContactForm />
        </div>
      </div>

      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE.url}/contact`,
          mainEntity: {
            "@id": `${SITE.url}/#organization`,
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "sales",
              email,
              telephone: phone.replace(/\s/g, ""),
              areaServed: "IN",
              availableLanguage: ["English", "Hindi"],
            },
          },
        }}
      />
    </PageShell>
  );
}
