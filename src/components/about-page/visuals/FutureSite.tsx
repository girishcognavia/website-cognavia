"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import VisualCanvas, { useVisualPointer } from "./VisualCanvas";

/**
 * 03 · Where we think this goes — a website that answers questions and chases up customers
 * on its own. A phone runs a site assistant: questions arrive (even at 11 pm), it answers,
 * and follow-ups fly out to the customers orbiting it. Click the phone to ask it something.
 * (The conversation is an illustration, not a real customer.)
 */

type Msg = { from: "visitor" | "agent" | "system"; text: string; time?: string };

const SCRIPT: Msg[][] = [
  [
    { from: "visitor", text: "Do you open on Saturdays?", time: "11:04 pm" },
    { from: "agent", text: "Yes, 9 to 1. Want me to book you in for this Saturday?" },
  ],
  [
    { from: "visitor", text: "Can I get a price for 40 units?", time: "11:12 pm" },
    { from: "agent", text: "I've emailed you a quote. Someone from the team will call you in the morning." },
  ],
  [{ from: "system", text: "Followed up with 3 enquiries from yesterday" }],
];

const W = 540, H = 1100;
const FONT = "Montserrat, Arial, sans-serif";

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const lines: string[] = [];
  let line = "";
  for (const w of text.split(" ")) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = test;
  }
  lines.push(line);
  return lines;
}

/** Draws the phone screen: a small business site with the assistant chat open. */
function drawScreen(ctx: CanvasRenderingContext2D, msgs: Msg[], typing: number) {
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#0a0a0b";
  ctx.fillRect(0, 0, W, H);
  // site header
  ctx.fillStyle = "#f2f2f2";
  ctx.font = `600 26px ${FONT}`;
  ctx.fillText("yourbusiness.com", 36, 90);
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.fillRect(36, 120, W - 72, 150);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(60, 160, 260, 18);
  ctx.fillRect(60, 196, 180, 14);
  // chat panel
  const top = 310;
  ctx.fillStyle = "#141416";
  ctx.beginPath();
  ctx.roundRect(24, top, W - 48, H - top - 40, 28);
  ctx.fill();
  ctx.fillStyle = "#f2f2f2";
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText("Assistant", 56, top + 52);
  ctx.beginPath();
  ctx.arc(W - 70, top + 44, 8, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `500 16px ${FONT}`;
  ctx.fillText("online", W - 150, top + 50);

  // messages, bottom-aligned
  ctx.font = `500 22px ${FONT}`;
  const blocks = msgs.map((m) => ({ m, lines: wrap(ctx, m.text, 330) }));
  let y = H - 110 - (typing ? 70 : 0);
  const drawn: { m: Msg; lines: string[]; y: number }[] = [];
  for (let i = blocks.length - 1; i >= 0; i--) {
    const h = blocks[i].lines.length * 30 + 34 + (blocks[i].m.time ? 24 : 0);
    y -= h;
    if (y < top + 80) break;
    drawn.unshift({ ...blocks[i], y });
    y -= 16;
  }
  for (const { m, lines, y: by } of drawn) {
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 44;
    const h = lines.length * 30 + 24;
    const mine = m.from === "visitor";
    let yy = by;
    if (m.time) {
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.font = `500 15px ${FONT}`;
      ctx.fillText(m.time, mine ? W - 60 - ctx.measureText(m.time).width : 56, yy + 14);
      ctx.font = `500 22px ${FONT}`;
      yy += 24;
    }
    const x = m.from === "system" ? (W - w) / 2 : mine ? W - 48 - w : 48;
    ctx.fillStyle = mine ? "#f2f2f2" : m.from === "system" ? "rgba(255,255,255,0.08)" : "#2a2a2e";
    ctx.beginPath();
    ctx.roundRect(x, yy, w, h, 20);
    ctx.fill();
    if (m.from === "system") {
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.stroke();
    }
    ctx.fillStyle = mine ? "#0a0a0b" : "#f2f2f2";
    lines.forEach((l, i) => ctx.fillText(l, x + 22, yy + 38 + i * 30));
  }
  if (typing) {
    ctx.fillStyle = "#2a2a2e";
    ctx.beginPath();
    ctx.roundRect(48, H - 170, 110, 52, 20);
    ctx.fill();
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(80 + i * 24, H - 144, 6, 0, Math.PI * 2);
      ctx.fillStyle = i === (typing - 1) % 3 ? "#ffffff" : "rgba(255,255,255,0.35)";
      ctx.fill();
    }
  }
  // input bar
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(48, H - 96, W - 96, 52, 26);
  ctx.stroke();
}

const NODES = 7;

