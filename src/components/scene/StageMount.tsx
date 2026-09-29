"use client";

import { useLayoutEffect } from "react";
import dynamic from "next/dynamic";
import { scrollState } from "./scrollState";
import { resetStageReady } from "./stageReady";

// WebGL only runs in the browser.
const Stage = dynamic(() => import("./Stage"), { ssr: false });

/** Fixed, full-screen 3D stage that sits behind every section of the Home view. */
export default function StageMount() {
  // Returning to Home from another view: start the scene from the top, and re-run the
  // one-time GPU setup before the intro plays again.
  useLayoutEffect(() => {
    scrollState.hero = scrollState.about = scrollState.products = scrollState.team = 0;
    resetStageReady();
  }, []);

  return (
    <div className="stage" aria-hidden>
      <Stage />
    </div>
  );
}
