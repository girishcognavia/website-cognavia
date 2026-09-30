"use client";

import { Suspense, useEffect, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from "@react-three/postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import HeroWorld, { CAM_Z } from "./HeroWorld";
import GlobeWorld, { WARMUP_GLOBE, globeLayout } from "./GlobeWorld";
import ProductsWorld, { LIFT, WARMUP_PRODUCTS, productsLayout, queuePos } from "./ProductsWorld";
import { productStore } from "@/components/products/productStore";
import { MotionDriver, clamp01, easeInOutCubic, motion } from "./shared";
import { markStageReady, markWorldsWarm, setWarmRequest } from "./stageReady";
import { ABOUT_SETTLE, PRODUCTS_SETTLE, TEAM_SETTLE } from "./scrollState";
import TeamWorld, { WARMUP_TEAM, teamLayout } from "./TeamWorld";
import StarField from "./StarField";

/** How far the camera keeps flying (in z) while section 2 scrolls in. */
const ABOUT_TRAVEL = 6;

/** How far the camera flies on (past the globe) while section 3 scrolls in. */
const PRODUCTS_TRAVEL = 18;

/** 0 → 1 while section 2 scrolls into place. */
const handoff = () => easeInOutCubic(clamp01(motion.a / ABOUT_SETTLE));
/** 0 → 1 while section 3 scrolls into place. */
const handoff2 = () => easeInOutCubic(clamp01(motion.g / PRODUCTS_SETTLE));
/** How far the camera flies on (through the breaking card queue) while section 4 scrolls in. */
const TEAM_TRAVEL = 18;
/** 0 → 1 while section 4 scrolls into place. */
const handoff3 = () => easeInOutCubic(clamp01(motion.m / TEAM_SETTLE));

/**
 * One continuous camera path for the whole page:
 * hero z 14 → 3.5 (through the exploding title), on to z -2.5 facing the globe,
 * past the breaking globe to z -20.5 facing the product queue, then through the
 * scattering cards to z -38.5 facing the leadership team.
 */
/** Pointer-follow part of the camera height, kept apart from the crane move below. */
const camBaseY = { v: 0 };

function Rig() {
  useFrame((state, dt) => {
    const cam = state.camera;
    const { p } = motion;
    const h = handoff();
    const h2 = handoff2();
    const h3 = handoff3();
    // calm while flying through, back on at each resting scene
    const parallax = Math.max(1 - p, h * (1 - Math.sin(h2 * Math.PI)) * (1 - Math.sin(h3 * Math.PI)));
    cam.position.x = THREE.MathUtils.damp(cam.position.x, state.pointer.x * 0.6 * parallax, 2.5, dt);
    camBaseY.v = THREE.MathUtils.damp(camBaseY.v, state.pointer.y * 0.35 * parallax, 2.5, dt);
    // into the team section the camera cranes up and over the stage, then settles to eye level
    const crane = Math.sin(h3 * Math.PI);
    cam.position.y = camBaseY.v + crane * 2.2;
    cam.position.z = CAM_Z - p * 10.5 - h * ABOUT_TRAVEL - h2 * PRODUCTS_TRAVEL - h3 * TEAM_TRAVEL;
    cam.lookAt(0, -crane * 2.4, cam.position.z - CAM_Z);
  });
  return null;
}

/** Keeps the depth-of-field focus on whatever the camera is looking at. */
function FocusDriver({ dof }: { dof: React.RefObject<DepthOfFieldEffect | null> }) {
  const size = useThree((s) => s.size);
  const title = new THREE.Vector3(0, 0, 0);
  const card = new THREE.Vector3();
  const focus = useRef(new THREE.Vector3());
  useFrame((_, dt) => {
    const effect = dof.current;
    if (!effect?.target) return;
    const aspect = size.width / size.height;
    const globe = globeLayout(aspect).pos;
    const products = productsLayout(aspect);
    // in section 3, focus on the lifted card so it's sharp even when it sits deep in the queue
    const active = productStore.get();
    if (active >= 0) card.copy(queuePos(active)).add(LIFT).multiplyScalar(products.scale).add(products.pos);
    else card.copy(products.pos);
    focus.current.x = THREE.MathUtils.damp(focus.current.x, card.x, 4, dt);
    focus.current.y = THREE.MathUtils.damp(focus.current.y, card.y, 4, dt);
    focus.current.z = THREE.MathUtils.damp(focus.current.z, card.z, 4, dt);
    effect.target
      .lerpVectors(title, globe, handoff())
      .lerp(focus.current, handoff2())
      .lerp(teamLayout(aspect).pos, handoff3());
    // shallower blur in section 3: the whole card queue should stay readable
    effect.bokehScale = THREE.MathUtils.lerp(4, 1.2, handoff2());
  });
  return null;
}

/**
 * One-time GPU setup, in two phases so the first view appears fast.
 *
 * The first time anything is drawn, the GPU compiles its shaders and uploads its geometry
 * and textures, which stalls the page. Phase 1 prepares only what the hero shows (hidden
 * worlds are skipped by compile) and then starts the intro. Phase 2 prepares the other
 * sections' worlds right after the intro has landed — or immediately if the visitor heads
 * down sooner — so the scroll flight to them never stalls.
 */
function Warmup() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    let cancelled = false;
    const worlds = () =>
      [WARMUP_GLOBE, WARMUP_PRODUCTS, WARMUP_TEAM]
        .map((n) => scene.getObjectByName(n))
        .filter((o): o is THREE.Object3D => !!o);

    // Show every world with culling off, run `fn`, then restore.
    const withAllVisible = <T,>(fn: () => T) => {
      const restore: (() => void)[] = [];
      for (const world of worlds()) {
        const wasVisible = world.visible;
        world.visible = true;
        restore.push(() => (world.visible = wasVisible));
        world.traverse((o) => {
          if (o.frustumCulled) {
            o.frustumCulled = false; // include pieces parked off-camera
            restore.push(() => (o.frustumCulled = true));
          }
        });
      }
      try {
        return fn();
      } finally {
        restore.forEach((r) => r());
      }
    };

    const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));
    const compile = async (all: boolean) => {
      try {
        await (all ? withAllVisible(() => gl.compileAsync(scene, camera)) : gl.compileAsync(scene, camera));
      } catch {
        if (all) withAllVisible(() => gl.compile(scene, camera));
        else gl.compile(scene, camera);
      }
    };

    // Phase 1: the hero only
    const hero = async () => {
      await compile(false);
      await nextFrame();
      if (!cancelled) markStageReady();
    };

    // Phase 2: everything else
    let phase2: Promise<void> | null = null;
    const others = () =>
      (phase2 ??= (async () => {
        // card artwork redraws once the web font is in; don't wait long for it
        const font = document.fonts?.load("700 64px Montserrat") ?? Promise.resolve();
        await Promise.race([font, new Promise((r) => setTimeout(r, 800))]).catch(() => {});
        if (cancelled) return;
        await compile(true);
        const target = new THREE.WebGLRenderTarget(256, 256);
        const cam = new THREE.PerspectiveCamera(100, 1, 0.1, 200);
        const previous = gl.getRenderTarget();
        const at = new THREE.Vector3();
        for (const world of worlds()) {
          if (cancelled) break;
          world.getWorldPosition(at);
          cam.position.set(at.x, at.y, at.z + 16);
          cam.lookAt(at);
          withAllVisible(() => {
            gl.setRenderTarget(target);
            gl.render(scene, cam);
          });
          await nextFrame(); // spread the uploads over a few frames
        }
        gl.setRenderTarget(previous);
        target.dispose();
        if (!cancelled) markWorldsWarm();
      })());

    setWarmRequest(() => void others());
    hero()
      .catch(() => markStageReady()) // never leave the page waiting
      .then(() => new Promise((r) => setTimeout(r, 1900))) // once the name has landed
      .then(() => others())
      .catch(() => markWorldsWarm());
    return () => {
      cancelled = true;
      setWarmRequest(null);
    };
  }, [gl, scene, camera]);

  return null;
}

