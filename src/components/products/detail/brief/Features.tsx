"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";

/** Small live visuals, one per CognaBrief key feature (all content illustrative). */

const run = (inView: boolean, reduced: boolean) => (inView && !reduced ? "" : undefined);

/* 01 — Multi-Format Support (PDF, DOCX, TXT) */
export function FxFormats() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  return (
    <div className="fx bfx-fmt" ref={ref} data-run={run(inView, reduced)}>
      <div className="bfx-fmt__files">
        {["PDF", "DOCX", "TXT"].map((f, i) => (
          <span key={f} className="bfx-file" style={{ ["--i" as string]: i }}>
            <svg viewBox="0 0 40 50" aria-hidden>
              <path d="M4 2h22l10 10v36H4z" />
              <path d="M26 2v10h10" />
            </svg>
            <b>{f}</b>
          </span>
        ))}
      </div>
      <div className="bfx-fmt__tray">
        <span>Drop files here</span>
        <em>3 files ready</em>
      </div>
    </div>
  );
}

/* 02 — Three Summary Levels (Quick, Standard, Detailed) */
const LEVELS = [
  { name: "Quick", lines: [92, 70] },
  { name: "Standard", lines: [94, 82, 88, 60] },
  { name: "Detailed", lines: [96, 84, 90, 78, 92, 86, 54] },
];
export function FxLevels() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(1);
  useTicker(inView && !reduced, 1800, () => setK((v) => (v + 1) % 3));
  return (
    <div className="fx bfx-lvl" ref={ref}>
      <div className="bfx-lvl__seg" style={{ ["--k" as string]: k }}>
        <i />
        {LEVELS.map((l, i) => (
          <span key={l.name} className={i === k ? "is-on" : ""}>
            {l.name}
          </span>
        ))}
      </div>
      <div className="bfx-lvl__doc">
        {LEVELS[2].lines.map((w, i) => (
          <i key={i} className={i < LEVELS[k].lines.length ? "is-on" : ""} style={{ width: `${LEVELS[k].lines[i] ?? w}%`, ["--i" as string]: i }} />
        ))}
      </div>
    </div>
  );
}

/* 03 — Dual-AI Quality Assurance */
export function FxDualAI() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [p, setP] = useState(4);
  useTicker(inView && !reduced, 850, () => setP((v) => (v + 1) % 6));
  return (
    <div className={`fx bfx-dual p${p}`} ref={ref}>
      <span className="bfx-dual__ai bfx-dual__ai--a">
        AI <b>1</b>
        <em>Writes</em>
      </span>
      <div className="bfx-dual__doc">
        {[0, 1, 2].map((i) => (
          <span key={i} className={p > i + 1 ? "is-ok" : ""}>
            <i />
            <b>✓</b>
          </span>
        ))}
        <em className="bfx-dual__badge">Verified</em>
      </div>
      <span className="bfx-dual__ai bfx-dual__ai--b">
        AI <b>2</b>
        <em>Checks</em>
      </span>
      <svg className="bfx-dual__wires" viewBox="0 0 200 100" preserveAspectRatio="none">
        <path d="M38 50 H 78" />
        <path d="M122 50 H 162" />
      </svg>
    </div>
  );
}

/* 04 — Page-Level Citations */
const CITES = [4, 11, 19];
export function FxCitations() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(0);
  useTicker(inView && !reduced, 1500, () => setK((v) => (v + 1) % CITES.length));
  return (
    <div className="fx bfx-cite" ref={ref}>
      <ul className="bfx-cite__lines">
        {CITES.map((c, i) => (
          <li key={c} className={i === k ? "is-on" : ""}>
            <i style={{ width: `${[82, 66, 74][i]}%` }} />
            <em>p. {c}</em>
          </li>
        ))}
      </ul>
      <div className="bfx-cite__pages">
        {CITES.map((c, i) => (
          <span key={c} className={i === k ? "is-on" : ""}>
            <i />
            <i />
            <i />
            <b>{c}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

/* 05 — Visual Element Detection */
export function FxVisual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  return (
    <div className="fx bfx-vis" ref={ref} data-run={run(inView, reduced)}>
      <div className="bfx-vis__page">
        <i className="bfx-vis__h" />
        <i />
        <div className="bfx-vis__chart bfx-box" data-label="Chart">
          {[40, 66, 52, 84, 70, 92].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="bfx-vis__table bfx-box" data-label="Table">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} />
          ))}
        </div>
        <div className="bfx-vis__img bfx-box" data-label="Figure">
          <svg viewBox="0 0 40 26" aria-hidden>
            <path d="M2 24 14 10l8 9 6-6 10 11z" />
            <circle cx="30" cy="7" r="3.2" />
          </svg>
        </div>
        <span className="bfx-vis__scan" />
      </div>
    </div>
  );
}

/* 06 — Professional Output Format */
export function FxOutput() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  return (
    <div className="fx bfx-out" ref={ref} data-run={run(inView, reduced)}>
      <div className="bfx-out__doc">
        <span className="bfx-out__brand" />
        <b className="bfx-out__title" />
        <span className="bfx-out__label">Executive summary</span>
        <i />
        <i className="w80" />
        <span className="bfx-out__label">Key findings</span>
        <i className="bullet" />
        <i className="bullet w70" />
      </div>
      <div className="bfx-out__export">
        <span>Structured</span>
        <span>Cited</span>
      </div>
    </div>
  );
}
