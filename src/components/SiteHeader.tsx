"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PRODUCTS, productHref } from "@/components/products/productsData";
import { getLenis } from "@/components/SmoothScroll";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Home's left-edge indicator. Jump targets land where each 3D scene has fully settled. */
const SECTIONS = [
  { n: 1, href: "#top" },
  { n: 2, href: "#about" },
  { n: 3, href: "#products-view" },
  { n: 4, href: "#team-view" },
];

// Main menu. Home / About us / Products are their own views; Contact scrolls to the footer
// (present on every view).
const NAV = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "About us", href: "/about", match: (p: string) => p === "/about" },
  { label: "Products", href: "/products", match: (p: string) => p.startsWith("/products"), dropdown: true },
  { label: "Customers", href: "#", match: () => false }, // [customers view — not built yet]
  { label: "Contact us", href: "#contact", match: () => false },
];

/**
 * Fixed site header + left section indicator.
 * Hidden on the hero; slides in once section 2 starts arriving, and hides again on the way back up.
 */
export default function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [heroPassed, setHeroPassed] = useState(false);
  const visible = !isHome || heroPassed;
  const [active, setActive] = useState(1);
  const [productsOpen, setProductsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false); // phones
  // Home only: the side indicator appears after the hero (the header itself shows from the
  // first section — see globals.css), and track which section is on screen
  useGSAP(
    () => {
      if (!isHome) return;
      setHeroPassed(false);
      setActive(1);
    ScrollTrigger.create({
      trigger: "#about",
      start: "top 70%",
      onEnter: () => setHeroPassed(true),
      onLeaveBack: () => {
        setHeroPassed(false);
        setProductsOpen(false);
        setMenuOpen(false);
      },
    });
    ScrollTrigger.create({
      trigger: "#about",
      start: "top 50%",
      onEnter: () => setActive(2),
      onLeaveBack: () => setActive(1),
    });
    ScrollTrigger.create({
      trigger: "#products",
      start: "top 50%",
      onEnter: () => setActive(3),
      onLeaveBack: () => setActive(2),
    });
    ScrollTrigger.create({
      trigger: "#team",
      start: "top 50%",
      onEnter: () => setActive(4),
      onLeaveBack: () => setActive(3),
    });
    },
    { dependencies: [isHome], revertOnUpdate: true },
  );

  // close menus whenever the view changes
  useEffect(() => {
    setProductsOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  // close the dropdown on an outside click or Escape
  useEffect(() => {
    if (!productsOpen && !menuOpen) return;
    const onDown = (e: PointerEvent) => {
      if (!(e.target as HTMLElement).closest(".site-header")) {
        setProductsOpen(false);
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setProductsOpen(false);
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [productsOpen, menuOpen]);

  const closeAll = () => {
    setProductsOpen(false);
    setMenuOpen(false);
  };

  // Home link while already on Home: glide back to the top instead of re-navigating
  const goHome = (e: React.MouseEvent) => {
    closeAll();
    if (isHome) {
      e.preventDefault();
      if (window.location.hash) history.replaceState(null, "", "/");
      getLenis()?.scrollTo(0);
    }
  };

  // hover opens on devices with a mouse; click/tap toggles everywhere
  const canHover = () => typeof window !== "undefined" && matchMedia("(hover: hover)").matches;

  return (
    <div className={`site-chrome${visible ? " is-visible" : ""}`}>
      <header className={`site-header${menuOpen ? " is-menu-open" : ""}`}>
        <Link href="/" className="site-header__logo" aria-label="Cognavia.ai — home" onClick={goHome}>
          {/* Logo image goes here later */}
          Cognavia.ai
        </Link>

        <button
          type="button"
          className="site-header__burger"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          aria-controls="site-menu"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
        </button>

        <nav className="site-header__nav" id="site-menu" aria-label="Main">
          <ul className="site-nav">
            {NAV.map((item) =>
              item.dropdown ? (
                <li
                  key={item.label}
                  className={`site-nav__dropdown${productsOpen ? " is-open" : ""}`}
                  onMouseEnter={() => canHover() && setProductsOpen(true)}
                  onMouseLeave={() => canHover() && setProductsOpen(false)}
                >
                  <button
                    type="button"
                    className={`site-nav__link${item.match(pathname) ? " is-active" : ""}`}
                    aria-expanded={productsOpen}
                    aria-controls="products-menu"
                    onClick={() => setProductsOpen((o) => !o)}
                  >
                    {item.label}
                    <svg className="site-nav__chevron" width="10" height="10" viewBox="0 0 10 10" aria-hidden>
                      <path d="M1.5 3.5L5 7l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
                    </svg>
                  </button>
                  <ul className="site-nav__menu" id="products-menu">
                    <li>
                      <Link href="/products" className="site-nav__all" onClick={closeAll}>
                        All products
                        <span aria-hidden>→</span>
                      </Link>
                    </li>
                    {PRODUCTS.map((p, i) => (
                      <li key={p.name}>
                        <Link
                          href={productHref(p)}
                          aria-current={pathname === productHref(p) ? "page" : undefined}
                          onClick={closeAll}
                        >
                          <span className="site-nav__num">0{i + 1}</span>
                          <span className="site-nav__product">
                            <span className="site-nav__name">{p.name}</span>
                            <span className="site-nav__tag">{p.tag}</span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              ) : (
                <li key={item.label}>
                  {item.href.startsWith("/") ? (
                    <Link
                      href={item.href}
                      className={`site-nav__link${item.match(pathname) ? " is-active" : ""}`}
                      aria-current={item.match(pathname) ? "page" : undefined}
                      onClick={item.href === "/" ? goHome : closeAll}
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <a href={item.href} className="site-nav__link" onClick={closeAll}>
                      {item.label}
                    </a>
                  )}
                </li>
              ),
            )}
          </ul>
        </nav>
      </header>

      {isHome && (
        <nav className="section-indicator" aria-label="Sections">
          {SECTIONS.map((s) => (
            <a key={s.n} href={s.href} className={s.n === active ? "is-active" : undefined}>
              {s.n}
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
