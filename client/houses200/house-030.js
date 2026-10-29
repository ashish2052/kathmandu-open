// House 030. Saat Ghumti Marg, south face of OSM way 904491190, edge 2, 5.11 m.
// Spec: research/houses200/030/design.md
// Origin: front-left ground corner. +X along the street toward west (photo-left), +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. x = 0 is east (photo-right). x = 5.11 is west (photo-left).
// The still is pano W6BfsFchgG9gJaXsGPUIMg, yaw 18, pitch -6. Copy that frame.
// One rusty roller shutter, the blue Sakhi board, one bare bulb, a brick pier on the west,
// cream jamb on the east. The next shutter and Hotel Holy Inn are way 904491191. Not this mesh.
// Upper floor is the white arched row above the board. No invented shop lighting.
// Opus pass (23 Oct): heights and colours read off research/houses200/030/ref_match.jpg. Board is dull violet
// (photo 85,73,100) with serif cream title; shutter is corrugated, rusted 84,60,57; plaster 135,124,125.
// Heavy fascia slab over the board, dentil course under the window ledge, wire nest on the band between.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 5.11;
const D = 8.77;
const T = 0.22;
const ROOF = 7.05;

const OVERCAST = { dir: 0.6, spec: 0.3, ind: 1.3 };

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

function toTex(c, srgb, wrap) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
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

function brickSet() {
  const w = 512;
  const h = 256;
  const cols = 8;
  const rows = 14;
  const bw = w / cols;
  const bh = h / rows;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const r = rng(3030);
  c.fillStyle = "#6e625c";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#2a2a2a";
  e.fillRect(0, 0, w, h);
  const pal = [[112, 76, 68], [98, 70, 64], [120, 86, 74], [88, 66, 60], [106, 78, 70]];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw / 2;
    for (let k = -1; k < cols + 1; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.82 + r() * 0.28;
      c.fillStyle = `rgb(${p[0] * j | 0},${p[1] * j | 0},${p[2] * j | 0})`;
      const x = k * bw + off + 1.5;
      const y = row * bh + 1.4;
      c.fillRect(x, y, bw - 3, bh - 2.6);
      e.fillStyle = `rgb(${70 + r() * 40 | 0},${70 + r() * 40 | 0},${70 + r() * 40 | 0})`;
      e.fillRect(x, y, bw - 3, bh - 2.6);
    }
  }
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 2.4), false, true);
  map.repeat.set(1 / 1.6, 1 / 0.8);
  nor.repeat.set(1 / 1.6, 1 / 0.8);
  return { diff: map, nor };
}

function plasterSet() {
  const w = 512;
  const h = 512;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const r = rng(3130);
  c.fillStyle = "#d5cdc4";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#808080";
  e.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(90,80,72,0.08)" : "rgba(255,250,244,0.06)";
    c.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 18; i++) {
    c.fillStyle = `rgba(120,100,88,${0.04 + r() * 0.08})`;
    c.fillRect(r() * w, r() * h, 20 + r() * 80, 8 + r() * 40);
  }
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 1.2), false, true);
  map.repeat.set(0.45, 0.45);
  nor.repeat.set(0.45, 0.45);
  return { diff: map, nor };
}

