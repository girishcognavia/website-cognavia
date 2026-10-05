"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getLenis } from "@/components/SmoothScroll";
import { CUSTOMERS_COPY, PROMISES, SATISFACTION, TESTIMONIALS, type Testimonial } from "./customersData";
import "./customers.css";

/**
 * Customers view: a single composed screen (laid out on a 2000 × 1101 frame) with the
 * testimonial carousel, the satisfaction score and two glass panes framing the scene.
 * Subtle motion only: a one-time entrance, the carousel's cross-fade and slow drifting clouds.
 */
const AUTO_MS = 7000;

export default function Customers() {
  const n = TESTIMONIALS.length;
  const [i, setI] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [hold, setHold] = useState(false);
  const [score, setScore] = useState(0);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLElement>(null);

  const go = useCallback(
    (to: number, d: 1 | -1) => {
      setDir(d);
      setI(((to % n) + n) % n);
    },
    [n],
  );
  const next = useCallback(() => go(i + 1, 1), [go, i]);
  const prev = useCallback(() => go(i - 1, -1), [go, i]);

  // gentle auto-advance, paused while the visitor is reading (hover / focus) or prefers less motion
  useEffect(() => {
    if (n < 2 || hold || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setTimeout(next, AUTO_MS);
    return () => clearTimeout(t);
  }, [i, hold, n, next]);

  // the score counts up once, on arrival
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return setScore(SATISFACTION.score);
    let raf = 0;
    const start = performance.now() + 700;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - start) / 1400));
      setScore(SATISFACTION.score * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // the side panes lean very slightly with the pointer
  useEffect(() => {
    const el = root.current!;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty("--px", ((e.clientX / innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty("--py", ((e.clientY / innerHeight) * 2 - 1).toFixed(3));
      });
    };
    addEventListener("pointermove", move);
    return () => {
      removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);

  const t = TESTIMONIALS[i];

  return (
    <section className="cust" ref={root} aria-labelledby="cust-title">
      <Pane side="left" />
      <Pane side="right" />
      <div className="cust__floor" aria-hidden />

      <div className="cust__frame">
        <header className="cust__head">
          <p className="cust__eyebrow cust-in" style={{ ["--d" as string]: "0ms" }}>
            <i aria-hidden />
            {CUSTOMERS_COPY.eyebrow}
            <i aria-hidden />
          </p>
          <h1 className="cust__title cust-in" id="cust-title" style={{ ["--d" as string]: "90ms" }}>
            <span>{CUSTOMERS_COPY.titleA}</span>
            <span className="cust__title-b">{CUSTOMERS_COPY.titleB}</span>
          </h1>
          <p className="cust__sub cust-in" style={{ ["--d" as string]: "180ms" }}>
            {CUSTOMERS_COPY.sub[0]}
            <br />
            {CUSTOMERS_COPY.sub[1]}
          </p>
        </header>

        {/* testimonial carousel */}
        <div
          className="cust__carousel cust-in"
          style={{ ["--d" as string]: "300ms" }}
          onMouseEnter={() => setHold(true)}
          onMouseLeave={() => setHold(false)}
          onFocus={() => setHold(true)}
          onBlur={() => setHold(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") next();
            if (e.key === "ArrowLeft") prev();
          }}
          role="region"
          aria-roledescription="carousel"
          aria-label="Customer reviews"
        >
          {n > 1 && (
            <button type="button" className="cust__arrow cust__arrow--prev" onClick={prev} aria-label="Previous review">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="m14.5 6-6 6 6 6" />
              </svg>
            </button>
          )}

          <article
            className="cust__card"
            aria-roledescription="slide"
            aria-label={`Review ${i + 1} of ${n}: ${t.name}, ${t.company}. Open to read in full.`}
            role="button"
            tabIndex={0}
            onClick={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setOpen(true);
              }
            }}
          >
            <div className={`cust__slide ${dir > 0 ? "is-next" : "is-prev"}`} key={i}>
              <Who t={t} />

              <blockquote className="cust__quote">
                <span className="cust__mark" aria-hidden>
                  &ldquo;
                </span>
                <div className="cust__excerpt">
                  <Paragraphs t={t} />
                </div>
              </blockquote>

              <div className="cust__foot">
                <span className="cust__more" aria-hidden>
                  Read full review <span>→</span>
                </span>
                {t.date && <p className="cust__date">{t.date}</p>}
              </div>
            </div>
          </article>

          {n > 1 && (
            <button type="button" className="cust__arrow cust__arrow--next" onClick={next} aria-label="Next review">
              <svg viewBox="0 0 24 24" aria-hidden>
                <path d="m9.5 6 6 6-6 6" />
              </svg>
            </button>
          )}

          {n > 1 && (
            <div className="cust__dots" role="tablist" aria-label="Choose a review">
              {TESTIMONIALS.map((_, k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={k === i}
                  aria-label={`Review ${k + 1}`}
                  className={k === i ? "is-on" : ""}
                  onClick={() => go(k, k > i ? 1 : -1)}
                >
                  {k === i && !hold && <i key={i} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* satisfaction */}
        <aside className="cust__side cust-in" style={{ ["--d" as string]: "420ms" }} aria-label="Customer satisfaction">
          <p className="cust__side-label">Customer Satisfaction</p>
          <p className="cust__score">
            <b>{score.toFixed(1)}</b>
            <span>/{SATISFACTION.outOf}</span>
          </p>
          <p className="cust__score-note">{SATISFACTION.note}</p>

          <ul className="cust__promises">
            {PROMISES.map((p, k) => (
              <li key={p.title} style={{ ["--k" as string]: k }}>
                <span className="cust__icon" aria-hidden>
                  {ICONS[p.icon]}
                </span>
                <span>
                  <b>{p.title}</b>
                  <em>{p.text}</em>
                </span>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {open && <FullReview t={t} onClose={() => setOpen(false)} />}
    </section>
  );
}

const initials = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");

function Who({ t }: { t: Testimonial }) {
  return (
    <div className="cust__who">
      <span className="cust__avatar" aria-hidden>
        {t.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.photo} alt="" />
        ) : (
          <b>{initials(t.name)}</b>
        )}
      </span>
      <span className="cust__name">
        <b>{t.name}</b>
        <em>{[t.role, t.company].filter(Boolean).join(", ")}</em>
      </span>
      <span className="cust__stars" role="img" aria-label={`Rated ${t.rating} out of 5`}>
        {Array.from({ length: 5 }, (_, k) => (
          <svg key={k} viewBox="0 0 24 24" className={k < t.rating ? "is-on" : ""} style={{ ["--k" as string]: k }} aria-hidden>
            <path d="m12 2.8 2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17.2l-5.7 3.1 1.2-6.4-4.7-4.4 6.4-.8z" />
          </svg>
        ))}
      </span>
    </div>
  );
}

/** The review's paragraphs, verbatim, with opening and closing quotation marks. */
function Paragraphs({ t }: { t: Testimonial }) {
  return (
    <>
      {t.quote.map((para, k) => (
        <p key={k}>
          {k === 0 && "\u201C"}
          {para}
          {k === t.quote.length - 1 && "\u201D"}
        </p>
      ))}
    </>
  );
}

/**
 * The whole review in a panel over the page: the reviewer stays pinned at the top, the letter
 * scrolls in its own area, and the signature closes it at the bottom.
 */
function FullReview({ t, onClose }: { t: Testimonial; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);
  const [edge, setEdge] = useState({ top: true, bottom: false });

  useEffect(() => {
    const lenis = getLenis();
    lenis?.stop();
    const opener = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const prevOverflow = html.style.overflow;
    html.style.overflow = "hidden";
    panel.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      // keep keyboard focus inside the panel
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("button, [tabindex='0']");
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) (e.preventDefault(), last.focus());
        else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus());
      }
    };
    addEventListener("keydown", key);
    return () => {
      removeEventListener("keydown", key);
      html.style.overflow = prevOverflow;
      lenis?.start();
      opener?.focus();
    };
  }, [onClose]);

  // soft fades at the top / bottom of the letter only while there is more to scroll
  const onScroll = () => {
    const el = body.current;
    if (!el) return;
    setEdge({ top: el.scrollTop < 4, bottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 4 });
  };
  useEffect(onScroll, []);

  return (
    <div className="cust-modal" onClick={onClose}>
      <div
        className="cust-modal__panel"
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={`Review by ${t.name}, ${t.company}`}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="cust-modal__head">
          <Who t={t} />
          <button type="button" className="cust-modal__close" onClick={onClose} aria-label="Close review">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </header>

        <div
          className={`cust-modal__body${edge.top ? "" : " has-above"}${edge.bottom ? "" : " has-below"}`}
          ref={body}
          onScroll={onScroll}
          tabIndex={0}
          data-lenis-prevent
        >
          <div className="cust-modal__letter">
            <span className="cust__mark" aria-hidden>
              &ldquo;
            </span>
            <Paragraphs t={t} />
          </div>
        </div>

        <footer className="cust-modal__sign">
          <span className="cust-modal__rule" aria-hidden />
          <span>
            <b>{t.name}</b>
            <em>{[t.role, t.company].filter(Boolean).join(", ")}</em>
          </span>
          {t.date && <time>{t.date}</time>}
        </footer>
      </div>
    </div>
  );
}

/** A tall glass pane at the screen's edge, a misty mountain view behind the glass. */
function Pane({ side }: { side: "left" | "right" }) {
  return (
    <div className={`cust-pane cust-pane--${side}`} aria-hidden>
      <div className="cust-pane__glass">
        <div className="cust-pane__sky" />
        <div className="cust-pane__cloud cust-pane__cloud--a" />
        <div className="cust-pane__cloud cust-pane__cloud--b" />
        <svg className="cust-pane__hills" viewBox="0 0 200 120" preserveAspectRatio="xMidYMax slice">
          <path className="far" d="M0 66 Q 22 46 44 58 T 88 44 T 132 56 T 176 40 T 220 52 V120 H0Z" />
          <path className="mid" d="M0 84 Q 28 68 56 80 T 112 72 T 168 82 T 224 72 V120 H0Z" />
          <path className="near" d="M0 100 Q 44 88 88 98 T 176 94 T 264 98 V120 H0Z" />
        </svg>
        <div className="cust-pane__sheen" />
      </div>
      <div className="cust-pane__reflection" />
    </div>
  );
}

const ICONS = {
  shield: (
    <svg viewBox="0 0 24 24">
      <path d="M12 3 5 5.8v5.4c0 4.3 2.9 8 7 9.3 4.1-1.3 7-5 7-9.3V5.8z" />
      <path d="M12 3v17.5" className="half" />
    </svg>
  ),
  bolt: (
    <svg viewBox="0 0 24 24">
      <path d="M13.2 2.8 5.6 13.4h5.6l-1 7.8 7.6-10.6h-5.6z" />
    </svg>
  ),
  people: (
    <svg viewBox="0 0 24 24">
      <circle cx="9" cy="8.5" r="3.2" />
      <circle cx="16.4" cy="9.6" r="2.5" />
      <path d="M3.5 19c.6-3.3 2.8-5.2 5.5-5.2s4.9 1.9 5.5 5.2z" />
      <path d="M15 14.2c.4-.1.9-.2 1.4-.2 2.2 0 3.9 1.6 4.4 4.6h-5.3" />
    </svg>
  ),
} as const;
