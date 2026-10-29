// House 027. Khichapukhu Sadak at the New Road edge, OSM way 341148648, edge 3.
// West face 7.35 m. Spec: research/houses200/027/design.md
// Origin: front-left of the MODEL, before place.js yaws it 180.
// place.js puts model x = 0 on the south end, which is photo-right (the neo pier).
// x = 7.35 is north, photo-left (the VOSS pier). +Y up. +Z into the lot, east.
// Street face is z = 0. The lane is negative Z.
// Still: pano fDAtv2_M3tWlVH92AzuO0Q, yaw 102, pitch -8, fov 72.
// This bay only: SASA COMPLEX, the Citizens Bank window above it, two arches above that.
// VOSS and neo are the neighbours and are not on this footprint.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.35;
const D = 9.79;
const T = 0.22;

function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
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

function toTex(c, srgb, wrap) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function canvasTex(draw, w, h) {
  const c = canvas(w, h);
  draw(c.getContext("2d"), w, h);
  return toTex(c, true, false);
}

function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  return g;
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
      const w = X[i + 1] - X[i];
      const h = Y[j + 1] - Y[j];
      if (w < 0.015 || h < 0.015) continue;
      const inside = holes.some((hole) => Math.abs(cx - hole.x) < hole.w / 2 - 0.001 && Math.abs(cy - hole.y) < hole.h / 2 - 0.001);
      if (!inside) out.push({ x: cx, y: cy, w, h });
    }
  }
  return out;
}

function brickSet() {
  const w = 1024;
  const h = 512;
  const cols = 10;
  const rows = 16;
  const bw = w / cols;
  const bh = h / rows;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const r = rng(27027);
  c.fillStyle = "#d2b29e";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#404040";
  e.fillRect(0, 0, w, h);
  // Pale salmon brick of the still's piers (sampled 211,160,138 with mortar), a few fired darker.
  const pal = [
    [247, 178, 154], [233, 162, 139], [250, 197, 174], [221, 151, 130],
    [240, 173, 148], [228, 167, 151], [252, 206, 185], [206, 140, 122],
  ];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw / 2;
    for (let k = 0; k < cols; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.88 + r() * 0.2;
      let R = p[0] * j;
      let G = p[1] * j;
      let B = p[2] * j;
      if (r() < 0.1) { R *= 0.76; G *= 0.72; B *= 0.7; }
      const jx = 1.4 + r();
      const jy = 1.3 + r() * 0.6;
      for (const dx of [0, -w]) {
        const x0 = k * bw + off + dx + jx;
        const y0 = row * bh + jy;
        const ww = bw - jx * 2;
        const hh = bh - jy * 2;
        c.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
        c.fillRect(x0, y0, ww, hh);
        c.fillStyle = "rgba(90,40,32,0.18)";
        c.fillRect(x0, y0 + hh * 0.72, ww, hh * 0.28);
        e.fillStyle = "#6a6a6a";
        e.fillRect(x0 + 1, y0 + 1, ww - 2, hh - 2);
      }
    }
  }
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 2.4), false, true);
  map.repeat.set(1 / 2.35, 1 / 1.15);
  nor.repeat.set(1 / 2.35, 1 / 1.15);
  return { diff: map, nor };
}

function normalFromHeight(hc, strength) {
  const w = hc.width;
  const h = hc.height;
  const src = hc.getContext("2d").getImageData(0, 0, w, h).data;
  const out = canvas(w, h);
  const og = out.getContext("2d");
  const img = og.createImageData(w, h);
  const d = img.data;
  const H = (x, y) => src[((((y + h) % h) * w) + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = -(H(x + 1, y) - H(x - 1, y)) * strength;
      const ny = (H(x, y + 1) - H(x, y - 1)) * strength;
      const l = Math.hypot(nx, ny, 1);
      const i = (y * w + x) * 4;
      d[i] = (nx / l * 0.5 + 0.5) * 255;
      d[i + 1] = (ny / l * 0.5 + 0.5) * 255;
      d[i + 2] = (1 / l * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  og.putImageData(img, 0, 0);
  return out;
}
function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i), p.getY(i));
    else if (ax >= ay) uv.setXY(i, p.getZ(i), p.getY(i));
    else uv.setXY(i, p.getX(i), p.getZ(i));
  }
  return g;
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.92 + 0.08 * hash(x * 1.7, y * 1.3, z * 1.7);
    if (y < 0.5) k *= 0.78 + 0.22 * (y / 0.5);
    if (z > 0.4) k *= Math.max(0.72, 1 - (z - 0.4) * 0.05);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

// Model-space shade: damp foot, shadow under each band, and the shop going dark with depth
// (the still's interior samples 35,20,24 against 211,160,138 on the pier).
const AO_GLSL = `
varying vec3 vHousePos;
float hh27(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vn27(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hh27(i), hh27(i + vec2(1.0, 0.0)), f.x), mix(hh27(i + vec2(0.0, 1.0)), hh27(i + vec2(1.0, 1.0)), f.x), f.y);
}
float under27(float y, float band, float reach) { return step(y, band) * smoothstep(reach, 0.0, band - y); }
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 1.0 - 0.32 * smoothstep(0.5, 0.0, p.y);
  ao *= 1.0 - 0.3 * under27(p.y, 4.48, 0.3);
  ao *= 1.0 - 0.25 * under27(p.y, 7.42, 0.3);
  ao *= 1.0 - 0.35 * under27(p.y, 8.74, 0.35);
  if (p.z > 0.02 && p.x > 0.28 && p.x < 5.92 && p.y < 3.36) {
    ao *= mix(0.45, 0.14, smoothstep(0.0, 4.0, p.z));
    ao *= 1.0 - 0.35 * smoothstep(2.4, 3.3, p.y);
  }
#ifdef HOUSE_BRICK
  float n = vn27(p.xy * vec2(1.1, 0.8) + p.z * 3.0) * 0.6 + vn27(p.xy * vec2(5.0, 3.0)) * 0.4;
  ao *= 0.86 + 0.18 * n;
  float streak = vn27(vec2((p.x + p.z) * 11.0, p.y * 0.4));
  ao *= 1.0 - 0.14 * streak * smoothstep(9.0, 7.6, p.y) * smoothstep(7.0, 8.6, p.y);
  ao *= 1.0 - 0.12 * smoothstep(1.4, 0.0, p.y) * vn27(vec2(p.x * 3.0 + p.z * 3.0, p.y * 2.0));
#endif
  return ao;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= hao;
reflectedLight.directSpecular *= hao;
reflectedLight.indirectDiffuse *= hao;
reflectedLight.indirectSpecular *= hao;
`;

