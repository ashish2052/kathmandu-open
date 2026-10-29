// House 020. Jhochhen Tol, south face of OSM way 906975897, edge 2, 16.20 m.
// Spec: research/houses200/020/design.md
// Origin: front-left ground corner. +X runs west to east, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. x = 0 is west (photo-left): Shyam Bakery.
// x = 16.2 is east (photo-right): the snack counter and the dark door. TAMBA's is the next building.
// Still: pano kU1uAm_Nmk155_Gvg4H9ew, yaw 330, pitch 0, fov 70. Copy that frame.
// Grey concrete, not brick. No Okta board, no phone numbers, no people.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 16.2;
const D = 12.85;
const T = 0.22;
const ROOF = 8.35;
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

function toTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function canvasTex(draw, w, h) {
  const c = canvas(w, h);
  draw(c.getContext("2d"), w, h);
  return toTex(c);
}

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) * 0.42, p.getY(i) * 0.42);
    else if (ax >= ay) uv.setXY(i, p.getZ(i) * 0.42, p.getY(i) * 0.42);
    else uv.setXY(i, p.getX(i) * 0.42, p.getZ(i) * 0.42);
  }
  return g;
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  if (p.z < 0.85) {
    ao *= 1.0 - 0.42 * smoothstep(0.45, 0.0, 2.75 - p.y) * step(0.0, 2.75 - p.y);
    ao *= 1.0 - 0.3 * smoothstep(0.4, 0.0, 3.4 - p.y) * step(0.0, 3.4 - p.y);
    ao *= 1.0 - 0.22 * smoothstep(0.35, 0.0, 5.5 - p.y) * step(0.0, 5.5 - p.y);
    ao *= 1.0 - 0.35 * smoothstep(0.7, 0.0, 8.15 - p.y) * step(0.0, 8.15 - p.y);
  }
  ao *= 0.74 + 0.26 * smoothstep(0.0, 0.45, p.y);
  ao *= 1.0 - 0.32 * smoothstep(0.18, 0.0, p.z);
  return ao;
}
float h020(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n020(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h020(i), h020(i + vec2(1.0, 0.0)), f.x), mix(h020(i + vec2(0.0, 1.0)), h020(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

const GRIME_GLSL = `
{
  vec3 hp = vHousePos;
  float u = hp.x + hp.z;
  float mott = n020(vec2(u, hp.y) * 1.2) * 0.6 + n020(vec2(u, hp.y) * 3.8) * 0.4;
  float streak = n020(vec2(u * 6.5, hp.y * 0.32)) * n020(vec2(u * 2.1, 2.4));
  float run = 0.0;
  run += smoothstep(1.2, 0.0, 3.35 - hp.y) * step(hp.y, 3.35);
  run += smoothstep(0.9, 0.0, 5.5 - hp.y) * step(hp.y, 5.5);
  run += 0.55 * smoothstep(0.6, 0.0, 8.15 - hp.y) * step(hp.y, 8.15);
  float soot = clamp(run * (0.22 + 0.85 * streak), 0.0, 1.0) * 0.5;
  float damp = smoothstep(1.05, 0.04, hp.y) * (0.5 + 0.5 * n020(vec2(u * 1.6, hp.y * 2.8)));
  vec3 c = diffuseColor.rgb * (0.88 + 0.18 * mott);
  c = mix(c, c * vec3(0.58, 0.54, 0.5), soot);
  c = mix(c, c * vec3(0.64, 0.62, 0.58), damp * 0.55);
  diffuseColor.rgb = c;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.55 + 0.45 * hao);
reflectedLight.directSpecular *= ${OVERCAST.spec.toFixed(3)} * hao;
reflectedLight.indirectDiffuse *= ${OVERCAST.ind.toFixed(3)} * hao;
reflectedLight.indirectSpecular *= hao;
`;

const CANVAS = new Set(["bakery", "green", "blue", "vert", "ice", "tee", "packets", "cakes"]);
const GRIME = new Set(["plaster", "plasterWarm", "concrete"]);

function houseShader(mat, key) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + AO_GLSL);
    if (GRIME.has(key)) frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\n" + GRIME_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house020-" + key; };
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
    roughness: o.rough == null ? 0.92 : o.rough,
    metalness: 0,
    aoMapIntensity: o.ao == null ? 0.32 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.22 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.55 : o.ns, o.ns == null ? 0.55 : o.ns);
  return m;
}

// Shop interior card: lit by its own bulbs, so it glows a little through overcast.
function lit(map, glow) {
  return new THREE.MeshStandardMaterial({
    map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: glow,
    roughness: 0.9, metalness: 0, vertexColors: true,
  });
}

