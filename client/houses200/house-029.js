// House 029. Naradevi, Gangalal Marg. OSM way 906626836, edge 1, 8.18 m.
// Spec: research/houses200/029/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// After the place.js yaw-180, x = 0 is photo-right: peach wall, green awning, open shop.
// x = 8.18 is photo-left: blue paint, the electrical shop.
// Pano _-a_4CqCTNxjyJbwV-OEvA, look heading 151, 3.12 m point-to-footprint.
// The still is reference only. It is not a texture.
// Opus pass (23 Oct): storey heights, bay edges and colours read off ref/match.jpg from the photo
// camera (x 6.5, 3.12 m out, 40 deg off square, eye 2.1). See research/houses200/029/_opus-shot.cjs.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 8.18;
const D = 8.2;
const T = 0.22;
const H = 7.15;
const GF = 3.6; // first-floor line; the still puts the shop heads at 2.9-3.05 and the sign top at 3.55

const OVERCAST = { dir: 0.92, spec: 0.4, ind: 1.25 };

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
  return t;
}

function canvasTex(draw, w, h) {
  const c = canvas(w, h);
  draw(c.getContext("2d"), w, h);
  return toTex(c, true);
}

// Shade term in house metres: shops darken with depth, the awning bay sits in shadow,
// the slab band and the sign hood throw a soft band. The still is dark below 3 m.
const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.45, p.y);
  ao *= 1.0 - 0.3 * smoothstep(0.35, 0.0, abs(p.y - 3.5));
  ao *= 1.0 - 0.22 * smoothstep(0.4, 0.0, 6.8 - p.y);
  float shop = step(p.y, 3.0) * smoothstep(-0.05, 0.5, p.z) * step(p.z, 7.6);
  ao *= mix(1.0, 0.025, shop);
  float awn = step(p.x, 4.05) * step(p.y, 3.3) * smoothstep(0.15, -0.2, p.z);
  ao *= 1.0 - 0.38 * awn;
  ao *= 1.0 - 0.25 * step(4.2, p.x) * step(p.y, 2.95) * smoothstep(0.1, -0.15, p.z);
  return ao;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.45 + 0.55 * hao) * hao;
reflectedLight.directSpecular *= ${OVERCAST.spec.toFixed(3)} * hao;
reflectedLight.indirectDiffuse *= ${OVERCAST.ind.toFixed(3)} * hao;
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
  mat.customProgramCacheKey = function () { return "house029-" + key; };
  return mat;
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
    const k = 0.92 + 0.08 * hash(x * 1.7, y * 1.3, z * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

// Facade canvases are drawn in metres. The planes are turned to face the lane (yaw 180),
// so canvas u = 0 sits at house x = W: draw at (W - x) * S.
const S = 72;

// Openings, in house metres. Read off the still: the electrical bay is the 1.5 m the camera
// sees between the shared pier and the dark post; the rest of that shop is off the frame.
const shopA = { x: 2.17, y: 1.525, w: 3.6, h: 3.05 };
const shopB = { x: 5.075, y: 1.44, w: 1.49, h: 2.88 };
const shopC = { x: 6.95, y: 1.44, w: 1.75, h: 2.88 };
const winA = { x: 2.68, y: 4.9, w: 1.55, h: 1.7 };
const winB = { x: 1.08, y: 4.93, w: 1.2, h: 1.64 };
const blueWin = { x: 6.25, y: 5.0, w: 1.3, h: 1.4 };
const HOLES = [shopA, shopB, shopC, winA, winB, blueWin];

function cutHoles(g, holes, pad) {
  g.globalCompositeOperation = "destination-out";
  g.fillStyle = "#000";
  for (const o of holes) g.fillRect((W - o.x - o.w / 2 - pad) * S, (H - o.y - o.h / 2 - pad) * S, (o.w + pad * 2) * S, (o.h + pad * 2) * S);
  g.globalCompositeOperation = "source-over";
}

// Pale blue paint over render on the electrical half, worn at the edges, cement showing.
function blueTex() {
  const t = canvasTex((g, w, h) => {
    const r = rng(2901);
    g.fillStyle = "#7f91a6";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) {
      const v = r();
      g.fillStyle = v > 0.5 ? `rgba(160,176,196,${0.05 + r() * 0.08})` : `rgba(52,58,66,${0.04 + r() * 0.08})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 6 + r() * 40, 4 + r() * 22, r() * 3, 0, 7);
      g.fill();
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = `rgba(150,140,128,${0.25 + r() * 0.3})`;
      g.beginPath();
      g.ellipse(r() * w, r() < 0.5 ? r() * 60 : h - r() * 70, 4 + r() * 16, 3 + r() * 9, r() * 3, 0, 7);
      g.fill();
    }
    for (let i = 0; i < 40; i++) {
      const x = r() * w;
      const y = r() * h * 0.6;
      const grd = g.createLinearGradient(0, y, 0, y + 60 + r() * 120);
      grd.addColorStop(0, "rgba(40,44,50,0.22)");
      grd.addColorStop(1, "rgba(40,44,50,0)");
      g.fillStyle = grd;
      g.fillRect(x, y, 2 + r() * 5, 180);
    }
  }, 512, 432);
  return t;
}

// One facade-sized grime decal: damp foot, soot under the slab band and the sill streaks.
function grimeTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2902);
    const X = (x) => (W - x) * S;
    const Y = (y) => (H - y) * S;
    for (let i = 0; i < 420; i++) {
      g.fillStyle = `rgba(${40 + r() * 20},${32 + r() * 14},${26 + r() * 10},${0.03 + r() * 0.07})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 8 + r() * 46, 5 + r() * 26, r() * 3, 0, 7);
      g.fill();
    }
    let grd = g.createLinearGradient(0, Y(0), 0, Y(0.9));
    grd.addColorStop(0, "rgba(28,22,18,0.6)");
    grd.addColorStop(1, "rgba(28,22,18,0)");
    g.fillStyle = grd;
    g.fillRect(0, Y(0.9), w, 0.9 * S);
    grd = g.createLinearGradient(0, Y(GF), 0, Y(GF - 0.55));
    grd.addColorStop(0, "rgba(24,18,15,0.55)");
    grd.addColorStop(1, "rgba(24,18,15,0)");
    g.fillStyle = grd;
    g.fillRect(0, Y(GF), w, 0.55 * S);
    grd = g.createLinearGradient(0, Y(H), 0, Y(H - 0.9));
    grd.addColorStop(0, "rgba(30,26,22,0.5)");
    grd.addColorStop(1, "rgba(30,26,22,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, 0.9 * S);
    for (const o of [winA, winB, blueWin]) {
      for (let i = 0; i < 9; i++) {
        const x = X(o.x - o.w / 2 + r() * o.w);
        const y0 = Y(o.y - o.h / 2 - 0.05);
        const len = (0.4 + r() * 1.1) * S;
        grd = g.createLinearGradient(0, y0, 0, y0 + len);
        grd.addColorStop(0, `rgba(30,24,20,${0.25 + r() * 0.2})`);
        grd.addColorStop(1, "rgba(30,24,20,0)");
        g.fillStyle = grd;
        g.fillRect(x, y0, 2 + r() * 6, len);
      }
    }
    for (let i = 0; i < 30; i++) {
      const x = r() * w;
      const y0 = Y(H - 0.3);
      const len = (0.5 + r() * 2.2) * S;
      grd = g.createLinearGradient(0, y0, 0, y0 + len);
      grd.addColorStop(0, `rgba(30,26,22,${0.15 + r() * 0.2})`);
      grd.addColorStop(1, "rgba(30,26,22,0)");
      g.fillStyle = grd;
      g.fillRect(x, y0, 2 + r() * 8, len);
    }
    cutHoles(g, HOLES, 0.02);
  }, Math.round(W * S), Math.round(H * S));
}

