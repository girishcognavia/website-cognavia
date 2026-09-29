"use client";

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "@/components/scene/scrollState";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current!;

      // Drives the globe assembly in the 3D stage. Starts 60vh early so the globe begins
      // forming while the hero's letters are still flying apart — one continuous shot.
      ScrollTrigger.create({
        trigger: section,
        start: "top 160%",
        end: "bottom bottom",
        onUpdate: (self) => {
          scrollState.about = self.progress;
        },
      });

      // Copy builds in as the globe locks into place, and un-builds on the way back up.
      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 55%", end: "top top", scrub: true },
        })
        .from("[data-reveal]", { autoAlpha: 0, y: 40, stagger: 0.12, ease: "power2.out" })
        .from("[data-reveal-late]", { autoAlpha: 0, x: 20, stagger: 0.1, ease: "power2.out" }, "<0.3");

      // ...and clears out of the way as the products section arrives.
      gsap.to([".about__content", ".about__signature", ".about__vertical"], {
        autoAlpha: 0,
        y: "-=60", // relative: .about__content is already offset by its CSS centering
        ease: "none",
        scrollTrigger: { trigger: section, start: "bottom 150%", end: "bottom 95%", scrub: true },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section className="about" id="about" ref={sectionRef} aria-labelledby="about-title">
      <div className="about__sticky">
        <div className="about__content">
          <p className="about__eyebrow" data-reveal>
            Innovation <span aria-hidden>×</span> Research <span aria-hidden>×</span> Real-world impact
          </p>

          <h2 className="about__title" id="about-title">
            <span data-reveal>Pioneering the</span>
            <span data-reveal>
              Future of <span className="about__ai">AI</span>
            </span>
          </h2>

          <p className="about__body" data-reveal>
            Cognavia.ai is a brand of Kognavion AI Labs that stands at the intersection of innovation and practical
            application. Founded with a vision to democratize AI technology, we bridge the gap between cutting-edge
            research and real-world business solutions.
          </p>
          <p className="about__body" data-reveal>
            Our mission is to empower organizations of all sizes to harness the transformative power of artificial
            intelligence, driving growth, efficiency, and innovation across industries.
          </p>

          <Link href="/about" className="about__cta" data-reveal>
            <span className="about__cta-line" aria-hidden />
            Learn more
            <span className="about__cta-circle" aria-hidden>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M8 2l5 5-5 5" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            </span>
          </Link>
        </div>

        <p className="about__signature" data-reveal-late>
          <span className="about__signature-mark" aria-hidden />
          From research
          <br />
          to real impact
        </p>

        <p className="about__vertical" data-reveal-late>
          Kognavion AI Labs
        </p>
      </div>
    </section>
  );
}
