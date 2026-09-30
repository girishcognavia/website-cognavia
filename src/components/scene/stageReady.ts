// Stage setup signals, kept free of three.js so the page overlay can use them without
// pulling the 3D bundle into the first load.
//
// Two phases:
//  1. "ready"  — the hero is prepared; the intro can play.
//  2. "warm"   — the other sections' worlds are prepared too, so the scroll flight to them
//                never stalls. Runs right after the intro lands, or sooner on request.
const readyListeners = new Set<() => void>();
const warmListeners = new Set<() => void>();
let warmRequest: (() => void) | null = null;

export const stageStatus = { ready: false, warm: false };

export function markStageReady() {
  if (stageStatus.ready) return;
  stageStatus.ready = true;
  document.documentElement.dataset.stageReady = String(Math.round(performance.now()));
  readyListeners.forEach((l) => l());
  readyListeners.clear();
}

export function markWorldsWarm() {
  if (stageStatus.warm) return;
  stageStatus.warm = true;
  warmListeners.forEach((l) => l());
  warmListeners.clear();
}

/** The Home view is mounting again: its stage must redo its setup before the intro. */
export function resetStageReady() {
  stageStatus.ready = false;
  stageStatus.warm = false;
  delete document.documentElement.dataset.stageReady;
}

/** Runs `cb` once the stage is ready (immediately if it already is). Returns an unsubscribe. */
export function onStageReady(cb: () => void) {
  if (stageStatus.ready) {
    cb();
    return () => {};
  }
  readyListeners.add(cb);
  return () => readyListeners.delete(cb);
}

/** The stage registers how to start phase 2 early. */
export function setWarmRequest(fn: (() => void) | null) {
  warmRequest = fn;
}

/**
 * Resolves once every world is prepared (asking the stage to start now if it hasn't),
 * or after `maxWait` ms at the latest — so the caller never waits indefinitely.
 */
export function whenWorldsWarm(maxWait = 1500): Promise<void> {
  if (stageStatus.warm) return Promise.resolve();
  warmRequest?.();
  return new Promise((resolve) => {
    const done = () => {
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(() => {
      warmListeners.delete(done);
      resolve();
    }, maxWait);
    warmListeners.add(done);
  });
}
