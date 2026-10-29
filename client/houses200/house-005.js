// House 005. Yatkha west face, OSM way 1054191480, edge 0, 10.01 m.
// Spec: research/houses200/005/design.md
// Origin: front-left ground corner. +X along the street toward north, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. x = 0 is south. x = 10 is north.
// The still is pano EoSq0dPaeIi63s-pG4984w, yaw 130. Copy that frame.
// North end: carved sky-blue doors, marigold swags, the Mathema sign.
// South end: a dark doorway, hanging snack strips, a guitar, a madal, instrument posters.
// No shop lighting, no words that are not on the board.
// Surfaces are procedural canvases sampled against ref/yaw_130.jpg: brick #9f685f, door blue #067ea4,
// plaster band #918680. The still is overcast, so every material here takes the OVERCAST light split.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 10.01;
const D = 6.48;
const T = 0.22;

// Round 2: the scene light is overcast now (sky fill doubled, sun halved), so this split is gentler.
const OVERCAST = { dir: 0.6, spec: 0.3, ind: 1.3 };

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

function blob(g, x, y, r, rand, n) {
  g.beginPath();
  const k = n || 7;
  for (let i = 0; i < k; i++) {
    const a = (i / k) * Math.PI * 2;
    const rr = r * (0.55 + rand() * 0.6);
    const px = x + Math.cos(a) * rr;
    const py = y + Math.sin(a) * rr;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
}

// One 2.4 m x 1.2 m tile of Kathmandu brick: 10 bricks a course, 18 courses, running bond.
function brickSet() {
  const w = 1024;
  const h = 512;
  const cols = 10;
  const rows = 18;
  const bw = w / cols;
  const bh = h / rows;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const arm = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const a = arm.getContext("2d");
  const r = rng(5005);
  c.fillStyle = "#7c6e67";
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 14000; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(46,38,34,0.3)" : "rgba(170,160,150,0.22)";
    c.fillRect(r() * w, r() * h, 1.6, 1.6);
  }
  e.fillStyle = "#383838";
  e.fillRect(0, 0, w, h);
  a.fillStyle = "rgb(185,252,0)";
  a.fillRect(0, 0, w, h);
  const pal = [
    [176, 124, 96], [164, 114, 90], [186, 132, 102], [152, 108, 86],
    [190, 140, 110], [140, 100, 80], [172, 122, 98], [188, 130, 96], [160, 116, 94],
  ];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw / 2;
    for (let k = 0; k < cols; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.86 + r() * 0.22;
      let R = p[0] * j;
      let G = p[1] * j;
      let B = p[2] * j;
      const burnt = r() < 0.12;
      const pale = r() < 0.06;
      if (burnt) { R *= 0.6; G *= 0.58; B *= 0.6; }
      if (pale) { R = R * 0.85 + 34; G = G * 0.85 + 30; B = B * 0.85 + 28; }
      const jx = 1.2 + r() * 1.1;
      const jy = 1.0 + r() * 0.9;
      const mott = [];
      for (let q = 0; q < 3; q++) mott.push([r(), r(), r() > 0.5, 0.25 + r() * 0.35]);
      const tilt = (r() - 0.5) * 1.6;
      const nib = [];
      const nn = 3 + Math.floor(r() * 7);
      for (let q = 0; q < nn; q++) {
        const side = Math.floor(r() * 4);
        const t = r();
        nib.push({ side, t, rad: 1.6 + r() * 4.2 });
      }
      const specks = [];
      for (let q = 0; q < 26; q++) specks.push([r(), r(), r() > 0.5, 0.6 + r() * 1.8]);
      const face = 200 + Math.floor(r() * 30);
      for (const dx of [0, -w]) {
        const x0 = k * bw + off + dx + jx;
        const y0 = row * bh + jy;
        const ww = bw - jx * 2;
        const hh = bh - jy * 2 + tilt * 0.3;
        const grad = c.createLinearGradient(0, y0, 0, y0 + hh);
        grad.addColorStop(0, `rgb(${R * 1.05 | 0},${G * 1.05 | 0},${B * 1.05 | 0})`);
        grad.addColorStop(1, `rgb(${R * 0.9 | 0},${G * 0.9 | 0},${B * 0.9 | 0})`);
        c.fillStyle = grad;
        c.fillRect(x0, y0, ww, hh);
        for (const mt of mott) {
          c.fillStyle = mt[2] ? "rgba(80,56,52,0.22)" : "rgba(200,170,160,0.18)";
          c.beginPath();
          c.ellipse(x0 + mt[0] * ww, y0 + mt[1] * hh, ww * mt[3], hh * 0.45, 0, 0, 6.3);
          c.fill();
        }
        e.fillStyle = `rgb(${face - 30},${face - 30},${face - 30})`;
        e.fillRect(x0, y0, ww, hh);
        e.fillStyle = `rgb(${face},${face},${face})`;
        e.fillRect(x0 + 2, y0 + 2, ww - 4, hh - 4);
        a.fillStyle = burnt ? "rgb(255,200,0)" : "rgb(255,222,0)";
        a.fillRect(x0, y0, ww, hh);
        for (const s of specks) {
          c.fillStyle = s[2] ? `rgba(60,38,34,0.35)` : `rgba(210,170,150,0.25)`;
          c.fillRect(x0 + s[0] * ww, y0 + s[1] * hh, s[3], s[3]);
          if (s[2]) {
            e.fillStyle = "rgba(0,0,0,0.25)";
            e.fillRect(x0 + s[0] * ww, y0 + s[1] * hh, s[3], s[3]);
          }
        }
        for (const nb of nib) {
          let px = x0;
          let py = y0;
          if (nb.side === 0) { px = x0 + nb.t * ww; py = y0; }
          if (nb.side === 1) { px = x0 + nb.t * ww; py = y0 + hh; }
          if (nb.side === 2) { px = x0; py = y0 + nb.t * hh; }
          if (nb.side === 3) { px = x0 + ww; py = y0 + nb.t * hh; }
          const rr = rng(Math.floor(nb.t * 1e6) + nb.side);
          c.fillStyle = "#5e524c";
          blob(c, px, py, nb.rad, rr);
          e.fillStyle = "#4a4a4a";
          blob(e, px, py, nb.rad, rng(Math.floor(nb.t * 1e6) + nb.side));
          a.fillStyle = "rgb(200,252,0)";
          blob(a, px, py, nb.rad, rng(Math.floor(nb.t * 1e6) + nb.side));
        }
      }
    }
  }
  const rep = [1 / 2.4, 1 / 1.2];
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 3.2), false, true);
  const rough = toTex(arm, false, true);
  for (const t of [map, nor, rough]) t.repeat.set(rep[0], rep[1]);
  return { diff: map, nor, arm: rough };
}

