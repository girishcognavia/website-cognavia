"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import VisualCanvas, { useVisualPointer } from "./VisualCanvas";

/**
 * 02 · Why we started — "Anyone can buy the tools now. Knowing what to do with them is still rare."
 * Loose tools (glossy chips) drift in chaos. Hover and they assemble into a connected, working
 * system with data pulsing through it; click to lock it in place.
 */

const COLS = 6, ROWS = 4, LAYERS = 4;
const N = COLS * ROWS * LAYERS;
const GAP = 0.56;

const order = { value: 0, locked: false };

function rand(seed: number) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

function System({ onOrder }: { onOrder: (o: number) => void }) {
  const pointer = useVisualPointer();
  const group = useRef<THREE.Group>(null);
  const chips = useRef<THREE.InstancedMesh>(null);
  const lights = useRef<THREE.InstancedMesh>(null);
  const linesMat = useRef<THREE.LineBasicMaterial>(null);
  const pulsesMat = useRef<THREE.PointsMaterial>(null);
  const lastReported = useRef(-1);

  const data = useMemo(() => {
    const r = rand(11);
    const ordered: THREE.Vector3[] = [];
    for (let l = 0; l < LAYERS; l++)
      for (let row = 0; row < ROWS; row++)
        for (let c = 0; c < COLS; c++)
          ordered.push(new THREE.Vector3((c - (COLS - 1) / 2) * GAP, (l - (LAYERS - 1) / 2) * GAP * 1.15, (row - (ROWS - 1) / 2) * GAP));
    const chaos = ordered.map(() => {
      const v = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(1.2 + r() * 1.9);
      v.y *= 0.8;
      return v;
    });
    const spin = ordered.map(() => new THREE.Euler(r() * 6, r() * 6, r() * 6));
    const drift = ordered.map(() => [r() * 6, 0.3 + r() * 0.5] as const);
    // assemble from the centre outward
    const delay = ordered.map((p) => Math.min(0.45, p.length() / 3.2));
    // links between grid neighbours
    const idx = (l: number, row: number, c: number) => l * ROWS * COLS + row * COLS + c;
    const edges: [number, number][] = [];
    for (let l = 0; l < LAYERS; l++)
      for (let row = 0; row < ROWS; row++)
        for (let c = 0; c < COLS; c++) {
          if (c < COLS - 1) edges.push([idx(l, row, c), idx(l, row, c + 1)]);
          if (row < ROWS - 1) edges.push([idx(l, row, c), idx(l, row + 1, c)]);
          if (l < LAYERS - 1 && (c + row) % 3 === 0) edges.push([idx(l, row, c), idx(l + 1, row, c)]);
        }
    const pulses = Array.from({ length: 36 }, () => ({ edge: Math.floor(r() * edges.length), t: r(), speed: 0.4 + r() * 0.7 }));
    return { ordered, chaos, spin, drift, delay, edges, pulses };
  }, []);

  const lineGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(data.edges.length * 6), 3));
    return g;
  }, [data]);
  const pulseGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(data.pulses.length * 3), 3));
    return g;
  }, [data]);

  const chipGeo = useMemo(() => new THREE.BoxGeometry(0.36, 0.07, 0.36), []);
  const lightGeo = useMemo(() => new THREE.PlaneGeometry(0.16, 0.035).rotateX(-Math.PI / 2), []);
  const chipMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#0d0d0f", metalness: 0.75, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 2 }),
    [],
  );
  const lightMat = useMemo(() => new THREE.MeshBasicMaterial({ color: new THREE.Color(2, 2, 2), toneMapped: false, transparent: true }), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const current = useMemo(() => data.ordered.map(() => new THREE.Vector3()), [data]);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const target = order.locked || pointer.inside ? 1 : 0;
    order.value = THREE.MathUtils.damp(order.value, target, target ? 1.4 : 0.9, dt);
    const o = order.value;
    if (Math.abs(o - lastReported.current) > 0.02) {
      lastReported.current = o;
      onOrder(o);
    }

    const g = group.current;
    if (g) {
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, -0.5 + pointer.x * 0.35 + t * 0.03, 2, dt);
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, 0.35 - pointer.y * 0.2, 2, dt);
    }

    const cm = chips.current, lm = lights.current;
    if (!cm || !lm) return;
    for (let i = 0; i < N; i++) {
      const k = THREE.MathUtils.smoothstep((o - data.delay[i]) / (1 - data.delay[i] * 0.9), 0, 1);
      const [ph, sp] = data.drift[i];
      const c = data.chaos[i];
      const chaosPos = dummy.position.set(c.x + Math.sin(t * sp + ph) * 0.12, c.y + Math.cos(t * sp * 0.8 + ph) * 0.12, c.z + Math.sin(t * sp * 0.6 + ph * 2) * 0.12);
      current[i].copy(chaosPos).lerp(data.ordered[i], k);
      dummy.position.copy(current[i]);
      const s = data.spin[i];
      dummy.rotation.set((s.x + t * 0.3) * (1 - k), (s.y + t * 0.2) * (1 - k), (s.z + t * 0.25) * (1 - k));
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      cm.setMatrixAt(i, dummy.matrix);
      dummy.position.y += 0.037;
      dummy.updateMatrix();
      lm.setMatrixAt(i, dummy.matrix);
    }
    cm.instanceMatrix.needsUpdate = true;
    lm.instanceMatrix.needsUpdate = true;
    lightMat.opacity = 0.2 + 0.8 * o;

    // links draw in as the system forms
    const lp = lineGeo.attributes.position as THREE.BufferAttribute;
    data.edges.forEach(([a, b], e) => {
      lp.setXYZ(e * 2, current[a].x, current[a].y, current[a].z);
      lp.setXYZ(e * 2 + 1, current[b].x, current[b].y, current[b].z);
    });
    lp.needsUpdate = true;
    if (linesMat.current) linesMat.current.opacity = Math.pow(o, 3) * 0.45;

    // data pulses run along the links once it's working
    const pp = pulseGeo.attributes.position as THREE.BufferAttribute;
    data.pulses.forEach((p, i) => {
      p.t += dt * p.speed;
      if (p.t > 1) {
        p.t = 0;
        p.edge = Math.floor(Math.random() * data.edges.length);
      }
      const [a, b] = data.edges[p.edge];
      pp.setXYZ(i, THREE.MathUtils.lerp(current[a].x, current[b].x, p.t), THREE.MathUtils.lerp(current[a].y, current[b].y, p.t), THREE.MathUtils.lerp(current[a].z, current[b].z, p.t));
    });
    pp.needsUpdate = true;
    if (pulsesMat.current) pulsesMat.current.opacity = THREE.MathUtils.smoothstep(o, 0.7, 1);
  });

  return (
    <group ref={group} onClick={() => (order.locked = !order.locked)}>
      <instancedMesh ref={chips} args={[chipGeo, chipMat, N]} frustumCulled={false} />
      <instancedMesh ref={lights} args={[lightGeo, lightMat, N]} frustumCulled={false} />
      <lineSegments geometry={lineGeo} frustumCulled={false}>
        <lineBasicMaterial ref={linesMat} color="#ffffff" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      <points geometry={pulseGeo} frustumCulled={false}>
        <pointsMaterial ref={pulsesMat} color={new THREE.Color(3, 3, 3)} size={0.07} transparent opacity={0} depthWrite={false} toneMapped={false} />
      </points>
    </group>
  );
}

export default function ToolsToSystem() {
  const [o, setO] = useState(0);
  const [locked, setLocked] = useState(false);
  useEffect(() => {
    const iv = window.setInterval(() => setLocked(order.locked), 200);
    return () => window.clearInterval(iv);
  }, []);
  return (
    <VisualCanvas
      className="visual--tools"
      camera={{ position: [0, 0.3, 8.6], fov: 32 }}
      overlay={
        <>
          {/* captions are phrases from the section's own text */}
          <p className="visual__caption" aria-hidden>
            <span style={{ opacity: 1 - o }}>Anyone can buy the tools now.</span>
            <span style={{ opacity: o }}>Knowing what to do with them is still rare.</span>
          </p>
          <p className="visual__hint" aria-hidden>
            {locked ? "Locked · click to release" : "Hover to put the tools to work · Click to lock"}
          </p>
        </>
      }
    >
      <System onOrder={setO} />
    </VisualCanvas>
  );
}
