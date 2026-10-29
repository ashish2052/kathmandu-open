// House 025. Lagan lane, north face of OSM way 650978482, edge 0, 7.96 m.
// Spec: research/houses200/025/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// After place.js yaw 180, x = 0 is west (far, toward the middle of the still)
// and x = 7.96 is east (photo-left, the open shop). The turquoise shutter is the
// east neighbour, not this footprint.
// Still: pano ZVsQ8Mb_afzhsD5i9aKlKw, yaw 240, pitch 6. Copy that frame.
// No readable words on the poster, the yellow card or the small sign.
// Opus pass 23 Oct: colours sampled from ref/yaw_240.jpg and pulled out of its pink cast.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.96;
const D = 4.76;
const T = 0.22;
const ROOF = 10.15;
// The still is an overcast pano; the solo light renders this north face about 25-40% darker. One lift for every vertex.
const LIFT = 1.6;

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

function toTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function clampTex(c) {
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function blot(g, x, y, rad, rgba) {
  const grd = g.createRadialGradient(x, y, 0, x, y, rad);
  grd.addColorStop(0, rgba);
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
}

// Smooth lime plaster, pale pinkish cream: soft mottling, grit, a few hairline cracks.
function plasterTex() {
  const c = canvas(512, 512);
  const g = c.getContext("2d");
  const r = rng(25);
  g.fillStyle = "#dcc5b0";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 70; i++) {
    blot(g, r() * 512, r() * 512, 30 + r() * 90, r() > 0.5 ? "rgba(120,96,80,0.07)" : "rgba(250,240,228,0.08)");
  }
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(90,70,56,0.06)" : "rgba(255,248,238,0.06)";
    g.fillRect(r() * 512, r() * 512, 1 + r() * 3, 1 + r() * 2);
  }
  g.strokeStyle = "rgba(96,78,64,0.18)";
  g.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    let x = r() * 512;
    let y = r() * 512;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (r() - 0.5) * 24;
      y += 6 + r() * 14;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  return toTex(c);
}

// Rolled steel shutter, worn tan: one rib per 16 px, rust-brown rib shadows, drips, dark foot.
function shutterTex() {
  const c = canvas(512, 512);
  const g = c.getContext("2d");
  const r = rng(65);
  g.fillStyle = "#c2b5a3";
  g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 16) {
    g.fillStyle = "rgba(255,248,236,0.22)";
    g.fillRect(0, y + 2, 512, 4);
    g.fillStyle = "rgba(122,86,62,0.42)";
    g.fillRect(0, y + 12, 512, 2);
    g.fillStyle = "rgba(70,48,36,0.35)";
    g.fillRect(0, y + 14, 512, 2);
  }
  for (let i = 0; i < 260; i++) {
    const y = Math.floor(r() * 32) * 16 + 12;
    g.fillStyle = `rgba(${110 + r() * 40},${66 + r() * 20},${44 + r() * 14},${0.12 + r() * 0.25})`;
    g.fillRect(r() * 512, y, 6 + r() * 60, 2 + r() * 2);
  }
  for (let i = 0; i < 40; i++) {
    const x = r() * 512;
    const y = r() * 380;
    const len = 30 + r() * 140;
    const grd = g.createLinearGradient(0, y, 0, y + len);
    grd.addColorStop(0, "rgba(96,66,46,0.1)");
    grd.addColorStop(1, "rgba(96,66,46,0)");
    g.fillStyle = grd;
    g.fillRect(x, y, 2 + r() * 5, len);
  }
  const foot = g.createLinearGradient(0, 400, 0, 512);
  foot.addColorStop(0, "rgba(70,52,40,0)");
  foot.addColorStop(1, "rgba(70,52,40,0.45)");
  g.fillStyle = foot;
  g.fillRect(0, 400, 512, 112);
  return clampTex(c);
}

