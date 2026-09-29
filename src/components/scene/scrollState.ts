// Shared, mutable scroll state for the 3D stage. Written by ScrollTrigger in the
// section components, read every frame inside the R3F scene (no React re-renders).
export const scrollState = {
  /** Hero: 0 at the top, 1 when the fly-through has finished */
  hero: 0,
  /** About: 0 when the section is 60vh below the fold, ABOUT_SETTLE when it reaches the top, 1 at its end */
  about: 0,
  /** Products: same shape as about — 0 at 60vh below the fold, PRODUCTS_SETTLE in place, 1 at its end */
  products: 0,
  /** Team: same shape — 0 at 60vh below the fold, TEAM_SETTLE in place, 1 at its end */
  team: 0,
};

/** about-progress at which section 2 is fully in place (160vh of its 260vh scroll range). */
export const ABOUT_SETTLE = 160 / 260;

/** products-progress at which section 3 is fully in place (same 260vh range as about). */
export const PRODUCTS_SETTLE = 160 / 260;

/** team-progress at which section 4 is fully in place (same 260vh range). */
export const TEAM_SETTLE = 160 / 260;
