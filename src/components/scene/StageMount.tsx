"use client";

import { useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { scrollState } from "./scrollState";

// WebGL only runs in the browser. Start fetching the 3D code as soon as this module loads
// (not after the page has hydrated), so it downloads alongside everything else.
const loadStage = () => import("./Stage");
if (typeof window !== "undefined") void loadStage();
const Stage = dynamic(loadStage, { ssr: false });

/**
 * Fixed, full-screen 3D stage behind the Home view's products and team sections (the hero
 * and Pioneering sections are opaque and have their own canvases). It only renders once the
 * products section is near.
 */
export default function StageMount() {
  // The hero and Pioneering no longer drive this stage: its flight starts already past them.
  useLayoutEffect(() => {
    scrollState.hero = scrollState.about = 1;
    scrollState.products = scrollState.team = 0;
  }, []);

  return (
    <div className="stage" aria-hidden>
      <Stage />
    </div>
  );
}