function bakerySign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#c41820";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#f4f1ea";
    g.lineWidth = 14;
    g.strokeRect(10, 10, w - 20, h - 20);
    g.fillStyle = "#fffaf4";
    g.font = "bold 92px sans-serif";
    g.textAlign = "center";
    g.fillText("SHYAM BAKERY", w / 2, 108);
    g.fillStyle = "#f4e8e0";
    g.fillRect(60, 126, w - 120, 4);
    const icons = ["#f2d2a2", "#e8b86a", "#c46a4a", "#f6e2b8", "#7d9a56", "#d8e8f2"];
    for (let i = 0; i < icons.length; i++) {
      const x = 150 + i * 120;
      g.fillStyle = "#fff";
      g.fillRect(x, 150, 96, 78);
      g.fillStyle = icons[i];
      g.beginPath();
      g.arc(x + 48, 188, 26, 0, 6.3);
      g.fill();
    }
  }, 1024, 280);
}

function greenSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#1c8d3c";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#f7f4ee";
    g.lineWidth = 12;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#f7f4ee";
    g.textAlign = "center";
    g.font = "bold 36px sans-serif";
    g.fillText("Backpacker's", w / 2, 58);
    g.font = "bold 78px sans-serif";
    g.fillText("GREEN HOUSE", w / 2, 150);
    g.font = "bold 48px sans-serif";
    g.fillText("LODGE", w / 2, 214);
  }, 900, 280);
}

function blueSign() {
  return canvasTex((g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#3aa0dc");
    bg.addColorStop(1, "#1d6eae");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e8f4fc";
    g.lineWidth = 10;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#f7fbff";
    g.textAlign = "center";
    const rings = ["#e8c84a", "#f2f2ee", "#d84a3a", "#2a2a2a", "#f2f2ee", "#e8c84a", "#5ab04a", "#f2f2ee", "#d84a3a"];
    for (let i = 0; i < rings.length; i++) {
      g.fillStyle = "#123a66";
      g.beginPath();
      g.arc(220 + i * 76, 56, 30, 0, 6.3);
      g.fill();
      g.fillStyle = rings[i];
      g.beginPath();
      g.arc(220 + i * 76, 56, 20, 0, 6.3);
      g.fill();
    }
    g.fillStyle = "#f7fbff";
    g.font = "bold 58px sans-serif";
    g.fillText("ASHRAF EMBROIDERY", w / 2, 158);
    g.font = "26px sans-serif";
    g.fillText("All kinds of custom design of T-shirts", w / 2, 262);
    g.fillStyle = "rgba(255,255,255,0.75)";
    g.fillRect(260, 190, 580, 6);
    g.fillRect(320, 210, 460, 5);
    shirt(g, 920, 175, 70, 80, "#f2f2ee");
    shirt(g, 1000, 175, 70, 80, "#f2f2ee");
  }, 1100, 300);
}

function vertSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#b9b4a8";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#3a3632";
    g.font = "bold 42px sans-serif";
    g.textAlign = "center";
    const letters = "GREEN HOUSE";
    for (let i = 0; i < letters.length; i++) {
      g.fillText(letters[i], w / 2, 48 + i * 52);
    }
  }, 128, 700);
}

function iceSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f3f0e8";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#222";
    g.lineWidth = 5;
    g.strokeRect(3, 3, w - 6, h - 6);
    g.fillStyle = "#1a1a1a";
    g.font = "bold 34px sans-serif";
    g.textAlign = "center";
    g.fillText("Ice Cube", w / 2, 48);
    g.fillText("Available", w / 2, 92);
    g.fillText("Here", w / 2, 136);
  }, 280, 180);
}

function teeTex(word, ink) {
  return canvasTex((g, w, h) => {
    g.clearRect(0, 0, w, h);
    shirt(g, 0, 0, w, h, "#161414");
    g.fillStyle = ink;
    g.beginPath();
    g.arc(w / 2, h * 0.5, w * 0.2, 0, 6.3);
    g.globalAlpha = 0.85;
    g.fill();
    g.globalAlpha = 1;
    g.fillStyle = "#101010";
    g.font = "bold 30px sans-serif";
    g.textAlign = "center";
    g.fillText(word, w / 2, h * 0.52);
    g.fillStyle = ink;
    g.fillText(word, w / 2, h * 0.32);
  }, 256, 320);
}

function packetTex() {
  return canvasTex((g, w, h) => {
    const dyes = ["#e2b423", "#d24a3a", "#6a9a32", "#7a4aa8", "#e07a28", "#3a8a6a", "#c44858", "#e8c84a"];
    for (let i = 0; i < 8; i++) {
      g.fillStyle = dyes[i];
      g.fillRect(4, 8 + i * 36, w - 8, 30);
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.fillRect(16, 16 + i * 36, w * 0.45, 8);
    }
  }, 120, 320);
}

function cakeTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#5a3a28";
    g.fillRect(0, 0, w, h);
    const dyes = ["#f2d2a0", "#e8a24a", "#c4543a", "#f6e6c0", "#8aaa5a"];
    for (let i = 0; i < 5; i++) {
      g.fillStyle = dyes[i];
      g.fillRect(12, 16 + i * 36, w - 24, 26);
    }
  }, 180, 220);
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Facade-sized grime decal in metres, openings cut out. Authored x runs photo-left to right.
function grimeTex(holes) {
  const pm = 48;
  const cw = Math.round(W * pm);
  const ch = Math.round(ROOF * pm);
  const c = canvas(cw, ch);
  const g = c.getContext("2d");
  const r = rng(20020);
  const X = (x) => x * pm;
  const Y = (y) => (ROOF - y) * pm;
  let gr = g.createLinearGradient(0, Y(0), 0, Y(0.8));
  gr.addColorStop(0, "rgba(38,32,26,0.6)");
  gr.addColorStop(1, "rgba(38,32,26,0)");
  g.fillStyle = gr;
  g.fillRect(0, Y(0.8), cw, Y(0) - Y(0.8));
  gr = g.createLinearGradient(0, Y(ROOF), 0, Y(ROOF - 0.9));
  gr.addColorStop(0, "rgba(30,28,26,0.5)");
  gr.addColorStop(1, "rgba(30,28,26,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, cw, Y(ROOF - 0.9));
  // Soot under each band and sign line, run-off streaks below.
  for (const top of [3.24, 5.4, 8.0]) {
    gr = g.createLinearGradient(0, Y(top), 0, Y(top - 0.35));
    gr.addColorStop(0, "rgba(28,26,24,0.42)");
    gr.addColorStop(1, "rgba(28,26,24,0)");
    g.fillStyle = gr;
    g.fillRect(0, Y(top), cw, 0.35 * pm);
    for (let i = 0; i < 34; i++) {
      const x = r() * cw;
      const len = (0.3 + r() * 1.1) * pm;
      const sg = g.createLinearGradient(0, Y(top), 0, Y(top) + len);
      sg.addColorStop(0, "rgba(32,28,24," + (0.12 + r() * 0.22).toFixed(2) + ")");
      sg.addColorStop(1, "rgba(32,28,24,0)");
      g.fillStyle = sg;
      g.fillRect(x, Y(top), 2 + r() * 7, len);
    }
  }
  for (const hole of holes.filter((o) => o.y > 3)) {
    for (let i = 0; i < 7; i++) {
      const x = X(hole.x - hole.w / 2 + r() * hole.w);
      const top = Y(hole.y - hole.h / 2 - 0.1);
      const len = (0.4 + r() * 0.9) * pm;
      const sg = g.createLinearGradient(0, top, 0, top + len);
      sg.addColorStop(0, "rgba(30,26,22,0.38)");
      sg.addColorStop(1, "rgba(30,26,22,0)");
      g.fillStyle = sg;
      g.fillRect(x, top, 3 + r() * 6, len);
    }
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * cw;
    const y = r() * ch;
    const rad = (0.15 + r() * 0.6) * pm;
    const rg = g.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, r() < 0.3 ? "rgba(225,220,210,0.16)" : "rgba(40,34,28,0.16)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (const hole of holes) g.clearRect(X(hole.x - hole.w / 2), Y(hole.y + hole.h / 2), hole.w * pm, hole.h * pm);
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Dim room behind the upper windows: curtain to one side, ceiling darker.
function roomTex() {
  return canvasTex((g, w, h) => {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, "#14120f");
    gr.addColorStop(1, "#2a2520");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#6e6458";
    g.fillRect(w * 0.62, 0, w * 0.38, h);
    for (let i = 0; i < 9; i++) {
      g.fillStyle = i % 2 ? "rgba(0,0,0,0.22)" : "rgba(255,255,255,0.06)";
      g.fillRect(w * 0.62 + i * w * 0.042, 0, w * 0.02, h);
    }
    g.fillStyle = "rgba(190,200,205,0.18)";
    g.fillRect(0, 0, w * 0.6, h * 0.12);
  }, 256, 220);
}

// Bakery back: warm shelves, bread and boxed cakes, dark brown ceiling.
function bakeryBackTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2001);
    g.fillStyle = "#2a1c14";
    g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(w * 0.45, h * 0.3, 10, w * 0.45, h * 0.3, w * 0.6);
    gr.addColorStop(0, "rgba(255,214,160,0.35)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    for (let s = 0; s < 4; s++) {
      const y = 70 + s * 70;
      g.fillStyle = "#7a5a3c";
      g.fillRect(w * 0.42, y + 40, w * 0.55, 8);
      for (let i = 0; i < 12; i++) {
        g.fillStyle = ["#d8a060", "#c07838", "#f0d8b0", "#e8c890", "#b0602c"][Math.floor(r() * 5)];
        g.fillRect(w * 0.43 + i * w * 0.045, y + 12 + r() * 10, w * 0.035, 26);
      }
    }
    g.fillStyle = "#4a3426";
    g.fillRect(0, h * 0.2, w * 0.36, h * 0.8);
    g.fillStyle = "#e8e2d4";
    g.fillRect(w * 0.08, h * 0.28, w * 0.18, h * 0.16);
  }, 512, 360);
}

