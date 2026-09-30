"use client";

import { type ComponentRef, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Environment, Lightformer, Line, MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import type { Line2, LineSegments2 } from "three-stdlib";
import VisibilityLoop from "./VisibilityLoop";

/**
 * Pioneering section: an isometric "AI" cube of real refractive glass on a machined platform,
 * wired to frosted-glass tiles for the things AI connects (knowledge, documents, cloud,
 * people, insight). Light pulses travel along circuit traces into the cube, whose core lights
 * the platform and is mirrored in a polished floor.
 *
 * It lands when the section scrolls into view; the scene leans toward the pointer, and
 * hovering a tile lifts it and speeds up its pulses. This canvas renders only while on screen.
 */

const clamp01 = (x: number) => Math.min(Math.max(x, 0), 1);
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

/** Landing clock: starts the first time the section is on screen. */
const clock = { t: 0, running: false };

// isometric axes as seen by the camera: screen-right, toward-the-viewer, up
const RIGHT = new THREE.Vector3(1, 0, -1).normalize();
const FRONT = new THREE.Vector3(1, 0, 1).normalize();
const at = (r: number, up: number, f: number) =>
  new THREE.Vector3().addScaledVector(RIGHT, r).addScaledVector(FRONT, f).setY(up);

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

type IconName = "brain" | "document" | "cloud" | "people" | "chart";

/** White line icon on a transparent background (it glows inside the glass tile). */
function iconTexture(name: IconName) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.translate(S / 2, S / 2);
  ctx.beginPath();
  if (name === "document") {
    ctx.moveTo(-40, -60);
    ctx.lineTo(18, -60);
    ctx.lineTo(44, -34);
    ctx.lineTo(44, 62);
    ctx.lineTo(-40, 62);
    ctx.closePath();
    ctx.moveTo(18, -60);
    ctx.lineTo(18, -34);
    ctx.lineTo(44, -34);
    for (const y of [-12, 10, 32]) {
      ctx.moveTo(-22, y);
      ctx.lineTo(26, y);
    }
  } else if (name === "cloud") {
    ctx.moveTo(-50, 30);
    ctx.arc(-38, 8, 24, Math.PI * 0.6, Math.PI * 1.5);
    ctx.arc(-4, -18, 34, Math.PI * 1.1, Math.PI * 1.9);
    ctx.arc(36, 6, 26, Math.PI * 1.45, Math.PI * 0.4);
    ctx.closePath();
  } else if (name === "people") {
    for (const [x, s] of [[-22, 1], [26, 0.85]] as const) {
      ctx.moveTo(x + 18 * s, -30 * s);
      ctx.arc(x, -30 * s, 18 * s, 0, Math.PI * 2);
      ctx.moveTo(x - 34 * s, 50);
      ctx.arc(x, 50, 34 * s, Math.PI, 0);
    }
  } else if (name === "chart") {
    for (const [x, h] of [[-38, 34], [-6, 64], [26, 94]] as const) ctx.roundRect(x, 50 - h, 22, h, 5);
  } else {
    // brain: two lobes with folds
    for (const side of [-1, 1]) {
      ctx.moveTo(0, -56);
      ctx.bezierCurveTo(side * 30, -70, side * 62, -50, side * 58, -18);
      ctx.bezierCurveTo(side * 72, 6, side * 60, 42, side * 32, 50);
      ctx.bezierCurveTo(side * 18, 64, 0, 58, 0, 44);
      ctx.moveTo(side * 22, -40);
      ctx.bezierCurveTo(side * 38, -30, side * 24, -10, side * 40, 0);
      ctx.moveTo(side * 16, 12);
      ctx.bezierCurveTo(side * 34, 16, side * 30, 34, side * 18, 38);
    }
    ctx.moveTo(0, -56);
    ctx.lineTo(0, 44);
  }
  ctx.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function aiTexture() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = "#fff";
  ctx.font = `700 124px Montserrat, Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AI", S / 2, S / 2 + 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function gridTexture() {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d")!;
  ctx.strokeStyle = "rgba(255,255,255,0.55)";
  ctx.lineWidth = 1.2;
  for (let i = 0; i <= 14; i++) {
    const p = (i / 14) * S;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "destination-in";
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return new THREE.CanvasTexture(c);
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.4)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

/* ------------------------------------------------------------------ */
/* Layout                                                              */
/* ------------------------------------------------------------------ */

const CUBE = 1.45;
const STEP_TOP = 0.36; // top of the platform
const CUBE_Y = STEP_TOP + CUBE / 2 + 0.02;

type Tile = { name: IconName; pos: THREE.Vector3; delay: number; wire: THREE.Vector3[]; nodes: THREE.Vector3[] };

/**
 * Circuit trace from a tile down to the floor, then along the floor at right angles
 * (parallel to the platform's edges) into the platform's side.
 */
function trace(from: THREE.Vector3, _entry: THREE.Vector3) {
  // out of the tile's bottom edge, a soft bend, then level into the cube's side
  const dir = new THREE.Vector3(from.x, 0, from.z).normalize();
  const bottom = from.clone().setY(from.y - 0.5);
  const lowY = Math.min(bottom.y - 0.25, STEP_TOP + 0.45);
  const drop = bottom.clone().setY(lowY);
  const entry = dir.clone().multiplyScalar(CUBE / 2 + 0.02).setY(STEP_TOP + 0.3);
  const before = dir.clone().multiplyScalar(CUBE / 2 + 0.55).setY(STEP_TOP + 0.3);
  const mid = drop.clone().lerp(before, 0.5).setY((lowY + STEP_TOP + 0.3) / 2);
  const curve = new THREE.CatmullRomCurve3([bottom, drop, mid, before, entry], false, "centripetal");
  return { wire: curve.getPoints(48), nodes: [bottom, mid] };
}

const TILES: Tile[] = (
  [
    ["brain", at(-2.2, 2.4, -0.3), new THREE.Vector3(-1.72, 0, -0.35), 0.25],
    ["document", at(1.7, 2.75, -1.05), new THREE.Vector3(0.35, 0, -1.72), 0.35],
    ["cloud", at(3.3, 1.9, -0.2), new THREE.Vector3(1.72, 0, -0.9), 0.45],
    ["people", at(-3.0, 0.95, 0.75), new THREE.Vector3(-0.8, 0, 1.72), 0.3],
    ["chart", at(2.35, 0.95, 1.65), new THREE.Vector3(1.72, 0, 0.7), 0.4],
  ] as const
).map(([name, pos, entry, delay]) => ({ name, pos, delay, ...trace(pos, entry) }));

const BLOCKS = [at(-1.5, 0.27, 2.05), at(3.45, 0.27, 0.95), at(-0.7, 0.27, -2.8), at(3.75, 0.27, -2.3)];

/** Point along a polyline at 0..1 of its length. */
function along(points: THREE.Vector3[], t: number, out: THREE.Vector3) {
  const lens = points.slice(1).map((p, i) => p.distanceTo(points[i]));
  let d = t * lens.reduce((a, b) => a + b, 0);
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) return out.lerpVectors(points[i], points[i + 1], d / lens[i]);
    d -= lens[i];
  }
  return out.copy(points[points.length - 1]);
}

const hover = { index: -1 };

const TILE_EDGES = new THREE.EdgesGeometry(new THREE.BoxGeometry(0.94, 0.94, 0.09));

/* ------------------------------------------------------------------ */
/* Tiles: thick frosted glass with a glowing icon inside                */
/* ------------------------------------------------------------------ */

function TileMesh({ tile, index, glass }: { tile: Tile; index: number; glass: THREE.Material }) {
  const group = useRef<THREE.Group>(null);
  const icon = useRef<THREE.MeshBasicMaterial>(null);
  const tex = useMemo(() => iconTexture(tile.name), [tile.name]);
  const lift = useRef(0);
  useFrame((state, dt) => {
    const e = ease((clock.t - tile.delay) / 1.1);
    lift.current = THREE.MathUtils.damp(lift.current, hover.index === index ? 1 : 0, 8, dt);
    const g = group.current;
    if (!g) return;
    g.visible = e > 0.001;
    g.position.copy(tile.pos);
    g.position.y += -(1 - e) * 1.2 + Math.sin(state.clock.elapsedTime * 0.8 + index) * 0.035 + lift.current * 0.25;
    g.position.addScaledVector(FRONT, lift.current * 0.2);
    g.scale.setScalar(0.85 + 0.15 * e + lift.current * 0.05);
    if (icon.current) icon.current.color.setScalar(e * (1.7 + lift.current * 1.2));
  });
  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    hover.index = index;
    document.body.style.cursor = "pointer";
  };
  const onOut = () => {
    if (hover.index === index) hover.index = -1;
    document.body.style.cursor = "";
  };
  return (
    <group ref={group} rotation={[0, Math.PI / 4 - tile.pos.dot(RIGHT) * 0.13, 0]} visible={false} onPointerOver={onOver} onPointerOut={onOut}>
      <RoundedBox args={[0.95, 0.95, 0.09]} radius={0.035} smoothness={4} material={glass} />
      <lineSegments geometry={TILE_EDGES}>
        <lineBasicMaterial color={[1.5, 1.5, 1.5]} transparent opacity={0.3} toneMapped={false} />
      </lineSegments>
      {/* the icon, glowing on the glass face */}
      <mesh position={[0, 0, 0.05]}>
        <planeGeometry args={[0.56, 0.56]} />
        <meshBasicMaterial ref={icon} map={tex} color={[0, 0, 0]} transparent depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Cables and data flow                                                */
/* ------------------------------------------------------------------ */

/** Soft elongated streak (a data packet): bright head, fading tail. */
function streakTexture() {
  const c = document.createElement("canvas");
  c.width = 256;
  c.height = 32;
  const ctx = c.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.75, "rgba(255,255,255,0.55)");
  g.addColorStop(0.97, "rgba(255,255,255,1)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 32);
  ctx.globalCompositeOperation = "destination-in";
  const v = ctx.createLinearGradient(0, 0, 0, 32);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(0.5, "rgba(0,0,0,1)");
  v.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, 256, 32);
  return new THREE.CanvasTexture(c);
}

const PACKETS = 3; // data packets in flight per cable

/**
 * Real cables: a thin dark sheathed tube with a lit glass core running through it, glowing
 * junction beads, a small port where each cable meets the cube, and packets of light that
 * travel from the tile into the cube (brightening the beads as they pass).
 */
function Cables({ glow }: { glow: THREE.Texture }) {
  const streak = useMemo(() => streakTexture(), []);
  const data = useMemo(
    () =>
      TILES.map((tile) => {
        const curve = new THREE.CatmullRomCurve3(tile.wire, false, "centripetal");
        return {
          curve,
          sheath: new THREE.TubeGeometry(curve, 120, 0.016, 10, false),
          core: new THREE.TubeGeometry(curve, 120, 0.007, 8, false),
          length: curve.getLength(),
        };
      }),
    [],
  );
  const sheathMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({ color: "#a8a8b0", metalness: 0.2, roughness: 0.15, clearcoat: 1, envMapIntensity: 2, transparent: true, opacity: 0, depthWrite: false }),
    [],
  );
  const coreMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const heads = useRef<(THREE.Sprite | null)[]>([]);
  const beads = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const phase = useMemo(() => TILES.map((_, i) => i * 0.19), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const tan = useMemo(() => new THREE.Vector3(), []);
  const cam = useThree((st) => st.camera);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    let sheathShown = 0;
    TILES.forEach((tile, i) => {
      const draw = ease((clock.t - tile.delay - 0.45) / 1.2);
      sheathShown = Math.max(sheathShown, draw);
      const hot = hover.index === i;
      const cm = coreMats.current[i];
      if (cm) cm.color.setScalar((1.1 + 0.2 * Math.sin(t * 2 + i)) * draw * (hot ? 1.7 : 1));
      phase[i] = (phase[i] + dt * (hot ? 0.95 : 0.28)) % 1;

      for (let k = 0; k < PACKETS; k++) {
        const u = (phase[i] + k / PACKETS) % 1;
        const idx = i * PACKETS + k;
        const m = packets.current[idx];
        const h = heads.current[idx];
        const fade = Math.min(1, u * 8, (1 - u) * 8) * draw; // fade in at the tile, out at the cube
        data[i].curve.getPointAt(u, p);
        data[i].curve.getTangentAt(u, tan);
        if (m) {
          // orient the streak along the cable, facing the camera
          m.position.copy(p);
          const view = cam.position.clone().sub(p).normalize();
          const up = new THREE.Vector3().crossVectors(view, tan).normalize();
          const normal = new THREE.Vector3().crossVectors(tan, up);
          m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tan, up, normal));
          (m.material as THREE.MeshBasicMaterial).opacity = fade * (hot ? 1 : 0.85);
          m.scale.set(hot ? 0.4 : 0.3, hot ? 0.05 : 0.04, 1);
        }
        if (h) {
          h.position.copy(p);
          h.material.opacity = fade;
          h.scale.setScalar(hot ? 0.16 : 0.11);
        }
      }
      // beads flash when a packet passes them
      const b0 = beads.current[i * 2], b1 = beads.current[i * 2 + 1];
      const near = (u0: number) => {
        let best = 1;
        for (let k = 0; k < PACKETS; k++) best = Math.min(best, Math.abs(((phase[i] + k / PACKETS) % 1) - u0));
        return 1 - THREE.MathUtils.smoothstep(best, 0, 0.08);
      };
      if (b0) b0.color.setScalar((1.2 + 2 * near(0.02)) * draw);
      if (b1) b1.color.setScalar((1 + 2 * near(0.5)) * draw);
    });
    sheathMat.opacity = 0.28 * sheathShown;
  });

  return (
    <>
      {data.map((d, i) => (
        <group key={i}>
          <mesh geometry={d.sheath} material={sheathMat} />
          <mesh geometry={d.core}>
            <meshBasicMaterial
              ref={(m) => {
                coreMats.current[i] = m;
              }}
              color={[0, 0, 0]}
              toneMapped={false}
            />
          </mesh>
          {/* junction beads: where the cable leaves the tile, and the bend */}
          {[TILES[i].nodes[0], TILES[i].nodes[1]].map((n, k) => (
            <mesh key={k} position={n}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshBasicMaterial
                ref={(m) => {
                  beads.current[i * 2 + k] = m;
                }}
                color={[0, 0, 0]}
                toneMapped={false}
              />
            </mesh>
          ))}
          {Array.from({ length: PACKETS }, (_, k) => (
            <group key={k}>
              <mesh
                ref={(m) => {
                  packets.current[i * PACKETS + k] = m;
                }}
              >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial map={streak} color={[2.6, 2.6, 2.6]} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} side={THREE.DoubleSide} />
              </mesh>
              <sprite
                ref={(sp) => {
                  heads.current[i * PACKETS + k] = sp;
                }}
              >
                <spriteMaterial map={glow} color={[2.4, 2.4, 2.4]} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </sprite>
            </group>
          ))}
        </group>
      ))}
    </>
  );
}


/* ------------------------------------------------------------------ */
/* The AI cube: a clear glass shell around a frosted, glowing inner cube */
/* ------------------------------------------------------------------ */

/** Cube edges, brighter at the bottom (lit by the base) and fading toward the top. */
function gradientEdges(size: number) {
  const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(size, size, size));
  const pos = g.attributes.position as THREE.BufferAttribute;
  const col = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i) / size + 0.5; // 0 bottom .. 1 top
    const v = 1.5 - 0.9 * y;
    col.set([v, v, v], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}

/** Frosted, internally lit glass for the cube (deterministic, no refraction blur). */
function frostedGlass(side: THREE.Side, strength: number) {
  return new THREE.ShaderMaterial({
    side,
    transparent: true,
    depthWrite: false,
    uniforms: { uGlow: { value: 0 }, uStrength: { value: strength } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying float vY; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vY = position.y / ${CUBE.toFixed(3)} + 0.5;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uGlow, uStrength;
      varying vec2 vUv; varying float vY; varying vec3 vN; varying vec3 vV;
      void main() {
        float edge = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
        float rim = 1.0 - smoothstep(0.0, 0.09, edge);       // bright bevel band
        float inner = 1.0 - smoothstep(0.1, 0.16, abs(edge - 0.16)); // faint inner frame
        float up = clamp(vY, 0.0, 1.0);
        float lift = mix(1.0, 0.32, pow(up, 0.8));             // base light fading upward
        float top = step(0.9, abs(vN.y));                       // top face: evenly lit, dimmer
        float body = mix(0.3 * lift, 0.2, top);
        float fres = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.0);
        vec3 col = vec3(body + rim * mix(0.95, 0.45, up) + inner * 0.07 + fres * 0.15);
        float alpha = clamp(0.35 + body * 0.9 + rim * 0.5, 0.0, 0.95);
        gl_FragColor = vec4(col * uGlow * uStrength * 1.2, alpha * uGlow);
      }`,
  });
}

