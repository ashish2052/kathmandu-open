// House 026. Pyaphal row, west face of OSM way 907080054, edge 6, 7.15 m.
// Spec: research/houses200/026/design.md
// Origin: front-left ground corner. +X along the street toward north, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// After place.js yaw 180, x = 0 is photo-right (south, toward Narayan Dai / house 004).
// Still: pano WWOJ660kXAYzFurDrI3Odg, ref/a_76_lv (yaw 76, pitch 8 down, hfov 70). Copy that frame.
// Readable boards only: NEWA STITCHING & HANDICRAFT, and Durbar Fashion Wear.
// The blue-shutter shop further north is way 907080053. The red momo house is way 343060498.
// Opus pass 23 Oct: grey plaster piers and arched door, teal awning, dress forms in printed gowns,
// lit stock wall, two-window brick floors, grime decal, white downpipe, CCTV, sagging cable.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.15;
const D = 8.46;
const T = 0.22;
const ROOF = 10.9;
const SHOP_D = 3.2;

function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + (z || 0) * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTex(c, srgb) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

// Thin Newari courses (about 6.4 cm), dull red-brown #6f544b, dusty mud mortar, a few burnt and spalled bricks.
function brickTex() {
  const w = 1024;
  const h = 1024;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(26);
  const cols = 11;
  const rows = 36;
  const bw = w / cols;
  const bh = h / rows;
  g.fillStyle = "#7a6c60";
  g.fillRect(0, 0, w, h);
  const pal = [
    [111, 84, 75], [122, 88, 72], [98, 72, 63], [128, 94, 78],
    [104, 78, 68], [116, 84, 72], [86, 64, 56], [134, 98, 82], [118, 92, 82],
  ];
  for (let row = 0; row < rows; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col < cols + 1; col++) {
      const p = pal[Math.floor(r() * pal.length)];
      let j = 0.86 + r() * 0.2;
      if (r() > 0.94) j *= 0.72;
      const x = col * bw + off + 1.6;
      const y = row * bh + 1.6;
      g.fillStyle = "rgb(" + Math.floor(p[0] * j) + "," + Math.floor(p[1] * j) + "," + Math.floor(p[2] * j) + ")";
      g.fillRect(x, y, bw - 3.2, bh - 3.2);
      g.fillStyle = "rgba(255,230,210,0.06)";
      g.fillRect(x, y, bw - 3.2, 2);
      g.fillStyle = "rgba(30,20,16,0.18)";
      g.fillRect(x, y + bh - 5.5, bw - 3.2, 2);
      if (r() > 0.88) {
        g.fillStyle = "rgba(60,46,40,0.45)";
        g.beginPath();
        g.ellipse(x + r() * bw * 0.8, y + bh * 0.5, 6 + r() * 12, 3 + r() * 4, 0, 0, Math.PI * 2);
        g.fill();
      }
      for (let k = 0; k < 6; k++) {
        g.fillStyle = r() > 0.5 ? "rgba(40,28,22,0.18)" : "rgba(170,140,120,0.12)";
        g.fillRect(x + r() * (bw - 6), y + r() * (bh - 6), 2, 2);
      }
    }
  }
  return toTex(c, true);
}

// Grey plaster of the shop storey: dull blue-grey, scuffs, chipped corners, damp foot.
function plasterTex() {
  const c = canvas(512, 512);
  const g = c.getContext("2d");
  const r = rng(126);
  g.fillStyle = "#8f979a";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 900; i++) {
    const a = 0.03 + r() * 0.06;
    g.fillStyle = r() > 0.5 ? "rgba(60,64,66," + a + ")" : "rgba(190,196,196," + a + ")";
    g.beginPath();
    g.ellipse(r() * 512, r() * 512, 4 + r() * 30, 3 + r() * 16, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 14; i++) {
    g.fillStyle = "rgba(120,104,92,0.35)";
    g.fillRect(r() * 500, r() * 500, 6 + r() * 18, 4 + r() * 10);
  }
  return toTex(c, true);
}

// Corrugated teal sheet: sun-dulled paint, rust at the laps, dust streaks down the fall.
function sheetTex() {
  const c = canvas(512, 256);
  const g = c.getContext("2d");
  const r = rng(226);
  g.fillStyle = "#5c6762";
  g.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 60; i++) {
    const x = r() * 512;
    const grd = g.createLinearGradient(0, 0, 0, 256);
    grd.addColorStop(0, "rgba(180,176,160,0)");
    grd.addColorStop(1, "rgba(150,140,120," + (0.1 + r() * 0.2) + ")");
    g.fillStyle = grd;
    g.fillRect(x, 0, 2 + r() * 8, 256);
  }
  for (let i = 0; i < 18; i++) {
    g.fillStyle = "rgba(110,60,36," + (0.2 + r() * 0.3) + ")";
    g.fillRect(r() * 512, 236 + r() * 20, 6 + r() * 30, 4 + r() * 8);
  }
  return toTex(c, true);
}