/**
 * Accent lights for the globe and the product queue. They live here, always on, rather
 * than inside the worlds: three.js compiles shaders for an exact light count, so a light
 * appearing with its world would force every material to recompile mid-scroll.
 */
function WorldLights() {
  const size = useThree((s) => s.size);
  const aspect = size.width / size.height;
  const globe = globeLayout(aspect);
  const products = productsLayout(aspect);
  const team = teamLayout(aspect);
  const at = (base: { pos: THREE.Vector3; scale: number }, offset: [number, number, number]) =>
    new THREE.Vector3(...offset).multiplyScalar(base.scale).add(base.pos).toArray();
  return (
    <>
      <pointLight position={at(globe, [3.5, -1.5, 3])} intensity={25} distance={12} />
      <pointLight position={at(products, [-3, 3, 4])} intensity={30} distance={14} />
      <pointLight position={at(team, [0, 4.5, 5.5])} intensity={16} distance={14} />
    </>
  );
}

export default function Stage() {
  const dof = useRef<DepthOfFieldEffect>(null);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 35, position: [0, 0, CAM_Z], near: 0.1, far: 100 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
    >
      <color attach="background" args={["#030303"]} />
      <fog attach="fog" args={["#030303", 16, 34]} />

      <ambientLight intensity={0.05} />
      <directionalLight position={[-5, 8, 7]} intensity={4.6} />
      <directionalLight position={[8, -3, 4]} intensity={0.5} />
      <spotLight position={[0, 3, -8]} intensity={60} angle={0.9} penumbra={1} />
      <WorldLights />

      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.5} position={[-6, 5, 6]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={0.8} position={[6, 0, 4]} scale={[4, 8, 1]} />
        <Lightformer form="ring" intensity={2} position={[0, 0, -8]} scale={6} />
      </Environment>

      <Suspense fallback={null}>
        <MotionDriver />
        <HeroWorld />
        <GlobeWorld />
        <ProductsWorld />
        <TeamWorld />
        <StarField />
        <Warmup />
      </Suspense>

      <Rig />
      <FocusDriver dof={dof} />

      <EffectComposer multisampling={4}>
        <DepthOfField ref={dof} target={[0, 0, 0]} worldFocusRange={6} bokehScale={4} />
        <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.72} luminanceSmoothing={0.2} />
        <Noise premultiply opacity={0.3} />
        <Vignette offset={0.22} darkness={0.9} />
      </EffectComposer>
    </Canvas>
  );
}
