"use client";

import StepsTrack from "../StepsTrack";

type Step = { title: string; text: string };

/** CognaBrief: upload, select, process, review. */
export default function Steps({ steps }: { steps: Step[] }) {
  return <StepsTrack steps={steps} scenes={SCENES} />;
}

const SCENES = [
  // Upload
  () => (
    <div className="bsc-up">
      <div className="bsc-up__zone">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5M5 15v4h14v-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>Drag and drop PDF, DOCX or TXT</span>
      </div>
      <div className="bsc-up__file">
        <b>PDF</b>
        <span>
          Annual_Report.pdf
          <em>50 pages · 4.2 MB</em>
        </span>
        <i className="bsc-up__bar">
          <i />
        </i>
      </div>
    </div>
  ),
  // Select
  () => (
    <div className="bsc-sel">
      {[
        { n: "Quick", d: "Key points", l: 2 },
        { n: "Standard", d: "Balanced", l: 4 },
        { n: "Detailed", d: "In depth", l: 6 },
      ].map((o, i) => (
        <span key={o.n} className={`bsc-sel__opt${i === 1 ? " is-pick" : ""}`} style={{ ["--i" as string]: i }}>
          <b>{o.n}</b>
          <em>{o.d}</em>
          <span className="bsc-sel__lines">
            {Array.from({ length: o.l }, (_, k) => (
              <i key={k} />
            ))}
          </span>
          <span className="bsc-sel__tick">✓</span>
        </span>
      ))}
    </div>
  ),
  // Process
  () => (
    <div className="bsc-pro">
      {["Analyze", "Extract", "Generate", "Dual-AI check"].map((t, i) => (
        <div key={t} className="bsc-pro__row" style={{ ["--i" as string]: i }}>
          <span>{t}</span>
          <i>
            <i />
          </i>
          <b>✓</b>
        </div>
      ))}
    </div>
  ),
  // Review
  () => (
    <div className="bsc-rev">
      <span className="bsc-rev__head">
        <b>Executive summary</b>
        <em>Standard</em>
      </span>
      {[
        { w: 86, p: 4 },
        { w: 72, p: 11 },
        { w: 80, p: 19 },
        { w: 64, p: 33 },
      ].map((l, i) => (
        <span key={i} className="bsc-rev__line" style={{ ["--i" as string]: i }}>
          <i style={{ width: `${l.w}%` }} />
          <em>p. {l.p}</em>
        </span>
      ))}
    </div>
  ),
];
