"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer, Line } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import Prepare from "@/components/scene/Prepare";
import VisibilityLoop from "@/components/scene/VisibilityLoop";
import type { Line2, LineSegments2 } from "three-stdlib";

/**
 * Interactive android head for the About us view (black & white).
 *
 * - The head turns to follow the pointer anywhere on the page (finger on touch screens).
 * - Glowing seams brighten where the pointer is.
 * - Clicking / tapping the head sends a scan pulse over it; readouts flicker.
 * - Callout labels (HTML, owned by AboutVisual) are pinned to anchor points on the head.
 */

export type Callout = {
  anchor: [number, number, number];
  /** which part the anchor rides on */
  part?: "head" | "torso";
  el: HTMLElement | null;
  line: SVGLineElement | null;
  dot: SVGCircleElement | null;
};
export type HeadShared = { callouts: Callout[]; overlay: HTMLElement | null };

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

/**
 * Sphere → humanoid android head (face is +z): a long skull, a flattened face plate,
 * a jaw that tapers forward to a chin, and a skull base that tucks in toward the neck.
 */
function deform(v: THREE.Vector3) {
  let { x, y, z } = v;
  x *= 0.8;
  y *= 1.05;
  z *= 1.14;
  if (z > 0.6) z = 0.6 + (z - 0.6) * 0.5; // flat face plate
  if (y < 0) {
    const t = Math.min(1, -y / 1.05);
    x *= 1 - 0.46 * t * t; // narrow jaw
    if (z < 0) z *= 1 - 0.6 * t; // skull base tucks in toward the neck
    else {
      z *= 1 - 0.12 * t;
      y *= 1 + 0.26 * t * Math.min(1, z * 2.2); // chin reaches lower at the front
    }
  }
  return v.set(x, y, z);
}

