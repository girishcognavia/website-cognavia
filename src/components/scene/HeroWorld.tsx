"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { clamp01 } from "./shared";

/**
 * Hero: a quiet studio scene — dark glass panes receding into depth with light pouring
 * through a seam between them, a black sphere floating in front with a crescent of light on
 * its edge, a thin orbit with three points, and a polished floor. It lands with a slow,
 * staggered reveal; the title copy is HTML (Hero.tsx) and appears instantly.
 */

export const CAM_Z = 14;

/** The hero's own landing clock (seconds since its scene became ready); driven by HeroScene. */
export const heroClock = { t: 0 };

/** Object name the Stage uses to prepare the hero (including its not-yet-revealed parts). */
export const WARMUP_HERO = "warmup:hero";

const FLOOR_Y = -2.75;

/** Scene placement per viewport shape (the copy sits top-left on desktop, top on phones). */
export function heroLayout(aspect: number) {
  return aspect < 1
    ? { pos: new THREE.Vector3(-1.05, -0.35, 0), scale: 0.5 }
    : // on screens narrower than the reference (≈2:1), shrink a little so the far pane
      // stays clear of the "Smarter Systems" line on the right
      { pos: new THREE.Vector3(0, -0.25 * (1 - Math.min(1, 0.4 + aspect * 0.29)), 0), scale: Math.min(1, 0.4 + aspect * 0.29) };
}

/** The hero's accent light, beside the light seam (hero-local; placed by Stage's WorldLights). */
export const HERO_LIGHT: [number, number, number] = [3.4, -0.4, 0.6];

/** The floating sphere; depth of field focuses here. */
export const HERO_FOCUS = new THREE.Vector3(1.75, -1.1, 0.6);
const SPHERE_R = 0.9;

