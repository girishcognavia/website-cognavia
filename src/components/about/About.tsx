"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import dynamic from "next/dynamic";

const PioneeringScene = dynamic(() => import("@/components/scene/PioneeringScene"), { ssr: false });

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      // a one-time reveal as the section comes into view (no scroll-scrubbed animation)
      gsap
        .timeline({ scrollTrigger: { trigger: sectionRef.current, start: "top 70%", once: true } })
        .from("[data-reveal]", { autoAlpha: 0, y: 30, duration: 1, stagger: 0.1, ease: "power3.out" })
        .from("[data-reveal-late]", { autoAlpha: 0, x: 16, duration: 0.9, ease: "power3.out" }, "<0.4");
    },
    { scope: sectionRef },
  );

  return (
    <section className="about" id="about" ref={sectionRef} aria-labelledby="about-title">
      <div className="about__inner">
        <PioneeringScene />
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
          <span className="about__rule" aria-hidden data-reveal />
          <p className="about__mission" data-reveal>
            Our mission is to empower organizations of all sizes to harness the transformative power of artificial
            intelligence, driving growth, efficiency, and innovation across industries.
          </p>
        </div>

        <p className="about__signature" data-reveal-late>
          <span className="about__signature-mark" aria-hidden />
          Built for a smarter tomorrow
        </p>

        {/* the four capabilities shown on the glass cards, for screen readers and search */}
        <ul className="sr-only">
          <li>AI Agents: Autonomous systems that get work done.</li>
          <li>Cloud &amp; Infrastructure: Scalable. Secure. Always on.</li>
          <li>Custom Solutions: Tailored AI systems for your business.</li>
          <li>Data &amp; Analytics: Turn data into decisions.</li>
        </ul>
      </div>
    </section>
  );
}
