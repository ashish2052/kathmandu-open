// House 024. Jaisi Dewal, Nanma Galli, OSM way 903765084, edge 2, 6.23 m.
// Spec: research/houses200/024/design.md
// Origin: front-left ground corner. +X along the street toward the west, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. x = 0 is east (photo-right). x = 6.23 is west.
// Still: pano 19jORhbwQSvaix4QDTSktw, yaw 75, pitch -12. Copy that frame.
// West: paired cyan doors under the large carved window. Centre: open bay, purple cloth, boxes.
// East: a single cyan door under the smaller carved window. Poster reads ईन्द्रजात्रा / हार्दिक स्वागत गर्दछौं.
// The red shrine to the west is the neighbour. No shop lamp. No words that are not on the poster.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 6.23;
const D = 4.58;
const T = 0.2;
const ROOF = 6.55;

function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
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

function place(g, x, y, z, rx, ry, rz, sx, sy, sz) {
  g.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)),
    new THREE.Vector3(sx || 1, sy || 1, sz || 1),
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

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTex(c, wrap) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function canvasTex(draw, w, h, wrap) {
  const c = canvas(w, h);
  draw(c.getContext("2d"), w, h);
  return toTex(c, wrap);
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 0.93 + 0.07 * hash(x * 1.7, y * 1.3, z * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}


// Overcast AO: shop mouth, foot, beam line, the band under the west eave and the deep carved recesses.
const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  float recess = smoothstep(0.0, 0.28, p.z) * (1.0 - step(1.15, p.z));
  ao *= 1.0 - 0.55 * recess;
  ao *= 1.0 - 0.28 * smoothstep(0.35, 0.0, p.y);
  ao *= 1.0 - 0.3 * smoothstep(0.3, 0.0, abs(p.y - 2.42)) * step(p.z, 0.3);
  float eave = smoothstep(4.55, 5.25, p.y) * step(p.y, 5.32) * smoothstep(1.7, 2.1, p.x);
  ao *= 1.0 - 0.42 * eave;
  ao *= 1.0 - 0.3 * smoothstep(0.35, 0.0, 6.3 - p.y) * step(0.0, 6.3 - p.y) * step(p.x, 2.0);
  float shop = smoothstep(2.6, 2.2, p.y) * smoothstep(-0.9, -0.1, p.z);
  ao *= 1.0 - 0.25 * shop;
  return ao;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= hao;
reflectedLight.directSpecular *= hao;
reflectedLight.indirectDiffuse *= (0.78 + 0.22 * hao);
reflectedLight.indirectSpecular *= hao;
`;

function houseShader(mat, key) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + AO_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house024-" + key; };
  return mat;
}

function plasterTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#ebe5d8";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      const v = hash(i, 3, 7);
      g.fillStyle = v > 0.5 ? "rgba(255,252,244,0.18)" : "rgba(120,104,84,0.1)";
      const r = 1 + hash(i, 2, 5) * 6;
      g.beginPath();
      g.arc(hash(i, 2, 1) * w, hash(i, 4, 8) * h, r, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = "rgba(140,124,100,0.08)";
      g.beginPath();
      g.ellipse(hash(i, 9, 1) * w, hash(i, 1, 9) * h, 20 + hash(i, 5, 5) * 40, 10 + hash(i, 6, 6) * 30, hash(i, 7, 7) * 3, 0, Math.PI * 2);
      g.fill();
    }
  }, 256, 256, true);
}

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) * 0.55, p.getY(i) * 0.55);
    else if (ax >= ay) uv.setXY(i, p.getZ(i) * 0.55, p.getY(i) * 0.55);
    else uv.setXY(i, p.getX(i) * 0.55, p.getZ(i) * 0.55);
  }
  return g;
}

// Cyan painted boards: grey-pulled #178fbe, vertical planks, chipped to grey timber, dirty foot.
function blueTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#2a8db2";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) {
      g.fillStyle = hash(x, 1, 1) > 0.5 ? "rgba(255,255,255,0.06)" : "rgba(0,30,50,0.08)";
      g.fillRect(x, 0, 32, h);
      g.fillStyle = "rgba(10,40,56,0.55)";
      g.fillRect(x, 0, 2, h);
    }
    for (let i = 0; i < 70; i++) {
      const x = hash(i, 1, 4) * w;
      const y = hash(i, 8, 2) * h;
      g.fillStyle = hash(i, 2, 9) > 0.55 ? "rgba(150,140,120,0.7)" : "rgba(210,226,228,0.4)";
      g.beginPath();
      g.ellipse(x, y, 2 + hash(i, 3, 5) * 7, 1 + hash(i, 7, 1) * 4, 0, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 30; i++) {
      g.fillStyle = "rgba(20,40,48,0.12)";
      g.fillRect(hash(i, 5, 3) * w, hash(i, 6, 2) * h * 0.4, 2, 40 + hash(i, 1, 6) * 120);
    }
    const foot = g.createLinearGradient(0, h * 0.72, 0, h);
    foot.addColorStop(0, "rgba(60,58,48,0)");
    foot.addColorStop(1, "rgba(60,58,48,0.6)");
    g.fillStyle = foot;
    g.fillRect(0, h * 0.72, w, h * 0.28);
  }, 256, 512, true);
}

// Carved timber in relief: beaded borders, rosettes, scroll gouges; dark, weathered toward grey.
function carvedTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#4a4037";
    g.fillRect(0, 0, w, h);
    const relief = (draw, lw) => {
      g.lineWidth = lw;
      g.save(); g.translate(-1.5, -1.5); g.strokeStyle = "rgba(150,128,104,0.55)"; draw(); g.restore();
      g.save(); g.translate(1.5, 1.5); g.strokeStyle = "rgba(8,6,4,0.8)"; draw(); g.restore();
      g.strokeStyle = "#594c40"; draw();
    };
    for (const y of [10, h - 10]) {
      relief(() => { for (let x = 6; x < w; x += 12) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.stroke(); } }, 2);
    }
    relief(() => { g.strokeRect(22, 22, w - 44, h - 44); }, 4);
    for (const [cx, cy] of [[w * 0.3, h * 0.5], [w * 0.75, h * 0.5]]) {
      relief(() => {
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4;
          g.beginPath();
          g.ellipse(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, 14, 6, a, 0, Math.PI * 2);
          g.stroke();
        }
        g.beginPath(); g.arc(cx, cy, 8, 0, Math.PI * 2); g.stroke();
      }, 3);
    }
    relief(() => {
      g.beginPath();
      for (let x = 30; x < w - 30; x += 8) g.lineTo(x, h * 0.5 + Math.sin(x * 0.12) * 40);
      g.stroke();
    }, 2);
    for (let i = 0; i < 140; i++) {
      g.fillStyle = hash(i, 4, 4) > 0.5 ? "rgba(120,110,98,0.16)" : "rgba(0,0,0,0.2)";
      g.fillRect(hash(i, 1, 2) * w, hash(i, 2, 3) * h, 1 + hash(i, 3, 1) * 3, 2 + hash(i, 4, 6) * 10);
    }
  }, 256, 256, true);
}

// One cusped (multi-lobed) arch bay: carved frame, transparent opening, inner bead line.
function archTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#483e35";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = hash(i, 7, 4) > 0.5 ? "rgba(140,120,96,0.2)" : "rgba(0,0,0,0.25)";
      g.fillRect(hash(i, 1, 8) * w, hash(i, 3, 2) * h, 2 + hash(i, 2, 2) * 4, 2 + hash(i, 5, 1) * 8);
    }
    const l = w * 0.2, r = w * 0.8, top = h * 0.24, bot = h * 0.9, cx = w / 2, R = (r - l) / 2;
    const path = () => {
      g.beginPath();
      g.moveTo(l, bot);
      g.lineTo(l, top + R);
      const lobes = 5;
      for (let k = 0; k < lobes; k++) {
        const a0 = Math.PI + k * Math.PI / lobes, a1 = Math.PI + (k + 1) * Math.PI / lobes, am = (a0 + a1) / 2;
        const px = cx + Math.cos(am) * R * 0.9, py = top + R + Math.sin(am) * R * 0.9;
        g.arc(px, py, R * 0.32, am - Math.PI * 0.55, am + Math.PI * 0.55);
      }
      g.lineTo(r, bot);
      g.closePath();
    };
    g.save(); g.translate(-3, -3); path(); g.lineWidth = 10; g.strokeStyle = "rgba(150,128,100,0.5)"; g.stroke(); g.restore();
    g.save(); g.translate(3, 3); path(); g.lineWidth = 10; g.strokeStyle = "rgba(0,0,0,0.7)"; g.stroke(); g.restore();
    path(); g.lineWidth = 6; g.strokeStyle = "#5a4c40"; g.stroke();
    for (let y = bot + 10; y < h - 6; y += 10) { g.fillStyle = "rgba(0,0,0,0.5)"; g.fillRect(l - 8, y, r - l + 16, 2); }
    for (const sx of [w * 0.08, w * 0.92]) {
      for (let y = 20; y < h - 20; y += 22) {
        g.fillStyle = "rgba(150,126,100,0.35)"; g.beginPath(); g.arc(sx - 1, y - 1, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = "rgba(0,0,0,0.6)"; g.beginPath(); g.arc(sx + 1, y + 1, 6, 0, Math.PI * 2); g.fill();
        g.fillStyle = "#524538"; g.beginPath(); g.arc(sx, y, 5, 0, Math.PI * 2); g.fill();
      }
    }
    g.globalCompositeOperation = "destination-out";
    path(); g.fillStyle = "#000"; g.fill();
    g.globalCompositeOperation = "source-over";
  }, 256, 384, false);
}

// Old thin Kathmandu bricks with dark mud mortar, worn and dull.
function brickTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#3e2f28";
    g.fillRect(0, 0, w, h);
    const bh = 16, bw = 56;
    for (let row = 0; row * bh < h; row++) {
      const off = row % 2 ? bw / 2 : 0;
      for (let x = -bw; x < w + bw; x += bw) {
        const v = hash(row, x, 3);
        const r = 104 + v * 24, gg = 70 + v * 14, b = 60 + v * 10;
        g.fillStyle = `rgb(${r | 0},${gg | 0},${b | 0})`;
        g.fillRect(x + off + 2, row * bh + 2, bw - 4, bh - 4);
        if (hash(row, x, 9) > 0.7) { g.fillStyle = "rgba(30,22,18,0.45)"; g.fillRect(x + off + 6, row * bh + 4, 14, 7); }
      }
    }
  }, 256, 256, true);
}

// Galvanised corrugated sheet, rust streaks running down the slope, grime at the drip edge.
function sheetTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#77736c";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      const grd = g.createLinearGradient(x, 0, x + 16, 0);
      grd.addColorStop(0, "#5e5a55"); grd.addColorStop(0.5, "#98938a"); grd.addColorStop(1, "#5e5a55");
      g.fillStyle = grd; g.fillRect(x, 0, 16, h);
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(${110 + hash(i, 1, 1) * 40 | 0},${58 + hash(i, 2, 2) * 20 | 0},30,${0.25 + hash(i, 3, 3) * 0.35})`;
      g.fillRect(hash(i, 4, 4) * w, hash(i, 5, 5) * h * 0.6, 3 + hash(i, 6, 6) * 10, 30 + hash(i, 7, 7) * 140);
    }
    const drip = g.createLinearGradient(0, h * 0.7, 0, h);
    drip.addColorStop(0, "rgba(50,40,30,0)"); drip.addColorStop(1, "rgba(50,40,30,0.55)");
    g.fillStyle = drip; g.fillRect(0, h * 0.7, w, h * 0.3);
  }, 256, 256, true);
}

