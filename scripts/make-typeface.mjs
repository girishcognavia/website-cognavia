// Converts Montserrat (.woff from @fontsource) into three.js typeface JSON
// used by the 3D hero text. Run: node scripts/make-typeface.mjs
import fs from "node:fs";
import opentype from "opentype.js";

const WEIGHTS = { 700: "montserrat-bold", 200: "montserrat-extralight" };
const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,-!?&' ";
const r = (n) => Math.round(n);

for (const [weight, name] of Object.entries(WEIGHTS)) {
  const file = `node_modules/@fontsource/montserrat/files/montserrat-latin-${weight}-normal.woff`;
  const buf = fs.readFileSync(file);
  const font = opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
  const glyphs = {};

  for (const ch of CHARS) {
    const g = font.charToGlyph(ch);
    const o = [];
    // glyph.path is in font units, y-up. three's 'q'/'b' take the end point first.
    for (const c of g.path.commands) {
      if (c.type === "M") o.push("m", r(c.x), r(c.y));
      else if (c.type === "L") o.push("l", r(c.x), r(c.y));
      else if (c.type === "Q") o.push("q", r(c.x), r(c.y), r(c.x1), r(c.y1));
      else if (c.type === "C") o.push("b", r(c.x), r(c.y), r(c.x1), r(c.y1), r(c.x2), r(c.y2));
    }
    const bb = g.getBoundingBox();
    glyphs[ch] = { ha: r(g.advanceWidth), x_min: r(bb.x1), x_max: r(bb.x2), o: o.join(" ") };
  }

  const out = {
    glyphs,
    familyName: `Montserrat ${weight}`,
    ascender: font.ascender,
    descender: font.descender,
    underlinePosition: font.tables.post.underlinePosition,
    underlineThickness: font.tables.post.underlineThickness,
    boundingBox: { xMin: font.tables.head.xMin, yMin: font.tables.head.yMin, xMax: font.tables.head.xMax, yMax: font.tables.head.yMax },
    resolution: font.unitsPerEm,
    original_font_information: font.tables.name,
  };
  fs.writeFileSync(`public/fonts/${name}.typeface.json`, JSON.stringify(out));
  console.log(`wrote public/fonts/${name}.typeface.json (${Object.keys(glyphs).length} glyphs)`);
}
