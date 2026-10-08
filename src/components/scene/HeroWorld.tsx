"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { clamp01 } from "./shared";
import HeroGalaxy from "./HeroGalaxy";

/**
 * Hero: a night-side Earth floating between two tall glass slabs, a ringed galaxy of stars
 * wrapped around it (its near side in front of the globe, its far side behind), and a dark
 * polished floor that reflects the lit glass edges. Cool blue light with warm city lights.
 * It lands with a slow, staggered reveal; the title copy is HTML (Hero.tsx).
 *
 * Positions are in world units for the reference framing (camera at z = CAM_Z, fov 35,
 * ~1.85:1 screen); heroLayout() scales the whole group for other screen shapes.
 */

export const CAM_Z = 14;

/** The hero's own landing clock (seconds since its scene became ready); driven by HeroScene. */
export const heroClock = { t: 0 };

/** Object name the scene uses to prepare the hero (including its not-yet-revealed parts). */
export const WARMUP_HERO = "warmup:hero";

const FLOOR_Y = -3.3;

/** The globe: centre and radius (the galaxy is centred on it). */
export const GLOBE = { pos: new THREE.Vector3(0.84, -0.72, 0), r: 1.58 };

/** Scene placement per viewport shape (the copy sits top-left on desktop, top on phones). */
export function heroLayout(aspect: number) {
  if (aspect < 1) return { pos: new THREE.Vector3(-0.55, -1.0, 0), scale: 0.52 };
  // the reference framing is ~1.85:1; narrower screens shrink the scene to keep it whole
  const k = Math.min(1, aspect / 1.85);
  return { pos: new THREE.Vector3(0.35 * (1 - k), -0.3 * (1 - k), 0), scale: k };
}

const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3); // ease-out cubic

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

