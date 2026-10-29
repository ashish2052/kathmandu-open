// Shiva Parvati Temple (Nava Jogini), Kathmandu Durbar Square.
// Footprint, collision and climbing: Grok (research/shivaparvati-skeleton.md). Final look: Opus, from the photos in
// research/shivaparvati-ref/ (research/shivaparvati-final.md).
// OSM way 185882281 is the outer plinth (about 15.8 x 10.96 m). The long south face carries the door, the carved
// windows and the two figures. Four brick steps (the lowest widest) and one hip roof, about 34 degrees.
// A 2021 seismic note puts the pinnacles near 15 m; wall thicknesses there are 0.46 m and 0.30 m.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { basis } from "./heroes.js";

export const SHIVA_ID = 185882281;

const PLINTH = [
  { i: 0, y: 0.4 },
  { i: 0.72, y: 0.8 },
  { i: 1.28, y: 1.2 },
  { i: 1.72, y: 1.6 },
];
const WALL_I = 2.08;
const WALL_T = 0.42;
const BRICK_TOP = 5.55;
const UPPER_TOP = 9.85;
const EAVE_I = 0.05;
const EAVE_Y = 8.55;
const RIDGE_Y = 12.15;
const PIN_H = 2.85;
const LIFT = 0.16;
const STAIR_W = 2.15;
const BRICK_TILE = 1.9;

function cells(s0, s1, y0, y1, holes) {
  const xs = [s0, s1];
  const ys = [y0, y1];
  for (const h of holes) {
    xs.push(h.s - h.w / 2, h.s + h.w / 2);
    ys.push(h.y - h.h / 2, h.y + h.h / 2);
  }
  const uniq = (arr, lo, hi) => [...new Set(arr.map((v) => +v.toFixed(4)))]
    .filter((v) => v >= lo - 1e-4 && v <= hi + 1e-4)
    .sort((a, b) => a - b);
  const X = uniq(xs, s0, s1);
  const Y = uniq(ys, y0, y1);
  const out = [];
  for (let i = 0; i < X.length - 1; i++) {
    for (let j = 0; j < Y.length - 1; j++) {
      const cx = (X[i] + X[i + 1]) / 2;
      const cy = (Y[j] + Y[j + 1]) / 2;
      const sw = X[i + 1] - X[i];
      const sh = Y[j + 1] - Y[j];
      if (sw < 0.02 || sh < 0.02) continue;
      if (holes.some((h) => Math.abs(cx - h.s) < h.w / 2 - 1e-3 && Math.abs(cy - h.y) < h.h / 2 - 1e-3)) continue;
      out.push({ s: cx, y: cy, w: sw, h: sh });
    }
  }
  return out;
}

// ---------- textures

const TL = new THREE.TextureLoader();
const TEX = new Map();
function tex(file, srgb) {
  if (!TEX.has(file)) {
    const t = TL.load(new URL("../assets/tex/" + file, import.meta.url).href);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    TEX.set(file, t);
  }
  return TEX.get(file);
}
function canvas(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  return c;
}
function canvasTex(w, h, draw, srgb = true) {
  const t = new THREE.CanvasTexture(canvas(w, h, draw));
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
// Seeded so every run carves and paints the same temple.
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Height field drawn on a canvas (bright = raised), blurred with wrap-around, turned into a tangent-space normal map.
// The blurred height doubles as the cavity map (aoMap), so deep cuts also go dark.
function relief(w, h, draw, strength = 2.6, blur = 1.6) {
  const src = canvas(w, h, (g) => {
    g.fillStyle = "#6e6e6e";
    g.fillRect(0, 0, w, h);
    draw(g, w, h);
  });
  const big = canvas(w * 3, h * 3, (g) => {
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) g.drawImage(src, i * w, j * h);
  });
  const hc = canvas(w, h, (g) => {
    g.filter = `blur(${blur}px)`;
    g.drawImage(big, -w, -h);
  });
  const H = hc.getContext("2d").getImageData(0, 0, w, h).data;
  const at = (x, y) => H[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  const nc = canvas(w, h, (g) => {
    const img = g.createImageData(w, h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const nx = -(at(x + 1, y) - at(x - 1, y)) * strength;
        const ny = (at(x, y + 1) - at(x, y - 1)) * strength;
        const l = Math.hypot(nx, ny, 1);
        const i = (y * w + x) * 4;
        img.data[i] = (nx / l * 0.5 + 0.5) * 255;
        img.data[i + 1] = (ny / l * 0.5 + 0.5) * 255;
        img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
  const mk = (c) => {
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 8;
    return t;
  };
  return { normal: mk(nc), height: mk(hc) };
}

function petal(g, x, y, len, wid, ang, fill) {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(wid, -len * 0.45, 0, -len);
  g.quadraticCurveTo(-wid, -len * 0.45, 0, 0);
  g.fillStyle = fill;
  g.fill();
  g.restore();
}
// Carved panel: raised frame, bead, eight-petal rosette, corner bosses (photo 05, upper storey).
function panelRelief() {
  return relief(256, 256, (g, w) => {
    g.fillStyle = "#4e4e4e";
    g.fillRect(0, 0, w, w);
    g.strokeStyle = "#b8b8b8";
    g.lineWidth = 22;
    g.strokeRect(0, 0, w, w);
    g.strokeStyle = "#969696";
    g.lineWidth = 5;
    g.strokeRect(22, 22, w - 44, w - 44);
    for (let a = 0; a < 8; a++) petal(g, 128, 128, 62, 26, (a * Math.PI) / 4, "#c4c4c4");
    for (let a = 0; a < 8; a++) petal(g, 128, 128, 40, 14, (a * Math.PI) / 4 + Math.PI / 8, "#a2a2a2");
    g.fillStyle = "#e6e6e6";
    g.beginPath();
    g.arc(128, 128, 15, 0, 7);
    g.fill();
    g.strokeStyle = "#a8a8a8";
    g.lineWidth = 5;
    g.beginPath();
    g.arc(128, 128, 82, 0, 7);
    g.stroke();
    for (const [x, y] of [[40, 40], [216, 40], [40, 216], [216, 216]]) {
      g.fillStyle = "#c8c8c8";
      g.beginPath();
      g.arc(x, y, 9, 0, 7);
      g.fill();
    }
  });
}
// Horizontal frieze: bead row, lotus petals, fillets.
function bandRelief() {
  return relief(512, 128, (g, w, h) => {
    g.fillStyle = "#5a5a5a";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#b0b0b0";
    g.fillRect(0, 0, w, 8);
    g.fillRect(0, h - 10, w, 10);
    for (let x = 8; x < w; x += 16) {
      g.fillStyle = "#d4d4d4";
      g.beginPath();
      g.arc(x, 18, 6, 0, 7);
      g.fill();
    }
    g.fillStyle = "#9a9a9a";
    g.fillRect(0, 28, w, 5);
    for (let x = 0; x < w; x += 32) {
      petal(g, x + 16, h - 14, 78, 15, 0, "#c8c8c8");
      petal(g, x, h - 14, 56, 9, 0, "#9c9c9c");
    }
  });
}
// Post faces: stacked niches, each with a small standing deity, between bead courses.
function postRelief() {
  return relief(128, 512, (g, w, h) => {
    g.fillStyle = "#555";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#b4b4b4";
    g.fillRect(0, 0, 12, h);
    g.fillRect(w - 12, 0, 12, h);
    for (let r = 0; r < 4; r++) {
      const y0 = r * 128;
      for (let x = 18; x < w - 12; x += 14) {
        g.fillStyle = "#cfcfcf";
        g.beginPath();
        g.arc(x, y0 + 8, 5, 0, 7);
        g.fill();
      }
      g.strokeStyle = "#a6a6a6";
      g.lineWidth = 6;
      g.beginPath();
      g.moveTo(26, y0 + 118);
      g.lineTo(26, y0 + 46);
      g.quadraticCurveTo(64, y0 + 6, 102, y0 + 46);
      g.lineTo(102, y0 + 118);
      g.stroke();
      g.fillStyle = "#d8d8d8";
      g.beginPath();
      g.arc(64, y0 + 44, 10, 0, 7);
      g.fill();
      g.beginPath();
      g.ellipse(64, y0 + 80, 15, 26, 0, 0, 7);
      g.fill();
      g.fillStyle = "#c0c0c0";
      g.beginPath();
      g.ellipse(64, y0 + 112, 24, 6, 0, 0, 7);
      g.fill();
      g.lineWidth = 6;
      g.strokeStyle = "#c8c8c8";
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.moveTo(64 + sx * 12, y0 + 64);
        g.quadraticCurveTo(64 + sx * 30, y0 + 80, 64 + sx * 22, y0 + 98);
        g.stroke();
      }
    }
  });
}
// Foliate scrolls for toranas, spandrels and the carved arches.
function scrollRelief() {
  const r = rng(7);
  return relief(256, 256, (g, w) => {
    g.fillStyle = "#4a4a4a";
    g.fillRect(0, 0, w, w);
    g.lineCap = "round";
    for (const [cx, cy, dir] of [[64, 64, 1], [192, 64, -1], [64, 192, -1], [192, 192, 1], [128, 128, 1], [0, 128, -1], [128, 0, -1]]) {
      g.strokeStyle = "#c2c2c2";
      g.lineWidth = 10;
      g.beginPath();
      for (let t = 0; t < 4 * Math.PI; t += 0.1) {
        const rr = 6 + t * 3.6;
        const x = cx + dir * Math.cos(t) * rr;
        const y = cy + Math.sin(t) * rr;
        if (t === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      for (let k = 0; k < 5; k++) petal(g, cx + (r() - 0.5) * 70, cy + (r() - 0.5) * 70, 26, 9, r() * 6.3, "#a8a8a8");
    }
  }, 2.8, 1.4);
}
// Pleated cloth for the valance.
function pleatRelief() {
  return relief(256, 64, (g, w, h) => {
    for (let x = 0; x < w; x++) {
      const v = 110 + 70 * Math.sin((x / 16) * Math.PI * 2);
      g.fillStyle = `rgb(${v},${v},${v})`;
      g.fillRect(x, 0, 1, h);
    }
  }, 1.4, 1.0);
}

// Valance: red pleats, a gold band and a scalloped gold-laced hem (photo 04).
function valanceTex() {
  return canvasTex(256, 128, (g) => {
    const wave = (x) => 96 + 10 * Math.abs(Math.cos((x / 32) * Math.PI));
    g.clearRect(0, 0, 256, 128);
    g.save();
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(256, 0);
    for (let x = 256; x >= 0; x -= 2) g.lineTo(x, wave(x));
    g.closePath();
    g.clip();
    for (let x = 0; x < 256; x += 2) {
      const k = 0.6 + 0.4 * Math.abs(Math.sin((x / 16) * Math.PI));
      g.fillStyle = `rgb(${(178 * k) | 0},${(18 * k) | 0},${(22 * k) | 0})`;
      g.fillRect(x, 0, 2, 128);
    }
    const r = rng(3);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = `rgba(40,10,6,${r() * 0.12})`;
      g.fillRect(r() * 256, r() * 110, 1 + r() * 4, 2 + r() * 10);
    }
    g.restore();
    g.fillStyle = "#c79a3a";
    g.fillRect(0, 2, 256, 9);
    g.fillStyle = "#e3bd5c";
    g.fillRect(0, 4, 256, 2);
    g.strokeStyle = "#e0b955";
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= 256; x += 2) (x ? g.lineTo : g.moveTo).call(g, x, wave(x) - 2);
    g.stroke();
  });
}
function goldMaps() {
  const r = rng(11);
  const map = canvasTex(128, 128, (g) => {
    g.fillStyle = "#d9a943";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 220; i++) {
      const dark = r() < 0.6;
      g.fillStyle = dark ? `rgba(92,62,22,${0.08 + r() * 0.22})` : `rgba(255,226,140,${r() * 0.25})`;
      g.beginPath();
      g.ellipse(r() * 128, r() * 128, 2 + r() * 9, 1 + r() * 4, r() * 3, 0, 7);
      g.fill();
    }
  });
  const rough = canvasTex(128, 128, (g) => {
    g.fillStyle = "rgb(80,80,80)";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) {
      const v = 40 + r() * 120;
      g.fillStyle = `rgba(${v},${v},${v},0.5)`;
      g.beginPath();
      g.arc(r() * 128, r() * 128, 2 + r() * 8, 0, 7);
      g.fill();
    }
  }, false);
  return { map, rough };
}

// Painted faces: the canvas wraps the head; u = 0.25 is the front (+Z), so the face is centred on x = 128.
function faceTex(shiva) {
  const r = rng(shiva ? 21 : 22);
  return canvasTex(512, 256, (g, w, h) => {
    const cx = 128;
    g.fillStyle = shiva ? "#ece7dc" : "#f0dbcd";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) {
      g.fillStyle = `rgba(110,80,60,${r() * 0.05})`;
      g.beginPath();
      g.arc(r() * w, r() * h, 2 + r() * 10, 0, 7);
      g.fill();
    }
    g.fillStyle = "#16100c";
    g.fillRect(0, 0, w, 52);
    g.fillRect(cx + 74, 0, w - (cx + 74), h * 0.7);
    g.fillRect(0, 0, cx - 74, h * 0.7);
    g.beginPath();
    g.moveTo(cx - 76, 50);
    g.quadraticCurveTo(cx, 76, cx + 76, 50);
    g.fill();
    g.fillStyle = "rgba(225,120,110,0.2)";
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.arc(cx + sx * 42, 138, 17, 0, 7);
      g.fill();
    }
    g.lineCap = "round";
    g.strokeStyle = "#120c09";
    g.lineWidth = shiva ? 5 : 3.5;
    for (const sx of [-1, 1]) {
      g.beginPath();
      g.moveTo(cx + sx * 11, 99);
      g.quadraticCurveTo(cx + sx * 30, 86, cx + sx * 52, 99);
      g.stroke();
    }
    for (const sx of [-1, 1]) {
      const ex = cx + sx * 29;
      const ey = 111;
      g.beginPath();
      g.moveTo(ex - 17, ey);
      g.quadraticCurveTo(ex, ey - 12, ex + 17, ey);
      g.quadraticCurveTo(ex, ey + 8, ex - 17, ey);
      g.fillStyle = "#faf8f2";
      g.fill();
      g.lineWidth = 2.6;
      g.strokeStyle = "#110b08";
      g.stroke();
      g.beginPath();
      g.moveTo(ex + sx * 16, ey - 1);
      g.lineTo(ex + sx * 25, ey - 5);
      g.stroke();
      g.fillStyle = "#1a120c";
      g.beginPath();
      g.arc(ex, ey - 1, 5.5, 0, 7);
      g.fill();
      g.fillStyle = "#fff";
      g.beginPath();
      g.arc(ex + 1.6, ey - 2.6, 1.6, 0, 7);
      g.fill();
    }
    g.strokeStyle = "rgba(120,78,58,0.55)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(cx - 2, 114);
    g.quadraticCurveTo(cx - 9, 136, cx - 7, 142);
    g.quadraticCurveTo(cx, 146, cx + 7, 142);
    g.stroke();
    g.fillStyle = shiva ? "#a5191a" : "#c0353a";
    g.beginPath();
    g.ellipse(cx, 161, 12, 4.5, 0, 0, 7);
    g.fill();
    g.strokeStyle = "rgba(60,10,10,0.7)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(cx - 12, 161);
    g.lineTo(cx + 12, 161);
    g.stroke();
    if (shiva) {
      g.fillStyle = "#0f0a08";
      for (const sx of [-1, 1]) {
        g.beginPath();
        g.moveTo(cx, 151);
        g.bezierCurveTo(cx + sx * 16, 147, cx + sx * 30, 158, cx + sx * 40, 150);
        g.bezierCurveTo(cx + sx * 46, 146, cx + sx * 44, 138, cx + sx * 38, 140);
        g.bezierCurveTo(cx + sx * 42, 146, cx + sx * 30, 152, cx + sx * 18, 154);
        g.quadraticCurveTo(cx + sx * 8, 156, cx, 155);
        g.fill();
      }
      g.beginPath();
      g.ellipse(cx, 80, 4, 10, 0, 0, 7);
      g.fillStyle = "#c4241f";
      g.fill();
      g.strokeStyle = "#140c08";
      g.lineWidth = 2;
      g.stroke();
      g.strokeStyle = "#b62a22";
      g.lineWidth = 2.5;
      for (const dy of [62, 67]) {
        g.beginPath();
        g.moveTo(cx - 26, dy);
        g.quadraticCurveTo(cx, dy - 4, cx + 26, dy);
        g.stroke();
      }
    } else {
      g.fillStyle = "#c11d22";
      g.beginPath();
      g.arc(cx, 90, 5, 0, 7);
      g.fill();
      g.fillRect(cx - 2, 30, 4, 34);
    }
  });
}
function clothTex(base, trim, dot, seed) {
  const r = rng(seed);
  return canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 3) {
      g.fillStyle = `rgba(0,0,0,${0.05 + 0.07 * Math.abs(Math.sin(x / 9 + r()))})`;
      g.fillRect(x, 0, 3, h);
    }
    for (let i = 0; i < 160; i++) {
      g.fillStyle = dot;
      g.beginPath();
      g.arc(r() * w, 40 + r() * (h - 60), 2 + r() * 2.5, 0, 7);
      g.fill();
    }
    for (const y of [26, 44]) {
      g.fillStyle = trim;
      g.fillRect(0, y, w, 9);
      g.fillStyle = "#c9a14a";
      g.fillRect(0, y + 10, w, 3);
    }
  });
}
function crownTex() {
  const r = rng(5);
  return canvasTex(256, 128, (g, w, h) => {
    g.fillStyle = "#c99a3c";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 400; i++) {
      g.fillStyle = `rgba(90,58,20,${r() * 0.25})`;
      g.fillRect(r() * w, r() * h, 2, 2);
    }
    for (const [y, cols] of [[20, ["#b3161c", "#1e7a3c"]], [52, ["#2a54a8", "#b3161c"]], [86, ["#1e7a3c", "#e8e2d0"]]]) {
      for (let x = 8; x < w; x += 16) {
        g.fillStyle = cols[((x / 16) | 0) % 2];
        g.beginPath();
        g.arc(x, h - y, 5, 0, 7);
        g.fill();
        g.strokeStyle = "#f1d27a";
        g.lineWidth = 1.5;
        g.stroke();
      }
    }
  });
}

