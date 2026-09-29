"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "@/components/scene/scrollState";
import { TEAM } from "./teamData";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Team() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current!;

      // Drives the card-queue break-up and the team stage assembly in the 3D stage.
      ScrollTrigger.create({
        trigger: section,
        start: "top 160%",
        end: "bottom bottom",
        onUpdate: (self) => {
          scrollState.team = self.progress;
        },
      });

      gsap
        .timeline({
          // starts once the camera has cleared the crane move, so the copy lands on a settled stage
          scrollTrigger: { trigger: section, start: "top 30%", end: "top top", scrub: true },
        })
        .from("[data-reveal]", { autoAlpha: 0, y: 40, stagger: 0.12, ease: "power2.out" });
    },
    { scope: sectionRef },
  );

  return (
    <section className="team" id="team" ref={sectionRef} aria-labelledby="team-title">
      {/* nav target: where the team stage has fully assembled */}
      <span className="jump" id="team-view" style={{ top: "36vh" }} aria-hidden />
      <div className="team__sticky">
        <div className="team__intro">
          <p className="team__eyebrow" data-reveal>
            The leadership team
          </p>
          <h2 className="team__title" id="team-title" data-reveal>
            Leadership Team
          </h2>
          <p className="team__sub" data-reveal>
            The minds behind Cognavia.ai
          </p>
        </div>

        <ul className="sr-only">
          {TEAM.map((l) => (
            <li key={l.name}>
              {l.name}, {l.role}. {l.bio}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
