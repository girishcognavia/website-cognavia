"use client";

import { useInView, useReducedMotion } from "../hooks";

/**
 * Overview visual: a stack of 50 pages folds down into a single, cited summary.
 * Pure CSS loop, running only while on screen.
 */
export default function Condense() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();

  return (
    <div className="cond" ref={ref} data-run={inView && !reduced ? "" : undefined} aria-hidden>
      <div className="cond__stage">
        <div className="cond__stack">
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className="cond__page" style={{ ["--i" as string]: i }}>
              <i />
              <i />
              <i />
              <i />
            </span>
          ))}
          <b className="cond__count">50 pages</b>
        </div>

        <div className="cond__beam" />

        <div className="cond__sum">
          <span className="cond__sum-head">
            <b>Summary</b>
            <em>1 page</em>
          </span>
          {[88, 74, 92, 66].map((w, i) => (
            <span key={i} className="cond__line" style={{ ["--i" as string]: i }}>
              <i style={{ width: `${w}%` }} />
              <em>p. {[4, 11, 19, 33][i]}</em>
            </span>
          ))}
        </div>
      </div>

      <div className="cond__meta">
        <span>
          <b>50</b> pages in
        </span>
        <span className="cond__arrow" />
        <span>
          <b>1</b> concise summary
        </span>
        <span className="cond__pill">Under a minute</span>
      </div>
    </div>
  );
}