function Core({ glow }: { glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const glassFront = useMemo(() => frostedGlass(THREE.FrontSide, 1), []);
  const glassBack = useMemo(() => frostedGlass(THREE.BackSide, 0.45), []);
  const label = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.SpriteMaterial>(null);
  const outerLine = useRef<THREE.LineBasicMaterial>(null);
  const innerLine = useRef<THREE.LineBasicMaterial>(null);
  const baseGlow = useRef<THREE.MeshBasicMaterial>(null);
  const ai = useMemo(() => aiTexture(), []);
  const outerEdges = useMemo(() => gradientEdges(CUBE * 0.992), []);
  const innerEdges = useMemo(() => gradientEdges(CUBE * 0.62), []);

  useFrame((state) => {
    const e = ease((clock.t - 0.15) / 1.3);
    const g = group.current;
    if (!g) return;
    g.visible = e > 0.001;
    g.position.y = CUBE_Y + (1 - e) * 1.4 + Math.sin(state.clock.elapsedTime * 0.9) * 0.02 * e;
    g.rotation.y = (1 - e) * 0.8;
    const beat = 0.9 + 0.1 * Math.sin(state.clock.elapsedTime * 2.2) + (hover.index >= 0 ? 0.2 : 0);
    glassFront.uniforms.uGlow.value = e * beat;
    glassBack.uniforms.uGlow.value = e * beat;
    if (label.current) label.current.color.setScalar(2.4 * e);
    if (halo.current) halo.current.opacity = 0.16 * e * beat;
    if (outerLine.current) outerLine.current.opacity = 0.75 * e;
    if (innerLine.current) innerLine.current.opacity = 0.45 * e * beat;
    if (baseGlow.current) baseGlow.current.opacity = 0.75 * e * beat;
  });

  return (
    <group ref={group} visible={false}>
      <lineSegments geometry={innerEdges}>
        <lineBasicMaterial ref={innerLine} vertexColors transparent opacity={0} toneMapped={false} />
      </lineSegments>
      {/* frosted glass lit from within: brightest at the base, where the platform light
          enters, fading toward the top; faces glow more toward their edges (thicker glass) */}
      <mesh material={glassBack}>
        <boxGeometry args={[CUBE, CUBE, CUBE]} />
      </mesh>
      <mesh material={glassFront}>
        <boxGeometry args={[CUBE, CUBE, CUBE]} />
      </mesh>
      {/* bevel highlights: bright where the base lights them, fading upward */}
      <lineSegments geometry={outerEdges}>
        <lineBasicMaterial ref={outerLine} vertexColors transparent opacity={0} toneMapped={false} />
      </lineSegments>
      {/* "AI", glowing on the front face */}
      <mesh position={[0, 0, CUBE / 2 + 0.004]}>
        <planeGeometry args={[CUBE * 0.62, CUBE * 0.62]} />
        <meshBasicMaterial ref={label} map={ai} color={[0, 0, 0]} transparent depthWrite={false} toneMapped={false} />
      </mesh>
      {/* light pooling under the cube, on the platform */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -CUBE / 2 - 0.012, 0]} scale={CUBE * 1.9}>
        <planeGeometry />
        <meshBasicMaterial ref={baseGlow} map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <sprite scale={3.2}>
        <spriteMaterial ref={halo} map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Platform: machined metal steps with a light strip round the cube     */
/* ------------------------------------------------------------------ */

function Platform() {
  const group = useRef<THREE.Group>(null);
  const strips = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const metal = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#0d0d0f", metalness: 0.85, roughness: 0.28, clearcoat: 0.6, clearcoatRoughness: 0.2, envMapIntensity: 1.4 }),
    [],
  );
  useFrame(() => {
    const e = ease(clock.t / 1.1);
    if (group.current) {
      group.current.visible = e > 0.001;
      group.current.position.y = -(1 - e) * 0.4;
    }
    strips.current.forEach((m) => m && m.color.setScalar(0.8 * ease((clock.t - 0.6) / 0.9)));
  });
  const ring = CUBE + 0.28; // light strip just outside the cube's footprint
  return (
    <group ref={group} visible={false}>
      <RoundedBox args={[3.5, 0.18, 3.5]} radius={0.04} smoothness={3} position={[0, 0.09, 0]} material={metal} />
      <RoundedBox args={[2.7, 0.18, 2.7]} radius={0.04} smoothness={3} position={[0, 0.27, 0]} material={metal} />
      {/* recessed light strip around the cube's base */}
      {(
        [
          [0, ring / 2, ring - 0.06, 0.022],
          [0, -ring / 2, ring - 0.06, 0.022],
          [ring / 2, 0, 0.022, ring - 0.06],
          [-ring / 2, 0, 0.022, ring - 0.06],
        ] as const
      ).map(([x, z, w, d], i) => (
        <mesh key={i} position={[x, STEP_TOP + 0.005, z]}>
          <boxGeometry args={[w, 0.012, d]} />
          <meshBasicMaterial
            ref={(m) => {
              strips.current[i] = m;
            }}
            color={[0, 0, 0]}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Floor: polished, reflecting the scene, with a faint grid              */
/* ------------------------------------------------------------------ */

function Floor({ glow }: { glow: THREE.Texture }) {
  const grid = useMemo(() => gridTexture(), []);
  const reflector = useRef<ComponentRef<typeof MeshReflectorMaterial>>(null);
  const gridMat = useRef<THREE.MeshBasicMaterial>(null);
  const poolMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const e = ease(clock.t / 1.4);
    if (reflector.current) reflector.current.opacity = e;
    if (gridMat.current) gridMat.current.opacity = 0.03 * e;
    if (poolMat.current) poolMat.current.opacity = 0.14 * ease((clock.t - 0.5) / 1.4);
  });
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          ref={reflector}
          resolution={256}
          blur={[220, 60]}
          mixBlur={1}
          mixStrength={2.6}
          mixContrast={1}
          depthScale={1.2}
          minDepthThreshold={0.3}
          maxDepthThreshold={1.4}
          color="#040404"
          metalness={0.5}
          roughness={0.7}
          envMapIntensity={0}
          transparent
          opacity={0}
        />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0]}>
        <planeGeometry args={[18, 18]} />
        <meshBasicMaterial ref={gridMat} map={grid} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]} scale={6.5}>
        <planeGeometry />
        <meshBasicMaterial ref={poolMat} map={glow} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
    </>
  );
}