// Printed gown fabric, white base so vertex colour tints it: buti dots, vine stripes, a hem border.
function printTex() {
  const c = canvas(256, 512);
  const g = c.getContext("2d");
  const r = rng(326);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 160; i++) {
    const x = r() * 256;
    const y = 80 + r() * 432;
    g.fillStyle = r() > 0.5 ? "rgba(255,240,200,0.9)" : "rgba(90,70,60,0.35)";
    g.beginPath();
    g.arc(x, y, 2 + r() * 4, 0, Math.PI * 2);
    g.fill();
  }
  g.strokeStyle = "rgba(255,226,160,0.85)";
  g.lineWidth = 3;
  for (let x = 16; x < 256; x += 48) {
    g.beginPath();
    for (let y = 80; y < 512; y += 8) g.lineTo(x + Math.sin(y * 0.08) * 6, y);
    g.stroke();
  }
  g.fillStyle = "rgba(240,210,140,0.9)";
  g.fillRect(0, 0, 256, 26);
  g.fillStyle = "rgba(80,40,30,0.4)";
  for (let x = 0; x < 256; x += 12) g.fillRect(x, 8, 6, 10);
  return toTex(c, true);
}

// 4 x 2 white alpha atlas of garment cut-outs: kurta, printed kurta, sari drape, frock, dupatta, lehenga, top, gown.
function garmentAtlas() {
  const cw = 128;
  const ch = 256;
  const c = canvas(cw * 4, ch * 2);
  const g = c.getContext("2d");
  const r = rng(426);
  function cell(i, draw) {
    g.save();
    g.translate((i % 4) * cw, Math.floor(i / 4) * ch);
    g.beginPath();
    draw();
    g.fillStyle = "#f4f2ee";
    g.fill();
    g.clip();
    for (let k = 0; k < 40; k++) {
      g.fillStyle = "rgba(70,60,56," + (0.1 + r() * 0.2) + ")";
      g.beginPath();
      g.arc(r() * cw, r() * ch, 1.5 + r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let x = 10; x < cw; x += 22) {
      g.fillStyle = "rgba(40,30,30,0.12)";
      g.fillRect(x, 0, 5, ch);
    }
    g.fillStyle = "rgba(40,30,28,0.55)";
    g.beginPath();
    g.ellipse(cw / 2, 14, 12, 9, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "rgba(230,200,130,0.8)";
    g.fillRect(0, ch - 22, cw, 8);
    g.restore();
  }
  const kurta = () => { g.moveTo(40, 6); g.lineTo(88, 6); g.lineTo(124, 40); g.lineTo(112, 92); g.lineTo(98, 70); g.lineTo(104, 250); g.lineTo(24, 250); g.lineTo(30, 70); g.lineTo(16, 92); g.lineTo(4, 40); };
  cell(0, kurta);
  cell(1, kurta);
  cell(2, () => { g.moveTo(30, 4); g.lineTo(100, 4); g.quadraticCurveTo(128, 130, 120, 252); g.lineTo(8, 252); g.quadraticCurveTo(2, 120, 30, 4); });
  cell(3, () => { g.moveTo(44, 6); g.lineTo(84, 6); g.lineTo(100, 34); g.lineTo(92, 90); g.lineTo(126, 210); g.lineTo(2, 210); g.lineTo(36, 90); g.lineTo(28, 34); });
  cell(4, () => { g.moveTo(44, 2); g.lineTo(84, 2); g.lineTo(90, 254); g.lineTo(38, 254); });
  cell(5, () => { g.moveTo(46, 4); g.lineTo(82, 4); g.lineTo(94, 60); g.lineTo(84, 96); g.lineTo(126, 252); g.lineTo(2, 252); g.lineTo(44, 96); g.lineTo(34, 60); });
  cell(6, () => { g.moveTo(40, 8); g.lineTo(88, 8); g.lineTo(124, 36); g.lineTo(112, 70); g.lineTo(98, 56); g.lineTo(100, 150); g.lineTo(28, 150); g.lineTo(30, 56); g.lineTo(16, 70); g.lineTo(4, 36); });
  cell(7, () => { g.moveTo(42, 4); g.lineTo(86, 4); g.lineTo(96, 40); g.lineTo(90, 80); g.lineTo(116, 252); g.lineTo(12, 252); g.lineTo(38, 80); g.lineTo(32, 40); });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Lit back wall of the shop: shelves of folded stock in plastic, a rail of kurtas, grey-blue paint.
function stockTex() {
  const c = canvas(1024, 512);
  const g = c.getContext("2d");
  const r = rng(526);
  g.fillStyle = "#6f7f86";
  g.fillRect(0, 0, 1024, 512);
  const cols = ["#b0303e", "#d68aa0", "#e8e2d6", "#3e6a52", "#c25a2a", "#7a3a6a", "#d4b060", "#2e4a7a", "#e0c8c0"];
  for (let s = 0; s < 4; s++) {
    const y = 40 + s * 110;
    g.fillStyle = "#4a3a30";
    g.fillRect(0, y + 92, 1024, 10);
    let x = 6;
    while (x < 1010) {
      const w = 34 + r() * 30;
      const n = 3 + Math.floor(r() * 5);
      for (let k = 0; k < n; k++) {
        const hh = 9 + r() * 6;
        g.fillStyle = cols[Math.floor(r() * cols.length)];
        g.fillRect(x, y + 92 - (k + 1) * hh, w - 4, hh - 1.5);
        g.fillStyle = "rgba(255,255,255,0.12)";
        g.fillRect(x, y + 92 - (k + 1) * hh, w - 4, 2);
      }
      x += w;
    }
  }
  g.fillStyle = "rgba(20,24,28,0.35)";
  g.fillRect(0, 0, 1024, 40);
  return toTex(c, true);
}

// Facade grime decal in metres (x 0..W, y 3.15..10.55): damp above the fascia, sill streaks, soot under bands.
function grimeTex(holes) {
  const ppm = 120;
  const y0 = 3.15;
  const H = 7.4;
  const c = canvas(Math.round(W * ppm), Math.round(H * ppm));
  const g = c.getContext("2d");
  const r = rng(626);
  const X = (x) => x * ppm;
  const Y = (y) => (y0 + H - y) * ppm;
  let grd = g.createLinearGradient(0, Y(3.9), 0, Y(3.15));
  grd.addColorStop(0, "rgba(28,22,18,0)");
  grd.addColorStop(1, "rgba(28,22,18,0.5)");
  g.fillStyle = grd;
  g.fillRect(0, Y(3.9), c.width, Y(3.15) - Y(3.9));
  for (const by of [6.05, 8.45, 10.55]) {
    grd = g.createLinearGradient(0, Y(by), 0, Y(by - 0.7));
    grd.addColorStop(0, "rgba(20,16,14,0.45)");
    grd.addColorStop(1, "rgba(20,16,14,0)");
    g.fillStyle = grd;
    g.fillRect(0, Y(by), c.width, Y(by - 0.7) - Y(by));
  }
  for (const h of holes) {
    for (let k = 0; k < 7; k++) {
      const x = h.x - h.w / 2 + r() * h.w;
      const top = h.y - h.h / 2 - 0.08;
      const len = 0.4 + r() * 1.1;
      grd = g.createLinearGradient(0, Y(top), 0, Y(top - len));
      grd.addColorStop(0, "rgba(26,20,16,0.42)");
      grd.addColorStop(1, "rgba(26,20,16,0)");
      g.fillStyle = grd;
      g.fillRect(X(x), Y(top), 4 + r() * 14, Y(top - len) - Y(top));
    }
  }
  for (let i = 0; i < 70; i++) {
    g.fillStyle = "rgba(30,24,20," + (0.05 + r() * 0.12) + ")";
    g.beginPath();
    g.ellipse(r() * c.width, r() * c.height, 10 + r() * 70, 6 + r() * 40, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = "rgba(190,170,150," + (0.08 + r() * 0.12) + ")";
    g.fillRect(r() * c.width, r() * c.height, 6 + r() * 20, 3 + r() * 8);
  }
  for (const h of holes) g.clearRect(X(h.x - h.w / 2), Y(h.y + h.h / 2), h.w * ppm, h.h * ppm);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function boxGeo(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  return geo;
}

function place(g, x, y, z, rx, ry, rz) {
  g.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  return g;
}

function cells(x0, x1, y0, y1, holes) {
  const xs = [x0, x1];
  const ys = [y0, y1];
  for (const hole of holes) {
    const a = Math.max(x0, hole.x - hole.w / 2);
    const b = Math.min(x1, hole.x + hole.w / 2);
    const c = Math.max(y0, hole.y - hole.h / 2);
    const d = Math.min(y1, hole.y + hole.h / 2);
    if (b - a > 0.02 && d - c > 0.02) {
      xs.push(+a.toFixed(4), +b.toFixed(4));
      ys.push(+c.toFixed(4), +d.toFixed(4));
    }
  }
  const uniq = (arr) => [...new Set(arr)].sort((p, q) => p - q);
  const X = uniq(xs);
  const Y = uniq(ys);
  const out = [];
  for (let i = 0; i < X.length - 1; i++) {
    for (let j = 0; j < Y.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2;
      const cy = (Y[j] + Y[j + 1]) / 2;
      const bw = X[i + 1] - X[i];
      const bh = Y[j + 1] - Y[j];
      if (bw < 0.015 || bh < 0.015) continue;
      const inside = holes.some((hole) => Math.abs(cx - hole.x) < hole.w / 2 - 0.001 && Math.abs(cy - hole.y) < hole.h / 2 - 0.001);
      if (!inside) out.push({ x: cx, y: cy, w: bw, h: bh });
    }
  }
  return out;
}

// Vertex tint with damp foot, and an overcast shade term: dark under the awning, darker with shop depth.
function paintVary(g, tint, damp, shade) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.93 + 0.07 * hash(x * 1.7, y * 1.3, z * 1.7);
    if (damp) {
      const foot = Math.max(0, 0.7 - y) * 0.45;
      k *= 1 - foot;
    }
    if (shade && y < 3.0) {
      k *= z > 0 ? Math.max(0.16, 0.5 - z * 0.13) : 0.55;
    }
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

function worldUV(g, sx, sy) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / sx, p.getZ(i) / sx);
    else if (ax >= az) uv.setXY(i, p.getZ(i) / sx, p.getY(i) / sy);
    else uv.setXY(i, p.getX(i) / sx, p.getY(i) / sy);
  }
}

function signNewa() {
  const c = canvas(512, 280);
  const g = c.getContext("2d");
  const r = rng(726);
  g.fillStyle = "#d9b845";
  g.fillRect(0, 0, 512, 280);
  g.strokeStyle = "#5a4020";
  g.lineWidth = 10;
  g.strokeRect(8, 8, 496, 264);
  g.fillStyle = "#6a2a14";
  g.font = "bold 66px Impact, sans-serif";
  g.textAlign = "center";
  g.fillText("NEWA", 256, 82);
  g.font = "bold 48px Impact, sans-serif";
  g.fillText("STITCHING &", 256, 152);
  g.fillText("HANDICRAFT", 256, 218);
  for (let i = 0; i < 50; i++) {
    g.fillStyle = "rgba(70,50,30," + (0.05 + r() * 0.1) + ")";
    g.fillRect(r() * 512, r() * 280, 4 + r() * 40, 2 + r() * 6);
  }
  const grd = g.createLinearGradient(0, 180, 0, 280);
  grd.addColorStop(0, "rgba(60,40,20,0)");
  grd.addColorStop(1, "rgba(60,40,20,0.35)");
  g.fillStyle = grd;
  g.fillRect(0, 180, 512, 100);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// White board: red script name top-left, smaller unread lines as faint smudges, a woman's photo on the right.
function signDurbar() {
  const c = canvas(640, 280);
  const g = c.getContext("2d");
  const r = rng(826);
  g.fillStyle = "#ece8de";
  g.fillRect(0, 0, 640, 280);
  g.strokeStyle = "#9a9088";
  g.lineWidth = 6;
  g.strokeRect(3, 3, 634, 274);
  for (const [cx, dress] of [[70, "#c87890"], [570, "#b03a52"]]) {
    g.fillStyle = "#d4c8bc";
    g.fillRect(cx - 58, 16, 116, 248);
    g.fillStyle = "#3a2622";
    g.beginPath();
    g.ellipse(cx, 80, 28, 36, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#c89878";
    g.beginPath();
    g.ellipse(cx, 88, 20, 26, 0, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = dress;
    g.beginPath();
    g.moveTo(cx - 44, 264);
    g.lineTo(cx - 34, 140);
    g.quadraticCurveTo(cx, 118, cx + 34, 140);
    g.lineTo(cx + 44, 264);
    g.fill();
  }
  g.fillStyle = "#a82a30";
  g.font = "italic bold 48px Georgia, serif";
  g.textAlign = "center";
  g.fillText("Durbar Fashion Wear", 320, 86);
  for (let row = 0; row < 3; row++) {
    for (let x = 150; x < 490; x += 12 + r() * 20) {
      g.fillStyle = "rgba(60,50,60," + (0.18 + r() * 0.16) + ")";
      g.fillRect(x, 140 + row * 36, 8 + r() * 16, 10);
    }
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = "rgba(90,80,60," + (0.04 + r() * 0.08) + ")";
    g.fillRect(r() * 640, r() * 280, 6 + r() * 50, 2 + r() * 8);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// Small red-topped print on the left pier; the words are not readable in the still, so smudges only.
function posterTex() {
  const c = canvas(128, 200);
  const g = c.getContext("2d");
  g.fillStyle = "#e6e2d8";
  g.fillRect(0, 0, 128, 200);
  g.fillStyle = "#b2282c";
  g.fillRect(0, 0, 128, 60);
  g.fillStyle = "rgba(40,40,50,0.4)";
  for (let y = 80; y < 190; y += 18) g.fillRect(12, y, 104, 7);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createHouse026() {
  const root = new THREE.Group();
  root.name = "house-026";

  // Photo a_76: open bays with dress forms on the right, grey piers and an arched door on the left.
  const bay = { x: 2.45, y: 1.36, w: 3.8, h: 2.72 };
  const arches = [{ x: 4.95, y: 1.15, w: 0.7, h: 2.3 }, { x: 6.35, y: 1.15, w: 0.8, h: 2.3 }];
  const midHoles = [
    { x: 2.9, y: 4.75, w: 0.95, h: 1.25 },
    { x: 5.6, y: 4.6, w: 0.85, h: 1.55 },
  ];
  // Sampled from the still: brick rendered 0.79 of the photo and too red; the grey piers sit in deep shade.
  const BRICK = [1.22, 1.36, 1.38];
  const GREY = [0.28, 0.32, 0.35];
  const highHoles = [
    { x: 2.9, y: 7.2, w: 0.85, h: 1.1 },
    { x: 6.1, y: 7.2, w: 0.8, h: 1.05 },
  ];
  const signHoles = [
    { x: 2.85, y: 3.68, w: 2.1, h: 0.9 },
    { x: 4.5, y: 6.75, w: 1.7, h: 0.85 },
  ];

  const atlas = garmentAtlas();
  const stock = stockTex();
  const cut = { map: atlas, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, metalness: 0, vertexColors: true };
  const mats = {
    brick: new THREE.MeshStandardMaterial({ map: brickTex(), color: 0xffffff, roughness: 0.94, metalness: 0, vertexColors: true }),
    grime: new THREE.MeshStandardMaterial({
      map: grimeTex([...midHoles, ...highHoles, ...signHoles]), transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 1, metalness: 0,
    }),
    shop: new THREE.MeshStandardMaterial({ map: plasterTex(), color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5c4034, roughness: 0.8, metalness: 0, vertexColors: true }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x3a2c24, roughness: 0.78, metalness: 0, vertexColors: true }),
    plaster: new THREE.MeshStandardMaterial({ color: 0xc4b2a2, roughness: 0.88, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x4a5250, roughness: 0.2, metalness: 0, transparent: true, opacity: 0.7, vertexColors: true }),
    gown: new THREE.MeshStandardMaterial({ map: printTex(), roughness: 0.95, metalness: 0, vertexColors: true }),
    skin: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0, vertexColors: true }),
    cut: new THREE.MeshStandardMaterial(cut),
    stock: new THREE.MeshStandardMaterial({ map: stock, emissiveMap: stock, emissive: 0xffffff, emissiveIntensity: 0.14, roughness: 0.9, metalness: 0, vertexColors: true }),
    tube: new THREE.MeshStandardMaterial({ color: 0xf4f8ff, emissive: 0xeef4ff, emissiveIntensity: 1.4, roughness: 0.4, metalness: 0 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1412, roughness: 0.92, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: 0.6, metalness: 0.05, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8a9298, roughness: 0.5, metalness: 0.3, vertexColors: true }),
    pipe: new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.6, metalness: 0, vertexColors: true }),
    sheet: new THREE.MeshStandardMaterial({ map: sheetTex(), roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide, vertexColors: true }),
    signY: new THREE.MeshStandardMaterial({ map: signNewa(), roughness: 0.7, metalness: 0, vertexColors: true }),
    signW: new THREE.MeshStandardMaterial({ map: signDurbar(), roughness: 0.75, metalness: 0, vertexColors: true }),
    poster: new THREE.MeshStandardMaterial({ map: posterTex(), roughness: 0.85, metalness: 0, vertexColors: true }),
    green: new THREE.MeshStandardMaterial({ color: 0x3d6a55, roughness: 0.7, metalness: 0, vertexColors: true }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xb7ab9e, roughness: 0.9, metalness: 0, vertexColors: true }),
  };

  const buckets = {};
  function add(name, g, tint, damp, shade) {
    paintVary(g, tint, damp, shade);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, damp, shade) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "brick") worldUV(g, 2.4, 2.3);
    if (name === "shop") worldUV(g, 2.2, 2.2);
    add(name, g, tint, damp, shade);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint, damp) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint, damp);
    }
  }

  // Shop storey: grey plaster with the open bay and the arched door cut out.
  wallZ("shop", 0, W, 0, 2.72, 0, [bay, ...arches], GREY, true);
  addBox("shop", W + 0.04, 0.43, 0.34, W / 2, 2.935, -0.06, [0.38, 0.42, 0.45], false);
  addBox("dark", W, 0.05, 0.3, W / 2, 2.7, -0.05, [0.5, 0.5, 0.5]);
  // Right end: tall grey panel box (folded shutter case) standing proud of the face.
  addBox("shop", 0.55, 2.86, 0.3, 0.275, 1.43, -0.1, [0.4, 0.45, 0.49], true);
  for (const xx of [0.1, 0.27, 0.45]) addBox("dark", 0.015, 2.6, 0.01, xx, 1.42, -0.255, [0.6, 0.6, 0.6]);
  // Slim pier between the dress bays, and the square piers either side of the door.
  addBox("shop", 0.2, 2.72, 0.32, 2.35, 1.36, 0.06, GREY, true);
  for (const [x, w] of [[4.475, 0.25], [5.625, 0.65], [6.95, 0.4]]) addBox("shop", w, 2.72, 0.12, x, 1.36, -0.06, GREY, true);
  addBox("concrete", 4.1, 0.08, 0.3, bay.x, 0.04, -0.08, [0.6, 0.6, 0.58]);

  // Arched openings on the left: dark deep recess, plaster spandrel over a semicircle head.
  for (const door of arches) {
    const rad = door.w / 2;
    const arch = new THREE.Shape();
    // Cusped head: five scallops cut into the semicircle, as in the still.
    arch.moveTo(-rad, 0);
    for (let i = 1; i <= 40; i++) {
      const a = Math.PI - (i / 40) * Math.PI;
      const k = 1 - 0.1 * Math.abs(Math.sin(a * 5));
      arch.lineTo(Math.cos(a) * rad * k, Math.sin(a) * rad * k);
    }
    arch.lineTo(rad, rad + 0.04);
    arch.lineTo(-rad, rad + 0.04);
    arch.closePath();
    const spandrel = new THREE.ShapeGeometry(arch, 10);
    place(spandrel, door.x, door.y + door.h / 2 - rad - 0.04, -0.005, 0, Math.PI, 0);
    add("shop", spandrel, GREY);
    addBox("dark", door.w, door.h, 0.05, door.x, door.y, 1.1, [0.5, 0.48, 0.46]);
    addBox("dark", 0.03, door.h, 1.1, door.x - door.w / 2 + 0.015, door.y, 0.55, [1.6, 1.8, 2.0], false, true);
    addBox("dark", 0.03, door.h, 1.1, door.x + door.w / 2 - 0.015, door.y, 0.55, [1.6, 1.8, 2.0], false, true);
  }
  add("stock", place(new THREE.PlaneGeometry(0.74, 1.1), 6.35, 1.1, 1.05, 0, Math.PI, 0), [0.45, 0.45, 0.45]);
  add("poster", place(new THREE.BoxGeometry(0.34, 0.52, 0.01), 5.62, 1.75, -0.125), [0.7, 0.7, 0.7]);

  // Shop interior: floor, ceiling, side walls, lit stock wall at the back.
  addBox("dark", bay.w, 0.04, SHOP_D, bay.x, 0.02, SHOP_D / 2, [0.9, 0.9, 0.9], false, true);
  addBox("dark", bay.w + 0.4, 0.06, SHOP_D, bay.x, 2.72, SHOP_D / 2, [1.2, 1.2, 1.2], false, true);
  addBox("shop", 0.1, 2.72, SHOP_D, 0.5, 1.36, SHOP_D / 2, [0.75, 0.8, 0.84], false, true);
  addBox("shop", 0.1, 2.72, SHOP_D, 4.4, 1.36, SHOP_D / 2, [0.75, 0.8, 0.84], false, true);
  const back = place(new THREE.PlaneGeometry(bay.w, 2.6), bay.x, 1.32, SHOP_D, 0, Math.PI, 0);
  add("stock", back, [0.9, 0.9, 0.9]);
  for (const [x, z] of [[1.4, 0.45], [3.3, 1.6]]) {
    add("tube", place(new THREE.CylinderGeometry(0.018, 0.018, 1.1, 6), x, 2.62, z, 0, 0, Math.PI / 2));
    addBox("metal", 1.16, 0.04, 0.07, x, 2.66, z, [0.8, 0.8, 0.8]);
  }

  // Garment cut-out from the atlas, tinted by vertex colour, colours pulled toward grey.
  function garment(x, y, z, w, h, cellIndex, col, ry) {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv;
    const cx = cellIndex % 4;
    const cy = 1 - Math.floor(cellIndex / 4);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (cx + uv.getX(i)) / 4, (cy + uv.getY(i)) / 2);
    place(g, x, y - h / 2, z, 0, ry || 0, 0);
    const grey = (col[0] + col[1] + col[2]) / 3;
    add("cut", g, col.map((v) => v * 0.78 + grey * 0.22), false, true);
  }
  const shades = [
    [0.72, 0.16, 0.22], [0.86, 0.5, 0.6], [0.8, 0.78, 0.74], [0.32, 0.5, 0.36], [0.62, 0.18, 0.42],
    [0.8, 0.36, 0.2], [0.76, 0.6, 0.32], [0.28, 0.34, 0.56], [0.66, 0.12, 0.2], [0.5, 0.14, 0.32],
  ];
  const r = rng(926);
  // Two inner rails, packed two deep, and kurtas pinned along the side walls.
  for (const [z, y] of [[1.7, 2.45], [2.75, 2.5]]) {
    addBox("metal", bay.w - 0.3, 0.025, 0.025, bay.x, y + 0.02, z, [0.6, 0.6, 0.6]);
    for (let x = 0.75; x < 4.2; x += 0.2 + r() * 0.08) {
      garment(x, y, z + (r() - 0.5) * 0.1, 0.42, 1.0 + r() * 0.35, Math.floor(r() * 8), shades[Math.floor(r() * shades.length)], (r() - 0.5) * 0.5);
    }
  }
  for (let z = 0.5; z < 2.9; z += 0.34) {
    garment(0.58, 2.5, z, 0.44, 1.2, Math.floor(r() * 8), shades[Math.floor(r() * shades.length)], Math.PI / 2);
    garment(4.32, 2.5, z, 0.44, 1.2, Math.floor(r() * 8), shades[Math.floor(r() * shades.length)], Math.PI / 2);
  }
  // Long saris hung from the beam at the bay mouth (photo: red printed sari at the right pier).
  garment(0.72, 2.66, 0.12, 0.42, 1.95, 2, [0.66, 0.12, 0.16], 0.15);
  garment(1.08, 2.66, 0.2, 0.36, 1.6, 4, [0.8, 0.3, 0.36], -0.1);
  garment(4.12, 2.66, 0.14, 0.36, 1.7, 7, [0.84, 0.82, 0.78], 0.1);
  // Front rail under the beam: kurtas and a printed sari hung in the mouth, as the still shows at the shutter case.
  addBox("metal", 3.4, 0.02, 0.02, 2.45, 2.62, 0.02, [0.5, 0.5, 0.5]);
  for (const [x, cell, col] of [[0.66, 2, [0.6, 0.1, 0.14]], [1.25, 0, [0.84, 0.5, 0.6]], [2.62, 1, [0.62, 0.14, 0.36]], [3.0, 6, [0.82, 0.8, 0.76]], [3.42, 3, [0.36, 0.56, 0.34]], [3.95, 2, [0.68, 0.12, 0.18]]]) {
    garment(x, 2.6, 0.04, 0.38, 1.25 + r() * 0.5, cell, col, (r() - 0.5) * 0.4);
  }

  // Dress forms: lathe body with shoulders, gown to the floor, flattened front-to-back.
  const body = [
    [0.0, 0.0], [0.26, 0.02], [0.25, 0.1], [0.22, 0.45], [0.18, 0.8], [0.14, 1.0], [0.12, 1.1],
    [0.135, 1.22], [0.16, 1.34], [0.17, 1.42], [0.15, 1.48], [0.09, 1.52], [0.045, 1.55], [0.04, 1.63], [0.0, 1.64],
  ].map(([a, b]) => new THREE.Vector2(a, b));
  const forms = [
    [0.95, 0.35, [0.86, 0.56, 0.64], true],
    [1.45, 0.55, [0.7, 0.14, 0.2], true],
    [1.95, 0.3, [0.86, 0.46, 0.6], false],
    [2.75, 0.45, [0.62, 0.2, 0.44], true],
    [3.2, 0.25, [0.6, 0.1, 0.16], false],
    [3.65, 0.5, [0.38, 0.58, 0.36], true],
    [4.05, 0.32, [0.68, 0.14, 0.18], false],
  ];
  for (const [x, z, col, head] of forms) {
    const g = new THREE.LatheGeometry(body, 12);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 2);
    const fat = 0.9 + r() * 0.3;
    g.scale(fat, 0.96 + r() * 0.1, 0.7 * fat);
    place(g, x, 0.06, z, 0, (r() - 0.5) * 0.6, 0);
    add("gown", g, col, false, true);
    if (head) {
      add("skin", place(new THREE.SphereGeometry(0.09, 10, 8), x, 1.78, z), [0.78, 0.62, 0.52], false, true);
      add("dark", place(new THREE.SphereGeometry(0.095, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.55), x, 1.8, z + 0.01), [0.6, 0.55, 0.5]);
    }
    // Dupatta across one shoulder.
    garment(x + 0.1, 1.58, z - 0.13, 0.16, 1.05, 4, col.map((v) => Math.min(1, v * 1.15 + 0.08)), 0.3);
  }

  // Dull grey-green corrugated awning over the dress bays: flat fall bending to a rounded nose, two thin struts.
  {
    const aw = 4.05;
    const g = new THREE.PlaneGeometry(aw, 1, 108, 10);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const t = 0.5 - p.getY(i);
      const th = t * 1.13;
      const rib = Math.sin(p.getX(i) / 0.076 * Math.PI * 2) * 0.012;
      p.setXYZ(i, p.getX(i), -0.9 * (1 - Math.cos(th)) - t * 0.12 + rib, -0.9 * Math.sin(th));
    }
    g.computeVertexNormals();
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2, uv.getY(i));
    place(g, 2.58, 3.12, -0.2);
    add("sheet", g, [0.85, 0.85, 0.85]);
    for (const xx of [0.8, 4.35]) {
      add("metal", place(new THREE.CylinderGeometry(0.012, 0.012, 0.8, 5), xx, 2.6, -0.5, -1.1, 0, 0), [0.4, 0.4, 0.4]);
    }
  }

  // Brick storeys above the fascia, floor bands, top eave.
  wallZ("brick", 0, W, 3.15, 6.05, 0, midHoles, BRICK, false);
  addBox("wood", W, 0.12, 0.18, W / 2, 6.12, -0.05, [0.5, 0.4, 0.32]);
  wallZ("brick", 0, W, 6.2, 8.45, 0, highHoles, BRICK, false);
  addBox("concrete", W + 0.1, 0.1, 0.2, W / 2, 8.5, -0.06, [0.7, 0.66, 0.6]);
  wallZ("brick", 0, W, 8.55, 10.55, 0, [], BRICK, false);
  addBox("woodDark", W + 0.2, 0.08, 0.55, W / 2, 10.62, -0.22, [0.42, 0.34, 0.26]);
  addBox("metal", W + 0.15, 0.04, 0.7, W / 2, 10.7, -0.28, [0.72, 0.7, 0.66]);
  const grime = new THREE.PlaneGeometry(W, 7.4);
  const guv = grime.attributes.uv;
  for (let i = 0; i < guv.count; i++) guv.setX(i, 1 - guv.getX(i));
  place(grime, W / 2, 3.15 + 3.7, -0.004, 0, Math.PI, 0);
  add("grime", grime);

  addBox("brick", T, ROOF, D, T / 2, ROOF / 2, D / 2, [0.92, 0.86, 0.8], true);
  addBox("brick", T, ROOF, D, W - T / 2, ROOF / 2, D / 2, [0.92, 0.86, 0.8], true);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2, [0.78, 0.72, 0.66], true);
  addBox("concrete", W - 0.4, 0.12, D - 0.7, W / 2, 10.85, D * 0.55, [0.85, 0.82, 0.76]);

  // Signs, set on short battens off the brick.
  add("signW", place(new THREE.BoxGeometry(2.1, 0.9, 0.03), 2.85, 3.68, -0.05), [0.9, 0.9, 0.9]);
  add("signY", place(new THREE.BoxGeometry(1.7, 0.85, 0.03), 4.5, 6.75, -0.06), [0.92, 0.92, 0.92]);

  // Dark timber windows: deep reveal, dark room behind, brick sill and lintel; leaves open or shut.
  function frame(x, y, w, h, z, mat, tint) {
    addBox(mat, 0.08, h + 0.08, 0.1, x - w / 2 + 0.04, y, z, tint);
    addBox(mat, 0.08, h + 0.08, 0.1, x + w / 2 - 0.04, y, z, tint);
    addBox(mat, w + 0.16, 0.1, 0.12, x, y + h / 2 + 0.01, z - 0.01, tint);
    addBox(mat, w + 0.12, 0.08, 0.1, x, y - h / 2, z, tint);
  }
  function win(x, y, w, h, mode) {
    addBox("dark", w, h, 0.04, x, y, mode === "open" ? 0.62 : 0.32, [0.7, 0.66, 0.62]);
    addBox("woodDark", 0.03, h, 0.3, x - w / 2 + 0.015, y, 0.16, [0.7, 0.6, 0.5]);
    addBox("woodDark", 0.03, h, 0.3, x + w / 2 - 0.015, y, 0.16, [0.7, 0.6, 0.5]);
    frame(x, y, w, h, -0.02, "woodDark", [0.9, 0.8, 0.7]);
    addBox("concrete", w + 0.3, 0.07, 0.16, x, y - h / 2 - 0.08, -0.06, [0.62, 0.56, 0.5]);
    addBox("brick", w + 0.34, 0.12, 0.08, x, y + h / 2 + 0.12, -0.03, BRICK.map((v) => v * 0.8));
    const lw = (w - 0.12) / 2;
    if (mode === "open") {
      for (const s of [-1, 1]) {
        const hx = x + s * (w / 2 - 0.06);
        const leaf = place(boxGeo(lw, h - 0.12, 0.035), 0, 0, 0);
        leaf.translate(-s * lw / 2, 0, 0);
        leaf.rotateY(s * 1.35);
        leaf.translate(hx, y, 0.05);
        add("wood", leaf, [0.62, 0.48, 0.36]);
      }
    } else if (mode === "lattice") {
      for (let i = 0; i < 7; i++) {
        addBox("woodDark", w - 0.14, 0.018, 0.02, x, y - h / 2 + 0.12 + i * (h - 0.24) / 6, -0.0, [0.8, 0.7, 0.6]);
        addBox("woodDark", 0.018, h - 0.14, 0.02, x - w / 2 + 0.1 + i * (w - 0.2) / 6, y, 0.0, [0.8, 0.7, 0.6]);
      }
    } else {
      for (const s of [-1, 1]) {
        const cx = x + s * lw / 2;
        addBox("wood", lw - 0.02, h - 0.14, 0.03, cx, y, 0.06, [0.55, 0.42, 0.32]);
        addBox("woodDark", lw - 0.14, 0.03, 0.02, cx, y + h * 0.18, 0.04, [0.8, 0.7, 0.6]);
        addBox("woodDark", lw - 0.14, 0.03, 0.02, cx, y - h * 0.18, 0.04, [0.8, 0.7, 0.6]);
      }
    }
  }
  win(2.9, 4.75, 0.95, 1.25, "open");
  win(5.6, 4.6, 0.85, 1.55, "shut");
  win(2.9, 7.2, 0.85, 1.1, "lattice");
  win(6.1, 7.2, 0.8, 1.05, "shut");
  addBox("green", 0.98, 0.04, 0.34, 6.1, 7.95, -0.2, [0.62, 0.72, 0.66]);

  // Top balcony floor under the corrugated cap (Grok's, kept).
  addBox("concrete", 5.2, 0.08, 0.62, 3.2, 8.7, -0.28, [0.72, 0.66, 0.58]);
  addBox("woodDark", 5.2, 0.06, 0.06, 3.2, 9.15, -0.55, [0.45, 0.36, 0.28]);
  for (let i = 0; i < 8; i++) addBox("wood", 0.035, 0.42, 0.035, 0.85 + i * 0.68, 8.92, -0.52, [0.5, 0.4, 0.3]);
  addBox("wood", 0.08, 0.55, 0.08, 0.7, 8.95, -0.22, [0.48, 0.36, 0.26]);
  addBox("wood", 0.08, 0.55, 0.08, 5.7, 8.95, -0.22, [0.48, 0.36, 0.26]);

  // White downpipe up the south edge, CCTV dome on a bracket beside it.
  add("pipe", place(new THREE.CylinderGeometry(0.045, 0.045, 7.6, 8), 0.16, 6.75, -0.1), [0.92, 0.92, 0.9]);
  for (const y of [3.6, 5.6, 7.6, 9.6]) addBox("metal", 0.12, 0.03, 0.1, 0.16, y, -0.06, [0.5, 0.5, 0.5]);
  addBox("pipe", 0.08, 0.03, 0.22, 0.45, 6.62, -0.11, [0.9, 0.9, 0.9]);
  add("pipe", place(new THREE.SphereGeometry(0.07, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0.45, 6.6, -0.2), [0.95, 0.95, 0.94]);

  // Wires: one heavy sagging cable down across the brick, thin slack lines, a coil and droppers.
  function wire(pts, rad, tint) {
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, rad, 5, false), tint);
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  wire([V(-0.4, 6.45, -0.4), V(0.5, 5.6, -0.34), V(1.6, 4.55, -0.3), V(2.6, 3.95, -0.26), V(3.6, 3.45, -0.24), V(5.2, 3.3, -0.24), V(7.4, 3.38, -0.26)], 0.024);
  wire([V(-0.4, 6.35, -0.44), V(0.7, 5.4, -0.38), V(1.9, 4.3, -0.33), V(3.4, 3.38, -0.3), V(7.4, 3.3, -0.3)], 0.011, [0.9, 0.88, 0.85]);
  wire([V(-0.4, 5.95, -0.3), V(1.2, 5.75, -0.3), V(3.0, 5.62, -0.32), V(5.0, 5.7, -0.3), V(7.4, 5.85, -0.3)], 0.008);
  wire([V(-0.4, 6.6, -0.5), V(2.0, 6.3, -0.5), V(4.0, 6.28, -0.48), V(7.4, 6.5, -0.46)], 0.007, [1.4, 1.35, 1.3]);
  wire([V(-0.4, 3.32, -0.22), V(1.0, 3.18, -0.22), V(2.4, 3.2, -0.22)], 0.01);
  for (let k = 0; k < 4; k++) {
    const y = 3.2 + k * 0.035;
    const z = -0.26 - k * 0.04;
    const c = 1 + k * 0.1;
    wire([V(-0.4, y + 0.06, z), V(1.5, y - 0.08 - k * 0.02, z), V(3.6, y - 0.03, z), V(5.6, y - 0.12, z - 0.03), V(7.4, y + 0.04, z)], 0.009, [c, c, c]);
  }
  wire([V(5.2, 3.2, -0.4), V(5.0, 2.9, -0.5), V(4.9, 2.6, -0.45)], 0.008);
  add("wire", place(new THREE.TorusGeometry(0.16, 0.012, 5, 18), 0.55, 5.35, -0.36, 0.2, 0.4, 0));
  add("wire", place(new THREE.TorusGeometry(0.14, 0.012, 5, 18), 0.6, 5.3, -0.38, 0.5, 0.2, 0));
  wire([V(4.6, 3.3, -0.24), V(4.62, 3.05, -0.2), V(4.62, 2.95, -0.14)], 0.006);
  wire([V(1.7, 4.45, -0.3), V(1.72, 4.0, -0.12), V(1.75, 3.95, -0.03)], 0.006);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = !["glass", "grime", "tube"].includes(name);
    mesh.receiveShadow = true;
    if (name === "grime") mesh.renderOrder = 1;
    root.add(mesh);
  }

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "026";
  return root;
}
