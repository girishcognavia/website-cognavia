"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";

/**
 * Readies a canvas before it is ever seen: compiles every shader (hidden objects included),
 * uploads geometry and textures, and runs one frame through post-processing, shortly after the
 * page loads. The first frame on screen is then as cheap as any other.
 */
export default function Prepare({ delay = 0 }: { delay?: number }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const advance = useThree((s) => s.advance);
  useEffect(() => {
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      const restore: (() => void)[] = [];
      scene.traverse((o) => {
        if (!o.visible) {
          o.visible = true;
          restore.push(() => (o.visible = false));
        }
      });
      Promise.resolve(gl.compileAsync(scene, camera))
        .catch(() => gl.compile(scene, camera))
        .then(() => {
          if (cancelled) return restore.forEach((r) => r());
          requestAnimationFrame(() => {
            gl.render(scene, camera);
            restore.forEach((r) => r());
            requestAnimationFrame(() => !cancelled && advance(performance.now()));
          });
        })
        .catch(() => restore.forEach((r) => r()));
    };
    // soon after load (before the visitor has scrolled anywhere), staggered by `delay`
    const t = window.setTimeout(run, delay);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [gl, scene, camera, advance, delay]);
  return null;
}
