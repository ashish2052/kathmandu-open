// House 017. Asan, southwest lane, OSM way 203433636, edge 2, 7.24 m.
// Spec: research/houses200/017/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// After the place.js yaw-180, x = 0 is photo-right (north, the bay window).
// x = 7.24 is photo-left (south, the green awning). The still is pano
// ZnuwuErTQyoHzFeMtKqESg, yaw 325, pitch -12. Copy that frame.
// Ground floor is the spice shop (वीज भण्डार). The red board reads
// नेपाल राष्ट्रिय दौरा सुरुवाल / एण्ड सूट हाउस. No phone number.
// The white board above the bay had no readable words. No people.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.24;
const D = 6.37;
const T = 0.22;
const ROOF = 9.45;

const TL = new THREE.TextureLoader();
const TEX = new Map();

function tex(file, srgb, rx, ry) {
  const key = file + ":" + rx + ":" + ry;
  if (!TEX.has(key)) {
    const t = TL.load(new URL("../../assets/tex/" + file, import.meta.url).href);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    t.repeat.set(rx, ry);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    TEX.set(key, t);
  }
  return TEX.get(key);
}

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
  const r = rng(17017);
  c.fillStyle = "#3a2f2b";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#2a2a2a";
  e.fillRect(0, 0, w, h);
  const pal = [
    [118, 72, 60], [106, 64, 54], [128, 80, 66], [98, 60, 50],
    [114, 70, 58], [124, 76, 62], [92, 58, 48], [134, 84, 68],
  ];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw / 2;
    for (let k = -1; k < cols + 1; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.88 + r() * 0.2;
      c.fillStyle = "rgb(" + (p[0] * j | 0) + "," + (p[1] * j | 0) + "," + (p[2] * j | 0) + ")";
      const x = k * bw + off + 2;
      const y = row * bh + 2;
      c.fillRect(x, y, bw - 4, bh - 3);
      e.fillStyle = "rgb(" + (70 + r() * 40 | 0) + "," + (70 + r() * 30 | 0) + "," + (70 + r() * 20 | 0) + ")";
      e.fillRect(x, y, bw - 4, bh - 3);
      if (r() > 0.82) {
        c.fillStyle = "rgba(60,30,24,0.35)";
        c.fillRect(x + 4, y + 2, (bw - 8) * r(), 3 + r() * 6);
      }
    }
  }
  for (let i = 0; i < 18; i++) {
    c.fillStyle = "rgba(90,50,40,0.45)";
    c.beginPath();
    c.arc(r() * w, r() * h, 2 + r() * 4, 0, 6.3);
    c.fill();
  }
  const diff = toTex(col, true, true);
  const norC = canvas(w, h);
  const ng = norC.getContext("2d");
  const src = e.getImageData(0, 0, w, h).data;
  const img = ng.createImageData(w, h);
  const H = (x, y) => src[((((y + h) % h) * w) + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = -(H(x + 1, y) - H(x - 1, y)) * 2.2;
      const ny = (H(x, y + 1) - H(x, y - 1)) * 2.2;
      const l = Math.hypot(nx, ny, 1);
      const i = (y * w + x) * 4;
      img.data[i] = (nx / l * 0.5 + 0.5) * 255;
      img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
      img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
      img.data[i + 3] = 255;
    }
  }
  ng.putImageData(img, 0, 0);
  const nor = toTex(norC, false, true);
  return { diff, nor };
}

function grimeTex() {
  const c = canvas(512, 512);
  const g = c.getContext("2d");
  const r = rng(1702);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(70,55,48,0.55)";
  g.fillRect(0, 470, 512, 42);
  for (let i = 0; i < 40; i++) {
    const x = r() * 512;
    g.strokeStyle = "rgba(80,60,50," + (0.15 + r() * 0.35) + ")";
    g.lineWidth = 1 + r() * 2;
    g.beginPath();
    g.moveTo(x, 40 + r() * 200);
    g.lineTo(x + (r() - 0.5) * 18, 500);
    g.stroke();
  }
  g.fillStyle = "rgba(40,30,26,0.28)";
  g.fillRect(0, 145, 512, 18);
  const t = toTex(c, false, true);
  return t;
}

function signTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#a01820";
    g.fillRect(0, 0, w, h);
    const dirt = g.createLinearGradient(0, 0, 0, h);
    dirt.addColorStop(0, "rgba(40,20,16,0)");
    dirt.addColorStop(1, "rgba(40,20,16,0.28)");
    g.fillStyle = dirt;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#f2e6c8";
    g.lineWidth = 10;
    g.strokeRect(8, 8, w - 16, h - 16);
    const suit = (x, y, k) => {
      g.fillStyle = "#f4efe4";
      g.fillRect(x, y, 150 * k, 200 * k);
      g.fillStyle = "#1f3a6e";
      g.beginPath();
      g.moveTo(x + 18 * k, y + 200 * k);
      g.lineTo(x + 30 * k, y + 120 * k);
      g.lineTo(x + 120 * k, y + 120 * k);
      g.lineTo(x + 132 * k, y + 200 * k);
      g.fill();
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(x + 60 * k, y + 120 * k);
      g.lineTo(x + 90 * k, y + 120 * k);
      g.lineTo(x + 75 * k, y + 175 * k);
      g.fill();
      g.fillStyle = "#7a1a1e";
      g.fillRect(x + 71 * k, y + 124 * k, 8 * k, 40 * k);
      g.fillStyle = "#c99a7c";
      g.fillRect(x + 64 * k, y + 104 * k, 22 * k, 18 * k);
      g.beginPath();
      g.ellipse(x + 75 * k, y + 78 * k, 24 * k, 30 * k, 0, 0, 6.3);
      g.fill();
      g.fillStyle = "#1a1412";
      g.beginPath();
      g.ellipse(x + 75 * k, y + 56 * k, 25 * k, 14 * k, 0, 0, 6.3);
      g.fill();
    };
    suit(28, 36, 1);
    suit(w - 168, 78, 0.8);
    g.fillStyle = "#fffaf2";
    g.font = "bold 58px 'Nirmala UI', sans-serif";
    g.textAlign = "center";
    g.fillText("नेपाल राष्ट्रिय दौरा सुरुवाल", w / 2 + 10, 118);
    g.font = "bold 64px 'Nirmala UI', sans-serif";
    g.fillText("एण्ड सूट हाउस", w / 2 + 10, 196);
    g.fillStyle = "#e2b84a";
    g.fillRect(250, 210, w - 500, 4);
    g.fillStyle = "#f0d48a";
    g.font = "28px 'Nirmala UI', sans-serif";
    g.fillText("सटिङ्ग तथा ढाका सम्बन्धि सम्पूर्ण सामानहरुको थोक तथा खुद्रा", w / 2 + 10, 248);
  }, 1280, 320);
}

const SPICE_RGB = [
  [150, 80, 40], [170, 52, 34], [196, 140, 52], [120, 70, 36],
  [96, 52, 30], [210, 160, 60], [130, 64, 40], [88, 92, 46], [60, 40, 30],
];