// Curved case front: red base with cake photos, the way the photo shows it.
function caseTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2002);
    g.fillStyle = "#1e1814";
    g.fillRect(0, 0, w, h);
    const lit = g.createLinearGradient(0, 0, 0, h * 0.55);
    lit.addColorStop(0, "#f6ead2");
    lit.addColorStop(1, "#c8a880");
    g.fillStyle = lit;
    g.fillRect(6, 6, w - 12, h * 0.55);
    for (let s = 0; s < 3; s++) {
      const y = 16 + s * 40;
      g.fillStyle = "#9a9894";
      g.fillRect(6, y + 30, w - 12, 4);
      for (let i = 0; i < 9; i++) {
        g.fillStyle = ["#f4e4c4", "#7a3c22", "#e8b878", "#f2f0e8", "#c84a5a", "#d89a50"][Math.floor(r() * 6)];
        g.beginPath();
        g.ellipse(30 + i * (w - 60) / 8, y + 20, 18, 11, 0, 0, 6.3);
        g.fill();
      }
    }
    g.fillStyle = "#b0201e";
    g.fillRect(0, h * 0.6, w, h * 0.4);
    for (let i = 0; i < 6; i++) {
      g.fillStyle = "#f2ece0";
      g.fillRect(14 + i * (w - 28) / 6, h * 0.66, (w - 28) / 6 - 10, h * 0.26);
      g.fillStyle = ["#e8c890", "#7a3c22", "#f0a0a8", "#c07838", "#f6e6c0", "#d8604a"][i];
      g.beginPath();
      g.arc(14 + i * (w - 28) / 6 + ((w - 28) / 6 - 10) / 2, h * 0.79, h * 0.08, 0, 6.3);
      g.fill();
    }
  }, 512, 300);
}

// Black wall of printed tees: the embroidery shop back as the photo shows it.
function shirtWallTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2003);
    g.fillStyle = "#0e0c0c";
    g.fillRect(0, 0, w, h);
    const prints = ["#e8c84a", "#e23a3a", "#d8dde2", "#f2f2ee", "#c84a2a", "#5aa0d8"];
    for (let row = 0; row < 3; row++) {
      for (let i = 0; i < 9; i++) {
        const x = 10 + i * (w - 20) / 9 + r() * 10;
        const y = 10 + row * h * 0.31;
        const sw = (w - 20) / 9 - 6;
        const sh = h * 0.28;
        const body = r() < 0.7 ? "#151313" : ["#2c4a8a", "#e8e6e0", "#8a1e22"][Math.floor(r() * 3)];
        shirt(g, x, y, sw, sh, body);
        g.fillStyle = prints[Math.floor(r() * prints.length)];
        g.beginPath();
        g.arc(x + sw / 2, y + sh * 0.45, sw * 0.2, 0, 6.3);
        g.fill();
      }
    }
    const shade = g.createLinearGradient(0, 0, 0, h);
    shade.addColorStop(0, "rgba(0,0,0,0)");
    shade.addColorStop(1, "rgba(0,0,0,0.55)");
    g.fillStyle = shade;
    g.fillRect(0, 0, w, h);
  }, 768, 400);
}

function shirt(g, x, y, sw, sh, body) {
  g.fillStyle = body;
  g.beginPath();
  g.moveTo(x + sw * 0.3, y);
  g.lineTo(x + sw * 0.7, y);
  g.lineTo(x + sw, y + sh * 0.18);
  g.lineTo(x + sw * 0.86, y + sh * 0.36);
  g.lineTo(x + sw * 0.78, y + sh * 0.3);
  g.lineTo(x + sw * 0.78, y + sh);
  g.lineTo(x + sw * 0.22, y + sh);
  g.lineTo(x + sw * 0.22, y + sh * 0.3);
  g.lineTo(x + sw * 0.14, y + sh * 0.36);
  g.lineTo(x, y + sh * 0.18);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(0,0,0,0.5)";
  g.beginPath();
  g.arc(x + sw / 2, y, sw * 0.12, 0, Math.PI);
  g.fill();
}

// Snack shop back: shelves of jars, bottles, boxes; one lamp.
function snackBackTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2004);
    g.fillStyle = "#1c1612";
    g.fillRect(0, 0, w, h);
    const gr = g.createRadialGradient(w * 0.6, h * 0.12, 4, w * 0.6, h * 0.12, w * 0.5);
    gr.addColorStop(0, "rgba(255,236,200,0.45)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
    for (let s = 0; s < 5; s++) {
      const y = 50 + s * 58;
      g.fillStyle = "#5a4430";
      g.fillRect(0, y + 40, w, 6);
      for (let x = 6; x < w - 20;) {
        const bw = 10 + r() * 22;
        const bh = 16 + r() * 22;
        g.fillStyle = ["#d8b040", "#c83a2a", "#2a6a3a", "#e8e0c8", "#3a5aa0", "#a05a28", "#e07a28"][Math.floor(r() * 7)];
        g.globalAlpha = 0.55 + r() * 0.35;
        g.fillRect(x, y + 40 - bh, bw, bh);
        x += bw + 2 + r() * 4;
      }
      g.globalAlpha = 1;
    }
  }, 512, 360);
}

