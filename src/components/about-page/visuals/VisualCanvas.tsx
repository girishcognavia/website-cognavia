"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";

/** Pointer relative to this visual: x/y in -1..1 (canvas centre = 0), plus whether it's inside. */
export type VisualPointer = { x: number; y: number; inside: boolean; lastMove: number };

const PointerContext = createContext<VisualPointer>({ x: 0, y: 0, inside: false, lastMove: 0 });
export const useVisualPointer = () => useContext(PointerContext);

/**
 * Shared shell for the About visuals: studio reflections, bloom, pointer tracking,
 * and rendering only while on screen.
 */
export default function VisualCanvas({
  children,
  camera = { position: [0, 0, 8] as [number, number, number], fov: 32 },
  className = "",
  overlay,
}: {
  children: React.ReactNode;
  camera?: { position: [number, number, number]; fov: number };
  className?: string;
  overlay?: React.ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const pointer = useRef<VisualPointer>({ x: 0, y: 0, inside: false, lastMove: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "120px" });
    io.observe(el);
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const p = pointer.current;
      p.x = ((e.clientX - r.left) / r.width) * 2 - 1;
      p.y = -(((e.clientY - r.top) / r.height) * 2 - 1);
      p.inside = Math.abs(p.x) <= 1 && Math.abs(p.y) <= 1;
      p.lastMove = performance.now();
    };
    const leave = () => (pointer.current.inside = false);
    window.addEventListener("pointermove", move);
    document.addEventListener("pointerleave", leave);
    return () => {
      io.disconnect();
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerleave", leave);
    };
  }, []);

  return (
    <div ref={box} className={`visual ${className}`}>
      <div className="visual__canvas">
        <PointerContext.Provider value={pointer.current}>
          <Canvas
            dpr={[1, 1.75]}
            frameloop={active ? "always" : "never"}
            camera={{ ...camera, near: 0.1, far: 60 }}
            gl={{ antialias: false, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#030303"]} />
            <ambientLight intensity={0.05} />
            <directionalLight position={[-4, 5, 5]} intensity={1.4} />
            <Environment resolution={128} frames={1}>
              <Lightformer form="rect" intensity={3} position={[-5, 4, 4]} scale={[6, 3, 1]} />
              <Lightformer form="rect" intensity={4} position={[6, 1, -3]} rotation={[0, -Math.PI / 2.4, 0]} scale={[1.2, 10, 1]} />
              <Lightformer form="rect" intensity={2} position={[-6, 0, -4]} rotation={[0, Math.PI / 2.4, 0]} scale={[0.8, 8, 1]} />
              <Lightformer form="rect" intensity={0.8} position={[0, -5, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[8, 2, 1]} />
            </Environment>
            {children}
            <EffectComposer multisampling={4}>
              <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.9} luminanceSmoothing={0.15} />
              <Vignette offset={0.25} darkness={0.85} />
            </EffectComposer>
          </Canvas>
        </PointerContext.Provider>
      </div>
      {overlay}
    </div>
  );
}
