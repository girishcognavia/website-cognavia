"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import Prepare from "./Prepare";
import VisibilityLoop from "./VisibilityLoop";

/**
 * Section 2 ("Pioneering the Future of AI"): a glass cube with a glowing AI chip inside,
 * standing on a stepped platform, ringed by orbits of light and four floating glass cards
 * (AI Agents, Cloud & Infrastructure, Custom Solutions, Data & Analytics), over a dark
 * polished floor. Cool silver-white light on charcoal, matching the rest of the site. Lands once when the section
 * comes into view, then floats gently; renders only while on screen.
 */

const clock = { t: 0, running: false };
const ease = (x: number) => 1 - Math.pow(1 - Math.min(Math.max(x, 0), 1), 3);
const smooth = (x: number) => {
  x = Math.min(Math.max(x, 0), 1);
  return x * x * (3 - 2 * x);
};

// the site palette: cool silver-white light on dark charcoal (as in Products and Leadership)
const BLUE = new THREE.Color("#dfe6f2");
const FLOOR_Y = -1.53; // platform top (FLOOR_Y + 0.48) meets the cube's base
const CUBE = 2.05;
const CUBE_POS = new THREE.Vector3(0.8, -0.02, 0);
const CUBE_ROT = Math.PI / 4;

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

function tex(c: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function radialTex() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  return tex(c);
}

/** A vertical light shaft: soft sides, strongest at the top, fading down. */
function beamTex() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(64, 256);
  for (let y = 0; y < 256; y++)
    for (let x = 0; x < 64; x++) {
      const dx = (x - 32) / 32;
      const i = (y * 64 + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(Math.exp(-dx * dx * 5) * Math.pow(1 - y / 256, 1.6) * 255);
    }
  ctx.putImageData(img, 0, 0);
  return tex(c);
}

type Icon = "brain" | "cloud" | "code" | "chart";

function drawIcon(ctx: CanvasRenderingContext2D, icon: Icon, x: number, y: number, s: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 100, s / 100);
  ctx.strokeStyle = "#eaf1ff";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  if (icon === "cloud") {
    ctx.moveTo(18, 74);
    ctx.lineTo(80, 74);
    ctx.arc(78, 56, 18, Math.PI / 2, -Math.PI / 2.4, true);
    ctx.arc(52, 40, 26, -0.15, Math.PI * 1.05, true);
    ctx.arc(24, 56, 18, -Math.PI / 2.2, Math.PI / 2, true);
  } else if (icon === "code") {
    ctx.moveTo(30, 28);
    ctx.lineTo(8, 50);
    ctx.lineTo(30, 72);
    ctx.moveTo(70, 28);
    ctx.lineTo(92, 50);
    ctx.lineTo(70, 72);
    ctx.moveTo(58, 18);
    ctx.lineTo(42, 82);
  } else if (icon === "chart") {
    for (const [bx, h] of [[14, 30], [40, 50], [66, 74]] as const) ctx.roundRect(bx, 86 - h, 18, h, 4);
  } else {
    // brain: two lobes with folds
    for (const side of [-1, 1]) {
      ctx.moveTo(50, 14);
      ctx.bezierCurveTo(50 + side * 22, 6, 50 + side * 46, 18, 50 + side * 42, 42);
      ctx.bezierCurveTo(50 + side * 52, 60, 50 + side * 40, 84, 50 + side * 20, 86);
      ctx.bezierCurveTo(50 + side * 10, 92, 50, 88, 50, 80);
      ctx.moveTo(50 + side * 16, 26);
      ctx.bezierCurveTo(50 + side * 30, 34, 50 + side * 18, 46, 50 + side * 32, 54);
      ctx.moveTo(50 + side * 12, 62);
      ctx.bezierCurveTo(50 + side * 26, 64, 50 + side * 24, 76, 50 + side * 14, 78);
    }
    ctx.moveTo(50, 14);
    ctx.lineTo(50, 80);
  }
  ctx.stroke();
  ctx.restore();
}

