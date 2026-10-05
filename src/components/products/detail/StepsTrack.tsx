"use client";

import { useState, type ReactNode } from "react";
import { useInView, useReducedMotion, useTicker } from "./hooks";

type Step = { title: string; text: string };

/**
 * How it works: the steps on a track that plays through on its own (or on click / hover),
 * with a live scene for the active step. Each product supplies its own scenes.
 */
export default function StepsTrack({ steps, scenes }: { steps: Step[]; scenes: (() => ReactNode)[] }) {
  const [ref, inView] = useInView<HTMLDivElement>();
  const reduced = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useTicker(inView && !reduced && !paused, 4200, () => setActive((a) => (a + 1) % steps.length));

  return (
    <div className="steps" ref={ref} onMouseLeave={() => setPaused(false)}>
      <ol className="steps__track" style={{ ["--p" as string]: active / (steps.length - 1) }}>
        {steps.map((s, i) => (
          <li key={s.title} className={i === active ? "is-active" : i < active ? "is-past" : ""}>
            <button
              type="button"
              onClick={() => setActive(i)}
              onMouseEnter={() => {
                setPaused(true);
                setActive(i);
              }}
              onFocus={() => setActive(i)}
              aria-pressed={i === active}
            >
              <span className="steps__node">{i + 1}</span>
              <span className="steps__title">{s.title}</span>
              <span className="steps__text">{s.text}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="steps__stage" aria-hidden>
        <div className="steps__stage-head">
          <span>
            Step {active + 1} / {steps.length}
          </span>
          <b>{steps[active].title}</b>
          {!paused && inView && !reduced && <i className="steps__timer" key={active} />}
        </div>
        <div className="steps__scene" key={active}>
          {scenes[active]?.()}
        </div>
      </div>
    </div>
  );
}

