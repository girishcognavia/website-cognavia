"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import type { Line2, LineSegments2 } from "three-stdlib";
import { clamp01, easeInCubic, easeOutCubic, interaction, motion, rng } from "./shared";

/** Globe radius (world units) */
const R = 2.1;

/** Where the globe sits. The camera ends section 2 at z = ABOUT_CAM_Z looking down -z. */
export const GLOBE_Z = -16;

/** Object name the Stage uses to pre-render this world while the page loads. */
export const WARMUP_GLOBE = "warmup:globe";

/** Returns the globe's world position + scale for the current viewport. */
export function globeLayout(aspect: number) {
  return aspect < 1
    ? { pos: new THREE.Vector3(0, 1.9, GLOBE_Z), scale: 0.6 }
    : { pos: new THREE.Vector3(3.4, 0, GLOBE_Z), scale: 1 };
}

/**
 * Assembly progress of section 2: 0 while the hero still owns the screen,
 * 1 by the time the section has scrolled fully into view (about ≈ 0.6).
 * `delay` staggers individual parts.
 */
const assembly = (delay = 0, span = 0.42) =>
  easeOutCubic(clamp01((motion.a - delay) / span)) * (1 - dispersal());

/**
 * 0 → 1 as section 3 arrives: the globe breaks apart again, its pieces flying back out
 * past the camera while it flies on toward the product cards.
 */
const dispersal = () => easeInCubic(clamp01((motion.g - 0.04) / 0.36));

/* ------------------------------------------------------------------ */

function useDotTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d")!;
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,0.9)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }, []);
}

/** Cheap smooth pseudo-continents on the unit sphere. */
function land(p: THREE.Vector3) {
  return (
    Math.sin(p.x * 2.3 + 0.5) * Math.cos(p.y * 2.9 - 0.3) +
    Math.sin(p.z * 2.1 + p.x * 1.7) * 0.8 +
    Math.sin(p.y * 5.3 + p.z * 4.1) * 0.35
  );
}

function fibonacciSphere(n: number) {
  const pts: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const th = golden * i;
    pts.push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
  }
  return pts;
}