// Worn turquoise paint on the pier: chips back to plaster at the arrises, brown damp at the foot.
function cyanTex() {
  const c = canvas(128, 512);
  const g = c.getContext("2d");
  const r = rng(77);
  g.fillStyle = "#5f979e";
  g.fillRect(0, 0, 128, 512);
  for (let i = 0; i < 40; i++) {
    blot(g, r() * 128, r() * 512, 10 + r() * 40, r() > 0.5 ? "rgba(40,90,98,0.25)" : "rgba(150,196,198,0.18)");
  }
  for (let i = 0; i < 26; i++) {
    g.fillStyle = r() > 0.4 ? "rgba(196,176,156,0.8)" : "rgba(120,90,70,0.55)";
    const x = r() > 0.5 ? r() * 14 : 114 + r() * 14;
    g.fillRect(x, r() * 512, 2 + r() * 8, 3 + r() * 14);
  }
  for (let i = 0; i < 18; i++) {
    const x = r() * 128;
    const y = r() * 300;
    const grd = g.createLinearGradient(0, y, 0, y + 120);
    grd.addColorStop(0, "rgba(60,70,64,0.2)");
    grd.addColorStop(1, "rgba(60,70,64,0)");
    g.fillStyle = grd;
    g.fillRect(x, y, 2 + r() * 4, 120);
  }
  const foot = g.createLinearGradient(0, 380, 0, 512);
  foot.addColorStop(0, "rgba(96,78,58,0)");
  foot.addColorStop(1, "rgba(96,78,58,0.7)");
  g.fillStyle = foot;
  g.fillRect(0, 380, 128, 132);
  return clampTex(c);
}

// Iron window grille as in the still: vertical bars, two wave bands, a diamond band. Alpha cut-out.
function grilleTex() {
  const c = canvas(256, 512);
  const g = c.getContext("2d");
  g.strokeStyle = "#4a2e28";
  g.lineCap = "round";
  g.lineWidth = 7;
  g.strokeRect(4, 4, 248, 504);
  g.lineWidth = 5;
  for (let x = 32; x < 250; x += 32) {
    g.beginPath();
    g.moveTo(x, 4);
    g.lineTo(x, 508);
    g.stroke();
  }
  g.lineWidth = 4;
  for (const yb of [70, 300]) {
    for (const off of [0, 22]) {
      g.beginPath();
      for (let x = 4; x <= 252; x += 2) {
        const y = yb + off + Math.sin((x / 32) * Math.PI) * 10;
        if (x === 4) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  g.lineWidth = 3;
  for (let x = 4; x < 252; x += 32) {
    g.beginPath();
    g.moveTo(x, 150);
    g.lineTo(x + 16, 130);
    g.lineTo(x + 32, 150);
    g.lineTo(x + 16, 170);
    g.closePath();
    g.stroke();
  }
  g.lineWidth = 5;
  for (const y of [110, 190, 410]) {
    g.beginPath();
    g.moveTo(4, y);
    g.lineTo(252, y);
    g.stroke();
  }
  return clampTex(c);
}

// Vertical plank leaf, red-brown, rubbed pale at hand height, dark at the foot.
function plankTex() {
  const c = canvas(128, 256);
  const g = c.getContext("2d");
  const r = rng(91);
  g.fillStyle = "#7c4a40";
  g.fillRect(0, 0, 128, 256);
  for (let x = 0; x < 128; x += 21) {
    g.fillStyle = `rgba(${90 + r() * 40},${50 + r() * 20},${40 + r() * 14},0.5)`;
    g.fillRect(x, 0, 21, 256);
    g.fillStyle = "rgba(34,20,16,0.7)";
    g.fillRect(x, 0, 2, 256);
  }
  for (let i = 0; i < 140; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(40,24,18,0.18)" : "rgba(196,150,130,0.12)";
    g.fillRect(r() * 128, r() * 256, 1, 8 + r() * 40);
  }
  g.fillStyle = "rgba(210,180,160,0.16)";
  g.fillRect(0, 100, 128, 30);
  const foot = g.createLinearGradient(0, 200, 0, 256);
  foot.addColorStop(0, "rgba(40,28,22,0)");
  foot.addColorStop(1, "rgba(40,28,22,0.55)");
  g.fillStyle = foot;
  g.fillRect(0, 200, 128, 56);
  return clampTex(c);
}

// Picture chart in the shop door: pale sheet, rows of small drawn things, no letters.
function posterTex() {
  const c = canvas(256, 384);
  const g = c.getContext("2d");
  const r = rng(251);
  g.fillStyle = "#e4dccb";
  g.fillRect(0, 0, 256, 384);
  g.fillStyle = "#b8473a";
  g.fillRect(10, 10, 236, 26);
  g.fillStyle = "rgba(240,230,210,0.45)";
  for (let i = 0; i < 5; i++) g.fillRect(30 + i * 40, 19, 26, 7);
  const inks = ["#c4543a", "#d9a43a", "#4f7b55", "#3d5f96", "#8a4b32", "#d27a9a", "#6a6a6a"];
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 5; col++) {
      const cx = 32 + col * 48;
      const cy = 62 + row * 40;
      g.fillStyle = inks[Math.floor(r() * inks.length)];
      g.beginPath();
      const k = r();
      if (k < 0.4) g.arc(cx, cy, 9 + r() * 5, 0, Math.PI * 2);
      else if (k < 0.7) g.ellipse(cx, cy, 15, 8, r(), 0, Math.PI * 2);
      else {
        g.moveTo(cx, cy - 12);
        g.lineTo(cx + 12, cy + 9);
        g.lineTo(cx - 12, cy + 9);
      }
      g.fill();
      g.fillStyle = "rgba(60,44,34,0.3)";
      g.fillRect(cx - 12, cy + 15, 24, 3);
    }
  }
  g.strokeStyle = "#6d5844";
  g.lineWidth = 6;
  g.strokeRect(3, 3, 250, 378);
  g.fillStyle = "rgba(120,96,70,0.25)";
  g.fillRect(0, 330, 256, 54);
  return clampTex(c);
}

// Yellow hanging card of snack packets, alpha cut-out with a hook hole.
function cardTex() {
  const c = canvas(128, 192);
  const g = c.getContext("2d");
  const r = rng(303);
  g.fillStyle = "#e8c43c";
  g.beginPath();
  g.moveTo(54, 4);
  g.lineTo(74, 4);
  g.lineTo(74, 18);
  g.lineTo(124, 22);
  g.lineTo(124, 188);
  g.lineTo(4, 188);
  g.lineTo(4, 22);
  g.lineTo(54, 18);
  g.closePath();
  g.fill();
  g.clearRect(60, 8, 8, 6);
  g.fillStyle = "#c4302a";
  g.fillRect(10, 26, 108, 22);
  const inks = ["#e05a3a", "#3a6fc0", "#f0f0e6", "#4fa060", "#d040a0", "#f09030"];
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 12 + col * 37;
      const y = 56 + row * 43;
      g.fillStyle = "rgba(240,240,236,0.55)";
      g.fillRect(x - 2, y - 2, 34, 40);
      g.fillStyle = inks[Math.floor(r() * inks.length)];
      g.fillRect(x + 3, y + 4, 24, 28);
      g.fillStyle = "rgba(255,255,255,0.5)";
      g.fillRect(x + 5, y + 6, 4, 22);
    }
  }
  return clampTex(c);
}

