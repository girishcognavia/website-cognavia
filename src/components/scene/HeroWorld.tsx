"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { FontLoader, type Font } from "three/examples/jsm/loaders/FontLoader.js";
import { TextGeometry } from "three/examples/jsm/geometries/TextGeometry.js";
import { burst, clamp01, easeInOutCubic, easeOutExpo, motion, rng } from "./shared";

export const CAM_Z = 14;

/* ------------------------------------------------------------------ */
/* 3D title: "Cognavia" (bold, extruded) + ".ai" (thin)                */
/* ------------------------------------------------------------------ */

const SIZE = 1.5;

type Letter = {
  geo: THREE.BufferGeometry;
  x: number;
  y: number;
  z: number;
  seed: number; // -1..1
  seed2: number; // 0..1
  light: boolean;
};

function layoutLetters(font: Font, text: string, depth: number, bevel: boolean, startX: number) {
  const scale = SIZE / font.data.resolution;
  const tracking = -0.035 * SIZE;
  let x = startX;
  const letters: Omit<Letter, "seed" | "seed2">[] = [];
  for (const ch of text) {
    const glyph = font.data.glyphs[ch];
    const geo = new TextGeometry(ch, {
      font,
      size: SIZE,
      depth,
      curveSegments: 14,
      bevelEnabled: bevel,
      bevelThickness: 0.045,
      bevelSize: 0.022,
      bevelSegments: 5,
    });
    geo.computeBoundingBox();
    const bb = geo.boundingBox!;
    const c = new THREE.Vector3();
    bb.getCenter(c);
    // centre each glyph on its own pivot so it can tumble naturally
    geo.translate(-c.x, -c.y, -c.z);
    letters.push({ geo, x: x + c.x, y: c.y, z: c.z, light: !bevel });
    x += glyph.ha * scale + tracking;
  }
  return { letters, end: x - tracking };
}



function Title({ onWidth }: { onWidth: (w: number) => void }) {
  const bold = useLoader(FontLoader, "/fonts/montserrat-bold.typeface.json");
  const light = useLoader(FontLoader, "/fonts/montserrat-extralight.typeface.json");
  // smooth satin-pearl lettering (no cracked concrete)
  const boldMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#ededed",
        roughness: 0.3,
        metalness: 0.35,
        clearcoat: 0.8,
        clearcoatRoughness: 0.18,
        envMapIntensity: 1.3,
      }),
    [],
  );
  const lightMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#e6e6e6", roughness: 0.35, metalness: 0.1 }),
    [],
  );

  const { letters, width } = useMemo(() => {
    const a = layoutLetters(bold, "Cognavia", 0.62, true, 0);
    const b = layoutLetters(light, ".ai", 0.14, false, a.end + 0.08 * SIZE);
    const all = [...a.letters, ...b.letters];
    const w = b.end;
    const rand = rng(21);
    const out: Letter[] = all.map((l) => ({
      ...l,
      x: l.x - w / 2,
      y: l.y - SIZE * 0.36,
      seed: rand() * 2 - 1,
      seed2: rand(),
    }));
    return { letters: out, width: w };
  }, [bold, light]);

  useLayoutEffect(() => onWidth(width), [width, onWidth]);

  const refs = useRef<(THREE.Object3D | null)[]>([]);
  const word = useRef<THREE.Group>(null);
  useFrame(() => {
    const { t, p } = motion;

    // On scroll the name stays whole: the entire word rises up and away above the camera
    // as it flies forward beneath it, tilting gently so it keeps facing the viewer.
    const k = easeInOutCubic(p);
    if (word.current) {
      word.current.position.set(0, k * 4.2, -k * 2);
      word.current.rotation.set(k * 0.35, 0, 0);
    }

    letters.forEach((L, i) => {
      const m = refs.current[i];
      if (!m) return;
      // letters glide in as the star galaxy forms behind them
      const e = easeOutExpo(clamp01((t - 1.4 - i * 0.07) / 1.8));
      m.position.set(
        L.x,
        L.y + Math.sin(t * 0.7 + i * 1.3) * 0.03,
        // emerge from deep in the darkness (the fog hides them until they're close)
        L.z - (1 - e) * 16,
      );
      m.scale.setScalar(0.55 + 0.45 * e);
      m.rotation.set((1 - e) * 0.25 * L.seed, (1 - e) * -0.3, 0);
    });
  });

  return (
    <group ref={word}>
      {letters.map((L, i) =>
        i === 0 ? (
          <group
            key={i}
            ref={(m) => {
              refs.current[i] = m;
            }}
          >
            <mesh geometry={L.geo} material={boldMat} />
          </group>
        ) : (
          <mesh
            key={i}
            ref={(m) => {
              refs.current[i] = m;
            }}
            geometry={L.geo}
            material={L.light ? lightMat : boldMat}
          />
        ),
      )}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Orbits + orbs                                                       */
/* ------------------------------------------------------------------ */


function Orbits() {
  const rings = useMemo(
    () =>
      [
        { rx: 6.4, ry: 1.5, rot: [-0.18, 0.1, 0.1], o: 0.16 },
        { rx: 4.2, ry: 0.9, rot: [0.25, -0.15, -0.18], o: 0.08 },
      ].map((r) => ({
        ...r,
        points: new THREE.EllipseCurve(0, 0, r.rx, r.ry, 0, Math.PI * 2, false, 0)
          .getPoints(160)
          .map((v) => new THREE.Vector3(v.x, v.y, 0)),
      })),
    [],
  );
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = group.current;
    if (!g) return;
    // rings grow in with the star galaxy
    g.scale.setScalar(Math.max(0.001, burst()) * (1 + motion.p * 1.2));
    g.rotation.z = motion.t * 0.02;
  });
  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <Line
          key={i}
          points={r.points}
          rotation={r.rot as [number, number, number]}
          color="#ffffff"
          lineWidth={1}
          transparent
          opacity={r.o}
        />
      ))}
    </group>
  );
}