// Facade-wide multiplier, 160 = neutral. Maps x 0..10.2 m and y 0..9.2 m of the street face.
function makeGrime(midHoles, topHoles) {
  const w = 1024;
  const h = 1024;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(77005);
  const X = (m) => (m / 10.2) * w;
  const Y = (m) => h - (m / 9.2) * h;
  g.fillStyle = "rgb(160,160,160)";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 320; i++) {
    const k = r();
    g.fillStyle = k > 0.55 ? "rgba(70,62,60,0.07)" : k > 0.25 ? "rgba(185,170,155,0.06)" : "rgba(120,100,90,0.08)";
    g.beginPath();
    g.ellipse(r() * w, r() * h, 20 + r() * 90, 12 + r() * 60, r() * 3, 0, 6.3);
    g.fill();
  }
  const patches = [[0.9, 3.55, 1.0, 0.42], [4.8, 6.05, 0.95, 0.38], [0.25, 7.25, 0.8, 0.45], [7.6, 5.75, 0.7, 0.3], [3.2, 2.2, 0.55, 0.5]];
  for (const [px, py, pw, ph] of patches) {
    const bw = 0.24;
    const bh = 0.067;
    for (let yy = 0; yy < ph; yy += bh) {
      const edge = (r() - 0.5) * 0.3;
      const off = (Math.round(yy / bh) % 2) * bw / 2;
      for (let xx = -off; xx < pw + edge; xx += bw) {
        if (yy > ph - bh * 2 && r() < 0.5) continue;
        g.fillStyle = `rgba(${200 + r() * 20 | 0},${150 + r() * 14 | 0},${118 + r() * 14 | 0},0.5)`;
        g.fillRect(X(px + xx), Y(py + yy + bh), X(bw) - 1, (bh / 9.2) * h - 1);
      }
    }
  }
  const bands = [2.86, 5.3, 7.98];
  for (const by of bands) {
    for (let i = 0; i < 70; i++) {
      const x = r() * w;
      const len = (0.25 + r() * 0.75) * (h / 9.2);
      const gr = g.createLinearGradient(0, Y(by), 0, Y(by) + len);
      gr.addColorStop(0, "rgba(46,40,38,0.52)");
      gr.addColorStop(1, "rgba(46,40,38,0)");
      g.fillStyle = gr;
      g.fillRect(x, Y(by), 4 + r() * 26, len);
    }
    const gr = g.createLinearGradient(0, Y(by), 0, Y(by - 0.45));
    gr.addColorStop(0, "rgba(40,34,32,0.62)");
    gr.addColorStop(1, "rgba(40,34,32,0)");
    g.fillStyle = gr;
    g.fillRect(0, Y(by), w, Y(by - 0.45) - Y(by));
  }
  for (const hole of [...midHoles, ...topHoles]) {
    const sill = hole.y - hole.h / 2;
    for (let i = 0; i < 7; i++) {
      const x = X(hole.x - hole.w / 2 + r() * hole.w);
      const len = (0.4 + r() * 1.3) * (h / 9.2);
      const gr = g.createLinearGradient(0, Y(sill), 0, Y(sill) + len);
      gr.addColorStop(0, "rgba(55,48,46,0.5)");
      gr.addColorStop(1, "rgba(55,48,46,0)");
      g.fillStyle = gr;
      g.fillRect(x, Y(sill), 2 + r() * 7, len);
    }
  }
  const damp = 0.72;
  g.beginPath();
  g.moveTo(0, h);
  for (let x = 0; x <= w; x += 8) {
    const top = damp + Math.sin(x * 0.013) * 0.08 + Math.sin(x * 0.051 + 1.3) * 0.04 + (r() - 0.5) * 0.02;
    g.lineTo(x, Y(top));
  }
  g.lineTo(w, h);
  g.closePath();
  const dg = g.createLinearGradient(0, Y(damp + 0.1), 0, h);
  dg.addColorStop(0, "rgba(96,104,92,0.15)");
  dg.addColorStop(0.45, "rgba(80,88,78,0.45)");
  dg.addColorStop(1, "rgba(52,56,50,0.75)");
  g.fillStyle = dg;
  g.fill();
  for (let i = 0; i < 60; i++) {
    g.fillStyle = "rgba(220,218,205,0.14)";
    g.beginPath();
    g.ellipse(r() * w, Y(damp + (r() - 0.3) * 0.18), 6 + r() * 22, 3 + r() * 8, 0, 0, 6.3);
    g.fill();
  }
  for (let i = 0; i < 500; i++) {
    g.fillStyle = "rgba(60,50,44,0.25)";
    g.fillRect(r() * w, Y(r() * 0.45), 1 + r() * 3, 1 + r() * 3);
  }
  const t = toTex(c, false, false);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  return t;
}

// Old lime wash on the front brick, house-local like the grime: white = lime. Round 2 against yaw_130.jpg:
// a ragged lime head over the pier and runs under the two plaster bands. Round patches read as polka dots.
function makeWash() {
  const w = 1024;
  const h = 1024;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(51005);
  const X = (m) => (m / 10.2) * w;
  const Y = (m) => h - (m / 9.2) * h;
  g.fillStyle = "#000";
  g.fillRect(0, 0, w, h);
  g.beginPath();
  g.moveTo(X(1.78), Y(2.3));
  for (let x = 1.78; x <= 3.32; x += 0.06) g.lineTo(X(x), Y(3.05 - r() * 0.1));
  g.lineTo(X(3.32), Y(2.3));
  g.closePath();
  g.fillStyle = "rgba(255,255,255,0.6)";
  g.fill();
  for (const band of [3.05, 5.45]) {
    for (let i = 0; i < 70; i++) {
      const x = X(r() * 10.2);
      const len = (0.05 + r() * r() * 0.4) * h / 9.2;
      const gr = g.createLinearGradient(0, Y(band), 0, Y(band) + len);
      gr.addColorStop(0, "rgba(255,255,255," + (0.25 + r() * 0.35).toFixed(2) + ")");
      gr.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = gr;
      g.fillRect(x, Y(band), 2 + r() * 9, len);
    }
  }
  const t = toTex(c, false, false);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  return t;
}

// Old sky-blue paint over grey primer and timber, one metre square, tileable.
function paintSet() {
  const w = 512;
  const h = 512;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const arm = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const a = arm.getContext("2d");
  const r = rng(9005);
  c.fillStyle = "#0e9cc4";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#c0c0c0";
  e.fillRect(0, 0, w, h);
  a.fillStyle = "rgb(255,150,0)";
  a.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) {
    const x = r() * w;
    const y = r() * h;
    const len = 30 + r() * 240;
    const dark = r() < 0.5;
    c.fillStyle = dark ? `rgba(0,70,110,0.07)` : `rgba(140,215,240,0.06)`;
    for (const dy of [0, -h]) c.fillRect(x, y + dy, 1 + r() * 2.5, len);
    e.fillStyle = dark ? "rgba(0,0,0,0.05)" : "rgba(255,255,255,0.05)";
    e.fillRect(x, y, 1.5, len);
  }
  for (let i = 0; i < 7; i++) {
    c.fillStyle = r() < 0.5 ? "rgba(10,118,168,0.28)" : "rgba(70,170,205,0.22)";
    const x = r() * w;
    const y = r() * h;
    const pw = 60 + r() * 140;
    const ph = 40 + r() * 200;
    for (const dx of [0, -w]) for (const dy of [0, -h]) c.fillRect(x + dx, y + dy, pw, ph);
  }
  for (let i = 0; i < 46; i++) {
    c.fillStyle = "rgba(20,40,45,0.07)";
    c.beginPath();
    c.ellipse(r() * w, r() * h, 20 + r() * 60, 10 + r() * 40, r() * 3, 0, 6.3);
    c.fill();
  }
  for (let i = 0; i < 28; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 1.2 + Math.pow(r(), 3) * 7;
    const seed = Math.floor(r() * 1e9);
    const wood = r() < 0.45;
    for (const dx of [0, -w, w]) {
      for (const dy of [0, -h, h]) {
        c.fillStyle = "#9cb9bd";
        blob(c, x + dx, y + dy, rad * 1.35, rng(seed));
        e.fillStyle = "#909090";
        blob(e, x + dx, y + dy, rad * 1.35, rng(seed));
        a.fillStyle = "rgb(255,220,0)";
        blob(a, x + dx, y + dy, rad * 1.35, rng(seed));
        if (wood) {
          c.fillStyle = "#6b5745";
          blob(c, x + dx, y + dy, rad, rng(seed + 1));
          e.fillStyle = "#5a5a5a";
          blob(e, x + dx, y + dy, rad, rng(seed + 1));
          a.fillStyle = "rgb(235,245,0)";
          blob(a, x + dx, y + dy, rad, rng(seed + 1));
        }
      }
    }
  }
  return { col, hei, arm };
}