// Board as the still shows it: orange-tan ground, red name, two lines of dark small print
// that cannot be read, so they are drawn as marks, not words.
function signTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2903);
    g.fillStyle = "#b8744a";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      g.fillStyle = `rgba(${60 + r() * 60},${30 + r() * 20},20,${0.05 + r() * 0.1})`;
      g.beginPath();
      g.ellipse(r() * w, r() * h, 10 + r() * 60, 6 + r() * 20, r() * 3, 0, 7);
      g.fill();
    }
    g.fillStyle = "#b0170f";
    g.font = "700 150px 'Nirmala UI', Mangal, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText("सिरपा इलेक्ट्रिक", w / 2, h * 0.3);
    g.strokeStyle = "rgba(26,24,44,0.7)";
    g.lineWidth = 4;
    g.filter = "blur(2.5px)";
    for (const row of [0.62, 0.8]) {
      let x = 40 + r() * 20;
      while (x < w - 60) {
        const len = 50 + r() * 110;
        const top = h * row - 16;
        g.beginPath();
        g.moveTo(x, top);
        g.lineTo(x + len, top);
        for (let k = 6; k < len; k += 9 + r() * 9) {
          const kind = r();
          g.moveTo(x + k, top);
          if (kind < 0.4) g.lineTo(x + k, top + 22 + r() * 8);
          else if (kind < 0.75) g.arc(x + k + 5, top + 14, 5 + r() * 3, -1.6, 2.6);
          else g.lineTo(x + k + 6, top + 12 + r() * 14);
        }
        g.stroke();
        x += len + 16 + r() * 16;
      }
    }
    g.filter = "none";
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "rgba(20,10,6,0.55)");
    grd.addColorStop(0.25, "rgba(20,10,6,0)");
    grd.addColorStop(0.85, "rgba(20,10,6,0)");
    grd.addColorStop(1, "rgba(20,10,6,0.45)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  }, 1024, 400);
}

