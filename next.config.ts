import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Static site: `next build` writes plain HTML/CSS/JS to ./out, which GitHub Pages serves
  // at https://cognavia.ai (see .github/workflows/deploy.yml).
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