function paintMaps(ps) {
  const map = toTex(ps.col, true, true);
  const nor = toTex(normalFromHeight(ps.hei, 2.6), false, true);
  const rough = toTex(ps.arm, false, true);
  return { diff: map, nor, arm: rough };
}

// One arched opening: a pair of panelled leaves, 1.38 m x 2.6 m, as in ref yaw_130.
function doorSet(ps) {
  const w = 512;
  const h = 964;
  const ppm = w / 1.38;
  const Y = (m) => h - m * ppm;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const arm = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const a = arm.getContext("2d");
  const r = rng(3005);
  for (let x = 0; x < w; x += ppm) {
    for (let y = 0; y < h; y += ppm) {
      c.drawImage(ps.col, x, y, ppm, ppm);
      a.drawImage(ps.arm, x, y, ppm, ppm);
      e.drawImage(ps.hei, x, y, ppm, ppm);
    }
  }
  e.fillStyle = "rgba(150,150,150,0.75)";
  e.fillRect(0, 0, w, h);
  const m = 0.06 * ppm;
  e.fillStyle = "#d2d2d2";
  e.fillRect(0, 0, m, h);
  e.fillRect(w - m, 0, m, h);
  e.fillRect(0, 0, w, m);
  c.fillStyle = "rgba(0,40,60,0.18)";
  c.fillRect(m - 3, m, 3, h);
  c.fillRect(w - m, m, 3, h);
  const spring = 1.98;
  const apex = 2.46;
  const ax0 = m + 14;
  const ax1 = w - m - 14;
  const archPath = (ctx) => {
    ctx.beginPath();
    ctx.moveTo(ax0, Y(spring));
    ctx.bezierCurveTo(ax0, Y(apex + 0.06), ax1, Y(apex + 0.06), ax1, Y(spring));
  };
  e.fillStyle = "#6e6e6e";
  archPath(e);
  e.closePath();
  e.fill();
  c.fillStyle = "rgba(0,50,80,0.16)";
  archPath(c);
  c.closePath();
  c.fill();
  e.strokeStyle = "#e4e4e4";
  e.lineWidth = 13;
  archPath(e);
  e.stroke();
  c.strokeStyle = "rgba(0,35,55,0.6)";
  c.lineWidth = 5;
  c.save();
  c.translate(0, 7);
  archPath(c);
  c.stroke();
  c.restore();
  c.strokeStyle = "rgba(170,230,250,0.18)";
  c.lineWidth = 3;
  c.save();
  c.translate(0, -6);
  archPath(c);
  c.stroke();
  c.restore();
  for (const sx of [ax0, ax1]) {
    e.fillStyle = "#e0e0e0";
    e.beginPath();
    e.arc(sx, Y(spring) - 4, 11, 0, 6.3);
    e.fill();
    c.fillStyle = "rgba(0,35,55,0.3)";
    c.beginPath();
    c.arc(sx + 2, Y(spring) - 1, 11, 0, 6.3);
    c.fill();
  }
  const mid = w / 2;
  e.fillStyle = "#dadada";
  e.fillRect(mid - 12, m, 14, h - m);
  e.fillStyle = "#303030";
  e.fillRect(mid + 2, m, 3, h - m);
  c.fillStyle = "rgba(0,20,30,0.55)";
  c.fillRect(mid + 2, m, 3, h - m);
  const rows = [[0.16, 0.82], [0.96, 1.52], [1.66, 1.92]];
  const inset = 0.075 * ppm;
  for (const [l0, l1] of [[m, mid - 12], [mid + 5, w - m]]) {
    for (const [y0, y1] of rows) {
      const px0 = l0 + inset;
      const px1 = l1 - inset;
      const py0 = Y(y1);
      const py1 = Y(y0);
      e.fillStyle = "#828282";
      e.fillRect(px0, py0, px1 - px0, py1 - py0);
      e.fillStyle = "#6a6a6a";
      e.fillRect(px0 + 7, py0 + 7, px1 - px0 - 14, py1 - py0 - 14);
      c.fillStyle = "rgba(0,30,45,0.1)";
      c.fillRect(px0, py0, px1 - px0, py1 - py0);
      c.fillStyle = "rgba(0,30,45,0.55)";
      c.fillRect(px0, py0, px1 - px0, 7);
      c.fillStyle = "rgba(0,30,45,0.35)";
      c.fillRect(px0, py0, 6, py1 - py0);
      c.fillStyle = "rgba(190,240,255,0.2)";
      c.fillRect(px0, py1 - 5, px1 - px0, 5);
      c.fillRect(px1 - 4, py0, 4, py1 - py0);
      a.fillStyle = "rgba(205,160,0,0.6)";
      a.fillRect(px0, py0, px1 - px0, 6);
    }
  }
  for (let i = 0; i < 22; i++) {
    const low = r() < 0.65;
    const x = low ? r() * w : (r() < 0.5 ? mid + (r() - 0.5) * 30 : (r() < 0.5 ? m + r() * 14 : w - m - r() * 14));
    const y = low ? Y(r() * 0.4) : r() * h;
    const rad = 1.5 + Math.pow(r(), 3) * 9;
    const seed = Math.floor(r() * 1e9);
    c.fillStyle = "#9cb9bd";
    blob(c, x, y, rad * 1.3, rng(seed));
    c.fillStyle = "#5f4c3c";
    blob(c, x, y, rad, rng(seed + 1));
    e.fillStyle = "#4c4c4c";
    blob(e, x, y, rad, rng(seed + 1));
    a.fillStyle = "rgb(235,245,0)";
    blob(a, x, y, rad, rng(seed + 1));
  }
  const foot = c.createLinearGradient(0, Y(0.5), 0, h);
  foot.addColorStop(0, "rgba(40,48,44,0)");
  foot.addColorStop(1, "rgba(40,48,44,0.55)");
  c.fillStyle = foot;
  c.fillRect(0, Y(0.5), w, h - Y(0.5));
  for (let i = 0; i < 40; i++) {
    const x = r() * w;
    const y = r() * h * 0.7;
    const len = 40 + r() * 220;
    const gr = c.createLinearGradient(0, y, 0, y + len);
    gr.addColorStop(0, "rgba(10,40,50,0.18)");
    gr.addColorStop(1, "rgba(10,40,50,0)");
    c.fillStyle = gr;
    c.fillRect(x, y, 2 + r() * 4, len);
  }
  const top = c.createLinearGradient(0, 0, 0, Y(1.6));
  top.addColorStop(0, "rgba(220,245,250,0.1)");
  top.addColorStop(1, "rgba(220,245,250,0)");
  c.fillStyle = top;
  c.fillRect(0, 0, w, Y(1.6));
  const map = toTex(col, true, false);
  const nor = toTex(normalFromHeight(hei, 3.0), false, false);
  const rough = toTex(arm, false, false);
  return { diff: map, nor, arm: rough };
}

