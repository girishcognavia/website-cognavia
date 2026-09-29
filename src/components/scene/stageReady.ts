// "The 3D stage has finished its one-time setup" signal. Kept free of three.js so the
// page overlay can wait on it without pulling the 3D bundle into the first load.
const listeners = new Set<() => void>();

export const stageStatus = { ready: false };

export function markStageReady() {
  if (stageStatus.ready) return;
  stageStatus.ready = true;
  document.documentElement.dataset.stageReady = String(Math.round(performance.now()));
  listeners.forEach((l) => l());
  listeners.clear();
}

/** The Home view is mounting again: its stage must redo its setup before the intro. */
export function resetStageReady() {
  stageStatus.ready = false;
  delete document.documentElement.dataset.stageReady;
}

/** Runs `cb` once the stage is ready (immediately if it already is). Returns an unsubscribe. */
export function onStageReady(cb: () => void) {
  if (stageStatus.ready) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => listeners.delete(cb);
}
