"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Starts and stops a canvas's render loop as its element enters and leaves the viewport —
 * imperatively, without a React re-render (re-rendering a canvas's tree rebuilds its
 * post-processing chain, which showed up as a hitch at every section boundary).
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
  useEffect(() => {
    const el = typeof target === "function" ? target() : target.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        const visible = e.isIntersecting;
        setFrameloop(visible ? "always" : "never");
        onChange?.(visible, e);
      },
      { rootMargin, threshold: [0, 0.3, 0.6] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, rootMargin, setFrameloop, onChange]);
  return null;
}
