"use client";

import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PRODUCTS, productHref } from "./productsData";
import { productStore, useActiveProduct } from "./productStore";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** The product shown highlighted when nothing is hovered. */
const DEFAULT_ACTIVE = 0;

/** Products whose list item and card open the product's own page on click (all of them). */
const LINKED = new Set(PRODUCTS.map((p) => p.slug));

/** The section is composed on a 1780 × 1014 frame; the card art is drawn in those pixels and scaled to fit. */
const FRAME_W = 1780;
const FRAME_H = 1014;
/** On phones only the card cluster is shown, cropped to this part of the frame. */
const MOBILE_CROP = { x: 530, y: 250, w: 1250, h: 700 };

type Quad = [number, number, number, number, number, number, number, number];

/**
 * A CSS matrix3d that maps a w × h card onto the four corners it occupies in the frame
 * (top-left, top-right, bottom-right, bottom-left): an exact perspective placement.
 */
function quadMatrix(w: number, h: number, q: Quad) {
  const src = [0, 0, w, 0, w, h, 0, h];
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const [x, y, X, Y] = [src[i * 2], src[i * 2 + 1], q[i * 2], q[i * 2 + 1]];
    A.push([x, y, 1, 0, 0, 0, -x * X, -y * X, X]);
    A.push([0, 0, 0, x, y, 1, -x * Y, -y * Y, Y]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  const [a, b, c, d, e, f, g, hh] = A.map((row, i) => row[8] / row[i]);
  const m = [a, d, 0, g, b, e, 0, hh, 0, 0, 1, 0, c, f, 0, 1];
  return `matrix3d(${m.map((v) => +v.toFixed(8)).join(",")})`;
}

type Card = {
  slug: string;
  w: number;
  h: number;
  quad: Quad;
  /** title size, padding (top, left) in card pixels */
  fs: number;
  pad: [number, number];
  icon?: ReactNode;
  body: ReactNode;
  className?: string;
};

const DocIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M6 2.8h8.2L19 7.6v13.6H6z" />
    <path d="M14 2.8v5h5" />
    <path d="M9 12.4h7M9 15.6h7" strokeLinecap="round" />
  </svg>
);
const FolderIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
    <path d="M3 6.5h6l2 2.2h10v10.5H3z" />
    <circle cx="9.5" cy="22" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="13" cy="22" r="1.3" fill="currentColor" stroke="none" />
  </svg>
);
const MedIcon = (
  <svg viewBox="0 0 24 24">
    <path d="M9 3.5h6v2.5H9z" fill="currentColor" opacity="0.75" />
    <rect x="3.5" y="6" width="17" height="15" rx="3.2" fill="currentColor" opacity="0.75" />
    <path d="M12 9.6v7.8M8.1 13.5h7.8" stroke="#1d2431" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Lines = ({ rows }: { rows: [number, number?][] }) => (
  <div className="pcard__lines">
    {rows.map(([w, lit], i) => (
      <i key={i} style={{ width: `${w}%`, ["--lit" as string]: `${lit ?? 0}%` }} />
    ))}
  </div>
);

const CARDS: Card[] = [
  {
    slug: "cognafilesearch",
    w: 292,
    h: 190,
    fs: 17,
    pad: [26, 28],
    quad: [1232, 290, 1522, 309, 1522, 500, 1232, 476],
    icon: FolderIcon,
    body: (
      <div className="pcard__panel">
        <Lines rows={[[70, 30], [85], [60]]} />
      </div>
    ),
  },
  {
    slug: "cognabrief",
    w: 340,
    h: 236,
    fs: 19,
    pad: [28, 35],
    quad: [991, 350, 1327, 372, 1327, 610, 991, 585],
    icon: DocIcon,
    body: (
      <div className="pcard__panel">
        <Lines rows={[[86, 34], [86], [64]]} />
      </div>
    ),
  },
  {
    slug: "medibook-ai",
    w: 316,
    h: 210,
    fs: 18.5,
    pad: [30, 35],
    quad: [1344, 506, 1660, 532, 1660, 745, 1344, 715],
    icon: MedIcon,
    body: (
      <div className="pcard__panel">
        <Lines rows={[[40, 100], [88], [42]]} />
      </div>
    ),
  },
  {
    slug: "cognaassist",
    w: 480,
    h: 322,
    fs: 22,
    pad: [44, 46],
    quad: [857, 510, 1333, 550, 1333, 885, 857, 830],
    className: "pcard--main",
    body: (
      <>
        <div className="pcard__panel pcard__chat">
          <span className="pcard__avatar" />
          <Lines rows={[[56, 100], [62], [70], [34]]} />
        </div>
        <div className="pcard__input">
          <span className="pcard__caret" />
          <i />
          <span className="pcard__send">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
              <path d="M8 16 16 8M10 8h6v6" />
            </svg>
          </span>
        </div>
      </>
    ),
  },
];

/**
 * Where a card glides to when it is pointed at: out of the stack, in front of the cluster and
 * nearly facing the viewer, sized so every card's title reads at the same size.
 */
const FOCUS = { cx: 1186, cy: 596, title: 28 };
function focusQuad(c: Card): Quad {
  const k = FOCUS.title / c.fs;
  const W = c.w * k;
  const H = c.h * k;
  const x0 = FOCUS.cx - W / 2;
  const x1 = FOCUS.cx + W / 2;
  const y0 = FOCUS.cy - H / 2 - W * 0.02;
  // a gentle perspective, the right edge a touch nearer, as in the resting composition
  return [x0, y0, x1, y0 + W * 0.035, x1, y0 + W * 0.035 + H * 1.03, x0, y0 + H * 0.985];
}

const PLACED = CARDS.map((c) => ({
  ...c,
  transform: quadMatrix(c.w, c.h, c.quad),
  focus: quadMatrix(c.w, c.h, focusQuad(c)),
}));

/** The two orbits: true ellipses fitted to the composition (centre, radii, tilt in degrees). */
const ORBITS = [
  { cx: 1092.35, cy: 520.13, rx: 577.28, ry: 133.38, tilt: -18.18 },
  { cx: 1221.53, cy: 673.5, rx: 508.31, ry: 136.95, tilt: -8.12 },
];
// every light sits exactly on its orbit (the lower-left one where the two orbits cross)
const DOTS = [
  { x: 689.8, y: 549.2, r: 7.5 },
  { x: 717.8, y: 738.4, r: 6.5 },
  { x: 729.7, y: 708.8, r: 2.6 },
  { x: 1575.9, y: 437.4, r: 5.5 },
  { x: 1435.2, y: 770.4, r: 6.5 },
];

export default function Products() {
  const sectionRef = useRef<HTMLElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const hovered = useActiveProduct();
  const active = hovered >= 0 ? hovered : DEFAULT_ACTIVE;
  const activeSlug = PRODUCTS[active]?.slug;
  /** the card brought to the front (only while something is pointed at) */
  const focusSlug = hovered >= 0 ? PRODUCTS[hovered]?.slug : null;

  // pointing moves between a card's resting hit-area and its lifted self: a short grace period
  // on leave keeps it from dropping back while the pointer crosses from one to the other
  const leaveTimer = useRef(0);
  const enter = (i: number) => {
    clearTimeout(leaveTimer.current);
    productStore.set(i);
  };
  const leave = () => {
    clearTimeout(leaveTimer.current);
    leaveTimer.current = window.setTimeout(() => productStore.set(-1), 140);
  };
  useEffect(() => () => clearTimeout(leaveTimer.current), []);

  // scale the fixed-size card art to its box (the whole frame on desktop, a crop on phones)
  useLayoutEffect(() => {
    const art = artRef.current!;
    const stage = stageRef.current!;
    const fit = () => {
      const crop = art.clientWidth < 700 && matchMedia("(max-width: 760px)").matches ? MOBILE_CROP : null;
      const k = art.clientWidth / (crop ? crop.w : FRAME_W);
      stage.style.transform = crop
        ? `scale(${k}) translate(${-crop.x}px, ${-crop.y}px)`
        : `scale(${k})`;
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(art);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      // a one-time reveal as the section comes into view (no scroll-scrubbed animation)
      const st = { trigger: sectionRef.current, start: "top 70%", once: true };
      gsap.from("[data-reveal]", { autoAlpha: 0, y: 26, duration: 1, stagger: 0.08, ease: "power3.out", scrollTrigger: st });
      gsap.from(".products__art", { autoAlpha: 0, y: 30, duration: 1.4, ease: "power3.out", scrollTrigger: st });
    },
    { scope: sectionRef },
  );

  return (
    <section className="products" id="products" ref={sectionRef} aria-labelledby="products-title">
      <span className="jump" id="products-view" aria-hidden />
      <div className="products__frame">
        <div className="products__art" ref={artRef} aria-hidden>
          <div className={`products__stage${focusSlug ? " has-focus" : ""}`} ref={stageRef}>
            <div className="products__floor" />
            <svg className="products__orbits" viewBox={`0 0 ${FRAME_W} ${FRAME_H}`}>
              <defs>
                <radialGradient id="pdot-glow">
                  <stop offset="0.35" stopColor="#c9d9f4" stopOpacity="0.55" />
                  <stop offset="0.6" stopColor="#9fb5da" stopOpacity="0.18" />
                  <stop offset="1" stopColor="#8fa6cc" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="pdot-core" cx="0.42" cy="0.4" r="0.6">
                  <stop offset="0" stopColor="#f4f8ff" />
                  <stop offset="0.7" stopColor="#d2e0f6" />
                  <stop offset="1" stopColor="#b4c6e4" />
                </radialGradient>
                <linearGradient id="porbit" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#b9c7de" stopOpacity="0.6" />
                  <stop offset="0.55" stopColor="#a9b8d0" stopOpacity="0.3" />
                  <stop offset="1" stopColor="#c3d0e6" stopOpacity="0.6" />
                </linearGradient>
              </defs>
              {ORBITS.map((o, i) => (
                <ellipse
                  key={i}
                  cx={o.cx}
                  cy={o.cy}
                  rx={o.rx}
                  ry={o.ry}
                  transform={`rotate(${o.tilt} ${o.cx} ${o.cy})`}
                  fill="none"
                  stroke="url(#porbit)"
                  strokeWidth={i ? 1.1 : 1.4}
                />
              ))}
              {DOTS.map((d, i) => (
                <g key={i}>
                  <circle
                    className="products__dot-light"
                    style={{ animationDelay: `${-i * 1.3}s` }}
                    cx={d.x}
                    cy={d.y}
                    r={d.r * 2.2}
                    fill="url(#pdot-glow)"
                  />
                  <circle cx={d.x} cy={d.y} r={d.r} fill="url(#pdot-core)" />
                </g>
              ))}
            </svg>

            {PLACED.map((c) => {
              const p = PRODUCTS.find((x) => x.slug === c.slug)!;
              const i = PRODUCTS.indexOf(p);
              const linked = LINKED.has(c.slug);
              const focused = focusSlug === c.slug;
              const props = {
                className: `pcard ${c.className ?? ""}${activeSlug === c.slug ? " is-active" : ""}${focused ? " is-focus" : ""}`,
                style: {
                  width: c.w,
                  height: c.h,
                  transform: focused ? c.focus : c.transform,
                  padding: `${c.pad[0]}px ${c.pad[1]}px 0`,
                  ["--fs" as string]: `${c.fs}px`,
                  ["--pl" as string]: `${c.pad[1]}px`,
                  ["--pt" as string]: `${c.pad[0]}px`,
                },
                onMouseEnter: () => enter(i),
                onMouseLeave: leave,
              };
              const inner = (
                <>
                  <span className="pcard__sheen" />
                  <span className="pcard__name">{p.name}</span>
                  <span className="pcard__tag">{p.tagline}</span>
                  {c.icon && <span className="pcard__icon">{c.icon}</span>}
                  <div className="pcard__body">{c.body}</div>
                  {/* shown once the card is in front */}
                  <div className="pcard__more">
                    <p>{p.description}</p>
                    {linked ? (
                      <span className="pcard__cta">
                        View product <i>→</i>
                      </span>
                    ) : (
                      <span className="pcard__chip">{p.tag}</span>
                    )}
                  </div>
                </>
              );
              return linked ? (
                <Link key={c.slug} href={productHref(p)} tabIndex={-1} {...props}>
                  {inner}
                </Link>
              ) : (
                <div key={c.slug} {...props}>
                  {inner}
                </div>
              );
            })}

            {/* fixed hover areas where the cards rest: the lifted card moves, these don't */}
            {PLACED.map((c) => {
              const p = PRODUCTS.find((x) => x.slug === c.slug)!;
              const i = PRODUCTS.indexOf(p);
              const props = {
                className: "pcard-hit",
                style: { width: c.w, height: c.h, transform: c.transform },
                onMouseEnter: () => enter(i),
                onMouseLeave: leave,
              };
              return LINKED.has(c.slug) ? (
                <Link key={c.slug} href={productHref(p)} tabIndex={-1} {...props} />
              ) : (
                <span key={c.slug} {...props} />
              );
            })}

            {/* light catching the glass corners nearest the key light */}
            <span className="products__flare" style={{ left: 1516, top: 308 }} />
            <span className="products__flare products__flare--soft" style={{ left: 1326, top: 553 }} />
          </div>
        </div>

        <div className="products__intro">
          <p className="products__eyebrow" data-reveal>
            Smart AI Solutions
          </p>
          <h2 className="products__title" id="products-title" data-reveal>
            Our Intelligent <span>Suite</span>
          </h2>
          <p className="products__sub" data-reveal>
            Powerful AI products designed for specific enterprise needs.
          </p>

          <ul className="products__list" onMouseLeave={() => productStore.set(-1)}>
            {PRODUCTS.map((p, i) => (
              <li key={p.slug} data-reveal>
                {LINKED.has(p.slug) ? (
                  <Link
                    href={productHref(p)}
                    className={`products__item${active === i ? " is-active" : ""}`}
                    aria-label={`${p.name}: ${p.description}`}
                    onMouseEnter={() => productStore.set(i)}
                    onFocus={() => productStore.set(i)}
                  >
                    <span className="products__dot" aria-hidden />
                    <span className="products__name">{p.name}</span>
                  </Link>
                ) : (
                  <button
                    type="button"
                    className={`products__item${active === i ? " is-active" : ""}`}
                    aria-pressed={active === i}
                    aria-label={`${p.name}: ${p.description}`}
                    onMouseEnter={() => productStore.set(i)}
                    onFocus={() => productStore.set(i)}
                    onClick={() => productStore.set(i)}
                  >
                    <span className="products__dot" aria-hidden />
                    <span className="products__name">{p.name}</span>
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>

        <dl className="sr-only">
          {PRODUCTS.map((p) => (
            <div key={p.name}>
              <dt>{p.name}</dt>
              <dd>
                {p.tag}. {p.description}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