// Dim back wall of the open shop: four shelves of packets and jars in the dark.
function shopTex() {
  const c = canvas(128, 256);
  const g = c.getContext("2d");
  const r = rng(404);
  g.fillStyle = "#2a1c18";
  g.fillRect(0, 0, 128, 256);
  for (let s = 0; s < 4; s++) {
    const y = 40 + s * 52;
    g.fillStyle = "#4a3026";
    g.fillRect(0, y, 128, 6);
    for (let x = 4; x < 124;) {
      const w = 8 + r() * 14;
      const h = 14 + r() * 26;
      g.fillStyle = `hsl(${Math.floor(r() * 360)},${30 + r() * 30}%,${28 + r() * 22}%)`;
      g.fillRect(x, y - h, w - 2, h);
      x += w;
    }
  }
  return clampTex(c);
}

// Small white sign over the shop. Its words were not readable: faint red smudges only.
function signTex() {
  const c = canvas(64, 96);
  const g = c.getContext("2d");
  const r = rng(505);
  g.fillStyle = "#e8e2d6";
  g.fillRect(0, 0, 64, 96);
  g.fillStyle = "rgba(170,60,50,0.35)";
  for (let i = 0; i < 4; i++) g.fillRect(10 + r() * 4, 14 + i * 18, 40 - r() * 10, 6);
  g.fillStyle = "rgba(90,70,50,0.25)";
  g.fillRect(0, 80, 64, 16);
  return clampTex(c);
}

