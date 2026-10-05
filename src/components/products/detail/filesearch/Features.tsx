"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";
import { Drawing } from "./Drawing";

/** Small live visuals, one per CognaFileSearch key feature (all content illustrative). */

const run = (inView: boolean, reduced: boolean) => (inView && !reduced ? "" : undefined);

/* 01 — Instant Results (10,000+ docs in < 3s) */
export function FxInstant() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [t, setT] = useState(30); // tenths of the cycle
  useTicker(inView && !reduced, 70, () => setT((v) => (v >= 50 ? 0 : v + 1)));
  const p = Math.min(1, t / 30);
  const docs = Math.round((1 - Math.pow(1 - p, 2)) * 10482);
  return (
    <div className="fx fsx-inst" ref={ref}>
      <div className="fsx-inst__read">
        <b>{docs.toLocaleString("en-US")}</b>
        <span>documents searched</span>
      </div>
      <div className="fsx-inst__timer">
        <span className="fsx-inst__track">
          <i style={{ transform: `scaleX(${p * 0.8})` }} />
          <em style={{ left: "100%" }}>3s</em>
        </span>
        <span className="fsx-inst__time">
          {(p * 2.4).toFixed(1)}s {p >= 1 && <b>Done</b>}
        </span>
      </div>
    </div>
  );
}

/* 02 — Intelligent PDF Processing & OCR */
export function FxOcr() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  return (
    <div className="fx fsx-ocr" ref={ref} data-run={run(inView, reduced)}>
      <div className="fsx-ocr__page">
        {[86, 72, 90, 64, 80, 58].map((w, i) => (
          <span key={i} className="fsx-ocr__row" style={{ ["--i" as string]: i, width: `${w}%` }}>
            <i className="fsx-ocr__raw" />
            <i className="fsx-ocr__txt" />
          </span>
        ))}
        <b className="fsx-ocr__scan" />
      </div>
      <div className="fsx-ocr__legend">
        <span>Scanned</span>
        <em>→</em>
        <span className="is-on">Searchable text</span>
      </div>
    </div>
  );
}

/* 03 — Advanced Similarity Matching */
export function FxMatch() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  return (
    <div className="fx fsx-match" ref={ref} data-run={run(inView, reduced)}>
      <div className="fsx-match__pair">
        <span className="fsx-match__a">
          <Drawing part={0} />
        </span>
        <span className="fsx-match__b">
          <Drawing part={5} />
        </span>
        <span className="fsx-match__hit" />
      </div>
      <div className="fsx-match__score">
        <b>94%</b>
        <span>similarity</span>
      </div>
    </div>
  );
}

/* 04 — Flexible Repository Management */
const REPOS = [
  { name: "Drawings", n: "6,214" },
  { name: "Specifications", n: "2,930" },
  { name: "Archive 2015–2020", n: "1,338" },
];
export function FxRepos() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(0);
  useTicker(inView && !reduced, 1300, () => setK((v) => (v + 1) % 4));
  return (
    <div className="fx fsx-repo" ref={ref}>
      <ul>
        {REPOS.map((r, i) => (
          <li key={r.name} className={`${i < k || k === 3 ? "is-on" : ""}${i === k ? " is-sync" : ""}`}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M3 6.5h6l2 2.2h10v10.5H3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            <span>{r.name}</span>
            <em>{r.n}</em>
            <b className="fsx-repo__toggle">
              <i />
            </b>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 05 — Weighted Scoring Algorithm */
const WEIGHTS = [
  { name: "Geometry", w: 40, v: 97 },
  { name: "Text & specs", w: 35, v: 92 },
  { name: "Metadata", w: 25, v: 90 },
];
export function FxWeights() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const total = Math.round(WEIGHTS.reduce((s, x) => s + (x.w * x.v) / 100, 0));
  return (
    <div className="fx fsx-wt" ref={ref} data-run={run(inView, reduced)}>
      <ul>
        {WEIGHTS.map((x, i) => (
          <li key={x.name} style={{ ["--i" as string]: i }}>
            <span>
              {x.name} <em>× {x.w}%</em>
            </span>
            <i>
              <i style={{ ["--v" as string]: `${x.v}%` }} />
            </i>
          </li>
        ))}
      </ul>
      <div className="fsx-wt__total">
        <span>Weighted score</span>
        <b>{total}%</b>
      </div>
    </div>
  );
}

/* 06 — Enterprise-Ready Security */
export function FxSecure() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  return (
    <div className="fx fsx-sec" ref={ref} data-run={run(inView, reduced)}>
      <div className="fsx-sec__shield">
        <svg viewBox="0 0 64 72" aria-hidden>
          <path d="M32 4 8 13v18c0 17 10.5 30 24 37 13.5-7 24-20 24-37V13z" className="fsx-sec__outline" />
          <rect x="22" y="33" width="20" height="16" rx="3" className="fsx-sec__lock" />
          <path d="M26 33v-5a6 6 0 0 1 12 0v5" className="fsx-sec__shackle" />
        </svg>
        <span className="fsx-sec__ring" />
        <span className="fsx-sec__ring fsx-sec__ring--2" />
      </div>
      <div className="fsx-sec__docs">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} style={{ ["--i" as string]: i }}>
            <i />
          </span>
        ))}
      </div>
    </div>
  );
}