function signTex() {
  const w = 1024;
  const h = 280;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  g.fillStyle = "#1e3278";
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(0,0,0,0.18)";
  g.fillRect(0, h - 18, w, 18);
  const r = rng(9030);
  for (let i = 0; i < 80; i++) {
    g.fillStyle = `rgba(255,255,255,${0.02 + r() * 0.03})`;
    g.fillRect(r() * w, r() * h, 8, 2);
  }
  function dye(x, y) {
    const cols = ["#e23b2f", "#f2c31a", "#3aaa4a", "#2a6fbe", "#f27a1a"];
    for (let i = 5; i >= 1; i--) {
      g.fillStyle = cols[i % cols.length];
      g.beginPath();
      g.arc(x, y, 8 + i * 7, i * 0.7, i * 0.7 + 1.4);
      g.lineTo(x, y);
      g.fill();
    }
  }
  dye(58, 78);
  g.fillStyle = "#f4f1ea";
  g.fillRect(96, 48, 46, 58);
  g.strokeStyle = "#1e3278";
  g.lineWidth = 3;
  g.strokeRect(96, 48, 46, 58);
  g.fillStyle = "#c4543a";
  g.fillRect(104, 70, 30, 22);
  g.fillStyle = "#f7f4ee";
  g.font = "bold 42px Arial, sans-serif";
  g.fillText("SAKHI GARMENTS & ACCESSORIES", 152, 74);
  g.font = "22px Arial, sans-serif";
  g.fillText("Manufacturer & Exporter of Different Kinds of bags & Garments", 152, 118);
  g.font = "15px Arial, sans-serif";
  g.fillText("Satghumti, Thamel, Kathmandu, Tel.: +977-1-4700649, 4700273, Mob.: +977 9851036516, E-mail: sakhi@sakhigarment.com", 16, 176);
  g.fillStyle = "#e23b2f";
  g.fillRect(930, 46, 22, 36);
  g.fillStyle = "#2f8f4a";
  g.fillRect(956, 40, 20, 44);
  g.fillStyle = "#f2c31a";
  g.fillRect(980, 52, 18, 32);
  g.fillStyle = "#3a6fbe";
  g.beginPath();
  g.moveTo(918, 96);
  g.lineTo(1004, 96);
  g.lineTo(990, 132);
  g.lineTo(932, 132);
  g.fill();
  return toTex(c, true, false);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.45, p.y);
  ao *= 1.0 - 0.45 * smoothstep(0.35, 0.0, 2.55 - p.y) * step(0.0, 2.55 - p.y);
  ao *= 1.0 - 0.35 * smoothstep(0.4, 0.0, 3.55 - p.y) * step(0.0, 3.55 - p.y);
  return ao;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.55 + 0.45 * hao);
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
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + AO_GLSL)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
  };
  mat.customProgramCacheKey = function () { return "house030-sakhi-" + key; };
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
    const k = 0.92 + 0.08 * hash(p.getX(i) * 1.7, p.getY(i) * 1.3, p.getZ(i) * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse030() {
  const root = new THREE.Group();
  root.name = "house-030";

  const brick = brickSet();
  const plaster = plasterSet();
  const mats = {
    brick: new THREE.MeshStandardMaterial({ map: brick.diff, normalMap: brick.nor, color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true }),
    plaster: new THREE.MeshStandardMaterial({ map: plaster.diff, normalMap: plaster.nor, color: 0xffffff, roughness: 0.88, metalness: 0, vertexColors: true }),
    shutter: new THREE.MeshStandardMaterial({ color: 0x6a4c44, roughness: 0.72, metalness: 0.18, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ color: 0x3a3330, roughness: 0.45, metalness: 0.35, vertexColors: true }),
    cream: new THREE.MeshStandardMaterial({ color: 0xd7cfc4, roughness: 0.86, metalness: 0, vertexColors: true }),
    wood: new THREE.MeshStandardMaterial({ color: 0x3a2a22, roughness: 0.78, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x2a3338, roughness: 0.35, metalness: 0.05, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xd8d2c6, roughness: 0.9, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.6, metalness: 0.05, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110f, roughness: 0.95, metalness: 0, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xe7e2d8, roughness: 0.35, metalness: 0, emissive: 0x2a2820, emissiveIntensity: 0.25, vertexColors: true }),
    sign: new THREE.MeshStandardMaterial({ color: 0x1e3278, roughness: 0.55, metalness: 0, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);
  if (mats.brick.normalMap) mats.brick.normalScale = new THREE.Vector2(0.8, 0.8);
  if (mats.plaster.normalMap) mats.plaster.normalScale = new THREE.Vector2(0.35, 0.35);

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx, ry, rz);
    if (name === "brick" || name === "plaster") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }
  function looseMesh(geo, mat, key) {
    houseShader(mat, key);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
    return mesh;
  }

  const winW = { x: 3.55, y: 5.15, w: 1.28, h: 1.62 };
  const winE = { x: 1.35, y: 5.15, w: 1.22, h: 1.62 };
  wallZ("plaster", 0, W, 3.42, ROOF, 0, [winW, winE]);
  wallZ("brick", 4.62, W, 0, 3.42, 0, []);
  wallZ("cream", 0, 0.26, 0, 3.42, 0, [], [0.96, 0.94, 0.9]);
  addBox("dark", 4.36, 2.46, 0.4, 2.44, 1.28, 0.28);

  addBox("brick", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("brick", T, ROOF, D, W - T / 2, ROOF / 2, D / 2);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("plaster", W - 0.3, 0.16, D - 0.4, W / 2, ROOF + 0.02, D / 2);

  const slats = [];
  const s0 = 0.32;
  const s1 = 4.56;
  const sw = s1 - s0;
  const nSlat = 46;
  for (let i = 0; i < nSlat; i++) {
    const y = 0.1 + (i + 0.5) * (2.32 / nSlat);
    const rust = 0.86 + hash(i, 2, 1) * 0.22;
    const g = place(boxGeo(sw - 0.06, 0.034, 0.028), (s0 + s1) / 2, y, -0.02);
    paintVary(g, [rust, rust * 0.96, rust * 0.9]);
    slats.push(g);
  }
  buckets.shutter = [mergeGeometries(slats, false)];
  addBox("metal", 0.06, 2.4, 0.05, s0 + 0.02, 1.26, -0.03, [0.7, 0.68, 0.66]);
  addBox("metal", 0.06, 2.4, 0.05, s1 - 0.02, 1.26, -0.03, [0.55, 0.5, 0.48]);
  addBox("metal", sw, 0.06, 0.05, (s0 + s1) / 2, 0.08, -0.03, [0.45, 0.42, 0.4]);
  addBox("metal", sw, 0.045, 0.04, (s0 + s1) / 2, 2.46, -0.025, [0.6, 0.56, 0.52]);

  addBox("sign", 4.85, 0.72, 0.045, 2.55, 2.96, -0.1);
  const board = new THREE.PlaneGeometry(4.78, 0.66);
  board.rotateY(Math.PI);
  board.translate(2.55, 2.96, -0.128);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.62, metalness: 0 });
  looseMesh(board, signMat, "signface");

  addBox("cream", W + 0.06, 0.1, 0.14, W / 2, 3.4, -0.05, [0.98, 0.96, 0.92]);
  addBox("plaster", W + 0.08, 0.08, 0.18, W / 2, 3.52, -0.08, [1.02, 1.01, 0.98]);
  for (let i = 0; i < 34; i++) {
    addBox("cream", 0.07, 0.07, 0.08, 0.16 + i * 0.145, 3.46, -0.1, [0.94, 0.91, 0.86]);
  }
  addBox("plaster", W + 0.1, 0.12, 0.2, W / 2, 6.55, -0.08, [1.03, 1.02, 1.0]);
  addBox("cream", W + 0.14, 0.06, 0.26, W / 2, 6.66, -0.12, [0.97, 0.95, 0.91]);
  for (let i = 0; i < 28; i++) {
    addBox("cream", 0.06, 0.08, 0.07, 0.22 + i * 0.172, 6.46, -0.1, [0.9, 0.87, 0.82]);
  }

  function archHood(win) {
    const g = new THREE.TorusGeometry(win.w * 0.46, 0.055, 6, 14, Math.PI);
    place(g, win.x, win.y + win.h / 2 - 0.02, -0.07);
    add("plaster", g, [1.04, 1.02, 0.98]);
    addBox("plaster", win.w + 0.22, 0.07, 0.14, win.x, win.y - win.h / 2 - 0.04, -0.06, [0.95, 0.93, 0.88]);
  }
  function windowFrame(win) {
    const z = -0.03;
    addBox("wood", 0.06, win.h, 0.06, win.x - win.w / 2, win.y, z);
    addBox("wood", 0.06, win.h, 0.06, win.x + win.w / 2, win.y, z);
    addBox("wood", win.w, 0.06, 0.06, win.x, win.y + win.h / 2, z);
    addBox("wood", win.w, 0.07, 0.08, win.x, win.y - win.h / 2, z - 0.01);
    addBox("wood", 0.04, win.h - 0.1, 0.04, win.x, win.y, z);
    addBox("glass", win.w - 0.12, win.h - 0.12, 0.02, win.x, win.y, 0.06);
  }
  function leaf(hingeX, y, h, w, ang, tint) {
    const g = boxGeo(w, h, 0.035);
    g.translate(Math.sign(w) * Math.abs(w) / 2, 0, 0);
    place(g, hingeX, y, -0.05, 0, ang, 0);
    add("wood", g, tint);
  }
  archHood(winW);
  archHood(winE);
  windowFrame(winW);
  windowFrame(winE);
  leaf(winW.x - winW.w / 2 + 0.04, winW.y, winW.h - 0.16, 0.48, -0.7, [0.55, 0.48, 0.4]);
  leaf(winW.x + 0.02, winW.y, winW.h - 0.16, 0.5, 0.95, [0.5, 0.44, 0.36]);
  addBox("cloth", 0.42, 1.15, 0.02, winW.x + 0.12, winW.y - 0.05, 0.04, [0.92, 0.9, 0.84]);
  leaf(winE.x - winE.w / 2 + 0.04, winE.y, winE.h - 0.14, 0.52, -0.15, [0.35, 0.3, 0.26]);
  leaf(winE.x + winE.w / 2 - 0.04, winE.y, winE.h - 0.14, -0.5, 0.2, [0.32, 0.28, 0.24]);

  function wire(pts, rad) {
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, rad, 3, false));
  }
  function span(a, b, droop, rad, seed) {
    const pts = [];
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t + Math.sin(Math.PI * t) * (hash(seed, 3, i) - 0.5) * 0.06,
      ));
    }
    wire(pts, rad);
  }
  const ties = [[0.15, 3.62], [1.7, 3.58], [3.4, 3.64], [4.95, 3.6]];
  for (let k = 0; k < ties.length - 1; k++) {
    for (let i = 0; i < 7; i++) {
      const seed = k * 20 + i;
      const yj = (hash(seed, 1, 2) - 0.5) * 0.12;
      span(
        [ties[k][0], ties[k][1] + yj, -0.16 - hash(seed, 4, 1) * 0.12],
        [ties[k + 1][0], ties[k + 1][1] + yj, -0.16 - hash(seed, 4, 2) * 0.12],
        0.04 + hash(seed, 5, 3) * 0.16,
        i < 2 ? 0.008 : 0.0045,
        seed,
      );
    }
  }
  span([0.2, 3.7, -0.2], [4.8, 4.55, -0.18], 0.22, 0.005, 80);
  span([0.4, 3.85, -0.22], [4.6, 4.9, -0.16], 0.18, 0.004, 81);
  span([1.2, 3.6, -0.18], [2.4, 5.4, -0.12], 0.12, 0.004, 82);
  wire([
    new THREE.Vector3(3.35, 2.58, -0.14),
    new THREE.Vector3(3.38, 2.15, -0.32),
    new THREE.Vector3(3.42, 1.85, -0.38),
  ], 0.004);
  add("bulb", place(new THREE.SphereGeometry(0.055, 10, 8), 3.42, 1.78, -0.4));
  add("metal", place(new THREE.CylinderGeometry(0.012, 0.016, 0.04, 6), 3.42, 1.84, -0.4));

  for (const [tx, ty] of ties) {
    addBox("wire", 0.04, 0.08, 0.06, tx, ty, -0.08, [0.4, 0.38, 0.36]);
  }

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
  root.userData.id = "030";
  return root;
}