// Facade-sized grime decal in metres, cut to the openings: damp foot, streaks under sills and bands, soot under the eave.
function grimeTex(holes) {
  const S = 52;
  const c = canvas(Math.ceil(W * S), Math.ceil(ROOF * S));
  const g = c.getContext("2d");
  const r = rng(2025);
  const X = (x) => x * S;
  const Y = (y) => (ROOF - y) * S;
  const streak = (x, y, w, len, a) => {
    const grd = g.createLinearGradient(0, Y(y), 0, Y(y - len));
    grd.addColorStop(0, `rgba(78,60,46,${a})`);
    grd.addColorStop(1, "rgba(78,60,46,0)");
    g.fillStyle = grd;
    g.fillRect(X(x), Y(y), X(w), X(len));
  };
  for (let x = 0; x < W; x += 0.05) {
    const top = 0.55 + Math.sin(x * 3.1) * 0.12 + r() * 0.22;
    const grd = g.createLinearGradient(0, Y(0), 0, Y(top));
    grd.addColorStop(0, "rgba(84,64,48,0.55)");
    grd.addColorStop(0.7, "rgba(96,76,58,0.22)");
    grd.addColorStop(1, "rgba(96,76,58,0)");
    g.fillStyle = grd;
    g.fillRect(X(x), Y(top), X(0.06), X(top));
  }
  for (const h of holes) {
    if (!h.win) continue;
    const sill = h.y - h.h / 2;
    for (let k = 0; k < 6; k++) streak(h.x - h.w / 2 + r() * h.w, sill, 0.02 + r() * 0.05, 0.4 + r() * 1.1, 0.16 + r() * 0.16);
  }
  for (const band of [2.5, 5.0, 7.1, 8.95]) {
    for (let k = 0; k < 26; k++) streak(r() * W, band, 0.02 + r() * 0.08, 0.2 + r() * 0.9, 0.08 + r() * 0.14);
  }
  const eave = g.createLinearGradient(0, Y(ROOF), 0, Y(ROOF - 1.4));
  eave.addColorStop(0, "rgba(60,48,40,0.45)");
  eave.addColorStop(1, "rgba(60,48,40,0)");
  g.fillStyle = eave;
  g.fillRect(0, 0, c.width, X(1.4));
  for (let k = 0; k < 30; k++) {
    blot(g, X(r() * W), Y(0.8 + r() * 8.5), X(0.2 + r() * 0.6), `rgba(90,72,58,${0.05 + r() * 0.08})`);
  }
  g.globalCompositeOperation = "destination-out";
  for (const h of holes) g.fillRect(X(h.x - h.w / 2), Y(h.y + h.h / 2), X(h.w), X(h.h));
  return clampTex(c);
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

// A card facing the lane (-Z) with u running along +X, so canvases read the right way round.
function card(w, h, x, y, z) {
  const g = new THREE.PlaneGeometry(w, h);
  g.rotateY(Math.PI);
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  return place(g, x, y, z);
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

// Vertex tint. damp darkens the wall foot; deep darkens with depth into an opening;
// everything below the shop beam sits in its overcast shade.
function paintVary(g, tint, damp, deep) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.94 + 0.06 * hash(x * 1.7, y * 1.3, z * 1.7);
    if (damp) {
      const foot = Math.max(0, 0.7 - y) * 0.42;
      k *= 1 - foot;
    }
    if (deep && z > 0.02) k *= Math.max(0.22, 1 - (z - 0.02) * 2.2);
    if (y < 2.55 && z > -0.5 && z < 0.6) k *= 0.86;
    k *= LIFT;
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / 2.4, p.getZ(i) / 2.4);
    else if (ax >= az) uv.setXY(i, p.getZ(i) / 2.4, p.getY(i) / 2.4);
    else uv.setXY(i, p.getX(i) / 2.4, p.getY(i) / 2.4);
  }
}

