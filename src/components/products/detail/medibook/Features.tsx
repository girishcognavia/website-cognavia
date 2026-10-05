"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";

/** Small live visuals, one per MediBook AI key feature (all content illustrative). */

/* 01 — AI-Powered Symptom Understanding */
const SENTENCE = [
  { t: "My", k: false },
  { t: "knee", k: true },
  { t: "has", k: false },
  { t: "hurt", k: true },
  { t: "for", k: false },
  { t: "a week,", k: true },
  { t: "worse on", k: false },
  { t: "the stairs", k: true },
];
const TAGS = ["Joint · knee", "Pain", "7 days", "On exertion"];
export function FxSymptoms() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(4);
  useTicker(inView && !reduced, 900, () => setK((v) => (v + 1) % 7));
  return (
    <div className="fx mbx-sym" ref={ref}>
      <p className="mbx-sym__text">
        {SENTENCE.map((w, i) => {
          const n = SENTENCE.slice(0, i + 1).filter((x) => x.k).length;
          return (
            <span key={i} className={w.k && n <= k ? "is-key" : ""}>
              {w.t}{" "}
            </span>
          );
        })}
      </p>
      <div className="mbx-sym__tags">
        {TAGS.map((t, i) => (
          <span key={t} className={i < k ? "is-on" : ""}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

/* 02 — True Bilingual Support (Hindi/English) */
const LINES = [
  { lang: "English", text: "Hello! How can I help you today?" },
  { lang: "हिंदी", text: "नमस्ते! आज मैं आपकी कैसे मदद कर सकता हूँ?" },
];
export function FxBilingual() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(0);
  useTicker(inView && !reduced, 2200, () => setK((v) => (v + 1) % 2));
  return (
    <div className="fx mbx-bi" ref={ref}>
      <div className="mbx-bi__toggle" style={{ ["--k" as string]: k }}>
        <i />
        {LINES.map((l, i) => (
          <span key={l.lang} className={i === k ? "is-on" : ""}>
            {l.lang}
          </span>
        ))}
      </div>
      <div className="mbx-bi__bubble" key={k}>
        <p>{LINES[k].text}</p>
      </div>
    </div>
  );
}

/* 03 — Intelligent Doctor Matching (90%+ Accuracy) */
const DOCS = [
  { n: "Orthopedics", m: 94 },
  { n: "Physiotherapy", m: 71 },
  { n: "General Medicine", m: 46 },
];
export function FxMatching() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const run = inView && !reduced ? "" : undefined;
  return (
    <div className="fx mbx-match" ref={ref} data-run={run}>
      <div className="mbx-match__ring">
        <svg viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="33" className="mbx-match__track" />
          <circle cx="40" cy="40" r="33" className="mbx-match__prog" />
        </svg>
        <span>
          <b>90%+</b>
          <em>accuracy</em>
        </span>
      </div>
      <ul>
        {DOCS.map((d, i) => (
          <li key={d.n} className={i === 0 ? "is-top" : ""} style={{ ["--i" as string]: i, ["--m" as string]: `${d.m}%` }}>
            <span>
              {d.n} <em>{d.m}%</em>
            </span>
            <i>
              <i />
            </i>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* 04 — 24/7 Availability */
const BOOKINGS = [
  { h: 2.25, label: "2:15 AM" },
  { h: 7.5, label: "7:30 AM" },
  { h: 11, label: "11:00 AM" },
  { h: 15.75, label: "3:45 PM" },
  { h: 20.5, label: "8:30 PM" },
  { h: 23.25, label: "11:15 PM" },
];
export function FxAlwaysOn() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(0);
  useTicker(inView && !reduced, 1300, () => setK((v) => (v + 1) % BOOKINGS.length));
  const b = BOOKINGS[k];
  const night = b.h < 6 || b.h >= 20;
  return (
    <div className="fx mbx-24" ref={ref}>
      <div className="mbx-24__clock">
        <svg viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="50" className="mbx-24__face" />
          {Array.from({ length: 24 }, (_, i) => (
            <line key={i} x1="60" y1="12" x2="60" y2={i % 6 ? 15 : 18} transform={`rotate(${i * 15} 60 60)`} className="mbx-24__tick" />
          ))}
          <line x1="60" y1="60" x2="60" y2="22" className="mbx-24__hand" style={{ transform: `rotate(${b.h * 15}deg)` }} />
          {BOOKINGS.map((x, i) => (
            <circle
              key={i}
              cx={60 + 42 * Math.sin((x.h / 24) * Math.PI * 2)}
              cy={60 - 42 * Math.cos((x.h / 24) * Math.PI * 2)}
              r={i === k ? 4.5 : 3}
              className={`mbx-24__dot${i <= k ? " is-on" : ""}${i === k ? " is-now" : ""}`}
            />
          ))}
          <circle cx="60" cy="60" r="3" fill="#eef2f8" />
        </svg>
      </div>
      <div className="mbx-24__read">
        <span className="mbx-24__mode">{night ? "☾ Night" : "☀ Day"}</span>
        <b key={k}>{b.label}</b>
        <em>New booking</em>
      </div>
    </div>
  );
}

/* 05 — DPDPA 2023 Compliant */
export function FxPrivacy() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const run = inView && !reduced ? "" : undefined;
  return (
    <div className="fx mbx-dp" ref={ref} data-run={run}>
      <div className="mbx-dp__badge">
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="m8.8 12 2.2 2.2 4.3-4.4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <b>DPDPA 2023</b>
      </div>
      <div className="mbx-dp__rows">
        <span className="mbx-dp__consent">
          <i className="mbx-dp__box">✓</i> Patient consent recorded
        </span>
        <span className="mbx-dp__field">
          <em>Phone</em>
          <span className="mbx-dp__mask">
            <i className="raw">+91 98452 31210</i>
            <i className="masked">+91 98••• ••210</i>
          </span>
        </span>
        <span className="mbx-dp__field">
          <em>Name</em>
          <span className="mbx-dp__mask">
            <i className="raw">Priya Kulkarni</i>
            <i className="masked">P•••• K•••••••</i>
          </span>
        </span>
      </div>
    </div>
  );
}

/* 06 — WhatsApp Integration */
export function FxWhatsApp() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const run = inView && !reduced ? "" : undefined;
  return (
    <div className="fx mbx-wa" ref={ref} data-run={run}>
      <div className="mbx-wa__chat">
        <span className="mbx-wa__head">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M12 3.5a8.5 8.5 0 0 0-7.4 12.7L3.5 20.5l4.4-1.1A8.5 8.5 0 1 0 12 3.5z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M9 8.8c.2 2.9 2.4 5.3 5.4 5.9l1-1.3-1.8-1-.8.8c-1-.5-1.8-1.3-2.3-2.3l.8-.8-1-1.8z" fill="currentColor" />
          </svg>
          WhatsApp
        </span>
        <span className="mbx-wa__msg mbx-wa__msg--in" style={{ ["--i" as string]: 0 }}>
          Book a skin specialist for tomorrow
        </span>
        <span className="mbx-wa__msg mbx-wa__msg--out" style={{ ["--i" as string]: 1 }}>
          Dr. A. Sharma · 10:30 AM ✓
          <em>✓✓</em>
        </span>
      </div>
    </div>
  );
}