const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3); // ease-out cubic
const easeInOut = (x: number) => {
  x = clamp01(x);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

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

/** Light on a pane: brightest along one vertical edge, fading across the glass. */
const paneLight = (fromRight: boolean) =>
  canvasTex(256, 16, (ctx) => {
    const g = ctx.createLinearGradient(fromRight ? 256 : 0, 0, fromRight ? 0 : 256, 0);
    g.addColorStop(0, "rgba(255,255,255,0.95)");
    g.addColorStop(0.12, "rgba(255,255,255,0.4)");
    g.addColorStop(0.55, "rgba(255,255,255,0.07)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 16);
  });

/** A vertical streak (floor reflections): soft sides, bright at the top, fading down. */
const streak = () => {
  const W = 64, H = 256;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(W, H);
  for (let y = 0; y < H; y++) {
    const v = Math.pow(1 - y / H, 2.2) * Math.min(1, y / (H * 0.06)); // soft start at the floor line, fading away from it
    for (let x = 0; x < W; x++) {
      const dx = (x - W / 2) / (W / 2);
      const a = Math.exp(-dx * dx * 5) * v; // soft gaussian sides
      const i = (y * W + x) * 4;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

/* ------------------------------------------------------------------ */
/* Panes                                                               */
/* ------------------------------------------------------------------ */

type Pane = {
  x: number;
  z: number;
  w: number;
  h: number;
  d: number; // thickness
  rotY: number;
  edge: [number, number]; // left / right edge brightness
  light?: "left" | "right"; // light spreading across the glass from that edge
  lightStrength?: number;
  delay: number;
};

// front block, main pane, narrow inner pane, far pane
const PANES: Pane[] = [
  { x: -0.3, z: 0.7, w: 1.8, h: 3.05, d: 0.06, rotY: -0.42, edge: [0.3, 0.9], light: "right", lightStrength: 0.18, delay: 0.3 },
  { x: 2.25, z: -0.35, w: 2.35, h: 5.95, d: 0.04, rotY: -0.55, edge: [0.35, 4.5], light: "right", lightStrength: 0.7, delay: 0.15 },
  { x: 3.55, z: -0.75, w: 0.5, h: 4.3, d: 0.04, rotY: -0.55, edge: [1.4, 0.6], light: "left", lightStrength: 0.35, delay: 0.45 },
  { x: 4.35, z: -1.1, w: 2.05, h: 6.3, d: 0.04, rotY: -0.62, edge: [0.8, 0.9], light: "left", lightStrength: 0.22, delay: 0.3 },
];

function PaneMesh({ p, glass, light }: { p: Pane; glass: THREE.Material; light: THREE.Texture | null }) {
  const group = useRef<THREE.Group>(null);
  const edges = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const lightMat = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(() => {
    const e = ease((heroClock.t - p.delay) / 1.4);
    if (group.current) {
      group.current.position.y = FLOOR_Y + p.h / 2 - (1 - e) * 0.6;
      group.current.visible = e > 0.001;
    }
    edges.current.forEach((m, i) => {
      if (m) m.color.setScalar((i < 2 ? p.edge[i] : 0.35) * e);
    });
    if (lightMat.current) lightMat.current.opacity = (p.lightStrength ?? 0) * e;
  });
  const { w, h, d } = p;
  return (
    <group ref={group} position={[p.x, FLOOR_Y + h / 2, p.z]} rotation={[0, p.rotY, 0]} visible={false}>
      <mesh material={glass}>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      {light && (
        <mesh position={[0, 0, d / 2 + 0.004]}>
          <planeGeometry args={[w, h]} />
          <meshBasicMaterial
            ref={lightMat}
            map={light}
            transparent
            opacity={0}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      )}
      {/* thin light along the left and right edges, and a faint top edge */}
      {(
        [
          [[-w / 2, 0, d / 2], [0.01, h, 0.01]],
          [[w / 2, 0, d / 2], [0.022, h, 0.022]],
          [[0, h / 2, d / 2], [w, 0.006, 0.006]],
        ] as [number, number, number][][]
      ).map(([pos, s], i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={s} />
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

/* ------------------------------------------------------------------ */
/* Sphere                                                              */
/* ------------------------------------------------------------------ */

function Sphere() {
  const group = useRef<THREE.Group>(null);
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
            vec3 n = normalize(vN);
            float facing = clamp(dot(n, normalize(vV)), 0.0, 1.0);
            float fres = pow(1.0 - facing, 4.0);
            // lit from the right-hand light seam: a crisp crescent on that edge, a whisper elsewhere
            float side = smoothstep(0.0, 0.95, dot(n.xy, normalize(vec2(1.0, 0.3))));
            float crescent = fres * (0.03 + 2.8 * side);
            // very soft body shading so it reads as a sphere, not a flat disc
            float body = 0.006 + 0.03 * pow(clamp(dot(n, normalize(vec3(0.7, 0.45, 0.55))), 0.0, 1.0), 3.0);
            gl_FragColor = vec4(vec3(body + crescent) * uReveal, 1.0);
          }`,
      }),
    [],
  );
  useFrame((state) => {
    const e = ease((heroClock.t - 0.55) / 1.6);
    if (group.current) {
      group.current.visible = e > 0.001;
      group.current.scale.setScalar(0.92 + 0.08 * e);
      // floats: rises into place, then breathes very slightly
      group.current.position.y = HERO_FOCUS.y - (1 - e) * 0.35 + Math.sin(state.clock.elapsedTime * 0.6) * 0.03 * e;
    }
    mat.uniforms.uReveal.value = e;
  });
  return (
    <group ref={group} position={HERO_FOCUS} visible={false}>
      <mesh material={mat}>
        <sphereGeometry args={[SPHERE_R, 96, 96]} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Orbit                                                               */
/* ------------------------------------------------------------------ */

const ORBIT = { cx: 1.2, cy: -0.45, rx: 5.55, ry: 1.02, tilt: 0.19, z: 0.2 };
const DOTS = [3.66, 4.05, 0.45]; // angles: two lower-left, one upper-right

function Orbit({ halo }: { halo: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const lineMat = useRef<THREE.LineBasicMaterial>(null);
  const dots = useRef<(THREE.Group | null)[]>([]);
  const geo = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints(
        new THREE.EllipseCurve(0, 0, ORBIT.rx, ORBIT.ry, 0, Math.PI * 2, false, 0).getPoints(320).map((v) => new THREE.Vector3(v.x, v.y, 0)),
      ),
    [],
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const e = easeInOut((heroClock.t - 0.9) / 1.8);
    if (group.current) {
      group.current.visible = e > 0.001;
      group.current.scale.set(0.9 + 0.1 * e, 0.9 + 0.1 * e, 1);
    }
    if (lineMat.current) lineMat.current.opacity = 0.5 * e;
    dots.current.forEach((d, i) => {
      if (!d) return;
      const a = DOTS[i] + t * 0.03;
      d.position.set(Math.cos(a) * ORBIT.rx, Math.sin(a) * ORBIT.ry, 0.01);
      d.scale.setScalar(Math.max(0.001, ease((heroClock.t - 1.5 - i * 0.15) / 0.8)));
    });
  });
  return (
    <group position={[ORBIT.cx, ORBIT.cy, ORBIT.z]} rotation={[0, 0, ORBIT.tilt]}>
      <group ref={group} visible={false}>
        <line>
          <primitive object={geo} attach="geometry" />
          <lineBasicMaterial ref={lineMat} color="#ffffff" transparent opacity={0} depthWrite={false} />
        </line>
        {DOTS.map((_, i) => (
          <group
            key={i}
            ref={(g) => {
              dots.current[i] = g;
            }}
          >
            <mesh>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial color={[2.6, 2.6, 2.6]} toneMapped={false} />
            </mesh>
            <sprite scale={0.34}>
              <spriteMaterial map={halo} transparent opacity={0.5} depthWrite={false} blending={THREE.AdditiveBlending} />
            </sprite>
          </group>
        ))}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Light: the seam between the panes, and where it meets the orbit      */
/* ------------------------------------------------------------------ */

function Seam({ halo }: { halo: THREE.Texture }) {
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const spark = useRef<THREE.SpriteMaterial>(null);
  // the main pane's right edge, in the scene
  const main = PANES[1];
  const edge = new THREE.Vector3(main.w / 2, 0, 0).applyEuler(new THREE.Euler(0, main.rotY, 0)).add(new THREE.Vector3(main.x, 0, main.z));
  useFrame(() => {
    const e = ease((heroClock.t - 0.4) / 1.6);
    if (glow.current) glow.current.opacity = 0.2 * e;
    if (spark.current) spark.current.opacity = 0.9 * ease((heroClock.t - 1.6) / 0.8);
  });
  return (
    <>
      <group position={[edge.x + 0.03, FLOOR_Y, edge.z + 0.02]}>
        <mesh position={[-0.3, main.h / 2, -0.1]} scale={[2.6, main.h * 1.1, 1]}>
          <planeGeometry />
          <meshBasicMaterial ref={glow} map={halo} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
        </mesh>
      </group>
      {/* the bright point where the orbit passes the inner pane */}
      <sprite position={[3.8, 0.98, -0.5]} scale={0.42}>
        <spriteMaterial ref={spark} map={halo} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Floor                                                               */
/* ------------------------------------------------------------------ */

function Floor({ halo, streakTex }: { halo: THREE.Texture; streakTex: THREE.Texture }) {
  const base = useRef<THREE.MeshBasicMaterial>(null);
  const pool = useRef<THREE.MeshBasicMaterial>(null);
  const sheen = useRef<THREE.MeshBasicMaterial>(null);
  const streaks = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  // a polished floor: a soft horizon sheen, a pool of light under the panes, and
  // vertical reflections of the lit edges (painted, not a mirror pass — that redraws the
  // whole scene every frame)
  const sheenTex = useMemo(
    () =>
      canvasTex(16, 256, (ctx) => {
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, "rgba(255,255,255,0)");
        g.addColorStop(0.08, "rgba(255,255,255,0.55)");
        g.addColorStop(0.35, "rgba(255,255,255,0.14)");
        g.addColorStop(1, "rgba(255,255,255,0.05)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 16, 256);
      }),
    [],
  );
  // floor opacity: solid near the viewer, fading out over the last stretch to the far edge
  const fade = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 4;
    c.height = 256;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, 0, 256); // top of the texture = far edge
    g.addColorStop(0, "#000");
    g.addColorStop(0.1, "#fff");
    g.addColorStop(1, "#fff");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 4, 256);
    return new THREE.CanvasTexture(c);
  }, []);
  const REFL: [number, number, number][] = [
    [3.02, 0.9, 2.6], // the light seam (over-bright: it's the strongest reflection)
    [3.6, 0.5, 0.5],
    [0.6, 0.5, 0.4], // front block's lit edge
    [1.8, 1.1, 0.2],
  ];
  useFrame(() => {
    const e = ease(heroClock.t / 1.6);
    const l = ease((heroClock.t - 0.5) / 1.8);
    if (base.current) base.current.opacity = e;
    if (sheen.current) sheen.current.opacity = 0.085 * e;
    if (pool.current) pool.current.opacity = 0.32 * l;
    streaks.current.forEach((m, i) => {
      if (m) m.color.setScalar(REFL[i][2] * l);
    });
  });
  return (
    <group position={[0, FLOOR_Y, 0]}>
      {/* the floor ends just behind the panes, like a stage: above it is the dark studio */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1, 0, 15.5]} renderOrder={-2}>
        <planeGeometry args={[60, 34]} />
        <meshBasicMaterial ref={base} color="#0d0d0e" alphaMap={fade} transparent opacity={0} depthWrite={false} />
      </mesh>
      {/* sheen: brightest along the far edge, fading toward the viewer */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2, 0.02, 6.5]} scale={[40, 16, 1]} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial ref={sheen} map={sheenTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.6, 0.04, 0.6]} scale={[7, 3.4, 1]} renderOrder={-1}>
        <planeGeometry />
        <meshBasicMaterial ref={pool} map={halo} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      {/* reflections: straight down beneath each lit edge, as on polished stone */}
      {REFL.map(([x, w], i) => (
        <mesh key={i} position={[x, -1.3, 1.2]} scale={[w, 2.6, 1]} renderOrder={5}>
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
  const group = useRef<THREE.Group>(null);

  // clear, very dark glass: the edges and the light carry the shape
  const glass = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#0a0a0b",
        metalness: 0.2,
        roughness: 0.05,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 0.55,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
        side: THREE.DoubleSide,
      }),
    [],
  );
  const halo = useMemo(() => radial(), []);
  const streakTex = useMemo(() => streak(), []);
  const lights = useMemo(() => ({ left: paneLight(false), right: paneLight(true) }), []);

  return (
    <group ref={group} name={WARMUP_HERO} position={layout.pos} scale={layout.scale}>
      <Floor halo={halo} streakTex={streakTex} />
      <Seam halo={halo} />
      {PANES.map((p, i) => (
        <PaneMesh key={i} p={p} glass={glass} light={p.light ? lights[p.light] : null} />
      ))}
      <Sphere />
      <Orbit halo={halo} />
      {/* its accent light lives in Stage's always-on WorldLights: a light that disappears
          with the hero would change the light count and force every shader to recompile */}
    </group>
  );
}
