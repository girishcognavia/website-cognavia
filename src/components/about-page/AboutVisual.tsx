"use client";

import { useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { Callout, HeadShared } from "./AndroidHead";

// WebGL only runs in the browser.
const AndroidHead = dynamic(() => import("./AndroidHead"), { ssr: false });

// Callouts use phrases taken from the About copy. Anchors are points on the head (head-local).
const CALLOUTS: { text: string; anchor: [number, number, number]; part: "head" | "torso"; className: string }[] = [
  { text: "Agentic engineering", anchor: [0.05, 0.4, 0.92], part: "head", className: "is-top" },
  { text: "A record of what it did", anchor: [0.86, 0.0, -0.1], part: "head", className: "is-mid" },
  { text: "A person who can switch it off", anchor: [1.2, -1.85, 0.55], part: "torso", className: "is-low" },
];

/** The interactive android head with its callout labels. Renders only while on screen. */
export default function AboutVisual() {
  const container = useRef<HTMLDivElement>(null);
  const overlay = useRef<HTMLDivElement>(null);
  const shared = useRef<HeadShared>({
    overlay: null,
    callouts: CALLOUTS.map((c): Callout => ({ anchor: c.anchor, part: c.part, el: null, line: null, dot: null })),
  });

  useEffect(() => {
    shared.current.overlay = overlay.current;
  }, []);

  return (
    <div className="android" ref={container}>
      <div className="android__canvas" aria-hidden>
        <AndroidHead shared={shared.current} container={container} />
      </div>
      <div className="android__overlay" ref={overlay} aria-hidden>
        <svg className="android__lines">
          {CALLOUTS.map((c, i) => (
            <g key={c.text}>
              <line
                ref={(l) => {
                  shared.current.callouts[i].line = l;
                }}
              />
              <circle
                r={3}
                ref={(d) => {
                  shared.current.callouts[i].dot = d;
                }}
              />
            </g>
          ))}
        </svg>
        {CALLOUTS.map((c, i) => (
          <span
            key={c.text}
            className={`android__label ${c.className}`}
            ref={(l) => {
              shared.current.callouts[i].el = l;
            }}
          >
            {c.text}
          </span>
        ))}
      </div>
      <p className="android__hint" aria-hidden>
        Move to look around · Click to scan
      </p>
    </div>
  );
}
