"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { scrollState } from "./scrollState";
import { stageStatus } from "./stageReady";

/* ------------------------------------------------------------------ */
/* Shared motion clock: intro time + damped scroll progress            */
/* ------------------------------------------------------------------ */

export const motion = {
  /** intro/animation time in seconds; only runs once the stage is ready (see Warmup) */
  t: 0,
  /** damped hero progress (0..1) */
  p: 0,
  /** damped about progress (0..1) */
  a: 0,
  /** damped products progress (0..1) */
  g: 0,
  /** damped team progress (0..1) */
  m: 0,
};

export const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
export const easeOutExpo = (x: number) => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x));
/** Explosion burst on load: 0 → 1 over ~1.8s */
/** Hero intro reveal for the orbit lines and orbs: eases in as the star galaxy forms. */
export const burst = () => easeOutExpo(clamp01((motion.t - 0.35) / 1.6));

export function MotionDriver() {
  useEffect(() => {
    // fresh mount (first visit or back from another view): restart the intro clock and
    // start the damped scroll values where the page actually is
    motion.t = 0;
    motion.p = scrollState.hero;
    motion.a = scrollState.about;
    motion.g = scrollState.products;
    motion.m = scrollState.team;
  }, []);
  // Negative priority: runs before every other frame callback, never takes over rendering.
  useFrame((_, dt) => {
    // The intro clock only starts once the one-time GPU setup is done, and it advances by
    // (capped) frame time rather than wall time: if the browser stalls, the animation
    // pauses and resumes instead of jumping to its end.
    if (stageStatus.ready) motion.t += Math.min(dt, 1 / 30);
    motion.p = THREE.MathUtils.damp(motion.p, scrollState.hero, 5, dt);
    motion.a = THREE.MathUtils.damp(motion.a, scrollState.about, 5, dt);
    motion.g = THREE.MathUtils.damp(motion.g, scrollState.products, 5, dt);
    motion.m = THREE.MathUtils.damp(motion.m, scrollState.team, 5, dt);
  }, -1);
  return null;
}

/** Deterministic PRNG so the composition is identical on every visit. */
export function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Explosion directions lean left/right, like the reference composition. */





export const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const easeOutCubic = (x: number) => 1 - Math.pow(1 - x, 3);
export const easeInCubic = (x: number) => x * x * x;

/**
 * Drag-to-rotate state, shared by the star field and the globe. Written by the pointer
 * handlers in StarField; eases back to facing forward a couple of seconds after a drag.
 */
export const interaction = { rotX: 0, rotY: 0 };
