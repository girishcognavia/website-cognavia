"use client";

import { useEffect, useState } from "react";
import { sleep, useInView, useReducedMotion } from "../hooks";
import { Drawing, PART_COUNT } from "./Drawing";

/**
 * Hero demo: a new drawing is uploaded, the repository (10,000+ documents) is searched in
 * under three seconds, and ranked matches appear with their similarity scores.
 * File names and scores are illustrative.
 */
const QUERIES = [
  {
    file: "Bracket_Rev_C.pdf",
    part: 0,
    results: [
      { name: "BRK-2207_Rev_B.pdf", meta: "Drawing · 2021", score: 96, part: 0 },
      { name: "BRK-1984_Mount.pdf", meta: "Drawing · 2018", score: 88, part: 5 },
      { name: "SPEC-Bracket-Std.pdf", meta: "Specification · 2020", score: 81, part: 0 },
      { name: "PLT-3310_Base.pdf", meta: "Drawing · 2017", score: 72, part: 2 },
    ],
  },
  {
    file: "Flange_DN80.pdf",
    part: 1,
    results: [
      { name: "FLG-0880_PN16.pdf", meta: "Drawing · 2022", score: 94, part: 1 },
      { name: "FLG-0650_Blind.pdf", meta: "Drawing · 2019", score: 86, part: 1 },
      { name: "SPEC-Flanges-EN.pdf", meta: "Specification · 2021", score: 79, part: 1 },
      { name: "HSG-4402_Pump.pdf", meta: "Drawing · 2016", score: 68, part: 4 },
    ],
  },
];
const TOTAL = 10482;

export default function SearchDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [q, setQ] = useState(0);
  const [phase, setPhase] = useState(2); // 0 upload · 1 searching · 2 results
  const [count, setCount] = useState(TOTAL);
  const [ms, setMs] = useState(2.4);
  const [shown, setShown] = useState(4);

  useEffect(() => {
    if (reduced || !inView) return;
    let off = false;
    (async () => {
      let k = 0;
      await sleep(500);
      while (!off) {
        setQ(k);
        setShown(0);
        setCount(0);
        setMs(0);
        setPhase(0);
        await sleep(1300);
        if (off) return;
        setPhase(1);
        const start = performance.now();
        const RUN = 1900;
        while (!off) {
          const t = Math.min(1, (performance.now() - start) / RUN);
          const e = 1 - Math.pow(1 - t, 2);
          setCount(Math.round(e * TOTAL));
          setMs(+(t * (2.2 + k * 0.3)).toFixed(1));
          if (t >= 1) break;
          await sleep(40);
        }
        if (off) return;
        setPhase(2);
        for (let i = 1; i <= 4 && !off; i++) {
          setShown(i);
          await sleep(260);
        }
        await sleep(4200);
        k = (k + 1) % QUERIES.length;
      }
    })();
    return () => {
      off = true;
      setPhase(2);
      setShown(4);
      setCount(TOTAL);
    };
  }, [inView, reduced]);

  const Q = QUERIES[q];

  return (
    <div className="fsdemo" ref={ref} role="img" aria-label="Illustration: CognaFileSearch matching a new drawing against 10,000+ documents in under three seconds">
      <div className="fsdemo__win">
        <div className="fsdemo__bar">
          <span className="fsdemo__logo">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M3 6.5h6l2 2.2h10v10.5H3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <circle cx="13" cy="14" r="2.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <path d="m15 16 2 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            CognaFileSearch
          </span>
          <span className="fsdemo__repo">
            <i /> Repository · {TOTAL.toLocaleString("en-US")} documents
          </span>
        </div>

        <div className="fsdemo__body">
          {/* the new document */}
          <div className="fsdemo__query">
            <span className="fsdemo__label">New document</span>
            <div className={`fsdemo__sheet${phase === 0 ? " is-arriving" : ""}`} key={q}>
              <Drawing part={Q.part} dims className="fsdemo__draw" />
              <span className="fsdemo__title-block">
                <i />
                <i />
              </span>
            </div>
            <span className="fsdemo__file">
              <b>PDF</b> {Q.file}
            </span>

            <div className={`fsdemo__status p${phase}`}>
              <span>{phase === 0 ? "Uploading…" : phase === 1 ? "Searching repository" : "Search complete"}</span>
              <b>
                {count.toLocaleString("en-US")} <em>docs</em>
              </b>
              <span className="fsdemo__track">
                <i style={{ transform: `scaleX(${count / TOTAL})` }} />
              </span>
              <span className="fsdemo__time">
                <i /> {ms.toFixed(1)}s
              </span>
            </div>
          </div>

          {/* repository scan, then the ranked matches */}
          <div className="fsdemo__side">
            {phase < 2 ? (
              <div className={`fsdemo__grid${phase === 1 ? " is-scanning" : ""}`}>
                {Array.from({ length: 24 }, (_, i) => (
                  <span key={i} style={{ ["--i" as string]: i }}>
                    <Drawing part={(i * 5 + q) % PART_COUNT} />
                  </span>
                ))}
              </div>
            ) : (
              <div className="fsdemo__results">
                <span className="fsdemo__label">Ranked matches</span>
                <ol>
                  {Q.results.slice(0, shown).map((r, i) => (
                    <li key={`${q}-${r.name}`} className={i === 0 ? "is-top" : ""}>
                      <span className="fsdemo__thumb">
                        <Drawing part={r.part} />
                      </span>
                      <span className="fsdemo__meta">
                        <b>{r.name}</b>
                        <em>{r.meta}</em>
                        <i className="fsdemo__bar-score">
                          <i style={{ ["--s" as string]: `${r.score}%` }} />
                        </i>
                      </span>
                      <span className="fsdemo__score">{r.score}%</span>
                      {i === 0 && <span className="fsdemo__flag">Similar design exists</span>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
