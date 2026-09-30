"use client";

import { useEffect } from "react";
import { getLenis } from "@/components/SmoothScroll";
import { whenWorldsWarm } from "@/components/scene/stageReady";

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);

/**
 * The hero is a gateway, not a page to scroll through: the first small scroll, swipe, tap or
 * key press glides straight to "Pioneering" (the fly-through plays on the way), and a flick
 * up from "Pioneering" glides back to the top. Input is held while gliding.
 */
export default function HeroAutoAdvance() {
  useEffect(() => {
    let gliding = false;
    const target = () => document.getElementById("about")?.offsetTop ?? 0; // Pioneering, fully in place

    /** 1 = heading to Pioneering, -1 = back to the top, 0 = leave it to normal scrolling */
    const decide = (dir: number) => {
      const y = window.scrollY, t = target();
      if (dir > 0 && y < t - 4) return 1;
      if (dir < 0 && y > 2 && y <= t + 4) return -1;
      return 0;
    };

    const glide = async (to: 1 | -1) => {
      const lenis = getLenis();
      if (!lenis || gliding) return;
      gliding = true;
      // the worlds ahead must be ready, or the flight would stutter on the way
      if (to > 0) await whenWorldsWarm();
      const dest = to > 0 ? target() : 0;
      const distance = Math.abs(dest - window.scrollY) / window.innerHeight;
      lenis.scrollTo(dest, {
        duration: Math.min(2.8, 0.9 + distance * 0.55),
        easing: easeInOutCubic,
        lock: true,
        force: true,
        onComplete: () => {
          gliding = false;
        },
      });
    };

    const onWheel = (e: WheelEvent) => {
      if (gliding) {
        e.preventDefault();
        e.stopImmediatePropagation();
        return;
      }
      if (Math.abs(e.deltaY) < 2) return;
      const d = decide(Math.sign(e.deltaY));
      if (!d) return;
      e.preventDefault();
      e.stopImmediatePropagation(); // don't let the smooth-scroller move it a little first
      void glide(d as 1 | -1);
    };

    let touchY = 0, touchX = 0, moved = false;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0].clientY;
      touchX = e.touches[0].clientX;
      moved = false;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (gliding) {
        e.preventDefault();
        return;
      }
      const dy = touchY - e.touches[0].clientY;
      if (Math.abs(dy) < 8 || Math.abs(dy) < Math.abs(e.touches[0].clientX - touchX)) return;
      moved = true;
      const d = decide(Math.sign(dy));
      if (!d) return;
      e.preventDefault();
      void glide(d as 1 | -1);
    };
    // a plain tap on the hero also moves on (links and buttons keep their own behaviour)
    const onTouchEnd = (e: TouchEvent) => {
      if (moved || gliding) return;
      const el = e.target as HTMLElement;
      if (el.closest("a, button, .site-header")) return;
      if (window.scrollY < 4) void glide(1);
    };

    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, [contenteditable]")) return;
      const down = ["ArrowDown", "PageDown", " ", "Spacebar"].includes(e.key);
      const up = ["ArrowUp", "PageUp"].includes(e.key);
      if (!down && !up) return;
      if (gliding) {
        e.preventDefault();
        return;
      }
      const d = decide(down ? 1 : -1);
      if (!d) return;
      e.preventDefault();
      void glide(d as 1 | -1);
    };

    // "Explore" in the hero glides the same way
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href="#about"]');
      if (!a) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      void glide(1);
    };

    // capture phase, so these run before the smooth-scroller's own listeners
    const opts = { capture: true, passive: false } as const;
    window.addEventListener("wheel", onWheel, opts);
    window.addEventListener("touchstart", onTouchStart, { capture: true, passive: true });
    window.addEventListener("touchmove", onTouchMove, opts);
    window.addEventListener("touchend", onTouchEnd, { capture: true, passive: true });
    window.addEventListener("keydown", onKey, opts);
    window.addEventListener("click", onClick, opts);
    return () => {
      window.removeEventListener("wheel", onWheel, opts);
      window.removeEventListener("touchstart", onTouchStart, { capture: true });
      window.removeEventListener("touchmove", onTouchMove, opts);
      window.removeEventListener("touchend", onTouchEnd, { capture: true });
      window.removeEventListener("keydown", onKey, opts);
      window.removeEventListener("click", onClick, opts);
    };
  }, []);

  return null;
}