// ---------- weathering shader

const GLSL_NOISE = `
varying vec3 vSpL;
float spHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float spNoise(vec3 x) {
  vec3 i = floor(x); vec3 f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(spHash(i), spHash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(spHash(i + vec3(0.0, 1.0, 0.0)), spHash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
             mix(mix(spHash(i + vec3(0.0, 0.0, 1.0)), spHash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(spHash(i + vec3(0.0, 1.0, 1.0)), spHash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y), f.z);
}
float spFbm(vec3 p) { return 0.5 * spNoise(p) + 0.3 * spNoise(p * 2.03 + 7.1) + 0.2 * spNoise(p * 4.07 + 3.3); }
`;
// 0 brick, 1 stone, 2 wood, 3 roof tile, 4 carved wood, 5 sculpted stone, 6 occlusion only
const TINT = [
  `{
    float n = spFbm(vSpL * vec3(1.3, 1.1, 1.3));
    diffuseColor.rgb *= mix(0.8, 1.12, n);
    float tide = (1.0 - smoothstep(0.0, 0.5 + 0.55 * n, vSpL.y - SP_PT)) * step(SP_PT - 0.02, vSpL.y);
    float street = 1.0 - smoothstep(0.0, 0.45 + 0.4 * n, vSpL.y);
    float grime = max(tide, street);
    vec3 dirt = vec3(dot(diffuseColor.rgb, vec3(0.3, 0.5, 0.2))) * vec3(0.8, 0.7, 0.6);
    diffuseColor.rgb = mix(diffuseColor.rgb, dirt, grime * 0.7);
    float streak = smoothstep(0.62, 0.95, spNoise(vSpL * vec3(9.0, 0.5, 9.0))) * smoothstep(SP_PT + 0.3, 5.0, vSpL.y);
    diffuseColor.rgb *= 1.0 - 0.2 * streak;
  }`,
  `{
    float n = spFbm(vSpL * 1.7);
    diffuseColor.rgb *= mix(0.74, 1.1, n);
    diffuseColor.rgb *= 1.0 - 0.28 * (1.0 - smoothstep(0.0, 0.45, vSpL.y));
  }`,
  `{
    float n = spFbm(vSpL * vec3(2.2, 0.8, 2.2));
    diffuseColor.rgb *= mix(0.76, 1.1, n);
  }`,
  `{
    float n = spFbm(vSpL * 0.75);
    float lum = dot(diffuseColor.rgb, vec3(0.3, 0.55, 0.15));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(lum) * vec3(1.25, 0.95, 0.85), 0.3);
    #ifdef USE_AOMAP
      diffuseColor.rgb *= mix(0.5, 1.0, texture2D(aoMap, vAoMapUv).r);
    #endif
    float moss = smoothstep(0.6, 0.82, n) * (1.0 - smoothstep(10.0, 12.0, vSpL.y));
    diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.13, 0.14, 0.08), moss * 0.55);
    diffuseColor.rgb *= 1.0 - 0.3 * (1.0 - smoothstep(SP_EY, SP_EY + 1.4, vSpL.y));
    diffuseColor.rgb *= mix(0.8, 1.12, spNoise(vSpL * 2.7));
  }`,
  `{
    float n = spFbm(vSpL * vec3(2.2, 0.8, 2.2));
    diffuseColor.rgb *= mix(0.78, 1.1, n);
    #ifdef USE_AOMAP
      diffuseColor.rgb *= mix(0.5, 1.1, texture2D(aoMap, vAoMapUv).r);
    #endif
  }`,
  `{
    float n = spFbm(vSpL * 5.0);
    diffuseColor.rgb *= mix(0.62, 1.18, n);
  }`,
  ``,
];
function weather(mat, kind, defs) {
  mat.onBeforeCompile = (sh) => {
    sh.vertexShader = "varying vec3 vSpL;\n" + sh.vertexShader.replace("#include <begin_vertex>", `#include <begin_vertex>
      vec4 spP = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        spP = instanceMatrix * spP;
      #endif
      vSpL = spP.xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", "#include <common>\n" + defs.head + GLSL_NOISE)
      .replace("#include <map_fragment>", "#include <map_fragment>\n" + TINT[kind])
      .replace("#include <aomap_fragment>", "#include <aomap_fragment>\n" + defs.ao);
  };
  mat.customProgramCacheKey = () => "shivaparvati-w" + kind;
  return mat;
}

// ---------- geometry helpers

// Box with UVs in metres / tile; ou, ov shift the front/back faces so neighbouring boxes keep one pattern.
function mbox(w, h, d, tu = 1, tv = tu, ou = 0, ov = 0) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      const u0 = (uv.getX(i) * dims[f][0]) / tu + (f >= 2 ? ou : 0);
      const v0 = (uv.getY(i) * dims[f][1]) / tv + (f < 2 || f >= 4 ? ov : 0);
      uv.setXY(i, u0, v0);
    }
  }
  return g;
}
function scaleUV(g, k) {
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * k, uv.getY(i) * k);
  return g;
}
function lathe(profile, seg = 20, sc = 1) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r * sc), y * sc)), seg);
}
function strutShape() {
  const prof = [[0, 0.07], [0.1, 0.12], [0.2, 0.07], [0.32, 0.15], [0.45, 0.09], [0.58, 0.16], [0.7, 0.08], [0.84, 0.12], [1, 0.06]];
  const sh = new THREE.Shape();
  sh.moveTo(-prof[0][1], 0);
  for (const [y, w] of prof) sh.lineTo(w, y);
  for (let i = prof.length - 1; i >= 0; i--) sh.lineTo(-prof[i][1], prof[i][0]);
  return sh;
}
// Rectangle [-a,a] x [ys,yt] minus a multifoil arch (n lobes) of half-width a and height rise springing at ys.
function spandrelShape(a, ys, yt, rise, lobes = 5, cusp = 0.09) {
  const sh = new THREE.Shape();
  sh.moveTo(-a, ys);
  sh.lineTo(-a, yt);
  sh.lineTo(a, yt);
  sh.lineTo(a, ys);
  const N = 80;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI;
    const r = 1 - cusp * (1 - Math.abs(Math.sin(th * lobes)));
    sh.lineTo(a * r * Math.cos(th), ys + rise * r * Math.sin(th));
  }
  sh.closePath();
  return sh;
}
function toranaShape(R, r) {
  const sh = new THREE.Shape();
  const N = 96;
  for (let i = 0; i <= N; i++) {
    const th = (i / N) * Math.PI;
    const rr = R * (0.86 + 0.14 * Math.pow(Math.abs(Math.cos(th * 6)), 5));
    if (i === 0) sh.moveTo(rr * Math.cos(th), rr * Math.sin(th));
    else sh.lineTo(rr * Math.cos(th), rr * Math.sin(th));
  }
  for (let i = N; i >= 0; i--) {
    const th = (i / N) * Math.PI;
    sh.lineTo(r * Math.cos(th), r * Math.sin(th));
  }
  sh.closePath();
  return sh;
}
// Diagonal lattice bars clipped to a region: [{x, y, len, ang}] in the window plane.
function latticeBars(inside, x0, x1, y0, y1, gap) {
  const bars = [];
  for (const dir of [1, -1]) {
    const ux = Math.SQRT1_2;
    const uy = dir * Math.SQRT1_2;
    const nx = -uy;
    const ny = ux;
    const ps = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => x * nx + y * ny);
    const pMin = Math.min(...ps);
    const pMax = Math.max(...ps);
    const tr = Math.hypot(x1 - x0, y1 - y0);
    for (let p = pMin + gap / 2; p < pMax; p += gap) {
      let ta = null;
      let tb = null;
      for (let t = -tr; t <= tr; t += 0.004) {
        if (inside(p * nx + t * ux, p * ny + t * uy)) {
          if (ta === null) ta = t;
          tb = t;
        }
      }
      if (ta === null || tb - ta < 0.03) continue;
      const tm = (ta + tb) / 2;
      bars.push({ x: p * nx + tm * ux, y: p * ny + tm * uy, len: tb - ta + 0.02, ang: (dir * Math.PI) / 4 });
    }
  }
  return bars;
}

export function installShivaParvati(scene, data, buildings, holds) {
  const src = data.buildings.find((b) => b.id === SHIVA_ID && b.name === "Shiva Parvati Temple");
  const b = buildings.find((x) => x.id === SHIVA_ID);
  if (!src || !b) throw new Error("Shiva Parvati footprint missing");
  const f = basis(src.poly);
  // Local +Z is the long south face (the figure window).
  let q = 0;
  let bestSouth = -2;
  for (let k = 0; k < 4; k++) {
    const south = Math.cos(f.yaw + k * Math.PI / 2);
    if (south > bestSouth) { bestSouth = south; q = k; }
  }
  const yaw = f.yaw + q * Math.PI / 2;
  const HX = (q % 2 ? f.w : f.d) / 2;
  const HZ = (q % 2 ? f.d : f.w) / 2;
  const ca = Math.cos(yaw);
  const sa = Math.sin(yaw);
  const osmLocal = src.poly.map(([x, z]) => [(x - f.x) * ca - (z - f.z) * sa, (x - f.x) * sa + (z - f.z) * ca]);
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => osmLocal.reduce((a, p) => (
    Math.hypot(p[0] - sx * HX, p[1] - sz * HZ) < Math.hypot(a[0] - sx * HX, a[1] - sz * HZ) ? p : a
  )));
  const warp = (lx, lz) => {
    const u = (lx + HX) / (2 * HX);
    const v = (lz + HZ) / (2 * HZ);
    const w = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
    return [
      w[0] * C[0][0] + w[1] * C[1][0] + w[2] * C[2][0] + w[3] * C[3][0],
      w[0] * C[0][1] + w[1] * C[1][1] + w[2] * C[2][1] + w[3] * C[3][1],
    ];
  };
  const W = (lx0, lz0) => {
    const [lx, lz] = warp(lx0, lz0);
    return [+(f.x + lx * ca + lz * sa).toFixed(3), +(f.z - lx * sa + lz * ca).toFixed(3)];
  };
  const D = (k, i) => (k % 2 ? HX : HZ) - i;
  const L = (k, i) => (k % 2 ? HZ : HX) - i;
  const FL = (k, s, d) => {
    const th = (k * Math.PI) / 2;
    return [s * Math.cos(th) + d * Math.sin(th), -s * Math.sin(th) + d * Math.cos(th)];
  };
  const rect = (i) => {
    const hx = HX - i;
    const hz = HZ - i;
    return [[-hx, -hz], [hx, -hz], [hx, hz], [-hx, hz]].map(([x, z]) => W(x, z));
  };
  const fpoly = (k, s0, s1, d0, d1) => [[s0, d0], [s1, d0], [s1, d1], [s0, d1]].map(([s, d]) => W(...FL(k, s, d)));

  const roofY = (i) => EAVE_Y + ((i - EAVE_I) / (HZ - EAVE_I)) * (RIDGE_Y - EAVE_Y);
  const SLOPE = (RIDGE_Y - EAVE_Y) / (HZ - EAVE_I);
  const PT = PLINTH[3].y;

  // ---------- materials (every surface textured; weathering + analytic occlusion in the shader)
  const F = (v) => v.toFixed(4);
  let stepAO = "";
  for (let n = 0; n < 3; n++) {
    const i = PLINTH[n + 1].i;
    stepAO += `{ float dn = max(ap.x - ${F(HX - i)}, ap.y - ${F(HZ - i)});
      if (dn > -0.3 && y > ${F(PLINTH[n].y - 0.03)}) ao *= 1.0 - 0.4 * exp(-length(vec2(max(dn, 0.0), max(y - ${F(PLINTH[n].y)}, 0.0))) / 0.16); }\n`;
  }
  const defs = {
    head: `#define SP_HX ${F(HX)}\n#define SP_HZ ${F(HZ)}\n#define SP_WX ${F(HX - WALL_I)}\n#define SP_WZ ${F(HZ - WALL_I)}\n`
      + `#define SP_PT ${F(PT)}\n#define SP_EY ${F(EAVE_Y)}\n#define SP_EI ${F(EAVE_I)}\n#define SP_SL ${F(SLOPE)}\n`,
    ao: `{
      vec2 ap = abs(vSpL.xz);
      float y = vSpL.y;
      float ao = 1.0;
      float dw = max(ap.x - SP_WX, ap.y - SP_WZ);
      if (dw > -0.6 && y > SP_PT - 0.05) ao *= 1.0 - 0.55 * exp(-length(vec2(max(dw, 0.0), max(y - SP_PT, 0.0))) / 0.28);
      ${stepAO}
      float d0 = max(ap.x - SP_HX, ap.y - SP_HZ);
      if (d0 < 0.05) ao *= 1.0 - 0.42 * exp(-max(y, 0.0) / 0.2);
      float ins = min(SP_HX - ap.x, SP_HZ - ap.y);
      float gap = SP_EY + (ins - SP_EI) * SP_SL - y;
      if (ins > SP_EI) {
        float blk = atan(ins - SP_EI, max(gap, 0.05)) / 1.5708;
        ao *= 1.0 - 0.5 * blk * smoothstep(0.06, 0.14, gap);
      }
      reflectedLight.indirectDiffuse *= ao;
      reflectedLight.indirectSpecular *= ao;
      reflectedLight.directDiffuse *= mix(1.0, ao, 0.45);
      reflectedLight.directSpecular *= ao;
    }`,
  };
  const pbr = (name, kind, o = {}) => {
    const arm = tex(name + "_arm.jpg", false);
    const m = new THREE.MeshStandardMaterial({
      map: tex(name + "_Diffuse.jpg", true),
      normalMap: o.normal || tex(name + "_nor_gl.jpg", false),
      roughnessMap: arm,
      aoMap: o.ao || arm,
      roughness: o.rough ?? 1,
      metalness: 0,
      color: o.tint ?? 0xffffff,
      side: o.side ?? THREE.FrontSide,
    });
    m.normalScale.set(o.n ?? 1, o.n ?? 1);
    return weather(m, kind, defs);
  };
  const brick = pbr("brick_wall_006", 0, { tint: 0xf2d9c8, n: 1.1 });
  const brickIn = pbr("brick_wall_006", 0, { tint: 0x2e2420 });
  const stone = pbr("stone_tiles_02", 1, { tint: 0xc7bdb2, n: 0.8 });
  const lionStone = pbr("plastered_wall", 5, { tint: 0x66625e, n: 1.6 });
  const lionDark = pbr("plastered_wall", 5, { tint: 0x2a221d, n: 1.0 });
  const wood = pbr("dark_wood", 2, { tint: 0xc29a84, n: 0.8 });
  const woodDark = pbr("dark_wood", 2, { tint: 0x86624f, n: 0.8 });
  const planks = pbr("weathered_brown_planks", 2, { tint: 0x8a6048 });
  const tile = pbr("ceramic_roof_01", 3, { tint: 0xffd8c8, n: 1.3 });
  const ridgeTile = pbr("ceramic_roof_01", 3, { tint: 0x8c6c62, n: 1.0 });
  const carve = (rel, tint, n = 1.25) => {
    const m = pbr("dark_wood", 4, { tint, n, normal: rel.normal, ao: rel.height });
    m.aoMapIntensity = 0.6;
    return m;
  };
  const relPanel = panelRelief();
  const relBand = bandRelief();
  const relPost = postRelief();
  const relScroll = scrollRelief();
  const cPanel = carve(relPanel, 0xcca48a);
  const cBand = carve(relBand, 0xd2aa8e);
  const cPost = carve(relPost, 0xcca48a);
  const cScroll = carve(relScroll, 0xdab494, 1.4);
  const pleat = pleatRelief();
  const valMat = weather(new THREE.MeshStandardMaterial({ map: valanceTex(), normalMap: pleat.normal, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.82 }), 6, defs);
  const gm = goldMaps();
  const gold = new THREE.MeshStandardMaterial({ map: gm.map, roughnessMap: gm.rough, metalness: 1, roughness: 0.55, color: 0xffffff });
  const paint = (map, rough = 0.62) => weather(new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: 0 }), 6, defs);
  const shivaFace = paint(faceTex(true));
  const parvatiFace = paint(faceTex(false));
  const shivaSkin = paint(canvasTex(64, 64, (g) => { g.fillStyle = "#e9e3d7"; g.fillRect(0, 0, 64, 64); g.fillStyle = "rgba(120,90,70,0.08)"; g.fillRect(0, 40, 64, 24); }));
  const parvatiSkin = paint(canvasTex(64, 64, (g) => { g.fillStyle = "#edd6c6"; g.fillRect(0, 0, 64, 64); g.fillStyle = "rgba(120,80,60,0.08)"; g.fillRect(0, 40, 64, 24); }));
  const shivaRobe = paint(clothTex("#e8e1d2", "#b0242a", "rgba(176,36,42,0.55)", 31), 0.8);
  const parvatiRobe = paint(clothTex("#5f78a2", "#b3262c", "rgba(214,170,80,0.7)", 32), 0.8);
  const crownMat = weather(new THREE.MeshStandardMaterial({ map: crownTex(), metalness: 0.65, roughness: 0.38 }), 6, defs);
  const jewelRed = new THREE.MeshStandardMaterial({ map: gm.map, color: 0xd0202a, roughness: 0.25, metalness: 0.1 });
  const jewelGreen = new THREE.MeshStandardMaterial({ map: gm.map, color: 0x1c9a4a, roughness: 0.25, metalness: 0.1 });

  // ---------- geometry bags: one merged mesh per named group and material
  const faceRot = [0, 1, 2, 3].map((k) => new THREE.Matrix4().makeRotationY((k * Math.PI) / 2));
  const at = (k, s, y, d, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Matrix4().makeTranslation(s, y, d);
    if (rx || ry || rz) m.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")));
    return k === null ? m : faceRot[k].clone().multiply(m);
  };
  const bags = new Map();
  const put = (grp, mat, geo, m) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (m) g.applyMatrix4(m);
    for (const key of Object.keys(g.attributes)) if (key !== "position" && key !== "normal" && key !== "uv") g.deleteAttribute(key);
    if (!bags.has(grp)) bags.set(grp, new Map());
    const bag = bags.get(grp);
    if (!bag.has(mat)) bag.set(mat, []);
    bag.get(mat).push(g);
  };
  const fbox = (grp, k, mat, w, h, dep, s, y, d, tu = 1, tv = tu, ou = 0, ov = 0) => put(grp, mat, mbox(w, h, dep, tu, tv, ou, ov), at(k, s, y, d));
  const instances = new Map();
  const putI = (grp, key, geo, mat, m) => {
    const id = grp + "|" + key;
    if (!instances.has(id)) instances.set(id, { grp, geo, mat, list: [] });
    instances.get(id).list.push(m);
  };
  const sphere = new THREE.SphereGeometry(1, 18, 12);
  const sphereLo = new THREE.SphereGeometry(1, 10, 7);
  const ell = (grp, mat, m, x, y, z, a, bb, c, rx = 0, ry = 0, rz = 0, lo = false) => {
    const g = (lo ? sphereLo : sphere).clone();
    g.scale(a, bb, c);
    put(grp, mat, g, m.clone().multiply(at(null, x, y, z, rx, ry, rz)));
  };
  const limb = (grp, mat, m, a, c, r0, r1 = r0 * 0.85) => {
    const av = new THREE.Vector3(...a);
    const cv = new THREE.Vector3(...c);
    const g = new THREE.CylinderGeometry(r1, r0, av.distanceTo(cv), 12, 1);
    const mm = new THREE.Matrix4().compose(av.clone().add(cv).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cv.clone().sub(av).normalize()), new THREE.Vector3(1, 1, 1));
    put(grp, mat, g, m.clone().multiply(mm));
  };
  const extrude = (shape, depth, tileM, bevel = 0) => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 1, curveSegments: 24,
    });
    return scaleUV(g, 1 / tileM);
  };

  const d0 = D(0, WALL_I);
  const halfFront = L(0, WALL_I);
  const markers = [];
  const marker = (grp, name, k, s, y) => markers.push({ grp, name, m: at(k, s, y, D(k, WALL_I)) });

  // ---------- plinth: brick tiers with worn stone coping, central stone stair (photos 01, 03)
  const zw = HZ - WALL_I;
  for (let n = 0; n < PLINTH.length; n++) {
    const p = PLINTH[n];
    const y0 = n ? PLINTH[n - 1].y : 0;
    const h = p.y - y0;
    const hx = HX - p.i;
    const hz = HZ - p.i;
    put("plinth", brick, mbox(2 * hx, h, zw + hz, BRICK_TILE, BRICK_TILE, 0, y0 / BRICK_TILE), at(null, 0, y0 + h / 2, (zw - hz) / 2));
    for (const sx of [-1, 1]) {
      const w = hx - STAIR_W;
      put("plinth", brick, mbox(w, h, hz - zw, BRICK_TILE, BRICK_TILE, 0, y0 / BRICK_TILE), at(null, sx * (STAIR_W + w / 2), y0 + h / 2, (zw + hz) / 2));
    }
    const cd = 0.3;
    const ch = 0.075;
    const cy = p.y + 0.004 - ch / 2;
    const o = 0.025;
    for (const sx of [-1, 1]) {
      const w = hx + o - STAIR_W;
      put("plinth", stone, mbox(w, ch, cd + o, 1.1), at(null, sx * (STAIR_W + w / 2), cy, hz - cd / 2 + o / 2));
    }
    put("plinth", stone, mbox(2 * (hx + o), ch, cd + o, 1.1), at(null, 0, cy, -(hz - cd / 2 + o / 2)));
    for (const sx of [-1, 1]) put("plinth", stone, mbox(cd + o, ch, 2 * (hz - cd), 1.1), at(null, sx * (hx - cd / 2 + o / 2), cy, 0));
  }
  // Eight 0.2 m risers over the four 0.4 m collision steps (photos show about ten).
  const stairI = [0, 0.36, 0.72, 1.0, 1.28, 1.5, 1.72, 1.9];
  for (let j = 0; j < 8; j++) {
    const yTop = 0.2 * (j + 1);
    const front = HZ - stairI[j] + (j === 0 ? 0.02 : 0);
    put("stair", stone, mbox(2 * STAIR_W, 0.2, front - zw, 1.1), at(null, 0, yTop - 0.1, (front + zw) / 2));
  }

  // ---------- walls: brick below, carved timber above, cut around Grok's openings
  // Sills 0.85 m above the plinth (1.60). Door clear 1.76 m: lintel at 3.38, so a 1.68 m head on the plinth is just under it.
  const groundHoles = [-0.74, -0.37, 0.37, 0.74].map((t) => ({ s: t * halfFront, w: 1.15, y: 3.25, h: 1.6 }));
  groundHoles.push({ s: 0, w: 1.32, y: 2.5, h: 1.76 });
  const upperHoles = [-0.72, -0.36, 0.36, 0.72].map((t) => ({ s: t * halfFront, w: 1.1, y: 6.95, h: 1.1 }));
  upperHoles.push({ s: 0, w: 1.9, y: 6.92, h: 1.52 });
  const sideLow = [{ s: 0, w: 1.05, y: 3.225, h: 1.55 }];
  const sideUp = [{ s: 0, w: 1.05, y: 6.94, h: 1.08 }];
  const backHalf = L(2, WALL_I);
  const backLow = [-0.42, 0.42].map((t) => ({ s: t * backHalf, w: 1.05, y: 3.225, h: 1.55 }));
  const backUp = [-0.42, 0.42].map((t) => ({ s: t * backHalf, w: 1.05, y: 6.94, h: 1.08 }));
  const wallNames = ["wall_front", "wall_right", "wall_back", "wall_left"];
  const faceHoles = [[groundHoles, upperHoles], [sideLow, sideUp], [backLow, backUp], [sideLow, sideUp]];
  for (let k = 0; k < 4; k++) {
    const half = L(k, WALL_I) - (k % 2 ? WALL_T : 0);
    const d = D(k, WALL_I) - WALL_T / 2;
    const [low, up] = faceHoles[k];
    for (const c of cells(-half, half, PT, BRICK_TOP, low)) {
      fbox(wallNames[k], k, brick, c.w, c.h, WALL_T, c.s, c.y, d, BRICK_TILE, BRICK_TILE, (c.s - c.w / 2) / BRICK_TILE, (c.y - c.h / 2) / BRICK_TILE);
    }
    for (const c of cells(-half, half, BRICK_TOP, UPPER_TOP, up)) {
      fbox(wallNames[k], k, cPanel, c.w, c.h, WALL_T, c.s, c.y, d, 0.55, 0.55, (c.s - c.w / 2) / 0.55, (c.y - c.h / 2) / 0.55);
    }
  }
  const inW = 2 * (HX - WALL_I - WALL_T - 0.08);
  const inD = 2 * (HZ - WALL_I - WALL_T - 0.08);
  put("interior", brickIn, mbox(inW, UPPER_TOP - PT - 0.08, inD, BRICK_TILE), at(null, 0, (UPPER_TOP + PT) / 2, 0));

  // ---------- openings
  const geoBar = new THREE.BoxGeometry(1, 0.024, 0.045);
  const lattice = (grp, k, s, d, inside, x0, x1, y0, y1, gap = 0.07) => {
    for (const bar of latticeBars(inside, x0, x1, y0, y1, gap)) {
      const m = at(k, s + bar.x, bar.y, d, 0, 0, bar.ang).multiply(new THREE.Matrix4().makeScale(bar.len, 1, 1));
      putI(grp, "lattice", geoBar, woodDark, m);
    }
  };
  const lining = (grp, k, s, w, y0, y1) => {
    const d = D(k, WALL_I);
    for (const sx of [-1, 1]) fbox(grp, k, wood, 0.05, y1 - y0, WALL_T - 0.02, s + sx * (w / 2 - 0.025), (y0 + y1) / 2, d - WALL_T / 2, 0.8);
    fbox(grp, k, wood, w, 0.05, WALL_T - 0.02, s, y1 - 0.025, d - WALL_T / 2, 0.8);
  };
  // Window with carved posts, a sill and lintel whose ends run past the frame (the Newar "ears").
  const frame = (grp, k, s, w, y0, y1, o = {}) => {
    const d = D(k, WALL_I);
    const pw = o.post ?? 0.14;
    const fy0 = o.fy0 ?? y0 - 0.12;
    const fy1 = o.fy1 ?? y1 + 0.16;
    for (const sx of [-1, 1]) {
      fbox(grp, k, cPost, pw, fy1 - fy0, 0.16, s + sx * (w / 2 + pw / 2), (fy0 + fy1) / 2, d + 0.03, pw, 0.6);
      if (o.pilaster) fbox(grp, k, cPanel, 0.24, fy1 - fy0 - 0.1, 0.09, s + sx * (w / 2 + pw + 0.12), (fy0 + fy1) / 2 - 0.05, d + 0.005, 0.5);
    }
    const ear = o.ear ?? 0.32;
    fbox(grp, k, cBand, w + 2 * pw + ear, y0 - fy0, 0.2, s, (fy0 + y0) / 2, d + 0.05, 0.6, y0 - fy0);
    fbox(grp, k, cBand, w + 2 * pw + ear + 0.12, fy1 - y1, 0.22, s, (y1 + fy1) / 2, d + 0.06, 0.6, fy1 - y1);
  };
  const latticeWindow = (grp, k, s, w, y0, y1, arched) => {
    const d = D(k, WALL_I);
    lining(grp, k, s, w, y0, y1);
    const a = w / 2 - 0.05;
    const yb = y0 + (arched ? 0.42 : 0.04);
    if (arched) fbox(grp, k, cPanel, 2 * a, yb - y0, 0.06, s, (y0 + yb) / 2, d - 0.08, 0.42);
    const ys = arched ? y1 - a - 0.02 : y1;
    if (arched) put(grp, cScroll, extrude(spandrelShape(a, ys, y1 - 0.01, a), 0.06, 0.3), at(k, s, 0, d - 0.06));
    const inside = arched
      ? (x, y) => Math.abs(x) <= a && y >= yb && (y <= ys || x * x + (y - ys) * (y - ys) <= a * a)
      : (x, y) => Math.abs(x) <= a && y >= yb && y <= y1 - 0.04;
    lattice("lattice", k, s, d - 0.13, inside, -a, a, yb, y1);
  };
  const toranaGeo = (R, r) => extrude(toranaShape(R, r), 0.09, 0.32, 0.012);
  const torana = (grp, s, yb, R) => {
    const r = R * 0.66;
    put(grp, cScroll, toranaGeo(R, r), at(0, s, yb, d0 + 0.005));
    const tym = new THREE.Shape();
    tym.moveTo(r, 0);
    tym.absarc(0, 0, r, 0, Math.PI, false);
    tym.closePath();
    put(grp, cPanel, extrude(tym, 0.035, 0.4), at(0, s, yb, d0 + 0.004));
    const m = at(0, s, yb, d0 + 0.05);
    ell(grp, cScroll, m, 0, 0.06, 0, 0.17, 0.04, 0.04, 0, 0, 0, true);
    ell(grp, cScroll, m, 0, 0.19, 0, 0.09, 0.12, 0.04, 0, 0, 0, true);
    ell(grp, cScroll, m, 0, 0.35, 0, 0.055, 0.062, 0.04, 0, 0, 0, true);
    for (const sx of [-1, 1]) ell(grp, cScroll, m, sx * 0.1, 0.2, 0, 0.03, 0.09, 0.03, 0, 0, sx * 0.6, true);
    put(grp, cScroll, new THREE.TorusGeometry(0.11, 0.012, 6, 20), at(0, s, yb + 0.35, d0 + 0.045));
    const crest = new THREE.Shape();
    crest.moveTo(-0.13, 0);
    crest.quadraticCurveTo(-0.15, 0.12, 0, 0.26);
    crest.quadraticCurveTo(0.15, 0.12, 0.13, 0);
    crest.closePath();
    put(grp, cScroll, extrude(crest, 0.07, 0.25, 0.01), at(0, s, yb + R * 0.84, d0 + 0.01));
    for (const sx of [-1, 1]) {
      put(grp, cScroll, new THREE.TorusGeometry(0.075, 0.026, 6, 14, Math.PI * 1.5), at(0, s + sx * R * 0.93, yb + 0.07, d0 + 0.06, 0, 0, sx > 0 ? 0 : Math.PI / 2));
    }
  };

  // Front ground floor: four arched lattice windows and the door, each in a carved bay under a torana.
  groundHoles.forEach((h, n) => {
    const name = ["window_ground_l2", "window_ground_l1", "window_ground_r1", "window_ground_r2", "door"][n];
    const y0 = h.y - h.h / 2;
    const y1 = h.y + h.h / 2;
    const door = name === "door";
    marker("wall_front", name, 0, h.s, h.y);
    frame("wall_front", 0, h.s, h.w, y0, y1, { post: 0.16, fy0: PT, fy1: y1 + 0.2, pilaster: true, ear: door ? 0.5 : 0.36 });
    if (door) {
      lining("wall_front", 0, h.s, h.w, y0, y1);
      const a = h.w / 2 - 0.05;
      put("wall_front", cScroll, extrude(spandrelShape(a, y1 - a - 0.02, y1 - 0.01, a, 7, 0.07), 0.07, 0.3), at(0, h.s, 0, d0 - 0.07));
      for (const sx of [-1, 1]) {
        const hinge = new THREE.Vector3(h.s + sx * (h.w / 2 - 0.05), y0, d0 - WALL_T + 0.04);
        const leaf = mbox(h.w / 2 - 0.04, h.h - 0.3, 0.06, 0.9);
        leaf.translate(-sx * (h.w / 4 - 0.02), (h.h - 0.3) / 2, -0.03);
        put("wall_front", woodDark, leaf, at(0, hinge.x, hinge.y, hinge.z, 0, -sx * 1.25, 0));
      }
    } else {
      latticeWindow("wall_front", 0, h.s, h.w, y0, y1, true);
    }
    torana("wall_front", h.s, y1 + 0.2, door ? 0.74 : 0.78);
  });

  // Cornice between the brick and the timber storey: moulding, dentils, cornice beam, carved frieze (photo 05).
  const geoDentil = mbox(0.09, 0.17, 0.18, 0.4);
  const geoBeamEnd = mbox(0.1, 0.13, 0.22, 0.4);
  for (let k = 0; k < 4; k++) {
    const grp = wallNames[k];
    const d = D(k, WALL_I);
    const ext = k % 2 ? 0 : 1;
    const e = k % 2 ? 0.003 : 0;
    const len = (p) => 2 * (L(k, WALL_I) + ext * p);
    const band = (mat, y0, y1, p, tu = 0.6) => fbox(grp, k, mat, len(p), y1 - y0 - 2 * e, p + 0.05, 0, (y0 + y1) / 2, d + (p - 0.05) / 2, tu, y1 - y0);
    band(cBand, 5.15, 5.27, 0.08);
    band(woodDark, 5.27, 5.45, 0.03, 0.8);
    band(cBand, 5.45, 5.62, 0.25);
    band(cBand, 5.62, 5.98, 0.11, 0.9);
    const half = L(k, WALL_I) - 0.06;
    for (let s = -half; s <= half + 1e-3; s += 0.2) putI("cornice", "dentil", geoDentil, wood, at(k, s, 5.36, d + 0.09));
    for (let s = -half + 0.2; s <= half - 0.1; s += 0.5) putI("cornice", "beamend", geoBeamEnd, cScroll, at(k, s, 5.82, d + 0.12));
    band(cBand, 7.86, 8.06, 0.13);
    band(woodDark, 8.06, 8.16, 0.06, 0.8);
  }

  // Front upper storey: lattice, wheel, the figure window, wheel, lattice (photo 05).
  const upperNames = ["window_upper_l2", "window_upper_l1", "window_upper_r1", "window_upper_r2", "window_figure"];
  upperHoles.forEach((h, n) => {
    const name = upperNames[n];
    const y0 = h.y - h.h / 2;
    const y1 = h.y + h.h / 2;
    marker("wall_front", name, 0, h.s, h.y);
    frame("wall_front", 0, h.s, h.w, y0, y1, { post: 0.13, fy0: 5.98, fy1: 7.86, ear: name === "window_figure" ? 0.1 : 0.3 });
    lining("wall_front", 0, h.s, h.w, y0, y1);
    if (name === "window_figure") return;
    if (n === 0 || n === 3) {
      lattice("lattice", 0, h.s, d0 - 0.13, (x, y) => Math.abs(x) <= h.w / 2 - 0.05 && y >= y0 + 0.04 && y <= y1 - 0.04, -h.w / 2, h.w / 2, y0, y1);
      return;
    }
    // Chakra window: a spoked wheel in a carved square.
    const R = Math.min(h.w, h.h) / 2 - 0.06;
    const sq = new THREE.Shape();
    const a = h.w / 2 - 0.04;
    const bh = h.h / 2 - 0.04;
    sq.moveTo(-a, -bh);
    sq.lineTo(a, -bh);
    sq.lineTo(a, bh);
    sq.lineTo(-a, bh);
    sq.closePath();
    const hole = new THREE.Path();
    hole.absarc(0, 0, R, 0, Math.PI * 2, true);
    sq.holes.push(hole);
    put("wall_front", cScroll, extrude(sq, 0.06, 0.3), at(0, h.s, h.y, d0 - 0.07));
    const wm = at(0, h.s, h.y, d0 - 0.1);
    for (const [rr, tube] of [[R, 0.035], [R * 0.66, 0.018], [0.2, 0.028]]) put("wall_front", wood, new THREE.TorusGeometry(rr, tube, 8, 48), wm);
    put("wall_front", wood, new THREE.CylinderGeometry(0.075, 0.075, 0.09, 16), wm.clone().multiply(at(null, 0, 0, 0, Math.PI / 2)));
    for (let i = 0; i < 24; i++) {
      const th = (i / 24) * Math.PI * 2;
      const r0 = i % 2 ? 0.2 : 0.075;
      const g = mbox(R - r0, 0.022, 0.04, 0.5);
      put("wall_front", woodDark, g, wm.clone().multiply(at(null, Math.cos(th) * (R + r0) / 2, Math.sin(th) * (R + r0) / 2, 0, 0, 0, th)));
    }
  });
  // The figure window: a cusped, flattened arch with a crest, and a sill for the two to lean on (photo 04).
  {
    const h = upperHoles[4];
    const y0 = h.y - h.h / 2;
    const y1 = h.y + h.h / 2;
    const a = h.w / 2 - 0.05;
    put("wall_front", cScroll, extrude(spandrelShape(a, y1 - 0.46, y1 - 0.01, 0.42, 7, 0.08), 0.07, 0.3), at(0, 0, 0, d0 - 0.05));
    fbox("wall_front", 0, cBand, h.w + 0.3, 0.07, 0.5, 0, y0 - 0.035, d0 + 0.06, 0.6, 0.07);
    fbox("wall_front", 0, cPanel, h.w, 0.22, 0.05, 0, y0 - 0.18, d0 + 0.3, 0.45);
    const crest = new THREE.Shape();
    crest.moveTo(-0.34, 0);
    crest.quadraticCurveTo(-0.32, 0.2, -0.1, 0.24);
    crest.quadraticCurveTo(0, 0.42, 0.1, 0.24);
    crest.quadraticCurveTo(0.32, 0.2, 0.34, 0);
    crest.closePath();
    put("wall_front", cScroll, extrude(crest, 0.08, 0.25, 0.012), at(0, 0, 7.88, d0 + 0.08));
  }
  // Carved posts between the upper windows and at the corners.
  for (const s of [-5.6, -3.15, 3.15, 5.6]) fbox("wall_front", 0, cPost, 0.15, 1.88, 0.1, s, 6.92, d0 + 0.03, 0.15, 0.6);

  // Side and back faces: plainer lattice windows in the same frames.
  const sideNames = [[], [["window_side_r_low", "window_side_r"]], [["window_back_l_low", "window_back_l"], ["window_back_r_low", "window_back_r"]], [["window_side_l_low", "window_side_l"]]];
  for (const k of [1, 2, 3]) {
    const [low, up] = faceHoles[k];
    low.forEach((h, n) => {
      const y0 = h.y - h.h / 2;
      const y1 = h.y + h.h / 2;
      marker(wallNames[k], sideNames[k][n][0], k, h.s, h.y);
      frame(wallNames[k], k, h.s, h.w, y0, y1, { post: 0.13, ear: 0.3 });
      latticeWindow(wallNames[k], k, h.s, h.w, y0, y1, true);
    });
    up.forEach((h, n) => {
      const y0 = h.y - h.h / 2;
      const y1 = h.y + h.h / 2;
      marker(wallNames[k], sideNames[k][n][1], k, h.s, h.y);
      frame(wallNames[k], k, h.s, h.w, y0, y1, { post: 0.12, fy0: 5.98, fy1: 7.86, ear: 0.26 });
      latticeWindow(wallNames[k], k, h.s, h.w, y0, y1, false);
    });
  }

  // ---------- Shiva and Parvati, painted wood, leaning out on the sill (photos 04, 05)
  const figure = (grp, s, sc, robe, skin, face, shiva) => {
    const sill = upperHoles[4].y - upperHoles[4].h / 2;
    const base = new THREE.Vector3(s, sill, d0 - 0.12);
    const m = new THREE.Matrix4().makeTranslation(base.x, base.y, base.z)
      .multiply(new THREE.Matrix4().makeRotationX(0.2))
      .multiply(new THREE.Matrix4().makeScale(sc, sc, sc));
    const hm = m.clone().multiply(new THREE.Matrix4().makeTranslation(0, 0.75, 0.04)).multiply(new THREE.Matrix4().makeScale(1.25, 1.25, 1.25)).multiply(new THREE.Matrix4().makeTranslation(0, -0.75, -0.04));
    ell(grp, robe, m, 0, 0.27, 0.02, 0.25, 0.3, 0.15);
    for (const sx of [-1, 1]) ell(grp, robe, m, sx * 0.19, 0.46, 0.0, 0.1, 0.08, 0.1);
    limb(grp, skin, m, [0, 0.5, 0], [0, 0.66, 0.02], 0.052, 0.05);
    ell(grp, face, hm, 0, 0.75, 0.04, 0.105, 0.13, 0.11);
    ell(grp, skin, hm, 0, 0.735, 0.145, 0.016, 0.03, 0.02);
    for (const sx of [-1, 1]) {
      ell(grp, skin, hm, sx * 0.105, 0.75, 0.03, 0.02, 0.035, 0.025, 0, 0, 0, true);
      put(grp, gold, new THREE.TorusGeometry(0.022, 0.006, 6, 12), hm.clone().multiply(at(null, sx * 0.112, 0.705, 0.035, 0, Math.PI / 2, 0)));
    }
    const crown = shiva
      ? [[0.1, 0], [0.112, 0.03], [0.102, 0.06], [0.12, 0.1], [0.1, 0.15], [0.108, 0.2], [0.08, 0.26], [0.085, 0.3], [0.05, 0.36], [0.03, 0.42], [0.001, 0.47]]
      : [[0.098, 0], [0.108, 0.03], [0.1, 0.06], [0.112, 0.1], [0.09, 0.15], [0.095, 0.19], [0.06, 0.25], [0.03, 0.3], [0.001, 0.34]];
    put(grp, crownMat, lathe(crown, 24), hm.clone().multiply(at(null, 0, 0.81, 0.03)));
    const fan = new THREE.Shape();
    fan.moveTo(-0.11, 0);
    fan.quadraticCurveTo(-0.16, 0.16, -0.04, 0.27);
    fan.quadraticCurveTo(0, 0.33, 0.04, 0.27);
    fan.quadraticCurveTo(0.16, 0.16, 0.11, 0);
    fan.closePath();
    put(grp, crownMat, extrude(fan, 0.02, 0.4, 0.006), hm.clone().multiply(at(null, 0, 0.83, 0.115, -0.15)));
    for (let i = 0; i < 9; i++) {
      const th = -0.9 + (i / 8) * 1.8;
      ell(grp, i % 2 ? jewelGreen : jewelRed, hm, Math.sin(th) * 0.112, 0.86, 0.03 + Math.cos(th) * 0.112, 0.016, 0.016, 0.016, 0, 0, 0, true);
    }
    ell(grp, jewelRed, hm, 0, 0.98, 0.15, 0.022, 0.028, 0.014, 0, 0, 0, true);
    for (const [R, y] of [[0.12, 0.43], [0.16, 0.36]]) {
      put(grp, gold, new THREE.TorusGeometry(R, 0.01, 6, 24, Math.PI), m.clone().multiply(at(null, 0, y + R * 0.35, 0.09, -1.1, 0, Math.PI)));
    }
    for (const sx of [-1, 1]) {
      limb(grp, robe, m, [sx * 0.2, 0.45, 0.0], [sx * 0.25, 0.17, 0.13], 0.055, 0.05);
      limb(grp, skin, m, [sx * 0.25, 0.17, 0.13], [sx * 0.09, 0.06, 0.29], 0.045, 0.038);
      ell(grp, skin, m, sx * 0.07, 0.055, 0.31, 0.045, 0.024, 0.06);
      put(grp, gold, new THREE.TorusGeometry(0.04, 0.009, 6, 14), m.clone().multiply(at(null, sx * 0.12, 0.085, 0.25, 0.5, sx * 0.9, 0)));
    }
  };
  figure("figure_shiva", -0.36, 1.0, shivaRobe, shivaSkin, shivaFace, true);
  figure("figure_parvati", 0.36, 0.93, parvatiRobe, parvatiSkin, parvatiFace, false);

  // ---------- roof: one hip of small dusty clay tiles, boarded soffit on rafters, fascia and red valance
  const roofGrid = (k, t0, t1, yOff, flip) => {
    const ns = 28;
    const nt = Math.max(2, Math.round((t1 - t0) * 14));
    const slopeLen = Math.hypot(HZ - EAVE_I, RIDGE_Y - EAVE_Y);
    const pos = [];
    const uv = [];
    const idx = [];
    for (let j = 0; j <= nt; j++) {
      const t = t0 + ((t1 - t0) * j) / nt;
      const i = EAVE_I + t * (HZ - EAVE_I);
      for (let c = 0; c <= ns; c++) {
        const u = (c / ns) * 2 - 1;
        const x = u * L(k, i);
        const y = roofY(i) + LIFT * Math.pow(Math.abs(u), 4) * Math.pow(1 - t, 1.5) + yOff;
        const [lx, lz] = FL(k, x, D(k, i));
        pos.push(lx, y, lz);
        uv.push(x / 1.5, (t * slopeLen) / 1.5);
      }
    }
    for (let j = 0; j < nt; j++) {
      for (let c = 0; c < ns; c++) {
        const a = j * (ns + 1) + c;
        if (flip) idx.push(a, a + ns + 1, a + 1, a + 1, a + ns + 1, a + ns + 2);
        else idx.push(a, a + 1, a + ns + 1, a + 1, a + ns + 2, a + ns + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  };
  const eaveNames = ["eave_front", "eave_right", "eave_back", "eave_left"];
  const tSoffit = (WALL_I + 0.35 - EAVE_I) / (HZ - EAVE_I);
  const geoRafter = new THREE.BoxGeometry(0.07, 0.09, 1);
  for (let k = 0; k < 4; k++) {
    put("roof_lower", tile, roofGrid(k, 0, 0.46, 0, false));
    put("roof_upper", tile, roofGrid(k, 0.46, 1, 0, false));
    put(eaveNames[k], planks, roofGrid(k, 0, tSoffit, -0.17, true));
    // fascia and valance, with the corner lift
    const ribbon = (drop, y0, dOut, mat, uvLen) => {
      const ns = 40;
      const pos = [];
      const nor = [];
      const uv = [];
      const idx = [];
      const Le = L(k, EAVE_I);
      for (let c = 0; c <= ns; c++) {
        const u = (c / ns) * 2 - 1;
        const s = u * Le;
        const y = EAVE_Y + LIFT * Math.pow(Math.abs(u), 4) + y0;
        pos.push(s, y, D(k, EAVE_I) + dOut, s, y - drop, D(k, EAVE_I) + dOut);
        nor.push(0, 0, 1, 0, 0, 1);
        uv.push((s + Le) / uvLen, 1, (s + Le) / uvLen, 0);
        if (c) {
          const a = (c - 1) * 2;
          idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      put(eaveNames[k], mat, g, faceRot[k]);
    };
    ribbon(0.24, 0.03, 0.0, woodDark, 0.9);
    ribbon(0.5, -0.17, 0.035, valMat, 1.0);
    // rafters under the soffit; jack rafters stop at the hip
    const L0 = L(k, EAVE_I);
    for (let s = -L0 + 0.25; s <= L0 - 0.25; s += 0.3) {
      const iStart = Math.min(WALL_I, L(k, 0) - Math.abs(s));
      if (iStart - EAVE_I < 0.3) continue;
      const pA = new THREE.Vector3(s, roofY(iStart) - 0.24, D(k, iStart));
      const pB = new THREE.Vector3(s, roofY(EAVE_I + 0.06) - 0.24, D(k, EAVE_I + 0.06));
      const dir = pB.clone().sub(pA);
      const m = new THREE.Matrix4().compose(pA.clone().add(pB).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.clone().normalize()), new THREE.Vector3(1, 1, dir.length()));
      putI("rafters", "rafter", geoRafter, woodDark, faceRot[k].clone().multiply(m));
    }
  }
  // hip and ridge caps, upturned corner horns
  const ridgeEnd = HX - HZ;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    const pts = [];
    for (let j = 0; j <= 12; j++) {
      const t = j / 12;
      const i = EAVE_I + t * (HZ - EAVE_I);
      pts.push(new THREE.Vector3(sx * (HX - i), roofY(i) + LIFT * Math.pow(1 - t, 1.5) + 0.06, sz * (HZ - i)));
    }
    put("roof_upper", ridgeTile, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, 0.085, 7, false));
    const c0 = pts[0];
    const diag = new THREE.Vector3(sx, 0, sz).normalize();
    const horn = new THREE.CatmullRomCurve3([
      c0.clone().addScaledVector(diag, -0.25),
      c0.clone().addScaledVector(diag, 0.1).add(new THREE.Vector3(0, 0.04, 0)),
      c0.clone().addScaledVector(diag, 0.26).add(new THREE.Vector3(0, 0.2, 0)),
      c0.clone().addScaledVector(diag, 0.3).add(new THREE.Vector3(0, 0.38, 0)),
    ]);
    put("roof_upper", woodDark, new THREE.TubeGeometry(horn, 12, 0.055, 8, false));
  }
  put("roof_upper", ridgeTile, mbox(2 * ridgeEnd + 0.2, 0.2, 0.32, 1.0), at(null, 0, RIDGE_Y + 0.07, 0));

  // gilt ridge: a boat-shaped trough carrying three gajur and four flowering trees (photo 04)
  const rb = ridgeEnd - 0.1;
  put("roof_upper", gold, mbox(2 * rb + 0.4, 0.1, 0.42, 0.5), at(null, 0, RIDGE_Y + 0.2, 0));
  const boat = new THREE.Shape();
  boat.moveTo(-rb, 0);
  boat.lineTo(rb, 0);
  boat.quadraticCurveTo(rb + 0.26, 0.04, rb + 0.34, 0.42);
  boat.lineTo(rb + 0.24, 0.44);
  boat.quadraticCurveTo(rb + 0.1, 0.22, rb - 0.15, 0.22);
  boat.lineTo(-rb + 0.15, 0.22);
  boat.quadraticCurveTo(-rb - 0.1, 0.22, -rb - 0.24, 0.44);
  boat.lineTo(-rb - 0.34, 0.42);
  boat.quadraticCurveTo(-rb - 0.26, 0.04, -rb, 0);
  boat.closePath();
  const boatGeo = extrude(boat, 0.28, 0.5, 0.015);
  boatGeo.translate(0, 0, -0.14);
  const ridgeBase = RIDGE_Y + 0.25;
  put("roof_upper", gold, boatGeo, at(null, 0, ridgeBase, 0));
  const gajurTop = ridgeBase + 0.2;
  const gajur = [[0.001, 0], [0.2, 0], [0.22, 0.05], [0.13, 0.1], [0.11, 0.13], [0.17, 0.19], [0.22, 0.28], [0.23, 0.36], [0.21, 0.45], [0.14, 0.52], [0.08, 0.55], [0.11, 0.59], [0.06, 0.63], [0.1, 0.67], [0.05, 0.71], [0.09, 0.77], [0.1, 0.83], [0.065, 0.89], [0.035, 0.96], [0.055, 1.0], [0.025, 1.08], [0.032, 1.14], [0.012, 1.32], [0.001, 1.4]];
  for (const [x, sc] of [[-1.5, 1.05], [0, 1.25], [1.5, 1.05]]) {
    put("roof_upper", gold, lathe(gajur, 24, sc), at(null, x, gajurTop, 0));
    for (let p = 0; p < 12; p++) {
      const th = (p / 12) * Math.PI * 2;
      const g = sphereLo.clone();
      g.scale(0.05 * sc, 0.11 * sc, 0.035 * sc);
      put("roof_upper", gold, g, at(null, x + Math.cos(th) * 0.17 * sc, gajurTop + 0.1 * sc, Math.sin(th) * 0.17 * sc, 0, -th + Math.PI / 2, 0).multiply(new THREE.Matrix4().makeRotationX(0.5)));
    }
  }
  const treeH = RIDGE_Y + PIN_H - gajurTop;
  const leafGeo = new THREE.SphereGeometry(1, 8, 6);
  leafGeo.scale(0.17, 0.016, 0.075);
  leafGeo.translate(0.16, 0, 0);
  for (const [x, lean] of [[-2.25, -1], [-0.75, 1], [0.75, -1], [2.25, 1]]) {
    const pts = [];
    for (let j = 0; j <= 8; j++) {
      const t = j / 8;
      pts.push(new THREE.Vector3(x + lean * 0.12 * Math.sin(t * Math.PI * 1.5), gajurTop + t * treeH, 0.03 * Math.sin(t * 7)));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    put("roof_upper", gold, new THREE.TubeGeometry(curve, 24, 0.022, 6, false), null);
    for (let l = 0; l < 10; l++) {
      const t = 0.18 + (l / 10) * 0.7;
      const p = curve.getPoint(t);
      const side = l % 2 ? 1 : -1;
      put("roof_upper", gold, leafGeo, at(null, p.x, p.y, p.z, 0.3 * side, side > 0 ? 0 : Math.PI, 0.5));
    }
    for (const t of [0.42, 0.72, 1]) {
      const p = curve.getPoint(t);
      put("roof_upper", gold, lathe([[0.001, 0], [0.09, 0.02], [0.11, 0.05], [0.06, 0.06], [0.04, 0.1], [0.001, 0.12]], 12, 1.7), at(null, p.x, p.y - 0.05, p.z));
    }
  }

  // carved struts from the wall to the soffit, between the upper windows and on the corners
  const sGeo = new THREE.ExtrudeGeometry(strutShape(), { depth: 0.11, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 });
  sGeo.translate(0, 0, -0.055);
  scaleUV(sGeo, 1 / 0.3);
  // The carved silhouette faces out along the strut's horizontal run.
  const strutAB = (a, c) => {
    const dir = c.clone().sub(a);
    const run = Math.hypot(dir.x, dir.z);
    const tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, dir.y, run).normalize());
    const m = new THREE.Matrix4().makeTranslation(a.x, a.y, a.z)
      .multiply(new THREE.Matrix4().makeRotationY(Math.atan2(dir.x, dir.z)))
      .multiply(new THREE.Matrix4().compose(new THREE.Vector3(), tilt, new THREE.Vector3(1, dir.length(), 1)));
    putI("struts", "strut", sGeo, cScroll, m);
  };
  const strutTo = (k, s, base, topInset) => strutAB(
    new THREE.Vector3(s, base, D(k, WALL_I) + 0.1).applyMatrix4(faceRot[k]),
    new THREE.Vector3(s, roofY(topInset) - 0.3, D(k, topInset)).applyMatrix4(faceRot[k]),
  );
  for (const s of [-5.25, -3.2, -1.26, 1.26, 3.2, 5.25]) { strutTo(0, s, 7.0, 0.7); strutTo(2, s, 7.0, 0.7); }
  for (const s of [-1.8, 1.8]) { strutTo(1, s, 7.0, 0.7); strutTo(3, s, 7.0, 0.7); }
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
    strutAB(
      new THREE.Vector3(sx * (HX - WALL_I + 0.06), 7.0, sz * (HZ - WALL_I + 0.06)),
      new THREE.Vector3(sx * (HX - 0.9), roofY(0.9) - 0.3, sz * (HZ - 0.9)),
    );
  }

  // ---------- stone lions on moulded pedestals, seated upright with curled manes (photos 01-03)
  function addLion(name, s) {
    const d = D(0, 1.05);
    const foot = 0.8;
    fbox(name, 0, stone, 0.72, 0.13, 1.15, s, foot + 0.065, d, 0.8);
    fbox(name, 0, stone, 0.62, 0.22, 1.05, s, foot + 0.24, d, 0.8);
    fbox(name, 0, stone, 0.7, 0.09, 1.12, s, foot + 0.395, d, 0.8);
    const m = at(0, s, foot + 0.44, d - 0.02).multiply(new THREE.Matrix4().makeScale(1.25, 1.25, 1.25));
    const E = (x, y, z, a, bb, c, rx = 0, ry = 0, rz = 0, lo = false, mat = lionStone) => ell(name, mat, m, x, y, z, a, bb, c, rx, ry, rz, lo);
    E(0, 0.24, -0.16, 0.2, 0.22, 0.27);
    for (const sx of [-1, 1]) {
      E(sx * 0.15, 0.2, -0.12, 0.12, 0.2, 0.24);
      E(sx * 0.17, 0.05, 0.06, 0.075, 0.05, 0.13);
      limb(name, lionStone, m, [sx * 0.11, 0.62, 0.1], [sx * 0.11, 0.08, 0.21], 0.066, 0.058);
      E(sx * 0.11, 0.36, 0.15, 0.075, 0.12, 0.075);
      E(sx * 0.11, 0.05, 0.26, 0.085, 0.05, 0.1);
      for (let t = -1; t <= 1; t++) E(sx * 0.11 + t * 0.035, 0.035, 0.34, 0.026, 0.026, 0.03, 0, 0, 0, true);
    }
    E(0, 0.52, -0.02, 0.2, 0.34, 0.2, 0.32);
    E(0, 0.6, 0.1, 0.18, 0.2, 0.15);
    E(0, 0.92, 0.04, 0.27, 0.28, 0.22);
    for (const [R, n, r, z] of [[0.28, 24, 0.048, 0.12], [0.23, 20, 0.044, 0.17], [0.19, 16, 0.04, 0.21]]) {
      for (let a = 0; a < n; a++) {
        const th = (a / n) * Math.PI * 2 + (n % 3) * 0.1;
        const tilt = Math.atan2(R, 0.3);
        E(Math.cos(th) * R, 0.94 + Math.sin(th) * R, z, r, r, r * 0.42, -Math.sin(th) * tilt, Math.cos(th) * tilt, 0, true);
      }
    }
    for (let row = 0; row < 3; row++) for (let c = -2; c <= 2; c++) E(c * 0.07 + (row % 2) * 0.035, 0.72 - row * 0.075, 0.19 - row * 0.02, 0.036, 0.036, 0.016, 0, 0, 0, true);
    E(0, 0.97, 0.21, 0.19, 0.17, 0.16);
    E(0, 1.07, 0.32, 0.15, 0.045, 0.055);
    for (const sx of [-1, 1]) {
      E(sx * 0.064, 1.02, 0.35, 0.036, 0.032, 0.026, 0, 0, 0, true);
      E(sx * 0.075, 0.92, 0.345, 0.058, 0.048, 0.05, 0, 0, 0, true);
      E(sx * 0.16, 1.13, 0.2, 0.05, 0.065, 0.03, 0, 0, 0, true);
    }
    E(0, 0.95, 0.37, 0.095, 0.068, 0.075);
    E(0, 0.985, 0.44, 0.048, 0.032, 0.03, 0, 0, 0, true);
    E(0, 0.87, 0.37, 0.08, 0.032, 0.05, 0, 0, 0, true, lionDark);
    E(0, 0.83, 0.33, 0.085, 0.037, 0.065, 0, 0, 0, true);
    put(name, lionStone, new THREE.TorusGeometry(0.13, 0.035, 8, 16, Math.PI * 1.4), m.clone().multiply(at(null, 0, 0.5, -0.34, 0, Math.PI / 2, 0)));
    const poly = fpoly(0, s - 0.36, s + 0.36, d - 0.62, d + 0.72);
    const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
    const cz = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    buildings.push({
      id: "shiva-" + name, name: "", hero: "", ownMesh: true,
      wall: poly, steps: [], height: +(foot + 1.35).toFixed(3), hole: null, cx, cz,
    });
  }
  addLion("lion_l", -0.46 * halfFront);
  addLion("lion_r", 0.46 * halfFront);

  // ---------- assemble: merge per group and material, warp onto the OSM quad
  const root = new THREE.Group();
  root.name = "ShivaParvati";
  root.position.set(f.x, 0, f.z);
  root.rotation.y = yaw;
  const parentOf = { figure_shiva: "figures", figure_parvati: "figures" };
  const groups = new Map();
  const group = (name) => {
    if (!groups.has(name)) {
      const g = new THREE.Group();
      g.name = name;
      (parentOf[name] ? group(parentOf[name]) : root).add(g);
      groups.set(name, g);
    }
    return groups.get(name);
  };
  for (const name of ["plinth", "stair", ...wallNames, "interior", "figures", "roof_lower", "roof_upper", ...eaveNames, "lion_l", "lion_r"]) group(name);
  let n = 0;
  for (const [name, bag] of bags) {
    for (const [mat, geos] of bag) {
      const merged = mergeGeometries(geos);
      const p = merged.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const [x, z] = warp(p.getX(i), p.getZ(i));
        p.setX(i, x);
        p.setZ(i, z);
      }
      for (const g of geos) g.dispose();
      const mesh = new THREE.Mesh(merged, mat);
      mesh.name = name + "_" + n++;
      mesh.castShadow = name !== "interior";
      mesh.receiveShadow = true;
      group(name).add(mesh);
    }
  }
  for (const { grp, geo, mat, list } of instances.values()) {
    const im = new THREE.InstancedMesh(geo, mat, list.length);
    const e = new THREE.Matrix4();
    list.forEach((m, i) => {
      e.copy(m);
      const [x, z] = warp(e.elements[12], e.elements[14]);
      e.elements[12] = x;
      e.elements[14] = z;
      im.setMatrixAt(i, e);
    });
    im.name = grp;
    im.castShadow = true;
    im.receiveShadow = true;
    im.computeBoundingSphere();
    group(grp).add(im);
  }
  for (const mk of markers) {
    const o = new THREE.Object3D();
    o.name = mk.name;
    o.applyMatrix4(mk.m);
    const [x, z] = warp(o.position.x, o.position.z);
    o.position.set(x, o.position.y, z);
    group(mk.grp).add(o);
  }

  // Contact shadow on the paving round the lowest step.
  const PAD = 1.4;
  const aoTex = canvasTex(256, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    for (let py = 0; py < h; py++) {
      for (let px = 0; px < w; px++) {
        const x = ((px + 0.5) / w * 2 - 1) * (HX + PAD);
        const z = ((py + 0.5) / h * 2 - 1) * (HZ + PAD);
        const out = Math.max(Math.abs(x) - HX, Math.abs(z) - HZ);
        const v = out <= 0 ? 0.5 : 1 - 0.5 * Math.exp(-out / 0.45);
        const i = (py * w + px) * 4;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v * 255;
        img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  });
  aoTex.wrapS = aoTex.wrapT = THREE.ClampToEdgeWrapping;
  const decalGeo = new THREE.PlaneGeometry(2 * (HX + PAD), 2 * (HZ + PAD));
  decalGeo.rotateX(-Math.PI / 2);
  const dp = decalGeo.attributes.position;
  for (let i = 0; i < dp.count; i++) {
    const [x, z] = warp(dp.getX(i), dp.getZ(i));
    dp.setX(i, x);
    dp.setZ(i, z);
  }
  const decal = new THREE.Mesh(decalGeo, new THREE.MeshBasicMaterial({
    map: aoTex, transparent: true, blending: THREE.MultiplyBlending, premultipliedAlpha: true,
    depthWrite: false, toneMapped: false, fog: false, polygonOffset: true, polygonOffsetFactor: -2,
  }));
  decal.name = "ground_ao";
  decal.position.y = 0.015;
  decal.renderOrder = -1;
  root.add(decal);

  scene.add(root);

  // The hip is visual out to the eave. Walkable rings start at the wall, or a filled
  // outer ring would raise the plinth to roof height (floorAt keeps the max).
  const yAt = (inset) => {
    const t = Math.max(0, Math.min(1, (inset - EAVE_I) / (HZ - EAVE_I)));
    return +(EAVE_Y + t * (RIDGE_Y - EAVE_Y)).toFixed(3);
  };
  const ROOF_I0 = WALL_I - 0.05;
  const rings = [];
  for (let t = 0; t <= 0.96; t += 0.12) {
    const inset = +(ROOF_I0 + t * (HZ - ROOF_I0)).toFixed(3);
    rings.push({ i: inset, y: yAt(inset) });
  }
  const ringY = (inset) => {
    let y = 0;
    for (const r of rings) if (r.i <= inset + 1e-4) y = r.y;
    return y;
  };

  b.ownMesh = true;
  b.wall = rect(WALL_I);
  b.height = yAt(WALL_I);
  b.crown = RIDGE_Y + PIN_H;
  b.steps = [
    ...PLINTH.map((s) => ({ poly: rect(s.i), y: s.y })),
    ...rings.map((r) => ({ poly: rect(r.i), y: r.y })),
  ];
  b.hole = null;

  for (let i = holds.length - 1; i >= 0; i--) if (holds[i].id === SHIVA_ID) holds.splice(i, 1);
  const normal = (k) => {
    const th = (k * Math.PI) / 2;
    const nl = [Math.sin(th), Math.cos(th)];
    return [+(nl[0] * ca + nl[1] * sa).toFixed(4), +(-nl[0] * sa + nl[1] * ca).toFixed(4)];
  };
  const hold = (k, s, inset, y, roofTop = false) => {
    const [x, z] = W(...FL(k, s, D(k, inset)));
    const [nx, nz] = normal(k);
    holds.push({ id: SHIVA_ID, x, y: +y.toFixed(3), z, nx, nz, roof: roofTop });
  };
  // 0.3 m inside the wall face, so a player standing on the plinth edge can grab.
  const holdInset = WALL_I + 0.3;
  const landInset = holdInset + 0.75;
  const roofHoldY = ringY(landInset);
  for (let k = 0; k < 4; k++) {
    const half = L(k, holdInset) - 0.35;
    for (let s = -half; s <= half + 0.01; s += 1.15) {
      for (let y = 2.45; y < roofHoldY - 1.15; y += 0.9) hold(k, s, holdInset, y, false);
      hold(k, s, holdInset, roofHoldY - 1.0, false);
      hold(k, s, holdInset, roofHoldY, true);
    }
  }

  const [fx, fz] = normal(0);
  window.__sp = {
    id: SHIVA_ID, x: f.x, z: f.z, yaw, hx: HX, hz: HZ,
    front: { x: fx, z: fz },
    plinth: rect(0),
    eave: rect(EAVE_I),
    plinthTop: PLINTH[3].y,
    eaveY: EAVE_Y,
    ridgeY: RIDGE_Y,
    pinTop: RIDGE_Y + PIN_H,
    face: (k, s, inset) => W(...FL(k, s, D(k, inset))),
    normal,
    ringY,
  };
  return root;
}
