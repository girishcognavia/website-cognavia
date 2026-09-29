"use client";

import { useMemo, useRef, useSyncExternalStore } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, Line, RoundedBox } from "@react-three/drei";
import type { Line2, LineSegments2 } from "three-stdlib";
import VisualCanvas, { useVisualPointer } from "./VisualCanvas";

/**
 * 04 · How we work — "An agent that acts on your behalf has boundaries on what it can do,
 * a record of what it did, and a person who can switch it off."
 *
 * A glowing agent chases the pointer but can't leave its glass boundary (the walls flash when
 * it pushes against them), it leaves a fading trail (the record), and a real switch turns it off.
 * Hovering each principle changes the scene: 1 one steady job · 2 the governed agent ·
 * 3 the agent steps aside for a simple form and a phone.
 */

/* ---------------- shared UI state (read by the HTML log + switch) ---------------- */

type Mode = 0 | 1 | 2 | 3;
const listeners = new Set<() => void>();
export const agent = {
  mode: 0 as Mode,
  power: true,
  log: [] as { t: string; text: string }[],
  version: 0,
};
const emit = () => {
  agent.version++;
  listeners.forEach((l) => l());
};
export const setAgentMode = (m: Mode) => {
  if (agent.mode !== m) {
    agent.mode = m;
    emit();
  }
};
const stamp = () => new Date().toLocaleTimeString("en-GB", { hour12: false });
export const logAgent = (text: string) => {
  agent.log = [{ t: stamp(), text }, ...agent.log].slice(0, 5);
  emit();
};
export const togglePower = () => {
  agent.power = !agent.power;
  logAgent(agent.power ? "Switched back on" : "Switched off by a person");
};
export const useAgent = () =>
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => agent.version,
    () => 0,
  );

/* ---------------- scene ---------------- */

const BW = 3.2, BH = 2.0, BD = 1.8; // boundary size
const R = 0.15; // agent radius
const TRAIL = 360;

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.45)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

// the six walls: [position, rotation, normal axis, sign]
const FACES: { pos: [number, number, number]; rot: [number, number, number]; size: [number, number]; axis: 0 | 1 | 2; sign: 1 | -1 }[] = [
  { pos: [BW / 2, 0, 0], rot: [0, Math.PI / 2, 0], size: [BD, BH], axis: 0, sign: 1 },
  { pos: [-BW / 2, 0, 0], rot: [0, -Math.PI / 2, 0], size: [BD, BH], axis: 0, sign: -1 },
  { pos: [0, BH / 2, 0], rot: [-Math.PI / 2, 0, 0], size: [BW, BD], axis: 1, sign: 1 },
  { pos: [0, -BH / 2, 0], rot: [Math.PI / 2, 0, 0], size: [BW, BD], axis: 1, sign: -1 },
  { pos: [0, 0, BD / 2], rot: [0, 0, 0], size: [BW, BH], axis: 2, sign: 1 },
  { pos: [0, 0, -BD / 2], rot: [0, Math.PI, 0], size: [BW, BH], axis: 2, sign: -1 },
];

function rectPts(w: number, h: number, x = 0, y = 0) {
  return [
    new THREE.Vector3(x - w / 2, y - h / 2, 0),
    new THREE.Vector3(x + w / 2, y - h / 2, 0),
    new THREE.Vector3(x + w / 2, y + h / 2, 0),
    new THREE.Vector3(x - w / 2, y + h / 2, 0),
    new THREE.Vector3(x - w / 2, y - h / 2, 0),
  ];
}

