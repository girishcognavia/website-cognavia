"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { globeLayout } from "./GlobeWorld";
import { productsLayout, queuePos } from "./ProductsWorld";
import { BUBBLE, ORBIT_ROLL, PLATFORM_R, PLATFORM_Z, teamLayout } from "./TeamWorld";
import { ABOUT_SETTLE, PRODUCTS_SETTLE, TEAM_SETTLE } from "./scrollState";
import { clamp01, interaction, motion, rng } from "./shared";

/**
 * The living star field that runs through the whole page.
 *
 * One GPU particle system. Every star has a home in each section's formation — a spiral
 * galaxy behind the hero title, orbital rings around the globe, a vortex behind the product
 * queue, halos around the leadership portraits — plus a spot in an open "sky" that streams
 * past the camera. Scroll decides which formation the stars are gathering into; between
 * sections they dissolve into the sky and re-gather ahead. The pointer acts as a lens, and
 * dragging the background turns the formation.
 */

const GALAXY_ANCHOR = new THREE.Vector3(0, 0, -3);
const Z_AXIS = new THREE.Vector3(0, 0, 1);

/* ------------------------------------------------------------------ */
/* Formation shapes (built once on the CPU, blended on the GPU)         */
/* ------------------------------------------------------------------ */

type Rand = () => number;
const gaussOf = (rand: Rand) => () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());

/** Two-armed spiral galaxy (unit radius ≈ 2.75). Returns positions + arm parameter (-1 = core). */
function galaxyShape(n: number, rand: Rand) {
  const gauss = gaussOf(rand);
  const pos = new Float32Array(n * 3);
  const arm = new Float32Array(n);
  const TURNS = 1.3;
  for (let i = 0; i < n; i++) {
    let x, y, z, t;
    if (rand() < 0.1) {
      const r = Math.abs(gauss()) * 0.3, a = rand() * Math.PI * 2;
      x = Math.cos(a) * r; y = Math.sin(a) * r; z = gauss() * 0.08; t = -1;
    } else {
      t = Math.pow(rand(), 0.75);
      const a = t * TURNS * Math.PI * 2 + (i % 2) * Math.PI;
      const r = 0.25 + t * 2.5;
      const spread = gauss() * (0.05 + 0.22 * t);
      x = Math.cos(a) * r - Math.sin(a) * spread;
      y = Math.sin(a) * r + Math.cos(a) * spread;
      z = gauss() * 0.06 * (1 + t);
    }
    pos.set([x, y, z], i * 3);
    arm[i] = t;
  }
  return { pos, arm };
}

/** Point on a tilted ring (radius r, band thickness w) — in the ring's own XY plane, then rotated. */
function ringPoint(r: number, w: number, rot: THREE.Euler, gauss: () => number, rand: Rand) {
  const a = rand() * Math.PI * 2;
  const rr = r + gauss() * w;
  return new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr, gauss() * w * 0.6).applyEuler(rot);
}

/** Orbital rings + a soft halo around the globe (globe-local units). Ring tilts match GlobeWorld's rings. */
function globeShape(n: number, rand: Rand) {
  const gauss = gaussOf(rand);
  const out = new Float32Array(n * 3);
  const ringA = new THREE.Euler(1.33, 0.08, 0.2);
  const ringB = new THREE.Euler(1.2, -0.1, -0.32);
  for (let i = 0; i < n; i++) {
    const u = rand();
    let p: THREE.Vector3;
    if (u < 0.36) p = ringPoint(4.5, 0.14, ringA, gauss, rand);
    else if (u < 0.6) p = ringPoint(3.5, 0.11, ringB, gauss, rand);
    else {
      // halo shell hugging the globe
      const v = new THREE.Vector3(gauss(), gauss(), gauss()).normalize();
      p = v.multiplyScalar(2.45 + Math.abs(gauss()) * 0.4);
    }
    out.set([p.x, p.y, p.z], i * 3);
  }
  return out;
}

