"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { scrollState } from "@/components/scene/scrollState";
import { PRODUCTS } from "./productsData";
import { productStore, useActiveProduct } from "./productStore";

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function Products() {
  const sectionRef = useRef<HTMLElement>(null);
  const active = useActiveProduct();

  useGSAP(
    () => {
      const section = sectionRef.current!;

      // Drives the globe break-up and the card queue assembly in the 3D stage.
      ScrollTrigger.create({
        trigger: section,
        start: "top 160%",
        end: "bottom bottom",
        onUpdate: (self) => {
          scrollState.products = self.progress;
        },
      });

      gsap
        .timeline({
          scrollTrigger: { trigger: section, start: "top 55%", end: "top top", scrub: true },
        })
        .from("[data-reveal]", { autoAlpha: 0, y: 40, stagger: 0.12, ease: "power2.out" });

      // ...and clears out of the way as the team section arrives.
      gsap.to([".products__intro", ".products__menu", ".products__tagline"], {
        autoAlpha: 0,
        y: "-=60",
        ease: "none",
        scrollTrigger: { trigger: section, start: "bottom 150%", end: "bottom 95%", scrub: true },
      });
    },
    { scope: sectionRef },
  );

  return (
    <section className="products" id="products" ref={sectionRef} aria-labelledby="products-title">
      {/* nav target: where the card queue has fully assembled */}
      <span className="jump" id="products-view" style={{ top: "60vh" }} aria-hidden />
      <div className="products__sticky">
        <div className="products__intro">
          <h2 className="products__title" id="products-title" data-reveal>
            Our Intelligent Suite
          </h2>
          <p className="products__sub" data-reveal>
            Powerful AI products designed for specific enterprise needs.
          </p>
        </div>

        {/* Rows never change size, so nothing shifts under the cursor while hovering down
            the list. Each product's description is printed on its 3D card. */}
        <div className="products__menu" onMouseLeave={() => productStore.set(-1)}>
          <ol className="products__list">
            {PRODUCTS.map((p, i) => (
              <li key={p.name} data-reveal>
                <button
                  type="button"
                  className={`products__item${active === i ? " is-active" : ""}`}
                  aria-pressed={active === i}
                  aria-label={`${p.name}: ${p.description}`}
                  onMouseEnter={() => productStore.set(i)}
                  onFocus={() => productStore.set(i)}
                  onClick={() => productStore.set(active === i ? -1 : i)}
                >
                  <span className="products__num">0{i + 1}</span>
                  <span className="products__name">{p.name}</span>
                  <span className="products__arrow" aria-hidden>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M3 11L11 3M5 3h6v6" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <dl className="sr-only">
          {PRODUCTS.map((p) => (
            <div key={p.name}>
              <dt>{p.name}</dt>
              <dd>
                {p.tag}. {p.description}
              </dd>
            </div>
          ))}
        </dl>

        <p className="products__tagline" data-reveal>
          One suite.
          <br />
          Bigger possibilities.
        </p>
      </div>
    </section>
  );
}