// One clear sachet: pinched top, powder showing grey through the plastic, small label. Words only where the photo shows them.
function bag(g, x, y, w, h, r, label) {
  const c = SPICE_RGB[Math.floor(r() * SPICE_RGB.length)];
  const k = 0.62 + r() * 0.2;
  const grey = (v) => (v * k * 0.62 + 150 * 0.38) | 0;
  const pinch = w * (0.06 + r() * 0.05);
  const bulge = w * (0.02 + r() * 0.04);
  const shape = () => {
    g.beginPath();
    g.moveTo(x + pinch, y);
    g.lineTo(x + w - pinch, y);
    g.quadraticCurveTo(x + w + bulge, y + h * 0.5, x + w - pinch * 0.4, y + h);
    g.lineTo(x + pinch * 0.4, y + h);
    g.quadraticCurveTo(x - bulge, y + h * 0.5, x + pinch, y);
    g.closePath();
  };
  g.save();
  shape();
  g.fillStyle = "rgb(" + grey(c[0]) + "," + grey(c[1]) + "," + grey(c[2]) + ")";
  g.fill();
  g.clip();
  const top = y + h * (0.1 + r() * 0.14);
  const air = g.createLinearGradient(0, y, 0, top + h * 0.08);
  air.addColorStop(0, "rgba(200,198,192,0.95)");
  air.addColorStop(1, "rgba(200,198,192,0)");
  g.fillStyle = air;
  g.fillRect(x - bulge, y, w + bulge * 2, top - y + h * 0.08);
  for (let i = 0; i < 5; i++) {
    g.fillStyle = "rgba(" + (r() > 0.5 ? "235,232,226," : "40,30,24,") + (0.08 + r() * 0.14) + ")";
    g.fillRect(x + r() * w, y + r() * h, w * (0.05 + r() * 0.12), h * (0.2 + r() * 0.5));
  }
  const shade = g.createLinearGradient(x, 0, x + w, 0);
  shade.addColorStop(0, "rgba(20,14,10,0.28)");
  shade.addColorStop(0.35, "rgba(20,14,10,0)");
  shade.addColorStop(0.8, "rgba(20,14,10,0)");
  shade.addColorStop(1, "rgba(20,14,10,0.32)");
  g.fillStyle = shade;
  g.fillRect(x - bulge, y, w + bulge * 2, h);
  g.fillStyle = "rgba(225,222,214,0.9)";
  g.fillRect(x, y, w, h * 0.06);
  g.fillStyle = "#6a6660";
  g.fillRect(x + w / 2 - w * 0.05, y + h * 0.015, w * 0.1, h * 0.025);
  const lw = w * (label ? 0.72 : 0.42 + r() * 0.2);
  const lh = h * (label ? 0.26 : 0.1 + r() * 0.05);
  const lx = x + (w - lw) / 2 + (r() - 0.5) * w * 0.1;
  const ly = y + h * (0.42 + r() * 0.2);
  g.fillStyle = label ? "#ebe6da" : "rgba(226,220,206,0.88)";
  g.fillRect(lx, ly, lw, lh);
  g.fillStyle = "#2a2018";
  if (label) {
    g.font = "bold " + Math.round(lh * 0.32) + "px sans-serif";
    g.textAlign = "center";
    label.split("\n").forEach((line, i) => g.fillText(line, x + w / 2, ly + lh * (0.42 + i * 0.38)));
  } else {
    g.fillStyle = "rgba(60,40,30,0.7)";
    g.fillRect(lx + lw * 0.15, ly + lh * 0.35, lw * (0.4 + r() * 0.4), lh * 0.18);
  }
  g.strokeStyle = "rgba(255,255,255," + (0.35 + r() * 0.3) + ")";
  g.lineWidth = Math.max(1, w * 0.04);
  g.beginPath();
  const hx = x + w * (0.12 + r() * 0.15);
  g.moveTo(hx, y + h * 0.1);
  g.quadraticCurveTo(hx + w * 0.1, y + h * 0.5, hx + w * (0.05 + r() * 0.2), y + h * 0.92);
  g.stroke();
  g.restore();
  shape();
  g.strokeStyle = "rgba(70,62,54,0.55)";
  g.lineWidth = 1;
  g.stroke();
}

// Hanging column of stapled sachets on a string, cut out with alpha.
function stripTex(seed) {
  return canvasTex((g, w, h) => {
    const r = rng(seed);
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#3a332c";
    g.fillRect(w / 2 - 2, 0, 4, h);
    const n = 9;
    const bh = h / n;
    for (let i = 0; i < n; i++) {
      g.save();
      g.translate(w / 2, i * bh + 4);
      g.rotate((r() - 0.5) * 0.12);
      bag(g, -w / 2 + 4 + (r() - 0.5) * 6, 0, w - 8, bh * 1.08, r);
      g.restore();
    }
  }, 128, 768);
}

// The big bag board on the south pier. CINNAMON POWDER and MASALA TEA are the only words.
function boardTex() {
  return canvasTex((g, w, h) => {
    const r = rng(1717);
    g.fillStyle = "#3b2f27";
    g.fillRect(0, 0, w, h);
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 3; col++) {
        const label = row === 5 && col === 0 ? "CINNAMON\nPOWDER" : row === 1 && col === 2 ? "MASALA\nTEA" : null;
        bag(g, 8 + col * 168 + (r() - 0.5) * 8, 8 + row * 168 + (r() - 0.5) * 6, 160, 164, r, label);
      }
    }
  }, 512, 1024);
}

