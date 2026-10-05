"use client";

import StepsTrack from "../StepsTrack";
import { Drawing, PART_COUNT } from "./Drawing";

type Step = { title: string; text: string };

/** CognaFileSearch: configure, batch process, upload & search, review. */
export default function Steps({ steps }: { steps: Step[] }) {
  return <StepsTrack steps={steps} scenes={SCENES} />;
}

const SCENES = [
  // Configure
  () => (
    <div className="fssc-cfg">
      <label>
        <span>Repository location</span>
        <em className="fssc-cfg__path">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M3 6.5h6l2 2.2h10v10.5H3z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          <span className="fssc-cfg__typed">//engineering/document-vault</span>
        </em>
      </label>
      <div className="fssc-cfg__folders">
        {["Drawings", "Specifications", "Archive"].map((f, i) => (
          <span key={f} style={{ ["--i" as string]: i }}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M3 6.5h6l2 2.2h10v10.5H3z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
            {f}
          </span>
        ))}
      </div>
      <b className="fssc-cfg__ok">Connected</b>
    </div>
  ),
  // Batch process
  () => (
    <div className="fssc-batch">
      <div className="fssc-batch__grid">
        {Array.from({ length: 40 }, (_, i) => (
          <span key={i} style={{ ["--i" as string]: (i * 7) % 40 }}>
            <Drawing part={i % PART_COUNT} />
          </span>
        ))}
      </div>
      <div className="fssc-batch__bar">
        <span>Indexing documents</span>
        <i>
          <i />
        </i>
      </div>
    </div>
  ),
  // Upload & search
  () => (
    <div className="fssc-search">
      <span className="fssc-search__doc">
        <Drawing part={1} dims />
      </span>
      <span className="fssc-search__beam" />
      <div className="fssc-search__stack">
        {[0, 1, 2, 3, 4].map((i) => (
          <span key={i} style={{ ["--i" as string]: i }}>
            <Drawing part={(i + 1) % PART_COUNT} />
          </span>
        ))}
      </div>
    </div>
  ),
  // Review
  () => (
    <div className="fssc-rev">
      {[
        { n: "FLG-0880_PN16.pdf", s: 94, p: 1 },
        { n: "FLG-0650_Blind.pdf", s: 86, p: 1 },
        { n: "SPEC-Flanges-EN.pdf", s: 79, p: 2 },
      ].map((r, i) => (
        <span key={r.n} className="fssc-rev__row" style={{ ["--i" as string]: i, ["--s" as string]: `${r.s}%` }}>
          <b>{i + 1}</b>
          <span className="fssc-rev__thumb">
            <Drawing part={r.p} />
          </span>
          <span className="fssc-rev__name">
            {r.n}
            <i>
              <i />
            </i>
          </span>
          <em>{r.s}%</em>
        </span>
      ))}
    </div>
  ),
];
