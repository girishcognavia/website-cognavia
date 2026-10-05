"use client";

import { useEffect, useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";

/** Small live visuals, one per key feature (all data is illustrative). */

/* 01 — Instant Website Integration (60 seconds) */
export function FxIntegration() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [s, setS] = useState(60);
  useTicker(inView && !reduced, 70, () => setS((v) => (v >= 60 ? (v >= 75 ? 0 : v + 1) : v + 1)));
  const shown = Math.min(60, s);
  return (
    <div className="fx fx-int" ref={ref}>
      <svg viewBox="0 0 120 120" className="fx-int__ring">
        <circle cx="60" cy="60" r="48" className="fx-track" />
        <circle cx="60" cy="60" r="48" className="fx-prog" style={{ strokeDashoffset: 301.6 * (1 - shown / 60) }} />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="60" y1="6" x2="60" y2="10" transform={`rotate(${i * 30} 60 60)`} className="fx-tick" />
        ))}
      </svg>
      <div className="fx-int__read">
        <strong>{shown}s</strong>
        <span className={shown >= 60 ? "is-on" : ""}>{shown >= 60 ? "Connected" : "Installing"}</span>
      </div>
    </div>
  );
}

/* 02 — Automatic Content Learning & Crawling */
const PAGES = ["/", "/about", "/pricing", "/faq", "/shipping", "/contact", "/blog/getting-started"];
export function FxCrawl() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [n, setN] = useState(PAGES.length * 10);
  useTicker(inView && !reduced, 90, () => setN((v) => (v >= PAGES.length * 10 + 12 ? 0 : v + 1)));
  const indexed = Math.min(PAGES.length, Math.floor(n / 10));
  return (
    <div className="fx fx-crawl" ref={ref}>
      <ul>
        {PAGES.slice(0, 5).map((p, i) => {
          const prog = Math.max(0, Math.min(1, (n - i * 10) / 10));
          return (
            <li key={p} className={prog >= 1 ? "is-done" : prog > 0 ? "is-busy" : ""}>
              <span className="fx-crawl__path">{p}</span>
              <span className="fx-crawl__bar">
                <i style={{ transform: `scaleX(${prog})` }} />
              </span>
              <span className="fx-crawl__ok">✓</span>
            </li>
          );
        })}
      </ul>
      <p className="fx-foot">
        <b>{indexed * 18 + Math.min(n, 70)}</b> pages indexed
      </p>
    </div>
  );
}

/* 03 — Intelligent AI Responses via RAG */
export function FxRag() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState(3);
  useTicker(inView && !reduced, 1100, () => setPhase((p) => (p + 1) % 5));
  return (
    <div className={`fx fx-rag p${phase}`} ref={ref}>
      <div className="fx-rag__q">
        <span>Q</span>
        <i />
      </div>
      <svg className="fx-rag__wires" viewBox="0 0 200 90" preserveAspectRatio="none">
        <path d="M30 18 C 70 18, 70 45, 100 45" />
        <path d="M30 45 L 100 45" />
        <path d="M30 72 C 70 72, 70 45, 100 45" />
        <path d="M100 45 L 170 45" className="fx-rag__out" />
      </svg>
      <div className="fx-rag__docs">
        {[0, 1, 2].map((i) => (
          <span key={i} className={i === 1 ? "is-best" : ""}>
            <i />
            <i />
          </span>
        ))}
      </div>
      <div className="fx-rag__a">
        <span>A</span>
        <i />
        <i />
      </div>
      <p className="fx-rag__caption">Retrieve · Ground · Answer</p>
    </div>
  );
}

/* 04 — 24/7 Availability */
export function FxAlways() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  useTicker(inView, 1000, () => setNow(new Date()));
  const h = now?.getHours() ?? 0;
  const pad = (v: number) => String(v).padStart(2, "0");
  return (
    <div className="fx fx-always" ref={ref}>
      <div className="fx-always__clock">
        <span className="fx-always__dot" />
        {now ? `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}` : "--:--:--"}
        <em>Online</em>
      </div>
      <div className="fx-always__bars">
        {Array.from({ length: 24 }, (_, i) => (
          <i key={i} className={i === h ? "is-now" : ""} style={{ height: `${38 + ((i * 37) % 50)}%` }} />
        ))}
      </div>
      <div className="fx-always__axis">
        <span>00</span>
        <span>06</span>
        <span>12</span>
        <span>18</span>
        <span>24</span>
      </div>
    </div>
  );
}

/* 05 — Multi-Tenant Architecture */
const TENANTS = ["Tenant A", "Tenant B", "Tenant C", "Tenant D"];
export function FxTenants() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(0);
  useTicker(inView && !reduced, 900, () => setK((v) => v + 1));
  return (
    <div className="fx fx-ten" ref={ref}>
      <div className="fx-ten__core">
        <span>CognaAssist</span>
      </div>
      <div className="fx-ten__grid">
        {TENANTS.map((t, i) => (
          <div key={t} className={`fx-ten__cell${k % TENANTS.length === i ? " is-on" : ""}`}>
            <span className="fx-ten__lock" aria-hidden>
              <svg viewBox="0 0 24 24">
                <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2" />
                <rect x="6" y="11" width="12" height="9" rx="2" fill="currentColor" />
              </svg>
            </span>
            <b>{t}</b>
            <i />
            <i />
          </div>
        ))}
      </div>
    </div>
  );
}

/* 06 — Real-Time Analytics */
const seed = (i: number) => 46 + Math.round(18 * Math.sin(i * 0.7) + 9 * Math.sin(i * 1.9));
export function FxAnalytics() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [pts, setPts] = useState<number[]>(() => Array.from({ length: 24 }, (_, i) => seed(i)));
  const [total, setTotal] = useState(1284);
  useTicker(inView && !reduced, 800, () => {
    setPts((p) => {
      const last = p[p.length - 1];
      const next = Math.max(14, Math.min(88, last + (Math.random() - 0.48) * 22));
      return [...p.slice(1), next];
    });
    setTotal((t) => t + 1 + Math.floor(Math.random() * 3));
  });
  const W = 200, H = 70;
  const xy = pts.map((v, i) => [(i / (pts.length - 1)) * W, H - (v / 100) * H] as const);
  const line = xy.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const [lx, ly] = xy[xy.length - 1];
  return (
    <div className="fx fx-ana" ref={ref}>
      <div className="fx-ana__head">
        <span>Conversations today</span>
        <b>{total.toLocaleString("en-US")}</b>
      </div>
      <div className="fx-ana__plot">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="fx-ana__chart">
        <defs>
          <linearGradient id="fxana" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#dfe6f2" stopOpacity="0.32" />
            <stop offset="1" stopColor="#dfe6f2" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line} L${W} ${H} L0 ${H} Z`} fill="url(#fxana)" />
        <path d={line} fill="none" stroke="#e8edf5" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />
      </svg>
      <span className="fx-ana__dot" style={{ left: `${(lx / W) * 100}%`, top: `${(ly / H) * 100}%` }} />
      </div>
    </div>
  );
}
