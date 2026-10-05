"use client";

import { useState } from "react";
import { useInView, useReducedMotion, useTicker } from "../hooks";

/**
 * Overview visual: symptoms described in plain language flow through MediBook AI to the
 * specialty that should see them, one route at a time. Illustrative mapping.
 */
const SYMPTOMS = ["Skin rash", "Knee pain", "Fever & cough", "Migraine", "Back pain", "Sore throat"];
const SPECIALTIES = ["Dermatology", "Orthopedics", "General Medicine", "Neurology"];
const ROUTES = [0, 1, 2, 3, 1, 2]; // symptom i → specialty

const H = 300;
const sy = (i: number) => 28 + i * ((H - 56) / (SYMPTOMS.length - 1));
const py = (j: number) => 60 + j * ((H - 120) / (SPECIALTIES.length - 1));
const CY = H / 2;

export default function SymptomMap() {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [k, setK] = useState(1);
  useTicker(inView && !reduced, 1600, () => setK((v) => (v + 1) % SYMPTOMS.length));
  const target = ROUTES[k];

  return (
    <div className="smp" ref={ref} aria-hidden>
      <div className="smp__field">
        <svg viewBox={`0 0 100 ${H}`} preserveAspectRatio="none">
          {SYMPTOMS.map((_, i) => (
            <path
              key={`s${i}`}
              d={`M31 ${sy(i)} C 40 ${sy(i)}, 42 ${CY}, 50 ${CY}`}
              className={i === k ? "is-on" : ""}
            />
          ))}
          {SPECIALTIES.map((_, j) => (
            <path
              key={`p${j}`}
              d={`M50 ${CY} C 58 ${CY}, 60 ${py(j)}, 69 ${py(j)}`}
              className={j === target ? "is-on" : ""}
            />
          ))}
        </svg>

        {SYMPTOMS.map((s, i) => (
          <span key={s} className={`smp__sym${i === k ? " is-on" : ""}`} style={{ top: `${(sy(i) / H) * 100}%` }}>
            {s}
          </span>
        ))}

        <span className="smp__core">
          <b>AI</b>
          <i key={k} />
        </span>

        {SPECIALTIES.map((s, j) => (
          <span key={s} className={`smp__spec${j === target ? " is-on" : ""}`} style={{ top: `${(py(j) / H) * 100}%` }}>
            {s}
          </span>
        ))}
      </div>
      <div className="smp__foot">
        <span>Plain-language symptoms</span>
        <span>→</span>
        <span>The right specialist</span>
      </div>
    </div>
  );
}
