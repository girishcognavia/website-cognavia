"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { Line, RoundedBox } from "@react-three/drei";
import type { Line2, LineSegments2 } from "three-stdlib";
import { PRODUCTS } from "@/components/products/productsData";
import { productStore } from "@/components/products/productStore";
import { PRODUCTS_SETTLE } from "./scrollState";
import { makeCardTexture } from "./cardTextures";
import { clamp01, easeInCubic, easeOutCubic, easeOutExpo, motion, rng } from "./shared";

/** Where the card queue sits. The camera ends section 3 at z ≈ PRODUCTS_Z + 14. */
export const PRODUCTS_Z = -34.5;

/** Object name the Stage uses to pre-render this world while the page loads. */
export const WARMUP_PRODUCTS = "warmup:products";

export function productsLayout(aspect: number) {
  return aspect < 1
    ? { pos: new THREE.Vector3(0.1, -0.7, PRODUCTS_Z), scale: 0.36 }
    : { pos: new THREE.Vector3(2.6, -0.45, PRODUCTS_Z), scale: 1 };
}

const CARD_W = 4.9;
const CARD_H = 3.3;
const CARD_D = 0.12;
const CARD_R = 0.14;
/** Glass border visible around the printed card face. */
const BORDER = 0.09;

/** Resting "queue" pose of card i (0 = front): stepping up and to the right, into the scene. */
export const queuePos = (i: number) => new THREE.Vector3(-3.3 + i * 2.1, -1.75 + i * 1.22, -i * 1.5);
/** How far a hovered card rises out of the queue. */
export const LIFT = new THREE.Vector3(0.35, 1.05, 1.1);
const QUEUE_ROT = new THREE.Euler(-0.1, -0.42, -0.1);

/** Centre of the light burst, behind the middle of the queue (local coords). */
const BURST = new THREE.Vector3(0.4, 0.3, -3.8);

/**
 * 0 → 1 as section 4 arrives: the queue breaks up again — cards fly back out past the
 * camera and the burst fades as it expands — while the camera flies on to the team.
 */
const exit = () => easeInCubic(clamp01((motion.m - 0.04) / 0.36));
/**
 * Card i's entry: 0 → 1 once the camera has flown past the globe. The cards are born small,
 * deep inside the star vortex, and fan out along the star stream into the queue.
 */
const cardEnter = (i: number) => easeOutCubic(clamp01((motion.g - 0.2 - i * 0.05) / 0.36));
/** Card i's exit: 0 → 1 as section 4 arrives — the cards fly back out past the camera. */
const cardLeave = (i: number) => easeInCubic(clamp01((motion.m - 0.03 - (3 - i) * 0.03) / 0.34));
/** The backdrop explosion: rays, glass and sparks burst out as the section lands. */
const burst = (delay = 0.18) => easeOutExpo(clamp01((motion.g - delay - 0.04) / 0.45));
/** Hover only once the queue has settled, and not while it is leaving. */
const interactive = () => motion.g > PRODUCTS_SETTLE * 0.9 && motion.m < 0.02;

/* ------------------------------------------------------------------ */
/* Shared textures + materials                                         */
/* ------------------------------------------------------------------ */

function canvasTexture(w: number, h: number, paint: (ctx: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  paint(c.getContext("2d")!);
  return new THREE.CanvasTexture(c);
}

function useFxTextures() {
  return useMemo(() => {
    // light ray: bright at its root, fading along its length and across its width
    const ray = canvasTexture(512, 64, (ctx) => {
      const along = ctx.createLinearGradient(0, 0, 512, 0);
      along.addColorStop(0, "rgba(255,255,255,0)");
      along.addColorStop(0.08, "rgba(255,255,255,1)");
      along.addColorStop(0.45, "rgba(255,255,255,0.55)");
      along.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = along;
      ctx.fillRect(0, 0, 512, 64);
      ctx.globalCompositeOperation = "destination-in";
      const across = ctx.createLinearGradient(0, 0, 0, 64);
      across.addColorStop(0, "rgba(0,0,0,0)");
      across.addColorStop(0.5, "rgba(0,0,0,1)");
      across.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = across;
      ctx.fillRect(0, 0, 512, 64);
    });
    // soft glow behind the queue
    const glow = canvasTexture(256, 256, (ctx) => {
      const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(0.25, "rgba(255,255,255,0.25)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, 256, 256);
    });
    return { ray, glow };
  }, []);
}

function useGlassMaterial(opacity: number) {
  return useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ffffff",
        roughness: 0.1,
        metalness: 0.05,
        transparent: true,
        opacity,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
        envMapIntensity: 2.6,
        depthWrite: false,
      }),
    [opacity],
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
  return s.getPoints(12).map((p) => new THREE.Vector3(p.x, p.y, 0));
}

/* ------------------------------------------------------------------ */
/* Cards                                                               */
/* ------------------------------------------------------------------ */