// Back wall of the electrical shop: racks of boxed fittings, coils, switch boards, a tube light.
function elecBackTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2904);
    g.fillStyle = "#3a2e28";
    g.fillRect(0, 0, w, h);
    for (let row = 0; row < 6; row++) {
      const y = 30 + row * 78;
      g.fillStyle = "#5a4636";
      g.fillRect(0, y + 62, w, 8);
      let x = 6;
      while (x < w - 20) {
        const bw = 18 + r() * 34;
        const bh = 24 + r() * 36;
        const pal = ["#d8d4cc", "#e8e2d2", "#3a62a0", "#c43a2a", "#e0b23a", "#2f7a52", "#f0f0ea", "#8a8a88"];
        g.fillStyle = pal[Math.floor(r() * pal.length)];
        if (r() < 0.18) {
          g.strokeStyle = r() < 0.5 ? "#c4602a" : "#2a5ca8";
          g.lineWidth = 6;
          g.beginPath();
          g.arc(x + 16, y + 44, 14, 0, 7);
          g.stroke();
          x += 36;
          continue;
        }
        g.fillRect(x, y + 62 - bh, bw, bh);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fillRect(x + bw - 4, y + 62 - bh, 4, bh);
        x += bw + 2 + r() * 6;
      }
    }
    g.fillStyle = "#f4f2e6";
    g.fillRect(w * 0.15, 8, w * 0.7, 10);
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "rgba(0,0,0,0.1)");
    grd.addColorStop(1, "rgba(0,0,0,0.5)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  }, 512, 512);
}

// Back of the awning shop: dark walls, pale framed boards, black loops hung on pegs.
function shopABackTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2905);
    g.fillStyle = "#2c2220";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#4a3a32";
    g.fillRect(0, h * 0.62, w, 10);
    g.fillRect(0, h * 0.35, w, 8);
    for (let i = 0; i < 7; i++) {
      g.fillStyle = `rgb(${170 + r() * 50},${168 + r() * 44},${160 + r() * 40})`;
      const x = w * 0.08 + i * w * 0.13 + r() * 10;
      g.fillRect(x, h * 0.12 + r() * 20, 30 + r() * 30, 50 + r() * 60);
    }
    g.strokeStyle = "#0e0c0c";
    g.lineWidth = 4;
    for (let i = 0; i < 9; i++) {
      const x = 40 + r() * (w - 80);
      g.beginPath();
      g.ellipse(x, h * 0.45 + r() * 30, 8 + r() * 10, 30 + r() * 30, 0, 0, 7);
      g.stroke();
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = ["#c9c2b8", "#8a6a4a", "#b84030", "#e2c060", "#5a6a7a"][Math.floor(r() * 5)];
      g.fillRect(r() * w, h * 0.66 + r() * h * 0.25, 10 + r() * 22, 8 + r() * 16);
    }
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, "rgba(0,0,0,0.2)");
    grd.addColorStop(1, "rgba(0,0,0,0.6)");
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  }, 512, 512);
}

// Hanging stock, 4 cells side by side: yellow sachet strip, blue blister packs,
// orange packets, clear packs of white fittings. Alpha cut-outs.
function stockAtlas() {
  return canvasTex((g, w, h) => {
    const r = rng(2906);
    const cw = w / 4;
    const cell = (i, base, top, fill) => {
      const x0 = i * cw;
      g.fillStyle = "#2a2a2a";
      g.fillRect(x0 + cw / 2 - 2, 0, 4, 16);
      for (let k = 0; k < 6; k++) {
        const y = 14 + k * (h - 20) / 6;
        const ph = (h - 20) / 6 - 4;
        const pw = cw - 18 - r() * 10;
        const px = x0 + (cw - pw) / 2 + (r() - 0.5) * 6;
        g.fillStyle = base;
        g.beginPath();
        g.moveTo(px + 4, y);
        g.lineTo(px + pw - 4, y + 2);
        g.lineTo(px + pw, y + ph);
        g.lineTo(px, y + ph - 2);
        g.closePath();
        g.fill();
        g.fillStyle = top;
        g.fillRect(px + 4, y + 2, pw - 8, ph * 0.22);
        g.fillStyle = fill;
        g.fillRect(px + pw * 0.25, y + ph * 0.38, pw * 0.5, ph * 0.4);
        g.fillStyle = "rgba(255,255,255,0.35)";
        g.fillRect(px + 6, y + ph * 0.3, 3, ph * 0.6);
      }
    };
    cell(0, "#d8b42a", "#b0261a", "#f2e8c0");
    cell(1, "#2c5ea8", "#e8e4dc", "#c8ccd0");
    cell(2, "#d8621e", "#f4e6b0", "#7a2a18");
    cell(3, "rgba(220,224,226,0.85)", "#c42a22", "#f8f8f4");
  }, 512, 512);
}

// The red printed carton by the door: pictures of snacks on red.
function cartonTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2907);
    g.fillStyle = "#8e2a1e";
    g.fillRect(0, 0, w, h);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 2; col++) {
        const x = 14 + col * (w / 2);
        const y = 14 + row * (h / 3);
        g.fillStyle = "#e8c070";
        g.fillRect(x, y, w / 2 - 28, h / 3 - 30);
        for (let k = 0; k < 6; k++) {
          g.fillStyle = ["#c86a2a", "#a03a1a", "#e0a040", "#6a3a1a"][Math.floor(r() * 4)];
          g.beginPath();
          g.ellipse(x + 10 + r() * (w / 2 - 48), y + 10 + r() * (h / 3 - 50), 8 + r() * 10, 6 + r() * 8, r() * 3, 0, 7);
          g.fill();
        }
      }
    }
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(0, h / 3 - 8, w, 6);
    g.fillRect(0, (2 * h) / 3 - 8, w, 6);
  }, 256, 384);
}

