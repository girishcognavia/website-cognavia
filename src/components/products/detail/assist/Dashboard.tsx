"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";

/** Benefits visual: a live CognaAssist analytics dashboard (illustrative data). */

const N = 32;
const base = (i: number) => 52 + 16 * Math.sin(i * 0.42) + 8 * Math.sin(i * 1.3 + 1);
const HOURS = [22, 18, 14, 12, 16, 28, 44, 62, 78, 86, 90, 84, 80, 88, 92, 86, 76, 70, 64, 58, 50, 42, 34, 26];
const TOPICS = [
  { q: "Order tracking", v: 82 },
  { q: "Pricing & plans", v: 64 },
  { q: "Returns & refunds", v: 48 },
  { q: "Opening hours", v: 31 },
];

export default function Dashboard() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [series, setSeries] = useState<number[]>(() => Array.from({ length: N }, (_, i) => base(i)));
  const [conv, setConv] = useState(12480);
  const [leads, setLeads] = useState(318);
  const [resolved, setResolved] = useState(91.4);
  const [resp, setResp] = useState(0.8);
  const [pulse, setPulse] = useState(0);

  useTicker(inView && !reduced, 1400, () => {
    setSeries((s) => {
      const last = s[s.length - 1];
      const next = Math.max(24, Math.min(92, last + (Math.random() - 0.46) * 14));
      return [...s.slice(1), next];
    });
    setConv((c) => c + 2 + Math.floor(Math.random() * 6));
    if (Math.random() < 0.35) setLeads((l) => l + 1);
    setResolved((r) => Math.max(89.5, Math.min(94.5, r + (Math.random() - 0.5) * 0.4)));
    setResp(0.6 + Math.round(Math.random() * 3) / 10);
    setPulse((p) => p + 1);
  });

  const W = 320, H = 110;
  const xy = series.map((v, i) => [(i / (N - 1)) * W, H - (v / 100) * H] as const);
  // smooth line through the points
  let line = `M${xy[0][0]} ${xy[0][1].toFixed(1)}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1];
    const [x1, y1] = xy[i];
    const mx = (x0 + x1) / 2;
    line += ` C${mx.toFixed(1)} ${y0.toFixed(1)} ${mx.toFixed(1)} ${y1.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}`;
  }
  const [lx, ly] = xy[xy.length - 1];

  return (
    <div className="dash" ref={ref} role="img" aria-label="Illustration: a live CognaAssist analytics dashboard">
      <div className="dash__top">
        <div className="dash__brand">
          <i />
          <span>
            CognaAssist <em>· Analytics</em>
          </span>
        </div>
        <span className="dash__live">
          <i /> Live
        </span>
      </div>

      <div className="dash__kpis">
        <div className="dash__kpi">
          <span>Conversations</span>
          <b>{conv.toLocaleString("en-US")}</b>
          <em>▲ 12.4%</em>
        </div>
        <div className="dash__kpi">
          <span>Resolved by AI</span>
          <b>{resolved.toFixed(1)}%</b>
          <em>▲ 3.1%</em>
        </div>
        <div className="dash__kpi">
          <span>Avg. response</span>
          <b>{resp.toFixed(1)}s</b>
          <em>Instant</em>
        </div>
        <div className="dash__kpi">
          <span>Leads captured</span>
          <b key={leads} className="dash__bump">
            {leads}
          </b>
          <em>▲ 18.0%</em>
        </div>
      </div>

      <div className="dash__grid">
        <div className="dash__card dash__card--wide">
          <div className="dash__card-head">
            <span>Conversations · live</span>
            <em>Last 30 min</em>
          </div>
          <div className="dash__plot">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              <defs>
                <linearGradient id="dash-area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#e3e9f3" stopOpacity="0.26" />
                  <stop offset="1" stopColor="#e3e9f3" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="dash__gridline" />
              ))}
              <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#dash-area)" />
              <path d={line} fill="none" stroke="#eef2f8" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
            </svg>
            <span className="dash__dot" key={pulse} style={{ left: `${(lx / W) * 100}%`, top: `${(ly / H) * 100}%` }} />
          </div>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>Volume by hour</span>
          </div>
          <div className="dash__bars">
            {HOURS.map((h, i) => (
              <i key={i} style={{ height: `${h}%`, ["--i" as string]: i }} />
            ))}
          </div>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>Top questions</span>
          </div>
          <ul className="dash__topics">
            {TOPICS.map((t) => (
              <li key={t.q}>
                <span>{t.q}</span>
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
