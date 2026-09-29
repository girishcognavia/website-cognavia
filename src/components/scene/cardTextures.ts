// Draws the face of each product card onto a canvas (monochrome, on-brand).
import * as THREE from "three";
import type { Product } from "@/components/products/productsData";

export const CARD_W = 1200;
export const CARD_H = 800;
const FONT = "Montserrat, 'Helvetica Neue', Arial, sans-serif";

type Theme = { bg: [string, string]; ink: string; soft: string; faint: string; pillBg: string; pillInk: string };

// Alternating light/dark faces so every card reads clearly in the stack.
const THEMES: Theme[] = [
  { bg: ["#ececec", "#c9c9c9"], ink: "#0b0b0b", soft: "rgba(0,0,0,0.55)", faint: "rgba(0,0,0,0.12)", pillBg: "#0b0b0b", pillInk: "#f2f2f2" },
  { bg: ["#1c1c1c", "#070707"], ink: "#f2f2f2", soft: "rgba(255,255,255,0.6)", faint: "rgba(255,255,255,0.12)", pillBg: "#f2f2f2", pillInk: "#0b0b0b" },
  { bg: ["#2c2c2c", "#101010"], ink: "#f2f2f2", soft: "rgba(255,255,255,0.66)", faint: "rgba(255,255,255,0.1)", pillBg: "#f2f2f2", pillInk: "#0b0b0b" },
  { bg: ["#262626", "#0c0c0c"], ink: "#f2f2f2", soft: "rgba(255,255,255,0.66)", faint: "rgba(255,255,255,0.1)", pillBg: "#f2f2f2", pillInk: "#0b0b0b" },
];

function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function wrap(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lh;
    } else line = test;
  }
  ctx.fillText(line, x, y);
}

/* ---------------- illustrations (drawn in the right-hand area) ---------------- */

function drawAssist(ctx: CanvasRenderingContext2D, t: Theme) {
  // website window with a chat widget
  const x = 560, y = 150, w = 560, h = 380;
  ctx.strokeStyle = t.soft;
  ctx.lineWidth = 2;
  rr(ctx, x, y, w, h, 18);
  ctx.stroke();
  ctx.fillStyle = t.faint;
  rr(ctx, x, y, w, 44, 18);
  ctx.fill();
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.arc(x + 26 + i * 22, y + 22, 6, 0, Math.PI * 2);
    ctx.fillStyle = t.soft;
    ctx.fill();
  });
  // page skeleton
  ctx.fillStyle = t.faint;
  [0, 1, 2, 3].forEach((i) => ctx.fillRect(x + 30, y + 80 + i * 34, 180 - i * 25, 14));
  // chat panel
  const cx = x + 250, cy = y + 66;
  ctx.fillStyle = t.pillBg;
  rr(ctx, cx, cy, 280, 290, 16);
  ctx.fill();
  const bubble = (bx: number, by: number, bw: number, fill: string) => {
    ctx.fillStyle = fill;
    rr(ctx, bx, by, bw, 38, 14);
    ctx.fill();
  };
  bubble(cx + 18, cy + 22, 170, "rgba(128,128,128,0.45)");
  bubble(cx + 92, cy + 74, 170, t.pillInk);
  bubble(cx + 18, cy + 126, 200, "rgba(128,128,128,0.45)");
  // typing dots
  ctx.fillStyle = "rgba(128,128,128,0.45)";
  rr(ctx, cx + 18, cy + 180, 84, 34, 14);
  ctx.fill();
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.arc(cx + 40 + i * 20, cy + 197, 5, 0, Math.PI * 2);
    ctx.fillStyle = t.pillInk;
    ctx.fill();
  });
  // input bar
  ctx.strokeStyle = "rgba(128,128,128,0.6)";
  rr(ctx, cx + 18, cy + 236, 244, 36, 18);
  ctx.stroke();
  // 24/7 badge
  ctx.beginPath();
  ctx.arc(x + w - 6, y + h - 6, 52, 0, Math.PI * 2);
  ctx.fillStyle = t.ink;
  ctx.fill();
  ctx.fillStyle = t.bg[0];
  ctx.font = `700 30px ${FONT}`;
  ctx.textAlign = "center";
  ctx.fillText("24/7", x + w - 6, y + h + 5);
  ctx.textAlign = "left";
}

