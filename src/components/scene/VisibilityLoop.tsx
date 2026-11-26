"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";

/* On phones, and on desktops whose graphics chip can't keep up, every 3D scene holds its
   current frame while the page is scrolling, so the chip is free to move the page smoothly;
   drawing resumes a moment after scrolling stops. Desktops that keep up animate throughout
   (a frozen full-screen scene there read as the page sticking). */
const SETTLE_MS = 160;
let scrolling = false;
let holdWhileScrolling =
  typeof window !== "undefined" && matchMedia("(pointer: coarse), (max-width: 900px)").matches;
let timer = 0;
const listeners = new Set<() => void>();
function onScroll() {
  if (!scrolling) {
    scrolling = true;
    listeners.forEach((l) => l());
  }
  clearTimeout(timer);
  timer = window.setTimeout(() => {
    scrolling = false;
    listeners.forEach((l) => l());
  }, SETTLE_MS);
}
function subscribe(l: () => void) {
  if (listeners.size === 0) window.addEventListener("scroll", onScroll, { passive: true });
  listeners.add(l);
  return () => {
    listeners.delete(l);
    if (listeners.size === 0) window.removeEventListener("scroll", onScroll);
  };
}

/**
 * Starts and stops a canvas's render loop as its element enters and leaves the viewport, and
 * holds it while the page is scrolling — imperatively, without a React re-render (re-rendering
 * a canvas's tree rebuilds its post-processing chain, which showed up as a hitch). It also
 * lowers the canvas resolution if the device can't keep up.
 */
export default function VisibilityLoop({
  target,
  rootMargin = "0px",
  onChange,
}: {
  target: React.RefObject<Element | null> | (() => Element | null);
  rootMargin?: string;
  onChange?: (visible: boolean, entry: IntersectionObserverEntry) => void;
}) {
  const setFrameloop = useThree((s) => s.setFrameloop);
  const setDpr = useThree((s) => s.setDpr);
  useEffect(() => {
    const el = typeof target === "function" ? target() : target.current;
    if (!el) return;
    let visible = false;
    const apply = () => setFrameloop(visible && !(scrolling && holdWhileScrolling) ? "always" : "never");
    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        apply();
        onChange?.(visible, e);
      },
      { rootMargin, threshold: [0, 0.3, 0.6] },
    );
    io.observe(el);
    const unsubscribe = subscribe(apply);
    return () => {
      io.disconnect();
      unsubscribe();
    };
  }, [target, rootMargin, setFrameloop, onChange]);
  // frame rate dropping (a lighter graphics chip): draw at standard resolution instead,
  // and if it still can't keep up, hold the scenes while scrolling too
  return (
    <PerformanceMonitor
      flipflops={2}
      onDecline={() => {
        setDpr(1);
        holdWhileScrolling = true;
      }}
    />
  );
}
