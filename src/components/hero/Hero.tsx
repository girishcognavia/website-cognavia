"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";

// WebGL only runs in the browser; start fetching the scene as soon as this module loads.
const loadScene = () => import("@/components/scene/HeroScene");
if (typeof window !== "undefined") void loadScene();
const HeroScene = dynamic(loadScene, { ssr: false });

/** First section: one screen, scrolled past normally. Its 3D scene has its own canvas. */
export default function Hero() {
  useEffect(() => {
    // The copy's landing reveal is CSS (.hero [data-intro] in globals.css). It starts on the
    // same frame as the 3D scene's landing (when the scene marks itself ready), or after 3s
    // at the latest so a slow device never shows an empty screen.
    const root = document.documentElement;
    delete root.dataset.heroGo;
    const fallback = window.setTimeout(() => (root.dataset.heroGo = "1"), 3000);
    return () => window.clearTimeout(fallback);
  }, []);

  return (
    <section className="hero" id="top" aria-label="Cognavia.ai">
      <HeroScene />
      <div className="hero__overlay">
        <div className="hero__copy">
          <p className="hero__eyebrow" data-intro="eyebrow">
            NEXT-GEN ENTERPRISE AI
          </p>
          <h1 className="hero__title" data-intro="title">
            Cognavia<span>.ai</span>
          </h1>
          <p className="hero__sub" data-intro="sub">
            Your AI Technology Partner for Intelligent Systems
          </p>
        </div>

        <p className="hero__aside">
          <span data-intro="side">
            Smarter Systems.
            <br />
            A Brighter Tomorrow.
          </span>
        </p>
      </div>
    </section>
  );
}