/** A frosted glass card: the panel, its lit border, icon, title, two lines and an arrow. */
function cardTex(icon: Icon, title: string, lines: string[]) {
  const W = 760,
    H = 690;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const draw = () => {
    ctx.clearRect(0, 0, W, H);
    const r = 34;
    // glass body: cool, brighter toward the top right where the light catches it
    const body = ctx.createLinearGradient(0, H, W, 0);
    body.addColorStop(0, "rgba(58,66,82,0.34)");
    body.addColorStop(0.55, "rgba(74,84,102,0.4)");
    body.addColorStop(1, "rgba(150,162,186,0.5)");
    ctx.beginPath();
    ctx.roundRect(6, 6, W - 12, H - 12, r);
    ctx.fillStyle = body;
    ctx.fill();
    const sheen = ctx.createRadialGradient(W * 0.92, H * 0.06, 0, W * 0.92, H * 0.06, W * 0.7);
    sheen.addColorStop(0, "rgba(232,238,248,0.3)");
    sheen.addColorStop(1, "rgba(232,238,248,0)");
    ctx.fillStyle = sheen;
    ctx.fill();
    // border: bright on the top and right edges, softer elsewhere
    const edge = ctx.createLinearGradient(0, H, W, 0);
    edge.addColorStop(0, "rgba(196,206,224,0.35)");
    edge.addColorStop(0.6, "rgba(214,224,242,0.6)");
    edge.addColorStop(1, "rgba(244,247,252,1)");
    ctx.lineWidth = 5;
    ctx.strokeStyle = edge;
    ctx.stroke();

    drawIcon(ctx, icon, 70, 66, 110);
    ctx.fillStyle = "#f4f7ff";
    ctx.font = "500 58px Montserrat, Arial, sans-serif";
    ctx.fillText(title, 72, 290);
    ctx.fillStyle = "rgba(220,228,245,0.82)";
    ctx.font = "400 40px Montserrat, Arial, sans-serif";
    lines.forEach((l, i) => ctx.fillText(l, 74, 372 + i * 56));
    // arrow
    ctx.strokeStyle = "rgba(232,240,255,0.9)";
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(74, 590);
    ctx.lineTo(118, 590);
    ctx.moveTo(104, 576);
    ctx.lineTo(118, 590);
    ctx.lineTo(104, 604);
    ctx.stroke();
  };
  draw();
  const t = tex(c);
  // redraw once the site font has loaded, so the card text is set in Montserrat
  document.fonts?.ready.then(() => {
    draw();
    t.needsUpdate = true;
  });
  return t;
}

/** The chip inside the cube: a circuit-etched face; the front face carries "AI". */
function chipTex(withLabel: boolean) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  const draw = () => {
    ctx.clearRect(0, 0, S, S);
    const bg = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S * 0.7);
    bg.addColorStop(0, "rgba(118,128,148,0.95)");
    bg.addColorStop(1, "rgba(30,35,46,0.95)");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, S, S);
    // pins around the edge
    ctx.fillStyle = "rgba(214,222,236,0.85)";
    for (let i = 0; i < 18; i++) {
      const p = 52 + i * 23.5;
      ctx.fillRect(p, 14, 7, 26);
      ctx.fillRect(p, S - 40, 7, 26);
      ctx.fillRect(14, p, 26, 7);
      ctx.fillRect(S - 40, p, 26, 7);
    }
    // inner die with traces
    ctx.strokeStyle = "rgba(226,232,244,0.9)";
    ctx.lineWidth = 6;
    ctx.strokeRect(70, 70, S - 140, S - 140);
    ctx.strokeStyle = "rgba(190,200,220,0.35)";
    ctx.lineWidth = 2;
    for (let i = 0; i < 14; i++) {
      const p = 96 + i * 23;
      ctx.beginPath();
      ctx.moveTo(p, 90);
      ctx.lineTo(p, 140 + (i % 3) * 20);
      ctx.moveTo(p, S - 90);
      ctx.lineTo(p, S - 140 - (i % 4) * 16);
      ctx.stroke();
    }
    if (withLabel) {
      ctx.fillStyle = "#ffffff";
      ctx.shadowColor = "rgba(236,240,248,1)";
      ctx.shadowBlur = 30;
      ctx.font = "700 190px Montserrat, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("AI", S / 2, S / 2 + 10);
      ctx.shadowBlur = 0;
    }
  };
  draw();
  const t = tex(c);
  document.fonts?.ready.then(() => {
    draw();
    t.needsUpdate = true;
  });
  return t;
}

