"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { Bloom, EffectComposer, Noise, Vignette } from "@react-three/postprocessing";
import HeroWorld, { CAM_Z, WARMUP_HERO, heroClock } from "./HeroWorld";
import { markStageReady, resetStageReady, stageStatus } from "./stageReady";
import VisibilityLoop from "./VisibilityLoop";
import { gpuTier } from "./gpu";

/**
 * The first section's own 3D canvas: the glass-and-sphere studio scene. It prepares its
 * shaders, then signals "ready" — which starts the scene's landing, the title copy and the
 * header on the same frame — and renders only while the section is on screen.
 */

function Driver() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const base = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let cancelled = false;
    heroClock.t = 0;
    resetStageReady();
    // compile everything first (the scene's pieces start hidden, and compile skips hidden
    // objects), so nothing stalls the landing when it appears
    const restore: (() => void)[] = [];
    scene.getObjectByName(WARMUP_HERO)?.traverse((o) => {
      if (!o.visible) {
        o.visible = true;
        restore.push(() => (o.visible = false));
      }
    });
    if (gpuTier().lite) {
      // no warm-up pass on software graphics: the first still frame compiles what it needs
      restore.forEach((r) => r());
      requestAnimationFrame(() => markStageReady());
    } else
      Promise.resolve(gl.compileAsync(scene, camera))
        .catch(() => gl.compile(scene, camera))
        .finally(() => {
          restore.forEach((r) => r());
          if (!cancelled) requestAnimationFrame(() => markStageReady());
        });
    // software-only graphics: show the finished scene as a still instead of animating at
    // seconds per frame
    // (with an on-demand frame loop, a frame is drawn only when something changes, e.g. when
    // the Earth's images arrive)
    if (gpuTier().lite) {
      heroClock.t = 30;
      invalidate();
    }
    return () => {
      cancelled = true;
    };
  }, [gl, scene, camera, invalidate]);

  useFrame((state, dt) => {
    if (stageStatus.ready && !gpuTier().lite) heroClock.t += Math.min(dt, 1 / 30);
    // the camera eases in gently as the scene lands, and follows the pointer a little
    const landing = 1 - Math.pow(1 - Math.min(1, heroClock.t / 2.6), 3);
    const cam = state.camera;
    base.current.x = THREE.MathUtils.damp(base.current.x, state.pointer.x * 0.3, 2.5, dt);
    base.current.y = THREE.MathUtils.damp(base.current.y, state.pointer.y * 0.18, 2.5, dt);
    cam.position.set(base.current.x, base.current.y, CAM_Z + (1 - landing) * 1.6);
    cam.lookAt(0, 0, 0);
  });
  return null;
}

export default function HeroScene() {
  const box = useRef<HTMLDivElement>(null);
  const { lite, mobile } = gpuTier();

  return (
    <div className="hero__canvas" ref={box} aria-hidden>
      <Canvas
        dpr={lite ? 1 : mobile ? [1, 1.25] : [1, 1.5]}
        frameloop={lite ? "demand" : "always"}
        camera={{ fov: 35, position: [0, 0, CAM_Z + 1.6], near: 0.1, far: 100 }}
        gl={{ antialias: false, powerPreference: "high-performance" }}
        eventSource={typeof document !== "undefined" ? document.documentElement : undefined}
        eventPrefix="client"
      >
        <color attach="background" args={["#04060c"]} />
        <fog attach="fog" args={["#04060c", 16, 34]} />
        <ambientLight intensity={0.05} />
        <directionalLight position={[-5, 8, 7]} intensity={4.6} />
        <Environment resolution={lite ? 64 : 256} frames={1}>
          <Lightformer form="rect" intensity={2.5} position={[-6, 5, 6]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={0.8} position={[6, 0, 4]} scale={[4, 8, 1]} />
          <Lightformer form="ring" intensity={2} position={[0, 0, -8]} scale={6} />
        </Environment>
        <HeroWorld />
        <Driver />
        {/* stop once it is mostly scrolled away, so it never renders alongside the next scene for long */}
        {!lite && <VisibilityLoop target={box} rootMargin="-18% 0px 0px 0px" />}
        {!lite && (
          <EffectComposer multisampling={0}>
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.62} luminanceSmoothing={0.2} radius={0.62} />
            <Noise premultiply opacity={0.08} />
            <Vignette offset={0.22} darkness={0.9} />
          </EffectComposer>
        )}
      </Canvas>
    </div>
  );
}