function houseShader(mat, name) {
  if (mat.userData.h027) return mat;
  mat.userData.h027 = true;
  if (name === "brick") mat.defines = Object.assign(mat.defines || {}, { HOUSE_BRICK: "" });
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = position;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + AO_GLSL)
      .replace("#include <aomap_fragment>", "#include <aomap_fragment>\n" + LIGHT_GLSL);
  };
  mat.customProgramCacheKey = () => "house027" + (name === "brick" ? "b" : "");
  return mat;
}

// Terracotta board with raised bronze serif letters, as in the still. Returns map and bump.
function signTex() {
  const w = 1024;
  const h = 182;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const g = col.getContext("2d");
  const e = hei.getContext("2d");
  const r = rng(2727);
  g.fillStyle = "#b86e54";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 260; i++) {
    g.fillStyle = `rgba(${r() < 0.5 ? "70,30,20" : "200,140,110"},${0.04 + r() * 0.06})`;
    g.fillRect(r() * w, r() * h, 6 + r() * 60, 2 + r() * 6);
  }
  const grd = g.createLinearGradient(0, 0, 0, h);
  grd.addColorStop(0, "rgba(60,30,20,0.25)");
  grd.addColorStop(0.15, "rgba(0,0,0,0)");
  grd.addColorStop(0.9, "rgba(0,0,0,0)");
  grd.addColorStop(1, "rgba(50,24,16,0.35)");
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#6f3b2a";
  g.lineWidth = 8;
  g.strokeRect(4, 4, w - 8, h - 8);
  e.fillStyle = "#000";
  e.fillRect(0, 0, w, h);
  const text = "SASA COMPLEX";
  g.font = "700 112px Georgia, 'Times New Roman', serif";
  const sx = (w * 0.9) / g.measureText(text).width;
  const draw = (ctx, fill, dx, dy) => {
    ctx.save();
    ctx.translate(w / 2 + dx, h * 0.54 + dy);
    ctx.scale(sx, 1.0);
    ctx.font = "700 112px Georgia, 'Times New Roman', serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = fill;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  };
  draw(g, "rgba(45,20,10,0.75)", 7, 9);
  draw(g, "#7a5428", 3, 4);
  draw(g, "#c79b5c", 0, 0);
  g.globalCompositeOperation = "source-atop";
  const lg = g.createLinearGradient(0, h * 0.2, 0, h * 0.85);
  lg.addColorStop(0, "rgba(255,230,170,0.25)");
  lg.addColorStop(1, "rgba(60,30,10,0.2)");
  g.fillStyle = lg;
  g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = "source-over";
  draw(e, "#fff", 0, 0);
  return { map: toTex(col, true, false), bump: toTex(hei, false, false) };
}

// Green film on the bank glass: dark at the head, bright teal-green at the foot (still 45,149,110 -> 41,215,162).
function bankTex() {
  return canvasTex((g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#127a52");
    grd.addColorStop(0.55, "#0e9e68");
    grd.addColorStop(1, "#14c088");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.06)";
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(w * (0.1 + i * 0.24), 0);
      g.lineTo(w * (0.22 + i * 0.24), 0);
      g.lineTo(w * (0.02 + i * 0.24), h);
      g.lineTo(w * (-0.1 + i * 0.24), h);
      g.fill();
    }
    g.fillStyle = "rgba(20,60,40,0.25)";
    g.fillRect(0, h - 14, w, 14);
    g.strokeStyle = "rgba(245,250,248,0.95)";
    g.lineCap = "round";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(w * 0.15, h * 0.47);
    g.quadraticCurveTo(w * 0.36, h * 0.3, w * 0.68, h * 0.41);
    g.stroke();
    g.fillStyle = "#f6f8f6";
    g.textBaseline = "alphabetic";
    g.save();
    g.translate(w * 0.12, h * 0.67);
    g.transform(1, 0, -0.16, 1, 0, 0);
    g.font = "700 118px Arial, sans-serif";
    const cw = g.measureText("Citizens").width;
    g.scale((w * 0.56) / cw, 1.0);
    g.fillText("Citizens", 0, 0);
    g.restore();
    g.save();
    g.translate(w * 0.705, h * 0.67);
    g.transform(1, 0, -0.12, 1, 0, 0);
    g.font = "700 60px Arial, sans-serif";
    g.fillText("Bank", 0, 0);
    g.restore();
  }, 1024, 522);
}

function saleGreen() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#eeeee6";
    g.fillRect(0, 0, w, h);
    g.font = "800 112px Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.lineWidth = 10;
    g.strokeStyle = "#1f5a2c";
    g.strokeText("SALE", w / 2, h / 2 + 4);
    g.fillStyle = "#e9efe0";
    g.fillText("SALE", w / 2, h / 2 + 4);
  }, 512, 170);
}

