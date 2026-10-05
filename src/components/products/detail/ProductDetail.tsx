import Link from "next/link";
import type { Product } from "../productsData";
import Reveal from "./Reveal";
import { VISUALS } from "./visuals";
import "./detail.css";
import "./brief/brief.css";
import "./filesearch/filesearch.css";
import "./medibook/medibook.css";

/**
 * A product's full view: hero with a live product demo, overview, key features, how it works,
 * benefits, use cases. Copy comes verbatim from the product's `detail`; the visuals are
 * product-specific (see ./visuals).
 */
export default function ProductDetail({ product: p, index }: { product: Product; index: number }) {
  const d = p.detail!;
  const v = VISUALS[p.slug];

  return (
    <>
      <header className="pd-hero">
        <div className="pd-hero__copy">
          <p className="page__eyebrow pd-rise" style={{ ["--d" as string]: "0ms" }}>
            0{index + 1} · {d.category}
          </p>
          <h1
            className={`page__title pd-hero__title pd-rise${p.name.length > 12 ? " pd-hero__title--long" : ""}`}
            style={{ ["--d" as string]: "80ms" }}
          >
            {p.name}
          </h1>
          <p className="pd-hero__tagline pd-rise" style={{ ["--d" as string]: "160ms" }}>
            {d.overview.tagline}
          </p>

          <dl className="pd-meta pd-rise" style={{ ["--d" as string]: "240ms" }}>
            <div>
              <dt>Company</dt>
              <dd>{d.company}</dd>
            </div>
            {d.pricing && (
              <div>
                <dt>Pricing</dt>
                <dd>{d.pricing}</dd>
              </div>
            )}
            {d.live && (
              <div>
                <dt>Live product</dt>
                <dd>
                  <a href={d.live.url} target="_blank" rel="noopener">
                    {d.live.label}
                  </a>
                </dd>
              </div>
            )}
          </dl>

          <div className="pd-actions pd-rise" style={{ ["--d" as string]: "320ms" }}>
            {d.live && (
              <a className="pd-btn pd-btn--solid" href={d.live.url} target="_blank" rel="noopener">
                Try {p.name}
                <span aria-hidden>↗</span>
              </a>
            )}
            <Link className="pd-btn" href={`/contact?product=${p.slug}`}>
              Contact us
              <span aria-hidden>→</span>
            </Link>
          </div>
        </div>

        <div className="pd-hero__visual pd-rise" style={{ ["--d" as string]: "200ms" }}>
          {v?.Hero && <v.Hero />}
        </div>
      </header>

      {/* Overview */}
      <Reveal as="section" className="pd-section pd-overview" aria-labelledby="pd-overview">
        <div className="pd-overview__copy">
          <p className="pd-kicker">01</p>
          <h2 className="pd-h2" id="pd-overview">
            Overview
          </h2>
          <p className="pd-overview__tagline">{d.overview.tagline}</p>
          <p className="pd-overview__body">{d.overview.body}</p>
        </div>
        <div className="pd-overview__visual">{v?.Overview && <v.Overview />}</div>
      </Reveal>

      {/* Key features */}
      <Reveal as="section" className="pd-section" aria-labelledby="pd-features">
        <p className="pd-kicker">02</p>
        <h2 className="pd-h2" id="pd-features">
          Key Features
        </h2>
        <ul className="pd-features">
          {d.features.map((f, i) => {
            const Fx = v?.features?.[i];
            return (
              <li key={f} className="pd-feature" style={{ ["--i" as string]: i }}>
                <div className="pd-feature__visual" aria-hidden>
                  {Fx && <Fx />}
                </div>
                <div className="pd-feature__label">
                  <span className="pd-feature__num">0{i + 1}</span>
                  <h3>{f}</h3>
                </div>
              </li>
            );
          })}
        </ul>
      </Reveal>

      {/* How it works */}
      <Reveal as="section" className="pd-section" aria-labelledby="pd-how">
        <p className="pd-kicker">03</p>
        <h2 className="pd-h2" id="pd-how">
          How It Works
        </h2>
        {v?.Steps ? (
          <v.Steps steps={d.steps} />
        ) : (
          <ol className="pd-steps-plain">
            {d.steps.map((s, i) => (
              <li key={s.title}>
                {i + 1}. {s.title} — {s.text}
              </li>
            ))}
          </ol>
        )}
      </Reveal>

      {/* Benefits */}
      <Reveal as="section" className="pd-section pd-benefits" aria-labelledby="pd-benefits">
        <div className="pd-benefits__copy">
          <p className="pd-kicker">04</p>
          <h2 className="pd-h2" id="pd-benefits">
            Benefits
          </h2>
          <ul className="pd-benefits__list">
            {d.benefits.map((b, i) => (
              <li key={b.title} style={{ ["--i" as string]: i }}>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="pd-benefits__visual">{v?.Benefits && <v.Benefits />}</div>
      </Reveal>

      {/* Use cases */}
      <Reveal as="section" className="pd-section" aria-labelledby="pd-uses">
        <p className="pd-kicker">05</p>
        <h2 className="pd-h2" id="pd-uses">
          Use Cases
        </h2>
        <ul className="pd-uses">
          {d.useCases.map((u, i) => (
            <li key={u} className="pd-use" style={{ ["--i" as string]: i }}>
              <span className="pd-use__icon" aria-hidden>
                {USE_ICONS[u] ?? USE_ICONS.default}
              </span>
              <span className="pd-use__name">{u}</span>
            </li>
          ))}
        </ul>
      </Reveal>

      {/* Closing call to action */}
      <Reveal as="aside" className="pd-cta">
        <div>
          <p className="pd-cta__title">Interested in {p.name}?</p>
          {d.live && (
            <p className="pd-cta__sub">
              <a href={d.live.url} target="_blank" rel="noopener">
                {d.live.label} <span aria-hidden>↗</span>
              </a>
            </p>
          )}
        </div>
        <div className="pd-actions">
          {d.live && (
            <a className="pd-btn pd-btn--solid" href={d.live.url} target="_blank" rel="noopener">
              Try {p.name}
              <span aria-hidden>↗</span>
            </a>
          )}
          <Link className="pd-btn" href={`/contact?product=${p.slug}`}>
            Contact us
            <span aria-hidden>→</span>
          </Link>
        </div>
      </Reveal>
    </>
  );
}

const icon = (paths: React.ReactNode) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {paths}
  </svg>
);

const USE_ICONS: Record<string, React.ReactNode> = {
  "E-Commerce Businesses": icon(
    <>
      <path d="M3 4h2.2l2.2 11h11.1l2-8H6.3" />
      <circle cx="9.5" cy="19" r="1.3" />
      <circle cx="17" cy="19" r="1.3" />
    </>,
  ),
  "Service Providers": icon(
    <>
      <rect x="3" y="7.5" width="18" height="12" rx="2" />
      <path d="M8.5 7.5V5.5a1.5 1.5 0 0 1 1.5-1.5h4a1.5 1.5 0 0 1 1.5 1.5v2M3 12.5h18" />
    </>,
  ),
  "SaaS Companies": icon(
    <>
      <path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.6 9.6 4.5 4.5 0 0 0 7 18.5z" />
      <path d="M12 11v5M9.8 13.2 12 11l2.2 2.2" />
    </>,
  ),
  "Educational Institutions": icon(
    <>
      <path d="m2.5 9 9.5-4.5L21.5 9 12 13.5z" />
      <path d="M6.5 11v4.8c0 1.3 2.5 2.7 5.5 2.7s5.5-1.4 5.5-2.7V11M21.5 9v5" />
    </>,
  ),
  "Healthcare Providers": icon(
    <>
      <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />
      <path d="M8 12h2l1.2-2.2 1.8 4 1.2-1.8H16" />
    </>,
  ),
  "Real Estate Agencies": icon(
    <>
      <path d="M3.5 11 12 4l8.5 7" />
      <path d="M5.5 9.5V20h13V9.5M10 20v-5.5h4V20" />
    </>,
  ),
  "Research & Academia": icon(
    <>
      <path d="M4 5.5h6a2 2 0 0 1 2 2V20a1.5 1.5 0 0 0-1.5-1.5H4z" />
      <path d="M20 5.5h-6a2 2 0 0 0-2 2V20a1.5 1.5 0 0 1 1.5-1.5H20z" />
    </>,
  ),
  "Legal & Compliance": icon(
    <>
      <path d="M12 4v16M8 20h8M5 7h14" />
      <path d="M5 7 2.5 13a2.5 2.5 0 0 0 5 0zM19 7l-2.5 6a2.5 2.5 0 0 0 5 0z" />
    </>,
  ),
  "Business & Finance": icon(
    <>
      <path d="M4 20V4M4 20h16" />
      <path d="m7.5 15 3.5-4 3 2.5 5-6" />
      <path d="M15.5 7.5H19V11" />
    </>,
  ),
  "Healthcare & Life Sciences": icon(
    <>
      <path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.3 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" />
      <path d="M8 12h2l1.2-2.2 1.8 4 1.2-1.8H16" />
    </>,
  ),
  "Technical & Engineering": icon(
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" />
    </>,
  ),
  "Manufacturing Industry": icon(
    <>
      <path d="M3 20V10l5 3V10l5 3V10l5 3V5h3v15z" />
      <path d="M7 16.5h2M11.5 16.5h2M16 16.5h2" />
    </>,
  ),
  "Engineering Firms": icon(
    <>
      <path d="M12 3.5v3M12 6.5 6 20M12 6.5 18 20" />
      <circle cx="12" cy="6.5" r="1.6" />
      <path d="M7.7 15.5c2.7 1.4 5.9 1.4 8.6 0" />
    </>,
  ),
  "Quality Assurance": icon(
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
      <path d="m8.8 12 2.2 2.2 4.3-4.4" />
    </>,
  ),
  Procurement: icon(
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="2" />
      <path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </>,
  ),
  "Multi-specialty Hospitals": icon(
    <>
      <path d="M4 20V8.5h16V20M2.5 20h19" />
      <path d="M12 3.5v5M9.5 6h5" />
      <path d="M8 12h2M14 12h2M8 15.5h2M14 15.5h2M10.5 20v-3h3v3" />
    </>,
  ),
  "Clinics & Medical Centers": icon(
    <>
      <path d="M6 3.5v5a4 4 0 0 0 8 0v-5" />
      <path d="M10 12.5v2a4.5 4.5 0 0 0 9 0v-1.5" />
      <circle cx="19" cy="11" r="2" />
    </>,
  ),
  "Healthcare Networks": icon(
    <>
      <circle cx="12" cy="5.5" r="2.2" />
      <circle cx="5" cy="17.5" r="2.2" />
      <circle cx="19" cy="17.5" r="2.2" />
      <path d="M10.9 7.4 6.2 15.6M13.1 7.4l4.7 8.2M7.2 17.5h9.6" />
    </>,
  ),
  default: icon(<circle cx="12" cy="12" r="6" />),
};
