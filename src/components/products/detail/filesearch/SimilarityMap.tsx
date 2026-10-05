"use client";

import { useInView, useReducedMotion } from "../hooks";

/**
 * Overview visual: the repository as a field of documents; the new document sits at the centre
 * and its closest matches light up, nearest first. Pure CSS/SVG loop while on screen.
 */
const W = 440;
const H = 260;
const C = { x: 220, y: 130 };

// a fixed scatter of documents (deterministic, so server and browser render the same)
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}
const r = rng(7);
const DOTS = Array.from({ length: 70 }, () => ({ x: 14 + r() * (W - 28), y: 14 + r() * (H - 28) })).filter(
  (d) => Math.hypot(d.x - C.x, d.y - C.y) > 26,
);
const MATCHES = [
  { x: C.x + 48, y: C.y - 26, s: 96 },
  { x: C.x - 74, y: C.y + 4, s: 91 },
  { x: C.x + 30, y: C.y + 56, s: 87 },
  { x: C.x - 40, y: C.y - 60, s: 82 },
  { x: C.x + 96, y: C.y + 18, s: 77 },
];

export default function SimilarityMap() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();

  return (
    <div className="smap" ref={ref} data-run={inView && !reduced ? "" : undefined} aria-hidden>
      <div className="smap__field">
        <svg viewBox={`0 0 ${W} ${H}`}>
          {[40, 80, 120].map((rad, i) => (
            <circle key={rad} cx={C.x} cy={C.y} r={rad} className="smap__ring" style={{ ["--i" as string]: i }} />
          ))}
          <circle cx={C.x} cy={C.y} r={34} className="smap__pulse" />
          {DOTS.map((d, i) => (
            <circle key={i} cx={d.x} cy={d.y} r={2.2} className="smap__dot" style={{ ["--i" as string]: i % 9 }} />
          ))}
          {MATCHES.map((m, i) => (
            <g key={i} className="smap__match" style={{ ["--i" as string]: i }}>
              <line x1={C.x} y1={C.y} x2={m.x} y2={m.y} pathLength={1} />
              <circle cx={m.x} cy={m.y} r={5} />
              <text x={m.x + 9} y={m.y + 3.5}>
                {m.s}%
              </text>
            </g>
          ))}
          <g className="smap__query">
            <rect x={C.x - 13} y={C.y - 16} width={26} height={32} rx={3} />
            <path d={`M${C.x - 7} ${C.y - 7}h14 M${C.x - 7} ${C.y - 1}h14 M${C.x - 7} ${C.y + 5}h9`} />
          </g>
        </svg>
        <span className="smap__tag">New document</span>
      </div>

      <div className="smap__compare">
        <div>
          <span>Manual searching</span>
          <i className="smap__bar smap__bar--manual" />
          <b>Hours</b>
        </div>
        <div>
          <span>CognaFileSearch</span>
          <i className="smap__bar smap__bar--ai" />
          <b>Seconds</b>
        </div>
      </div>
    </div>
  );
}