// Second white banner on the table: its small print is not readable in the still, so it stays grey marks.
function blankBanner() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#ecebe4";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(60,60,70,0.55)";
    g.fillRect(w * 0.1, h * 0.3, w * 0.8, h * 0.14);
    g.fillRect(w * 0.18, h * 0.58, w * 0.64, h * 0.1);
  }, 256, 90);
}

function saleRed() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#c21d26";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#f4f1ec";
    g.font = "800 78px Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("SALE", w / 2, h * 0.2);
    g.fillRect(w * 0.2, h * 0.42, w * 0.6, h * 0.42);
    g.strokeStyle = "rgba(60,10,10,0.6)";
    g.lineWidth = 6;
    g.strokeRect(3, 3, w - 6, h - 6);
  }, 256, 300);
}

// kito NEPAL standee: logo band, two models over STEP WITH STYLE, navy panel of round shoe shots.
function kitoTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f4f2ee";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#d8261f";
    g.beginPath();
    g.moveTo(40, 30); g.lineTo(70, 30); g.lineTo(70, 62); g.lineTo(98, 30); g.lineTo(130, 30);
    g.lineTo(92, 70); g.lineTo(130, 110); g.lineTo(98, 110); g.lineTo(70, 80); g.lineTo(70, 110); g.lineTo(40, 110);
    g.closePath();
    g.fill();
    g.font = "800 66px Arial, sans-serif";
    g.textBaseline = "alphabetic";
    g.fillText("kito", 138, 96);
    g.fillStyle = "#333";
    g.font = "700 20px Arial, sans-serif";
    g.fillText("NEPAL", 150, 122);
    const ph = g.createLinearGradient(0, 140, 0, 430);
    ph.addColorStop(0, "#d9dde2");
    ph.addColorStop(1, "#b8c0cc");
    g.fillStyle = ph;
    g.fillRect(14, 140, w - 28, 300);
    const person = (x, top, shirt, legs) => {
      g.fillStyle = "#c99a7c";
      g.beginPath(); g.arc(x, top + 18, 17, 0, 6.3); g.fill();
      g.fillStyle = "#2a1e1a";
      g.beginPath(); g.arc(x, top + 12, 17, Math.PI, 0); g.fill();
      g.fillStyle = shirt;
      g.fillRect(x - 28, top + 36, 56, 100);
      g.fillStyle = legs;
      g.fillRect(x - 24, top + 136, 21, 130);
      g.fillRect(x + 3, top + 136, 21, 130);
    };
    person(85, 158, "#eceae6", "#2f3a58");
    person(190, 150, "#3d6fae", "#ecebe6");
    g.save();
    g.translate(w / 2, 330);
    g.rotate(-0.42);
    g.font = "900 42px Arial, sans-serif";
    g.textAlign = "center";
    g.lineWidth = 7;
    g.strokeStyle = "#c8201c";
    g.fillStyle = "#ffffff";
    for (const [t, y] of [["STEP", -42], ["WITH", 0], ["STYLE", 42]]) {
      g.strokeText(t, 0, y);
      g.fillText(t, 0, y);
    }
    g.restore();
    g.fillStyle = "#1c2440";
    g.fillRect(14, 440, w - 28, h - 454);
    const cols = ["#2aa8c4", "#e23b6a", "#f0d23a", "#e7e3dc", "#3cae6a", "#d8261f", "#3a6ec4", "#f08a2a", "#9a5bc4"];
    for (let i = 0; i < 9; i++) {
      const cx = 60 + (i % 3) * 80;
      const cy = 490 + Math.floor(i / 3) * 74;
      g.fillStyle = "#f2f2f2";
      g.beginPath(); g.arc(cx, cy, 30, 0, 6.3); g.fill();
      g.fillStyle = cols[i];
      g.beginPath(); g.ellipse(cx, cy + 4, 22, 11, -0.3, 0, 6.3); g.fill();
    }
  }, 280, 722);
}

function archGlass() {
  return canvasTex((g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "#9aa6b0");
    grd.addColorStop(1, "#4a545c");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.12)";
    g.fillRect(0, 0, w, h * 0.3);
    g.fillStyle = "rgba(40,30,30,0.5)";
    g.fillRect(w * 0.1, h * 0.55, w * 0.35, h * 0.45);
  }, 128, 160);
}