// Tray of flat packets seen from above.
function trayTex() {
  return canvasTex((g, w, h) => {
    const r = rng(1771);
    g.fillStyle = "#857d70";
    g.fillRect(0, 0, w, h);
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 8; col++) bag(g, 6 + col * 63, 6 + row * 62, 56, 56, r);
    }
  }, 512, 256);
}

// Dim shelves at the back of the shop: jars and packet rows.
function shelfTex() {
  return canvasTex((g, w, h) => {
    const r = rng(1777);
    g.fillStyle = "#1e1813";
    g.fillRect(0, 0, w, h);
    for (let s = 0; s < 4; s++) {
      const y = 8 + s * 62;
      g.fillStyle = "#4a3828";
      g.fillRect(0, y + 52, w, 6);
      for (let x = 4; x < w - 20;) {
        const c = SPICE_RGB[Math.floor(r() * SPICE_RGB.length)];
        const bw = 14 + r() * 22;
        const bh = 24 + r() * 26;
        const k = 0.45 + r() * 0.3;
        g.fillStyle = "rgb(" + (c[0] * k | 0) + "," + (c[1] * k | 0) + "," + (c[2] * k | 0) + ")";
        g.fillRect(x, y + 52 - bh, bw, bh);
        g.fillStyle = "rgba(220,214,200," + (0.25 + r() * 0.3) + ")";
        g.fillRect(x + 2, y + 52 - bh * 0.6, bw - 4, bh * 0.2);
        x += bw + 2 + r() * 4;
      }
    }
  }, 512, 256);
}

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    let u;
    let v;
    if (az >= ax && az >= ay) {
      u = p.getX(i) / 2.4;
      v = p.getY(i) / 1.2;
    } else if (ax >= ay) {
      u = p.getZ(i) / 2.4;
      v = p.getY(i) / 1.2;
    } else {
      u = p.getX(i) / 2.4;
      v = p.getZ(i) / 1.2;
    }
    uv.setXY(i, u, v);
  }
  return g;
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const k = 0.92 + 0.08 * hash(p.getX(i) * 1.7, p.getY(i) * 1.3, p.getZ(i) * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  float shop = step(0.02, p.z) * (1.0 - step(1.6, p.z)) * step(p.y, 2.7) * step(2.4, p.x) * (1.0 - step(6.3, p.x));
  ao *= 1.0 - 0.55 * shop;
  ao *= 1.0 - 0.45 * smoothstep(0.55, 0.0, p.y);
  float beam = smoothstep(0.35, 0.0, abs(p.y - 2.62)) * step(p.z, 0.2);
  ao *= 1.0 - 0.28 * beam;
  return ao;
}
float houseShade(vec3 p) {
  float under = step(p.y, 2.62) * step(2.5, p.x) * step(p.z, 0.4);
  float fade = smoothstep(0.0, 1.4, 2.62 - p.y);
  return 1.0 - under * (0.6 - 0.2 * fade);
}
`;

const GRIME_GLSL = `
float gax = abs(vHouseN.x);
float gay = abs(vHouseN.y);
float gaz = abs(vHouseN.z);
float gu = (gax > gaz && gax > gay) ? clamp(vHousePos.z / 6.4, 0.0, 1.0) : clamp(vHousePos.x / 7.3, 0.0, 1.0);
float gv = clamp(vHousePos.y / 9.45, 0.0, 1.0);
vec3 grit = texture2D(grimeMap, vec2(gu, gv)).rgb;
diffuseColor.rgb *= mix(vec3(1.0), grit, 0.55);
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= (0.78 + 0.22 * hao);
reflectedLight.directSpecular *= 0.35 * hao;
reflectedLight.indirectDiffuse *= 1.2 * hao;
reflectedLight.indirectSpecular *= hao;
float hsh = houseShade(vHousePos);
reflectedLight.directDiffuse *= hsh;
reflectedLight.indirectDiffuse *= hsh;
`;

function houseShader(mat, key, grime) {
  mat.onBeforeCompile = (shader) => {
    if (grime) shader.uniforms.grimeMap = { value: grime };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace(
      "#include <common>",
      "#include <common>\n" + (grime ? "uniform sampler2D grimeMap;\n" : "") + AO_GLSL,
    );
    if (grime) frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\n" + GRIME_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house017-" + key; };
  return mat;
}

export function createHouse017() {
  const root = new THREE.Group();
  root.name = "house-017";

  const groundHoles = [
    { x: 1.85, y: 1.22, w: 0.92, h: 2.2 },
    { x: 4.55, y: 1.32, w: 3.35, h: 2.4 },
  ];
  const midHoles = [
    { x: 4.35, y: 4.9, w: 3.7, h: 1.85 },
    { x: 0.72, y: 5.15, w: 1.05, h: 1.55 },
  ];
  const topHoles = [
    { x: 5.15, y: 7.45, w: 1.15, h: 1.15 },
    { x: 3.15, y: 7.4, w: 0.72, h: 1.05 },
    { x: 0.72, y: 7.55, w: 0.78, h: 1.05 },
  ];

  const brickMaps = brickSet();
  const grit = grimeTex();
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.4, 0.35),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.4, 0.35),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.4, 0.35),
  };
  const mats = {
    brick: new THREE.MeshStandardMaterial({
      map: brickMaps.diff, normalMap: brickMaps.nor, color: 0xbcaea9,
      roughness: 0.92, metalness: 0, vertexColors: true, normalScale: new THREE.Vector2(0.8, 0.8),
    }),
    wood: new THREE.MeshStandardMaterial({
      map: woodMaps.diff, normalMap: woodMaps.nor, roughnessMap: woodMaps.arm, aoMap: woodMaps.arm,
      color: 0x8a6848, roughness: 1, metalness: 0, aoMapIntensity: 0.32, vertexColors: true,
    }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110f, roughness: 0.94, metalness: 0, vertexColors: true }),
    green: new THREE.MeshStandardMaterial({
      color: 0x86f2cc, emissive: 0x2e9a72, roughness: 0.45, metalness: 0, vertexColors: true, side: THREE.DoubleSide,
    }),
    lamp: new THREE.MeshBasicMaterial({ color: 0xfff1d0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x6a7c80, roughness: 0.18, metalness: 0.04, transparent: true, opacity: 0.2, vertexColors: true,
    }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.6, metalness: 0.1, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, vertexColors: true }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x8a8178, roughness: 0.95, metalness: 0, vertexColors: true }),
  };
  houseShader(mats.brick, "brick", grit);
  houseShader(mats.wood, "wood", null);
  houseShader(mats.goods, "goods", null);
  houseShader(mats.dark, "dark", null);
  houseShader(mats.concrete, "concrete", null);

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx, ry, rz);
    if (name === "brick") worldUV(g);
    add(name, g, tint);
  }
  function wall(x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox("brick", part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }
  function frame(x, y, w, h, z, deep, tint) {
    const t = 0.06;
    const k = tint || [0.5, 0.38, 0.28];
    addBox("wood", w + t, t, deep, x, y + h / 2, z, [k[0] * 1.1, k[1] * 1.1, k[2] * 1.1]);
    addBox("wood", w + t, t, deep, x, y - h / 2, z, [k[0] * 0.9, k[1] * 0.9, k[2] * 0.9]);
    addBox("wood", t, h, deep, x - w / 2, y, z, k);
    addBox("wood", t, h, deep, x + w / 2, y, z, k);
  }
  // Flat textured cards (sachets, trays, shelves), merged per texture.
  const cards = new Map();
  function card(t, w, h, x, y, z, flat) {
    const g = new THREE.PlaneGeometry(w, h);
    if (flat) g.rotateX(-Math.PI / 2);
    else g.rotateY(Math.PI);
    g.translate(x, y, z);
    (cards.get(t) || cards.set(t, []).get(t)).push(g);
  }
  function looseMesh(g, mat, name) {
    const mesh = new THREE.Mesh(g, mat);
    mesh.name = name;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
  }

  wall(0, W, 0, 2.72, 0, groundHoles);
  wall(0, W, 2.72, 6.15, 0, midHoles);
  wall(0, W, 6.15, 8.55, 0, topHoles);
  wall(0, W, 8.55, ROOF, 0, []);
  wall(0, W, 0, ROOF, D - T, []);
  addBox("brick", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("brick", T, ROOF, D, W - T / 2, ROOF / 2, D / 2);
  addBox("concrete", W, 0.16, D, W / 2, ROOF + 0.08, D / 2, [0.72, 0.68, 0.64]);

  addBox("brick", W + 0.12, 0.16, 0.34, W / 2, 8.62, -0.08);
  for (let i = 0; i < 28; i++) {
    addBox("brick", 0.1, 0.08, 0.12, 0.2 + i * 0.25, 8.78, -0.16);
  }
  addBox("brick", W, 0.22, 0.28, W / 2, 8.95, -0.02);

  addBox("wood", 3.5, 0.2, 0.24, 4.55, 2.58, -0.08, [0.36, 0.26, 0.19]);
  addBox("wood", 1.05, 0.1, 0.12, 1.85, 2.38, -0.04, [0.5, 0.36, 0.24]);

  frame(4.35, 4.9, 3.7, 1.85, -0.02, 0.1, [0.78, 0.36, 0.16]);
  frame(5.15, 7.45, 1.15, 1.15, -0.02, 0.07, [0.14, 0.12, 0.11]);
  frame(3.15, 7.4, 0.72, 1.05, -0.02, 0.07, [0.14, 0.12, 0.11]);
  frame(1.85, 1.22, 0.92, 2.2, -0.02, 0.07);
  addBox("glass", 3.55, 1.7, 0.02, 4.35, 4.95, 0.06);
  addBox("glass", 1.05, 1.05, 0.02, 5.15, 7.45, 0.05);
  addBox("glass", 0.62, 0.95, 0.02, 3.15, 7.4, 0.05);
  addBox("dark", 0.8, 2.05, 0.08, 1.85, 1.15, 0.2, [0.15, 0.12, 0.1]);

  const bayX = 0.72;
  addBox("brick", 1.35, 2.35, 0.42, bayX, 5.15, -0.22);
  addBox("brick", 1.5, 0.12, 0.55, bayX, 6.28, -0.28);
  addBox("brick", 1.22, 0.1, 0.48, bayX, 3.95, -0.24);
  for (let k = 0; k < 4; k++) {
    addBox("brick", 0.28 + k * 0.04, 0.08, 0.16 + k * 0.03, 1.28, 6.05 + k * 0.08, -0.08);
  }
  frame(bayX, 5.15, 1.05, 1.45, -0.42, 0.08, [0.12, 0.11, 0.1]);
  addBox("glass", 0.95, 1.3, 0.02, bayX, 5.15, -0.4);
  addBox("wood", 0.05, 1.4, 0.46, bayX + 0.58, 5.15, -0.55, [0.14, 0.12, 0.11], 0, -0.7, 0);
  // Black iron cage hung under the bay.
  for (const [cx, cz] of [[0.12, -0.3], [1.32, -0.3], [0.12, -0.75], [1.32, -0.75]]) addBox("wire", 0.025, 0.6, 0.025, cx, 3.6, cz);
  for (const yy of [3.32, 3.9]) {
    addBox("wire", 1.22, 0.025, 0.025, bayX, yy, -0.75);
    addBox("wire", 0.025, 0.025, 0.45, 0.12, yy, -0.52);
    addBox("wire", 0.025, 0.025, 0.45, 1.32, yy, -0.52);
  }
  for (let k = 1; k < 6; k++) addBox("wire", 0.015, 0.58, 0.015, 0.12 + k * 0.2, 3.61, -0.75);
  addBox("glass", 0.7, 0.95, 0.02, 0.72, 7.55, 0.05);
  frame(0.72, 7.55, 0.78, 1.05, -0.02, 0.07, [0.14, 0.12, 0.11]);

  const awn = new THREE.BoxGeometry(1.55, 0.02, 0.85, 48, 1, 6);
  const ap = awn.attributes.position;
  for (let i = 0; i < ap.count; i++) {
    const z = ap.getZ(i);
    ap.setY(i, ap.getY(i) + Math.sin((ap.getX(i) + 0.8) * 40) * 0.018 + (z + 0.4) * -0.18 - z * z * 0.08);
  }
  awn.computeVertexNormals();
  place(awn, 6.45, 2.85, -0.35);
  add("green", awn, [1, 1, 1]);
  addBox("wood", 0.04, 1.15, 0.04, 5.85, 2.15, -0.55, [0.45, 0.32, 0.22]);
  addBox("wood", 0.04, 1.05, 0.04, 7.05, 2.2, -0.5, [0.45, 0.32, 0.22]);

  // Spice shop: sachet columns on strings at the front, dim shelves behind, trays on a tiled plinth.
  const strips = [stripTex(171), stripTex(172), stripTex(173)];
  const shelves = shelfTex();
  const trays = trayTex();
  [[3.05, -0.05, 2.1], [3.45, -0.08, 2.15], [4.15, -0.06, 2.2], [4.55, -0.09, 2.0], [5.05, -0.05, 2.15], [5.45, -0.08, 1.9]]
    .forEach(([x, z, h], i) => card(strips[i % 3], 0.36, h, x, 2.42 - h / 2, z));
  [[3.25, -0.12, 2.0], [3.8, -0.1, 2.12], [4.35, -0.13, 1.95], [4.8, -0.11, 2.1], [5.25, -0.13, 2.05]]
    .forEach(([x, z, h], i) => card(strips[(i + 2) % 3], 0.4, h, x, 2.42 - h / 2, z));
  [[3.7, 0.7], [4.85, 0.75], [3.3, 1.2], [5.6, 1.1]].forEach(([x, z], i) => card(strips[(i + 1) % 3], 0.36, 1.9, x, 1.4, z));
  addBox("dark", 3.3, 2.4, 0.06, 4.55, 1.25, 1.62, [0.5, 0.45, 0.4]);
  card(shelves, 3.2, 1.6, 4.55, 1.2, 1.58);
  card(shelves, 1.4, 1.6, 3.0, 1.2, 1.0);
  addBox("dark", 3.3, 0.02, 1.6, 4.55, 0.01, 0.8, [0.45, 0.4, 0.36]);
  addBox("wood", 0.78, 1.95, 0.03, 6.19, 1.28, -0.02, [0.4, 0.3, 0.22]);
  card(boardTex(), 0.74, 1.48, 6.19, 1.5, -0.045);
  addBox("concrete", 3.6, 0.42, 0.7, 4.5, 0.21, -0.36, [0.52, 0.36, 0.32]);
  for (let i = 0; i < 3; i++) {
    const x = 3.25 + i * 1.2;
    addBox("goods", 1.1, 0.14, 0.6, x, 0.49, -0.36, [0.26, 0.2, 0.15]);
    card(trays, 1.04, 0.54, x, 0.565, -0.36, true);
  }
  addBox("goods", 0.08, 0.08, 0.08, 4.4, 2.35, 0.35, [1.2, 1.05, 0.7]);
  addBox("lamp", 0.07, 0.1, 0.07, 4.4, 2.3, 0.35);
  addBox("lamp", 0.18, 0.18, 0.04, 5.6, 2.36, 0.05);

  function figure(x, y, suit) {
    addBox("cloth", 0.34, 0.5, 0.18, x, y + 0.55, 0.42, suit);
    addBox("cloth", 0.1, 0.22, 0.02, x, y + 0.66, 0.32, [0.92, 0.9, 0.86]);
    addBox("cloth", 0.03, 0.18, 0.025, x, y + 0.64, 0.31, [0.5, 0.12, 0.12]);
    addBox("cloth", 0.12, 0.16, 0.14, x, y + 0.92, 0.42, [0.5, 0.35, 0.25]);
    addBox("cloth", 0.09, 0.42, 0.09, x - 0.21, y + 0.5, 0.42, suit);
    addBox("cloth", 0.09, 0.42, 0.09, x + 0.21, y + 0.5, 0.42, suit);
    addBox("cloth", 0.3, 0.5, 0.16, x, y + 0.05, 0.42, suit);
  }
  figure(3.0, 4.2, [0.015, 0.025, 0.07]);
  figure(3.9, 4.15, [0.35, 0.28, 0.17]);
  figure(4.8, 4.2, [0.03, 0.03, 0.035]);
  figure(5.6, 4.25, [0.015, 0.025, 0.07]);
  addBox("dark", 3.6, 1.9, 0.05, 4.35, 4.9, 0.95, [0.35, 0.31, 0.27]);
  addBox("lamp", 3.2, 0.04, 0.12, 4.35, 5.75, 0.6, [0.6, 0.55, 0.45]);

  function sag(x0, y0, z0, x1, y1, z1, droop, thick, n) {
    for (let i = 0; i < n; i++) {
      const t0 = i / n;
      const t1 = (i + 1) / n;
      const ax = x0 + (x1 - x0) * t0;
      const ay = y0 + (y1 - y0) * t0 - Math.sin(Math.PI * t0) * droop;
      const az = z0 + (z1 - z0) * t0;
      const bx = x0 + (x1 - x0) * t1;
      const by = y0 + (y1 - y0) * t1 - Math.sin(Math.PI * t1) * droop;
      const bz = z0 + (z1 - z0) * t1;
      const dx = bx - ax;
      const dy = by - ay;
      const dz = bz - az;
      const len = Math.hypot(dx, dy, dz);
      addBox("wire", thick, len, thick, (ax + bx) / 2, (ay + by) / 2, (az + bz) / 2, [0.7, 0.68, 0.66], 0, 0, Math.atan2(-dx, dy));
    }
  }
  sag(0.15, 6.45, -0.24, 6.9, 6.2, -0.3, 0.42, 0.02, 16);
  sag(0.15, 6.4, -0.3, 6.9, 6.25, -0.34, 0.55, 0.014, 16);
  sag(0.4, 7.95, -0.16, 6.6, 7.6, -0.2, 0.3, 0.016, 14);
  sag(0.3, 4.4, -0.5, 6.4, 4.3, -0.3, 0.12, 0.014, 14);
  for (let k = 0; k < 5; k++) sag(0.2 + k * 0.12, 6.35, -0.45 - k * 0.03, 1.45 + k * 0.05, 3.05 + k * 0.1, -0.6, 0.2 + k * 0.05, 0.012, 10);
  sag(5.8, 2.75, -0.25, 7.05, 4.6, -0.12, 0.16, 0.014, 8);

  addBox("concrete", 0.7, 0.55, 0.7, 3.2, ROOF + 0.4, 2.4, [0.6, 0.6, 0.58]);
  addBox("wire", 0.55, 0.04, 0.55, 5.1, ROOF + 0.55, 3.4, [0.75, 0.75, 0.78]);
  addBox("wire", 0.06, 0.35, 0.06, 5.1, ROOF + 0.35, 3.4);

  const sign = new THREE.BoxGeometry(4.85, 1.15, 0.04);
  sign.translate(4.05, 3.55, -0.08);
  looseMesh(sign, new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.55, metalness: 0 }), "sign");

  const board = new THREE.BoxGeometry(1.15, 0.42, 0.03);
  board.translate(0.7, 8.35, -0.1);
  looseMesh(board, new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.6 }), "white-board");
  addBox("green", 0.16, 0.22, 0.02, 0.28, 8.35, -0.12, [0.4, 0.85, 0.45]);

  const pale = new THREE.PlaneGeometry(0.32, 0.42);
  pale.translate(2.35, 1.7, -0.03);
  looseMesh(pale, new THREE.MeshStandardMaterial({ color: 0xe7e2d8, roughness: 0.75, side: THREE.DoubleSide }), "pale-board");

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass";
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const [t, list] of cards) {
    const mat = houseShader(new THREE.MeshStandardMaterial({
      map: t, roughness: 0.7, metalness: 0, alphaTest: 0.4, side: THREE.DoubleSide,
    }), "card", null);
    const mesh = new THREE.Mesh(mergeGeometries(list, false), mat);
    mesh.name = "card";
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
  root.userData.id = "017";
  return root;
}
