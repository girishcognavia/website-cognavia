"use client";

import { useEffect } from "react";

/**
 * Pointer effects for the About content (no scroll animation):
 * [data-fx] elements get --mx / --my (pointer position inside them, px) for spotlights and glows.
 */
export default function AboutFx() {
  useEffect(() => {
    let raf = 0;
    let last: PointerEvent | null = null;

    const apply = () => {
      raf = 0;
      const e = last;
      if (!e) return;
      document.querySelectorAll<HTMLElement>("[data-fx]").forEach((el) => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left, y = e.clientY - r.top;
        el.style.setProperty("--mx", `${x}px`);
        el.style.setProperty("--my", `${y}px`);
      });
    };

    const move = (e: PointerEvent) => {
      last = e;
      if (!raf) raf = requestAnimationFrame(apply);
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