/** Dark glass core + dotted continents + glowing network. Spins slowly. */
function Core() {
  const group = useRef<THREE.Group>(null);
  const dot = useDotTexture();

  const { landGeo, netGeo, nodeGeo } = useMemo(() => {
    const all = fibonacciSphere(11000);
    const landPts = all.filter((p) => land(p) > 0.25);

    const landGeo = new THREE.BufferGeometry().setFromPoints(landPts.map((p) => p.clone().multiplyScalar(R * 1.004)));

    // Network nodes on land, connected to their nearest neighbours with arcs hugging the surface.
    const rand = rng(31);
    const nodes: THREE.Vector3[] = [];
    while (nodes.length < 46) {
      const p = landPts[Math.floor(rand() * landPts.length)];
      if (nodes.every((q) => q.distanceTo(p) > 0.22)) nodes.push(p);
    }
    const seg: THREE.Vector3[] = [];
    const seen = new Set<string>();
    nodes.forEach((a, i) => {
      nodes
        .map((b, j) => ({ j, d: a.distanceTo(b) }))
        .filter((o) => o.j !== i && o.d < 0.62)
        .sort((x, y) => x.d - y.d)
        .slice(0, 3)
        .forEach(({ j }) => {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (seen.has(key)) return;
          seen.add(key);
          const b = nodes[j];
          const steps = 10;
          for (let s = 0; s < steps; s++) {
            const p0 = a.clone().lerp(b, s / steps).normalize().multiplyScalar(R * 1.012);
            const p1 = a.clone().lerp(b, (s + 1) / steps).normalize().multiplyScalar(R * 1.012);
            seg.push(p0, p1);
          }
        });
    });
    const netGeo = new THREE.BufferGeometry().setFromPoints(seg);
    const nodeGeo = new THREE.BufferGeometry().setFromPoints(nodes.map((p) => p.clone().multiplyScalar(R * 1.014)));
    return { landGeo, netGeo, nodeGeo };
  }, []);

  const rimMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        uniforms: { uOpacity: { value: 0 } },
        vertexShader: /* glsl */ `
          varying vec3 vN; varying vec3 vV;
          void main() {
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vN = normalize(normalMatrix * normal);
            vV = normalize(-mv.xyz);
            gl_Position = projectionMatrix * mv;
          }`,
        fragmentShader: /* glsl */ `
          uniform float uOpacity; varying vec3 vN; varying vec3 vV;
          void main() {
            // clamp: rounding can push the base below 0, and pow(negative) is NaN,
            // which the bloom pass would smear across the whole screen as black
            float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.5);
            gl_FragColor = vec4(vec3(1.0), f * 0.55 * uOpacity);
          }`,
      }),
    [],
  );

  const landMat = useRef<THREE.PointsMaterial>(null);
  const netMat = useRef<THREE.LineBasicMaterial>(null);
  const nodeMat = useRef<THREE.PointsMaterial>(null);

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    const e = assembly(0.08);
    const lit = assembly(0.22, 0.3); // continents + network switch on after the core forms
    g.scale.setScalar(0.15 + 0.85 * e);
    g.rotation.y = motion.t * 0.05 + (1 - e) * -2.4;
    g.rotation.x = 0.28;
    rimMat.uniforms.uOpacity.value = e;
    if (landMat.current) landMat.current.opacity = 0.7 * lit;
    if (netMat.current) netMat.current.opacity = 0.4 * lit;
    if (nodeMat.current) nodeMat.current.opacity = lit;
  });

  return (
    <group ref={group}>
      <mesh>
        <sphereGeometry args={[R, 96, 96]} />
        <meshPhysicalMaterial color="#060606" roughness={0.22} metalness={0.3} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={0.35} />
      </mesh>
      <mesh scale={1.035} material={rimMat}>
        <sphereGeometry args={[R, 64, 64]} />
      </mesh>
      <points geometry={landGeo}>
        <pointsMaterial ref={landMat} map={dot} size={0.028} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </points>
      <lineSegments geometry={netGeo}>
        <lineBasicMaterial ref={netMat} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      <points geometry={nodeGeo}>
        <pointsMaterial
          ref={nodeMat}
          map={dot}
          size={0.09}
          color={[2.2, 2.2, 2.2]}
          toneMapped={false}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */




/* ------------------------------------------------------------------ */

function Rings() {
  const group = useRef<THREE.Group>(null);
  const lines = useRef<(Line2 | LineSegments2 | null)[]>([]);
  const travellers = useRef<(THREE.Mesh | null)[]>([]);
  const dotted = useRef<THREE.PointsMaterial>(null);
  const dot = useDotTexture();

  const rings = useMemo(
    () =>
      [
        { r: 4.5, rot: [1.33, 0.08, 0.2] as const, o: 0.6 },
        { r: 3.5, rot: [1.2, -0.1, -0.32] as const, o: 0.3 },
      ].map((ring) => ({
        ...ring,
        points: new THREE.EllipseCurve(0, 0, ring.r, ring.r, 0, Math.PI * 2, false, 0)
          .getPoints(200)
          .map((v) => new THREE.Vector3(v.x, v.y, 0)),
      })),
    [],
  );

  const dottedGeo = useMemo(() => {
    const pts = new THREE.EllipseCurve(0, 0, 3.95, 3.95, 0, Math.PI * 2, false, 0)
      .getPoints(140)
      .map((v) => new THREE.Vector3(v.x, v.y, 0));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame(() => {
    const e = assembly(0.14, 0.36);
    if (group.current) group.current.scale.setScalar(0.35 + 0.65 * e);
    lines.current.forEach((l, i) => {
      if (l) l.material.opacity = rings[i].o * e;
    });
    if (dotted.current) dotted.current.opacity = 0.5 * e;
    // small bright satellites riding the main ring
    travellers.current.forEach((m, i) => {
      if (!m) return;
      const a = motion.t * (0.18 + i * 0.05) + i * 2.1;
      m.position.set(Math.cos(a) * rings[0].r, Math.sin(a) * rings[0].r, 0);
      m.scale.setScalar(e);
    });
  });

  return (
    <group ref={group}>
      {rings.map((ring, i) => (
        <group key={i} rotation={ring.rot as unknown as [number, number, number]}>
          <Line
            ref={(l) => {
              lines.current[i] = l;
            }}
            points={ring.points}
            color="#ffffff"
            lineWidth={1.2}
            transparent
            opacity={0}
          />
          {i === 0 &&
            [0, 1, 2].map((k) => (
              <mesh
                key={k}
                ref={(m) => {
                  travellers.current[k] = m;
                }}
              >
                <sphereGeometry args={[0.028, 12, 12]} />
                <meshBasicMaterial color={[1.5, 1.5, 1.5]} toneMapped={false} />
              </mesh>
            ))}
        </group>
      ))}
      <points geometry={dottedGeo} rotation={[1.45, 0.2, 0.55]}>
        <pointsMaterial ref={dotted} map={dot} size={0.05} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </points>
    </group>
  );
}

/* ------------------------------------------------------------------ */

const ORBS: { p: [number, number, number]; r: number }[] = [
  { p: [-3.2, 1.9, 0.6], r: 0.3 },
  { p: [-2.3, -0.9, 1.4], r: 0.13 },
  { p: [-1.6, -1.6, 1.8], r: 0.17 },
  { p: [-1.9, 1.0, 1.6], r: 0.2 },
  { p: [3.4, -2.3, 0.4], r: 0.13 },
  { p: [4.2, 1.6, -0.6], r: 0.1 },
  { p: [-0.6, -2.7, 1.3], r: 0.09 },
  { p: [-3.8, 0.5, 0.2], r: 0.05 },
  { p: [0.8, 2.9, -0.5], r: 0.05 },
];

function Orbs() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    ORBS.forEach((o, i) => {
      const m = refs.current[i];
      if (!m) return;
      const e = assembly(0.1 + i * 0.015, 0.4);
      const k = 1 + (1 - e) * 3.5;
      m.position.set(o.p[0] * k, o.p[1] * k + Math.sin(motion.t * 0.7 + i) * 0.06, o.p[2] + (1 - e) * 9);
    });
  });
  return (
    <>
      {ORBS.map((o, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
        >
          <sphereGeometry args={[o.r, 32, 32]} />
          <meshStandardMaterial color="#efefef" roughness={0.22} metalness={0.05} />
        </mesh>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */



/* ------------------------------------------------------------------ */

export default function GlobeWorld() {
  const root = useRef<THREE.Group>(null);
  const tilt = useRef<THREE.Group>(null);
  const size = useThree((s) => s.size);
  const layout = useMemo(() => globeLayout(size.width / size.height), [size]);

  useFrame((state, dt) => {
    const g = root.current;
    if (!g) return;
    g.visible = motion.a > 0.005 && dispersal() < 0.995;
    // as the camera flies on to the products, the globe drifts away to the side instead of looming past
    const d = dispersal();
    g.position.set(layout.pos.x + d * 6 * layout.scale, layout.pos.y + d * 1.5 * layout.scale, layout.pos.z - d * 4);
    if (tilt.current) {
      // pointer parallax, plus the background drag (shared with the star field's rings)
      tilt.current.rotation.y = THREE.MathUtils.damp(tilt.current.rotation.y, state.pointer.x * 0.12 + interaction.rotY, 4, dt);
      tilt.current.rotation.x = THREE.MathUtils.damp(tilt.current.rotation.x, -state.pointer.y * 0.08 + interaction.rotX, 4, dt);
    }
  });

  return (
    <group ref={root} name={WARMUP_GLOBE} position={layout.pos} scale={layout.scale} visible={false}>
      <group ref={tilt}>
        <Core />
        <Rings />
        <Orbs />
      </group>
    </group>
  );
}
