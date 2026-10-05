"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";

/** Benefits visual: a live CognaBrief workspace (illustrative data). */

const COMPARE = [
  { doc: "50-page annual report", manual: "3h 20m", brief: "46s", w: 100 },
  { doc: "30-page legal contract", manual: "2h 05m", brief: "31s", w: 63 },
  { doc: "12-page research paper", manual: "48m", brief: "14s", w: 24 },
];
const FILES = [
  { name: "Q3_Board_Pack.pdf", level: "Detailed", pages: 64 },
  { name: "Vendor_Agreement.docx", level: "Standard", pages: 28 },
  { name: "Clinical_Study.pdf", level: "Detailed", pages: 41 },
  { name: "Site_Survey_Notes.txt", level: "Quick", pages: 9 },
  { name: "Market_Outlook.pdf", level: "Standard", pages: 36 },
  { name: "Policy_Update.docx", level: "Quick", pages: 12 },
];

export default function Dashboard() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [docs, setDocs] = useState(2864);
  const [pages, setPages] = useState(91240);
  const [head, setHead] = useState(0);

  useTicker(inView && !reduced, 2600, () => {
    const f = FILES[(head + 3) % FILES.length];
    setHead((h) => (h + 1) % FILES.length);
    setDocs((d) => d + 1);
    setPages((p) => p + f.pages);
  });

  const recent = [0, 1, 2].map((k) => FILES[(head + 2 - k + FILES.length) % FILES.length]);

  return (
    <div className="dash bdash" ref={ref} role="img" aria-label="Illustration: a live CognaBrief workspace">
      <div className="dash__top">
        <div className="dash__brand">
          <i />
          <span>
            CognaBrief <em>· Workspace</em>
          </span>
        </div>
        <span className="dash__live">
          <i /> Live
        </span>
      </div>

      <div className="dash__kpis">
        <div className="dash__kpi">
          <span>Documents summarized</span>
          <b key={docs} className="dash__bump">
            {docs.toLocaleString("en-US")}
          </b>
          <em>▲ 21.6%</em>
        </div>
        <div className="dash__kpi">
          <span>Pages processed</span>
          <b>{pages.toLocaleString("en-US")}</b>
          <em>This quarter</em>
        </div>
        <div className="dash__kpi">
          <span>Avg. time / document</span>
          <b>42s</b>
          <em>Under a minute</em>
        </div>
        <div className="dash__kpi">
          <span>Dual-AI verified</span>
          <b>100%</b>
          <em>Every summary</em>
        </div>
      </div>

      <div className="dash__grid">
        <div className="dash__card dash__card--wide">
          <div className="dash__card-head">
            <span>Reading time · manual vs CognaBrief</span>
            <em>Per document</em>
          </div>
          <ul className="bdash__cmp">
            {COMPARE.map((c, i) => (
              <li key={c.doc} style={{ ["--i" as string]: i }}>
                <span className="bdash__doc">{c.doc}</span>
                <span className="bdash__bars">
                  <i className="bdash__manual" style={{ ["--w" as string]: `${c.w}%` }}>
                    <em>{c.manual}</em>
                  </i>
                  <i className="bdash__brief">
                    <em>{c.brief}</em>
                  </i>
                </span>
              </li>
            ))}
          </ul>
          <div className="bdash__legend">
            <span>
              <i className="m" /> Manual reading
            </span>
            <span>
              <i className="b" /> CognaBrief
            </span>
          </div>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>Recent summaries</span>
          </div>
          <ul className="bdash__recent">
            {recent.map((f, i) => (
              <li key={`${f.name}-${head}-${i}`} className={i === 0 ? "is-new" : ""}>
                <b>{f.name.split(".").pop()?.toUpperCase()}</b>
                <span>
                  {f.name}
                  <em>
                    {f.pages} pages · {f.level}
                  </em>
                </span>
                <i>✓</i>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>Summary levels</span>
          </div>
          <ul className="dash__topics">
            {[
              { q: "Standard", v: 52 },
              { q: "Detailed", v: 31 },
              { q: "Quick", v: 17 },
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