// Sachet strip: pillow packets joined top to bottom, alpha cut between them.
function stripTex() {
  return canvasTex((g, w, h) => {
    const r = rng(2005);
    const cols = [["#f2c21a", "#d8281e"], ["#e83a8a", "#5a2a8a"], ["#f07a1a", "#2a8a3a"], ["#e8d24a", "#2a4aa0"], ["#c81e2a", "#f2e2a0"]];
    const lanes = 5;
    const lw = w / lanes;
    for (let k = 0; k < lanes; k++) {
      const [a, b] = cols[k];
      const n = 7 + Math.floor(r() * 3);
      const ph = h / n;
      for (let i = 0; i < n; i++) {
        const x = k * lw + 4;
        const y = i * ph + 2;
        g.fillStyle = a;
        g.fillRect(x, y, lw - 8, ph - 4);
        g.fillStyle = b;
        g.fillRect(x + 4, y + ph * 0.32, lw - 16, ph * 0.3);
        g.fillStyle = "rgba(255,255,255,0.7)";
        g.fillRect(x + 6, y + ph * 0.38, (lw - 20) * 0.6, ph * 0.08);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fillRect(x, y + ph - 8, lw - 8, 4);
      }
    }
  }, 320, 512);
}

export function createHouse020() {
  const root = new THREE.Group();
  root.name = "house-020";

  const groundHoles = [
    { x: 2.05, y: 1.28, w: 3.5, h: 2.35 },
    { x: 5.05, y: 1.18, w: 1.05, h: 2.15 },
    { x: 8.55, y: 1.35, w: 4.9, h: 2.5 },
    { x: 13.15, y: 1.32, w: 2.7, h: 2.4 },
    { x: 15.35, y: 1.22, w: 1.15, h: 2.2 },
  ];
  const midHoles = [
    { x: 2.05, y: 4.55, w: 1.55, h: 1.35 },
    { x: 5.15, y: 4.55, w: 1.2, h: 1.25 },
    { x: 7.7, y: 4.55, w: 1.65, h: 1.35 },
    { x: 10.15, y: 4.55, w: 1.65, h: 1.35 },
    { x: 13.4, y: 4.6, w: 1.45, h: 1.2 },
  ];
  const topHoles = [
    { x: 2.05, y: 6.75, w: 1.4, h: 1.15 },
    { x: 5.15, y: 6.75, w: 1.1, h: 1.1 },
    { x: 7.7, y: 6.75, w: 1.5, h: 1.15 },
    { x: 10.15, y: 6.75, w: 1.5, h: 1.15 },
    { x: 13.4, y: 6.75, w: 1.3, h: 1.05 },
  ];

  const plasterMaps = {
    diff: tex("plastered_wall_Diffuse.jpg", true, 1, 1),
    nor: tex("plastered_wall_nor_gl.jpg", false, 1, 1),
    arm: tex("plastered_wall_arm.jpg", false, 1, 1),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.1, 0.45),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.1, 0.45),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.1, 0.45),
  };
  const mats = {
    plaster: pbr(plasterMaps, 0xc2c2be, { ao: 0.35, ns: 0.45 }),
    plasterWarm: pbr(plasterMaps, 0xcdc6b8, { ao: 0.35, ns: 0.45 }),
    concrete: pbr(plasterMaps, 0xb2b0aa, { ao: 0.28, ns: 0.4 }),
    wood: pbr(woodMaps, 0x8a7564, { ao: 0.28 }),
    woodDark: pbr(woodMaps, 0x4a382e, { ao: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8a969a, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.32, vertexColors: true, depthWrite: false }),
    grime: new THREE.MeshStandardMaterial({ map: grimeTex([...groundHoles, ...midHoles, ...topHoles]), transparent: true, depthWrite: false, roughness: 1, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, vertexColors: true }),
    room: lit(roomTex(), 0.25),
    bakeryBack: lit(bakeryBackTex(), 0.3),
    caseFront: lit(caseTex(), 0.5),
    shirtWall: lit(shirtWallTex(), 0.18),
    snackBack: lit(snackBackTex(), 0.28),
    strip: new THREE.MeshStandardMaterial({ map: stripTex(), alphaTest: 0.5, roughness: 0.4, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    garland: new THREE.MeshStandardMaterial({ color: 0xe0701a, roughness: 0.7, metalness: 0, vertexColors: true }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xf4f0e6, emissiveIntensity: 0.6, roughness: 0.4, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x100e0c, roughness: 0.95, metalness: 0, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2c2926, roughness: 0.6, metalness: 0.05, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8a8e92, roughness: 0.45, metalness: 0.35, vertexColors: true }),
    plant: new THREE.MeshStandardMaterial({ color: 0x3d6a32, roughness: 0.85, metalness: 0, vertexColors: true }),
    bakery: new THREE.MeshStandardMaterial({ map: bakerySign(), roughness: 0.55, metalness: 0, vertexColors: true }),
    green: new THREE.MeshStandardMaterial({ map: greenSign(), roughness: 0.55, metalness: 0, vertexColors: true }),
    blue: new THREE.MeshStandardMaterial({ map: blueSign(), roughness: 0.5, metalness: 0, vertexColors: true }),
    vert: new THREE.MeshStandardMaterial({ map: vertSign(), roughness: 0.55, metalness: 0, vertexColors: true }),
    ice: new THREE.MeshStandardMaterial({ map: iceSign(), roughness: 0.8, metalness: 0, vertexColors: true }),
    tee: new THREE.MeshStandardMaterial({ map: teeTex("GUNS", "#e6c24a"), alphaTest: 0.5, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    tee2: new THREE.MeshStandardMaterial({ map: teeTex("NIRVANA", "#e8c84a"), alphaTest: 0.5, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    tee3: new THREE.MeshStandardMaterial({ map: teeTex("EVERES", "#d8dde2"), alphaTest: 0.5, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    tee4: new THREE.MeshStandardMaterial({ map: teeTex("ROLLING", "#e24a3a"), alphaTest: 0.5, roughness: 0.8, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    packets: new THREE.MeshStandardMaterial({ map: packetTex(), roughness: 0.45, metalness: 0.05, side: THREE.DoubleSide, vertexColors: true }),
    cakes: new THREE.MeshStandardMaterial({ map: cakeTex(), roughness: 0.7, metalness: 0, vertexColors: true }),
  };
  for (const key of Object.keys(mats)) houseShader(mats[key], key);

  const buckets = {};
  function add(name, g, tint) {
    const p = g.attributes.position;
    const rgb = tint || [1, 1, 1];
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const k = 0.93 + 0.07 * hash(p.getX(i), p.getY(i), p.getZ(i));
      c[i * 3] = rgb[0] * k;
      c[i * 3 + 1] = rgb[1] * k;
      c[i * 3 + 2] = rgb[2] * k;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    // place.js yaws the mesh 180, so authored photo-left (low x) is stored at W-x.
    const g = place(CANVAS.has(name) || name.startsWith("tee") ? new THREE.BoxGeometry(w, h, d) : boxGeo(w, h, d), W - x, y, z);
    if (GRIME.has(name)) worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes)) {
      addBox(name, part.w, part.h, T, part.x, part.y, T / 2, tint);
    }
  }
  function frame(x, y, w, h, z, mat) {
    addBox(mat, 0.06, h + 0.06, 0.05, x - w / 2, y, z);
    addBox(mat, 0.06, h + 0.06, 0.05, x + w / 2, y, z);
    addBox(mat, w + 0.08, 0.06, 0.05, x, y + h / 2, z);
    addBox(mat, w + 0.08, 0.06, 0.06, x, y - h / 2, z);
  }
  function pane(x, y, w, h) {
    frame(x, y, w, h, -0.02, "woodDark");
    addBox("glass", w - 0.08, h - 0.08, 0.02, x, y, 0.02, [0.55, 0.58, 0.6]);
    addBox("dark", w - 0.12, h - 0.12, 0.08, x, y, 0.12);
    addBox("woodDark", 0.04, h - 0.1, 0.03, x, y, 0.0);
  }

  wallZ("plaster", 0, 11.4, 0, 3.28, groundHoles);
  wallZ("plasterWarm", 11.4, W, 0, 3.28, groundHoles, [1.05, 0.98, 0.94]);
  addBox("concrete", W + 0.08, 0.16, 0.6, W / 2, 3.32, -0.2, [0.8, 0.78, 0.74]);
  wallZ("plaster", 0, W, 3.36, 5.42, midHoles);
  addBox("concrete", W + 0.06, 0.12, 0.22, W / 2, 5.46, -0.04, [0.72, 0.7, 0.66]);
  wallZ("plaster", 0, W, 5.5, ROOF, topHoles, [0.96, 0.96, 0.95]);
  addBox("concrete", W + 0.1, 0.18, 0.28, W / 2, 8.05, -0.06, [0.7, 0.68, 0.64]);

  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2, [0.96, 0.93, 0.9]);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("concrete", W - 0.4, 0.14, D - 0.5, W / 2, ROOF + 0.06, D / 2);
  addBox("concrete", 0.85, 0.7, 0.85, 4.2, ROOF + 0.4, 8.4, [0.62, 0.6, 0.58]);

  // Facing-street plane at authored x (photo-left is low x).
  function card(name, w, h, x, y, z, rz, tint) {
    add(name, place(new THREE.PlaneGeometry(w, h), W - x, y, z, 0, Math.PI, rz || 0), tint);
  }

  card("grime", W, ROOF, W / 2, ROOF / 2, -0.004);

  for (const hole of [...midHoles, ...topHoles]) {
    pane(hole.x, hole.y, hole.w, hole.h);
    card("room", hole.w - 0.1, hole.h - 0.1, hole.x, hole.y, 0.075);
    addBox("concrete", hole.w + 0.22, 0.07, 0.17, hole.x, hole.y - hole.h / 2 - 0.07, -0.07, [0.86, 0.85, 0.82]);
    addBox("concrete", hole.w + 0.16, 0.08, 0.09, hole.x, hole.y + hole.h / 2 + 0.07, -0.035, [0.9, 0.89, 0.86]);
  }
  addBox("plant", 0.3, 0.28, 0.22, 2.3, 4.0, -0.12, [0.7, 0.85, 0.45]);
  addBox("goods", 0.2, 0.14, 0.16, 2.3, 3.86, -0.1, [0.55, 0.32, 0.22]);

  // Bakery: lit shelves behind, the curved glass case inside the bay, a pot at the pier.
  addBox("dark", 3.3, 2.15, 0.55, 2.05, 1.2, 0.85);
  card("bakeryBack", 3.3, 2.15, 2.05, 1.2, 0.56);
  card("caseFront", 1.6, 0.8, 2.3, 0.45, 0.02);
  addBox("woodDark", 1.64, 0.06, 0.34, 2.3, 0.04, 0.18);
  addBox("caseFront", 1.6, 0.04, 0.3, 2.3, 0.85, 0.18);
  {
    const arc = new THREE.CylinderGeometry(0.3, 0.3, 1.6, 8, 1, true, Math.PI / 2, Math.PI / 2);
    arc.rotateZ(Math.PI / 2);
    add("glass", place(arc, W - 2.3, 0.85, 0.32), [0.9, 0.95, 0.95]);
  }
  addBox("metal", 1.62, 0.03, 0.03, 2.3, 1.15, 0.32);
  addBox("plant", 0.36, 0.42, 0.32, 0.4, 0.62, -0.18, [0.45, 0.7, 0.32]);
  addBox("goods", 0.34, 0.3, 0.34, 0.4, 0.2, -0.18, [0.42, 0.26, 0.16]);
  addBox("bakery", 3.35, 0.72, 0.08, 2.05, 2.78, -0.06);

  addBox("dark", 0.9, 2.05, 0.4, 5.05, 1.15, 0.4);
  addBox("woodDark", 0.08, 2.15, 0.08, 4.55, 1.15, -0.02);
  addBox("woodDark", 0.08, 2.15, 0.08, 5.55, 1.15, -0.02);
  for (let i = 0; i < 6; i++) addBox("metal", 0.03, 1.9, 0.03, 4.7 + i * 0.12, 1.15, -0.01, [0.4, 0.42, 0.44]);
  for (let i = 0; i < 4; i++) addBox("metal", 0.9, 0.03, 0.03, 5.05, 0.4 + i * 0.5, -0.01, [0.4, 0.42, 0.44]);
  addBox("green", 1.85, 0.62, 0.08, 5.15, 2.78, -0.08);
  addBox("vert", 0.16, 1.7, 0.02, 4.15, 1.35, -0.012);

  // Embroidery: black wall of printed tees, more hung in front, folded tees on the table.
  addBox("dark", 4.6, 2.2, 0.5, 8.55, 1.3, 0.9);
  card("shirtWall", 4.6, 2.2, 8.55, 1.3, 0.63);
  addBox("wood", 1.5, 0.08, 0.55, 8.7, 0.92, -0.02, [0.55, 0.4, 0.26]);
  addBox("wood", 0.08, 0.72, 0.08, 8.05, 0.52, -0.02);
  addBox("wood", 0.08, 0.72, 0.08, 9.35, 0.52, -0.02);
  addBox("goods", 0.34, 0.06, 0.26, 8.3, 0.99, -0.04, [0.85, 0.85, 0.82]);
  addBox("goods", 0.34, 0.08, 0.26, 8.72, 1.0, -0.02, [0.03, 0.03, 0.035]);
  addBox("goods", 0.34, 0.05, 0.26, 9.12, 0.985, -0.04, [0.6, 0.06, 0.05]);
  const tees = ["tee", "tee2", "tee3", "tee4", "tee", "tee2", "tee3"];
  for (let i = 0; i < 7; i++) card(tees[i], 0.58, 0.68, 6.65 + i * 0.6, 2.12, -0.04 + 0.03 * (i % 2), 0.03 * (i % 3 - 1));
  for (let i = 0; i < 4; i++) card(tees[(i + 3) % 7], 0.56, 0.66, 6.6 + i * 0.36, 1.32, 0.12 + 0.05 * i);
  card("tee3", 0.5, 0.58, 8.45, 0.62, -0.31);
  card("tee", 0.5, 0.58, 8.95, 0.62, -0.31);
  addBox("blue", 4.7, 0.78, 0.08, 8.55, 2.95, -0.08);
  addBox("metal", 4.4, 0.04, 0.06, 8.55, 2.45, -0.02, [0.5, 0.52, 0.54]);

  // Snack counter: lit shelves, glass counter with jars, sachet strips, orange garland.
  addBox("dark", 2.5, 2.15, 0.5, 13.15, 1.28, 0.9);
  card("snackBack", 2.5, 2.15, 13.15, 1.28, 0.63);
  addBox("woodDark", 2.15, 0.25, 0.42, 13.1, 0.22, -0.06);
  addBox("glass", 2.15, 0.62, 0.42, 13.1, 0.66, -0.06, [0.9, 0.95, 0.95]);
  card("snackBack", 2.0, 0.55, 13.1, 0.66, 0.12);
  addBox("metal", 2.17, 0.03, 0.44, 13.1, 0.98, -0.06, [0.6, 0.6, 0.6]);
  addBox("ice", 0.42, 0.52, 0.02, 13.0, 0.68, -0.285);
  card("packets", 0.32, 0.36, 13.75, 0.75, -0.285);
  card("packets", 0.32, 0.36, 13.75, 0.38, -0.285);
  for (let i = 0; i < 8; i++) {
    const jar = new THREE.CylinderGeometry(0.055, 0.055, 0.2 + 0.06 * (i % 3), 8);
    add("goods", place(jar, W - (12.3 + i * 0.17), 1.1 + 0.03 * (i % 3), -0.1), i % 2 ? [0.12, 0.2, 0.32] : [0.45, 0.16, 0.03]);
  }
  for (let i = 0; i < 4; i++) card("strip", 0.5, 0.95 + 0.15 * (i % 2), 12.2 + i * 0.62, 1.95 - 0.07 * (i % 2), -0.12 - 0.04 * i, 0.03 * (i - 1.5), [0.62, 0.58, 0.55]);
  card("strip", 0.2, 1.85, 11.68, 1.35, -0.16, 0, [0.62, 0.58, 0.55]);
  {
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const t = i / 48;
      pts.push(new THREE.Vector3(W - (11.8 + 2.8 * t), 2.55 - 0.2 * Math.pow(Math.sin(t * Math.PI * 4), 2), -0.2));
    }
    add("garland", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.022, 4, false));
    for (let i = 0; i < 40; i++) {
      const p = pts[Math.round(i * 48 / 40)];
      add("garland", new THREE.SphereGeometry(0.035, 5, 3).translate(p.x, p.y - 0.03, p.z), i % 3 ? [0.7, 0.42, 0.1] : [0.55, 0.18, 0.04]);
    }
  }
  addBox("dark", 1.05, 2.1, 0.45, 15.35, 1.18, 0.4);
  addBox("woodDark", 0.08, 2.15, 0.07, 14.8, 1.18, -0.02);
  addBox("woodDark", 0.08, 2.15, 0.07, 15.9, 1.18, -0.02);

  addBox("concrete", 4.4, 0.12, 0.42, 13.4, 0.08, -0.16, [0.7, 0.66, 0.6]);
  addBox("concrete", 3.6, 0.12, 0.32, 13.5, 0.2, -0.28, [0.66, 0.62, 0.56]);
  addBox("concrete", 3.4, 0.1, 0.28, 8.6, 0.06, -0.1, [0.68, 0.64, 0.58]);
  addBox("concrete", 0.62, 1.3, 0.3, 11.42, 0.65, -0.15, [0.95, 0.92, 0.86]);

  // Wall lamp on a curved arm over the bakery sign.
  {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(W - 3.75, 3.85 + 0.25 * Math.sin(t * Math.PI * 0.5), -0.02 - 0.55 * t));
    }
    add("metal", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.018, 4, false), [0.25, 0.25, 0.26]);
    add("metal", place(new THREE.ConeGeometry(0.11, 0.1, 10, 1, true), W - 3.75, 3.98, -0.57), [0.3, 0.3, 0.3]);
    add("lamp", place(new THREE.SphereGeometry(0.06, 8, 6), W - 3.75, 3.9, -0.57));
  }

  // Cables end on wall brackets. Bundles sag; each strand its own droop.
  function cable(x0, y0, x1, y1, droop, z, r) {
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      pts.push(new THREE.Vector3(W - (x0 + (x1 - x0) * t), y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * droop, z - Math.sin(Math.PI * t) * 0.15));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, r || 0.012, 4, false), [0.5, 0.48, 0.45]);
  }
  const rw = rng(20020);
  for (let i = 0; i < 10; i++) cable(0.1, 6.95 - rw() * 0.25, 10.3, 4.85 + rw() * 0.12, 0.45 + rw() * 0.5, -0.3 - rw() * 0.12, 0.009 + rw() * 0.01);
  for (let i = 0; i < 7; i++) cable(10.3, 4.85 + rw() * 0.12, 16.1, 5.5 + rw() * 0.3, 0.25 + rw() * 0.35, -0.32 - rw() * 0.1, 0.009 + rw() * 0.008);
  for (let i = 0; i < 4; i++) cable(0.2, 3.85 + rw() * 0.1, 10.3, 4.7, 0.3 + rw() * 0.25, -0.5 - rw() * 0.08, 0.01);
  for (let i = 0; i < 3; i++) cable(10.3, 4.7, 11.5 + i * 0.15, 3.45, 0.12 + i * 0.05, -0.32, 0.009);
  addBox("goods", 0.3, 0.38, 0.14, 10.3, 4.75, -0.22, [0.8, 0.78, 0.72]);
  addBox("metal", 0.06, 0.1, 0.34, 0.1, 6.95, -0.17, [0.3, 0.3, 0.3]);
  addBox("metal", 0.06, 0.1, 0.34, 16.1, 5.6, -0.17, [0.3, 0.3, 0.3]);
  addBox("metal", 0.06, 0.1, 0.5, 0.2, 3.85, -0.25, [0.3, 0.3, 0.3]);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass" && name !== "grime";
    mesh.receiveShadow = true;
    root.add(mesh);
  }

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "020";
  return root;
}
