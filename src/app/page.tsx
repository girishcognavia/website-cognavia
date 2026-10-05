import Hero from "@/components/hero/Hero";
import About from "@/components/about/About";
import Products from "@/components/products/Products";
import Team from "@/components/team/Team";
import StructuredData from "@/components/StructuredData";

export default function Home() {
  return (
    <>
      <StructuredData />
      <main className="home-main">
        <Hero />
        <About />
        <Products />
        <Team />
      </main>
    </>
  );
}
