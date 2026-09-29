"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
/** The page's smooth-scroll instance (null during SSR / before mount). */
export const getLenis = () => lenis;

export default function SmoothScroll({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.9, anchors: true });
    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, []);

  // New view: start at the top — or at the #anchor the link pointed to (e.g. "/#team-view").
  useEffect(() => {
    const l = lenis;
    if (!l) return;
    const id = window.location.hash.slice(1);
    const jump = () => {
      // re-measure first: Lenis still holds the previous view's height, and would clamp to it
      l.resize();
      ScrollTrigger.refresh();
      const target = id ? document.getElementById(id) : null;
      l.scrollTo(target ?? 0, { immediate: true, force: true });
    };
    requestAnimationFrame(jump);
    // once more after late layout (fonts, sticky sections), so anchors land exactly
    const again = window.setTimeout(jump, 250);
    return () => window.clearTimeout(again);
  }, [pathname]);

  return <>{children}</>;
}
