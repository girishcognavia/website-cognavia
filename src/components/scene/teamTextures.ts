// Canvas artwork for the leadership cards (monochrome).
import * as THREE from "three";
import type { Leader } from "@/components/team/teamData";

export const TEAM_CARD_W = 1200;
export const TEAM_CARD_H = 880;
const FONT = "Montserrat, 'Helvetica Neue', Arial, sans-serif";

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

function drawCard(canvas: HTMLCanvasElement, leader: Leader) {
  const W = TEAM_CARD_W, H = TEAM_CARD_H;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);

  // dark, see-through glass face
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, W, H, 40);
  ctx.clip();
  const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
  bg.addColorStop(0, "rgba(16,16,16,0.62)");
  bg.addColorStop(1, "rgba(2,2,2,0.8)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  // soft sheen across the top
  const sheen = ctx.createLinearGradient(0, 0, 0, H * 0.45);
  sheen.addColorStop(0, "rgba(255,255,255,0.06)");
  sheen.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, W, H);

  // role pill (top right)
  ctx.font = `700 38px ${FONT}`;
  const pw = Math.max(170, ctx.measureText(leader.role).width + 90);
  const px = W - pw - 70, py = 70, ph = 80;
  ctx.beginPath();
  ctx.roundRect(px, py, pw, ph, ph / 2);
  ctx.fillStyle = "#050505"; // solid, so nothing behind the card shows through the label
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(255,255,255,0.9)";
  ctx.stroke();
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.fillText(leader.role, px + pw / 2, py + 52);
  ctx.textAlign = "left";

  // name, accent rule, bio
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 78px ${FONT}`;
  ctx.fillText(leader.name, 90, 640);
  ctx.beginPath();
  ctx.roundRect(90, 672, 118, 7, 4);
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.84)";
  ctx.font = `400 37px ${FONT}`;
  wrap(ctx, leader.bio, 90, 750, 1000, 50);

  ctx.restore();
}

export function makeTeamCardTexture(leader: Leader) {
  const canvas = document.createElement("canvas");
  canvas.width = TEAM_CARD_W;
  canvas.height = TEAM_CARD_H;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const render = () => {
    drawCard(canvas, leader);
    tex.needsUpdate = true;
  };
  render();
  document.fonts?.load(`700 78px Montserrat`).then(render, () => {});
  return tex;
}

/**
 * Round portrait. Until a photo is set it stays an empty dark glass disc; once
 * `leader.photo` is set, the image is cover-fitted, converted to black & white and shown.
 */
export function makePortraitTexture(leader: Leader) {
  const S = 640;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  const disc = () => {
    ctx.clearRect(0, 0, S, S);
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2, 0, Math.PI * 2);
    ctx.closePath();
  };

  // empty state: dark glass with a faint inner light
  disc();
  const g = ctx.createRadialGradient(S * 0.4, S * 0.35, 0, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(26,26,26,0.7)");
  g.addColorStop(1, "rgba(2,2,2,0.95)");
  ctx.fillStyle = g;
  ctx.fill();
  tex.needsUpdate = true;

  if (leader.photo) {
    const img = new Image();
    img.onload = () => {
      disc();
      ctx.save();
      ctx.clip();
      const scale = Math.max(S / img.width, S / img.height);
      const w = img.width * scale, h = img.height * scale;
      ctx.filter = "grayscale(1) contrast(1.05)";
      ctx.drawImage(img, (S - w) / 2, (S - h) / 2.6, w, h); // bias toward the face
      ctx.filter = "none";
      // gentle vignette so the photo sits inside the glass
      const v = ctx.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S / 2);
      v.addColorStop(0, "rgba(0,0,0,0)");
      v.addColorStop(1, "rgba(0,0,0,0.45)");
      ctx.fillStyle = v;
      ctx.fillRect(0, 0, S, S);
      ctx.restore();
      tex.needsUpdate = true;
    };
    img.src = leader.photo;
  }
  return tex;
}