// Dried marigold rope: one 0.12 m tile along the strand, wrapped around it.
function marigoldSet() {
  const w = 256;
  const h = 96;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const r = rng(4405);
  c.fillStyle = "#4a3418";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#202020";
  e.fillRect(0, 0, w, h);
  const tones = ["#c98a3a", "#b8742a", "#d9a04a", "#a6662a", "#c07a30", "#8e5a26", "#d88f2c"];
  for (let i = 0; i < 90; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 9 + r() * 10;
    const tone = tones[Math.floor(r() * tones.length)];
    for (const dx of [0, -w, w]) {
      for (const dy of [0, -h, h]) {
        const gr = c.createRadialGradient(x + dx, y + dy, 1, x + dx, y + dy, rad);
        gr.addColorStop(0, "#5a3a16");
        gr.addColorStop(0.25, tone);
        gr.addColorStop(0.85, tone);
        gr.addColorStop(1, "rgba(60,40,20,0)");
        c.fillStyle = gr;
        c.beginPath();
        c.arc(x + dx, y + dy, rad, 0, 6.3);
        c.fill();
        const ge = e.createRadialGradient(x + dx, y + dy, 1, x + dx, y + dy, rad);
        ge.addColorStop(0, "rgba(230,230,230,1)");
        ge.addColorStop(1, "rgba(40,40,40,0)");
        e.fillStyle = ge;
        e.beginPath();
        e.arc(x + dx, y + dy, rad, 0, 6.3);
        e.fill();
      }
    }
  }
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 4.0), false, true);
  return { diff: map, nor };
}

// Snack sachet strips: 8 columns of chained packets; 1024 px tall = 1.6 m.
function snackAtlas() {
  const w = 512;
  const h = 1024;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(6605);
  g.fillStyle = "#222";
  g.fillRect(0, 0, w, h);
  const mixed = [["#d42a2a", "#ffd23a"], ["#1d4fa8", "#f4f4f0"], ["#f2efe6", "#d12a2a"], ["#f2c12e", "#c4271f"],
    ["#ef7d1a", "#2a7a3a"], ["#6a2a8a", "#ffd23a"], ["#2a9a4a", "#f4f4f0"], ["#c0182a", "#1d4fa8"]];
  const green = [["#9ad12a", "#f2d22e"], ["#73b82a", "#e8352a"], ["#f2d22e", "#2a8a3a"], ["#d93a2a", "#f5f0e0"], ["#a8d832", "#1d4fa8"]];
  for (let col = 0; col < 8; col++) {
    const pal = col >= 5 ? green : mixed;
    const x0 = col * 64 + 2;
    let y = 0;
    while (y < h) {
      const ph = col >= 5 ? 72 + r() * 34 : 44 + r() * 26;
      const [a, b] = pal[Math.floor(r() * pal.length)];
      g.fillStyle = a;
      g.fillRect(x0, y + 2, 60, ph - 4);
      g.fillStyle = b;
      g.fillRect(x0, y + ph * (0.35 + r() * 0.15), 60, ph * 0.22);
      g.fillStyle = r() < 0.5 ? "#f6f2e8" : b;
      g.beginPath();
      g.ellipse(x0 + 30, y + ph * 0.3, 16, ph * 0.12, 0, 0, 6.3);
      g.fill();
      g.fillStyle = "rgba(20,20,20,0.55)";
      for (let k = 0; k < 4; k++) g.fillRect(x0 + 10 + r() * 36, y + ph * (0.65 + k * 0.06), 6 + r() * 14, 2);
      g.strokeStyle = "rgba(20,15,10,0.5)";
      g.lineWidth = 1;
      for (const yy of [y + 4, y + ph - 6]) {
        g.beginPath();
        for (let xx = 0; xx <= 60; xx += 4) g.lineTo(x0 + xx, yy + ((xx / 4) % 2) * 3);
        g.stroke();
      }
      const sh = g.createLinearGradient(x0, 0, x0 + 60, 0);
      sh.addColorStop(0, "rgba(0,0,0,0.3)");
      sh.addColorStop(0.3, "rgba(255,255,255,0.22)");
      sh.addColorStop(0.45, "rgba(255,255,255,0)");
      sh.addColorStop(1, "rgba(0,0,0,0.35)");
      g.fillStyle = sh;
      g.fillRect(x0, y + 2, 60, ph - 4);
      y += ph;
    }
  }
  const t = toTex(c, true, false);
  return t;
}

function instrumentPoster() {
  return canvasTex((g, w, h) => {
    const r = rng(1105);
    g.fillStyle = "#eeebe2";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#3d6fb0";
    g.fillRect(0, 0, w, 12);
    g.fillStyle = "rgba(70,70,70,0.55)";
    for (let i = 0; i < 3; i++) g.fillRect(w * 0.3 + i * 70, 24, 52, 5);
    const gx = 40;
    for (let i = 0; i < 6; i++) {
      const x = gx + i * 17;
      g.fillStyle = i % 2 ? "#3a3f4a" : "#5a6b84";
      g.beginPath();
      g.ellipse(x, 120, 7, 12, 0, 0, 6.3);
      g.fill();
      g.fillRect(x - 1.5, 62, 3, 50);
    }
    g.fillStyle = "#6c7a86";
    g.fillRect(160, 58, 40, 26);
    g.fillStyle = "#4a3a30";
    g.fillRect(250, 60, 46, 34);
    g.strokeStyle = "#444";
    g.lineWidth = 1.5;
    for (let i = 0; i < 14; i++) {
      const x = 30 + r() * (w - 120);
      const y = 140 + r() * (h - 170);
      g.strokeRect(x, y, 10 + r() * 26, 8 + r() * 16);
    }
    for (let i = 0; i < 6; i++) {
      g.fillStyle = "#555";
      g.beginPath();
      g.ellipse(80 + i * 34, 190, 7, 11, 0.4, 0, 6.3);
      g.fill();
    }
    g.fillStyle = "#c8b8a8";
    g.beginPath();
    g.ellipse(w - 40, 60, 18, 24, 0, 0, 6.3);
    g.fill();
    g.fillStyle = "#3a302a";
    g.fillRect(w - 58, 84, 36, 56);
    g.fillStyle = "rgba(70,70,70,0.4)";
    for (let i = 0; i < 9; i++) g.fillRect(30 + r() * (w - 100), 150 + r() * 60, 20 + r() * 40, 3);
    ageSheet(g, w, h, r);
  }, 360, 240);
}

function producePoster() {
  return canvasTex((g, w, h) => {
    const r = rng(2205);
    g.fillStyle = "#f2efe6";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#c22a2a";
    for (const yy of [22, 52]) {
      g.fillRect(14, yy, w - 28, 4);
      for (let x = 18; x < w - 18; x += 9 + r() * 6) g.fillRect(x, yy, 3, 10 + r() * 10);
    }
    const foods = ["#c76a2a", "#7a9a2a", "#e0b040", "#8a4a2a", "#d8d0b0", "#e07a20", "#5a7a3a"];
    for (let i = 0; i < 14; i++) {
      g.fillStyle = foods[i % foods.length];
      const x = 26 + (i % 3) * 52 + r() * 8;
      const y = 92 + Math.floor(i / 3) * 46 + r() * 8;
      g.beginPath();
      g.ellipse(x, y, 14 + r() * 6, 10 + r() * 5, r(), 0, 6.3);
      g.fill();
    }
    ageSheet(g, w, h, r);
  }, 180, 320);
}

function ageSheet(g, w, h, r) {
  g.fillStyle = "rgba(236,222,190,0.28)";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) {
    const gr = g.createRadialGradient(0, 0, 2, 0, 0, 30 + r() * 40);
    gr.addColorStop(0, "rgba(170,140,90,0.0)");
    gr.addColorStop(0.8, "rgba(170,140,90,0.18)");
    gr.addColorStop(1, "rgba(170,140,90,0)");
    g.save();
    g.translate(r() * w, r() * h);
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, 0, 70, 0, 6.3);
    g.fill();
    g.restore();
  }
  const edge = g.createLinearGradient(0, h * 0.75, 0, h);
  edge.addColorStop(0, "rgba(90,70,50,0)");
  edge.addColorStop(1, "rgba(90,70,50,0.3)");
  g.fillStyle = edge;
  g.fillRect(0, h * 0.75, w, h * 0.25);
  g.strokeStyle = "rgba(80,70,60,0.35)";
  g.lineWidth = 3;
  g.strokeRect(1, 1, w - 2, h - 2);
}

function signTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f7f4ee";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#1a3f86";
    g.lineWidth = 10;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.strokeStyle = "#1a3f86";
    g.lineWidth = 3;
    g.strokeRect(18, 18, w - 36, h - 36);
    g.fillStyle = "#1a1a1a";
    g.font = "500 22px Georgia, Times, serif";
    g.textAlign = "center";
    g.fillText("Binaya Kumar Mathema", w / 2, 48);
    g.fillStyle = "#8d1d2a";
    g.font = "italic 700 54px Georgia, Times, serif";
    g.fillText("B. K. M.", w / 2, 118);
    g.fillStyle = "#141414";
    g.font = "italic 700 60px Georgia, Times, serif";
    g.fillText("ENTERPRISES", w / 2, 186);
    g.fillStyle = "#222";
    g.font = "500 22px Georgia, Times, serif";
    g.fillText("Pyaphal Tole, Kathmandu, Nepal", w / 2, 230);
    g.fillText("Mob. No. 9841149328", w / 2, 262);
    const dirt = g.createLinearGradient(0, h * 0.6, 0, h);
    dirt.addColorStop(0, "rgba(90,80,70,0)");
    dirt.addColorStop(1, "rgba(90,80,70,0.16)");
    g.fillStyle = dirt;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(120,105,90,0.08)";
    g.fillRect(0, 0, w, h);
  }, 1024, 320);
}

function guitarSet(body) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.32);
  s.bezierCurveTo(0.13, -0.32, 0.2, -0.25, 0.2, -0.13);
  s.bezierCurveTo(0.2, -0.03, 0.12, -0.01, 0.12, 0.04);
  s.bezierCurveTo(0.12, 0.08, 0.155, 0.1, 0.155, 0.16);
  s.bezierCurveTo(0.155, 0.24, 0.09, 0.27, 0.03, 0.27);
  s.lineTo(0.026, 0.27);
  s.lineTo(0.026, 0.72);
  s.lineTo(0.042, 0.74);
  s.lineTo(0.042, 0.92);
  s.lineTo(-0.042, 0.92);
  s.lineTo(-0.042, 0.74);
  s.lineTo(-0.026, 0.72);
  s.lineTo(-0.026, 0.27);
  s.lineTo(-0.03, 0.27);
  s.bezierCurveTo(-0.09, 0.27, -0.155, 0.24, -0.155, 0.16);
  s.bezierCurveTo(-0.155, 0.1, -0.12, 0.08, -0.12, 0.04);
  s.bezierCurveTo(-0.12, -0.01, -0.2, -0.03, -0.2, -0.13);
  s.bezierCurveTo(-0.2, -0.25, -0.13, -0.32, 0, -0.32);
  const geo = new THREE.ShapeGeometry(s, 14);
  const minx = -0.2;
  const maxx = 0.2;
  const miny = -0.32;
  const maxy = 0.92;
  const uv = geo.attributes.uv;
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) - minx) / (maxx - minx), (p.getY(i) - miny) / (maxy - miny));
  const tw = 256;
  const th = Math.round(tw * (maxy - miny) / (maxx - minx));
  const map = canvasTex((g) => {
    const X = (x) => ((x - minx) / (maxx - minx)) * tw;
    const Y = (y) => (1 - (y - miny) / (maxy - miny)) * th;
    const gr = g.createRadialGradient(X(0), Y(-0.08), 4, X(0), Y(-0.08), tw * 0.55);
    gr.addColorStop(0, body[0]);
    gr.addColorStop(0.6, body[1]);
    gr.addColorStop(1, body[2]);
    g.fillStyle = gr;
    g.fillRect(0, 0, tw, th);
    g.strokeStyle = "rgba(225,215,195,0.8)";
    g.lineWidth = 3;
    g.beginPath();
    const pts = s.getPoints(20);
    pts.forEach((q, i) => (i ? g.lineTo(X(q.x), Y(q.y)) : g.moveTo(X(q.x), Y(q.y))));
    g.stroke();
    g.fillStyle = "#2a1a10";
    g.fillRect(X(-0.026), Y(0.74), X(0.026) - X(-0.026), Y(0.2) - Y(0.74));
    g.fillStyle = "#3a2618";
    g.fillRect(X(-0.042), Y(0.92), X(0.042) - X(-0.042), Y(0.74) - Y(0.92));
    g.fillStyle = "rgba(200,200,190,0.7)";
    for (let i = 0; i < 12; i++) {
      const fy = 0.72 - i * 0.034;
      g.fillRect(X(-0.026), Y(fy), X(0.026) - X(-0.026), 1);
    }
    g.fillStyle = "#0c0806";
    g.beginPath();
    g.arc(X(0), Y(0.1), (0.045 / (maxx - minx)) * tw, 0, 6.3);
    g.fill();
    g.strokeStyle = "rgba(220,200,160,0.7)";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(X(0), Y(0.1), (0.055 / (maxx - minx)) * tw, 0, 6.3);
    g.stroke();
    g.fillStyle = "#1c120c";
    g.fillRect(X(-0.07), Y(-0.15), X(0.07) - X(-0.07), 9);
    g.strokeStyle = "rgba(230,225,210,0.6)";
    g.lineWidth = 1;
    for (let i = 0; i < 6; i++) {
      const x = -0.016 + i * 0.0064;
      g.beginPath();
      g.moveTo(X(x * 1.6), Y(-0.15));
      g.lineTo(X(x), Y(0.9));
      g.stroke();
    }
    g.fillStyle = "rgba(255,255,255,0.08)";
    g.beginPath();
    g.ellipse(X(-0.08), Y(-0.12), 18, 40, -0.3, 0, 6.3);
    g.fill();
  }, tw, th);
  return { geo, map };
}