// Hung garments, white with fold shading so vertex tint gives the colour. 4 x 2 cells:
// zip jacket, tee, collared shirt, hoodie / trousers, quilted jacket, frock, jumper.
function garmentAtlas() {
  const c = canvas(1024, 512);
  const g = c.getContext("2d");
  const S = 256;
  const hanger = (ox, oy) => {
    g.strokeStyle = "#8a8a8a";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(ox + 128, oy + 6); g.lineTo(ox + 128, oy + 18);
    g.moveTo(ox + 70, oy + 34); g.lineTo(ox + 128, oy + 18); g.lineTo(ox + 186, oy + 34);
    g.stroke();
  };
  const body = (ox, oy, pts) => {
    g.beginPath();
    pts.forEach(([x, y], i) => (i ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y)));
    g.closePath();
    const grd = g.createLinearGradient(ox, oy, ox + S, oy);
    grd.addColorStop(0, "#c8c8c8");
    grd.addColorStop(0.5, "#f4f4f4");
    grd.addColorStop(1, "#bcbcbc");
    g.fillStyle = grd;
    g.fill();
  };
  const folds = (ox, oy, x0, x1, y0, y1, n) => {
    for (let i = 0; i < n; i++) {
      const x = ox + x0 + ((x1 - x0) * (i + 0.5)) / n;
      g.strokeStyle = "rgba(0,0,0,0.16)";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x, oy + y0);
      g.quadraticCurveTo(x + 6, oy + (y0 + y1) / 2, x - 3, oy + y1);
      g.stroke();
    }
  };
  const shirtShape = [[78, 34], [100, 28], [128, 40], [156, 28], [178, 34], [236, 92], [214, 116], [190, 96], [192, 248], [64, 248], [66, 96], [42, 116], [20, 92]];
  const longShape = [[80, 34], [102, 28], [128, 40], [154, 28], [176, 34], [212, 70], [226, 230], [200, 232], [190, 110], [192, 250], [64, 250], [66, 110], [56, 232], [30, 230], [44, 70]];
  // 0 zip jacket
  hanger(0, 0); body(0, 0, longShape); folds(0, 0, 70, 190, 60, 245, 4);
  g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(126, 40, 4, 208);
  // 1 tee
  hanger(S, 0); body(S, 0, shirtShape); folds(S, 0, 70, 190, 110, 245, 3);
  g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.arc(S + 128, 36, 18, 0, Math.PI); g.fill();
  // 2 collared shirt
  hanger(2 * S, 0); body(2 * S, 0, longShape); folds(2 * S, 0, 70, 190, 70, 245, 3);
  g.fillStyle = "rgba(255,255,255,0.9)"; g.beginPath(); g.moveTo(2 * S + 104, 30); g.lineTo(2 * S + 128, 62); g.lineTo(2 * S + 152, 30); g.lineTo(2 * S + 128, 44); g.fill();
  g.fillStyle = "rgba(0,0,0,0.3)"; for (let y = 70; y < 240; y += 30) g.fillRect(2 * S + 126, y, 4, 4);
  // 3 hoodie
  hanger(3 * S, 0); body(3 * S, 0, longShape); folds(3 * S, 0, 70, 190, 60, 245, 3);
  g.fillStyle = "rgba(0,0,0,0.22)"; g.fillRect(3 * S + 86, 170, 84, 40);
  g.fillStyle = "rgba(0,0,0,0.3)"; g.beginPath(); g.ellipse(3 * S + 128, 46, 34, 20, 0, 0, Math.PI); g.fill();
  // 4 trousers
  hanger(0, S); body(0, S, [[70, 36], [186, 36], [196, 250], [140, 250], [128, 110], [116, 250], [60, 250]]);
  folds(0, S, 70, 190, 60, 245, 4);
  // 5 quilted jacket
  hanger(S, S); body(S, S, longShape);
  g.strokeStyle = "rgba(0,0,0,0.3)"; g.lineWidth = 4;
  for (let y = 70; y < 250; y += 26) { g.beginPath(); g.moveTo(S + 30, S + y); g.lineTo(S + 226, S + y); g.stroke(); }
  g.fillStyle = "rgba(0,0,0,0.35)"; g.fillRect(S + 126, S + 40, 4, 208);
  // 6 frock
  hanger(2 * S, S); body(2 * S, S, [[92, 34], [112, 30], [128, 42], [144, 30], [164, 34], [172, 110], [222, 250], [34, 250], [84, 110]]);
  folds(2 * S, S, 50, 206, 130, 248, 6);
  // 7 jumper
  hanger(3 * S, S); body(3 * S, S, longShape);
  g.strokeStyle = "rgba(0,0,0,0.12)"; g.lineWidth = 3;
  for (let x = 72; x < 190; x += 10) { g.beginPath(); g.moveTo(3 * S + x, S + 50); g.lineTo(3 * S + x, S + 248); g.stroke(); }
  g.fillStyle = "rgba(0,0,0,0.25)"; g.fillRect(3 * S + 64, S + 226, 128, 22);
  return toTex(c, true, false);
}

// Back of the shop, lit: shelves of folded stock (left), dark racks, the passage, blue-lit shelves (right).
function backCard() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#2a1c1c";
    g.fillRect(0, 0, w, h);
    const r = rng(2771);
    // Drawn mirrored: the stock shelves end up photo-left, the blue shelves photo-right.
    g.translate(w, 0);
    g.scale(-1, 1);
    g.fillStyle = "#3a3434";
    g.fillRect(w * 0.74, h * 0.08, w * 0.24, h * 0.84);
    for (let s = 0; s < 5; s++) {
      const y = h * (0.18 + s * 0.15);
      g.fillStyle = "#8a8682";
      g.fillRect(w * 0.74, y, w * 0.24, 4);
      for (let k = 0; k < 6; k++) {
        const pal = ["#e8e2dc", "#d8a0a8", "#9aa0aa", "#e8e2dc", "#3a3a48", "#c8c0b0"];
        g.fillStyle = pal[Math.floor(r() * pal.length)];
        g.fillRect(w * 0.75 + k * w * 0.038, y - h * 0.08, w * 0.032, h * 0.08);
      }
    }
    for (let i = 0; i < 70; i++) {
      const x = w * (0.04 + r() * 0.6);
      const y = h * (0.25 + r() * 0.15);
      const pal = ["#151214", "#221a20", "#5a1418", "#9a1c22", "#2a2c3a", "#4a4448", "#c8c2c0"];
      g.fillStyle = pal[Math.floor(r() * pal.length)];
      g.fillRect(x, y, w * 0.03, h * (0.3 + r() * 0.2));
    }
    g.fillStyle = "#0a0607";
    g.fillRect(w * 0.18, h * 0.12, w * 0.14, h * 0.88);
    const pg = g.createLinearGradient(0, h * 0.2, 0, h);
    pg.addColorStop(0, "rgba(120,90,70,0.0)");
    pg.addColorStop(1, "rgba(120,90,70,0.35)");
    g.fillStyle = pg;
    g.fillRect(w * 0.21, h * 0.3, w * 0.08, h * 0.7);
    g.fillStyle = "#1e3a5a";
    g.fillRect(w * 0.0, h * 0.1, w * 0.12, h * 0.8);
    for (let s = 0; s < 6; s++) {
      g.fillStyle = "rgba(140,190,230,0.55)";
      g.fillRect(0, h * (0.15 + s * 0.13), w * 0.12, 3);
    }
    g.fillStyle = "#3a2a24";
    g.fillRect(0, h * 0.9, w, h * 0.1);
  }, 1024, 512);
}

function clothTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#a8424a";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      const grd = g.createLinearGradient(x, 0, x + 16, 0);
      grd.addColorStop(0, "rgba(0,0,0,0.28)");
      grd.addColorStop(0.5, "rgba(255,255,255,0.06)");
      grd.addColorStop(1, "rgba(0,0,0,0.28)");
      g.fillStyle = grd;
      g.fillRect(x, 0, 16, h);
    }
  }, 256, 64);
}

export function createHouse027() {
  const root = new THREE.Group();
  root.name = "house-027";
  const bricks = brickSet();
  const sign = signTex();
  const mats = {
    brick: new THREE.MeshStandardMaterial({ map: bricks.diff, normalMap: bricks.nor, color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true }),
    plaster: new THREE.MeshStandardMaterial({ color: 0xd8d4ca, roughness: 0.88, metalness: 0, vertexColors: true }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xc8c2b8, roughness: 0.9, metalness: 0, vertexColors: true }),
    band: new THREE.MeshStandardMaterial({ color: 0xeceae0, roughness: 0.85, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1412, roughness: 0.94, metalness: 0, vertexColors: true }),
    room: new THREE.MeshStandardMaterial({ color: 0x5a4642, roughness: 0.94, metalness: 0, vertexColors: true }),
    frame: new THREE.MeshStandardMaterial({ color: 0x2a2422, roughness: 0.6, metalness: 0.15, vertexColors: true }),
    alu: new THREE.MeshStandardMaterial({ color: 0xa8aaa6, roughness: 0.45, metalness: 0.4, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ map: clothTex(), color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, vertexColors: true }),
    garment: new THREE.MeshStandardMaterial({ map: garmentAtlas(), color: 0xffffff, roughness: 0.95, metalness: 0, vertexColors: true, alphaTest: 0.5, side: THREE.DoubleSide }),
    tile: new THREE.MeshStandardMaterial({ color: 0xc8bba8, roughness: 0.72, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x1c1a19, roughness: 0.55, metalness: 0.05, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ map: archGlass(), color: 0xffffff, roughness: 0.3, metalness: 0.1, vertexColors: true }),
    white: new THREE.MeshStandardMaterial({ color: 0xe7e4de, roughness: 0.7, metalness: 0, vertexColors: true }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff6e8 }),
  };
  for (const [name, mat] of Object.entries(mats)) if (name !== "lamp") houseShader(mat, name);
  mats.brick.normalScale = new THREE.Vector2(0.8, 0.8);
  // Lifts set from pixel samples of the render against the still (pier, sill band).
  mats.brick.color.setRGB(1.53, 1.3, 1.18);
  mats.band.color.setRGB(1.3, 1.27, 1.2);

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "brick" || name === "plaster" || name === "concrete") worldUV(g);
    add(name, g, tint);
  }
  function wall(x0, x1, y0, y1, zFace, holes, depth) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox("brick", part.w, part.h, depth || T, part.x, part.y, zFace + (depth || T) / 2);
  }
  function looseMesh(geo, mat, key) {
    houseShader(mat, key);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
  }
  function card(w, h, x, y, z, ry, mat, key) {
    looseMesh(place(new THREE.PlaneGeometry(w, h), x, y, z, 0, ry === undefined ? Math.PI : ry, 0), mat, key);
  }

  // Proportions read off the still at the pier scale (480 px = 7.35 m): a wide brick pier photo-left,
  // a 5.6 m shop mouth, a thin pier photo-right; the mouth, board and bank film are taller than Grok had.
  const FL = 0.5;
  const shop = { x: 3.1, y: 1.675, w: 5.6, h: 3.35 };
  const glass = { x: 3.02, y: 6.05, w: 5.3, h: 2.7 };
  const archX = [1.75, 4.3];
  const spring = 7.95;
  const rad = 0.62;
  const archHoles = archX.map((cx) => ({ x: cx, y: (7.62 + spring + rad) / 2, w: rad * 2, h: spring + rad - 7.62 }));
  wall(0, W, 0, 9.05, 0, [shop, glass, ...archHoles]);
  wall(0, W, 0, 9.05, D - T, []);
  addBox("brick", T, 9.05, D - 0.2, T / 2, 4.52, D / 2 + 0.05);
  addBox("brick", T, 9.05, D - 0.2, W - T / 2, 4.52, D / 2 + 0.05);

  // Piers stand proud of the shop mouth: wide photo-left with its dark vent, thin photo-right.
  addBox("brick", 1.45, 4.45, 0.14, W - 0.725, 2.225, -0.07);
  addBox("concrete", 1.55, 0.1, 0.24, W - 0.725, 4.5, -0.1);
  addBox("dark", 0.5, 0.2, 0.03, W - 0.7, 3.72, -0.14);
  addBox("concrete", 0.58, 0.05, 0.08, W - 0.7, 3.6, -0.16);
  addBox("brick", 0.3, 4.45, 0.12, 0.15, 2.225, -0.06);
  // Upper piers either side of the bank film.
  addBox("brick", 1.0, 2.9, 0.08, W - 1.2, 6.05, -0.04);
  addBox("brick", 0.36, 2.9, 0.08, 0.18, 6.05, -0.04);

  // White sill under the film, lintel over it, cornice.
  addBox("band", W + 0.04, 0.12, 0.26, W / 2, 4.6, -0.08);
  addBox("band", glass.w + 0.3, 0.14, 0.2, glass.x, 7.48, -0.04);
  addBox("plaster", W + 0.12, 0.2, 0.36, W / 2, 8.85, -0.1);
  addBox("concrete", W + 0.16, 0.08, 0.42, W / 2, 8.99, -0.14, [1.05, 1.04, 1.02]);
  addBox("brick", W, 0.42, 0.28, W / 2, 8.95, 0.08);

  // Two arched windows above the film: brick infill, a soldier-course ring, glass and white frames.
  for (const cx of archX) {
    const n = 6;
    const step = rad / n;
    for (let iy = 0; iy < n; iy++) {
      for (let ix = 0; ix < 2 * n; ix++) {
        const x = cx - rad + (ix + 0.5) * step;
        const y = spring + (iy + 0.5) * step;
        const dx = x - cx;
        const dy = y - spring;
        if (dx * dx + dy * dy < (rad - 0.04) * (rad - 0.04)) continue;
        addBox("brick", step * 0.98, step * 0.98, T, x, y, T / 2);
      }
    }
    for (let k = 0; k <= 12; k++) {
      const a = Math.PI * (k / 12);
      const g = place(boxGeo(0.07, 0.2, 0.06), cx + Math.cos(a) * (rad + 0.1), spring + Math.sin(a) * (rad + 0.1), -0.02, 0, 0, a - Math.PI / 2);
      worldUV(g);
      add("brick", g, [0.92, 0.86, 0.84]);
    }
    const glassGeo = new THREE.CircleGeometry(rad - 0.05, 14, 0, Math.PI);
    glassGeo.applyMatrix4(new THREE.Matrix4().makeRotationY(Math.PI));
    glassGeo.translate(cx, spring, 0.08);
    add("glass", glassGeo);
    addBox("glass", rad * 2 - 0.08, spring - 7.62, 0.02, cx, (spring + 7.62) / 2, 0.08);
    addBox("white", 0.05, spring - 7.62, 0.06, cx, (spring + 7.62) / 2, 0.05);
    addBox("white", rad * 2, 0.05, 0.06, cx, spring, 0.05);
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const a = Math.PI * (1 - i / 10);
      pts.push(new THREE.Vector3(cx + Math.cos(a) * (rad - 0.03), spring + Math.sin(a) * (rad - 0.03), 0.04));
    }
    add("white", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.03, 5, false));
  }

  // Shell roof. Tank and dish sit behind the parapet, unseen from the lane.
  addBox("concrete", W, 0.12, D, W / 2, 8.78, D / 2);
  addBox("concrete", 0.9, 0.7, 0.9, 2.2, 9.2, 6.4, [0.75, 0.78, 0.8]);
  addBox("dark", 0.7, 0.08, 0.7, 5.4, 9.05, 7.1);

  // Bank film set in its reveal, light aluminium frame, two faint mullions and the low transom.
  const bankMap = bankTex();
  const film = new THREE.MeshStandardMaterial({ map: bankMap, emissive: 0xffffff, emissiveMap: bankMap, emissiveIntensity: 0.22, roughness: 0.6, metalness: 0, side: THREE.DoubleSide });
  card(glass.w, glass.h, glass.x, glass.y, 0.1, Math.PI, film, "bank");
  addBox("alu", glass.w + 0.1, 0.07, 0.1, glass.x, glass.y + glass.h / 2, 0.06);
  addBox("alu", glass.w + 0.1, 0.07, 0.1, glass.x, glass.y - glass.h / 2 + 0.03, 0.06);
  addBox("alu", glass.w, 0.05, 0.06, glass.x, glass.y - glass.h / 2 + 0.24, 0.07);
  for (const fx of [-0.5, -1 / 6, 1 / 6, 0.5]) addBox("alu", 0.05, glass.h, fx === -0.5 || fx === 0.5 ? 0.1 : 0.05, glass.x + fx * glass.w, glass.y, 0.07);

  // SASA COMPLEX board on a dark frame, shutter box under it, aluminium shutter guides.
  const boardMat = new THREE.MeshStandardMaterial({ map: sign.map, bumpMap: sign.bump, bumpScale: 2.5, roughness: 0.6, metalness: 0.08, side: THREE.DoubleSide });
  card(5.62, 1.0, shop.x, 3.95, -0.22, Math.PI, boardMat, "sign");
  addBox("frame", 5.72, 1.08, 0.12, shop.x, 3.95, -0.14, [1.3, 0.85, 0.7]);
  addBox("frame", shop.w, 0.18, 0.26, shop.x, 3.3, 0.0, [1.2, 1.1, 1.1]);
  for (const sx of [-1, 1]) addBox("alu", 0.07, shop.h - FL, 0.08, shop.x + sx * (shop.w / 2 - 0.05), (FL + shop.h) / 2, -0.02, [0.85, 0.85, 0.85]);

  // Three grey stone steps across the mouth, a polished floor within.
  const stone = [0.9, 0.84, 0.72];
  addBox("tile", shop.w + 0.5, 0.17, 0.75, shop.x, 0.085, -0.375, stone);
  addBox("tile", shop.w + 0.3, 0.17, 0.5, shop.x, 0.255, -0.25, [0.86, 0.8, 0.7]);
  addBox("tile", shop.w + 0.1, 0.16, 0.25, shop.x, 0.42, -0.125, stone);
  for (const [y, z] of [[0.17, -0.75], [0.34, -0.5], [0.5, -0.25]]) addBox("dark", shop.w + 0.1, 0.02, 0.03, shop.x, y - 0.01, z + 0.015, [2.2, 2.0, 1.8]);
  addBox("tile", shop.w, 0.04, 5.6, shop.x, FL - 0.02, 2.8, [0.42, 0.36, 0.34]);

  // The room: side walls, ceiling with spots, lit back card.
  const back = new THREE.MeshStandardMaterial({ map: backCard(), emissive: 0xffffff, emissiveMap: null, roughness: 0.9, side: THREE.DoubleSide });
  back.emissiveMap = back.map;
  back.emissiveIntensity = 0.16;
  card(shop.w - 0.1, 2.8, shop.x, FL + 1.4, 5.5, Math.PI, back, "back");
  addBox("room", 0.08, 2.85, 5.5, shop.x - shop.w / 2 + 0.06, FL + 1.42, 2.8, [0.6, 0.62, 0.7]);
  addBox("room", 0.08, 2.85, 5.5, shop.x + shop.w / 2 - 0.06, FL + 1.42, 2.8, [0.7, 0.62, 0.6]);
  addBox("dark", shop.w, 0.06, 5.5, shop.x, 3.24, 2.8, [1.6, 1.4, 1.4]);
  for (let i = 0; i < 10; i++) {
    const lx = shop.x - 2.0 + (i % 5) * 1.0;
    const lz = 0.9 + Math.floor(i / 5) * 2.2;
    const disc = new THREE.CircleGeometry(0.07, 10);
    disc.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI / 2));
    disc.translate(lx, 3.2, lz);
    (buckets.lamp || (buckets.lamp = [])).push(disc);
  }
  const atm = canvasTex((g, w, h) => {
    g.fillStyle = "#0c3f8a";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#f2f6fb";
    g.font = "700 42px Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("Citizens Bank", w / 2, h / 2);
  }, 512, 96);
  card(0.7, 0.14, 2.6, 3.05, 1.6, Math.PI, new THREE.MeshStandardMaterial({ map: atm, emissive: 0xffffff, emissiveMap: atm, emissiveIntensity: 0.6, roughness: 0.5, side: THREE.DoubleSide }), "atm");

  // Hung stock: mostly black, navy, maroon and red, as the still's dark racks.
  const atlasUV = (geo, cell) => {
    const uv = geo.attributes.uv;
    const cx = cell % 4;
    const cy = Math.floor(cell / 4);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (cx + uv.getX(i)) / 4, 1 - (cy + 1 - uv.getY(i)) / 2);
    return geo;
  };
  const tints = [
    [0.14, 0.13, 0.14], [0.14, 0.13, 0.14], [0.1, 0.1, 0.12], [0.16, 0.18, 0.3], [0.42, 0.09, 0.11],
    [0.72, 0.1, 0.12], [0.62, 0.08, 0.1], [0.42, 0.42, 0.44], [0.86, 0.86, 0.84], [0.82, 0.5, 0.56], [0.3, 0.32, 0.22],
  ];
  const gr = rng(27077);
  function garment(x, y, z, ry, size, cell, tint) {
    const geo = atlasUV(new THREE.PlaneGeometry(size, size), cell);
    place(geo, x, y - size / 2, z, 0, ry, 0);
    add("garment", geo, tint || tints[Math.floor(gr() * tints.length)]);
  }
  function rail(x0, x1, y, z, count, size, cells) {
    add("alu", place(new THREE.CylinderGeometry(0.014, 0.014, x1 - x0, 6), (x0 + x1) / 2, y, z, 0, 0, Math.PI / 2), [0.7, 0.7, 0.7]);
    for (let i = 0; i < count; i++) {
      const x = x0 + ((i + 0.5) * (x1 - x0)) / count + (gr() - 0.5) * 0.06;
      garment(x, y + 0.02, z + (gr() - 0.5) * 0.12, Math.PI + (gr() - 0.5) * 0.7, size, cells[Math.floor(gr() * cells.length)]);
    }
  }
  rail(2.0, 4.9, 2.45, 2.0, 11, 0.62, [0, 2, 3, 5, 7]);
  rail(1.3, 5.3, 2.65, 3.1, 14, 0.66, [0, 1, 3, 5, 7]);
  rail(0.9, 5.5, 2.8, 4.3, 16, 0.7, [0, 2, 3, 5, 6, 7]);
  // The red block the still shows behind the table, right of centre.
  for (let i = 0; i < 4; i++) garment(2.45 + i * 0.16, 2.47, 1.75 + i * 0.03, Math.PI + (gr() - 0.5) * 0.4, 0.6, [0, 5, 3, 0][i], [[0.74, 0.1, 0.12], [0.66, 0.08, 0.1], [0.78, 0.14, 0.14], [0.5, 0.06, 0.08]][i]);
  // Photo-right wall: garments face out from the wall behind the kito standee.
  add("alu", place(new THREE.CylinderGeometry(0.014, 0.014, 3.0, 6), 0.55, 2.6, 3.0, Math.PI / 2, 0, 0), [0.7, 0.7, 0.7]);
  for (let i = 0; i < 9; i++) garment(0.58 + gr() * 0.05, 2.62, 1.7 + i * 0.32, Math.PI / 2 + (gr() - 0.5) * 0.3, 0.62, [0, 1, 4, 5, 6][i % 5]);

  // Photo-left glass shelves with folded stock.
  const shelfX = shop.x + shop.w / 2 - 0.35;
  for (const z of [0.4, 2.0]) addBox("alu", 0.04, 2.3, 0.04, shelfX, FL + 1.15, z);
  for (let s = 0; s < 5; s++) {
    const y = FL + 0.35 + s * 0.45;
    addBox("white", 0.5, 0.02, 1.6, shelfX, y, 1.2, [0.85, 0.92, 0.95]);
    for (let k = 0; k < 5; k++) {
      const h = 0.08 + gr() * 0.14;
      const pal = [[0.9, 0.88, 0.86], [0.85, 0.6, 0.65], [0.6, 0.62, 0.68], [0.9, 0.88, 0.86], [0.2, 0.2, 0.28], [0.78, 0.74, 0.66]];
      addBox("goods", 0.34, h, 0.24, shelfX - 0.02, y + h / 2 + 0.01, 0.55 + k * 0.32 + (gr() - 0.5) * 0.05, pal[Math.floor(gr() * pal.length)]);
    }
  }
  // Blue-lit shelving photo-right, deeper in.
  addBox("room", 0.4, 2.5, 1.6, 0.6, FL + 1.25, 4.4, [0.35, 0.5, 0.75]);

  // Red-skirted table with the SALE banner, the unreadable second banner, and rows of small white stock.
  const tx = 4.25;
  const tz = 1.05;
  addBox("cloth", 2.3, 0.86, 0.85, tx, FL + 0.43, tz);
  addBox("cloth", 2.36, 0.04, 0.9, tx, FL + 0.88, tz, [1.15, 1.1, 1.1]);
  card(0.8, 0.27, tx + 0.35, FL + 0.66, tz - 0.44, Math.PI, new THREE.MeshStandardMaterial({ map: saleGreen(), roughness: 0.7, side: THREE.DoubleSide }), "sale-g");
  card(0.62, 0.22, tx - 0.4, FL + 0.7, tz - 0.44, Math.PI, new THREE.MeshStandardMaterial({ map: blankBanner(), roughness: 0.7, side: THREE.DoubleSide }), "banner");
  for (let i = 0; i < 26; i++) {
    const bx = tx - 1.0 + (i % 13) * 0.16 + (gr() - 0.5) * 0.04;
    const bz = tz - 0.2 + Math.floor(i / 13) * 0.3;
    const h = 0.1 + gr() * 0.1;
    const tint = [0.9 - gr() * 0.15, 0.9 - gr() * 0.12, 0.92 - gr() * 0.1];
    if (gr() < 0.6) add("goods", place(new THREE.CylinderGeometry(0.03, 0.035, h, 7), bx, FL + 0.9 + h / 2, bz), tint);
    else addBox("goods", 0.1, h, 0.07, bx, FL + 0.9 + h / 2, bz, tint);
  }
  // Red SALE board on the floor in front of the table, photo-left.
  card(0.62, 0.74, 5.2, FL + 0.38, 0.5, Math.PI, new THREE.MeshStandardMaterial({ map: saleRed(), roughness: 0.75, side: THREE.DoubleSide }), "sale-r");

  // kito NEPAL standee on a grey foot, photo-right in the mouth.
  card(0.62, 1.6, 1.1, FL + 0.88, 0.45, Math.PI, new THREE.MeshStandardMaterial({ map: kitoTex(), roughness: 0.6, side: THREE.DoubleSide }), "kito");
  addBox("alu", 0.66, 0.06, 0.3, 1.1, FL + 0.05, 0.47);
  addBox("alu", 0.66, 1.66, 0.02, 1.1, FL + 0.88, 0.47, [0.4, 0.4, 0.42]);

  // Plate 34 / 102 high on the photo-right pier.
  const plate = canvasTex((g, w, h) => {
    g.fillStyle = "#efece4";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#333";
    g.lineWidth = 6;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = "#222";
    g.font = "700 64px Arial, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("34", w / 2, h * 0.3);
    g.fillRect(w * 0.15, h * 0.5 - 3, w * 0.7, 6);
    g.fillText("102", w / 2, h * 0.74);
  }, 180, 220);
  card(0.22, 0.27, 0.15, 4.85, -0.13, Math.PI, new THREE.MeshStandardMaterial({ map: plate, roughness: 0.6, side: THREE.DoubleSide }), "plate");

  // Broom leaning on the photo-left pier, as in the still.
  add("goods", place(new THREE.CylinderGeometry(0.018, 0.022, 1.9, 6), W - 0.9, 1.0, -0.32, 0, 0, -0.2), [0.85, 0.72, 0.2]);
  addBox("dark", 0.09, 0.22, 0.06, W - 0.71, 1.98, -0.32, [1.4, 1.3, 1.3]);

  // Cables: a heavy sagging bundle falling across the film from photo-left, a second run over the board,
  // loops at the photo-right pier, and two thin risers down the film.
  function span(a, b, droop, r, segs) {
    const pts = [];
    const n = segs || 14;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), n, r, 4, false));
  }
  const wr = rng(2799);
  for (let i = 0; i < 26; i++) {
    const j = () => (wr() - 0.5);
    const core = i < 12 ? 0.35 : 1;
    span([W + 0.5, 6.12 + j() * 0.2 * core, -0.55 + j() * 0.15 * core], [-0.5, 4.98 + j() * 0.25 * core, -0.6 + j() * 0.15 * core], 0.16 + wr() * 0.12 * core, i < 10 ? 0.018 + wr() * 0.01 : 0.006 + wr() * 0.006);
  }
  for (let i = 0; i < 10; i++) {
    const j = () => (wr() - 0.5);
    span([W + 0.5, 4.95 + j() * 0.12, -0.5 + j() * 0.1], [-0.5, 4.8 + j() * 0.15, -0.5 + j() * 0.1], 0.08 + wr() * 0.15, i < 3 ? 0.014 : 0.006 + wr() * 0.005);
  }
  for (let i = 0; i < 4; i++) span([0.4, 4.85, -0.45], [-0.5, 4.9 - i * 0.05, -0.5], 0.25 + i * 0.1, 0.008, 8);
  span([W + 0.5, 7.4, -0.3], [-0.5, 6.3, -0.35], 0.3, 0.005);
  span([4.62, 7.4, -0.12], [4.5, 4.75, -0.3], 0.0, 0.007, 6);
  span([1.4, 7.4, -0.12], [0.95, 5.6, -0.35], 0.0, 0.007, 6);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.castShadow = name !== "glass" && name !== "lamp";
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const obj of loose) root.add(obj);

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "027";
  return root;
}