/** Slow star vortex behind the product queue + a stream flowing along the queue (products-local). */
function productsShape(n: number, rand: Rand) {
  const gauss = gaussOf(rand);
  const out = new Float32Array(n * 3);
  const centre = new THREE.Vector3(0.4, 0.3, -3.8);
  const tilt = new THREE.Euler(0.35, -0.2, 0);
  const a0 = queuePos(-0.9), a1 = queuePos(4.1);
  for (let i = 0; i < n; i++) {
    let p: THREE.Vector3;
    if (rand() < 0.62) {
      const t = Math.pow(rand(), 0.7);
      const a = t * 1.1 * Math.PI * 2 + (i % 3) * ((Math.PI * 2) / 3);
      const r = 0.6 + t * 6.8;
      const spread = gauss() * (0.08 + 0.35 * t);
      p = new THREE.Vector3(Math.cos(a) * r - Math.sin(a) * spread, Math.sin(a) * r + Math.cos(a) * spread, gauss() * 0.15)
        .applyEuler(tilt)
        .add(centre);
    } else {
      const t = rand();
      p = a0.clone().lerp(a1, t).add(new THREE.Vector3(gauss() * 0.55, gauss() * 0.55 + Math.sin(t * 9) * 0.25, -1.9 - Math.abs(gauss()) * 0.6));
    }
    out.set([p.x, p.y, p.z], i * 3);
  }
  return out;
}

