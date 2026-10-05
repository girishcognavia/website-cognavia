/**
 * Small technical-drawing glyphs (brackets, flanges, plates) used across the CognaFileSearch
 * visuals. Purely illustrative line art.
 */
const PARTS = [
  // L-bracket with holes
  "M10 10h44v12H24v32H10z M17 16a2.5 2.5 0 1 0 0.1 0 M44 16a2.5 2.5 0 1 0 0.1 0 M17 44a2.5 2.5 0 1 0 0.1 0",
  // flange: ring with bolt holes
  "M32 8a24 24 0 1 0 0.1 0 M32 22a10 10 0 1 0 0.1 0 M32 12a2.5 2.5 0 1 0 0.1 0 M32 50a2.5 2.5 0 1 0 0.1 0 M14 32a2.5 2.5 0 1 0 0.1 0 M50 32a2.5 2.5 0 1 0 0.1 0",
  // plate with slot
  "M8 14h48v36H8z M18 26h28a6 6 0 0 1 0 12H18a6 6 0 0 1 0-12 M13 19a2 2 0 1 0 0.1 0 M51 19a2 2 0 1 0 0.1 0 M13 45a2 2 0 1 0 0.1 0 M51 45a2 2 0 1 0 0.1 0",
  // shaft with steps
  "M6 26h12v12H6z M18 22h22v20H18z M40 28h18v8H40z M29 22v20",
  // housing
  "M12 18h40v30H12z M12 26h40 M24 18v-6h16v6 M32 37a6 6 0 1 0 0.1 0",
  // gusset bracket
  "M10 54V10h8v34h36v10z M18 44 44 18v26",
];

export function Drawing({ part = 0, dims = false, className }: { part?: number; dims?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <path d={PARTS[part % PARTS.length]} fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      {dims && (
        <g className="fs-dims" stroke="currentColor" strokeWidth="0.6" fill="none">
          <path d="M10 60h44 M10 58v4 M54 58v4" />
          <path d="M60 10v44 M58 10h4 M58 54h4" />
          <path d="M4 4h8 M4 4v8" opacity="0.6" />
        </g>
      )}
    </svg>
  );
}

export const PART_COUNT = PARTS.length;