function Card({ index, glass }: { index: number; glass: THREE.Material }) {
  const moving = useRef<THREE.Group>(null);
  const rimRef = useRef<Line2 | LineSegments2 | null>(null);
  const tex = useMemo(() => makeCardTexture(PRODUCTS[index], index), [index]);
  const faceMat = useMemo(
    () => new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.5, toneMapped: false }),
    [tex],
  );
  const rim = useMemo(() => roundedRectPoints(CARD_W - 0.01, CARD_H - 0.01, CARD_R), []);

  const home = useMemo(() => queuePos(index), [index]);
  const from = useMemo(() => {
    const rand = rng(300 + index);
    return {
      // birth: small, deep in the vortex behind the queue (hidden by distance fog until the camera nears)
      birth: BURST.clone().lerp(home, 0.25).add(new THREE.Vector3(0, 0, -7 - index * 1.2)),
      // exit: out past the camera
      away: home.clone().add(new THREE.Vector3((rand() - 0.5) * 16, (rand() - 0.3) * 10, 11 + rand() * 6)),
      rot: new THREE.Euler((rand() - 0.5) * 0.9, (rand() - 0.5) * 1.1, (rand() - 0.5) * 0.6),
    };
  }, [home, index]);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  const lift = useRef(0); // 0 resting in queue, 1 lifted out
  const dim = useRef(0); // another card is lifted

  useFrame((state, dt) => {
    const g = moving.current;
    if (!g) return;
    const enter = cardEnter(index);
    const leave = cardLeave(index);
    const e = enter * (1 - leave);
    const active = productStore.get();
    lift.current = THREE.MathUtils.damp(lift.current, active === index ? 1 : 0, 7, dt);
    dim.current = THREE.MathUtils.damp(dim.current, active !== -1 && active !== index ? 1 : 0, 6, dt);
    const L = lift.current;
    const float = Math.sin(state.clock.elapsedTime * 0.8 + index * 1.4) * 0.04;

    // emerge from the vortex along a gentle arc, settle into the queue; on exit, fly past the camera
    g.position.lerpVectors(from.birth, home, enter);
    g.position.y += Math.sin(enter * Math.PI) * 0.9;
    g.position.lerp(scratch.copy(from.away), leave);
    g.scale.setScalar(0.18 + 0.82 * easeOutCubic(enter));
    g.position.x += L * LIFT.x;
    g.position.y += float + L * LIFT.y;
    g.position.z += L * LIFT.z - dim.current * 0.35;
    const k = Math.max(1 - enter, leave);
    g.rotation.set(
      QUEUE_ROT.x + from.rot.x * k + L * 0.06,
      QUEUE_ROT.y + from.rot.y * k + L * 0.18,
      QUEUE_ROT.z + from.rot.z * k + L * 0.04,
    );
    faceMat.color.setScalar(1 - dim.current * 0.55);
    // glowing rim: brighter on the lifted card
    if (rimRef.current) rimRef.current.material.opacity = (0.55 + 0.45 * L) * (1 - dim.current * 0.6) * e;
  });

  const over = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    if (!interactive()) return;
    productStore.set(index);
    (e.nativeEvent.target as HTMLElement).style.cursor = "pointer";
  };
  const out = (e: ThreeEvent<PointerEvent>) => {
    if (productStore.get() === index) productStore.set(-1);
    (e.nativeEvent.target as HTMLElement).style.cursor = "grab";
  };
  const click = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (!interactive()) return;
    productStore.set(productStore.get() === index ? -1 : index); // tap to toggle on touch screens
  };

  return (
    <group onPointerOver={over} onPointerOut={out} onClick={click}>
      {/* static hit area at the queue position, so a lifting card doesn't flicker out from under the cursor */}
      <mesh position={home} rotation={QUEUE_ROT}>
        <planeGeometry args={[CARD_W, CARD_H]} />
        <meshBasicMaterial visible={false} />
      </mesh>
      <group ref={moving}>
        {/* frosted glass slab; its edges catch the environment light */}
        <RoundedBox args={[CARD_W, CARD_H, CARD_D]} radius={CARD_R} smoothness={4} material={glass} />
        <mesh position={[0, 0, CARD_D / 2 + 0.002]} material={faceMat}>
          <planeGeometry args={[CARD_W - BORDER * 2, CARD_H - BORDER * 2]} />
        </mesh>
        <Line
          ref={rimRef}
          points={rim}
          position={[0, 0, CARD_D / 2 + 0.004]}
          color="#ffffff"
          lineWidth={1.6}
          transparent
          opacity={0}
          toneMapped={false}
        />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Backdrop explosion                                                  */
/* ------------------------------------------------------------------ */

/** Light beams radiating from behind the queue, plus a soft core glow. */
function LightBurst({ ray, glow }: { ray: THREE.Texture; glow: THREE.Texture }) {
  const group = useRef<THREE.Group>(null);
  const glowMat = useRef<THREE.MeshBasicMaterial>(null);
  const beams = useMemo(() => {
    const rand = rng(611);
    // weighted toward the lower-left and right, like the reference
    const lanes = [3.6, 3.9, 4.2, 0.05, -0.25, 0.35, 2.2, 5.6, 1.2, -0.9, 2.8, 4.6, 0.7, 5.1];
    return lanes.map((a) => {
      const len = 9 + rand() * 9;
      const geo = new THREE.PlaneGeometry(len, 1).translate(len / 2, 0, 0);
      const mat = new THREE.MeshBasicMaterial({
        map: ray,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
        opacity: 0,
      });
      return {
        geo,
        mat,
        angle: a + (rand() - 0.5) * 0.15,
        width: 0.05 + Math.pow(rand(), 3) * 0.7,
        tilt: (rand() - 0.5) * 0.5,
        strength: 0.18 + rand() * 0.42,
        phase: rand() * 6,
      };
    });
  }, [ray]);
  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(() => {
    const b = burst(0.16);
    const x = exit();
    const t = motion.t;
    if (group.current) {
      group.current.rotation.z = t * 0.012;
      group.current.scale.setScalar(1 + x * 1.5);
    }
    beams.forEach((beam, i) => {
      const m = refs.current[i];
      if (!m) return;
      m.scale.set(0.05 + 0.95 * b, beam.width * (0.6 + 0.4 * b), 1);
      beam.mat.opacity = beam.strength * b * (1 - x) * (0.85 + 0.15 * Math.sin(t * 0.9 + beam.phase));
    });
    if (glowMat.current) glowMat.current.opacity = 0.4 * b * (1 - x);
  });

  return (
    <group ref={group} position={BURST}>
      <mesh scale={7}>
        <planeGeometry />
        <meshBasicMaterial
          ref={glowMat}
          map={glow}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
          opacity={0}
        />
      </mesh>
      {beams.map((beam, i) => (
        <mesh
          key={i}
          ref={(m) => {
            refs.current[i] = m;
          }}
          geometry={beam.geo}
          material={beam.mat}
          rotation={[beam.tilt, 0, beam.angle]}
        />
      ))}
    </group>
  );
}

/** Glass bricks and slabs flung out of the burst. */

/** Fine glittering debris sprayed out of the burst. */

/** Orbit lines sweeping around the queue, with small spheres riding them. */
function Orbits() {
  const group = useRef<THREE.Group>(null);
  const lines = useRef<(Line2 | LineSegments2 | null)[]>([]);
  const riders = useRef<(THREE.Mesh | null)[]>([]);
  const rings = useMemo(
    () =>
      [
        { r: 6.4, rot: [1.2, 0.15, -0.3] as [number, number, number], o: 0.4, speed: 0.12 },
        { r: 4.6, rot: [1.35, -0.2, 0.4] as [number, number, number], o: 0.28, speed: -0.16 },
      ].map((ring) => ({
        ...ring,
        points: new THREE.EllipseCurve(0, 0, ring.r, ring.r, 0, Math.PI * 2, false, 0)
          .getPoints(220)
          .map((v) => new THREE.Vector3(v.x, v.y, 0)),
      })),
    [],
  );

  useFrame(() => {
    const x = exit();
    const e = burst(0.22) * (1 - x);
    if (group.current) group.current.scale.setScalar((0.4 + 0.6 * burst(0.22)) * (1 + x * 1.2));
    lines.current.forEach((l, i) => {
      if (l) l.material.opacity = rings[i].o * e;
    });
    riders.current.forEach((m, k) => {
      if (!m) return;
      const ring = rings[k % rings.length];
      const a = motion.t * ring.speed + k * 2.3;
      m.position.set(Math.cos(a) * ring.r, Math.sin(a) * ring.r, 0);
      m.scale.setScalar(Math.max(0.001, e));
    });
  });

  return (
    <group ref={group} position={[BURST.x, BURST.y, BURST.z + 2.5]}>
      {rings.map((ring, i) => (
        <group key={i} rotation={ring.rot}>
          <Line
            ref={(l) => {
              lines.current[i] = l;
            }}
            points={ring.points}
            color="#ffffff"
            lineWidth={1}
            transparent
            opacity={0}
          />
          {[0, 1].map((k) => (
            <mesh
              key={k}
              ref={(m) => {
                riders.current[i + k * rings.length] = m;
              }}
            >
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial color="#f4f4f4" roughness={0.2} metalness={0.05} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */

export default function ProductsWorld() {
  const root = useRef<THREE.Group>(null);
  const size = useThree((s) => s.size);
  const layout = useMemo(() => productsLayout(size.width / size.height), [size]);
  const { ray, glow } = useFxTextures();
  const cardGlass = useGlassMaterial(0.3);

  useFrame(() => {
    if (root.current) root.current.visible = motion.g > 0.005 && exit() < 0.995;
    // leaving the section drops any lifted card back into the queue
    if (!interactive() && productStore.get() !== -1) productStore.set(-1);
  });

  return (
    <group ref={root} name={WARMUP_PRODUCTS} position={layout.pos} scale={layout.scale} visible={false}>
      <LightBurst ray={ray} glow={glow} />
      <Orbits />
      {PRODUCTS.map((_, i) => (
        <Card key={i} index={i} glass={cardGlass} />
      ))}
    </group>
  );
}