function Blocks() {
  const refs = useRef<(THREE.Group | null)[]>([]);
  const mat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#141417", metalness: 0.4, roughness: 0.4, clearcoat: 0.8, clearcoatRoughness: 0.25, envMapIntensity: 1.3 }),
    [],
  );
  useFrame(() => {
    refs.current.forEach((m, i) => {
      if (!m) return;
      const e = ease((clock.t - 0.2 - i * 0.08) / 1.1);
      m.visible = e > 0.001;
      m.position.y = BLOCKS[i].y - (1 - e) * 0.6;
    });
  });
  return (
    <>
      {BLOCKS.map((p, i) => (
        <group
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          position={p}
          rotation={[0, Math.PI / 4, 0]}
          visible={false}
        >
          <RoundedBox args={[0.75, 0.54, 0.75]} radius={0.06} smoothness={4} material={mat} />
        </group>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */

function World() {
  const root = useRef<THREE.Group>(null);
  const glow = useMemo(() => glowTexture(), []);
  // light frosted glass for the tiles: translucent, with bright bevelled edges from the studio lights
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#c9cad0",
        emissive: new THREE.Color("#ffffff"),
        emissiveIntensity: 0.07,
        metalness: 0.05,
        roughness: 0.3,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 3,
        transparent: true,
        opacity: 0.46,
        depthWrite: false,
      }),
    [],
  );
  useFrame((state, dt) => {
    if (clock.running) clock.t += Math.min(dt, 1 / 30);
    const g = root.current;
    if (!g) return;
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, state.pointer.x * 0.14, 2.5, dt);
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, -state.pointer.y * 0.05, 2.5, dt);
  });
  return (
    <group ref={root}>
      <Floor glow={glow} />
      <Platform />
      <Blocks />
      <Core glow={glow} />
      <Cables glow={glow} />
      {TILES.map((t, i) => (
        <TileMesh key={t.name} tile={t} index={i} glass={glass} />
      ))}
    </group>
  );
}