/* ------------------------------------------------------------------ */
/* Cube                                                                */
/* ------------------------------------------------------------------ */

/** Thin glowing bars along the 12 edges of a cube of side s. */
function EdgeFrame({ s, color, intensity }: { s: number; color: THREE.Color; intensity: number }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: color.clone().multiplyScalar(intensity), toneMapped: false }), [color, intensity]);
  const h = s / 2;
  const w = 0.018;
  const bars: [number, number, number, number, number, number][] = [];
  for (const a of [-h, h])
    for (const b of [-h, h]) {
      bars.push([0, a, b, s, w, w]);
      bars.push([a, 0, b, w, s, w]);
      bars.push([a, b, 0, w, w, s]);
    }
  return (
    <>
      {bars.map(([x, y, z, sx, sy, sz], i) => (
        <mesh key={i} position={[x, y, z]} material={mat}>
          <boxGeometry args={[sx, sy, sz]} />
        </mesh>
      ))}
    </>
  );
}

function Cube({ glow }: { glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const core = useRef<THREE.SpriteMaterial>(null);
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c4ccd8",
        metalness: 0,
        roughness: 0.08,
        transparent: true,
        opacity: 0.22,
        clearcoat: 1,
        envMapIntensity: 1.8,
        emissive: new THREE.Color("#5c6678"),
        emissiveIntensity: 0.45,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const chip = useMemo(() => {
    const face = new THREE.MeshBasicMaterial({ map: chipTex(false), toneMapped: false, transparent: true, opacity: 0.95 });
    const front = new THREE.MeshBasicMaterial({ map: chipTex(true), toneMapped: false, color: new THREE.Color(1.6, 1.65, 1.75) });
    // box faces: +x, -x, +y, -y, +z, -z — "AI" on -x, which the 45° turn points to the viewer's front-left
    return [face, front, face, face, face, face];
  }, []);

  useFrame(() => {
    const e = ease((clock.t - 0.1) / 1.6);
    if (group.current) {
      group.current.visible = e > 0.001;
      // settles onto the platform and then stays still, so the light on the base never shifts
      group.current.position.y = CUBE_POS.y - (1 - e) * 0.5;
      group.current.scale.setScalar(0.94 + 0.06 * e);
    }
    if (core.current) core.current.opacity = 0.8 * e; // steady: no pulsing glow on the platform
  });

  return (
    <group ref={group} position={CUBE_POS} rotation={[0, CUBE_ROT, 0]} visible={false}>
      {/* outer glass shell and its glowing frame */}
      <mesh material={glass}>
        <boxGeometry args={[CUBE, CUBE, CUBE]} />
      </mesh>
      <EdgeFrame s={CUBE} color={BLUE} intensity={2.4} />
      {/* the chip, and the glass shell just around it */}
      <mesh material={chip}>
        <boxGeometry args={[CUBE * 0.5, CUBE * 0.5, CUBE * 0.5]} />
      </mesh>
      <mesh material={glass}>
        <boxGeometry args={[CUBE * 0.66, CUBE * 0.66, CUBE * 0.66]} />
      </mesh>
      <EdgeFrame s={CUBE * 0.66} color={BLUE} intensity={1.6} />
      {/* light inside the cube */}
      <sprite scale={CUBE * 2.2}>
        <spriteMaterial ref={core} map={glow} color="#aab4c6" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Platform                                                            */
/* ------------------------------------------------------------------ */

const STEPS: [number, number, number][] = [
  // [size, height, top y]
  [3.55, 0.22, FLOOR_Y + 0.22],
  [3.0, 0.15, FLOOR_Y + 0.37],
  [2.45, 0.11, FLOOR_Y + 0.48],
];

function Platform() {
  const group = useRef<THREE.Group>(null);
  // shaded by hand (unlit): it doesn't wait on the scene's lighting or environment map, so it
  // appears in the same frame as everything else. Faces: +x, -x, +y (top), -y, +z, -z.
  const dark = useMemo(() => {
    const m = (c: string) => new THREE.MeshBasicMaterial({ color: c });
    const top = m("#1a1d24");
    const left = m("#0f1115"); // front-left face, toward the light
    const right = m("#0a0b0e"); // front-right face
    const hidden = m("#06070a");
    return [hidden, left, top, hidden, right, hidden];
  }, []);
  // light strips along each step's two front edges: a soft silver-white
  const strips = useMemo(() => STEPS.map(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(0, 0, 0), toneMapped: false })), []);
  useFrame(() => {
    const e = ease(clock.t / 1.4);
    if (group.current) group.current.visible = e > 0.001;
    strips.forEach((m, i) => {
      const warm = i < 2;
      m.color.setRGB(warm ? 0.62 : 0.85, warm ? 0.62 : 0.88, warm ? 0.64 : 0.95).multiplyScalar(e);
    });
  });
  return (
    <group ref={group} position={[CUBE_POS.x, 0, CUBE_POS.z]} rotation={[0, CUBE_ROT, 0]} visible={false}>
      {STEPS.map(([s, h, top], i) => (
        <group key={i}>
          <mesh material={dark} position={[0, top - h / 2, 0]}>
            <boxGeometry args={[s, h, s]} />
          </mesh>
          <mesh position={[0, top, s / 2]} material={strips[i]}>
            <boxGeometry args={[s, 0.016, 0.016]} />
          </mesh>
          <mesh position={[-s / 2, top, 0]} material={strips[i]}>
            <boxGeometry args={[0.016, 0.016, s]} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

type Card = { icon: Icon; title: string; lines: string[]; pos: [number, number, number]; rot: [number, number, number]; w: number; delay: number };

export const CARDS: Card[] = [
  { icon: "brain", title: "AI Agents", lines: ["Autonomous systems", "that get work done."], pos: [-1.5, 2.15, 0.7], rot: [-0.12, 0.22, 0.03], w: 1.72, delay: 0.5 },
  { icon: "cloud", title: "Cloud & Infrastructure", lines: ["Scalable. Secure.", "Always on."], pos: [2.95, 2.1, -0.6], rot: [-0.12, -0.12, -0.03], w: 1.66, delay: 0.62 },
  { icon: "code", title: "Custom Solutions", lines: ["Tailored AI systems", "for your business."], pos: [-2.25, 0.1, 1.25], rot: [-0.14, 0.34, 0.12], w: 1.7, delay: 0.74 },
  { icon: "chart", title: "Data & Analytics", lines: ["Turn data into", "decisions."], pos: [3.75, 0.25, 0.7], rot: [-0.14, -0.42, -0.1], w: 1.56, delay: 0.86 },
];

function CardMesh({ card, i }: { card: Card; i: number }) {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: cardTex(card.icon, card.title, card.lines),
        transparent: true,
        opacity: 0,
        depthWrite: false,
        side: THREE.DoubleSide,
        toneMapped: false,
      }),
    [card],
  );
  const h = card.w * (690 / 760);
  useFrame((state) => {
    const e = ease((clock.t - card.delay) / 1.2);
    const t = state.clock.elapsedTime;
    if (group.current) {
      group.current.visible = e > 0.001;
      group.current.position.set(card.pos[0], card.pos[1] - (1 - e) * 0.4 + Math.sin(t * 0.6 + i * 1.7) * 0.06 * e, card.pos[2]);
      group.current.rotation.set(card.rot[0], card.rot[1] + Math.sin(t * 0.4 + i) * 0.02, card.rot[2]);
    }
    mat.opacity = e;
  });
  return (
    <group ref={group} visible={false}>
      <mesh material={mat} renderOrder={4}>
        <planeGeometry args={[card.w, h]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Orbits                                                              */
/* ------------------------------------------------------------------ */

type Ring = { r: number; y: number; tiltX: number; tiltZ: number; bright: number; dots: number[]; speed: number; delay: number };

const RINGS: Ring[] = [
  { r: 2.25, y: 0.15, tiltX: 0.06, tiltZ: -0.05, bright: 1.3, dots: [0.2, 2.6, 4.4], speed: 0.09, delay: 0.3 },
  { r: 3.35, y: -0.95, tiltX: 0.0, tiltZ: 0.04, bright: 1.1, dots: [1.2, 3.4, 5.6], speed: -0.06, delay: 0.42 },
  { r: 4.25, y: 0.75, tiltX: -0.1, tiltZ: -0.16, bright: 0.65, dots: [0.7, 3.9], speed: 0.04, delay: 0.55 },
];

function RingMesh({ ring, glow }: { ring: Ring; glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const mat = useMemo(
    () => new THREE.LineBasicMaterial({ color: BLUE.clone().multiplyScalar(ring.bright), transparent: true, opacity: 0, toneMapped: false, depthWrite: false }),
    [ring],
  );
  const line = useMemo(() => {
    const geo = new THREE.BufferGeometry().setFromPoints(
      new THREE.EllipseCurve(0, 0, ring.r, ring.r, 0, Math.PI * 2, false, 0).getPoints(256).map((v) => new THREE.Vector3(v.x, 0, v.y)),
    );
    return new THREE.LineLoop(geo, mat);
  }, [ring, mat]);
  const dots = useRef<(THREE.Group | null)[]>([]);
  useFrame((state) => {
    const e = smooth((clock.t - ring.delay) / 1.6);
    if (group.current) {
      group.current.visible = e > 0.001;
      group.current.scale.setScalar(0.85 + 0.15 * e);
    }
    mat.opacity = 0.75 * e;
    const t = state.clock.elapsedTime;
    dots.current.forEach((d, i) => {
      if (!d) return;
      const a = ring.dots[i] + t * ring.speed;
      d.position.set(Math.cos(a) * ring.r, 0, Math.sin(a) * ring.r);
      d.scale.setScalar(Math.max(0.001, e));
    });
  });
  return (
    <group ref={group} position={[CUBE_POS.x, ring.y, CUBE_POS.z]} rotation={[ring.tiltX, 0, ring.tiltZ]} visible={false}>
      <primitive object={line} />
      {ring.dots.map((_, i) => (
        <group
          key={i}
          ref={(g) => {
            dots.current[i] = g;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.035, 12, 12]} />
            <meshBasicMaterial color={[3, 3.3, 4]} toneMapped={false} />
          </mesh>
          <sprite scale={0.22}>
            <spriteMaterial map={glow} color="#e4eaf4" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
          </sprite>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floor, light shafts                                                 */
/* ------------------------------------------------------------------ */

function Floor({ glow, beam }: { glow: THREE.Texture; beam: THREE.Texture }) {
  const base = useRef<THREE.MeshBasicMaterial>(null);
  const refl = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const e = ease(clock.t / 1.2);
    if (base.current) base.current.opacity = e;
    if (refl.current) refl.current.opacity = 0.9 * ease((clock.t - 0.4) / 1.6);
    if (pool.current) pool.current.opacity = 0.35 * ease((clock.t - 0.3) / 1.6);
  });
  return (
    <group position={[0, FLOOR_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.001, 4]} renderOrder={-2}>
        <planeGeometry args={[40, 24]} />
        <meshBasicMaterial ref={base} color="#07080b" transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* the platform's glow pooled on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CUBE_POS.x, 0.01, 0.6]} scale={[8, 5, 1]} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial ref={pool} map={glow} color="#8a94a8" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* the cube's reflection: a soft column of light going down into the floor */}
      <mesh position={[CUBE_POS.x, -1.7, 2.5]} scale={[1.2, 3.4, 1]} renderOrder={5}>
        <planeGeometry />
        <meshBasicMaterial ref={refl} map={beam} color="#dde3ee" transparent opacity={0} depthTest={false} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </group>
  );
}

const SHAFTS: [number, number, number][] = [
  // [x, width, strength]
  [0.1, 1.2, 0.09],
  [1.5, 2.0, 0.07],
  [2.6, 0.9, 0.05],
];

function Shafts({ beam }: { beam: THREE.Texture }) {
  const mats = useMemo(
    () =>
      SHAFTS.map(
        () =>
          new THREE.MeshBasicMaterial({
            map: beam,
            color: "#b8c2d4",
            transparent: true,
            opacity: 0,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            toneMapped: false,
          }),
      ),
    [beam],
  );
  useFrame(() => {
    const e = ease(clock.t / 2);
    mats.forEach((m, i) => (m.opacity = SHAFTS[i][2] * e));
  });
  return (
    <>
      {SHAFTS.map(([x, w], i) => (
        <mesh key={i} position={[x, 2.2, -4]} scale={[w, 9, 1]} material={mats[i]}>
          <planeGeometry />
        </mesh>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

function World() {
  const glow = useMemo(() => radialTex(), []);
  const beam = useMemo(() => beamTex(), []);
  const size = useThree((s) => s.size);
  const base = useRef({ x: 0, y: 0 });
  // narrower screens: shrink a little so the outer cards stay in frame
  const k = Math.min(1, size.width / size.height / 1.24);

  useFrame((state, dt) => {
    if (clock.running) clock.t += Math.min(dt, 1 / 30);
    // the camera drifts a touch with the pointer
    base.current.x = THREE.MathUtils.damp(base.current.x, state.pointer.x * 0.35, 2.2, dt);
    base.current.y = THREE.MathUtils.damp(base.current.y, state.pointer.y * 0.2, 2.2, dt);
    state.camera.position.set(base.current.x, 6.4 + base.current.y, 13.8);
    state.camera.lookAt(0.25, 0.1, 0);
  });

  return (
    <group scale={k}>
      <Shafts beam={beam} />
      <Floor glow={glow} beam={beam} />
      <Platform />
      <Cube glow={glow} />
      {RINGS.map((r, i) => (
        <RingMesh key={i} ring={r} glow={glow} />
      ))}
      {CARDS.map((c, i) => (
        <CardMesh key={c.title} card={c} i={i} />
      ))}
    </group>
  );
}

/** The landing plays the first time the section is well into view. */
const onVisibility = (visible: boolean, e: IntersectionObserverEntry) => {
  if (visible && e.intersectionRatio > 0.3) clock.running = true;
};

export default function PioneeringScene() {
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    clock.t = 0;
    clock.running = false;
  }, []);

  return (
    <div className="pioneering__canvas" ref={box} aria-hidden>
      <Canvas
        dpr={[1, 1.5]}
        frameloop="never"
        camera={{ fov: 30, position: [0, 6.4, 13.8], near: 0.1, far: 80 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#08090d"]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[-4, 8, 6]} intensity={1.2} color="#e6ebf4" />
        <pointLight position={[CUBE_POS.x, 0, 0]} intensity={10} distance={8} color="#c9d2e2" />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3} position={[-5, 6, 5]} scale={[7, 3, 1]} color="#eef1f6" />
          <Lightformer form="rect" intensity={2.5} position={[7, 3, -2]} rotation={[0, -Math.PI / 2.4, 0]} scale={[1.4, 9, 1]} color="#d6dce8" />
          <Lightformer form="rect" intensity={1.2} position={[-7, 2, -4]} rotation={[0, Math.PI / 2.4, 0]} scale={[1, 7, 1]} />
          <Lightformer form="circle" intensity={2} position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={4} />
        </Environment>
        <World />
        <Prepare />
        <VisibilityLoop target={box} rootMargin="0px 0px -10% 0px" onChange={onVisibility} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.62} luminanceSmoothing={0.22} />
          <Vignette offset={0.25} darkness={0.75} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