function Scene() {
  const pointer = useVisualPointer();
  const { size } = useThree();
  const world = useRef<THREE.Group>(null);
  const orb = useRef<THREE.Group>(null);
  const orbMat = useRef<THREE.MeshBasicMaterial>(null);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null);
  const edgesMat = useRef<THREE.LineBasicMaterial>(null);
  const faceMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const lever = useRef<THREE.Group>(null);
  const taskRing = useRef<THREE.Mesh>(null);
  const taskMat = useRef<THREE.MeshBasicMaterial>(null);
  const simple = useRef<(Line2 | LineSegments2 | null)[]>([]);
  const sats = useRef<THREE.Points>(null);
  const simpleGroup = useRef<THREE.Group>(null);

  const glow = useMemo(() => glowTexture(), []);
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(BW, BH, BD)), []);
  const plateMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#0d0d0f", metalness: 0.8, roughness: 0.22, clearcoat: 1, envMapIntensity: 2 }),
    [],
  );
  const chromeMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#cfcfcf", metalness: 1, roughness: 0.15, envMapIntensity: 2 }), []);

  // trail: a ring buffer of the agent's recent positions ("a record of what it did")
  const trail = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(TRAIL * 3), 3));
    return { geo: g, born: new Float32Array(TRAIL).fill(-99), head: 0, lastDrop: 0 };
  }, []);
  const satGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(14 * 3), 3));
    return g;
  }, []);

  // the "simple answer": a form and a phone, drawn in light
  const simpleShapes = useMemo(
    () => [
      rectPts(1.3, 1.7, -0.75, 0), // form
      rectPts(1.0, 0.16, -0.75, 0.45),
      rectPts(1.0, 0.16, -0.75, 0.12),
      rectPts(1.0, 0.36, -0.75, -0.3),
      rectPts(0.5, 0.16, -0.5, -0.64), // submit button
      rectPts(0.72, 1.35, 0.95, 0), // phone
      rectPts(0.5, 0.95, 0.95, 0.08),
    ],
    [],
  );

  const s = useRef({ pos: new THREE.Vector3(0, 0, 0), vel: new THREE.Vector3(), glow: 1, faces: new Array(6).fill(0), lastBlock: 0, lastMove: 0, simple: 0, box: 1 });
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const st = s.current;
    const mode = agent.mode;
    const on = agent.power;
    dt = Math.min(dt, 1 / 30);

    // gentle presentation turn toward the pointer
    if (world.current) {
      world.current.rotation.y = THREE.MathUtils.damp(world.current.rotation.y, -0.45 + pointer.x * 0.2, 2, dt);
      world.current.rotation.x = THREE.MathUtils.damp(world.current.rotation.x, 0.18 - pointer.y * 0.1, 2, dt);
    }

    // where the agent wants to go
    const halfH = 7.6 * Math.tan(THREE.MathUtils.degToRad(17)), halfW = halfH * (size.width / size.height);
    const target = tmp;
    if (mode === 1) {
      // one thing that has to work: a steady loop around a single task
      target.set(Math.cos(t * 1.4) * 0.55, Math.sin(t * 1.4) * 0.35, Math.sin(t * 0.7) * 0.2);
    } else if (pointer.inside && performance.now() - pointer.lastMove < 4000) {
      target.set(pointer.x * halfW * 1.1, pointer.y * halfH * 1.1, Math.sin(t * 0.8) * 0.5);
    } else {
      target.set(Math.sin(t * 0.5) * 2.2, Math.sin(t * 0.83) * 1.3, Math.cos(t * 0.37) * 0.8);
    }

    if (on) {
      st.vel.addScaledVector(target.sub(st.pos), 9 * dt);
      st.vel.multiplyScalar(Math.exp(-3.2 * dt));
    } else {
      // switched off: it sinks to the floor and stops
      st.vel.x *= Math.exp(-4 * dt);
      st.vel.z *= Math.exp(-4 * dt);
      st.vel.y -= 5 * dt;
    }
    st.pos.addScaledVector(st.vel, dt);

    // the boundary: clamp inside, bounce a little, and light the wall it hit
    const lim = [BW / 2 - R, BH / 2 - R, BD / 2 - R];
    let hit = false;
    for (let a = 0; a < 3; a++) {
      const v = st.pos.getComponent(a);
      if (Math.abs(v) > lim[a]) {
        const sign = v > 0 ? 1 : -1;
        const push = Math.abs(v) - lim[a] + Math.abs(st.vel.getComponent(a)) * 0.08;
        st.pos.setComponent(a, sign * lim[a]);
        st.vel.setComponent(a, -st.vel.getComponent(a) * (on ? 0.35 : 0.2));
        const fi = FACES.findIndex((f) => f.axis === a && f.sign === sign);
        if (on) {
          st.faces[fi] = Math.min(1, st.faces[fi] + push * 4 + 0.25);
          hit = true;
        }
      }
    }
    if (hit && on && t - st.lastBlock > 1.6) {
      st.lastBlock = t;
      logAgent("Tried to go further · blocked at its boundary");
    } else if (on && st.vel.length() > 0.6 && t - st.lastMove > 3.2) {
      st.lastMove = t;
      logAgent("Action taken · within bounds");
    }

    if (orb.current) orb.current.position.copy(st.pos);
    st.glow = THREE.MathUtils.damp(st.glow, on ? 1 : 0.12, 4, dt);
    const flash = mode === 3 ? 0.25 : 1;
    if (orbMat.current) orbMat.current.color.setScalar(0.3 + 2.8 * st.glow * flash);
    if (haloMat.current) haloMat.current.opacity = 0.75 * st.glow * flash;

    // satellites buzzing around the agent while it's on
    const sp = satGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < 14; i++) {
      const a = t * (1.5 + (i % 4) * 0.4) + i * 2.1;
      const r = 0.26 + (i % 3) * 0.05;
      sp.setXYZ(i, st.pos.x + Math.cos(a) * r * st.glow, st.pos.y + Math.sin(a * 1.3) * r * 0.6 * st.glow, st.pos.z + Math.sin(a) * r * st.glow);
    }
    sp.needsUpdate = true;
    if (sats.current) (sats.current.material as THREE.PointsMaterial).opacity = st.glow * flash;

    // the record: drop a point every few frames; points fade over ~10s
    if (on && t - trail.lastDrop > 0.05) {
      trail.lastDrop = t;
      const p = trail.geo.attributes.position as THREE.BufferAttribute;
      p.setXYZ(trail.head, st.pos.x, st.pos.y, st.pos.z);
      trail.born[trail.head] = t;
      trail.head = (trail.head + 1) % TRAIL;
      p.needsUpdate = true;
    }
    const col = trail.geo.attributes.color as THREE.BufferAttribute;
    const emph = mode === 2 ? 1.6 : mode === 3 ? 0.3 : 1;
    for (let i = 0; i < TRAIL; i++) {
      const life = Math.max(0, 1 - (t - trail.born[i]) / 10);
      col.setXYZ(i, life * emph, life * emph, life * emph);
    }
    col.needsUpdate = true;

    // walls + edges: brighter when "boundaries" is the focus; fade when stepping aside
    st.box = THREE.MathUtils.damp(st.box, mode === 3 ? 0.25 : 1, 3, dt);
    st.faces = st.faces.map((f) => Math.max(0, f - dt * 1.4));
    faceMats.current.forEach((m, i) => {
      if (m) m.opacity = (0.025 + st.faces[i] * 0.3 + (mode === 2 ? 0.03 : 0)) * st.box;
    });
    if (edgesMat.current) edgesMat.current.opacity = (mode === 2 ? 0.95 : 0.55) * st.box;

    // one task ring (principle 1)
    if (taskMat.current) taskMat.current.opacity = THREE.MathUtils.damp(taskMat.current.opacity, mode === 1 ? 0.9 : 0, 4, dt);
    if (taskRing.current) taskRing.current.rotation.z = t * 0.6;

    // a form and a phone number (principle 3)
    st.simple = THREE.MathUtils.damp(st.simple, mode === 3 ? 1 : 0, 3.5, dt);
    simple.current.forEach((l) => {
      if (l) l.material.opacity = st.simple;
    });
    // fat-line materials never fully vanish at opacity 0, so hide them outright when unused
    if (simpleGroup.current) simpleGroup.current.visible = st.simple > 0.01;

    // the switch lever
    if (lever.current) lever.current.rotation.z = THREE.MathUtils.damp(lever.current.rotation.z, on ? -0.45 : 0.45, 8, dt);
  });

  return (
    <group ref={world} position={[0, 0.25, 0]}>
      {/* the boundary */}
      <lineSegments geometry={edges}>
        <lineBasicMaterial ref={edgesMat} color="#ffffff" transparent opacity={0.55} />
      </lineSegments>
      {FACES.map((f, i) => (
        <mesh key={i} position={f.pos} rotation={f.rot}>
          <planeGeometry args={f.size} />
          <meshBasicMaterial
            ref={(m) => {
              faceMats.current[i] = m;
            }}
            color="#ffffff"
            transparent
            opacity={0.03}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}

      {/* the record */}
      <points geometry={trail.geo} frustumCulled={false}>
        <pointsMaterial size={0.035} vertexColors transparent depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </points>

      {/* the agent */}
      <group ref={orb}>
        <mesh>
          <sphereGeometry args={[R, 32, 32]} />
          <meshBasicMaterial ref={orbMat} color={[3, 3, 3]} toneMapped={false} />
        </mesh>
        <Billboard>
          <mesh scale={1.3}>
            <planeGeometry args={[1, 1]} />
            <meshBasicMaterial ref={haloMat} map={glow} transparent blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
          </mesh>
        </Billboard>
      </group>
      <points ref={sats} geometry={satGeo} frustumCulled={false}>
        <pointsMaterial size={0.03} color={[2, 2, 2]} transparent depthWrite={false} toneMapped={false} />
      </points>

      {/* principle 1: one task */}
      <mesh ref={taskRing}>
        <torusGeometry args={[0.66, 0.012, 8, 120]} />
        <meshBasicMaterial ref={taskMat} color={[2, 2, 2]} transparent opacity={0} toneMapped={false} />
      </mesh>

      {/* principle 3: a form and a phone number */}
      <group ref={simpleGroup} position={[0, 0, 0.95]} visible={false}>
        {simpleShapes.map((pts, i) => (
          <Line
            key={i}
            ref={(l) => {
              simple.current[i] = l;
            }}
            points={pts}
            color="#ffffff"
            lineWidth={1.4}
            transparent
            opacity={0}
          />
        ))}
      </group>

      {/* the switch: a person can turn it off */}
      <group
        position={[0, -BH / 2 - 0.42, 0.4]}
        onClick={(e) => {
          e.stopPropagation();
          togglePower();
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <RoundedBox args={[0.9, 0.16, 0.5]} radius={0.05} material={plateMat} />
        <group ref={lever} position={[0, 0.08, 0]}>
          <mesh position={[0, 0.2, 0]} material={chromeMat}>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 16]} />
          </mesh>
          <mesh position={[0, 0.42, 0]} material={plateMat}>
            <sphereGeometry args={[0.07, 24, 24]} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

export default function AgentBoundary() {
  useAgent();
  const on = agent.power;
  return (
    <VisualCanvas
      className="visual--agent"
      camera={{ position: [0, 0, 7.6], fov: 34 }}
      overlay={
        <>
          <div className="agent-log" aria-live="polite">
            <p className="agent-log__title">
              <span className={`agent-log__dot${on ? " is-on" : ""}`} aria-hidden />
              Agent log
            </p>
            <ol>
              {agent.log.map((l, i) => (
                <li key={`${l.t}-${i}`}>
                  <span>{l.t}</span>
                  {l.text}
                </li>
              ))}
            </ol>
          </div>
          <button type="button" className={`agent-switch${on ? "" : " is-off"}`} onClick={togglePower}>
            <span className="agent-switch__track" aria-hidden>
              <span />
            </span>
            {on ? "Switch it off" : "Switch it on"}
          </button>
          <p className="visual__hint" aria-hidden>
            Move to direct the agent · Flip the switch
          </p>
        </>
      }
    >
      <Scene />
    </VisualCanvas>
  );
}