function deformed(geo: THREE.BufferGeometry, scale = 1) {
  const p = geo.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const r = v.length();
    deform(v.normalize()).multiplyScalar(r * scale);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

/** Point on the head surface from sphere angles (theta from top, phi around; phi = π/2 is the face). */
function surface(theta: number, phi: number, lift = 1.012) {
  const v = new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
  return deform(v).multiplyScalar(lift);
}

/** Machined panel detail, drawn onto the sphere's UV map (bump + roughness). */
function usePanelTexture() {
  return useMemo(() => {
    const W = 2048, H = 1024;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, W, H);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

    // recessed panel seams
    ctx.strokeStyle = "#3a3a3a";
    ctx.lineWidth = 3;
    for (let i = 0; i < 26; i++) {
      const y = 120 + rand() * (H - 240);
      const x0 = rand() * W, len = 120 + rand() * 480;
      ctx.beginPath();
      ctx.moveTo(x0, y);
      ctx.lineTo(x0 + len, y);
      if (rand() < 0.6) ctx.lineTo(x0 + len + 40, y + (rand() < 0.5 ? -40 : 40));
      ctx.stroke();
    }
    for (let i = 0; i < 18; i++) {
      const x = rand() * W, y0 = 150 + rand() * (H - 400);
      ctx.beginPath();
      ctx.moveTo(x, y0);
      ctx.lineTo(x, y0 + 80 + rand() * 260);
      ctx.stroke();
    }
    // raised plates
    for (let i = 0; i < 40; i++) {
      const w = 40 + rand() * 140, h = 20 + rand() * 80;
      const x = rand() * W, y = 140 + rand() * (H - 300);
      ctx.fillStyle = rand() < 0.5 ? "#8e8e8e" : "#747474";
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
    }
    // rivets and ports
    for (let i = 0; i < 90; i++) {
      const x = rand() * W, y = 120 + rand() * (H - 240), r = 3 + rand() * 7;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = rand() < 0.5 ? "#555" : "#a8a8a8";
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(c);
    tex.anisotropy = 8;
    return tex;
  }, []);
}

/** Readout text for the floating HUD labels and the visor. */
function textTexture(lines: string[], w = 512, h = 128, size = 34) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.font = `500 ${size}px Montserrat, Arial, sans-serif`;
  ctx.fillStyle = "#fff";
  lines.forEach((l, i) => ctx.fillText(l, 6, size + i * (size * 1.35)));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function visorBarsTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  let seed = 3;
  const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  for (let row = 0; row < 9; row++) {
    let x = 20 + rand() * 40;
    const y = 24 + row * 24;
    while (x < 480) {
      const w = 6 + rand() * 40;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.65})`;
      ctx.fillRect(x, y, w, 7);
      x += w + 6 + rand() * 18;
      if (rand() < 0.12) break;
    }
  }
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ */
/* Shared interaction state                                            */
/* ------------------------------------------------------------------ */

const input = {
  x: 0, // pointer relative to the canvas centre, -1..1 (may exceed while outside)
  y: 0,
  active: false,
  pulse: -10, // time of the last scan pulse
};

/* ------------------------------------------------------------------ */
/* The head                                                            */
/* ------------------------------------------------------------------ */

type Seam = { geo: THREE.TubeGeometry; samples: THREE.Vector3[]; mat: THREE.MeshBasicMaterial; base: number };

function makeSeam(points: THREE.Vector3[], radius = 0.011, base = 1.3): Seam {
  const curve = new THREE.CatmullRomCurve3(points);
  return {
    geo: new THREE.TubeGeometry(curve, 160, radius, 8, false),
    samples: curve.getSpacedPoints(40),
    mat: new THREE.MeshBasicMaterial({ color: new THREE.Color(base, base, base), toneMapped: false }),
    base,
  };
}

/** A soft horizontal capsule of light: the android's eye sensor. */
function eyeTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 64;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 32, 0, 128, 32, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.18, "rgba(255,255,255,0.9)");
  g.addColorStop(0.45, "rgba(255,255,255,0.18)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.scale(1, 0.25);
  ctx.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

/** Places children on the head surface, facing outward (+z along the surface direction). */
function Mount({ theta, phi, lift = 1.02, children }: { theta: number; phi: number; lift?: number; children: React.ReactNode }) {
  const { pos, quat } = useMemo(() => {
    const p = surface(theta, phi, lift);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), p.clone().normalize());
    return { pos: p, quat: q };
  }, [theta, phi, lift]);
  return (
    <group position={pos} quaternion={quat}>
      {children}
    </group>
  );
}

/** A cylinder spanning two points (pistons, bars). */
function Span({ a, b, r, material }: { a: [number, number, number]; b: [number, number, number]; r: number; material: THREE.Material }) {
  const { pos, quat, len } = useMemo(() => {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const d = B.clone().sub(A);
    return {
      pos: A.clone().add(B).multiplyScalar(0.5),
      quat: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()),
      len: d.length(),
    };
  }, [a, b]);
  return (
    <mesh position={pos} quaternion={quat} material={material}>
      <cylinderGeometry args={[r, r, len, 20]} />
    </mesh>
  );
}

type Part = "head" | "torso";
type PartSeam = Seam & { part: Part };

// neck pistons (left/right): sleeve from the jaw hinge, rod down into the collar
const PISTONS = [-1, 1].map((sx) => ({
  top: [sx * 0.34, -0.72, -0.12] as [number, number, number],
  bottom: [sx * 0.4, -1.68, -0.3] as [number, number, number],
}));

function Head({ shared }: { shared: HeadShared }) {
  const root = useRef<THREE.Group>(null);
  const neck = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const scanRing = useRef<THREE.Mesh>(null);
  const scanMat = useRef<THREE.MeshBasicMaterial>(null);
  const visorBars = useRef<THREE.MeshBasicMaterial>(null);
  const earCore = useRef<THREE.MeshBasicMaterial>(null);
  const eye = useRef<THREE.Mesh>(null);
  const eyeMat = useRef<THREE.MeshBasicMaterial>(null);
  const ventGlow = useRef<THREE.MeshBasicMaterial>(null);
  const leds = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const rods = useRef<(THREE.Group | null)[]>([]);
  const { camera, size } = useThree();
  const panel = usePanelTexture();

  const skinMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0b0b0c",
        metalness: 0.55,
        roughness: 0.32,
        roughnessMap: panel,
        bumpMap: panel,
        bumpScale: 2.2,
        clearcoat: 1,
        clearcoatRoughness: 0.07,
        envMapIntensity: 1.7,
      }),
    [panel],
  );
  const visorMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#050506",
        metalness: 0.2,
        roughness: 0.03,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 2.6,
        transparent: true,
        opacity: 0.93,
      }),
    [],
  );
  const satinMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#0e0e0f", metalness: 0.7, roughness: 0.45, clearcoat: 0.4, envMapIntensity: 1.2 }),
    [],
  );
  // armour plates: smoother and a touch lighter than the skin, so the layering reads
  const plateMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#16161a", metalness: 0.8, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2.1, side: THREE.DoubleSide }),
    [],
  );
  const chromeMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#c8c8c8", metalness: 1, roughness: 0.12, envMapIntensity: 2.2 }),
    [],
  );
  const rubberMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#070707", metalness: 0, roughness: 0.65, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    [],
  );

  const cranium = useMemo(() => deformed(new THREE.SphereGeometry(1, 160, 120)), []);
  // visor: a slightly larger shell over the upper front of the face
  const visor = useMemo(
    () => deformed(new THREE.SphereGeometry(1, 96, 64, Math.PI / 2 - 0.92, 1.84, 0.62, 0.95), 1.055),
    [],
  );
  // armour plates hugging the skull
  const plates = useMemo(
    () => [
      deformed(new THREE.SphereGeometry(1, 72, 24, Math.PI / 2 - 0.8, 1.6, 0.4, 0.2), 1.045), // brow ridge
      deformed(new THREE.SphereGeometry(1, 48, 32, Math.PI / 2 + 0.38, 0.8, 1.52, 0.58), 1.028), // cheek (camera side)
      deformed(new THREE.SphereGeometry(1, 48, 32, Math.PI / 2 - 1.18, 0.8, 1.52, 0.58), 1.028), // cheek (far side)
      deformed(new THREE.SphereGeometry(1, 64, 24, Math.PI / 2 + 1.25, 1.1, 0.95, 0.5), 1.03), // temple-to-occiput plate
    ],
    [],
  );
  const shoulder = useMemo(() => {
    // chest and shoulders: a broad dome with the shoulders rolling forward
    const g = new THREE.SphereGeometry(1, 128, 64);
    const p = g.attributes.position as THREE.BufferAttribute;
    const v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const side = Math.abs(v.x);
      v.set(v.x * 1.95, v.y * (0.78 - side * 0.12) + side * side * 0.12, v.z * (1.05 - side * 0.2));
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  // shoulder armour cap (pauldron) over the camera-side shoulder
  const pauldron = useMemo(() => {
    const g = new THREE.SphereGeometry(0.62, 64, 32, 0, Math.PI * 2, 0, 1.25);
    g.scale(1.05, 0.62, 1);
    return g;
  }, []);

  // glowing seams (head seams turn with the head; the shoulder seam stays with the torso)
  const seams = useMemo<PartSeam[]>(() => {
    const arc = (n: number, f: (t: number) => THREE.Vector3) => Array.from({ length: n }, (_, i) => f(i / (n - 1)));
    const head = (s: Seam): PartSeam => ({ ...s, part: "head" });
    return [
      // visor rim: across the brow and down both sides
      head(makeSeam([
        ...arc(12, (t) => surface(1.57 - t * 0.95, Math.PI / 2 - 0.9, 1.06)),
        ...arc(24, (t) => surface(0.62, Math.PI / 2 - 0.9 + t * 1.8, 1.06)),
      ], 0.011, 1.6)),
      // crown seam sweeping from the brow over the top and down the back
      head(makeSeam(arc(40, (t) => surface(0.35 + t * 1.5, 0.35 + Math.sin(t * Math.PI) * 0.15, 1.014)), 0.009, 1.2)),
      // cheek line sweeping down along the jaw toward the chin
      head(makeSeam(arc(24, (t) => surface(1.62 + t * 0.62, Math.PI / 2 - 0.95 + t * 0.55, 1.035)), 0.01, 1.4)),
      // shoulder arc
      {
        ...makeSeam(
          arc(30, (t) => new THREE.Vector3(1.05 + Math.cos(Math.PI * (0.1 + t * 0.8)) * 0.62, -2.15 + Math.sin(Math.PI * (0.1 + t * 0.8)) * 0.42, 0.72)),
          0.014,
          1.3,
        ),
        part: "torso",
      },
    ];
  }, []);
  // a raised dark rib under the crown seam, so the glow sits in a machined channel
  const crownRib = useMemo(() => {
    const pts = Array.from({ length: 40 }, (_, i) => {
      const t = i / 39;
      return surface(0.35 + t * 1.5, 0.35 + Math.sin(t * Math.PI) * 0.15, 1.004);
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.03, 10, false);
  }, []);

  const neckCables = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const a = (i / 7) * Math.PI * 2;
        const r = 0.24;
        const pts = [0, 1, 2, 3].map((k) => {
          const tw = a + k * 0.35;
          return new THREE.Vector3(Math.cos(tw) * r, -0.85 - k * 0.36, Math.sin(tw) * r - 0.25 - k * 0.04);
        });
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.045, 10, false);
      }),
    [],
  );

  const barsTex = useMemo(() => visorBarsTexture(), []);
  const eyeTex = useMemo(() => eyeTexture(), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const tmpN = useMemo(() => new THREE.Vector3(), []);
  const yaw = useRef(-0.95);
  const pitch = useRef(0);
  const eyePos = useRef({ x: 0, y: 0 });
  const idle = useRef({ next: 2, dx: 0, dy: 0, blinkAt: 3 });

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    const t = state.clock.elapsedTime;

    // idle life: small glances when the pointer is still, and a blink every few seconds
    const id = idle.current;
    if (t > id.next) {
      id.next = t + 1.8 + Math.random() * 2.5;
      id.dx = (Math.random() - 0.5) * 0.18;
      id.dy = (Math.random() - 0.5) * 0.12;
    }

    // follow the pointer: rest pose looks toward the text on the left
    const targetYaw = -0.95 + THREE.MathUtils.clamp(input.x, -1.6, 1.6) * 0.55 + id.dx;
    const targetPitch = THREE.MathUtils.clamp(-input.y, -1.4, 1.4) * 0.22 + id.dy;
    yaw.current = THREE.MathUtils.damp(yaw.current, targetYaw, 3.2, dt);
    pitch.current = THREE.MathUtils.damp(pitch.current, targetPitch, 3.2, dt);
    g.rotation.set(pitch.current + Math.sin(t * 0.6) * 0.008, yaw.current, Math.sin(t * 0.45) * 0.01);
    g.position.y = Math.sin(t * 0.8) * 0.015;
    g.updateMatrixWorld();
    // the neck follows halfway, the torso barely: a real turn of the head
    if (neck.current) {
      neck.current.rotation.y = (yaw.current + 0.95) * 0.5 - 0.95;
      neck.current.updateMatrixWorld();
    }
    if (torso.current) {
      torso.current.rotation.y = (yaw.current + 0.95) * 0.16 - 0.95;
      torso.current.position.y = Math.sin(t * 0.8 - 0.4) * 0.01; // breathing
      torso.current.updateMatrixWorld();
    }
    // pistons extend as the head nods
    rods.current.forEach((r) => {
      if (r) r.position.y = pitch.current * 0.35;
    });

    // eye: darts ahead of the head toward the pointer, then settles as the head catches up
    const ex = THREE.MathUtils.clamp((targetYaw - yaw.current) * 0.45, -0.2, 0.2);
    const ey = THREE.MathUtils.clamp((targetPitch - pitch.current) * 0.6, -0.08, 0.08);
    eyePos.current.x = THREE.MathUtils.damp(eyePos.current.x, ex, 14, dt);
    eyePos.current.y = THREE.MathUtils.damp(eyePos.current.y, ey, 14, dt);
    if (t > id.blinkAt + 0.16) id.blinkAt = t + 2.8 + Math.random() * 3.5;
    const blink = t > id.blinkAt ? Math.abs(Math.sin(((t - id.blinkAt) / 0.16) * Math.PI)) : 0;
    if (eye.current) {
      eye.current.position.set(eyePos.current.x, 0.24 + eyePos.current.y, 0.905);
      eye.current.scale.set(1, Math.max(0.05, 1 - blink), 1);
    }

    // scan pulse: a ring of light sweeping down the head
    const since = t - input.pulse;
    const p = THREE.MathUtils.clamp(since / 1.3, 0, 1);
    const pulsing = since >= 0 && since < 1.3;
    if (scanRing.current && scanMat.current) {
      const y = 1.25 - p * 2.6;
      const r = Math.sqrt(Math.max(0.02, 1 - (y / 1.1) ** 2)) * 1.02;
      scanRing.current.position.y = y;
      scanRing.current.scale.set(r * 0.86, r * 1.07, 1);
      scanMat.current.opacity = pulsing ? Math.sin(p * Math.PI) * 0.9 : 0;
    }
    const flash = pulsing ? 1 - p : 0;
    if (eyeMat.current) eyeMat.current.color.setScalar(2.2 + flash * 2 + (input.active ? 0.4 : 0));

    // seams brighten near the pointer (screen space), and flash with the pulse
    const aspect = size.width / size.height;
    seams.forEach((s) => {
      const m = s.part === "head" ? g.matrixWorld : torso.current!.matrixWorld;
      let best = 9;
      for (const pt of s.samples) {
        tmp.copy(pt).applyMatrix4(m).project(camera);
        const d = Math.hypot((tmp.x - input.x) * aspect, tmp.y - input.y);
        if (d < best) best = d;
      }
      const near = input.active ? 1 - THREE.MathUtils.smoothstep(best, 0.05, 0.45) : 0;
      const k = s.base * (0.85 + 0.15 * Math.sin(t * 1.3 + s.base * 7)) + near * 2.6 + flash * 2.2;
      s.mat.color.setScalar(k);
    });
    if (visorBars.current) visorBars.current.opacity = (0.55 + 0.25 * Math.sin(t * 2.1)) * (pulsing && Math.sin(t * 60) > 0 ? 0.3 : 1);
    if (earCore.current) earCore.current.color.setScalar(1.8 + Math.sin(t * 2.4) * 0.5 + flash * 2);
    if (ventGlow.current) ventGlow.current.opacity = 0.35 + 0.3 * (0.5 + 0.5 * Math.sin(t * 1.6)) + flash * 0.4; // breathing
    // status LEDs: a slow chase around the collar and ear
    leds.current.forEach((m, i) => {
      if (m) m.color.setScalar(0.25 + 2.2 * Math.max(0, Math.sin(t * 3 - i * 0.9)) ** 6);
    });

    // callouts: pin each HTML label's leader line to its anchor
    const overlay = shared.overlay;
    if (overlay) {
      const ow = overlay.clientWidth, oh = overlay.clientHeight;
      for (const c of shared.callouts) {
        if (!c.el || !c.line || !c.dot) continue;
        const m = c.part === "torso" && torso.current ? torso.current.matrixWorld : g.matrixWorld;
        tmp.set(...c.anchor).applyMatrix4(m);
        // fade labels whose anchor has turned away from the camera
        tmpN.set(...c.anchor).normalize().transformDirection(m);
        const facing = tmpN.dot(tmp.clone().sub(camera.position).normalize().negate());
        const vis = c.part === "torso" ? 1 : THREE.MathUtils.smoothstep(facing, -0.1, 0.35);
        tmp.project(camera);
        const ax = (tmp.x * 0.5 + 0.5) * ow, ay = (-tmp.y * 0.5 + 0.5) * oh;
        const lr = c.el.getBoundingClientRect(), or = overlay.getBoundingClientRect();
        const lx = lr.left - or.left + (ax < lr.left - or.left + lr.width / 2 ? 0 : lr.width);
        const ly = lr.top - or.top + lr.height;
        c.line.setAttribute("x1", String(lx));
        c.line.setAttribute("y1", String(ly));
        c.line.setAttribute("x2", String(ax));
        c.line.setAttribute("y2", String(ay));
        c.dot.setAttribute("cx", String(ax));
        c.dot.setAttribute("cy", String(ay));
        const o = String(vis);
        c.el.style.opacity = o;
        c.line.style.opacity = o;
        c.dot.style.opacity = o;
      }
    }
  });

  const onHeadClick = (e: { stopPropagation: () => void }) => {
    e.stopPropagation();
    input.pulse = clockNow();
  };

  let led = 0;
  const ledRef = (m: THREE.MeshBasicMaterial | null) => {
    leds.current[led++] = m;
  };

  return (
    <group onClick={onHeadClick} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
      {/* ---------------- torso ---------------- */}
      <group ref={torso} rotation={[0, -0.95, 0]}>
        <mesh geometry={shoulder} material={skinMat} position={[0, -2.45, -0.3]} />
        <mesh geometry={pauldron} material={plateMat} position={[1.12, -2.02, -0.22]} rotation={[0, 0, -0.35]} />
        {/* bolts along the pauldron edge */}
        {Array.from({ length: 6 }, (_, i) => {
          const a = -0.4 + i * 0.36;
          return (
            <mesh key={i} position={[1.12 + Math.cos(a) * 0.55, -2.2 + Math.sin(a) * 0.05, -0.22 + Math.sin(a) * 0.5]} rotation={[0, -a, Math.PI / 2]} material={chromeMat}>
              <cylinderGeometry args={[0.03, 0.03, 0.03, 12]} />
            </mesh>
          );
        })}
        {/* clavicle bar and a chest vent */}
        <Span a={[0.3, -1.95, 0.05]} b={[1.0, -1.98, 0.32]} r={0.05} material={plateMat} />
        <group position={[-0.45, -2.12, 0.58]} rotation={[-0.45, -0.15, 0]}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[0, -i * 0.07, 0]} material={satinMat}>
              <boxGeometry args={[0.5 - i * 0.05, 0.028, 0.05]} />
            </mesh>
          ))}
        </group>
        {seams
          .filter((s) => s.part === "torso")
          .map((s, i) => (
            <mesh key={i} geometry={s.geo} material={s.mat} />
          ))}
      </group>

      {/* ---------------- neck ---------------- */}
      <group ref={neck} rotation={[0, -0.95, 0]}>
        <mesh position={[0, -1.3, -0.32]} rotation={[0.16, 0, 0]} material={satinMat}>
          <cylinderGeometry args={[0.27, 0.36, 1.0, 48]} />
        </mesh>
        {neckCables.map((geo, i) => (
          <mesh key={i} geometry={geo} material={rubberMat} />
        ))}
        {/* vertebra discs down the back of the neck */}
        {Array.from({ length: 6 }, (_, i) => (
          <mesh key={i} position={[0, -0.92 - i * 0.15, -0.58 - i * 0.03]} rotation={[0.2, 0, 0]} material={plateMat}>
            <cylinderGeometry args={[0.16, 0.16, 0.07, 32]} />
          </mesh>
        ))}
        {/* hydraulic pistons: dark sleeve + chrome rod that slides with the nod */}
        {PISTONS.map((pp, i) => {
          const mid: [number, number, number] = [
            (pp.top[0] + pp.bottom[0]) / 2,
            (pp.top[1] + pp.bottom[1]) / 2,
            (pp.top[2] + pp.bottom[2]) / 2,
          ];
          return (
            <group key={i}>
              <Span a={pp.top} b={mid} r={0.05} material={satinMat} />
              <group
                ref={(r) => {
                  rods.current[i] = r;
                }}
              >
                <Span a={mid} b={pp.bottom} r={0.024} material={chromeMat} />
              </group>
            </group>
          );
        })}
        <mesh position={[0, -1.78, -0.38]} rotation={[Math.PI / 2 + 0.16, 0, 0]} material={satinMat}>
          <torusGeometry args={[0.44, 0.06, 20, 64]} />
        </mesh>
        {/* collar status LEDs */}
        {Array.from({ length: 8 }, (_, i) => {
          const a = Math.PI * (0.05 + i * 0.12);
          return (
            <mesh key={i} position={[Math.cos(a) * 0.46, -1.74, -0.38 + Math.sin(a) * 0.46]}>
              <sphereGeometry args={[0.014, 10, 10]} />
              <meshBasicMaterial ref={ledRef} color={[1, 1, 1]} toneMapped={false} />
            </mesh>
          );
        })}
      </group>

      {/* ---------------- head ---------------- */}
      <group ref={root}>
        <mesh geometry={cranium} material={skinMat} />
        {plates.map((geo, i) => (
          <mesh key={i} geometry={geo} material={plateMat} />
        ))}
        <mesh geometry={crownRib} material={plateMat} />
        <mesh geometry={visor} material={visorMat} />

        {/* readout bars and the eye sensor, glowing behind the visor glass */}
        <mesh position={[0, 0.3, 0.9]}>
          <planeGeometry args={[0.78, 0.3]} />
          <meshBasicMaterial ref={visorBars} map={barsTex} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>
        <mesh ref={eye} position={[0, 0.24, 0.905]}>
          <planeGeometry args={[0.46, 0.12]} />
          <meshBasicMaterial ref={eyeMat} map={eyeTex} color={[2.2, 2.2, 2.2]} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
        </mesh>

        {/* jaw vent grille with a breathing glow behind it */}
        <Mount theta={2.18} phi={Math.PI / 2} lift={1.005}>
          <mesh position={[0, 0, -0.012]}>
            <planeGeometry args={[0.3, 0.26]} />
            <meshBasicMaterial ref={ventGlow} color={[1.6, 1.6, 1.6]} transparent opacity={0.5} toneMapped={false} depthWrite={false} />
          </mesh>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[0, 0.1 - i * 0.052, 0.012]} material={plateMat}>
              <boxGeometry args={[0.34 - Math.abs(i - 2) * 0.03, 0.026, 0.04]} />
            </mesh>
          ))}
        </Mount>

        {/* temple sensor cluster */}
        <Mount theta={1.02} phi={Math.PI / 2 + 1.02} lift={1.03}>
          {[0, 1, 2].map((i) => (
            <group key={i} position={[(i - 1) * 0.1, (i - 1) * -0.025, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={chromeMat}>
                <cylinderGeometry args={[0.04, 0.045, 0.04, 24]} />
              </mesh>
              <mesh position={[0, 0, 0.022]}>
                <circleGeometry args={[0.022, 20]} />
                <meshBasicMaterial ref={ledRef} color={[1, 1, 1]} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </Mount>

        {/* side vent slots behind the ear */}
        <Mount theta={1.3} phi={Math.PI + 0.55} lift={1.01}>
          {[0, 1, 2, 3].map((i) => (
            <mesh key={i} position={[i * 0.06 - 0.09, 0, 0]} rotation={[0, 0, 0.25]} material={satinMat}>
              <boxGeometry args={[0.022, 0.2, 0.03]} />
            </mesh>
          ))}
        </Mount>

        {/* ear module: stacked rings around a glowing lens, an antenna fin, status lights */}
        <group position={[0.78, 0.0, -0.1]} rotation={[0, Math.PI / 2, 0]}>
          <mesh material={satinMat}>
            <cylinderGeometry args={[0.3, 0.33, 0.1, 64]} />
          </mesh>
          <mesh position={[0, 0, 0.06]} rotation={[Math.PI / 2, 0, 0]} material={skinMat}>
            <torusGeometry args={[0.24, 0.03, 20, 80]} />
          </mesh>
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]} material={visorMat}>
            <cylinderGeometry args={[0.17, 0.17, 0.03, 64]} />
          </mesh>
          <mesh position={[0, 0, 0.1]}>
            <circleGeometry args={[0.045, 32]} />
            <meshBasicMaterial ref={earCore} color={[2, 2, 2]} toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.095]}>
            <ringGeometry args={[0.1, 0.112, 64]} />
            <meshBasicMaterial color={[1.4, 1.4, 1.4]} toneMapped={false} />
          </mesh>
          <mesh position={[0.05, 0.36, -0.12]} rotation={[0, 0, -0.5]} material={plateMat}>
            <boxGeometry args={[0.035, 0.36, 0.1]} />
          </mesh>
          {[0, 1, 2].map((i) => {
            const a = -0.9 + i * 0.3;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.07]}>
                <circleGeometry args={[0.013, 12]} />
                <meshBasicMaterial ref={ledRef} color={[1, 1, 1]} toneMapped={false} />
              </mesh>
            );
          })}
        </group>

        {seams
          .filter((s) => s.part === "head")
          .map((s, i) => (
            <mesh key={i} geometry={s.geo} material={s.mat} />
          ))}

        {/* scan pulse ring */}
        <mesh ref={scanRing} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1, 0.008, 8, 160]} />
          <meshBasicMaterial ref={scanMat} color={[3, 3, 3]} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      </group>
    </group>
  );
}

// Pulse times are kept on the R3F clock (the same clock useFrame reads).
let clockRef: THREE.Clock | null = null;
const clockNow = () => clockRef?.getElapsedTime() ?? 0;
function ClockBridge() {
  const clock = useThree((s) => s.clock);
  useEffect(() => {
    clockRef = clock;
  }, [clock]);
  return null;
}

/* ------------------------------------------------------------------ */
/* HUD: dashed rings and readouts around the head (world-fixed)        */
/* ------------------------------------------------------------------ */

const READOUTS = [
  { lines: ["AGENT", "ACTIVE"], pos: [1.75, 1.05, 0.2] as const },
  { lines: ["AUDIT LOG", "RECORDING"], pos: [-1.55, 0.55, 0.3] as const },
  { lines: ["HUMAN OVERRIDE", "READY"], pos: [1.6, -0.75, 0.5] as const },
];

function Hud() {
  const group = useRef<THREE.Group>(null);
  const rings = useRef<(Line2 | LineSegments2 | null)[]>([]);
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const texs = useMemo(() => READOUTS.map((r) => textTexture(r.lines, 512, 128, 30)), []);
  const ringPts = useMemo(
    () =>
      [2.05, 2.35].map((r) =>
        new THREE.EllipseCurve(0, 0, r, r, 0, Math.PI * 1.55, false, 0).getPoints(160).map((v) => new THREE.Vector3(v.x, v.y, 0)),
      ),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (group.current) group.current.rotation.z = t * 0.04;
    rings.current.forEach((l, i) => {
      if (l) l.rotation.z = (i ? -1 : 1) * t * 0.08;
    });
    const since = t - input.pulse;
    const glitch = since >= 0 && since < 1.3;
    mats.current.forEach((m, i) => {
      if (m) m.opacity = (0.75 + 0.2 * Math.sin(t * 1.7 + i * 2)) * (glitch && Math.sin(t * 45 + i) > 0.2 ? 0.25 : 1);
    });
  });

  return (
    <>
      <group ref={group} position={[0, 0.05, -0.6]}>
        {ringPts.map((pts, i) => (
          <Line
            key={i}
            ref={(l) => {
              rings.current[i] = l;
            }}
            points={pts}
            color="#ffffff"
            lineWidth={i ? 1 : 1.6}
            dashed
            dashSize={i ? 0.05 : 0.18}
            gapSize={i ? 0.1 : 0.08}
            transparent
            opacity={i ? 0.28 : 0.45}
          />
        ))}
      </group>
      {READOUTS.map((r, i) => (
        <mesh key={i} position={r.pos as unknown as [number, number, number]} scale={[0.82, 0.205, 1]}>
          <planeGeometry />
          <meshBasicMaterial
            ref={(m) => {
              mats.current[i] = m;
            }}
            map={texs[i]}
            transparent
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

function PointerTracker({ container }: { container: React.RefObject<HTMLDivElement | null> }) {
  useEffect(() => {
    const move = (e: PointerEvent) => {
      const el = container.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      input.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      input.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      input.active = true;
    };
    const leave = () => (input.active = false);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, [container]);
  return null;
}

/** First scan pulse shortly after the head appears, so visitors see it can react. */
function IntroPulse() {
  const done = useRef(false);
  useFrame((state) => {
    if (!done.current && state.clock.elapsedTime > 1.2) {
      done.current = true;
      input.pulse = state.clock.elapsedTime;
    }
  });
  return null;
}

export default function AndroidHead({
  shared,
  container,
}: {
  shared: HeadShared;
  container: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop="always"
      camera={{ fov: 30, position: [0, -1.4, 11.2], near: 0.1, far: 50 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      onPointerMissed={() => (document.body.style.cursor = "")}
    >
      <color attach="background" args={["#030303"]} />
      <ambientLight intensity={0.04} />
      <directionalLight position={[-4, 5, 5]} intensity={1.6} />
      <spotLight position={[5, 2, -3]} intensity={60} angle={0.6} penumbra={1} />

      {/* studio reflections: key softbox, strong rim strips — that's what reads on black gloss */}
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} position={[-5, 4, 4]} scale={[6, 3, 1]} />
        <Lightformer form="rect" intensity={5} position={[6, 1, -3]} rotation={[0, -Math.PI / 2.4, 0]} scale={[1.2, 10, 1]} />
        <Lightformer form="rect" intensity={2.4} position={[-6, 0, -4]} rotation={[0, Math.PI / 2.4, 0]} scale={[0.8, 8, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[0, -5, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 2, 1]} />
        {/* low rim strip so the shoulders catch a highlight */}
        <Lightformer form="rect" intensity={3} position={[5, -3, -2]} rotation={[0, -Math.PI / 2.6, 0]} scale={[1, 5, 1]} />
      </Environment>

      <ClockBridge />
      <PointerTracker container={container} />
      <IntroPulse />
      <Head shared={shared} />
      <Hud />

      <Prepare />
      <VisibilityLoop target={container} rootMargin="100px" />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.9} luminanceSmoothing={0.15} />
        <Noise premultiply opacity={0.25} />
        <Vignette offset={0.25} darkness={0.85} />
      </EffectComposer>
    </Canvas>
  );
}
