"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";

/**
 * The hero's galaxy: a disk of stars on fine concentric tracks, seen almost edge-on and centred
 * on the globe. Being a real 3D disk, its near side passes in front of the globe and the
 * glass, and its far side behind them. It swirls in as the scene lands, then turns very slowly,
 * inner stars faster than outer ones. Monochrome, additive, subtle.
 */

/** Disk placement (centred on the globe), radius, and how it sits: seen almost edge-on, rising to the right. */
export const GALAXY = {
  center: new THREE.Vector3(0.84, -0.6, 0),
  radius: 5.65,
  incline: -1.47,
  roll: 0.17,
};

const COUNT = 46000;

type Rand = () => number;
function rng(seed: number): Rand {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Star positions in the disk's own plane (unit radius), with per-star size / brightness /
 * phase / radius and a colour. Stars gather on fine concentric tracks (the reference's ringed
 * look), with two faint spiral arms through them and a sprinkling of warm stars.
 */
function buildGalaxy(n: number) {
  const rand = rng(11);
  const gauss = () => Math.sqrt(-2 * Math.log(rand() + 1e-9)) * Math.cos(2 * Math.PI * rand());
  const pos = new Float32Array(n * 3);
  const seed = new Float32Array(n * 4);
  const col = new Float32Array(n * 3);
  const INNER = 0.29; // just outside the globe
  const TRACKS = 19;
  for (let i = 0; i < n; i++) {
    const u = rand();
    let r: number, a: number, b: number, s: number;
    if (u < 0.86) {
      // concentric tracks, denser and brighter toward the globe
      const t = Math.pow(rand(), 1.35);
      const k = Math.round(t * TRACKS) / TRACKS;
      r = INNER + k * (1 - INNER) + gauss() * 0.0016;
      a = rand() * Math.PI * 2;
      b = 0.55 + rand() * 0.45;
      s = 0.55 + Math.pow(rand(), 3) * 1.6;
    } else if (u < 0.95) {
      // two loose spiral arms sweeping through the tracks
      const t = Math.pow(rand(), 0.9);
      r = INNER + t * (1 - INNER) + gauss() * 0.02;
      a = t * 1.1 * Math.PI * 2 + (i % 2) * Math.PI + gauss() * 0.22;
      b = 0.6 + rand() * 0.4;
      s = 0.7 + Math.pow(rand(), 3) * 2.2;
    } else {
      // haze
      r = INNER * 0.95 + Math.pow(rand(), 0.8) * 1.08;
      a = rand() * Math.PI * 2;
      b = 0.1 + rand() * 0.15;
      s = 0.45 + rand() * 0.5;
    }
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    const z = gauss() * (0.003 + 0.005 * r);
    const rr = Math.min(1, r);
    // brightest close in, dissolving toward the rim
    b *= (1 - 0.55 * Math.pow(rr, 1.2)) * (1 - THREE.MathUtils.smoothstep(r, 0.88, 1.08));
    if (rand() > 0.985) {
      b = Math.min(1, b * 2 + 0.35);
      s *= 2.1;
    }
    // colour: cool blue-white, a few warm (orange-gold) stars
    const warm = rand() < 0.1;
    const c = warm ? [1.0, 0.68, 0.38] : rand() < 0.3 ? [0.62, 0.76, 1.0] : [0.86, 0.92, 1.0];
    pos.set([x, y, z], i * 3);
    seed.set([s, b, rand(), rr], i * 4);
    col.set(c, i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  g.setAttribute("aColor", new THREE.BufferAttribute(col, 3));
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1.2);
  return g;
}

const vertexShader = /* glsl */ `
  uniform float uTime, uIntro, uPR, uRadius;
  attribute vec4 aSeed;            // x size, y brightness, z phase, w radius (0 core .. 1 rim)
  attribute vec3 aColor;
  varying float vA;
  varying vec3 vC;
  void main() {
    vec3 p = position;
    float r = aSeed.w;

    // arrival: the inner disk forms first, every star sweeping in on a short spiral
    float k = clamp((uIntro - r * 0.38) / 0.62, 0.0, 1.0);
    float e = k * k * (3.0 - 2.0 * k);

    // differential rotation: the core turns faster than the rim
    float ang = uTime * (0.012 + 0.045 / (1.0 + r * 5.0)) + (1.0 - e) * 1.35;
    float c = cos(ang), s = sin(ang);
    p.xy = mat2(c, s, -s, c) * p.xy * mix(1.18, 1.0, e);

    vec4 mv = modelViewMatrix * vec4(p * uRadius, 1.0);
    gl_Position = projectionMatrix * mv;

    vC = aColor;
    float twinkle = 0.78 + 0.22 * sin(uTime * (0.7 + aSeed.z * 2.0) + aSeed.z * 60.0);
    float px = aSeed.x * 15.0 * uPR / max(-mv.z, 1.0);
    gl_PointSize = clamp(px, 1.0, 7.0 * uPR);
    // sub-pixel stars stay soft rather than flickering
    vA = aSeed.y * 2.9 * twinkle * e * clamp(px / (1.6 * uPR), 0.6, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  varying float vA;
  varying vec3 vC;
  void main() {
    vec2 q = gl_PointCoord * 2.0 - 1.0;
    float d = dot(q, q);
    if (d > 1.0) discard;
    float a = (exp(-d * 4.5) + 0.12 * exp(-d * 1.4)) * vA;
    gl_FragColor = vec4(vC * a, a);
  }
`;

/** A soft glow lying in the disk: the galaxy's luminous core and the faint band of its arms. */
function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.08, "rgba(255,255,255,0.55)");
  g.addColorStop(0.3, "rgba(255,255,255,0.12)");
  g.addColorStop(0.65, "rgba(255,255,255,0.03)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export default function HeroGalaxy({ clock }: { clock: { t: number } }) {
  const dpr = useThree((s) => s.viewport.dpr);
  const geometry = useMemo(() => buildGalaxy(COUNT), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uIntro: { value: 0 }, uPR: { value: 1 }, uRadius: { value: GALAXY.radius } },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  const glow = useMemo(() => glowTexture(), []);
  const glowMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glow,
        color: new THREE.Color("#8fb0ff"),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [glow],
  );

  useFrame((state) => {
    const u = material.uniforms;
    u.uTime.value = state.clock.elapsedTime;
    // lands with the scene: starts as the panes settle, fully formed ~3s in
    u.uIntro.value = Math.min(1, Math.max(0, (clock.t - 0.7) / 2.4));
    u.uPR.value = dpr;
    glowMat.opacity = 0.05 * Math.min(1, Math.max(0, (clock.t - 0.9) / 2.2));
  });

  return (
    <group position={GALAXY.center} rotation={[0, 0, GALAXY.roll]}>
      <group rotation={[GALAXY.incline, 0, 0]}>
        <points geometry={geometry} material={material} frustumCulled={false} renderOrder={2} />
        {/* the core's glow and the faint luminous disk, lying in the galaxy's plane */}
        <mesh material={glowMat} scale={GALAXY.radius * 0.95} renderOrder={1}>
          <planeGeometry args={[2, 2]} />
        </mesh>
      </group>
    </group>
  );
}
