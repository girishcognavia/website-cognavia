import Link from "next/link";
import { FOOTER } from "./footerData";

/** A link is shown only once it has a real destination (placeholder "#" links stay hidden). */
const real = (href: string) => !!href && href !== "#";

/** Plain, static site footer — no 3D, no scroll animation. */
export default function Footer() {
  const { contact } = FOOTER;
  const year = new Date().getFullYear();
  const social = FOOTER.social.filter((s) => real(s.href));
  const columns = FOOTER.columns
    .map((c) => ({ ...c, links: c.links.filter((l) => real(l.href)) }))
    .filter((c) => c.links.length);

  return (
    <footer className="footer" id="contact">
      <div className="footer__inner" style={{ ["--cols" as string]: columns.length + 1 }}>
        <div className="footer__brand">
          <Link href="/" className="footer__logo">
            Cognavia.ai
          </Link>
          <p className="footer__tagline">{FOOTER.tagline}</p>
          {social.length > 0 && (
            <ul className="footer__social">
              {social.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noopener">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {columns.map((col) => (
          <nav className="footer__col" key={col.title} aria-label={col.title}>
            <h3>{col.title}</h3>
            <ul>
              {col.links.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? <Link href={l.href}>{l.label}</Link> : <a href={l.href}>{l.label}</a>}
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div className="footer__col">
          <h3>Contact</h3>
          <address>
            <a href={`mailto:${contact.email}`}>{contact.email}</a>
            <a href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</a>
            <span className="footer__address">
              {contact.address.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </span>
          </address>
        </div>
      </div>

      <div className="footer__bottom">
        <span>
          © {year} {FOOTER.legalName}. All rights reserved.
        </span>
        <span>Cognavia.ai is a brand of {FOOTER.legalName}.</span>
      </div>
    </footer>
  );
}