// Faded cream-green awning sheet over the west shop.
function awningTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#b6b59a";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { g.fillStyle = "rgba(90,96,70,0.22)"; g.fillRect(x, 0, 5, h); }
    for (let i = 0; i < 50; i++) {
      g.fillStyle = hash(i, 2, 2) > 0.5 ? "rgba(110,92,60,0.25)" : "rgba(80,80,70,0.2)";
      g.fillRect(hash(i, 1, 3) * w, hash(i, 3, 1) * h, 2 + hash(i, 4, 2) * 6, 20 + hash(i, 5, 2) * 90);
    }
    const drip = g.createLinearGradient(0, h * 0.6, 0, h);
    drip.addColorStop(0, "rgba(70,66,50,0)"); drip.addColorStop(1, "rgba(70,66,50,0.5)");
    g.fillStyle = drip; g.fillRect(0, h * 0.6, w, h * 0.4);
  }, 256, 256, true);
}

// The Indra Jatra poster. Only the two lines that read in the still are lettered; small print stays smudges.
function posterTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#1d5a4c";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(196,200,120,0.55)";
    g.lineWidth = 2;
    for (let k = 0; k < 3; k++) {
      g.beginPath(); g.arc(w / 2, 40, 60 + k * 26, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
    }
    for (let k = 0; k < 12; k++) {
      const a = Math.PI * (0.08 + k * 0.075);
      g.beginPath(); g.ellipse(w / 2 + Math.cos(a) * 110, 40 + Math.sin(a) * 110, 14, 6, a, 0, Math.PI * 2); g.stroke();
    }
    g.fillStyle = "#f1efe6";
    g.font = "700 104px 'Nirmala UI', 'Mangal', sans-serif";
    g.textAlign = "center";
    g.fillText("ईन्द्रजात्रा", w / 2 + 6, 290);
    for (let k = 0; k < 9; k++) { g.fillStyle = "rgba(235,232,220,0.55)"; g.fillRect(70 + k * 42, 318, 30, 8); }
    g.fillStyle = "#f1efe6";
    g.font = "600 46px 'Nirmala UI', 'Mangal', sans-serif";
    g.fillText("हार्दिक स्वागत गर्दछौं", w / 2, 386);
    g.fillStyle = "#e9e6dc";
    g.fillRect(60, 420, w - 120, 300);
    const px = 72, py = 432, pw = w - 144, ph = 276;
    const bg = g.createRadialGradient(w / 2, py + ph * 0.5, 20, w / 2, py + ph * 0.5, 220);
    bg.addColorStop(0, "#c08a2e"); bg.addColorStop(0.6, "#6c4a1c"); bg.addColorStop(1, "#2a1e10");
    g.fillStyle = bg; g.fillRect(px, py, pw, ph);
    g.fillStyle = "#c9a43a";
    g.beginPath(); g.moveTo(w / 2 - 90, py + 110); g.lineTo(w / 2 - 70, py + 20); g.lineTo(w / 2, py + 4); g.lineTo(w / 2 + 70, py + 20); g.lineTo(w / 2 + 90, py + 110); g.closePath(); g.fill();
    for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? "#e8d070" : "#8a6a20"; g.beginPath(); g.arc(w / 2 - 80 + k * 12.3, py + 30 + Math.abs(k - 6.5) * 4, 5, 0, Math.PI * 2); g.fill(); }
    const face = g.createRadialGradient(w / 2 - 10, py + 160, 10, w / 2, py + 170, 80);
    face.addColorStop(0, "#d8d87a"); face.addColorStop(0.7, "#a8ac4e"); face.addColorStop(1, "#6e6e2c");
    g.fillStyle = face; g.beginPath(); g.ellipse(w / 2, py + 170, 62, 78, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#1c140c";
    for (const s of [-1, 1]) { g.beginPath(); g.ellipse(w / 2 + s * 24, py + 158, 13, 6, 0, 0, Math.PI * 2); g.fill(); g.fillRect(w / 2 + s * 24 - 22 * (s > 0 ? 0 : 1), py + 156, 22, 3); }
    g.fillStyle = "#b42a1a"; g.beginPath(); g.ellipse(w / 2, py + 132, 5, 9, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#8a3a2a"; g.beginPath(); g.ellipse(w / 2, py + 208, 14, 5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#c9a43a"; g.fillRect(w / 2 - 100, py + 240, 200, 36);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = hash(i, 3, 9) > 0.5 ? "rgba(255,230,150,0.12)" : "rgba(20,14,4,0.18)";
      g.fillRect(px + hash(i, 1, 9) * pw, py + hash(i, 2, 9) * ph, 2 + hash(i, 4, 9) * 5, 2 + hash(i, 5, 9) * 5);
    }
    const vig = g.createRadialGradient(w / 2, py + ph / 2, 60, w / 2, py + ph / 2, 200);
    vig.addColorStop(0, "rgba(0,0,0,0)"); vig.addColorStop(1, "rgba(10,8,2,0.45)");
    g.fillStyle = vig; g.fillRect(px, py, pw, ph);
    g.fillStyle = "#f2f1ec";
    g.fillRect(0, 790, w, h - 790);
    g.fillStyle = "#2a8cc0"; g.beginPath(); g.arc(70, 860, 32, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#e2c040"; g.beginPath(); g.arc(92, 884, 18, 0, Math.PI * 2); g.fill();
    for (let k = 0; k < 6; k++) { g.fillStyle = "rgba(60,110,120,0.35)"; g.fillRect(130 + k * 56, 846, 44, 10); g.fillRect(130 + k * 56, 876, 36, 8); }
    const age = g.createLinearGradient(0, 0, 0, h);
    age.addColorStop(0, "rgba(60,50,30,0.15)"); age.addColorStop(0.5, "rgba(0,0,0,0)"); age.addColorStop(1, "rgba(80,70,50,0.25)");
    g.fillStyle = age; g.fillRect(0, 0, w, h);
  }, 512, 960, false);
}

function clothTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#47396e";
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 4) {
      const v = Math.sin(x * 0.11) * 0.5 + 0.5;
      g.fillStyle = `rgba(${v > 0.5 ? "120,104,160" : "18,14,40"},${0.18 + Math.abs(v - 0.5) * 0.3})`;
      g.fillRect(x, 0, 4, h);
    }
    const foot = g.createLinearGradient(0, h * 0.7, 0, h);
    foot.addColorStop(0, "rgba(40,36,40,0)"); foot.addColorStop(1, "rgba(40,36,40,0.45)");
    g.fillStyle = foot; g.fillRect(0, h * 0.7, w, h * 0.3);
  }, 128, 256, false);
}

// Facade grime decal drawn in metres (40 px/m), cleared over every opening.
function grimeTex(openings) {
  const S = 40;
  return canvasTex((g, w, h) => {
    const Y = (y) => h - y * S;
    const X = (x) => x * S;
    const damp = g.createLinearGradient(0, Y(0), 0, Y(0.9));
    damp.addColorStop(0, "rgba(92,80,62,0.55)"); damp.addColorStop(1, "rgba(92,80,62,0)");
    g.fillStyle = damp; g.fillRect(0, Y(0.9), w, 0.9 * S);
    const soot = g.createLinearGradient(0, Y(6.3), 0, Y(5.5));
    soot.addColorStop(0, "rgba(60,54,48,0.4)"); soot.addColorStop(1, "rgba(60,54,48,0)");
    g.fillStyle = soot; g.fillRect(0, Y(6.3), X(2.1), 0.8 * S);
    const eave = g.createLinearGradient(0, Y(5.3), 0, Y(4.5));
    eave.addColorStop(0, "rgba(70,62,52,0.5)"); eave.addColorStop(1, "rgba(70,62,52,0)");
    g.fillStyle = eave; g.fillRect(X(1.9), Y(5.3), w, 0.8 * S);
    for (let i = 0; i < 70; i++) {
      const x = hash(i, 1, 7) * w;
      const y0 = Y(2.6 + hash(i, 2, 7) * 3.4);
      const len = (0.3 + hash(i, 3, 7) * 1.2) * S;
      const st = g.createLinearGradient(0, y0, 0, y0 + len);
      st.addColorStop(0, "rgba(96,86,70,0.28)"); st.addColorStop(1, "rgba(96,86,70,0)");
      g.fillStyle = st; g.fillRect(x, y0, 2 + hash(i, 4, 7) * 5, len);
    }
    for (const [x0, x1, y] of [[3.35, 5.65, 3.0], [0.38, 1.32, 3.2]]) {
      const st = g.createLinearGradient(0, Y(y), 0, Y(y - 0.6));
      st.addColorStop(0, "rgba(80,68,52,0.45)"); st.addColorStop(1, "rgba(80,68,52,0)");
      g.fillStyle = st;
      for (let x = x0; x < x1; x += 0.07) g.fillRect(X(x), Y(y), 2.4, (0.2 + hash(x, y, 1) * 0.5) * S);
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(150,138,118,${0.12 + hash(i, 5, 5) * 0.2})`;
      g.beginPath();
      g.ellipse(hash(i, 6, 1) * w, hash(i, 7, 1) * h, 8 + hash(i, 8, 1) * 30, 5 + hash(i, 9, 1) * 18, hash(i, 1, 1) * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(60,52,44,0.6)";
    g.lineWidth = 1.2;
    for (const [x, y, n] of [[5.85, 3.0, 14], [1.95, 5.1, 18], [0.6, 2.95, 10], [3.6, 5.6, 9], [2.0, 3.0, 12]]) {
      g.beginPath();
      let px = X(x), py = Y(y);
      g.moveTo(px, py);
      for (let k = 0; k < n; k++) { px += (hash(k, x, y) - 0.5) * 12; py += 4 + hash(k, y, x) * 6; g.lineTo(px, py); }
      g.stroke();
    }
    for (const o of openings) g.clearRect(X(o.x - o.w / 2), Y(o.y + o.h / 2), o.w * S, o.h * S);
  }, Math.ceil(W * S), Math.ceil(6.4 * S), false);
}

export function createHouse024() {
  const root = new THREE.Group();
  root.name = "house-024";

  const groundHoles = [
    { x: 0.95, y: 1.12, w: 1.18, h: 2.1 },
    { x: 2.7, y: 1.16, w: 1.72, h: 2.18 },
    { x: 4.7, y: 1.12, w: 1.58, h: 2.1 },
  ];
  const upperHoles = [
    { x: 0.85, y: 4.0, w: 0.86, h: 1.5 },
    { x: 4.5, y: 4.15, w: 2.2, h: 1.5 },
  ];
  const breakHole = [{ x: 1.75, y: 5.95, w: 0.32, h: 0.6 }];
  const brickHole = { x: 1.15, y: 2.84, w: 2.3, h: 0.44 };

  const carved = carvedTex();
  carved.repeat.set(2.2, 2.2);
  const brick = brickTex();
  brick.repeat.set(1.6, 1.6);
  const sheet = sheetTex();
  sheet.repeat.set(1.2, 1);
  const awn = awningTex();
  awn.repeat.set(0.8, 1.2);
  const mats = {
    plaster: new THREE.MeshStandardMaterial({ map: plasterTex(), color: 0xffffff, roughness: 0.94, metalness: 0, vertexColors: true }),
    blue: new THREE.MeshStandardMaterial({ map: blueTex(), color: 0xffffff, roughness: 0.7, metalness: 0, vertexColors: true }),
    wood: new THREE.MeshStandardMaterial({ map: carved, bumpMap: carved, bumpScale: 3, color: 0xffffff, roughness: 0.88, metalness: 0, vertexColors: true }),
    brick: new THREE.MeshStandardMaterial({ map: brick, bumpMap: brick, bumpScale: 2, color: 0xffffff, roughness: 0.95, metalness: 0, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ map: sheet, color: 0xffffff, roughness: 0.66, metalness: 0.2, vertexColors: true, side: THREE.DoubleSide }),
    awning: new THREE.MeshStandardMaterial({ map: awn, color: 0xffffff, roughness: 0.8, metalness: 0, vertexColors: true, side: THREE.DoubleSide }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110e, roughness: 0.95, metalness: 0, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.74, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x24211e, roughness: 0.6, metalness: 0, vertexColors: true }),
    timber: new THREE.MeshStandardMaterial({ color: 0x5c534a, roughness: 0.9, metalness: 0, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx, ry, rz);
    if (name === "plaster") worldUV(g);
    add(name, g, tint);
  }
  function wall(name, x0, x1, y0, y1, zFace, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
    }
  }
  function looseMesh(geo, mat, key) {
    houseShader(mat, key);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
    return mesh;
  }

  wall("plaster", 0, W, 0, 2.5, 0, groundHoles);
  wall("plaster", 0, W, 2.62, 6.3, 0, upperHoles.concat(breakHole, [brickHole]));
  addBox("brick", brickHole.w, brickHole.h, 0.1, brickHole.x, brickHole.y, 0.06);
  addBox("brick", 0.3, 0.58, 0.08, breakHole[0].x, breakHole[0].y, 0.05);
  for (let i = 0; i < 7; i++) {
    addBox("brick", 0.22, 0.06, 0.11, 0.2 + hash(i, 1, 2) * 2.0, 2.66 + hash(i, 2, 1) * 0.36, -0.01, [0.9, 0.85, 0.8], 0, 0, (hash(i, 3, 3) - 0.5) * 0.3);
  }
  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2, [0.9, 0.87, 0.82]);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2, [0.86, 0.82, 0.76]);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2, [0.84, 0.8, 0.74]);
  addBox("plaster", W + 0.1, 0.14, 0.32, W / 2, 6.37, -0.06, [0.86, 0.83, 0.78]);
  addBox("plaster", W - 0.3, 0.12, D - 0.4, W / 2, 6.38, D / 2, [0.78, 0.74, 0.7]);

  const openings = groundHoles.concat(upperHoles, breakHole, [brickHole]);
  const grime = place(new THREE.PlaneGeometry(W, 6.4), W / 2, 3.2, -0.004, 0, Math.PI, 0);
  const grimeMat = new THREE.MeshStandardMaterial({ map: grimeTex(openings), transparent: true, depthWrite: false, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2 });
  grimeMat.map.repeat.set(-1, 1);
  grimeMat.map.offset.set(1, 0);
  looseMesh(grime, grimeMat, "grime");

  // Corrugated sheet: ribs every 7.6 cm, sagging slightly between rafters.
  function corrugated(mat, x0, x1, yIn, zIn, yOut, zOut, sag) {
    const n = Math.ceil((x1 - x0) / 0.019);
    const pos = [], uv = [], idx = [];
    for (let i = 0; i <= n; i++) {
      const x = x0 + (x1 - x0) * i / n;
      const rib = Math.sin((x - x0) / 0.076 * Math.PI * 2) * 0.012;
      const dip = Math.sin(Math.PI * i / n) * (sag || 0);
      pos.push(x, yIn + rib, zIn, x, yOut + rib - dip, zOut);
      const len = Math.hypot(yOut - yIn, zOut - zIn);
      uv.push(x, 0, x, len);
      if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    add(mat, g);
  }

  // West eave over the carved window: rafters, fascia, sheet.
  corrugated("metal", 1.85, W + 0.4, 5.62, 0.05, 4.98, -1.05, 0.04);
  for (let x = 2.0; x < W + 0.3; x += 0.42) addBox("timber", 0.06, 0.09, 1.15, x, 5.24, -0.5, [0.5, 0.42, 0.34], -0.53, 0, 0);
  addBox("timber", W + 0.5 - 1.85, 0.14, 0.05, (1.85 + W + 0.4) / 2, 4.93, -1.0, [0.46, 0.4, 0.33], -0.53, 0, 0);
  addBox("timber", W - 1.9, 0.1, 0.12, (1.9 + W) / 2, 5.55, -0.06, [0.45, 0.38, 0.3]);

  // Carved band of the big west window: header + dentil cornice, three cusped bays, carved sill tiers.
  function carvedWindow(x, y, w, h, bays) {
    const z = -0.24;
    const yb = y - h / 2, yt = y + h / 2;
    addBox("dark", w - 0.1, h - 0.1, 0.1, x, y, 0.12, [0.45, 0.4, 0.36]);
    addBox("wood", w + 0.2, 0.22, 0.26, x, yt + 0.1, z + 0.02, [0.85, 0.8, 0.74]);
    addBox("wood", w + 0.34, 0.08, 0.36, x, yt + 0.25, z - 0.03, [0.7, 0.64, 0.58]);
    const nd = Math.round((w + 0.3) / 0.09);
    for (let i = 0; i < nd; i++) addBox("wood", 0.05, 0.06, 0.06, x - (w + 0.3) / 2 + (i + 0.5) * (w + 0.3) / nd, yt + 0.18, z - 0.16, [0.75, 0.68, 0.6]);
    const gap = w / bays;
    for (let i = 0; i <= bays; i++) {
      const px = x - w / 2 + gap * i;
      addBox("wood", 0.13, h, 0.24, px, y, z, [0.82, 0.76, 0.68]);
      addBox("wood", 0.17, 0.1, 0.28, px, yt - 0.06, z - 0.02, [0.7, 0.64, 0.56]);
      addBox("wood", 0.17, 0.1, 0.28, px, yb + 0.06, z - 0.02, [0.7, 0.64, 0.56]);
    }
    for (let i = 0; i < bays; i++) {
      const cx = x - w / 2 + gap * (i + 0.5);
      const bay = place(new THREE.PlaneGeometry(gap - 0.1, h - 0.06), cx, y, z - 0.06, 0, Math.PI, 0);
      paintVary(bay, [0.86, 0.8, 0.74]);
      archBays.push(bay);
      for (let k = 0; k < 4; k++) addBox("wood", 0.02, h * 0.5, 0.02, cx - gap * 0.18 + k * gap * 0.12, yb + h * 0.34, z + 0.05, [0.6, 0.54, 0.48]);
      addBox("wood", gap - 0.16, 0.02, 0.02, cx, yb + h * 0.5, z + 0.05, [0.6, 0.54, 0.48]);
    }
    addBox("wood", w + 0.1, 0.36, 0.3, x, yb - 0.18, z + 0.02, [0.78, 0.72, 0.64]);
    addBox("wood", w + 0.3, 0.07, 0.4, x, yb - 0.39, z - 0.04, [0.66, 0.6, 0.54]);
    for (let i = 0; i < nd; i++) addBox("wood", 0.05, 0.12, 0.08, x - (w + 0.2) / 2 + (i + 0.5) * (w + 0.2) / nd, yb - 0.49, z - 0.14, [0.7, 0.64, 0.56]);
    addBox("wood", w + 0.38, 0.22, 0.44, x, yb - 0.66, z - 0.06, [0.62, 0.56, 0.5]);
    addBox("wood", w + 0.44, 0.06, 0.5, x, yb - 0.8, z - 0.08, [0.5, 0.45, 0.4]);
  }
  // The smaller east window: one tall opening in three stepped frames, lattice and a carved sill.
  function steppedWindow(x, y, w, h) {
    addBox("dark", w - 0.04, h - 0.04, 0.1, x, y, 0.12, [0.4, 0.36, 0.32]);
    for (let k = 0; k < 3; k++) {
      const s = 0.07 + k * 0.06, z = -0.04 - k * 0.07, t = [0.84 - k * 0.08, 0.78 - k * 0.08, 0.7 - k * 0.08];
      addBox("wood", s, h + k * 0.12, 0.08, x - w / 2 - k * 0.05, y, z, t);
      addBox("wood", s, h + k * 0.12, 0.08, x + w / 2 + k * 0.05, y, z, t);
      addBox("wood", w + k * 0.16 + s, s, 0.08, x, y + h / 2 + k * 0.05, z, t);
    }
    for (let k = 0; k < 6; k++) addBox("wood", 0.025, h - 0.12, 0.03, x - w / 2 + (k + 0.5) * w / 6, y, -0.02, [0.55, 0.5, 0.44]);
    for (let k = 0; k < 4; k++) addBox("wood", w - 0.06, 0.025, 0.03, x, y - h / 2 + (k + 1) * h / 5, -0.03, [0.55, 0.5, 0.44]);
    addBox("wood", w + 0.42, 0.26, 0.3, x, y - h / 2 - 0.13, -0.14, [0.74, 0.68, 0.6]);
    addBox("wood", w + 0.5, 0.06, 0.36, x, y - h / 2 - 0.29, -0.16, [0.6, 0.55, 0.5]);
    addBox("wood", w + 0.46, 0.1, 0.3, x, y + h / 2 + 0.24, -0.16, [0.66, 0.6, 0.54]);
  }
  const archBays = [];
  carvedWindow(4.5, 4.15, 2.15, 1.46, 3);
  steppedWindow(0.85, 4.0, 0.78, 1.44);
  const archMat = new THREE.MeshStandardMaterial({ map: archTex(), alphaTest: 0.5, roughness: 0.88, metalness: 0, side: THREE.DoubleSide, vertexColors: true });
  archMat.bumpMap = archMat.map;
  archMat.bumpScale = 3;
  looseMesh(mergeGeometries(archBays, false), archMat, "arch");

  // Ground storey: cyan doors, west awning, cyan hood on the east, purple cloth in the open bay.
  function frame(x, y, w, h, z, mat, t) {
    const s = t || 0.06;
    addBox(mat, s, h + s, 0.07, x - w / 2, y, z);
    addBox(mat, s, h + s, 0.07, x + w / 2, y, z);
    addBox(mat, w + s, s, 0.07, x, y + h / 2, z);
    addBox(mat, w + s, s * 1.15, 0.09, x, y - h / 2, z - 0.01);
  }
  function leaf(x, y, w, h, z) {
    addBox("blue", w, h, 0.04, x, y, z, [0.92, 0.95, 0.98]);
    const rows = 3;
    for (let i = 0; i < rows; i++) {
      const yy = y - h * 0.28 + i * (h * 0.56 / (rows - 1));
      addBox("blue", w * 0.74, 0.05, 0.03, x, yy + h * 0.1, z - 0.03, [1.08, 1.1, 1.12]);
      addBox("blue", w * 0.74, 0.05, 0.03, x, yy - h * 0.1, z - 0.03, [0.78, 0.8, 0.82]);
    }
    addBox("dark", 0.08, 0.015, 0.02, x, y, z - 0.045, [0.7, 0.72, 0.74]);
  }
  function doubleDoor(x, y, w, h) {
    frame(x, y, w, h, -0.02, "blue", 0.08);
    leaf(x - w * 0.24, y, w * 0.44, h - 0.1, -0.05);
    leaf(x + w * 0.24, y, w * 0.44, h - 0.1, -0.05);
  }
  doubleDoor(4.7, 1.12, 1.5, 2.02);
  doubleDoor(0.95, 1.12, 1.1, 2.02);
  addBox("dark", 0.05, 0.12, 0.05, 4.7, 1.1, -0.1, [0.5, 0.48, 0.44]);

  addBox("dark", 1.6, 2.05, 0.7, 2.7, 1.16, 0.7, [0.42, 0.34, 0.26]);
  const cartons = [
    [2.2, 0.32, 0.16, 0.34, 0.3, 0.28, [0.62, 0.54, 0.42]],
    [2.55, 0.26, 0.2, 0.3, 0.24, 0.26, [0.52, 0.38, 0.26]],
    [2.9, 0.38, 0.18, 0.36, 0.32, 0.28, [0.6, 0.58, 0.52]],
    [3.22, 0.22, 0.22, 0.26, 0.24, 0.22, [0.36, 0.42, 0.3]],
    [2.4, 0.68, 0.22, 0.24, 0.18, 0.2, [0.56, 0.45, 0.3]],
    [3.0, 0.62, 0.24, 0.3, 0.16, 0.22, [0.58, 0.56, 0.5]],
    [3.3, 0.5, 0.28, 0.22, 0.2, 0.18, [0.42, 0.32, 0.24]],
  ];
  for (const c of cartons) addBox("goods", c[3], c[4], c[5], c[0], c[1], c[2], c[6]);

  const cloth = place(new THREE.PlaneGeometry(1.55, 1.95, 14, 8), 2.7, 1.42, -0.1, 0, Math.PI, 0);
  const cp = cloth.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const u = cp.getX(i);
    const v = cp.getY(i);
    cp.setZ(i, cp.getZ(i) + Math.sin((u - 2.7) * 15) * 0.04 * (1.1 - (v - 0.45) / 2) + 0.02 * Math.sin(v * 3));
  }
  cloth.computeVertexNormals();
  looseMesh(cloth, new THREE.MeshStandardMaterial({ map: clothTex(), roughness: 0.92, metalness: 0, side: THREE.DoubleSide }), "cloth");

  corrugated("awning", 1.85, W + 0.25, 2.6, 0.02, 2.3, -0.8, 0.03);
  addBox("timber", W - 1.6, 0.05, 0.05, (1.85 + W + 0.25) / 2, 2.27, -0.8, [0.5, 0.44, 0.36]);
  addBox("blue", 1.95, 0.04, 0.6, 0.95, 2.5, -0.28, [0.82, 0.86, 0.88], 0.32, 0, 0);
  addBox("blue", 1.95, 0.16, 0.04, 0.95, 2.36, -0.57, [0.72, 0.76, 0.78]);
  addBox("wood", W, 0.1, 0.12, W / 2, 2.56, -0.04, [0.6, 0.55, 0.48]);
  addBox("wood", 0.3, 0.32, 0.18, 1.98, 2.75, -0.08, [0.7, 0.64, 0.56]);

  const poster = place(new THREE.PlaneGeometry(1.5, 2.8), 3.05, 4.1, -1.2, -0.05, Math.PI - 0.3, -0.03);
  looseMesh(poster, new THREE.MeshStandardMaterial({ map: posterTex(), roughness: 0.75, metalness: 0, side: THREE.DoubleSide }), "poster");
  addBox("timber", 0.04, 0.04, 1.2, 3.1, 5.2, -0.62, [0.4, 0.34, 0.28]);
  addBox("timber", 0.04, 0.04, 1.0, 2.5, 3.0, -0.55, [0.4, 0.34, 0.28]);

  // Shoring poles: four rough round timbers from the lane to the carved band.
  function pole(x0, y0, z0, x1, y1, z1, r) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const dz = z1 - z0;
    const len = Math.hypot(dx, dy, dz);
    const g = new THREE.CylinderGeometry(r * 0.85, r, len, 7, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize());
    g.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), q, new THREE.Vector3(1, 1, 1)));
    add("timber", g, [0.72, 0.64, 0.54]);
  }
  pole(6.0, 0.0, -1.9, 5.75, 4.6, -0.42, 0.06);
  pole(3.4, 0.0, -2.2, 3.55, 5.0, -0.4, 0.065);
  pole(2.3, 0.0, -1.9, 2.15, 3.1, -0.36, 0.055);
  pole(1.35, 0.0, -1.5, 1.5, 2.55, -0.55, 0.05);

  function wire(pts, rad, tint) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, 22, rad, 5, false);
    add("wire", g, tint || [0.85, 0.82, 0.78]);
  }
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  wire([V(-0.4, 6.1, -0.3), V(1.2, 5.75, -0.6), V(3.2, 5.55, -0.75), V(5.0, 5.8, -0.6), V(6.6, 6.05, -0.4)], 0.016, [0.7, 0.68, 0.66]);
  wire([V(-0.4, 6.0, -0.25), V(1.5, 5.6, -0.5), V(3.4, 5.45, -0.7), V(6.6, 5.95, -0.42)], 0.004);
  wire([V(-0.4, 5.9, -0.35), V(1.8, 5.35, -0.65), V(4.0, 5.3, -0.9), V(6.6, 5.7, -0.5)], 0.003, [1.6, 1.5, 1.4]);
  wire([V(0.05, 6.2, -0.1), V(0.9, 5.7, -0.28), V(1.9, 5.48, -0.42), V(2.6, 5.6, -0.5)], 0.0035);
  wire([V(-0.3, 5.1, -0.2), V(1.0, 4.95, -0.35), V(1.62, 5.02, -0.3)], 0.003);
  wire([V(1.2, 5.75, -0.6), V(1.18, 5.2, -0.55), V(1.25, 4.9, -0.32)], 0.003);
  wire([V(3.2, 5.55, -0.75), V(3.28, 4.95, -0.8), V(3.36, 4.6, -0.6)], 0.003);

  function wheel(x, z) {
    add("dark", place(new THREE.TorusGeometry(0.28, 0.018, 6, 14), x, 0.32, z), [0.35, 0.35, 0.35]);
  }
  wheel(5.15, -0.95);
  wheel(5.75, -1.05);
  addBox("timber", 0.62, 0.04, 0.04, 5.45, 0.48, -1.0, [0.4, 0.32, 0.24]);
  addBox("timber", 0.04, 0.28, 0.04, 5.2, 0.5, -0.95, [0.4, 0.32, 0.24], 0, 0, 0.4);
  addBox("dark", 0.22, 0.04, 0.12, 5.35, 0.62, -0.98, [0.25, 0.22, 0.2]);

  addBox("dark", 0.42, 0.025, 0.28, 3.55, 0.28, -0.72, [0.4, 0.4, 0.42]);
  addBox("dark", 0.38, 0.025, 0.24, 3.55, 0.48, -0.7, [0.4, 0.4, 0.42]);
  addBox("dark", 0.34, 0.025, 0.2, 3.55, 0.66, -0.68, [0.4, 0.4, 0.42]);
  addBox("dark", 0.02, 0.64, 0.02, 3.38, 0.34, -0.8, [0.45, 0.45, 0.48]);
  addBox("dark", 0.02, 0.64, 0.02, 3.72, 0.34, -0.58, [0.45, 0.45, 0.48]);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = true;
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
  return root;
}