export function createHouse025() {
  const root = new THREE.Group();
  root.name = "house-025";

  const doors = [
    { x: 0.95, y: 1.18, w: 0.92, h: 2.16, open: false },
    { x: 2.4, y: 1.18, w: 1.05, h: 2.16, open: true },
  ];
  const shutter = { x: 5.9, y: 1.32, w: 3.45, h: 2.45 };
  const pier = { x: 3.45, w: 0.5, h: 3.3 };
  const wins = [[], [], []];
  const floors = [
    { y: 4.15, h: 1.35 },
    { y: 6.25, h: 1.22 },
    { y: 8.2, h: 1.02 },
  ];
  for (const door of doors) {
    floors.forEach((f, k) => wins[k].push({ x: door.x, y: f.y, w: 0.72, h: f.h, win: true }));
  }

  const std = (o) => new THREE.MeshStandardMaterial(Object.assign({ color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true }, o));
  const cut = (o) => std(Object.assign({ alphaTest: 0.5, side: THREE.DoubleSide }, o));
  const grime = grimeTex(doors.concat([shutter], wins.flat()).map((h) => ({ x: h.x, y: h.y, w: h.w + 0.16, h: h.h + 0.16, win: h.win })));
  const cyanMap = cyanTex();
  cyanMap.wrapS = cyanMap.wrapT = THREE.RepeatWrapping;
  cyanMap.repeat.set(1 / pier.w, 1 / pier.h);
  const shopMap = shopTex();
  const mats = {
    plaster: std({ map: plasterTex() }),
    grime: std({ map: grime, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, roughness: 0.95 }),
    wood: std({ color: 0x8e604c, roughness: 0.8 }),
    woodDark: std({ color: 0x4e3028, roughness: 0.78 }),
    plank: std({ map: plankTex(), roughness: 0.82 }),
    grille: cut({ map: grilleTex(), roughness: 0.55, metalness: 0.3 }),
    dark: std({ color: 0x1e1612, roughness: 0.95 }),
    shopBack: std({ map: shopMap, emissive: 0xffffff, emissiveMap: shopMap, emissiveIntensity: 0.22 }),
    paper: std({ map: posterTex(), roughness: 0.85 }),
    card: cut({ map: cardTex(), roughness: 0.55 }),
    sign: std({ map: signTex(), roughness: 0.8 }),
    sack: std({ color: 0xe8e4dc, roughness: 0.75 }),
    concrete: std({ color: 0xab9e92, roughness: 0.95 }),
    wire: std({ color: 0x2a2622, roughness: 0.62, metalness: 0.08 }),
    bar: std({ color: 0x4a4038, roughness: 0.45, metalness: 0.35 }),
    shutter: std({ map: shutterTex(), roughness: 0.66, metalness: 0.18 }),
    cyan: std({ map: cyanMap, roughness: 0.82 }),
  };

  const buckets = {};
  function add(name, g, tint, damp, deep) {
    paintVary(g, tint, damp, deep);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, damp, deep) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "plaster") worldUV(g);
    add(name, g, tint, damp, deep);
  }
  function wallZ(x0, x1, y0, y1, holes) {
    for (const part of cells(x0, x1, y0, y1, holes)) {
      addBox("plaster", part.w, part.h, T, part.x, part.y, T / 2, [1.0, 0.95, 0.9], true, true);
    }
  }

  wallZ(0, W, 0, 2.48, doors.concat([shutter]));
  wallZ(0, W, 2.48, 3.22, []);
  wallZ(0, W, 3.22, 5.05, wins[0]);
  wallZ(0, W, 5.05, 5.2, []);
  wallZ(0, W, 5.2, 7.05, wins[1]);
  wallZ(0, W, 7.05, 7.2, []);
  wallZ(0, W, 7.2, 8.9, wins[2]);
  addBox("plaster", W, 1.25, T, W / 2, 9.52, T / 2, [0.96, 0.93, 0.9], true);

  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2, [0.9, 0.86, 0.8], true);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2, [0.9, 0.86, 0.8], true);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2, [0.84, 0.8, 0.74], true);
  addBox("concrete", W - 0.4, 0.14, D - 0.5, W / 2, 10.08, D * 0.55, [0.72, 0.68, 0.62]);

  // Facade grime decal, one plane in metres.
  const decal = card(W, ROOF, W / 2, ROOF / 2, -0.004);
  add("grime", decal, [1, 1, 1]);

  // Plinth step in front of the two doors, worn and dark at the arris; a low sill under the shutter.
  addBox("concrete", 3.3, 0.22, 0.5, 1.65, 0.11, -0.25, [0.8, 0.76, 0.72], true);
  addBox("concrete", 3.32, 0.04, 0.06, 1.65, 0.21, -0.49, [0.62, 0.58, 0.54]);
  addBox("concrete", shutter.w + 0.1, 0.08, 0.2, shutter.x, 0.04, -0.1, [0.7, 0.66, 0.62], true);

  // Shop beam: a thin brown plank ledge on a plaster band, its underside in shade.
  addBox("wood", W + 0.04, 0.1, 0.3, W / 2, 2.6, -0.12, [0.85, 0.7, 0.62]);
  addBox("plaster", W, 0.14, 0.12, W / 2, 2.72, -0.05, [0.92, 0.88, 0.84], true);

  function frame(x, y, w, h, z, mat, tint, s) {
    const t = s || 0.07;
    addBox(mat, t, h + t, 0.1, x - w / 2, y, z, tint);
    addBox(mat, t, h + t, 0.1, x + w / 2, y, z, tint);
    addBox(mat, w + t * 1.4, t, 0.1, x, y + h / 2, z, tint);
    addBox(mat, w + t * 1.4, t, 0.11, x, y - h / 2, z, tint);
  }

  // Turquoise pier: worn paint, chipped arrises, damp foot.
  addBox("cyan", pier.w, pier.h, 0.2, pier.x, pier.h / 2, -0.06, [0.82, 0.86, 0.86]);

  // Rolled shutter: real corrugations (one rib per 0.075 m), housing box, guide channels, bottom bar and padlock.
  {
    const sw = shutter.w - 0.12;
    const sh = shutter.h - 0.06;
    const geo = new THREE.PlaneGeometry(sw, sh, 1, 96);
    const p = geo.attributes.position;
    const uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i) + sh / 2;
      p.setZ(i, 0.011 * Math.sin((y / 0.075) * Math.PI * 2));
      uv.setXY(i, uv.getX(i), y / 2.4);
    }
    geo.computeVertexNormals();
    geo.rotateY(Math.PI);
    place(geo, shutter.x, shutter.y - 0.03, 0.03);
    add("shutter", geo, [1.2, 1.1, 0.97]);
    addBox("plaster", shutter.w + 0.16, 0.3, 0.26, shutter.x, shutter.y + shutter.h / 2 + 0.12, -0.1, [0.9, 0.86, 0.8], true);
    addBox("woodDark", shutter.w + 0.16, 0.04, 0.27, shutter.x, shutter.y + shutter.h / 2 - 0.03, -0.1, [0.6, 0.5, 0.44]);
    for (const sx of [-1, 1]) addBox("bar", 0.07, shutter.h, 0.08, shutter.x + sx * (shutter.w / 2 - 0.02), shutter.y, -0.01, [0.72, 0.62, 0.52]);
    addBox("bar", sw, 0.06, 0.05, shutter.x, shutter.y - shutter.h / 2 + 0.08, -0.02, [0.6, 0.52, 0.44]);
    for (const hx of [-0.9, 0.9]) addBox("bar", 0.1, 0.03, 0.04, shutter.x + hx, shutter.y - shutter.h / 2 + 0.2, -0.04, [0.5, 0.44, 0.38]);
    addBox("bar", 0.06, 0.08, 0.03, shutter.x, shutter.y - shutter.h / 2 + 0.12, -0.06, [0.35, 0.3, 0.25]);
  }

  doors.forEach((door) => {
    frame(door.x, door.y, door.w, door.h, -0.03, "woodDark", [0.72, 0.56, 0.5], 0.09);
    // Red-brown casing lines the reveal, as in the still; no bare plaster jamb.
    for (const sx of [-1, 1]) addBox("wood", 0.06, door.h, T, door.x + sx * (door.w / 2 - 0.03), door.y, T / 2, [0.36, 0.22, 0.2]);
    addBox("wood", door.w, 0.06, T, door.x, door.y + door.h / 2 - 0.03, T / 2, [0.3, 0.19, 0.17]);
    if (door.open) {
      // Open shop: dark room 1.6 m deep, dim shelf wall at the back, an inward leaf, a low counter board.
      const iw = door.w - 0.12;
      const ih = door.h - 0.1;
      const back = 1.6;
      addBox("dark", iw, 0.04, back, door.x, door.y - ih / 2, back / 2 + T, [0.9, 0.85, 0.8], false, true);
      addBox("dark", iw, 0.04, back, door.x, door.y + ih / 2, back / 2 + T, [0.6, 0.55, 0.5], false, true);
      addBox("dark", 0.04, ih, back, door.x - iw / 2 - 0.3, door.y, back / 2 + T, [0.9, 0.8, 0.75]);
      addBox("dark", 0.04, ih, back, door.x + iw / 2 + 0.3, door.y, back / 2 + T, [0.9, 0.8, 0.75]);
      addBox("plaster", 0.3, ih, T, door.x - iw / 2 - 0.15, door.y, T * 1.5, [0.2, 0.17, 0.15]);
      addBox("plaster", 0.3, ih, T, door.x + iw / 2 + 0.15, door.y, T * 1.5, [0.2, 0.17, 0.15]);
      add("shopBack", card(iw + 0.6, ih, door.x, door.y, back + T - 0.02), [0.75, 0.7, 0.66]);
      add("plank", place(card(0.5, ih - 0.1, 0, 0, 0), door.x + iw / 2 - 0.05, door.y, 0.5 - 0.0, 0, -1.1, 0), [0.62, 0.42, 0.4]);
      add("plank", card(iw, 0.78, door.x, 0.5, 0.06), [0.55, 0.36, 0.34]);
      addBox("woodDark", iw + 0.04, 0.05, 0.12, door.x, 0.9, 0.06, [0.7, 0.55, 0.5]);
      // Picture chart in the left half, yellow packet card hung from the head.
      add("paper", card(0.42, 0.66, door.x - 0.18, 1.3, 0.1), [0.86, 0.84, 0.8]);
      add("card", card(0.22, 0.33, door.x + 0.12, 1.86, 0.02), [0.95, 0.92, 0.85]);
      addBox("wire", 0.006, 0.12, 0.006, door.x + 0.12, 2.08, 0.02);
      // White round sack hung outside from a bracket on the beam, tied at the neck.
      const sack = new THREE.SphereGeometry(0.14, 12, 9);
      const sp = sack.attributes.position;
      for (let i = 0; i < sp.count; i++) {
        const v = new THREE.Vector3().fromBufferAttribute(sp, i);
        const k = 1 + 0.08 * Math.sin(v.x * 31 + v.y * 17) + 0.05 * Math.sin(v.z * 23);
        sp.setXYZ(i, v.x * k, v.y * k * (v.y < 0 ? 0.92 : 1.05), v.z * k * 0.9);
      }
      sack.computeVertexNormals();
      add("sack", place(sack, door.x + 0.55, 2.2, -0.24), [0.78, 0.76, 0.72]);
      addBox("sack", 0.07, 0.07, 0.07, door.x + 0.55, 2.4, -0.24, [0.85, 0.82, 0.78]);
      addBox("wire", 0.01, 0.12, 0.01, door.x + 0.55, 2.48, -0.24);
      addBox("bar", 0.02, 0.02, 0.26, door.x + 0.55, 2.54, -0.13);
      addBox("sign", 0.2, 0.28, 0.015, door.x - 0.15, 2.88, -0.12, [0.95, 0.94, 0.9]);
      return;
    }
    addBox("woodDark", door.w - 0.1, door.h - 0.1, 0.04, door.x, door.y, 0.12, [0.6, 0.5, 0.45]);
    add("plank", card(door.w - 0.1, door.h - 0.08, door.x, door.y, 0.095), [0.92, 0.84, 0.8]);
    addBox("woodDark", 0.04, door.h - 0.12, 0.03, door.x, door.y, 0.08, [0.7, 0.55, 0.5]);
    addBox("bar", 0.16, 0.03, 0.02, door.x - 0.06, door.y + 0.05, 0.07, [0.5, 0.44, 0.38]);
    addBox("bar", 0.05, 0.07, 0.03, door.x + 0.04, door.y - 0.02, 0.055, [0.4, 0.34, 0.28]);
  });

  // Upper windows: deep reveal, closed brown leaves behind an iron grille, plaster sill and hood.
  function win(x, y, w, h) {
    frame(x, y, w, h, -0.02, "woodDark", [0.78, 0.6, 0.56], 0.08);
    add("plank", card(w - 0.06, h - 0.06, x, y, 0.14), [0.62, 0.48, 0.44]);
    addBox("woodDark", 0.04, h - 0.08, 0.03, x, y, 0.12, [0.6, 0.48, 0.42]);
    add("grille", card(w - 0.08, h - 0.08, x, y, 0.0), [0.8, 0.62, 0.58]);
    addBox("plaster", w + 0.2, 0.05, 0.1, x, y - h / 2 - 0.07, -0.04, [0.72, 0.66, 0.62], true);
  }
  wins.forEach((row) => row.forEach((item) => win(item.x, item.y, item.w, item.h)));

  // Floor bands with a thin projecting lip.
  for (const by of [3.22, 5.12, 7.12]) addBox("plaster", W + 0.04, 0.09, 0.1, W / 2, by, -0.04, [0.88, 0.84, 0.8], true);

  addBox("wood", W + 0.2, 0.1, 0.42, W / 2, 9.05, -0.16, [0.62, 0.5, 0.42]);
  addBox("plaster", W + 0.08, 0.16, 0.28, W / 2, 9.2, -0.06, [0.9, 0.86, 0.8], true);
  for (let i = 0; i < 8; i++) {
    const x = 0.8 + i * (W - 1.6) / 7;
    addBox("woodDark", 0.08, 0.22, 0.16, x, 8.82, -0.12, [0.55, 0.42, 0.34]);
  }

  // Wires: a 12-strand bundle sagging under the eave between three brackets, a dropper
  // down past the pier to a junction box on the beam, and the twisted tie at the shutter head.
  function wire(pts, rad, segs) {
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), segs || 12, rad, 4, false), [0.85, 0.82, 0.78]);
  }
  const r = rng(925);
  const posts = [0.15, 3.9, W - 0.1];
  for (const px of posts) addBox("bar", 0.04, 0.04, 0.34, px, 8.62, -0.15);
  for (let i = 0; i < 12; i++) {
    const tint = i % 4 === 0 ? [2.4, 2.3, 2.2] : [0.85, 0.82, 0.78];
    for (let s = 0; s < 2; s++) {
      const a = posts[s];
      const b = posts[s + 1];
      const droop = 0.2 + r() * 0.35;
      const y = 8.6 + (r() - 0.5) * 0.08;
      const z = -0.3 + (r() - 0.5) * 0.1;
      add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
        new THREE.Vector3(a, y, z),
        new THREE.Vector3(a + (b - a) * 0.3, y - droop * 0.8, z - 0.03),
        new THREE.Vector3(a + (b - a) * 0.55, y - droop, z - 0.05 * r()),
        new THREE.Vector3(a + (b - a) * 0.8, y - droop * 0.7, z),
        new THREE.Vector3(b, y + (r() - 0.5) * 0.04, z),
      ]), 14, 0.007 + r() * 0.006, 4, false), tint);
    }
  }
  wire([
    new THREE.Vector3(3.9, 8.55, -0.3),
    new THREE.Vector3(3.82, 6.5, -0.2),
    new THREE.Vector3(3.78, 4.0, -0.18),
    new THREE.Vector3(3.95, 3.0, -0.22),
    new THREE.Vector3(4.1, 2.86, -0.2),
  ], 0.011, 20);
  addBox("bar", 0.16, 0.2, 0.08, 4.15, 2.82, -0.08, [0.75, 0.72, 0.68]);
  wire([
    new THREE.Vector3(4.6, 2.86, -0.06),
    new THREE.Vector3(4.7, 2.7, -0.14),
    new THREE.Vector3(4.85, 2.6, -0.1),
    new THREE.Vector3(4.95, 2.66, -0.06),
  ], 0.008, 8);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list.map((g) => (g.index ? g.toNonIndexed() : g)), false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "grime" && name !== "grille" && name !== "card";
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
  root.userData.id = "025";
  return root;
}
