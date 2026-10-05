"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { TEAM } from "./teamData";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/**
 * The orbit that rings both cards, drawn in the frame's own 1780 × 1028 coordinates
 * (the frame keeps that aspect, so the curve lands on the same spots at every size).
 */
const ORBIT = { cx: 872, cy: 636, rx: 804, ry: 152, tilt: -8.3 };
const ORBIT_PATH = (() => {
  const { cx, cy, rx } = ORBIT;
  return `M ${cx - rx} ${cy} a ${rx} ${ORBIT.ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ORBIT.ry} 0 1 0 ${-rx * 2} 0`;
})();

export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // a one-time reveal as the section comes into view (no scroll-scrubbed animation)
      gsap.from("[data-reveal]", {
        autoAlpha: 0,
        y: 26,
        duration: 1.1,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 70%", once: true },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section className="team" id="team" ref={sectionRef} aria-labelledby="team-title">
      <span className="jump" id="team-view" aria-hidden />
      <div className="team__frame">
        <svg className="team__orbit" viewBox="0 0 1780 1028" preserveAspectRatio="none" aria-hidden data-reveal>
          <defs>
            <linearGradient id="team-orbit-stroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="#c9d3e3" stopOpacity="0.75" />
              <stop offset="0.5" stopColor="#c9d3e3" stopOpacity="0.45" />
              <stop offset="1" stopColor="#dbe4f2" stopOpacity="0.8" />
            </linearGradient>
            <radialGradient id="team-glow">
              <stop offset="0" stopColor="#f4f8ff" />
              <stop offset="0.35" stopColor="#c8d6ee" stopOpacity="0.55" />
              <stop offset="1" stopColor="#8ea4c8" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="team-bead" cx="0.36" cy="0.32" r="0.75">
              <stop offset="0" stopColor="#e3ebf7" />
              <stop offset="0.35" stopColor="#8195b5" />
              <stop offset="1" stopColor="#26324a" />
            </radialGradient>
          </defs>
          <g transform={`rotate(${ORBIT.tilt} ${ORBIT.cx} ${ORBIT.cy})`}>
            <path d={ORBIT_PATH} fill="none" stroke="url(#team-orbit-stroke)" strokeWidth="1.4" />
            {/* a fainter companion line, just off the main orbit */}
            <path
              d={ORBIT_PATH}
              fill="none"
              stroke="#c9d3e3"
              strokeOpacity="0.16"
              strokeWidth="1"
              transform={`rotate(2.2 ${ORBIT.cx} ${ORBIT.cy}) translate(0 -10)`}
            />
          </g>
          {/* lights resting on the orbit, and one floating free beside the CTO card */}
          <circle cx="885" cy="481" r="16" fill="url(#team-glow)" className="team__twinkle" />
          <circle cx="885" cy="481" r="3" fill="#ffffff" />
          <circle cx="1660" cy="519" r="22" fill="url(#team-glow)" className="team__twinkle team__twinkle--slow" />
          <circle cx="1660" cy="519" r="8.5" fill="#f2f7ff" />
          <circle cx="1570" cy="735" r="16" fill="url(#team-glow)" className="team__twinkle team__twinkle--late" />
          <circle cx="1570" cy="735" r="3.6" fill="#ffffff" />
          <circle cx="160" cy="789" r="22" fill="url(#team-glow)" opacity="0.35" />
          <circle cx="160" cy="789" r="13" fill="url(#team-bead)" />
        </svg>

        <div className="team__intro">
          <p className="team__eyebrow" data-reveal>
            The leadership team
          </p>
          <h2 className="team__title" id="team-title" data-reveal>
            Leadership <span>Team</span>
          </h2>
          <p className="team__sub" data-reveal>
            The minds behind Cognavia.ai
          </p>
        </div>

        <ul className="team__cards">
          {TEAM.map((l) => (
            <li className="team__card" key={l.name} data-reveal>
              <div className="team__orb" aria-hidden>
                <span className="team__ring" />
                <span className="team__arc" />
                <span className="team__sphere">
                  {l.photo && <img src={l.photo} alt="" loading="lazy" decoding="async" />}
                </span>
              </div>
              <span className="team__role">{l.role}</span>
              <h3 className="team__name">{l.name}</h3>
              <p className="team__bio">{l.bio}</p>
            </li>
          ))}
        </ul>

        <div className="team__floor" aria-hidden />
      </div>
    </section>
  );
}