const ORBS: { p: [number, number, number]; r: number }[] = [
  { p: [-3.9, 2.5, 1.2], r: 0.2 },
  { p: [-7.2, -0.9, 2], r: 0.2 },
  { p: [3, 1.05, 1.1], r: 0.16 },
  { p: [4.2, 1.2, 0.6], r: 0.09 },
  { p: [0.5, 3.8, -1], r: 0.07 },
  { p: [5.6, 1.1, 0.2], r: 0.07 },
  { p: [4.7, -2.2, 0.4], r: 0.1 },
  { p: [-1.5, 1.7, 0.8], r: 0.06 },
  { p: [-2.2, -2.3, 1.5], r: 0.05 },
  { p: [6.9, 0.3, -0.5], r: 0.04 },
];

function Orbs() {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame(() => {
    const { t, p } = motion;
    const b = burst();
    ORBS.forEach((o, i) => {
      const m = refs.current[i];
      if (!m) return;
      const k = (0.2 + 0.8 * b) * (1 + p * 1.4);
      m.position.set(o.p[0] * k, o.p[1] * k + Math.sin(t * 0.8 + i) * 0.06, o.p[2] + p * 5);
      m.scale.setScalar(Math.max(0.001, b));
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
          <meshStandardMaterial color="#f2f2f2" roughness={0.25} metalness={0.05} />
        </mesh>
      ))}
    </>
  );
}


export default function HeroWorld() {
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const group = useRef<THREE.Group>(null);
  const titleWidth = useRef(10);

  const fit = () => {
    const g = group.current;
    if (!g) return;
    const aspect = size.width / size.height;
    const visibleH = 2 * CAM_Z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const share = aspect < 1 ? 0.78 : 0.72;
    g.scale.setScalar(Math.min(1, (visibleH * aspect * share) / titleWidth.current));
  };
  useLayoutEffect(fit);


  // Once the camera has flown past the title into section 2, stop drawing the hero.
  useFrame(() => {
    if (group.current) group.current.visible = motion.a < 0.36;
  });

  return (
    <group ref={group}>
      <Title
        onWidth={(w) => {
          titleWidth.current = w;
          fit();
        }}
      />
      <Orbits />
      <Orbs />
    </group>
  );
}