function madalMaps() {
  const body = canvasTex((g, w, h) => {
    const r = rng(8805);
    g.fillStyle = "#7a1e1c";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) {
      g.fillStyle = r() < 0.5 ? "rgba(40,10,8,0.18)" : "rgba(170,70,60,0.12)";
      g.fillRect(r() * w, r() * h, 1 + r() * 3, 6 + r() * 20);
    }
    g.strokeStyle = "#c4b08a";
    g.lineWidth = 2.5;
    const n = 9;
    g.beginPath();
    for (let k = 0; k <= n; k++) {
      const x = (k / n) * w;
      g.moveTo(x, 0);
      g.lineTo(x + w / n / 2, h);
      g.lineTo(x + w / n, 0);
    }
    g.stroke();
    g.fillStyle = "#2a1410";
    g.fillRect(0, 0, w, 9);
    g.fillRect(0, h - 9, w, 9);
  }, 256, 128);
  body.wrapS = THREE.RepeatWrapping;
  const head = canvasTex((g, w, h) => {
    g.fillStyle = "#3a2216";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#d4c49e";
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.44, 0, 6.3);
    g.fill();
    g.fillStyle = "#16120f";
    g.beginPath();
    g.arc(w / 2, h / 2, w * 0.17, 0, 6.3);
    g.fill();
  }, 128, 128);
  return { body, head };
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  float rec = smoothstep(0.02, 0.38, p.z) * (1.0 - step(1.3, p.z));
  ao *= 1.0 - 0.6 * rec;
  if (p.z < 0.7) {
    ao *= 1.0 - 0.32 * smoothstep(0.55, 0.0, 2.88 - p.y) * step(0.0, 2.88 - p.y);
    ao *= 1.0 - 0.26 * smoothstep(0.45, 0.0, 5.33 - p.y) * step(0.0, 5.33 - p.y);
    ao *= 1.0 - 0.5 * smoothstep(1.1, 0.0, 8.12 - p.y) * step(0.0, 8.12 - p.y);
  }
  ao *= 0.7 + 0.3 * smoothstep(0.0, 0.55, p.y);
  return ao;
}
`;

const GRIME_GLSL = `
float gax = abs(vHouseN.x);
float gay = abs(vHouseN.y);
float gaz = abs(vHouseN.z);
float gu = (gax > gaz && gax > gay) ? clamp(vHousePos.z / 6.6, 0.0, 1.0) : clamp(vHousePos.x / 10.2, 0.0, 1.0);
float gv = clamp(vHousePos.y / 9.2, 0.0, 1.0);
float gwash = (gaz > gax && gaz > gay) ? texture2D(washMap, vec2(gu, gv)).r : 0.0;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.84, 0.8, 0.72), gwash * 0.85);
diffuseColor.rgb *= texture2D(grimeMap, vec2(gu, gv)).rgb * 1.6;
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.5 + 0.5 * hao);
reflectedLight.directSpecular *= ${OVERCAST.spec.toFixed(3)} * hao;
reflectedLight.indirectDiffuse *= ${OVERCAST.ind.toFixed(3)} * hao;
reflectedLight.indirectSpecular *= hao;
`;

function houseShader(mat, key, grime) {
  mat.onBeforeCompile = (shader) => {
    if (grime) shader.uniforms.grimeMap = { value: grime };
    if (grime) shader.uniforms.washMap = { value: grime.userData.wash };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + (grime ? "uniform sampler2D grimeMap;\nuniform sampler2D washMap;\n" : "") + AO_GLSL);
    if (grime) frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\n" + GRIME_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house005-opus-" + key; };
  return mat;
}

function pbr(maps, color, opts) {
  const o = opts || {};
  const m = new THREE.MeshStandardMaterial({
    color,
    map: maps.diff || null,
    normalMap: maps.nor || null,
    roughnessMap: maps.arm || null,
    aoMap: maps.arm || null,
    metalnessMap: o.metal ? maps.arm : null,
    roughness: o.rough == null ? 1 : o.rough,
    metalness: o.metal ? 1 : 0,
    aoMapIntensity: o.ao == null ? 0.35 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.35 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.85 : o.ns, o.ns == null ? 0.85 : o.ns);
  return m;
}

// Brick courses must run unbroken across the wall cells cut around the openings.
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
    const k = 0.9 + 0.1 * hash(x * 1.7, y * 1.3, z * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse005() {
  const root = new THREE.Group();
  root.name = "house-005";

  const groundHoles = [
    { x: 1.35, y: 1.18, w: 0.78, h: 2.2 },
    { x: 3.55, y: 1.16, w: 0.5, h: 2.05 },
    { x: 7.1, y: 1.32, w: 5.6, h: 2.6 },
  ];
  const midHoles = [
    { x: 2.15, y: 4.5, w: 0.78, h: 1.05 },
    { x: 6.15, y: 4.42, w: 0.62, h: 0.86 },
    { x: 8.45, y: 4.42, w: 0.7, h: 0.94 },
  ];
  const topHoles = [
    { x: 3.2, y: 6.62, w: 0.56, h: 0.8 },
    { x: 6.1, y: 6.62, w: 0.56, h: 0.8 },
    { x: 8.35, y: 6.62, w: 0.56, h: 0.8 },
  ];

  const grimeTex = makeGrime(midHoles, topHoles);
  grimeTex.userData.wash = makeWash();
  const brickMaps = brickSet();
  const ps = paintSet();
  const paint = paintMaps(ps);
  const door = doorSet(ps);
  const mari = marigoldSet();
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.2, 0.4),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.2, 0.4),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.2, 0.4),
  };
  const plasterMaps = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 0.6, 0.6),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 0.6, 0.6),
    arm: tex("concrete_wall_001_arm.jpg", false, 0.6, 0.6),
  };
  const mats = {
    brick: pbr(brickMaps, 0xffffff, { ao: 0.55, ns: 1.0, env: 0.25 }),
    brickDark: pbr(brickMaps, 0xd8d0c8, { ao: 0.55, ns: 1.0, env: 0.25 }),
    wood: pbr(woodMaps, 0x8a7568, { ao: 0.28 }),
    woodDark: pbr(woodMaps, 0x4a382c, { ao: 0.3 }),
    blue: pbr(paint, 0xc4dce0, { ao: 0.3, ns: 0.8, env: 0.3 }),
    blueDark: pbr(paint, 0x7a9a98, { ao: 0.3, ns: 0.8, env: 0.3 }),
    door: pbr(door, 0xc4dce0, { ao: 0.4, ns: 1.0, env: 0.3 }),
    timber: pbr(woodMaps, 0x7a6a5c, { ao: 0.3 }),
    plaster: pbr(plasterMaps, 0xd2c9c1, { ao: 0.4, ns: 0.9, env: 0.2 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x4c5350, roughness: 0.6, metalness: 0, transparent: true, opacity: 0.93, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0e0a09, roughness: 0.95, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.55, metalness: 0, vertexColors: true }),
    garland: new THREE.MeshStandardMaterial({ map: mari.diff, normalMap: mari.nor, color: 0xdcc6a6, roughness: 0.92, metalness: 0, vertexColors: true }),
    snack: new THREE.MeshStandardMaterial({ map: snackAtlas(), roughness: 0.42, metalness: 0.12, side: THREE.DoubleSide, vertexColors: true }),
    concrete: pbr(plasterMaps, 0x9a9088, { ao: 0.28 }),
    rust: pbr({
      diff: tex("rusty_metal_Diffuse.jpg", true, 2.2, 0.5),
      nor: tex("rusty_metal_nor_gl.jpg", false, 2.2, 0.5),
      arm: tex("rusty_metal_arm.jpg", false, 2.2, 0.5),
    }, 0xffffff, { ao: 0.3, metal: true }),
  };
  for (const [name, mat] of Object.entries(mats)) {
    houseShader(mat, name, name === "brick" || name === "brickDark" ? grimeTex : null);
  }

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "brick" || name === "brickDark" || name === "plaster") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }
  function looseMesh(geo, mat, key) {
    houseShader(mat, key, null);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
    return mesh;
  }

  function plasterBand(y) {
    addBox("plaster", W + 0.1, 0.13, 0.12, W / 2, y, -0.06);
    addBox("plaster", W + 0.14, 0.05, 0.16, W / 2, y + 0.085, -0.08, [1.04, 1.03, 1.02]);
    addBox("plaster", W + 0.06, 0.06, 0.08, W / 2, y - 0.09, -0.04, [0.86, 0.84, 0.82]);
  }
  function eaveBrackets(y) {
    for (let i = 0; i < 9; i++) {
      const x = 0.45 + i * 1.14;
      addBox("woodDark", 0.09, 0.32, 0.1, x, y - 0.2, -0.16, [0.42, 0.34, 0.26]);
      addBox("wood", 0.08, 0.08, 0.46, x, y - 0.34, -0.36, [0.48, 0.38, 0.28]);
    }
  }

  wallZ("brick", 0, W, 0, 3.05, 0, groundHoles);
  plasterBand(2.96);
  wallZ("brick", 0, W, 3.15, 5.45, 0, midHoles);
  plasterBand(5.42);
  wallZ("brick", 0, W, 5.55, 8.15, 0, topHoles);
  addBox("timber", W + 0.1, 0.14, 0.62, W / 2, 8.22, -0.2, [0.82, 0.76, 0.68]);
  eaveBrackets(8.22);
  addBox("woodDark", W + 0.3, 0.08, 0.22, W / 2, 8.4, -0.7, [0.35, 0.3, 0.24]);
  addBox("concrete", 5.6, 0.06, 0.2, 7.1, 0.03, -0.06, [0.8, 0.78, 0.76]);

  addBox("brick", T, 9.15, D, T / 2, 4.55, D / 2);
  addBox("brick", T, 9.15, D, W - T / 2, 4.55, D / 2);
  addBox("brickDark", W, 9.15, T, W / 2, 4.55, D - T / 2);
  addBox("concrete", W - 0.4, 0.14, D - 0.5, W / 2, 8.72, D / 2 + 0.1);
  addBox("rust", W - 0.8, 0.035, D - 1.4, W / 2, 8.84, D / 2 + 0.35);
  addBox("concrete", 0.7, 0.85, 0.55, 7.4, 9.2, 4.6);
  add("dark", place(new THREE.CylinderGeometry(0.22, 0.26, 0.5, 10), 3.2, 9.15, 4.2), [0.25, 0.27, 0.3]);

  function blueFrame(x, y, w, h, z, mat) {
    const m = mat || "blueDark";
    addBox(m, 0.055, h + 0.04, 0.05, x - w / 2, y, z);
    addBox(m, 0.055, h + 0.04, 0.05, x + w / 2, y, z);
    addBox(m, w + 0.04, 0.05, 0.05, x, y + h / 2, z);
    addBox(m, w + 0.04, 0.06, 0.07, x, y - h / 2, z - 0.01);
  }
  function paneWindow(x, y, w, h) {
    const z = -0.02;
    blueFrame(x, y, w, h, z);
    addBox("blueDark", 0.03, h - 0.08, 0.025, x, y, z - 0.012);
    addBox("blueDark", w - 0.1, 0.028, 0.025, x, y, z - 0.012);
    addBox("glass", w - 0.1, h - 0.1, 0.012, x, y, 0.02);
  }
  function shutterWindow(x, y, w, h) {
    const z = -0.02;
    blueFrame(x, y, w, h, z);
    addBox("dark", w - 0.08, h - 0.08, 0.08, x, y, 0.08);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const yy = y - h * 0.36 + i * ((h * 0.72) / (n - 1));
      addBox("blueDark", w - 0.1, 0.032, 0.028, x, yy, z - 0.012, [1.1, 1.1, 1.1]);
    }
  }
  paneWindow(6.15, 4.42, 0.62, 0.86);
  // The still shows a brown wooden leaf closed behind this window's glass.
  addBox("woodDark", 0.54, 0.78, 0.03, 6.15, 4.42, 0.05, [0.9, 0.82, 0.72]);
  paneWindow(8.45, 4.42, 0.7, 0.94);
  shutterWindow(3.2, 6.62, 0.56, 0.8);
  shutterWindow(6.1, 6.62, 0.56, 0.8);
  shutterWindow(8.35, 6.62, 0.56, 0.8);

  function guitar(x, y, z, s, body, key, tilt) {
    const gs = guitarSet(body);
    place(gs.geo, x, y, z, 0, Math.PI, tilt || 0, s, s, s);
    looseMesh(gs.geo, new THREE.MeshStandardMaterial({ map: gs.map, roughness: 0.45, metalness: 0 }), key);
  }
  // Guitar window: dark brown timber frame in the still, not blue.
  blueFrame(2.15, 4.5, 0.78, 1.05, -0.02, "wood");
  addBox("wood", 0.86, 0.09, 0.14, 2.15, 4.98, -0.06, [0.7, 0.62, 0.54]);
  addBox("dark", 0.66, 0.92, 0.25, 2.15, 4.5, 0.2);
  guitar(2.2, 4.25, 0.07, 0.82, ["#f2c43a", "#d89a22", "#6a3a14"], "gtr-win", 0.12);
  add("goods", place(new THREE.CircleGeometry(0.12, 14), 1.94, 4.78, 0.065, 0, Math.PI, 0), [0.86, 0.84, 0.78]);
  for (let i = 0; i < 4; i++) addBox("wire", 0.74, 0.012, 0.012, 2.15, 4.12 + i * 0.25, -0.005, [1.6, 1.6, 1.6]);

  function carvedDoors(x0, x1) {
    const openings = 4;
    const gap = (x1 - x0) / openings;
    for (let i = 0; i < openings; i++) {
      const x = x0 + gap * (i + 0.5);
      const tone = 0.94 + hash(i, 3, 7) * 0.1;
      add("door", place(new THREE.BoxGeometry(gap - 0.02, 2.6, 0.05), x, 1.32, 0.06), [tone, tone, tone]);
    }
  }
  carvedDoors(4.3, 9.9);

  function strand(pts, rad, segs) {
    const curve = new THREE.CatmullRomCurve3(pts);
    const g = new THREE.TubeGeometry(curve, segs, rad, 6, false);
    const len = curve.getLength();
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len / 0.12);
    add("garland", g);
  }
  function swag(x0, x1, y, z, droop) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, y - Math.sin(Math.PI * t) * droop, z - Math.sin(Math.PI * t) * 0.03));
    }
    strand(pts, 0.03, 20);
  }
  function drop(x, y, z, len) {
    strand([
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(x + 0.01, y - len * 0.5, z - 0.01),
      new THREE.Vector3(x - 0.005, y - len, z),
    ], 0.026, 6);
    add("garland", place(new THREE.SphereGeometry(0.04, 6, 5), x - 0.005, y - len - 0.02, z));
  }
  const nails = [];
  for (let s = 0; s < 6; s++) {
    const a = 4.35 + s * 0.9;
    const droop = 0.24 + hash(s, 1, 9) * 0.1;
    swag(a, a + 0.9, 2.62, -0.11, droop);
    nails.push(a);
  }
  nails.push(4.35 + 6 * 0.9);
  swag(2.85, 3.9, 2.48, -0.11, 0.3);
  drop(nails[0], 2.62, -0.11, 0.3);
  drop(nails[3], 2.62, -0.11, 0.16);
  drop(nails[6], 2.62, -0.11, 0.22);
  for (const nx of nails) add("dark", place(new THREE.SphereGeometry(0.02, 5, 4), nx, 2.63, -0.1));

  function snackStrip(x, top, z, len, wid, col, tilt, seed) {
    const g = new THREE.PlaneGeometry(wid, len, 1, 8);
    const uv = g.attributes.uv;
    const p = g.attributes.position;
    const off = hash(seed, 2, 5) * (1 - len / 1.6);
    const phase = hash(seed, 7, 1) * 6.28;
    for (let i = 0; i < p.count; i++) {
      const u = uv.getX(i);
      const v = uv.getY(i);
      uv.setXY(i, (col + 0.04 + u * 0.92) / 8, 1 - off - (1 - v) * len / 1.6);
      p.setZ(i, 0.018 * Math.sin((1 - v) * Math.PI * 5 + phase) + (u - 0.5) * 0.02 * Math.sin(phase));
    }
    g.computeVertexNormals();
    add("snack", place(g, x, top - len / 2, z, 0, Math.PI + tilt, (hash(seed, 4, 4) - 0.5) * 0.06));
  }
  for (let i = 0; i < 5; i++) {
    const x = 3.77 + i * 0.075;
    snackStrip(x, 2.24, -0.08 - (i % 2) * 0.025, 0.55 + hash(i, 1, 1) * 0.3, 0.07, i % 5, (hash(i, 3, 3) - 0.5) * 0.3, i + 1);
  }
  for (let i = 0; i < 7; i++) {
    const x = 2.86 + i * 0.085;
    snackStrip(x, 2.26, -0.08 - (i % 3) * 0.03, 0.6 + hash(i, 2, 2) * 0.32, 0.105, 5 + (i % 3), (hash(i, 5, 5) - 0.5) * 0.4, i + 20);
  }

  addBox("dark", 0.68, 2.0, 0.5, 1.35, 1.12, 0.4);
  addBox("dark", 0.42, 1.9, 0.35, 3.55, 1.1, 0.32);
  // South doorway: worn brown timber frame and sill, as in the still.
  addBox("wood", 0.08, 2.24, 0.08, 0.92, 1.16, -0.03, [0.8, 0.72, 0.64]);
  addBox("wood", 0.08, 2.24, 0.08, 1.78, 1.16, -0.03, [0.8, 0.72, 0.64]);
  addBox("wood", 0.94, 0.1, 0.1, 1.35, 2.3, -0.04, [0.74, 0.66, 0.58]);
  addBox("woodDark", 0.86, 0.06, 0.16, 1.35, 0.1, -0.06, [0.6, 0.54, 0.48]);
  // Open bay: blue painted surround joining the carved doors, one leaf folded back inside the jamb.
  addBox("blue", 0.5, 2.45, 0.03, 4.05, 1.225, -0.015, [0.92, 0.92, 0.92]);
  addBox("blue", 0.09, 2.45, 0.03, 3.255, 1.225, -0.015, [0.9, 0.9, 0.9]);
  addBox("blue", 0.5, 0.27, 0.03, 3.55, 2.315, -0.015, [0.88, 0.88, 0.88]);
  add("door", place(new THREE.BoxGeometry(0.42, 1.98, 0.035), 3.33, 1.15, 0.21, 0, Math.PI / 2, 0), [0.8, 0.8, 0.8]);
  // Pale lime-washed pier behind the snack strips, guitar and madal.
  addBox("plaster", 1.4, 2.25, 0.02, 2.53, 1.3, -0.012, [1.55, 1.44, 1.2]);
  for (let i = 0; i < 3; i++) {
    add("goods", place(new THREE.CylinderGeometry(0.014, 0.016, 0.62, 6), 2.83 + i * 0.05, 1.5, -0.09, 0.08, 0, 0.05 - i * 0.04), [0.66, 0.5, 0.3]);
  }
  guitar(2.0, 1.12, -0.1, 1.05, ["#4a4440", "#1e1a18", "#0a0808"], "gtr-stall", -0.06);

  const mm = madalMaps();
  const madalM = new THREE.Matrix4().compose(
    new THREE.Vector3(2.56, 1.82, -0.16),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, 0.62)),
    new THREE.Vector3(1, 1, 1),
  );
  const barrel = new THREE.CylinderGeometry(0.11, 0.13, 0.44, 14, 1, true).applyMatrix4(madalM);
  looseMesh(barrel, new THREE.MeshStandardMaterial({ map: mm.body, roughness: 0.6, metalness: 0 }), "madal");
  const headA = place(new THREE.CircleGeometry(0.11, 14), 0, 0.22, 0, -Math.PI / 2, 0, 0);
  const headB = place(new THREE.CircleGeometry(0.13, 14), 0, -0.22, 0, Math.PI / 2, 0, 0);
  const heads = mergeGeometries([headA, headB], false).applyMatrix4(madalM);
  looseMesh(heads, new THREE.MeshStandardMaterial({ map: mm.head, roughness: 0.7, metalness: 0 }), "madal-head");

  function wire(pts, rad, radial) {
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, rad, radial || 3, false));
  }
  function span(a, b, droop, rad, seed) {
    const pts = [];
    const wob = (hash(seed, 1, 1) - 0.5) * 0.08;
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t + Math.sin(Math.PI * t) * wob,
      ));
    }
    wire(pts, rad, rad > 0.012 ? 5 : 3);
  }
  const ties = [[0.08, 3.28], [2.55, 3.24], [5.05, 3.3], [7.55, 3.22], [9.92, 3.32]];
  for (let k = 0; k < ties.length - 1; k++) {
    const [xa, ya] = ties[k];
    const [xb, yb] = ties[k + 1];
    const n = 17;
    for (let i = 0; i < n; i++) {
      const seed = k * 31 + i;
      const rad = i < 2 ? 0.012 + hash(seed, 3, 1) * 0.005 : 0.004 + hash(seed, 3, 2) * 0.007;
      const droop = 0.02 + Math.pow(hash(seed, 5, 2), 2.2) * 0.32;
      const za = -0.12 - hash(seed, 6, 1) * 0.18;
      const zb = -0.12 - hash(seed, 6, 2) * 0.18;
      span([xa, ya + (hash(seed, 8, 1) - 0.5) * 0.06, za], [xb, yb + (hash(seed, 8, 2) - 0.5) * 0.06, zb], droop, rad, seed);
    }
  }
  for (const [tx, ty] of ties) {
    add("wire", place(new THREE.CylinderGeometry(0.045, 0.05, 0.12, 7), tx, ty - 0.01, -0.2, 0, 0, Math.PI / 2), [1.2, 1.15, 1.1]);
    add("wire", place(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 6), tx + 0.09, ty - 0.03, -0.21, 0, 0, Math.PI / 2), [1.6, 1.5, 1.4]);
    add("dark", place(new THREE.BoxGeometry(0.03, 0.05, 0.1), tx, ty + 0.03, -0.08));
  }
  span([1.2, 3.22, -0.26], [1.5, 3.24, -0.3], 0.34, 0.006, 501);
  span([8.55, 3.2, -0.27], [8.8, 3.22, -0.24], 0.26, 0.006, 502);
  span([5.5, 3.26, -0.25], [5.72, 3.25, -0.28], 0.2, 0.005, 503);
  span([0.2, 5.25, -0.08], [9.7, 5.5, -0.12], 0.28, 0.006, 401);
  span([0.6, 5.3, -0.1], [6.2, 5.6, -0.1], 0.22, 0.005, 402);
  span([0.15, 6.1, -0.06], [8.8, 5.9, -0.1], 0.4, 0.005, 403);
  wire([new THREE.Vector3(9.6, 3.2, -0.2), new THREE.Vector3(9.62, 5.4, -0.12), new THREE.Vector3(9.55, 7.9, -0.15)], 0.006, 3);
  wire([new THREE.Vector3(0.5, 3.18, -0.2), new THREE.Vector3(0.7, 5.0, -0.06), new THREE.Vector3(1.4, 7.95, -0.1)], 0.005, 3);

  const sign = new THREE.BoxGeometry(2.45, 0.74, 0.04);
  sign.translate(7.15, 3.55, -0.4);
  looseMesh(sign, new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.62, metalness: 0 }), "sign");

  function curlSheet(w, h, curl, seed) {
    const g = new THREE.PlaneGeometry(w, h, 8, 8);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / w + 0.5;
      const v = p.getY(i) / h + 0.5;
      const br = Math.max(0, 1 - Math.hypot((1 - u) * 2.2, v * 2.2));
      const tl = Math.max(0, 1 - Math.hypot(u * 3, (1 - v) * 3));
      const bow = Math.sin(Math.PI * u) * Math.sin(Math.PI * v) * 0.012;
      const wave = Math.sin(v * 9 + seed) * 0.003;
      p.setZ(i, curl * br * br + curl * 0.5 * tl * tl + bow + wave);
    }
    g.computeVertexNormals();
    return g;
  }
  const poster = place(curlSheet(1.15, 0.78, 0.07, 1), 3.4, 4.6, -0.025, 0, Math.PI, 0);
  looseMesh(poster, new THREE.MeshStandardMaterial({ map: instrumentPoster(), roughness: 0.82, side: THREE.DoubleSide }), "poster");
  const stall = place(curlSheet(0.48, 0.85, 0.05, 2), 0.48, 1.35, -0.025, 0, Math.PI, 0.015);
  looseMesh(stall, new THREE.MeshStandardMaterial({ map: producePoster(), roughness: 0.82, side: THREE.DoubleSide }), "poster-stall");

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
  for (const obj of loose) root.add(obj);

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "005";
  return root;
}
