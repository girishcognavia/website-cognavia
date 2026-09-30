"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "@/components/scene/scrollState";
import { onStageReady } from "@/components/scene/stageReady";
import HeroAutoAdvance from "./HeroAutoAdvance";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current!;

      ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        onUpdate: (self) => {
          scrollState.hero = self.progress;
        },
      });

      // UI chrome drifts away during the first part of the fly-through.
      gsap.to("[data-fade]", {
        autoAlpha: 0,
        y: -24,
        ease: "none",
        stagger: 0.02,
        scrollTrigger: { trigger: section, start: "top top", end: "18% top", scrub: true },
      });

      // Intro: overlay fades in while the scene assembles. It waits for the 3D stage to
      // finish its setup so both play together (fallback: start anyway after 5s).
      const intro = gsap.from("[data-intro]", {
        autoAlpha: 0,
        y: 12,
        duration: 1.1,
        delay: 0.9,
        ease: "power3.out",
        stagger: 0.08,
        paused: true,
      });
      const start = () => intro.play();
      const unsubscribe = onStageReady(start);
      const fallback = window.setTimeout(start, 5000);
      return () => {
        unsubscribe();
        window.clearTimeout(fallback);
      };
    },
    { scope: sectionRef },
  );

  return (
    <section className="hero" id="top" ref={sectionRef} aria-label="Cognavia.ai">
      <HeroAutoAdvance />
      <div className="hero__sticky">
        <h1 className="sr-only">Cognavia.ai — Build smarter with AI. Intelligent solutions for a smarter tomorrow.</h1>
        <div className="hero__overlay">
          <div className="hero__axis" data-fade />

          <header className="hero__top" data-fade>
            <span className="hero__index" data-intro>
              01
            </span>
            <a href="#about" className="hero__explore" data-intro>
              Explore
            </a>
          </header>

          <p className="hero__side" data-fade>
            <span data-intro style={{ display: "block" }}>
              BUILD
              <br />
              SMARTER
              <br />
              WITH
              <br />
              AI
            </span>
          </p>

          <p className="hero__tagline" data-fade>
            <span data-intro style={{ display: "block" }}>
              Intelligent solutions
              <br />
              for a smarter tomorrow.
            </span>
          </p>

          <div className="hero__scroll" data-fade>
            <span className="hero__mouse" data-intro />
            <span data-intro>SCROLL</span>
          </div>
        </div>
      </div>
    </section>
  );
}
