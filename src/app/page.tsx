import { preload } from "react-dom";
import StageMount from "@/components/scene/StageMount";
import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import Products from "@/components/products/Products";
import Team from "@/components/team/Team";
import StructuredData from "@/components/StructuredData";

export default function Home() {
  // the 3D title's font outlines: fetch them in parallel with the scripts, not after them
  preload("/fonts/montserrat-bold.typeface.json", { as: "fetch", crossOrigin: "anonymous" });
  preload("/fonts/montserrat-extralight.typeface.json", { as: "fetch", crossOrigin: "anonymous" });

  return (
    <>
      <StructuredData />
      <StageMount />
      <main className="home-main">
        <Hero />
        <About />
        <Products />
        <Team />
      </main>
    </>
  );
}
