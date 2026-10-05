"use client";

import { useEffect, useRef, useState } from "react";

/** True while the element is on screen: the live visuals only animate when they can be seen. */
export function useInView<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { rootMargin });
    io.observe(ref.current!);
    return () => io.disconnect();
  }, [rootMargin]);
  return [ref, inView] as const;
}

/** True when the visitor asked for reduced motion: visuals then show a still, finished state. */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/** Calls `fn` every `ms` while `active`. */
export function useTicker(active: boolean, ms: number, fn: () => void) {
  const cb = useRef(fn);
  cb.current = fn;
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => cb.current(), ms);
    return () => clearInterval(id);
  }, [active, ms]);
}

export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