function canvasTex(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const radial = () =>
  canvasTex(256, 256, (ctx) => {
    const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.3, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  });

/** Light spreading across a slab from one vertical edge. */
const paneLight = (fromRight: boolean) =>
  canvasTex(256, 16, (ctx) => {
    const g = ctx.createLinearGradient(fromRight ? 256 : 0, 0, fromRight ? 0 : 256, 0);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.1, "rgba(255,255,255,0.32)");
    g.addColorStop(0.5, "rgba(255,255,255,0.06)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 16);
  });

/** A vertical streak (floor reflections): soft sides, bright at the top, fading down. */
const streak = () =>
  canvasTex(64, 256, (ctx) => {
    const img = ctx.createImageData(64, 256);
    for (let y = 0; y < 256; y++) {
      const v = Math.pow(1 - y / 256, 2) * Math.min(1, y / 14);
      for (let x = 0; x < 64; x++) {
        const dx = (x - 32) / 32;
        const i = (y * 64 + x) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
        img.data[i + 3] = Math.round(Math.exp(-dx * dx * 6) * v * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  });

/** A thin bright ring (the light on the floor beneath the globe). */
const ringTex = () =>
  canvasTex(512, 512, (ctx) => {
    const g = ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    g.addColorStop(0, "rgba(255,255,255,0.10)");
    g.addColorStop(0.78, "rgba(255,255,255,0.04)");
    g.addColorStop(0.9, "rgba(255,255,255,0.9)");
    g.addColorStop(0.93, "rgba(255,255,255,0.25)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
  });

/* ------------------------------------------------------------------ */
/* Glass slabs                                                         */
/* ------------------------------------------------------------------ */

type Slab = {
  x: number;
  z: number;
  w: number;
  h: number;
  rotY: number;
  /** brightness of the left / right edge light */
  edge: [number, number];
  light?: "left" | "right";
  lightStrength?: number;
  delay: number;
};

const EDGE_COLOR = new THREE.Color("#cfe0ff");

// left: a slab with a second, thinner one just behind it; right: a tall slab in two panels
const SLABS: Slab[] = [
  { x: -1.88, z: 0.6, w: 1.18, h: 4.55, rotY: -0.18, edge: [0.25, 2.6], light: "right", lightStrength: 0.1, delay: 0.25 },
  { x: -1.32, z: 0.2, w: 0.3, h: 4.4, rotY: -0.18, edge: [0.1, 0.5], delay: 0.35 },
  { x: 2.45, z: -0.45, w: 1.0, h: 6.0, rotY: -0.22, edge: [0.35, 0.3], light: "right", lightStrength: 0.12, delay: 0.15 },
  { x: 3.82, z: -0.2, w: 1.72, h: 6.35, rotY: -0.22, edge: [3.2, 2.4], light: "left", lightStrength: 0.2, delay: 0.1 },
];

function SlabMesh({ s, glass, light }: { s: Slab; glass: THREE.Material; light: THREE.Texture | null }) {
  const group = useRef<THREE.Group>(null);
  const edges = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const lightMat = useRef<THREE.MeshBasicMaterial>(null);
  const d = 0.04;
  useFrame(() => {
    const e = ease((heroClock.t - s.delay) / 1.4);
    if (group.current) {
      group.current.position.y = FLOOR_Y + s.h / 2 - (1 - e) * 0.6;
      group.current.visible = e > 0.001;
    }
    edges.current.forEach((m, i) => m && m.color.copy(EDGE_COLOR).multiplyScalar((i < 2 ? s.edge[i] : 0.3) * e));
    if (lightMat.current) lightMat.current.opacity = (s.lightStrength ?? 0) * e;
  });
  const { w, h } = s;
  return (
    <group ref={group} position={[s.x, FLOOR_Y + h / 2, s.z]} rotation={[0, s.rotY, 0]} visible={false}>
      <mesh material={glass}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {light && (
        <mesh position={[0, 0, d / 2 + 0.004]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial ref={lightMat} map={light} color="#bcd2ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      )}
      {(
        [
          [[-w / 2, 0, d / 2], [0.016, h, 0.016]],
          [[w / 2, 0, d / 2], [0.024, h, 0.024]],
          [[0, h / 2, d / 2], [w, 0.008, 0.008]],
        ] as [number, number, number][][]
      ).map(([pos, sz], i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={sz} />
          <meshBasicMaterial
            ref={(m) => {
              edges.current[i] = m;
            }}
            color={[0, 0, 0]}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

const EARTH = ["/textures/earth-day.jpg", "/textures/earth-lights.jpg", "/textures/earth-water.jpg"];
// start fetching the Earth textures as soon as the 3D code loads
if (typeof window !== "undefined") useLoader.preload(THREE.TextureLoader, EARTH);

/* ------------------------------------------------------------------ */
/* Globe: the night side of the Earth                                  */
/* ------------------------------------------------------------------ */

function Globe({ halo }: { halo: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const backGlow = useRef<THREE.SpriteMaterial>(null);
  const spin = useRef<THREE.Group>(null);
  const [day, lights, water] = useLoader(THREE.TextureLoader, EARTH);
  const mat = useMemo(() => {
    [day, lights, water].forEach((t) => {
      t.anisotropy = 4;
    });
    return new THREE.ShaderMaterial({
      uniforms: { uDay: { value: day }, uLights: { value: lights }, uWater: { value: water }, uReveal: { value: 0 } },
      vertexShader: /* glsl */ `
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          vUv = uv;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */ `
        uniform sampler2D uDay, uLights, uWater; uniform float uReveal;
        varying vec2 vUv; varying vec3 vN; varying vec3 vV;
        void main() {
          vec3 n = normalize(vN);
          float facing = clamp(dot(n, normalize(vV)), 0.0, 1.0);
          float land = 1.0 - texture2D(uWater, vUv).r;          // 1 on land, 0 on water
          float relief = texture2D(uDay, vUv).r;
          // moonlit side: navy oceans, slate-blue continents
          // values are linear: kept very low so the night side reads deep navy on screen
          vec3 ocean = vec3(0.0007, 0.0013, 0.004);
          vec3 ground = mix(vec3(0.0025, 0.004, 0.0085), vec3(0.008, 0.012, 0.022), relief);
          vec3 col = mix(ocean, ground, land);
          // soft key light from the upper left, where the atmosphere glows
          float key = clamp(dot(n, normalize(vec3(-0.55, 0.65, 0.5))), 0.0, 1.0);
          col *= 0.45 + 1.3 * key;
          // city lights: warm orange-gold, brightest in the dense clusters
          float city = texture2D(uLights, vUv).r;
          col += vec3(1.0, 0.5, 0.16) * pow(city, 2.2) * 1.3 * land;
          // ocean sheen toward the light
          col += vec3(0.1, 0.18, 0.4) * pow(key, 14.0) * (1.0 - land) * 0.25;
          // atmosphere: a blue limb, strongest on the lit upper-left edge
          float fres = pow(1.0 - facing, 6.5);
          float lit = 0.25 + 1.0 * smoothstep(-0.3, 0.9, dot(n.xy, normalize(vec2(-0.6, 0.8))));
          col += vec3(0.3, 0.52, 1.0) * fres * lit * 2.6;
          gl_FragColor = vec4(col * uReveal, 1.0);
        }`,
    });
  }, [day, lights, water]);

  useFrame((state, dt) => {
    const e = ease((heroClock.t - 0.45) / 1.7);
    if (group.current) {
      group.current.visible = e > 0.001;
      group.current.scale.setScalar(0.94 + 0.06 * e);
      group.current.position.y = GLOBE.pos.y - (1 - e) * 0.3 + Math.sin(state.clock.elapsedTime * 0.55) * 0.03 * e;
    }
    // turns slowly, Asia and the Indian Ocean facing the viewer as in the reference
    if (spin.current) spin.current.rotation.y += Math.min(dt, 1 / 30) * 0.012;
    mat.uniforms.uReveal.value = e;
    if (backGlow.current) backGlow.current.opacity = 0.06 * e;
  });

  return (
    <group ref={group} position={GLOBE.pos} visible={false}>
      <group rotation={[0.38, 0, 0.12]}>
        <group ref={spin} rotation={[0, -3.45, 0]}>
          <mesh material={mat}>
            <sphereGeometry args={[GLOBE.r, 96, 96]} />
          </mesh>
        </group>
      </group>
      <Atmosphere />
      {/* a wide, faint blue glow behind the globe */}
      <sprite position={[0, 0, -1.2]} scale={7.5} renderOrder={-1}>
        <spriteMaterial ref={backGlow} map={halo} color="#5f86ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </sprite>
    </group>
  );
}

/** The soft blue glow around the globe (a back-facing shell, additive). */
function Atmosphere() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uReveal: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uReveal; varying vec3 vN; varying vec3 vV;
          void main() {
            float f = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
            float a = pow(f, 2.6);
            float lit = 0.55 + 0.45 * smoothstep(-0.4, 0.9, dot(normalize(vN).xy, normalize(vec2(-0.6, 0.8))));
            gl_FragColor = vec4(vec3(0.35, 0.58, 1.0) * a * lit * 0.9 * uReveal, 1.0);
          }`,
        side: THREE.BackSide,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  );
  useFrame(() => {
    mat.uniforms.uReveal.value = ease((heroClock.t - 0.6) / 1.8);
  });
  return (
    <mesh material={mat} scale={1.16}>
      <sphereGeometry args={[GLOBE.r, 64, 64]} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Floor                                                               */
/* ------------------------------------------------------------------ */

function Floor({ halo, streakTex, ring }: { halo: THREE.Texture; streakTex: THREE.Texture; ring: THREE.Texture }) {
  const base = useRef<THREE.MeshBasicMaterial>(null);
  const sheen = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const streaks = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const sheenTex = useMemo(
    () =>
      canvasTex(16, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.06, "rgba(255,255,255,0.6)");
        g.addColorStop(0.3, "rgba(255,255,255,0.12)");
        g.addColorStop(1, "rgba(255,255,255,0.04)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 16, 256);
      }),
    [],
  );
  const fade = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "#000");
    g.addColorStop(0.1, "#fff");
    g.addColorStop(1, "#fff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  // reflections straight down from the foot of each lit slab edge: [x, z, width, brightness, warmth]
  const REFL: [number, number, number, number, number][] = [
    [4.66, -0.39, 0.34, 2.2, 0.7], // tall slab, right edge (warm, as in the reference)
    [2.97, -0.01, 0.36, 2.0, 0], // tall slab, inner edge
    [-1.3, 0.49, 0.3, 1.7, 0], // left slab's lit edge
    [0.84, 0.3, 1.6, 0.3, 0], // the globe's glow
  ];
  useFrame(() => {
    const e = ease(heroClock.t / 1.6);
    const l = ease((heroClock.t - 0.5) / 1.8);
    if (base.current) base.current.opacity = e;
    if (sheen.current) sheen.current.opacity = 0.06 * e;
    if (pool.current) pool.current.opacity = 0.12 * l;
    if (ringMat.current) ringMat.current.opacity = 0.05 * l;
    streaks.current.forEach((m, i) => {
      if (!m) return;
      const [, , , b, warm] = REFL[i];
      m.color.setRGB(0.72 + 0.28 * warm, 0.82 + 0.06 * warm, 1.0 - 0.3 * warm).multiplyScalar(b * l);
    });
  });
  return (
    <group position={[0, FLOOR_Y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0, 15.5]} renderOrder={-2}>
        <planeGeometry args={[60, 34]} />
        <meshBasicMaterial ref={base} color="#040609" alphaMap={fade} transparent opacity={0} depthWrite={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.02, 6.5]} scale={[40, 16, 1]} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial ref={sheen} map={sheenTex} color="#9db8ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* a soft pool of blue light under the globe, and the thin bright ring on the floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GLOBE.pos.x, 0.03, 0.2]} scale={[7.5, 3.2, 1]} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial ref={pool} map={halo} color="#7fa2ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[GLOBE.pos.x, 0.04, 0.2]} scale={[4.6, 4.6, 1]} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial ref={ringMat} map={ring} color="#cfe0ff" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {REFL.map(([x, z, w], i) => (
        <mesh key={i} position={[x, -1.25, z + 0.05]} scale={[w, 2.5, 1]} renderOrder={5}>
          <planeGeometry />
          <meshBasicMaterial
            ref={(m) => {
              streaks.current[i] = m;
            }}
            map={streakTex}
            color={[0, 0, 0]}
            transparent
            depthTest={false}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export default function HeroWorld() {
  const size = useThree((s) => s.size);
  const layout = useMemo(() => heroLayout(size.width / size.height), [size]);

  // clear glass with a faint cool tint: the edges and the light carry the shape
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0b1220",
        metalness: 0.15,
        roughness: 0.06,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 0.6,
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const halo = useMemo(() => radial(), []);
  const streakTex = useMemo(() => streak(), []);
  const ring = useMemo(() => ringTex(), []);
  const lights = useMemo(() => ({ left: paneLight(false), right: paneLight(true) }), []);

  return (
    <group name={WARMUP_HERO} position={layout.pos} scale={layout.scale}>
      <Floor halo={halo} streakTex={streakTex} ring={ring} />
      {SLABS.map((s, i) => (
        <SlabMesh key={i} s={s} glass={glass} light={s.light ? lights[s.light] : null} />
      ))}
      <Globe halo={halo} />
      <HeroGalaxy clock={heroClock} />
    </group>
  );
}