export function createHouse029() {
  const root = new THREE.Group();
  root.name = "house-029";

  const lit = (map, glow) => new THREE.MeshStandardMaterial({
    map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: glow, color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true,
  });
  const cut = (map) => new THREE.MeshStandardMaterial({
    map, color: 0xffffff, roughness: 0.72, metalness: 0, transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, vertexColors: true,
  });
  const mats = {
    peach: new THREE.MeshStandardMaterial({ color: 0xc9a48c, roughness: 0.9, metalness: 0, vertexColors: true }),
    blue: new THREE.MeshStandardMaterial({ map: blueTex(), color: 0xffffff, roughness: 0.85, metalness: 0, transparent: true, alphaTest: 0.5, vertexColors: true }),
    grime: new THREE.MeshStandardMaterial({
      map: grimeTex(), color: 0xffffff, roughness: 0.95, metalness: 0, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, vertexColors: true,
    }),
    wood: new THREE.MeshStandardMaterial({ color: 0x4a382c, roughness: 0.86, metalness: 0, vertexColors: true }),
    frameGrey: new THREE.MeshStandardMaterial({ color: 0x585356, roughness: 0.7, metalness: 0.1, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x241c18, roughness: 0.92, metalness: 0, vertexColors: true }),
    awning: new THREE.MeshStandardMaterial({ color: 0x5c6866, roughness: 0.7, metalness: 0.15, side: THREE.DoubleSide, vertexColors: true }),
    pipe: new THREE.MeshStandardMaterial({ color: 0x6a6460, roughness: 0.55, metalness: 0.35, vertexColors: true }),
    sign: new THREE.MeshStandardMaterial({ map: signTex(), color: 0xffffff, roughness: 0.75, metalness: 0, vertexColors: true }),
    elecBack: lit(elecBackTex(), 0.75),
    shopBack: lit(shopABackTex(), 0.5),
    carton: new THREE.MeshStandardMaterial({ map: cartonTex(), color: 0xffffff, roughness: 0.8, metalness: 0, vertexColors: true }),
    stock: cut(stockAtlas()),
    glass: new THREE.MeshStandardMaterial({ color: 0x1c2226, roughness: 0.12, metalness: 0.3, vertexColors: true }),
    counterGlass: new THREE.MeshStandardMaterial({ color: 0x9fb0b4, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.22, depthWrite: false, vertexColors: true }),
    alu: new THREE.MeshStandardMaterial({ color: 0xa8a8a2, roughness: 0.45, metalness: 0.5, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x1e1c1b, roughness: 0.7, metalness: 0.05, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.75, metalness: 0, vertexColors: true }),
    pot: new THREE.MeshStandardMaterial({ color: 0xa8281e, roughness: 0.55, metalness: 0, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xfff0d0, emissive: 0xffe4b0, emissiveIntensity: 1.4, roughness: 0.4, metalness: 0, vertexColors: true }),
    rope: new THREE.MeshStandardMaterial({ color: 0xd8a838, emissive: 0xffb030, emissiveIntensity: 0.7, roughness: 0.5, metalness: 0, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx || 0, ry || 0, rz || 0);
    if (name === "peach") worldUV(g);
    add(name, g, tint);
  }
  // A street-facing plane (turned to face -Z), optionally showing one cell of an n-cell atlas.
  function card(name, w, h, x, y, z, tint, cell, n, rz) {
    const g = place(new THREE.PlaneGeometry(w, h), x, y, z, 0, Math.PI, rz || 0);
    if (n) {
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setX(i, (cell + uv.getX(i)) / n);
    }
    add(name, g, tint);
  }
  function tube(name, pts, rad, tint, seg) {
    const curve = new THREE.CatmullRomCurve3(pts);
    add(name, new THREE.TubeGeometry(curve, seg || 12, rad, 4, false), tint);
  }
  function lathe(name, profile, x, y, z, tint, segs) {
    const g = new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), segs || 10);
    add(name, place(g, x, y, z), tint);
  }

  // Shell. Peach plaster with the openings measured off the still.
  const wall = (x0, x1, y0, y1, zFace, holes) => {
    for (const p of cells(x0, x1, y0, y1, holes)) addBox("peach", p.w, p.h, T, p.x, p.y, zFace + T / 2);
  };
  wall(0, W, 0, H, 0, HOLES);
  wall(0, W, 0, H, D - T, []);
  addBox("peach", T, H, D, T / 2, H / 2, D / 2);
  addBox("peach", T, H, D, W - T / 2, H / 2, D / 2);
  addBox("peach", W, 0.16, D, W / 2, H - 0.08, D / 2);
  addBox("peach", W - 0.2, 0.2, D - 0.3, W / 2, GF - 0.1, D / 2 + 0.1, [0.5, 0.45, 0.42]);
  // Shop floors, a little above the lane, dark with dust.
  addBox("dark", shopA.w, 0.12, 2.0, shopA.x, 0.06, 1.0, [0.9, 0.85, 0.8]);
  addBox("dark", shopB.w + shopC.w + 0.2, 0.12, 2.0, (shopB.x + shopC.x) / 2, 0.06, 1.0, [0.9, 0.85, 0.8]);

  // Floor band at the first-floor line, chipped, darker where the cables run.
  addBox("peach", W, 0.16, 0.12, W / 2, GF + 0.06, -0.06, [0.78, 0.72, 0.68]);
  // Pilasters on the peach upper floor, as the still shows between the window bays.
  for (const x of [0.32, 1.8, 3.6]) addBox("peach", 0.2, H - GF - 0.4, 0.07, x, (GF + H - 0.4) / 2 + 0.1, -0.035, [0.95, 0.9, 0.86]);

  // Blue paint on the electrical half: a plane with the window cut out of its alpha.
  {
    const x0 = 4.0;
    const y0 = GF + 0.14;
    const g = place(new THREE.PlaneGeometry(W - x0, H - y0), (x0 + W) / 2, (y0 + H) / 2, -0.012, 0, Math.PI, 0);
    add("blue", g);
    const tex = mats.blue.map;
    const c = tex.image;
    const ctx = c.getContext("2d");
    const sx = c.width / (W - x0);
    const sy = c.height / (H - y0);
    ctx.clearRect((W - blueWin.x - blueWin.w / 2) * sx, (H - blueWin.y - blueWin.h / 2) * sy, blueWin.w * sx, blueWin.h * sy);
  }
  // Grime decal over the whole street face.
  add("grime", place(new THREE.PlaneGeometry(W, H), W / 2, H / 2, -0.02, 0, Math.PI, 0));

  // Upper windows: grey steel frames set back in the reveal, a short top row over two tall lights.
  function steelWindow(o) {
    const z = 0.1;
    const x0 = o.x - o.w / 2;
    const x1 = o.x + o.w / 2;
    const y0 = o.y - o.h / 2;
    const y1 = o.y + o.h / 2;
    const t = 0.05;
    addBox("frameGrey", o.w, t, 0.06, o.x, y1 - t / 2, z);
    addBox("frameGrey", o.w, t, 0.06, o.x, y0 + t / 2, z);
    addBox("frameGrey", t, o.h, 0.06, x0 + t / 2, o.y, z);
    addBox("frameGrey", t, o.h, 0.06, x1 - t / 2, o.y, z);
    addBox("frameGrey", o.w, 0.035, 0.05, o.x, y1 - 0.38, z);
    const cols = o.w > 1.4 ? 3 : 2;
    for (let i = 1; i < cols; i++) addBox("frameGrey", 0.035, o.h, 0.05, x0 + (o.w * i) / cols, o.y, z);
    addBox("frameGrey", o.w, 0.03, 0.04, o.x, (y0 + y1 - 0.38) / 2, z);
    card("glass", o.w - 0.04, o.h - 0.04, o.x, o.y, z + 0.03, [0.9 + hash(o.x, 1, 2) * 0.2, 0.95, 1]);
    // Plaster sill and hood, a little proud of the wall.
    addBox("peach", o.w + 0.2, 0.06, 0.16, o.x, y0 - 0.03, -0.06, [0.86, 0.8, 0.76]);
    addBox("peach", o.w + 0.16, 0.08, 0.1, o.x, y1 + 0.04, -0.04, [0.82, 0.76, 0.72]);
  }
  steelWindow(winA);
  steelWindow(winB);
  steelWindow(blueWin);
  // Curtain hint inside the bigger peach window.
  card("goods", 0.5, 1.1, winA.x + 0.45, winA.y - 0.15, 0.3, [0.36, 0.3, 0.26]);

  // Piers at the shop line: the shared one, the end one, the dark post at the edge of the frame.
  addBox("wood", 0.36, 3.0, 0.24, 4.15, 1.5, -0.06, [0.55, 0.4, 0.36]);
  addBox("peach", 0.37, 3.05, 0.22, 0.185, 1.525, -0.03, [0.82, 0.74, 0.7]);
  addBox("dark", 0.16, 2.88, 0.16, 5.9, 1.44, -0.04, [0.55, 0.62, 0.55]);
  // Lintels and the timber frame of each opening.
  addBox("wood", shopA.w, 0.1, 0.12, shopA.x, shopA.y + shopA.h / 2 - 0.05, 0.02, [0.7, 0.6, 0.55]);
  addBox("wood", shopB.w + shopC.w + 0.2, 0.1, 0.12, 5.98, shopB.y + shopB.h / 2 - 0.05, 0.02, [0.7, 0.6, 0.55]);

  // Back cards: stock walls lit low from inside, at the back of each shop.
  card("elecBack", 3.6, 2.7, 6.0, 1.42, 1.9);
  card("shopBack", 3.5, 2.8, 2.2, 1.45, 2.0);
  // Side racks in the electrical shop, receding into the dark.
  addBox("dark", 0.06, 2.6, 1.8, 4.42, 1.35, 1.0, [0.8, 0.7, 0.62]);
  for (let i = 0; i < 4; i++) addBox("wood", 1.4, 0.04, 0.45, 5.1, 0.5 + i * 0.5, 1.6, [0.7, 0.6, 0.5]);

  // Sign over the electrical bay, on a hooded timber frame, leaning out a little at the top.
  {
    const sx = 5.1;
    const sw = 1.95;
    card("sign", sw, 0.66, sx, 3.24, -0.16, null, 0, 0, 0);
    addBox("wood", sw + 0.1, 0.06, 0.08, sx, 3.6, -0.16, [0.5, 0.42, 0.38]);
    addBox("wood", sw + 0.1, 0.05, 0.08, sx, 2.89, -0.16, [0.5, 0.42, 0.38]);
    addBox("dark", sw + 0.16, 0.04, 0.32, sx, 3.66, -0.16, [0.7, 0.66, 0.62], 0.18);
    addBox("dark", 0.05, 0.74, 0.12, sx - sw / 2 - 0.03, 3.24, -0.13);
  }
  // Two white globes on the wire under the hood, right of the sign.
  for (const [x, y] of [[4.42, 2.98], [4.3, 2.96]]) add("goods", place(new THREE.SphereGeometry(0.06, 8, 6), x, y, -0.28), [0.95, 0.94, 0.92]);

  // Electrical shop contents.
  // Hanging columns of stock at the frame post and inside the bay.
  const stockCols = [
    [5.72, 2.05, -0.06, 0, 1.15], [5.58, 1.95, 0.02, 0, 1.0], [5.82, 1.2, -0.08, 1, 0.8],
    [4.7, 1.58, -0.04, 2, 0.6], [4.55, 1.75, 0.04, 3, 0.7], [5.25, 2.2, 0.35, 1, 0.75],
    [4.95, 2.25, 0.5, 3, 0.6], [5.4, 1.9, 0.7, 0, 0.9], [4.75, 2.3, 0.9, 2, 0.7],
  ];
  for (const [x, y, z, c, h] of stockCols) card("stock", 0.2, h, x, y, z, [0.5, 0.48, 0.46], c, 4, (hash(x, y, z) - 0.5) * 0.08);
  // A packed fan hung from the pier: blue rim, white face.
  add("goods", place(new THREE.CylinderGeometry(0.19, 0.19, 0.06, 16), 4.5, 2.2, -0.08, Math.PI / 2, 0, 0), [0.25, 0.45, 0.75]);
  add("goods", place(new THREE.CylinderGeometry(0.16, 0.16, 0.065, 16), 4.5, 2.2, -0.085, Math.PI / 2, 0, 0), [0.88, 0.9, 0.92]);
  // Rope light: a lit bead line in a loose loop across the bay.
  {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push(new THREE.Vector3(5.55 - t * 1.05, 2.6 - Math.sin(t * Math.PI) * 1.15 + t * -0.45 * (1 - t), -0.1 - Math.sin(t * Math.PI) * 0.06));
    }
    tube("rope", pts, 0.009, null, 24);
    tube("rope", [new THREE.Vector3(5.5, 2.6, -0.1), new THREE.Vector3(5.47, 2.0, -0.09), new THREE.Vector3(5.42, 1.45, -0.07)], 0.012, null, 10);
  }
  // Stacked red tubs on the floor, white tube-light cartons leaning on the pier and the post.
  for (let i = 0; i < 5; i++) lathe("pot", [[0, 0], [0.16, 0], [0.19, 0.2], [0.17, 0.21], [0, 0.21]], 5.25, 0.12 + i * 0.19, 0.35, [1, 0.95 - i * 0.04, 0.95], 12);
  for (let i = 0; i < 4; i++) addBox("goods", 0.1, 1.3 + i * 0.05, 0.08, 4.38 + i * 0.1, 0.65 + i * 0.025, -0.22 - (i % 2) * 0.04, [0.45, 0.45, 0.44], 0, 0, (i - 1.5) * 0.04);
  for (let i = 0; i < 3; i++) addBox("goods", 0.3, 0.8, 0.04, 5.75 + i * 0.05, 0.4, -0.3 - i * 0.05, [0.86, 0.86, 0.84], -0.15, 0.2, 0);
  // Water bottle and small boxes on the low shelf, a lit bulb and two coloured lamps inside.
  lathe("counterGlass", [[0, 0], [0.04, 0], [0.04, 0.2], [0.015, 0.26], [0, 0.26]], 5.4, 0.62, 0.1, null, 8);
  addBox("wood", 1.3, 0.05, 0.5, 5.1, 0.6, 0.25, [0.7, 0.66, 0.62]);
  for (let i = 0; i < 6; i++) addBox("goods", 0.14, 0.12 + hash(i, 2, 9) * 0.1, 0.12, 4.6 + i * 0.18, 0.7, 0.25, [[0.85, 0.84, 0.8], [0.3, 0.45, 0.7], [0.8, 0.6, 0.2]][i % 3]);
  add("bulb", place(new THREE.SphereGeometry(0.05, 8, 6), 5.3, 2.25, 0.55));
  add("bulb", place(new THREE.SphereGeometry(0.03, 6, 5), 5.28, 1.7, 0.5), [1, 0.15, 0.1]);
  add("bulb", place(new THREE.SphereGeometry(0.03, 6, 5), 5.32, 1.58, 0.55), [0.2, 0.3, 1]);

  // The dim rest of the electrical shop, off the left of the frame.
  for (let i = 0; i < 3; i++) card("stock", 0.2, 0.9, 6.4 + i * 0.6, 1.9, 0.3, null, (i + 1) % 4, 4);

  // Awning shop. Glass counter in the bay, orange-red door post, the red carton, the step.
  {
    const cx = 2.95;
    const cw = 1.85;
    const ch = 0.95;
    const cz = 0.15;
    const cd = 0.5;
    for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) addBox("alu", 0.03, ch, 0.03, cx + (dx * cw) / 2, ch / 2 + 0.12, cz + (dz * cd) / 2);
    addBox("alu", cw, 0.03, 0.03, cx, ch + 0.12, cz - cd / 2);
    addBox("alu", cw, 0.03, 0.03, cx, 0.14, cz - cd / 2);
    add("counterGlass", place(new THREE.PlaneGeometry(cw, ch), cx, ch / 2 + 0.12, cz - cd / 2, 0, Math.PI, 0));
    add("counterGlass", place(new THREE.PlaneGeometry(cw, cd), cx, ch + 0.12, cz, -Math.PI / 2, 0, 0));
    addBox("dark", cw, 0.1, cd, cx, 0.17, cz, [0.6, 0.6, 0.6]);
    for (const y of [0.45, 0.75]) {
      add("counterGlass", place(new THREE.PlaneGeometry(cw - 0.06, cd - 0.06), cx, y, cz, -Math.PI / 2, 0, 0));
      for (let i = 0; i < 9; i++) {
        const tint = [[0.8, 0.8, 0.78], [0.55, 0.5, 0.45], [0.75, 0.68, 0.5]][i % 3];
        addBox("goods", 0.12, 0.05 + hash(i, y, 3) * 0.06, 0.1, cx - cw / 2 + 0.15 + i * 0.19, y + 0.04, cz + (hash(i, y, 1) - 0.5) * 0.2, tint);
      }
    }
    // Stock bundled on the floor behind the counter, a small carton and a crate on top.
    addBox("goods", 0.4, 0.3, 0.3, 3.55, 1.22, 0.3, [0.85, 0.7, 0.4]);
    addBox("goods", 0.32, 0.18, 0.25, 3.2, 1.16, 0.32, [0.35, 0.5, 0.7]);
  }
  addBox("wood", 0.09, 2.95, 0.1, 1.9, 1.5, 0.02, [1.25, 0.4, 0.22]);
  addBox("dark", 0.06, 2.6, 0.08, 1.05, 1.35, 0.3);
  // Red carton stack by the door, printed face to the lane.
  addBox("goods", 0.62, 1.05, 0.4, 1.55, 0.6, -0.15, [0.16, 0.035, 0.025]);
  card("carton", 0.6, 1.02, 1.55, 0.6, -0.355, [0.6, 0.55, 0.52]);
  addBox("goods", 0.5, 0.25, 0.35, 1.5, 1.25, -0.1, [0.45, 0.4, 0.32]);
  // Lit bulbs hung just under the awning.
  for (const [x, z] of [[3.55, 0.5], [3.0, 0.45]]) {
    add("bulb", place(new THREE.SphereGeometry(0.05, 8, 6), x, 2.62, z));
    addBox("wire", 0.01, 0.35, 0.01, x, 2.82, z);
  }
  // Stone step along the awning shop and a timber pole holding the awning end.
  addBox("dark", 1.6, 0.2, 0.55, 1.15, 0.1, -0.27, [1.6, 1.4, 1.3]);
  addBox("dark", 2.2, 0.12, 0.35, 3.0, 0.06, -0.18, [1.5, 1.35, 1.25]);
  addBox("wood", 0.07, 2.95, 0.07, 0.48, 1.47, -0.85, [0.8, 0.7, 0.6]);
  // Strings of snack sachets hung from the awning rail at the end pier.
  for (let i = 0; i < 5; i++) card("stock", 0.18, 0.55 + (i % 2) * 0.2, 0.42 + i * 0.09, 2.15 - (i % 3) * 0.06, -0.75 + i * 0.04, null, [0, 2, 3, 0, 2][i], 4, (i - 2) * 0.12);

  // Grey-green corrugated awning: ribs down the slope, a rolled front edge, a pipe along it.
  {
    const x0 = 0.2;
    const x1 = 4.0;
    const ribs = 38;
    const steps = 6;
    const pos = [];
    const idx = [];
    for (let i = 0; i <= ribs * 2; i++) {
      const x = x0 + ((x1 - x0) * i) / (ribs * 2);
      const bump = (i % 2) * 0.025;
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        const z = -0.02 - t * 1.0;
        const y = 3.32 - t * 0.42 - t * t * 0.08 + (x1 - x) * 0.02 + bump;
        pos.push(x, y, z);
      }
    }
    const row = steps + 1;
    for (let i = 0; i < ribs * 2; i++) {
      for (let j = 0; j < steps; j++) {
        const a = i * row + j;
        idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    const c = new Float32Array(pos.length);
    for (let i = 0; i < pos.length / 3; i++) {
      const k = 0.78 + 0.22 * hash(pos[i * 3] * 3.1, pos[i * 3 + 2] * 5.3, 1) - 0.18 * Math.max(0, -pos[i * 3 + 2] - 0.6);
      c[i * 3] = k;
      c[i * 3 + 1] = k;
      c[i * 3 + 2] = k * 0.97;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    (buckets.awning || (buckets.awning = [])).push(g);
    // Rolled front edge, sagging between the brackets.
    const roll = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      roll.push(new THREE.Vector3(x0 + (x1 - x0) * t, 2.79 + (x1 - x0) * (1 - t) * 0.02 - Math.sin(t * Math.PI * 2) ** 2 * 0.03, -1.04));
    }
    add("awning", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(roll), 24, 0.07, 6, false), [0.8, 0.82, 0.8]);
    tube("pipe", roll.map((p) => p.clone().add(new THREE.Vector3(0, -0.1, 0.06))), 0.022, null, 16);
    for (const x of [0.5, 2.1, 3.85]) tube("pipe", [new THREE.Vector3(x, 2.8, -0.98), new THREE.Vector3(x, 3.05, -0.4), new THREE.Vector3(x, 3.1, -0.02)], 0.018, null, 4);
  }

  // Cable bundle: from off the frame high on the blue wall, over the sign hood, along the
  // awning top, with loose droppers and slack strands across the shop face.
  {
    const r = rng(2908);
    const span = (a, b, sag, n, rad, spread) => {
      for (let s = 0; s < n; s++) {
        const j = () => (r() - 0.5) * spread;
        const A = new THREE.Vector3(a[0] + j(), a[1] + j(), a[2] + j());
        const B = new THREE.Vector3(b[0] + j(), b[1] + j(), b[2] + j());
        const sg = sag * (0.7 + r() * 0.7);
        const pts = [];
        for (let i = 0; i <= 6; i++) {
          const t = i / 6;
          const p = A.clone().lerp(B, t);
          p.y -= sg * 4 * t * (1 - t);
          p.z -= sg * 0.4 * 4 * t * (1 - t) * r();
          pts.push(p);
        }
        tube("wire", pts, rad * (0.7 + r() * 0.8), [0.8 + r() * 0.5, 0.8 + r() * 0.4, 0.8 + r() * 0.4], 12);
      }
    };
    span([8.6, 4.7, -0.45], [4.25, 3.72, -0.3], 0.3, 22, 0.012, 0.16);
    span([4.25, 3.72, -0.3], [-0.4, 3.52, -0.55], 0.22, 18, 0.012, 0.14);
    span([7.6, 4.4, -0.2], [4.2, 3.4, -0.25], 0.55, 5, 0.008, 0.2);
    span([5.95, 3.05, -0.18], [4.3, 3.0, -0.22], 0.55, 4, 0.006, 0.08);
    span([3.85, 3.55, -0.3], [-0.6, 5.3, -0.9], 0.25, 2, 0.007, 0.05);
    // Droppers and a loose coil where the bundle crosses the shared pier.
    for (let i = 0; i < 6; i++) {
      const x = 4.1 + (r() - 0.5) * 0.4;
      tube("wire", [new THREE.Vector3(x, 3.65, -0.28), new THREE.Vector3(x + 0.05, 3.2, -0.22), new THREE.Vector3(x - 0.02, 2.7 + r() * 0.3, -0.2)], 0.007, null, 6);
    }
    const coil = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI * 4;
      coil.push(new THREE.Vector3(4.3 + Math.cos(a) * 0.14, 3.5 + Math.sin(a) * 0.12 - i * 0.004, -0.33 + Math.sin(a) * 0.03));
    }
    tube("wire", coil, 0.008, null, 32);
    addBox("dark", 0.14, 0.18, 0.1, 4.05, 3.85, -0.06);
  }

  // Unseen roof: a low parapet and one tank set back. Sides stay plain.
  addBox("peach", W, 0.35, 0.14, W / 2, 6.95, 0.06);
  addBox("peach", 0.14, 0.35, D, 0.08, 6.95, D / 2);
  addBox("peach", 0.14, 0.35, D, W - 0.08, 6.95, D / 2);
  addBox("dark", 0.7, 0.55, 0.7, 1.4, 7.05, 3.2, [0.45, 0.48, 0.5]);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    for (const g of list) {
      if (!g.index) continue;
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "uv2", "color"].includes(k)) g.deleteAttribute(k);
    }
    const geo = list.length === 1 ? list[0] : mergeGeometries(list.map((g) => {
      if (!g.attributes.uv) g.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
      if (!g.attributes.uv2) g.setAttribute("uv2", g.attributes.uv);
      if (!g.attributes.normal) g.computeVertexNormals();
      return g;
    }), false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = !["glass", "counterGlass", "grime", "bulb", "rope"].includes(name);
    mesh.receiveShadow = true;
    if (name === "grime" || name === "counterGlass") mesh.renderOrder = 2;
    root.add(mesh);
  }

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "029";
  return root;
}
