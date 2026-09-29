"use client";

import { type ComponentRef, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Line, MeshReflectorMaterial, RoundedBox } from "@react-three/drei";
import type { Line2, LineSegments2 } from "three-stdlib";
import { TEAM } from "@/components/team/teamData";
import { makePortraitTexture, makeTeamCardTexture } from "./teamTextures";
import { clamp01, easeOutCubic, easeOutExpo, motion, rng } from "./shared";

/** Where the team stage sits. The camera ends section 4 at z ≈ TEAM_Z + 14. */
export const TEAM_Z = -52.5;

/** Object name the Stage uses to pre-render this world while the page loads. */
export const WARMUP_TEAM = "warmup:team";

const CARD_W = 5.3;
const CARD_H = CARD_W * (880 / 1200);
const CARD_D = 0.1;
const CARD_R = 0.16;

/** Over-bright white (above 1.0) so the bloom pass turns these lines into a glow. */
const GLOW = new THREE.Color(2.2, 2.2, 2.2);
const EDGE_GLOW = new THREE.Color(1.8, 1.8, 1.8);

/** Portrait bubble: centred high on the card so it breaks out above the top edge. */
export const BUBBLE = new THREE.Vector3(-0.3, 1.2, 0.75);
const BUBBLE_R = 1.22;
/** In-plane roll of the portrait orbit (shared with the star halo in StarField). */
export const ORBIT_ROLL = -0.56;

type CardPose = { pos: [number, number, number]; rotY: number };

export function teamLayout(aspect: number) {
  return aspect < 1
    ? {
        pos: new THREE.Vector3(0, -1.1, TEAM_Z),
        scale: 0.5,
        cards: [
          { pos: [0, 2.2, 0], rotY: 0 },
          { pos: [0, -2.9, 0], rotY: 0 },
        ] as CardPose[],
        floorY: -5.4,
      }
    : {
        pos: new THREE.Vector3(0, -0.75, TEAM_Z),
        scale: 1,
        cards: [
          { pos: [-3.25, -0.3, 0], rotY: 0.13 },
          { pos: [3.25, -0.3, 0], rotY: -0.13 },
        ] as CardPose[],
        floorY: -2.6,
      };
}

/** Team stage assembly: 0 → 1 while section 4 scrolls into place. `delay` staggers parts. */
const assembly = (delay = 0, span = 0.4) => easeOutCubic(clamp01((motion.m - delay) / span));
/** Ease with a soft overshoot, for things that land and settle. */
const easeOutBack = (x: number, s = 1.25) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);

/* ------------------------------------------------------------------ */
/* Materials + helpers                                                 */
/* ------------------------------------------------------------------ */

function useGlass(opts: { color?: string; opacity: number; env: number; roughness?: number; flat?: boolean }) {
  const { color = "#ffffff", opacity, env, roughness = 0.06, flat = false } = opts;
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color,
        roughness,
        metalness: 0.1,
        transparent: true,
        opacity,
        clearcoat: 1,
        clearcoatRoughness: 0.03,
        envMapIntensity: env,
        flatShading: flat,
        depthWrite: false,
      }),
    [color, opacity, env, roughness, flat],
  );
}

function roundedRectPoints(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  // dense points so corner segments can be sliced out smoothly
  return s.getSpacedPoints(400).map((p) => new THREE.Vector3(p.x, p.y, 0));
}

/** Contiguous run of rim points near one corner — used for the glowing corner glints. */
function cornerRun(points: THREE.Vector3[], cx: number, cy: number, reach: number) {
  return points.filter((p) => Math.hypot(p.x - cx, p.y - cy) < reach);
}

/**
 * Glass-sphere rim: a fresnel edge that is much brighter on one side (a crescent of light),
 * like the light catching the portrait bubbles in the reference.
 */