/** Compile every shader up front (pieces start hidden, and compile skips hidden objects),
 *  so nothing stalls when the section first scrolls into view. */
function Prepare() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    const restore: (() => void)[] = [];
    scene.traverse((o) => {
      if (!o.visible) {
        o.visible = true;
        restore.push(() => (o.visible = false));
      }
    });
    Promise.resolve(gl.compileAsync(scene, camera))
      .catch(() => gl.compile(scene, camera))
      .then(() => {
        // one full render while everything is shown: uploads geometry and textures and
        // creates the glass/reflection render targets now, not on the first scroll into view
        requestAnimationFrame(() => {
          gl.render(scene, camera);
          restore.forEach((r) => r());
          // and one frame through the whole post-processing chain, so its buffers exist too
          requestAnimationFrame(() => advance(performance.now()));
        });
      })
      .catch(() => restore.forEach((r) => r()));
  }, [gl, scene, camera, advance]);
  return null;
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
        camera={{ fov: 15.5, position: [19, 14.6, 19], near: 0.1, far: 90 }}
        onCreated={({ camera, gl }) => {
          camera.lookAt(-0.22, 1.2, 0.22);
          // the glass refraction pass doesn't need full resolution (it is blurred anyway)
          (gl as THREE.WebGLRenderer & { transmissionResolutionScale: number }).transmissionResolutionScale = 0.5;
        }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#030303"]} />
        <ambientLight intensity={0.04} />
        <directionalLight position={[-4, 9, 5]} intensity={1.1} />
        <spotLight position={[2, 10, 3]} angle={0.5} penumbra={1} intensity={40} />
        {/* studio softboxes: these are what the glass edges and bevels reflect */}
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={3.5} position={[-5, 6, 5]} scale={[7, 3, 1]} />
          <Lightformer form="rect" intensity={3} position={[7, 3, -2]} rotation={[0, -Math.PI / 2.4, 0]} scale={[1.4, 9, 1]} />
          <Lightformer form="rect" intensity={1.6} position={[-7, 2, -4]} rotation={[0, Math.PI / 2.4, 0]} scale={[1, 7, 1]} />
          <Lightformer form="rect" intensity={0.8} position={[0, -4, 3]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 2, 1]} />
          <Lightformer form="circle" intensity={2} position={[0, 9, 0]} rotation={[Math.PI / 2, 0, 0]} scale={4} />
        </Environment>
        <World />
        <Prepare />
        <VisibilityLoop target={box} rootMargin="0px 0px -10% 0px" onChange={onVisibility} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur intensity={0.9} luminanceThreshold={0.85} luminanceSmoothing={0.2} />
          <Vignette offset={0.25} darkness={0.8} />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