function drawBrief(ctx: CanvasRenderingContext2D, t: Theme) {
  // long document → concise summary
  const dx = 560, dy = 130;
  ctx.fillStyle = t.faint;
  rr(ctx, dx + 18, dy + 18, 230, 390, 10);
  ctx.fill();
  ctx.fillStyle = "rgba(128,128,128,0.25)";
  rr(ctx, dx, dy, 230, 390, 10);
  ctx.fill();
  ctx.fillStyle = t.soft;
  for (let i = 0; i < 16; i++) ctx.fillRect(dx + 24, dy + 30 + i * 22, 182 - ((i * 37) % 70), 7);
  // arrow
  ctx.strokeStyle = t.ink;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(dx + 262, dy + 200);
  ctx.lineTo(dx + 336, dy + 200);
  ctx.moveTo(dx + 322, dy + 186);
  ctx.lineTo(dx + 336, dy + 200);
  ctx.lineTo(dx + 322, dy + 214);
  ctx.stroke();
  // summary card
  const sx = dx + 352, sy = dy + 110;
  ctx.fillStyle = t.pillBg;
  rr(ctx, sx, sy, 250, 190, 16);
  ctx.fill();
  ctx.fillStyle = t.pillInk;
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText("Key insights", sx + 22, sy + 42);
  [0, 1, 2].forEach((i) => {
    ctx.beginPath();
    ctx.arc(sx + 30, sy + 78 + i * 34, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(sx + 46, sy + 74 + i * 34, 160 - i * 30, 8);
  });
  // sparkle
  ctx.fillStyle = t.ink;
  const star = (x: number, y: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.quadraticCurveTo(x, y, x - r, y);
    ctx.quadraticCurveTo(x, y, x, y - r);
    ctx.fill();
  };
  star(sx + 238, sy - 10, 22);
  star(sx + 270, sy + 26, 11);
}

function drawFileSearch(ctx: CanvasRenderingContext2D, t: Theme) {
  // two technical drawings side by side, a difference highlighted
  const panel = (px: number, py: number, variant: number) => {
    const w = 270, h = 250;
    ctx.strokeStyle = t.faint;
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= w; gx += 18) {
      ctx.beginPath();
      ctx.moveTo(px + gx, py);
      ctx.lineTo(px + gx, py + h);
      ctx.stroke();
    }
    for (let gy = 0; gy <= h; gy += 18) {
      ctx.beginPath();
      ctx.moveTo(px, py + gy);
      ctx.lineTo(px + w, py + gy);
      ctx.stroke();
    }
    ctx.strokeStyle = t.ink;
    ctx.lineWidth = 2.5;
    ctx.strokeRect(px + 40, py + 60, 150, 110);
    ctx.beginPath();
    ctx.arc(px + 190, py + 115, variant ? 42 : 34, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(px + 90, py + 115, 20, 0, Math.PI * 2);
    ctx.stroke();
    // dimension line
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = t.soft;
    ctx.beginPath();
    ctx.moveTo(px + 40, py + 200);
    ctx.lineTo(px + 190, py + 200);
    ctx.stroke();
    ctx.fillStyle = t.soft;
    ctx.font = `500 16px ${FONT}`;
    ctx.fillText(variant ? "Ø 84" : "Ø 68", px + 96, py + 226);
  };
  panel(550, 160, 0);
  panel(850, 160, 1);
  // highlighted difference
  ctx.setLineDash([8, 6]);
  ctx.strokeStyle = t.ink;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(1010, 250, 110, 110);
  ctx.setLineDash([]);
  // magnifier
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(1090, 470, 44, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(1122, 502);
  ctx.lineTo(1160, 540);
  ctx.stroke();
  ctx.fillStyle = t.pillBg;
  rr(ctx, 690, 440, 220, 44, 22);
  ctx.fill();
  ctx.fillStyle = t.pillInk;
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText("1 difference found", 712, 469);
}

function drawMedibook(ctx: CanvasRenderingContext2D, t: Theme) {
  // appointment calendar with a booked slot
  const x = 580, y = 140, w = 440, h = 360;
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  rr(ctx, x, y, w, h, 18);
  ctx.fill();
  ctx.fillStyle = t.ink;
  rr(ctx, x, y, w, 58, 18);
  ctx.fill();
  ctx.fillRect(x, y + 40, w, 18);
  ctx.fillStyle = t.bg[0];
  ctx.font = `600 22px ${FONT}`;
  ctx.fillText("Appointments", x + 24, y + 37);
  const cols = 7, rows = 5, cw = (w - 40) / cols, ch = (h - 90) / rows;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) {
      const booked = r === 2 && c === 4;
      ctx.fillStyle = booked ? t.ink : t.faint;
      rr(ctx, x + 20 + c * cw + 4, y + 74 + r * ch + 4, cw - 8, ch - 8, 8);
      ctx.fill();
      if (booked) {
        ctx.strokeStyle = t.bg[0];
        ctx.lineWidth = 4;
        const bx = x + 20 + c * cw + cw / 2, by = y + 74 + r * ch + ch / 2;
        ctx.beginPath();
        ctx.moveTo(bx - 12, by);
        ctx.lineTo(bx - 3, by + 9);
        ctx.lineTo(bx + 13, by - 9);
        ctx.stroke();
      }
    }
  // medical cross badge
  const mx = x + w + 30, my = y + 40;
  ctx.beginPath();
  ctx.arc(mx, my, 50, 0, Math.PI * 2);
  ctx.fillStyle = t.ink;
  ctx.fill();
  ctx.fillStyle = t.bg[0];
  ctx.fillRect(mx - 8, my - 26, 16, 52);
  ctx.fillRect(mx - 26, my - 8, 52, 16);
  // clock
  const kx = x + w + 20, ky = y + h - 20;
  ctx.strokeStyle = t.ink;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(kx, ky, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(kx, ky);
  ctx.lineTo(kx, ky - 22);
  ctx.moveTo(kx, ky);
  ctx.lineTo(kx + 16, ky + 8);
  ctx.stroke();
}

const ILLUSTRATIONS = [drawAssist, drawBrief, drawFileSearch, drawMedibook];

function draw(canvas: HTMLCanvasElement, product: Product, index: number) {
  const t = THEMES[index % THEMES.length];
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, CARD_W, CARD_H);

  // rounded card face (transparent corners)
  ctx.save();
  rr(ctx, 0, 0, CARD_W, CARD_H, 44);
  ctx.clip();
  const g = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
  g.addColorStop(0, t.bg[0]);
  g.addColorStop(1, t.bg[1]);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // hairline grid, like a spec sheet
  ctx.strokeStyle = t.faint;
  ctx.lineWidth = 1;
  [CARD_W * 0.3, CARD_W * 0.62].forEach((gx) => {
    ctx.beginPath();
    ctx.moveTo(gx, 0);
    ctx.lineTo(gx, CARD_H);
    ctx.stroke();
  });
  [CARD_H * 0.3].forEach((gy) => {
    ctx.beginPath();
    ctx.moveTo(0, gy);
    ctx.lineTo(CARD_W, gy);
    ctx.stroke();
  });

  // corner brackets
  ctx.strokeStyle = t.soft;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 70);
  ctx.lineTo(40, 40);
  ctx.lineTo(70, 40);
  ctx.moveTo(40, CARD_H - 70);
  ctx.lineTo(40, CARD_H - 40);
  ctx.lineTo(70, CARD_H - 40);
  ctx.stroke();

  // index
  ctx.fillStyle = t.soft;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(`0${index + 1}`, 72, 64);

  // category pill (top right)
  ctx.font = `600 26px ${FONT}`;
  const pw = ctx.measureText(product.tag).width + 56;
  ctx.fillStyle = t.pillBg;
  rr(ctx, CARD_W - pw - 50, 44, pw, 58, 29);
  ctx.fill();
  ctx.fillStyle = t.pillInk;
  ctx.fillText(product.tag, CARD_W - pw - 50 + 28, 82);

  // illustration sits in the lower right, clear of the title block
  ctx.save();
  ctx.translate(0, 100);
  ILLUSTRATIONS[index % ILLUSTRATIONS.length](ctx, t);
  ctx.restore();

  // product name + description at the top, so they stay visible when a card
  // behind another one lifts out of the queue
  ctx.fillStyle = t.ink;
  ctx.font = `700 62px ${FONT}`;
  ctx.fillText(product.name, 72, 184);
  ctx.fillStyle = t.soft;
  ctx.font = `400 30px ${FONT}`;
  wrap(ctx, product.description, 72, 240, 470, 40);

  ctx.restore();
}

export function makeCardTexture(product: Product, index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const render = () => {
    draw(canvas, product, index);
    tex.needsUpdate = true;
  };
  render();
  // redraw once the web font is available to canvas
  document.fonts?.load(`700 64px Montserrat`).then(render, () => {});
  return tex;
}
