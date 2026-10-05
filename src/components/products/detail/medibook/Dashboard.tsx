"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";

/** Benefits visual: a live MediBook AI hospital dashboard (illustrative data). */

// weekly phone calls vs chat bookings since go-live: calls fall as chat takes over
const CALLS = [100, 96, 88, 79, 70, 62, 55, 49, 45, 43, 42, 41];
const CHAT = [8, 16, 27, 38, 48, 57, 64, 70, 74, 77, 79, 80];
const FEED = [
  { who: "R. M.", spec: "Cardiology", time: "10:30 AM", lang: "EN" },
  { who: "S. K.", spec: "Dermatology", time: "11:15 AM", lang: "HI" },
  { who: "A. P.", spec: "Orthopedics", time: "12:00 PM", lang: "EN" },
  { who: "N. D.", spec: "Pediatrics", time: "2:45 PM", lang: "HI" },
  { who: "V. S.", spec: "ENT", time: "4:30 PM", lang: "EN" },
];

export default function Dashboard() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [booked, setBooked] = useState(486);
  const [head, setHead] = useState(0);
  useTicker(inView && !reduced, 2300, () => {
    setHead((h) => (h + 1) % FEED.length);
    setBooked((b) => b + 1);
  });

  const W = 320, H = 110;
  const pts = (arr: number[]) =>
    arr.map((v, i) => `${i ? "L" : "M"}${((i / (arr.length - 1)) * W).toFixed(1)} ${(H - (v / 100) * H).toFixed(1)}`).join(" ");
  const recent = [0, 1, 2].map((k) => FEED[(head + 2 - k + FEED.length) % FEED.length]);

  return (
    <div className="dash mbdash" ref={ref} role="img" aria-label="Illustration: a live MediBook AI hospital dashboard">
      <div className="dash__top">
        <div className="dash__brand">
          <i />
          <span>
            MediBook AI <em>· Hospital</em>
          </span>
        </div>
        <span className="dash__live">
          <i /> Live
        </span>
      </div>

      <div className="dash__kpis">
        <div className="dash__kpi">
          <span>Appointments today</span>
          <b key={booked} className="dash__bump">
            {booked}
          </b>
          <em>Booked via chat</em>
        </div>
        <div className="dash__kpi">
          <span>Call volume</span>
          <b>−58%</b>
          <em>Since go-live</em>
        </div>
        <div className="dash__kpi">
          <span>After-hours bookings</span>
          <b>31%</b>
          <em>Outside 9 to 6</em>
        </div>
        <div className="dash__kpi">
          <span>Pre-screened</span>
          <b>100%</b>
          <em>Before the visit</em>
        </div>
      </div>

      <div className="dash__grid">
        <div className="dash__card dash__card--wide">
          <div className="dash__card-head">
            <span>Phone calls vs chat bookings</span>
            <em>12 weeks</em>
          </div>
          <div className="mbdash__plot">
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
              {[0.25, 0.5, 0.75].map((g) => (
                <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="dash__gridline" />
              ))}
              <path d={pts(CALLS)} className="mbdash__calls" />
              <path d={pts(CHAT)} className="mbdash__chat" />
            </svg>
          </div>
          <div className="bdash__legend">
            <span>
              <i className="m" /> Phone calls
            </span>
            <span>
              <i className="b" /> Chat bookings
            </span>
          </div>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>Latest bookings</span>
          </div>
          <ul className="mbdash__feed">
            {recent.map((f, i) => (
              <li key={`${f.who}-${head}-${i}`} className={i === 0 ? "is-new" : ""}>
                <b>{f.who}</b>
                <span>
                  {f.spec}
                  <em>{f.time}</em>
                </span>
                <i>{f.lang}</i>
              </li>
            ))}
          </ul>
        </div>

        <div className="dash__card">
          <div className="dash__card-head">
            <span>By specialty</span>
          </div>
          <ul className="dash__topics">
            {[
              { q: "General Medicine", v: 29 },
              { q: "Orthopedics", v: 21 },
              { q: "Dermatology", v: 17 },
              { q: "Pediatrics", v: 14 },
            ].map((t) => (
              <li key={t.q}>
                <span>
                  {t.q} <em>{t.v}%</em>
                </span>
                <i style={{ ["--v" as string]: `${t.v * 2.5}%` }} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="dash__note">Illustrative data</p>
    </div>
  );
}