function Phone() {
  const pointer = useVisualPointer();
  const phone = useRef<THREE.Group>(null);
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const halos = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const flyers = useRef<(THREE.Mesh | null)[]>([]);

  const { ctx, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { ctx, tex };
  }, []);

  // conversation state machine
  const convo = useRef({ step: 0, sub: 0, next: 1.2, typing: 0, msgs: [] as Msg[], dirty: true, lastTyping: 0 });
  const nodeLit = useRef(new Array(NODES).fill(0));
  const flights = useRef<{ node: number; t: number }[]>([]);
  const trigger = useRef(false);

  const bodyMat = useMemo(
    () => new THREE.MeshPhysicalMaterial({ color: "#0c0c0e", metalness: 0.85, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 2.2 }),
    [],
  );
  const nodeMat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#151517", metalness: 0.8, roughness: 0.2, clearcoat: 1, envMapIntensity: 2 }), []);

  const sendFollowUps = (n: number) => {
    for (let i = 0; i < n; i++) flights.current.push({ node: Math.floor(Math.random() * NODES), t: -i * 0.18 });
  };

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const c = convo.current;

    // advance the conversation (or jump ahead when the phone is clicked)
    if (trigger.current) {
      trigger.current = false;
      c.next = t;
    }
    if (t >= c.next) {
      const turn = SCRIPT[c.step % SCRIPT.length];
      const m = turn[c.sub];
      if (m.from === "agent" && !c.typing) {
        c.typing = 1; // show typing dots first
        c.next = t + 1.1;
      } else {
        c.typing = 0;
        c.msgs = [...c.msgs.slice(-5), m];
        if (m.from === "agent") sendFollowUps(1);
        if (m.from === "system") sendFollowUps(3);
        c.sub++;
        if (c.sub >= turn.length) {
          c.sub = 0;
          c.step++;
          c.next = t + 3.2;
        } else c.next = t + 0.9;
      }
      c.dirty = true;
    }
    const typingFrame = c.typing ? 1 + (Math.floor(t * 3) % 3) : 0;
    if (typingFrame !== c.lastTyping) {
      c.lastTyping = typingFrame;
      c.dirty = true;
    }
    if (c.dirty) {
      c.dirty = false;
      drawScreen(ctx, c.msgs, typingFrame);
      tex.needsUpdate = true;
    }

    // phone tilts toward the pointer and floats
    const p = phone.current;
    if (p) {
      p.rotation.y = THREE.MathUtils.damp(p.rotation.y, -0.35 + pointer.x * 0.45, 3, dt);
      p.rotation.x = THREE.MathUtils.damp(p.rotation.x, -pointer.y * 0.25, 3, dt);
      p.position.y = Math.sin(t * 0.9) * 0.06;
    }

    // customers orbiting; follow-ups fly out to them
    nodes.current.forEach((n, i) => {
      if (!n) return;
      const a = (i / NODES) * Math.PI * 2 + t * 0.12;
      // orbit behind the phone so they never cover the screen
      n.position.set(Math.cos(a) * 1.95, Math.sin(a * 2) * 0.45, Math.sin(a) * 0.8 - 1.3);
      nodeLit.current[i] = Math.max(0, nodeLit.current[i] - dt * 0.7);
      const h = halos.current[i];
      if (h) h.opacity = nodeLit.current[i];
    });
    flights.current = flights.current.filter((f) => f.t < 1);
    flyers.current.forEach((m, i) => {
      if (!m) return;
      const f = flights.current[i];
      if (!f || f.t < 0 || !nodes.current[f.node]) {
        m.visible = false;
        return;
      }
      const to = nodes.current[f.node]!.position;
      const k = f.t;
      m.visible = true;
      m.position.set(to.x * k, to.y * k + Math.sin(k * Math.PI) * 0.9, 0.3 + (to.z - 0.3) * k);
      m.scale.setScalar(1 - k * 0.4);
    });
    flights.current.forEach((f) => {
      f.t += dt * 0.9;
      if (f.t >= 1) nodeLit.current[f.node] = 1;
    });
  });

  return (
    <>
      <group
        ref={phone}
        onClick={(e) => {
          e.stopPropagation();
          trigger.current = true;
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <RoundedBox args={[1.32, 2.66, 0.13]} radius={0.16} smoothness={6} material={bodyMat} />
        <mesh position={[0, 0, 0.068]}>
          <planeGeometry args={[1.2, 2.44]} />
          <meshBasicMaterial map={tex} toneMapped={false} />
        </mesh>
        {/* camera notch */}
        <mesh position={[0, 1.13, 0.07]}>
          <circleGeometry args={[0.03, 20]} />
          <meshBasicMaterial color="#000" />
        </mesh>
      </group>
      {Array.from({ length: NODES }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            nodes.current[i] = m;
          }}
          material={nodeMat}
        >
          <sphereGeometry args={[0.13, 32, 32]} />
          <mesh>
            <ringGeometry args={[0.18, 0.2, 40]} />
            <meshBasicMaterial
              ref={(m) => {
                halos.current[i] = m;
              }}
              color={[2.5, 2.5, 2.5]}
              transparent
              opacity={0}
              toneMapped={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        </mesh>
      ))}
      {Array.from({ length: 6 }, (_, i) => (
        <mesh
          key={i}
          ref={(m) => {
            flyers.current[i] = m;
          }}
          visible={false}
        >
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshBasicMaterial color={[3, 3, 3]} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

export default function FutureSite() {
  return (
    <VisualCanvas
      className="visual--site"
      camera={{ position: [0, 0.05, 5.3], fov: 34 }}
      overlay={
        <p className="visual__hint" aria-hidden>
          Click the phone to ask it something
        </p>
      }
    >
      <Phone />
    </VisualCanvas>
  );
}
