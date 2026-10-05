"use client";

import { useEffect, useState } from "react";
import { sleep, useInView, useReducedMotion } from "../hooks";

/**
 * Hero demo: a 50-page report is scanned page by page while its summary is written, each
 * point carrying the page it came from, then checked by the second AI. Cycles through the
 * three summary levels. The document and its contents are illustrative.
 */
const LEVELS = ["Quick", "Standard", "Detailed"] as const;
const POINTS = [
  { text: "Revenue grew 18% year over year, led by the enterprise segment.", page: 4 },
  { text: "Operating margin improved to 22% as infrastructure costs fell.", page: 11 },
  { text: "Three new markets opened in Q3, with expansion planned for next year.", page: 19 },
  { text: "Key risks: supplier concentration and currency exposure.", page: 33 },
  { text: "The board recommends a 12% increase in R&D investment.", page: 47 },
];
const COUNT = [2, 3, 5]; // points per level
const STAGES = ["Analyzing", "Extracting", "Generating", "Verifying"] as const;

type Shown = { text: string; page: number; done: boolean };

export default function BriefDemo() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [level, setLevel] = useState(1);
  const [stage, setStage] = useState(4); // 0..3 running, 4 = done
  const [page, setPage] = useState(50);
  const [points, setPoints] = useState<Shown[]>(() => POINTS.slice(0, 3).map((p) => ({ ...p, done: true })));
  const [secs, setSecs] = useState(46);

  useEffect(() => {
    if (reduced || !inView) return;
    let off = false;
    (async () => {
      let lv = 0;
      await sleep(600);
      while (!off) {
        setLevel(lv);
        setPoints([]);
        setSecs(0);
        // analyze: the pages are scanned
        setStage(0);
        for (let p = 1; p <= 50 && !off; p++) {
          setPage(p);
          if (p % 5 === 0) setSecs((s) => s + 2);
          await sleep(38);
        }
        if (off) return;
        setStage(1);
        await sleep(700);
        if (off) return;
        setStage(2);
        // generate: the points stream in
        for (let i = 0; i < COUNT[lv] && !off; i++) {
          const words = POINTS[i].text.split(" ");
          setPoints((ps) => [...ps, { text: "", page: POINTS[i].page, done: false }]);
          for (let w = 1; w <= words.length && !off; w++) {
            const text = words.slice(0, w).join(" ");
            setPoints((ps) => ps.map((x, j) => (j === i ? { ...x, text } : x)));
            await sleep(42);
          }
          setPoints((ps) => ps.map((x, j) => (j === i ? { ...x, done: true } : x)));
          setSecs((s) => s + 3);
          await sleep(160);
        }
        if (off) return;
        setStage(3);
        await sleep(1100);
        if (off) return;
        setStage(4);
        setSecs((s) => Math.max(s, 38 + lv * 4));
        await sleep(3600);
        lv = (lv + 1) % LEVELS.length;
      }
    })();
    return () => {
      off = true;
      // leave a finished summary in place when the demo pauses
      setStage(4);
      setPage(50);
      setPoints((ps) => ps.filter((x) => x.done));
    };
  }, [inView, reduced]);

  const scanning = stage === 0;

  return (
    <div className="bdemo" ref={ref} role="img" aria-label="Illustration: CognaBrief summarizing a 50-page PDF report with page citations">
      <div className="bdemo__win">
        <div className="bdemo__bar">
          <span className="bdemo__logo">
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 2.8h8.2L19 7.6v13.6H6z M14 2.8v5h5 M9 12.4h7M9 15.6h7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round" />
            </svg>
            CognaBrief
          </span>
          <span className="bdemo__file">
            <b>PDF</b> Annual_Report.pdf <em>· 50 pages</em>
          </span>
        </div>

        <div className="bdemo__body">
          {/* the document */}
          <div className="bdemo__doc">
            <div className={`bdemo__page${scanning ? " is-scanning" : ""}`}>
              <i className="bdemo__h" />
              <i />
              <i />
              <i className="w70" />
              <div className="bdemo__fig">
                <span style={{ height: "40%" }} />
                <span style={{ height: "65%" }} />
                <span style={{ height: "52%" }} />
                <span style={{ height: "85%" }} />
                <span style={{ height: "70%" }} />
              </div>
              <i />
              <i className="w80" />
              <div className="bdemo__table">
                {Array.from({ length: 9 }, (_, k) => (
                  <span key={k} />
                ))}
              </div>
              <i className="w60" />
              {scanning && <b className="bdemo__scan" />}
            </div>
            <div className="bdemo__pager">
              <span>
                Page <b>{page}</b> / 50
              </span>
              <span className="bdemo__track">
                <i style={{ transform: `scaleX(${page / 50})` }} />
              </span>
            </div>
          </div>

          {/* the summary */}
          <div className="bdemo__sum">
            <div className="bdemo__levels">
              {LEVELS.map((l, i) => (
                <span key={l} className={i === level ? "is-on" : ""}>
                  {l}
                </span>
              ))}
            </div>

            <ol className="bdemo__stages">
              {STAGES.map((s, i) => (
                <li key={s} className={stage > i ? "is-done" : stage === i ? "is-busy" : ""}>
                  <i />
                  {s === "Verifying" ? "Dual-AI check" : s}
                </li>
              ))}
            </ol>

            <div className="bdemo__out">
              <p className="bdemo__title">Executive summary</p>
              <ul>
                {points.map((p, i) => (
                  <li key={i} className={p.done ? "is-done" : ""}>
                    <span>{p.text}</span>
                    {p.done && <em>p. {p.page}</em>}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`bdemo__foot${stage === 4 ? " is-done" : ""}`}>
              <span className="bdemo__verified">
                <svg viewBox="0 0 24 24" aria-hidden>
                  <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" fill="none" stroke="currentColor" strokeWidth="1.6" />
                  <path d="m8.8 12 2.2 2.2 4.3-4.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {stage === 4 ? "Verified by Dual-AI" : "Working…"}
              </span>
              <span className="bdemo__time">
                50 pages → <b>{secs}s</b>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