/** Halos around each portrait bubble + a ring of stars tracing the stage edge (team-local, per layout). */
function teamShape(n: number, rand: Rand, aspect: number) {
  const gauss = gaussOf(rand);
  const layout = teamLayout(aspect);
  const out = new Float32Array(n * 3);
  const halo = new THREE.Euler(1.36, 0.18, 0.16); // same tilt as the bubble orbit in TeamWorld
  for (let i = 0; i < n; i++) {
    const u = rand();
    let p: THREE.Vector3;
    if (u < 0.56) {
      const card = layout.cards[u < 0.28 ? 0 : 1];
      // keep the top-right corner clear so the CEO / CTO pill stays readable
      let local: THREE.Vector3;
      do local = ringPoint(2.3, 0.16, halo, gauss, rand).applyAxisAngle(Z_AXIS, ORBIT_ROLL).add(BUBBLE);
      while (local.x > 0.9 && local.y > 0.95);
      p = local.add(new THREE.Vector3(...card.pos));
    } else {
      const a = rand() * Math.PI * 2;
      const r = PLATFORM_R + gauss() * 0.12;
      p = new THREE.Vector3(Math.cos(a) * r, layout.floorY + 0.06 + Math.abs(gauss()) * 0.08, PLATFORM_Z + Math.sin(a) * r);
    }
    out.set([p.x, p.y, p.z], i * 3);
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Shader                                                              */
/* ------------------------------------------------------------------ */

const vertexShader = /* glsl */ `
  uniform float uTime, uIntro, uHeroOut, uGlobeIn, uGlobeOut, uProdIn, uProdOut, uTeamIn;
  uniform float uPR, uAspect, uLens, uHead, uMotion, uGalS, uGlobeS, uProdS, uTeamS;
  uniform vec3 uCam, uGalA, uGlobeA, uProdA, uTeamA;
  uniform vec2 uDrag, uPointer;

  attribute vec3 aScatter;
  attribute vec4 aSeed;
  attribute float aShade;
  attribute vec3 aGlobe, aProd, aTeam;

  varying vec3 vColor;
  varying float vAlpha;

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
  float stagger(float x, float s) { return smoothstep(s * 0.4, s * 0.4 + 0.6, x); }

  // formation local → world, with its own slow spin and the shared drag rotation
  vec3 place(vec3 local, vec3 anchor, float scale, float spin, float drag) {
    vec3 p = local;
    p.xz = rot(spin) * p.xz;
    p.yz = rot(uDrag.x * drag) * p.yz;
    p.xz = rot(uDrag.y * drag) * p.xz;
    return anchor + p * scale;
  }

  // gather 'from' into 'to', swirling around the formation's anchor on the way in
  vec3 gather(vec3 from, vec3 to, vec3 anchor, float k, float s) {
    vec3 p = mix(from, to, k);
    float ang = sin(k * 3.1415926) * (0.35 + s * 0.35);
    p.xy = anchor.xy + rot(ang) * (p.xy - anchor.xy);
    return p;
  }

  void main() {
    float t = uTime;
    float s = aSeed.y;
    float bg = step(aSeed.w, 0.14);          // background stars never join a formation
    float heroStar = step(0.988, aSeed.w);   // a few large, bright stars

    // Sky: fixed in the world but wrapped around the camera's depth, so during the
    // fly-through stars stream past the viewer and recycle far ahead.
    float D = 42.0;
    float rel = mod(aScatter.z * D - uCam.z, D) - (D + 1.0);   // [-43, -1)
    float depth = -rel;
    vec3 sky;
    sky.x = aScatter.x * depth * 0.8 * uAspect + sin(s * 6.2831 + t * (0.3 + 0.4 * aSeed.z)) * 0.08;
    sky.y = aScatter.y * depth * 0.8 + (cos(aSeed.z * 6.2831 + t * (0.25 + 0.3 * s)) - 1.0) * 0.08;
    sky.z = uCam.z + rel;
    float skyFade = smoothstep(43.0, 36.0, depth) * smoothstep(1.2, 3.5, depth);

    // Hero galaxy: slow spin, tilt, drag
    vec3 g = position;
    g.xy = rot(t * 0.035) * g.xy;
    g.yz = rot(-1.05) * g.yz;
    g.yz = rot(uDrag.x) * g.yz;
    g.xz = rot(uDrag.y) * g.xz;
    vec3 galaxy = uGalA + g * uGalS;

    // Intro: scattered sky stars orbit inward into the galaxy
    float st = 0.10 + s * 0.18;
    float l = clamp((uIntro - st) / (0.58 + aSeed.z * 0.1), 0.0, 1.0);
    float sm = l * l * l * (l * (l * 6.0 - 15.0) + 10.0);
    float pull = mix(sm, sin(sm * 1.5707963), 0.5) * (1.0 - bg);
    vec3 pos = gather(sky, galaxy, uGalA, pull, s);

    // Section by section: dissolve into the sky, gather into the next formation
    float kHero = stagger(uHeroOut, aSeed.z);
    pos = mix(pos, sky, kHero);
    float kGi = stagger(uGlobeIn, s) * (1.0 - bg);
    pos = gather(pos, place(aGlobe, uGlobeA, uGlobeS, t * 0.05, 1.0), uGlobeA, kGi, s);
    float kGo = stagger(uGlobeOut, aSeed.z) * (1.0 - bg);
    pos = mix(pos, sky, kGo);
    float kPi = stagger(uProdIn, s) * (1.0 - bg);
    pos = gather(pos, place(aProd, uProdA, uProdS, 0.0, 0.5), uProdA, kPi, s);
    float kPo = stagger(uProdOut, aSeed.z) * (1.0 - bg);
    pos = mix(pos, sky, kPo);
    float kTi = stagger(uTeamIn, s) * (1.0 - bg);
    pos = gather(pos, place(aTeam, uTeamA, uTeamS, 0.0, 0.0), uTeamA, kTi, s);

    float onShape = max(max(pull * (1.0 - kHero), kGi * (1.0 - kGo)), max(kPi * (1.0 - kPo), kTi));
    float inSky = 1.0 - onShape;

    // Light travelling along the galaxy arms
    float illum = 0.0;
    if (aSeed.x >= 0.0) {
      float d = fract(uHead - aSeed.x);
      float near = min(d, 1.0 - d);
      illum = max(1.0 - smoothstep(0.0, 0.025, near), (1.0 - smoothstep(0.0, 0.14, d)) * 0.55);
      illum *= (1.0 - kHero) * smoothstep(0.7, 1.0, uIntro) * (1.0 - bg);
    }

    float tw = mix(1.0, 0.72 + 0.28 * sin(t * (0.8 + aSeed.w * 2.6) + s * 40.0), uMotion);
    float bright = (0.5 + illum * 2.2 + onShape * 0.3) * tw * mix(1.0, 1.8, heroStar);
    float size = (1.2 + aSeed.z * aSeed.z * 2.8) * mix(1.0, 2.3, heroStar) * (1.0 + illum * 0.8 + onShape * 0.15);
    float alpha = mix(0.35, 1.0, fract(aSeed.w * 13.7));
    alpha *= mix(1.0, skyFade, inSky);

    // Reveal: stars fade and grow in before the pull starts
    float rev = smoothstep(aSeed.z * 0.02, 0.14 + aSeed.z * 0.02, uIntro) * mix(0.2, 1.0, smoothstep(0.2, 1.0, uIntro));
    size *= sqrt(max(rev, 0.0));
    alpha *= smoothstep(0.0, 0.6, rev);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    float dist = -mv.z;
    vec4 clip = projectionMatrix * mv;
    alpha *= smoothstep(0.8, 2.2, dist);   // no stars poking the lens

    // Pointer lens: push stars apart and brighten them
    vec2 ndc = clip.xy / clip.w;
    vec2 dd = (ndc - uPointer) * vec2(uAspect, 1.0);
    float dl = length(dd);
    float L = (1.0 - smoothstep(0.0, 0.3, dl)) * uLens;
    ndc += (dd / max(dl, 1e-4)) * vec2(1.0 / uAspect, 1.0) * L * 0.035;
    clip.xy = ndc * clip.w;
    bright *= 1.0 + L * 1.4;
    size *= 1.0 + L * 0.7;

    float px = size * (12.0 / max(dist, 0.5)) * uPR;
    alpha *= clamp(px / (2.0 * uPR), 0.25, 1.0);
    gl_PointSize = clamp(px, 1.2, 46.0);
    gl_Position = clip;
    vColor = vec3(aShade) * bright;
    vAlpha = alpha;
  }
`;

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 p = gl_PointCoord * 2.0 - 1.0;
    float r2 = dot(p, p);
    if (r2 > 1.0) discard;
    float a = (exp(-r2 * 5.0) + exp(-r2 * 1.6) * 0.18) * (1.0 - r2) * vAlpha;
    if (a < 0.12) discard; // only the star's core writes depth (keeps depth of field honest)
    gl_FragColor = vec4(vColor * a, a);
  }
`;

/* ------------------------------------------------------------------ */

export default function StarField() {
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const mobile = aspect < 1;
  const N = mobile ? 6500 : 12000;

  const geometry = useMemo(() => {
    const rand = rng(27);
    const galaxy = galaxyShape(N, rand);
    const scatter = new Float32Array(N * 3);
    const seeds = new Float32Array(N * 4);
    const shade = new Float32Array(N);
    const shades = [1, 1, 0.92, 0.82, 0.7]; // white and silver only
    for (let i = 0; i < N; i++) {
      scatter.set([rand() - 0.5, rand() - 0.5, rand() - 0.5], i * 3);
      seeds.set([galaxy.arm[i], rand(), rand(), rand()], i * 4);
      shade[i] = shades[Math.floor(rand() * shades.length)];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(galaxy.pos, 3)); // galaxy formation
    g.setAttribute("aScatter", new THREE.BufferAttribute(scatter, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 4));
    g.setAttribute("aShade", new THREE.BufferAttribute(shade, 1));
    g.setAttribute("aGlobe", new THREE.BufferAttribute(globeShape(N, rng(31)), 3));
    g.setAttribute("aProd", new THREE.BufferAttribute(productsShape(N, rng(37)), 3));
    return g;
  }, [N]);

  // the team formation depends on the layout (cards side by side vs stacked)
  useEffect(() => {
    geometry.setAttribute("aTeam", new THREE.BufferAttribute(teamShape(N, rng(41), aspect), 3));
  }, [geometry, N, mobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: true,
        blending: THREE.CustomBlending,
        blendSrc: THREE.OneFactor,
        blendDst: THREE.OneFactor,
        uniforms: {
          uTime: { value: 0 },
          uIntro: { value: 0 },
          uHeroOut: { value: 0 },
          uGlobeIn: { value: 0 },
          uGlobeOut: { value: 0 },
          uProdIn: { value: 0 },
          uProdOut: { value: 0 },
          uTeamIn: { value: 0 },
          uPR: { value: 1 },
          uAspect: { value: 1 },
          uLens: { value: 0 },
          uHead: { value: 0 },
          uMotion: { value: 1 },
          uGalS: { value: 2.9 },
          uGlobeS: { value: 1 },
          uProdS: { value: 1 },
          uTeamS: { value: 1 },
          uCam: { value: new THREE.Vector3() },
          uGalA: { value: GALAXY_ANCHOR.clone() },
          uGlobeA: { value: new THREE.Vector3() },
          uProdA: { value: new THREE.Vector3() },
          uTeamA: { value: new THREE.Vector3() },
          uDrag: { value: new THREE.Vector2() },
          uPointer: { value: new THREE.Vector2(9, 9) },
        },
      }),
    [],
  );

  /* ---------- interaction: drag to turn the formation, pointer lens ---------- */
  const drag = useRef({ x: 0, y: 0, active: false, px: 0, py: 0, last: -1e9 });
  const lens = useRef({ value: 0, lastMove: -1e9 });
  const reduceMotion = useRef(false);

  useEffect(() => {
    reduceMotion.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = gl.domElement;
    const d = drag.current;
    el.style.cursor = "grab";
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      d.active = true;
      d.px = e.clientX;
      d.py = e.clientY;
      el.style.cursor = "grabbing";
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse") lens.current.lastMove = performance.now();
      if (!d.active) return;
      d.y += (e.clientX - d.px) * 0.006;
      d.x = Math.max(-0.8, Math.min(0.8, d.x + (e.clientY - d.py) * 0.004));
      d.px = e.clientX;
      d.py = e.clientY;
      d.last = performance.now();
    };
    const up = () => {
      if (!d.active) return;
      d.active = false;
      el.style.cursor = "grab";
    };
    const leave = () => (lens.current.lastMove = -1e9);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.removeEventListener("pointerleave", leave);
    };
  }, [gl]);

  useFrame((state, dt) => {
    const u = material.uniforms;
    const d = drag.current;
    const now = performance.now();

    // drag eases in, then drifts back to facing forward
    if (now - d.last > 2000 && !d.active) {
      d.x *= Math.exp(-dt * 0.8);
      d.y *= Math.exp(-dt * 0.8);
    }
    const ease = 1 - Math.exp(-dt * 6);
    interaction.rotX += (d.x - interaction.rotX) * ease;
    interaction.rotY += (d.y - interaction.rotY) * ease;
    u.uDrag.value.set(interaction.rotX, interaction.rotY);

    lens.current.value += ((now - lens.current.lastMove < 1500 ? 1 : 0) - lens.current.value) * (1 - Math.exp(-dt * 4));
    u.uLens.value = lens.current.value;
    u.uPointer.value.copy(state.pointer);

    // time + intro (the intro clock only runs once the stage is ready — see MotionDriver)
    const t = reduceMotion.current ? 0 : motion.t;
    u.uTime.value = t;
    u.uMotion.value = reduceMotion.current ? 0 : 1;
    u.uIntro.value = reduceMotion.current ? 1 : clamp01(motion.t / 4.8);
    u.uHead.value = (t * 0.05) % 1;

    // section progress → formation weights
    u.uHeroOut.value = clamp01((motion.p - 0.08) / 0.55);
    u.uGlobeIn.value = clamp01(motion.a / ABOUT_SETTLE);
    u.uGlobeOut.value = clamp01((motion.g - 0.02) / 0.4);
    u.uProdIn.value = clamp01(motion.g / PRODUCTS_SETTLE);
    u.uProdOut.value = clamp01((motion.m - 0.02) / 0.4);
    u.uTeamIn.value = clamp01(motion.m / TEAM_SETTLE);

    // anchors + scales follow each world's responsive layout
    const a = state.size.width / state.size.height;
    const globe = globeLayout(a);
    const products = productsLayout(a);
    const team = teamLayout(a);
    u.uGalS.value = a < 1 ? 1.35 : 2.9;
    u.uGlobeA.value.copy(globe.pos);
    u.uGlobeS.value = globe.scale;
    u.uProdA.value.copy(products.pos);
    u.uProdS.value = products.scale;
    u.uTeamA.value.copy(team.pos);
    u.uTeamS.value = team.scale;

    u.uCam.value.copy(state.camera.position);
    u.uAspect.value = a;
    u.uPR.value = state.viewport.dpr;
  });

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />;
}
