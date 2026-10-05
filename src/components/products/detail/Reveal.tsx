"use client";

import { createElement, useEffect, useRef, type ElementType, type HTMLAttributes, type ReactNode } from "react";

/** Adds `data-in` once the element scrolls into view (a one-time reveal, no scroll scrubbing). */
export default function Reveal({
  as: Tag = "div",
  children,
  ...rest
}: { as?: ElementType; children: ReactNode } & HTMLAttributes<HTMLElement>) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.in = "";
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return createElement(Tag, { ref, "data-reveal-block": "", ...rest }, children);
}
