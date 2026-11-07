// What the device can afford for the 3D scenes. Checked once, kept free of three.js.
//
// "lite": no graphics hardware (WebGL drawn in software — old or locked-down machines, virtual
// machines, and the automated test browsers used by speed tools). Every animated frame costs
// seconds there, so the scenes show one finished still frame instead of animating.
// "mobile": phones and small tablets — fewer stars and a lower render resolution.

export type GpuTier = { lite: boolean; mobile: boolean };

let cached: GpuTier | null = null;

export function gpuTier(): GpuTier {
  if (cached) return cached;
  if (typeof window === "undefined") return { lite: false, mobile: false };
  let lite = false;
  try {
    const c = document.createElement("canvas");
    // a software-only WebGL context is refused when it would be a "major performance caveat"
    const gl = (c.getContext("webgl2", { failIfMajorPerformanceCaveat: true }) ||
      c.getContext("webgl", { failIfMajorPerformanceCaveat: true })) as WebGLRenderingContext | null;
    if (!gl) lite = true;
    else {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
      if (/swiftshader|llvmpipe|software|basic render/i.test(name)) lite = true;
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    }
  } catch {
    lite = true;
  }
  const mobile = matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  cached = { lite, mobile };
  return cached;
}