function useCrescentMaterial() {
  return useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
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
            vec3 n = normalize(vN);
            // clamp: pow() of a slightly negative base is NaN, which bloom would smear
            float fres = pow(clamp(1.0 - abs(dot(n, normalize(vV))), 0.0, 1.0), 3.0);
            float side = smoothstep(-0.15, 0.85, dot(n.xy, normalize(vec2(-1.0, -0.25))));
            gl_FragColor = vec4(vec3(1.0), fres * (0.18 + 1.35 * side) * uOpacity);
          }`,
      }),
    [],
  );
}

/* ------------------------------------------------------------------ */
/* Leader card                                                         */
/* ------------------------------------------------------------------ */


function LeaderCard({ index, pose, floorY }: { index: number; pose: CardPose; floorY: number }) {
  const leader = TEAM[index];
  const group = useRef<THREE.Group>(null);
  const bubble = useRef<THREE.Group>(null);
  const rimLine = useRef<Line2 | LineSegments2 | null>(null);
  const glints = useRef<(Line2 | LineSegments2 | null)[]>([]);
  const orbitLine = useRef<Line2 | LineSegments2 | null>(null);
  const riders = useRef<(THREE.Mesh | null)[]>([]);
  const portraitMat = useRef<THREE.MeshBasicMaterial>(null);

  const cardTex = useMemo(() => makeTeamCardTexture(leader), [leader]);
  const portraitTex = useMemo(() => makePortraitTexture(leader), [leader]);
  const faceMat = useMemo(
    () =>
      // depthWrite stays on: depth of field reads the depth buffer, and without the card's
      // depth it would treat the text as the far background and blur it
      new THREE.MeshBasicMaterial({ map: cardTex, transparent: true, alphaTest: 0.02, toneMapped: false }),
    [cardTex],
  );
  // near-black glass: it shows only reflections, never a flat gray fill
  const cardGlass = useGlass({ color: "#0c0c0c", opacity: 0.55, env: 1.6, roughness: 0.04 });
  const bubbleGlass = useGlass({ opacity: 0.04, env: 2.4 });
  const shellGlass = useGlass({ opacity: 0.02, env: 1.2 });
  const crescent = useCrescentMaterial();

  const rim = useMemo(() => roundedRectPoints(CARD_W - 0.01, CARD_H - 0.01, CARD_R), []);
  const corners = useMemo(
    () => [
      cornerRun(rim, CARD_W / 2, CARD_H / 2, 0.75), // top right
      cornerRun(rim, CARD_W / 2, -CARD_H / 2, 0.75), // bottom right
      cornerRun(rim, -CARD_W / 2, CARD_H / 2, 0.45), // top left (softer)
    ],
    [rim],
  );
  const orbit = useMemo(
    () =>
      new THREE.EllipseCurve(0, 0, 2.3, 2.3, 0, Math.PI * 2, false, 0)
        .getPoints(200)
        .map((v) => new THREE.Vector3(v.x, v.y, 0)),
    [],
  );
  const home = useMemo(() => new THREE.Vector3(...pose.pos), [pose]);
  const tilt = useRef({ x: 0, y: 0 });

  useFrame((state, dt) => {
    const g = group.current;
    if (!g) return;
    const t = motion.t;
    // cards rise up out of the stage floor, tilted back, and settle with a soft overshoot
    const raw = clamp01((motion.m - 0.16 - index * 0.07) / 0.4);
    const e = easeOutBack(raw, 0.9);
    const k = 1 - easeOutCubic(raw);
    tilt.current.x = THREE.MathUtils.damp(tilt.current.x, -state.pointer.y * 0.05, 3, dt);
    tilt.current.y = THREE.MathUtils.damp(tilt.current.y, state.pointer.x * 0.06, 3, dt);

    const riseFrom = floorY - CARD_H * 0.9;
    g.position.set(home.x, THREE.MathUtils.lerp(riseFrom, home.y, e), home.z + k * 1.2);
    g.position.y += Math.sin(state.clock.elapsedTime * 0.7 + index * 2) * 0.035 * raw;
    g.rotation.set(
      -0.55 * k + tilt.current.x * raw,
      pose.rotY * (1 - k) + (index ? -0.5 : 0.5) * k + tilt.current.y * raw,
      0,
    );

    // rim + glowing corner glints fade up as the card lands
    const lit = easeOutCubic(clamp01((motion.m - 0.3 - index * 0.07) / 0.25));
    if (rimLine.current) rimLine.current.material.opacity = 0.45 * lit;
    glints.current.forEach((l, i) => {
      if (l) l.material.opacity = (i === 2 ? 0.55 : 1) * lit * (0.85 + 0.15 * Math.sin(t * 1.6 + i * 1.7 + index));
    });

    // portrait bubble blooms out of the card
    const b = easeOutExpo(clamp01((motion.m - 0.34 - index * 0.06) / 0.3));
    if (bubble.current) bubble.current.scale.setScalar(Math.max(0.001, b));
    crescent.uniforms.uOpacity.value = b;
    if (portraitMat.current) portraitMat.current.opacity = b;
    if (orbitLine.current) orbitLine.current.material.opacity = 0.6 * b;
    riders.current.forEach((m, r) => {
      if (!m) return;
      const a = t * (0.3 + r * 0.1) + r * Math.PI * 0.9;
      m.position.set(Math.cos(a) * 2.3, Math.sin(a) * 2.3, 0);
    });

  });

  return (
    <group ref={group}>
      {/* dark glass slab + see-through printed face */}
      <RoundedBox args={[CARD_W, CARD_H, CARD_D]} radius={CARD_R} smoothness={4} material={cardGlass} />
      <mesh position={[0, 0, CARD_D / 2 + 0.002]} material={faceMat} renderOrder={2}>
        <planeGeometry args={[CARD_W, CARD_H]} />
      </mesh>
      <Line
        ref={rimLine}
        points={rim}
        position={[0, 0, CARD_D / 2 + 0.004]}
        color="#ffffff"
        lineWidth={1.1}
        transparent
        opacity={0}
        toneMapped={false}
      />
      {corners.map((pts, i) => (
        <Line
          key={i}
          ref={(l) => {
            glints.current[i] = l;
          }}
          points={pts}
          position={[0, 0, CARD_D / 2 + 0.006]}
          color={GLOW}
          lineWidth={2.6}
          transparent
          opacity={0}
          toneMapped={false}
        />
      ))}

      {/* portrait bubble: photo disc inside a clear glass sphere, a faint second shell behind */}
      <group ref={bubble} position={BUBBLE}>
        <mesh position={[0.42, 0.12, -0.45]} material={shellGlass}>
          <sphereGeometry args={[BUBBLE_R * 1.08, 48, 48]} />
        </mesh>
        <mesh position={[0, 0, -0.02]}>
          <circleGeometry args={[BUBBLE_R * 0.93, 96]} />
          <meshBasicMaterial ref={portraitMat} map={portraitTex} transparent opacity={0} toneMapped={false} />
        </mesh>
        <mesh material={bubbleGlass}>
          <sphereGeometry args={[BUBBLE_R, 64, 64]} />
        </mesh>
        <mesh material={crescent} scale={1.015}>
          <sphereGeometry args={[BUBBLE_R, 64, 64]} />
        </mesh>
        {/* rolled so the ring's right end dips below the role pill in the top-right corner */}
        <group rotation={[0, 0, ORBIT_ROLL]}>
        <group rotation={[1.36, 0.18, 0.16]}>
          <Line ref={orbitLine} points={orbit} color="#ffffff" lineWidth={1.2} transparent opacity={0} />
          {[0, 1].map((r) => (
            <mesh
              key={r}
              ref={(m) => {
                riders.current[r] = m;
              }}
            >
              <sphereGeometry args={[0.11, 24, 24]} />
              <meshStandardMaterial color="#111111" roughness={0.12} metalness={1} envMapIntensity={2.5} />
            </mesh>
          ))}
        </group>
        </group>
        {/* small glossy black beads beside the bubble */}
        <mesh position={[-1.15, 0.95, 0.35]}>
          <sphereGeometry args={[0.13, 24, 24]} />
          <meshStandardMaterial color="#111111" roughness={0.12} metalness={1} envMapIntensity={2.5} />
        </mesh>
        <mesh position={[1.25, -0.55, 0.5]}>
          <sphereGeometry args={[0.08, 20, 20]} />
          <meshStandardMaterial color="#111111" roughness={0.12} metalness={1} envMapIntensity={2.5} />
        </mesh>
      </group>

    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Stage: reflective floor, glowing platform edge, sweeping lines       */
/* ------------------------------------------------------------------ */

export const PLATFORM_R = 9;
export const PLATFORM_Z = -6.2;

function StageFloor({ y }: { y: number }) {
  const group = useRef<THREE.Group>(null);
  const floorMat = useRef<ComponentRef<typeof MeshReflectorMaterial>>(null);
  const edge = useRef<(Line2 | LineSegments2 | null)[]>([]);
  const sweeps = useRef<(Line2 | LineSegments2 | null)[]>([]);

  const edgePts = useMemo(
    () =>
      // front edge only: the back half would show through the see-through cards
      new THREE.EllipseCurve(0, 0, PLATFORM_R, PLATFORM_R, Math.PI * 0.06, Math.PI * 0.94, false, 0)
        .getPoints(200)
        .map((v) => new THREE.Vector3(v.x, 0, v.y)),
    [],
  );
  const sweepPts = useMemo(
    () => [
      // curve threading behind both cards and through the gap between them
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-13, 0.2, -4),
        new THREE.Vector3(-6.5, 1.6, -2.2),
        new THREE.Vector3(-1.2, -0.1, -1.4),
        new THREE.Vector3(1.6, 0.6, -1.6),
        new THREE.Vector3(6.5, 2.2, -2.4),
        new THREE.Vector3(13, 1.4, -4),
      ]).getPoints(160),
      // big faint arc high behind the heading
      new THREE.EllipseCurve(0, 0, 16, 5, Math.PI * 0.05, Math.PI * 0.95, false, 0)
        .getPoints(160)
        .map((v) => new THREE.Vector3(v.x, v.y - 1.5, -9)),
    ],
    [],
  );

  useFrame(() => {
    const e = assembly(0.08, 0.45);
    if (group.current) {
      group.current.position.y = y - (1 - e) * 1.5;
      group.current.scale.setScalar(0.75 + 0.25 * e);
    }
    if (floorMat.current) floorMat.current.opacity = e;
    edge.current.forEach((l, i) => {
      if (l) l.material.opacity = (i ? 0.25 : 0.85) * e;
    });
    const s = assembly(0.25, 0.4);
    sweeps.current.forEach((l, i) => {
      if (l) l.material.opacity = (i ? 0.12 : 0.32) * s;
    });
  });

  return (
    <>
      <group ref={group} position={[0, y, 0]}>
        {/* glossy black stage that actually reflects the cards */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, PLATFORM_Z]}>
          <circleGeometry args={[PLATFORM_R, 128]} />
          <MeshReflectorMaterial
            ref={floorMat}
            resolution={512}
            blur={[260, 80]}
            mixBlur={1}
            mixStrength={2.2}
            mixContrast={1.1}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            color="#050505"
            metalness={0.6}
            roughness={0.9}
            envMapIntensity={0}
            transparent
            opacity={0}
          />
        </mesh>
        {/* bright platform edge, plus a softer lower lip */}
        <Line
          ref={(l) => {
            edge.current[0] = l;
          }}
          points={edgePts}
          position={[0, 0.01, PLATFORM_Z]}
          color={EDGE_GLOW}
          lineWidth={1.8}
          transparent
          opacity={0}
          toneMapped={false}
        />
        <Line
          ref={(l) => {
            edge.current[1] = l;
          }}
          points={edgePts}
          position={[0, -0.12, PLATFORM_Z]}
          color="#ffffff"
          lineWidth={1}
          transparent
          opacity={0}
        />
      </group>
      {sweepPts.map((pts, i) => (
        <Line
          key={i}
          ref={(l) => {
            sweeps.current[i] = l;
          }}
          points={pts}
          color="#ffffff"
          lineWidth={i ? 1 : 1.3}
          transparent
          opacity={0}
        />
      ))}
    </>
  );
}


/* ------------------------------------------------------------------ */

export default function TeamWorld() {
  const root = useRef<THREE.Group>(null);
  const size = useThree((s) => s.size);
  const layout = useMemo(() => teamLayout(size.width / size.height), [size]);

  useFrame(() => {
    if (root.current) root.current.visible = motion.m > 0.1;
  });

  return (
    <group ref={root} name={WARMUP_TEAM} position={layout.pos} scale={layout.scale} visible={false}>
      <StageFloor y={layout.floorY} />
      {TEAM.map((_, i) => (
        <LeaderCard key={i} index={i} pose={layout.cards[i]} floorY={layout.floorY} />
      ))}
    </group>
  );
}
