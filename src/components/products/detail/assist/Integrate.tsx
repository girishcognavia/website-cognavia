"use client";

import { useEffect, useState } from "react";
import { useInView, useReducedMotion } from "../hooks";

/**
 * Overview visual: the website's code with the two added lines dropping in, a setup timer
 * running to 60 seconds, and the widget going live. Loops while on screen.
 */
const CODE: { w: number[]; indent: number; added?: boolean }[] = [
  { w: [22, 30], indent: 0 },
  { w: [16, 40, 18], indent: 1 },
  { w: [28, 12], indent: 2 },
  { w: [34, 22, 10], indent: 2 },
  { w: [14], indent: 1 },
  { w: [18, 26], indent: 1 },
  { w: [30, 18, 24], indent: 2 },
  { w: [10, 42, 14], indent: 2, added: true },
  { w: [26, 30], indent: 2, added: true },
  { w: [16], indent: 1 },
  { w: [12], indent: 0 },
];

export default function Integrate() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [secs, setSecs] = useState(60);

  useEffect(() => {
    if (!inView || reduced) return;
    let raf = 0;
    let start = performance.now();
    const RUN = 3600; // the timer's run (ms) for its 60 "seconds"
    const LOOP = 9000;
    setSecs(0);
    const tick = (now: number) => {
      const e = now - start;
      if (e > LOOP) {
        start = now;
        setCycle((c) => c + 1);
        setSecs(0);
      } else {
        setSecs(Math.min(60, Math.round((Math.max(0, e - 900) / RUN) * 60)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, reduced]);

  const live = secs >= 60;

  return (
    <div className="integ" ref={ref} aria-hidden>
      <div className="integ__editor" key={cycle} data-run={inView && !reduced ? "" : undefined}>
        <div className="integ__tabs">
          <span className="is-on">index.html</span>
          <span>styles.css</span>
        </div>
        <ol className="integ__code">
          {CODE.map((l, i) => (
            <li key={i} className={l.added ? "is-added" : ""} style={{ ["--n" as string]: i - 7 }}>
              <span className="integ__ln">{i + 1}</span>
              <span className="integ__line" style={{ paddingLeft: l.indent * 18 }}>
                {l.w.map((w, j) => (
                  <i key={j} style={{ width: `${w}%` }} className={`t${(i + j) % 3}`} />
                ))}
              </span>
              {l.added && <em className="integ__plus">+</em>}
            </li>
          ))}
        </ol>
      </div>

      <div className="integ__status">
        <div className="integ__timer">
          <svg viewBox="0 0 44 44">
            <circle cx="22" cy="22" r="19" className="integ__track" />
            <circle
              cx="22"
              cy="22"
              r="19"
              className="integ__prog"
              style={{ strokeDashoffset: 119.4 * (1 - secs / 60) }}
            />
          </svg>
          <span>{secs}s</span>
        </div>
        <div className="integ__label">
          <strong>{live ? "Widget live" : "Connecting…"}</strong>
          <span>2 lines added · setup under 60 seconds</span>
        </div>
        <span className={`integ__pill${live ? " is-live" : ""}`}>
          <i /> {live ? "Live" : "Setup"}
        </span>
      </div>
    </div>
  );
}
