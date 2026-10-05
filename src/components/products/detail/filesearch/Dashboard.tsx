"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";
import { Drawing } from "./Drawing";

/** Benefits visual: a live CognaFileSearch dashboard (illustrative data). */

const QUERIES = [
  { file: "Bracket_Rev_C.pdf", top: 96, part: 0, dup: true },
  { file: "Shaft_Assy_04.pdf", top: 71, part: 3, dup: false },
  { file: "Flange_DN80.pdf", top: 94, part: 1, dup: true },
  { file: "Cover_Plate_12.pdf", top: 83, part: 2, dup: false },
  { file: "Pump_Housing_Spec.pdf", top: 89, part: 4, dup: true },
];
// search times (s) for the latest searches; every one under the 3-second line
const seedTimes = [2.1, 1.8, 2.4, 2.2, 1.9, 2.6, 2.3, 2.0, 2.5, 1.7, 2.2, 2.4, 2.1, 1.9, 2.3, 2.6, 2.0, 2.2, 1.8, 2.4];

export default function Dashboard() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [times, setTimes] = useState(seedTimes);
  const [searches, setSearches] = useState(1342);
  const [dups, setDups] = useState(187);
  const [head, setHead] = useState(0);

  useTicker(inView && !reduced, 2200, () => {
    const q = QUERIES[(head + 3) % QUERIES.length];
    setHead((h) => (h + 1) % QUERIES.length);
    setTimes((t) => [...t.slice(1), +(1.6 + Math.random() * 1.1).toFixed(1)]);
    setSearches((s) => s + 1);
    if (q.dup) setDups((d) => d + 1);
  });

  const recent = [0, 1, 2].map((k) => QUERIES[(head + 2 - k + QUERIES.length) % QUERIES.length]);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;

  return (
    <div className="dash fsdash" ref={ref} role="img" aria-label="Illustration: a live CognaFileSearch dashboard">
      <div className="dash__top">
        <div className="dash__brand">
          <i />
          <span>
            CognaFileSearch <em>· Matching</em>
          </span>
        </div>
        <span className="dash__live">
          <i /> Live
        </span>
      </div>

      <div className="dash__kpis">
        <div className="dash__kpi">
          <span>Documents indexed</span>
          <b>10,482</b>
          <em>3 repositories</em>
        </div>
        <div className="dash__kpi">
          <span>Avg. search time</span>
          <b>{avg.toFixed(1)}s</b>
          <em>Under 3 seconds</em>
        </div>
        <div className="dash__kpi">
          <span>Searches this month</span>
          <b key={searches} className="dash__bump">
            {searches.toLocaleString("en-US")}
          </b>
          <em>▲ 14.2%</em>
        </div>
        <div className="dash__kpi">
          <span>Similar designs surfaced</span>
          <b key={`d${dups}`} className="dash__bump">
            {dups}
          </b>
          <em>Duplication prevented</em>
        </div>
      </div>

      <div className="dash__grid">
        <div className="dash__card dash__card--wide">
          <div className="dash__card-head">
            <span>Search time · latest searches</span>
            <em>Target: under 3s</em>
          </div>
          <div className="fsdash__times">
            <span className="fsdash__limit">
              <em>3s</em>
            </span>
            {times.map((t, i) => (
              <i key={i} style={{ height: `${(t / 3.4) * 100}%` }} className={i === times.length - 1 ? "is-new" : ""} />
            ))}
          </div>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>Recent searches</span>
          </div>
          <ul className="fsdash__recent">
            {recent.map((q, i) => (
              <li key={`${q.file}-${head}-${i}`} className={i === 0 ? "is-new" : ""}>
                <span className="fsdash__thumb">
                  <Drawing part={q.part} />
                </span>
                <span>
                  {q.file}
                  <em>{q.dup ? "Similar design found" : "No close match"}</em>
                </span>
                <b>{q.top}%</b>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>Top-match score</span>
          </div>
          <ul className="dash__topics">
            {[
              { q: "90–100%", v: 38 },
              { q: "80–89%", v: 34 },
              { q: "70–79%", v: 19 },
              { q: "Below 70%", v: 9 },
            ].map((t) => (
              <li key={t.q}>
                <span>
                  {t.q} <em>{t.v}%</em>
                </span>
                <i style={{ ["--v" as string]: `${t.v}%` }} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="dash__note">Illustrative data</p>
    </div>
  );
}
