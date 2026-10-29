// House 007. Basantapur Square south edge, OSM way 420797423, edge 3, 4.61 m.
// Spec: research/houses200/007/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The square is negative Z. place.js yaws 180, so house
// x = 0 is photo-right (west, Heritage Cafe) and x = 4.61 is photo-left
// (east, the pink shop). Pano aZos3BZSwUNS9vy2u0RqdA, yaw 172, pitch -12.
// Still samples: pink wall #80375e, white plaster #bcbdba. No phone number.
// Opus pass (22 Oct) matched to ref/up_mid.jpg and ref/sign_tight.jpg: cream
// plaster above the pink shop, plaster cusped arches, baluster windows, the
// sweet shop reads "शरण" not "शर्मा", and the wire tangle with its coil cluster.
// The co-op board's Nepali, address and email were not transcribed.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 4.61;
const D = 4.36;
const T = 0.22;
const ROOF = 9.35;
const EAST_TOP = 7.55;
const SPLIT = 2.32;
const OVERCAST = { dir: 0.6, spec: 0.3, ind: 1.3 };

const PINK = [0.84, 0.3, 0.54];
const PINK2 = [0.7, 0.22, 0.44];
const PLASTER = [0.95, 0.92, 0.85];
const OLD = [0.9, 0.86, 0.78];
const GREEN = [0.13, 0.4, 0.3];
const WOOD = [0.22, 0.11, 0.07];
const WOOD2 = [0.32, 0.18, 0.11];
const METAL = [0.46, 0.48, 0.5];

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

function plasterMaps() {
  const w = 512;
  const h = 512;
  const col = canvas(w, h);
  const g = col.getContext("2d");
  const r = rng(7007);
  g.fillStyle = "#e6e1d8";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1600; i++) {
    g.fillStyle = r() > 0.55 ? "rgba(70,62,54,0.14)" : "rgba(255,250,242,0.16)";
    g.fillRect(r() * w, r() * h, 2 + r() * 7, 2 + r() * 5);
  }
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 20 + r() * 70;
    const blot = g.createRadialGradient(x, y, 0, x, y, rad);
    blot.addColorStop(0, r() > 0.4 ? "rgba(96,84,66,0.13)" : "rgba(255,252,244,0.12)");
    blot.addColorStop(1, "rgba(96,84,66,0)");
    g.fillStyle = blot;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.strokeStyle = "rgba(60,52,44,0.28)";
  g.lineWidth = 1;
  for (let i = 0; i < 9; i++) {
    let x = r() * w;
    let y = r() * h;
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (r() - 0.5) * 18;
      y += 6 + r() * 12;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const soot = g.createLinearGradient(0, h * 0.72, 0, h);
  soot.addColorStop(0, "rgba(40,32,28,0)");
  soot.addColorStop(1, "rgba(40,30,26,0.35)");
  g.fillStyle = soot;
  g.fillRect(0, h * 0.72, w, h * 0.28);
  const map = toTex(col, true, true);
  map.repeat.set(0.7, 0.7);
  return map;
}

function grimeMap() {
  const c = canvas(128, 256);
  const g = c.getContext("2d");
  const r = rng(907);
  const base = g.createLinearGradient(0, 0, 0, 256);
  base.addColorStop(0, "rgba(58,46,36,0.42)");
  base.addColorStop(0.35, "rgba(58,46,36,0.16)");
  base.addColorStop(1, "rgba(58,46,36,0)");
  g.fillStyle = base;
  g.fillRect(0, 0, 128, 256);
  for (let i = 0; i < 22; i++) {
    const x = r() * 128;
    const len = 60 + r() * 190;
    const streak = g.createLinearGradient(0, 0, 0, len);
    streak.addColorStop(0, "rgba(50,40,32," + (0.2 + r() * 0.3).toFixed(2) + ")");
    streak.addColorStop(1, "rgba(50,40,32,0)");
    g.fillStyle = streak;
    g.fillRect(x, 0, 1 + r() * 4, len);
  }
  return toTex(c, true, false);
}

function signCafe() {
  const c = canvas(640, 360);
  const g = c.getContext("2d");
  g.fillStyle = "#ebe6dc";
  g.fillRect(0, 0, 640, 360);
  const age = g.createLinearGradient(0, 0, 0, 360);
  age.addColorStop(0, "rgba(90,80,64,0.12)");
  age.addColorStop(1, "rgba(90,80,64,0.22)");
  g.fillStyle = age;
  g.fillRect(0, 0, 640, 360);
  g.strokeStyle = "#8f877a";
  g.lineWidth = 8;
  g.strokeRect(6, 6, 628, 348);
  g.fillStyle = "#1a1a1a";
  g.beginPath();
  g.moveTo(320, 36);
  g.lineTo(392, 78);
  g.lineTo(248, 78);
  g.closePath();
  g.fill();
  g.beginPath();
  g.moveTo(268, 78);
  g.lineTo(372, 78);
  g.lineTo(404, 108);
  g.lineTo(236, 108);
  g.closePath();
  g.fill();
  g.fillRect(300, 108, 40, 16);
  for (let i = 0; i < 7; i++) g.fillRect(268 + i * 16, 100, 4, 10);
  g.font = "600 74px 'Trebuchet MS', 'Segoe UI', sans-serif";
  g.fillStyle = "#a8283a";
  g.textAlign = "center";
  g.fillText("heritage cafe", 320, 200);
  g.font = "600 32px Arial";
  g.fillStyle = "#1a1a1a";
  g.fillText("ROOF TOP", 320, 258);
  g.fillRect(150, 246, 36, 4);
  g.fillRect(454, 246, 36, 4);
  return toTex(c, true, false);
}

function signSweet() {
  const c = canvas(720, 280);
  const g = c.getContext("2d");
  g.fillStyle = "#eee8dc";
  g.fillRect(0, 0, 720, 280);
  g.strokeStyle = "#9a9084";
  g.lineWidth = 10;
  g.strokeRect(8, 8, 704, 264);
  g.fillStyle = "#4f7fa8";
  g.fillRect(28, 30, 70, 84);
  g.fillStyle = "#e8d2b8";
  g.beginPath();
  g.arc(63, 66, 20, 0, 6.3);
  g.fill();
  g.fillStyle = "#3a8a8a";
  g.fillRect(630, 30, 56, 56);
  g.fillStyle = "#b51e2c";
  g.font = "bold 74px 'Nirmala UI', Mangal, sans-serif";
  g.textAlign = "center";
  g.fillText("शरण मिष्ठान भण्डार", 372, 150);
  const dirt = g.createLinearGradient(0, 0, 0, 280);
  dirt.addColorStop(0, "rgba(80,70,56,0.06)");
  dirt.addColorStop(1, "rgba(80,70,56,0.24)");
  g.fillStyle = dirt;
  g.fillRect(0, 0, 720, 280);
  return toTex(c, true, false);
}

function signFood() {
  const c = canvas(900, 200);
  const g = c.getContext("2d");
  g.fillStyle = "#f2d22a";
  g.fillRect(0, 0, 900, 200);
  g.fillStyle = "#c8202c";
  g.font = "bold 64px 'Nirmala UI', Mangal, sans-serif";
  g.textAlign = "center";
  g.fillText("शरण मिष्ठान भण्डार", 450, 78);
  const dishes = ["#e7d7b8", "#c4511a", "#f3e2b4", "#a83228", "#efe0a4", "#d8a04a", "#8c3a20", "#f0e8d0"];
  for (let i = 0; i < 8; i++) {
    g.fillStyle = dishes[i];
    g.fillRect(70 + i * 96, 104, 84, 56);
    g.fillStyle = "rgba(60,30,16,0.3)";
    g.beginPath();
    g.arc(112 + i * 96, 132, 16, 0, 6.3);
    g.fill();
  }
  g.fillStyle = "#3c8a4a";
  g.fillRect(10, 30, 48, 140);
  g.fillRect(842, 30, 48, 140);
  g.fillStyle = "#c8202c";
  g.fillRect(0, 176, 900, 24);
  return toTex(c, true, false);
}

function signCoop() {
  const c = canvas(980, 280);
  const g = c.getContext("2d");
  g.fillStyle = "#eef0ea";
  g.fillRect(0, 0, 980, 280);
  g.strokeStyle = "#1c7a42";
  g.lineWidth = 8;
  g.strokeRect(6, 6, 968, 268);
  // The Nepali heading and address were not transcribed: faint rules only.
  g.fillStyle = "#c4322e";
  g.fillRect(150, 34, 800, 10);
  g.fillRect(150, 54, 760, 10);
  g.fillStyle = "#1c7a42";
  g.beginPath();
  g.arc(84, 130, 46, 0, 6.3);
  g.fill();
  g.fillStyle = "#eef0ea";
  g.beginPath();
  g.arc(84, 130, 30, 0, 6.3);
  g.fill();
  g.fillStyle = "#1c7a42";
  g.font = "700 40px Arial";
  g.textAlign = "center";
  g.fillText("JAN MANGALAM SAVING & CREDIT", 560, 124);
  g.fillText("CO-OPERATIVE SOCIETY LTD.", 560, 166);
  g.fillStyle = "rgba(40,60,46,0.35)";
  g.fillRect(150, 204, 760, 6);
  g.fillRect(200, 228, 660, 6);
  g.fillStyle = "#c4322e";
  g.fillRect(14, 252, 952, 10);
  return toTex(c, true, false);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 0.78 + 0.22 * smoothstep(0.0, 0.45, p.y);
  if (p.z < 0.45) {
    ao *= 1.0 - 0.32 * smoothstep(0.55, 0.0, 2.45 - p.y);
    ao *= 1.0 - 0.22 * smoothstep(0.5, 0.0, 5.1 - p.y);
  }
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
  mat.customProgramCacheKey = function () { return "house007b-" + key; };
  return mat;
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const soot = y < 0.8 ? 0.82 : 1;
    const k = soot * (0.94 + 0.06 * hash(p.getX(i) * 1.7, y * 1.3, p.getZ(i) * 1.7));
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse007() {
  const root = new THREE.Group();
  root.name = "house-007";

  const plasterMap = plasterMaps();
  const mats = {
    plaster: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: plasterMap, roughness: 0.92, metalness: 0, vertexColors: true,
    }),
    wood: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, vertexColors: true }),
    green: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.02, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110f, roughness: 0.94, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x9aa89a, roughness: 0.18, metalness: 0.04, transparent: true, opacity: 0.28, vertexColors: true,
    }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.95, metalness: 0, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.72, metalness: 0, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.35, vertexColors: true }),
    grime: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: grimeMap(), roughness: 1, metalness: 0, transparent: true, depthWrite: false,
      polygonOffset: true, polygonOffsetFactor: -2, vertexColors: true,
    }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    add(name, place(boxGeo(w, h, d), x, y, z), tint);
  }
  function wall(name, x0, x1, y0, y1, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, T / 2, tint);
    }
  }
  function grime(x, yTop, w, h) {
    add("grime", place(new THREE.PlaneGeometry(w, h), x, yTop - h / 2, -0.003, 0, Math.PI, 0));
  }
  function board(tex, w, h, x, y, z) {
    const geo = place(new THREE.PlaneGeometry(w, h), x, y, z, 0, Math.PI, 0);
    paintVary(geo);
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.84, metalness: 0, vertexColors: true });
    houseShader(mat, "board-" + x.toFixed(2) + "-" + y.toFixed(2));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
  }

  const pinkHoles = [
    { x: 3.22, y: 1.18, w: 0.78, h: 1.95 },
    { x: 4.08, y: 1.18, w: 0.72, h: 1.95 },
  ];
  const cafeHoles = [
    { x: 0.58, y: 1.15, w: 0.86, h: 1.85 },
    { x: 1.58, y: 1.18, w: 0.78, h: 2.1 },
  ];
  const woodLower = [
    { x: 3.15, y: 3.85, w: 0.62, h: 1.15 },
    { x: 3.95, y: 3.85, w: 0.62, h: 1.15 },
  ];
  const woodUpper = [
    { x: 3.15, y: 5.85, w: 0.58, h: 1.05 },
    { x: 3.95, y: 5.85, w: 0.58, h: 1.05 },
  ];
  const grillWin = [
    { x: 0.58, y: 3.72, w: 0.78, h: 1.15 },
    { x: 1.52, y: 3.72, w: 0.78, h: 1.15 },
  ];
  const midWin = [
    { x: 0.58, y: 5.85, w: 0.72, h: 1.05 },
    { x: 1.52, y: 5.85, w: 0.72, h: 1.05 },
  ];
  const topWin = [
    { x: 0.58, y: 7.85, w: 0.68, h: 0.95 },
    { x: 1.52, y: 7.85, w: 0.68, h: 0.95 },
  ];

  wall("plaster", SPLIT, W, 0, 2.55, pinkHoles, PINK);
  wall("plaster", 0, SPLIT, 0, 2.55, cafeHoles, PLASTER);
  wall("plaster", SPLIT, W, 2.55, EAST_TOP, woodLower.concat(woodUpper), OLD);
  wall("plaster", 0, SPLIT, 2.55, ROOF, grillWin.concat(midWin, topWin), PLASTER);

  addBox("plaster", T, EAST_TOP, D, W - T / 2, EAST_TOP / 2, D / 2, OLD);
  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2, PLASTER);
  addBox("plaster", SPLIT, ROOF, T, SPLIT / 2, ROOF / 2, D - T / 2, [0.7, 0.68, 0.64]);
  addBox("plaster", W - SPLIT, EAST_TOP, T, (SPLIT + W) / 2, EAST_TOP / 2, D - T / 2, [0.58, 0.55, 0.52]);
  addBox("plaster", SPLIT, 0.16, D, SPLIT / 2, ROOF + 0.08, D / 2, [0.78, 0.76, 0.72]);
  addBox("metal", W - SPLIT, 0.06, D, (SPLIT + W) / 2, EAST_TOP + 0.03, D / 2, METAL);
  addBox("plaster", 0.16, ROOF - EAST_TOP, D * 0.5, SPLIT, (ROOF + EAST_TOP) / 2, D * 0.25, PLASTER);

  function cusp(cx, halfW, spring) {
    const n = 16;
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const a = Math.PI * t;
      const x = cx + (t - 0.5) * halfW * 2;
      const scallop = Math.abs(Math.sin(t * Math.PI * 5)) * 0.06;
      const y = spring + Math.sin(a) * 0.26 - scallop;
      addBox("plaster", halfW * 2 / n + 0.01, 2.55 - y, 0.1, x, (y + 2.55) / 2, -0.05, PINK2);
    }
    addBox("plaster", 0.12, 1.95, 0.14, cx - halfW - 0.02, spring - 0.98, -0.07, PINK2);
    addBox("plaster", 0.12, 1.95, 0.14, cx + halfW + 0.02, spring - 0.98, -0.07, PINK2);
    addBox("plaster", halfW * 2 + 0.2, 0.08, 0.16, cx, 0.04, -0.08, [0.36, 0.3, 0.28]);
    addBox("dark", halfW * 2 - 0.04, 1.9, 0.35, cx, spring - 0.75, 0.28);
  }
  cusp(3.22, 0.36, 1.95);
  cusp(4.08, 0.32, 1.95);
  addBox("plaster", 0.12, 2.3, 0.16, 3.65, 1.15, -0.08, PINK);
  addBox("plaster", W - SPLIT, 0.07, 0.14, (SPLIT + W) / 2, 2.6, -0.06, [0.8, 0.79, 0.76]);
  addBox("plaster", W - SPLIT, 0.06, 0.24, (SPLIT + W) / 2, 2.67, -0.11, [0.84, 0.83, 0.8]);
  addBox("plaster", W - SPLIT, 0.1, 0.1, (SPLIT + W) / 2, 2.52, -0.04, [0.7, 0.69, 0.66]);

  function balusters(x, y, w, h, z) {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const px = x - w / 2 + (i + 0.5) * (w / n);
      addBox("wood", 0.022, h, 0.022, px, y, z, WOOD);
      addBox("wood", 0.04, 0.05, 0.035, px, y + h * 0.2, z, WOOD2);
      addBox("wood", 0.04, 0.05, 0.035, px, y - h * 0.2, z, WOOD2);
    }
    addBox("wood", w, 0.04, 0.04, x, y + h / 2, z, WOOD);
    addBox("wood", w, 0.04, 0.04, x, y, z, WOOD);
  }
  function woodWin(x, y, w, h) {
    addBox("wood", 0.07, h + 0.14, 0.1, x - w / 2, y, -0.06, WOOD);
    addBox("wood", 0.07, h + 0.14, 0.1, x + w / 2, y, -0.06, WOOD);
    addBox("wood", w + 0.12, 0.08, 0.12, x, y + h / 2, -0.07, WOOD);
    addBox("wood", w + 0.16, 0.07, 0.1, x, y - h / 2, -0.06, WOOD2);
    addBox("wood", w - 0.04, 0.05, 0.06, x, y + 0.02, -0.04, WOOD);
    addBox("dark", w - 0.08, h - 0.08, 0.16, x, y, 0.1);
    addBox("wood", w - 0.1, h * 0.42, 0.02, x + 0.03, y - h * 0.2, 0.07, WOOD2);
    balusters(x, y - h * 0.22, w - 0.12, h * 0.4, -0.03);
    grime(x, y - h / 2 - 0.04, w + 0.1, 0.7);
  }
  woodWin(3.15, 3.85, 0.62, 1.15);
  woodWin(3.95, 3.85, 0.62, 1.15);
  woodWin(3.15, 5.85, 0.58, 1.05);
  woodWin(3.95, 5.85, 0.58, 1.05);

  function grille(x, y, w, h, z) {
    const bars = 9;
    for (let i = 0; i < bars; i++) {
      const px = x - w / 2 + (i + 0.5) * (w / bars);
      addBox("wire", 0.012, h, 0.016, px, y, z);
    }
    for (let j = 0; j < 8; j++) {
      const py = y - h / 2 + (j + 0.5) * (h / 8);
      addBox("wire", w, 0.012, 0.016, x, py, z);
    }
  }
  function greenWin(x, y, w, h, open, bars) {
    addBox("green", 0.055, h + 0.1, 0.09, x - w / 2, y, -0.05, GREEN);
    addBox("green", 0.055, h + 0.1, 0.09, x + w / 2, y, -0.05, GREEN);
    addBox("green", w + 0.1, 0.055, 0.09, x, y + h / 2, -0.05, GREEN);
    addBox("green", w + 0.14, 0.06, 0.1, x, y - h / 2, -0.06, GREEN);
    addBox("green", 0.035, h - 0.08, 0.05, x, y, -0.03, GREEN);
    if (open) addBox("dark", w - 0.12, h - 0.12, 0.18, x, y, 0.1);
    else addBox("glass", w - 0.12, h - 0.12, 0.02, x, y, 0.02);
    if (bars) grille(x, y, w - 0.14, h - 0.14, -0.04);
    grime(x, y - h / 2 - 0.05, w + 0.06, 0.6);
  }
  greenWin(0.58, 3.72, 0.78, 1.15, false, true);
  greenWin(1.52, 3.72, 0.78, 1.15, false, true);
  greenWin(0.58, 5.85, 0.72, 1.05, false, false);
  greenWin(1.52, 5.85, 0.72, 1.05, true, false);
  greenWin(0.58, 7.85, 0.68, 0.95, true, false);
  greenWin(1.52, 7.85, 0.68, 0.95, false, false);

  addBox("green", 0.07, 2.05, 0.1, 0.12, 1.12, -0.05, GREEN);
  addBox("green", 0.07, 2.05, 0.1, 1.04, 1.12, -0.05, GREEN);
  addBox("green", 0.92, 0.07, 0.1, 0.58, 2.12, -0.05, GREEN);
  addBox("green", 0.07, 2.2, 0.1, 1.16, 1.18, -0.05, GREEN);
  addBox("green", 0.07, 2.2, 0.1, 2.0, 1.18, -0.05, GREEN);
  addBox("green", 0.9, 0.07, 0.1, 1.58, 2.26, -0.05, GREEN);
  addBox("glass", 0.74, 1.6, 0.02, 0.58, 1.15, 0.02);
  addBox("dark", 0.62, 1.95, 0.4, 1.58, 1.12, 0.28);
  addBox("goods", 0.06, 1.55, 0.03, 1.28, 1.15, 0.12, [0.86, 0.72, 0.16]);

  const bottleTints = [[0.72, 0.84, 0.88], [0.18, 0.4, 0.7], [0.8, 0.18, 0.16], [0.92, 0.8, 0.28], [0.28, 0.58, 0.32]];
  for (let i = 0; i < 8; i++) {
    addBox("goods", 0.07, 0.2, 0.07, 0.32 + (i % 4) * 0.12, 0.72 + Math.floor(i / 4) * 0.24, 0.18, bottleTints[i % bottleTints.length]);
  }
  for (let i = 0; i < 4; i++) {
    addBox("goods", 0.1, 0.22, 0.1, 0.36 + i * 0.1, 0.48, 0.16, [0.75, 0.86, 0.9]);
  }
  addBox("goods", 0.22, 0.28, 0.12, 0.82, 0.7, 0.16, [0.9, 0.9, 0.88]);
  addBox("goods", 0.16, 0.2, 0.06, 0.48, 1.35, 0.12, [0.75, 0.16, 0.18]);

  board(signFood(), 1.05, 0.34, 4.02, 2.78, -0.03);
  board(signSweet(), 1.15, 0.46, 2.95, 2.82, -0.03);
  board(signCafe(), 1.2, 0.58, 1.35, 2.68, -0.03);
  board(signCoop(), 1.7, 0.42, 1.12, 4.85, -0.03);
  addBox("goods", 0.22, 0.16, 0.02, 0.28, 2.55, -0.04, [0.45, 0.62, 0.55]);

  addBox("plaster", SPLIT - 0.08, 0.07, 0.12, SPLIT / 2, 2.48, -0.04, PLASTER);
  addBox("plaster", SPLIT - 0.08, 0.06, 0.1, SPLIT / 2, 4.48, -0.03, [0.7, 0.68, 0.64]);
  addBox("plaster", SPLIT - 0.08, 0.06, 0.1, SPLIT / 2, 6.55, -0.03, [0.7, 0.68, 0.64]);
  addBox("plaster", SPLIT - 0.08, 0.08, 0.14, SPLIT / 2, 8.55, -0.05, PLASTER);
  addBox("wood", W - SPLIT - 0.1, 0.08, 0.12, (SPLIT + W) / 2, 3.15, -0.05, WOOD2);
  addBox("wood", W - SPLIT - 0.1, 0.07, 0.1, (SPLIT + W) / 2, 5.15, -0.04, WOOD);

  function corbel(x) {
    addBox("wood", 0.1, 0.34, 0.1, x, 6.42, -0.08, WOOD);
    addBox("wood", 0.12, 0.08, 0.62, x, 6.62, -0.28, WOOD2);
    addBox("wood", 0.08, 0.22, 0.08, x, 6.46, -0.5, WOOD);
  }
  for (const x of [2.72, 3.15, 3.58, 4.02, 4.42]) corbel(x);
  addBox("metal", 2.2, 0.05, 0.78, 3.5, 6.78, -0.32, METAL);
  for (let i = 0; i < 8; i++) {
    addBox("metal", 2.16, 0.03, 0.04, 3.5, 6.82, -0.08 - i * 0.08, i % 2 ? [0.34, 0.36, 0.38] : [0.55, 0.57, 0.58]);
  }

  function span(a, b, droop, rad) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, rad, 4, false));
  }
  span([0.05, 3.15, -0.22], [4.5, 2.85, -0.3], 0.28, 0.012);
  span([0.1, 3.7, -0.18], [4.4, 3.35, -0.26], 0.34, 0.01);
  span([0.15, 4.35, -0.16], [4.45, 3.9, -0.24], 0.22, 0.011);
  span([0.2, 5.15, -0.14], [2.2, 4.7, -0.2], 0.16, 0.009);
  span([2.4, 4.9, -0.14], [4.5, 4.4, -0.22], 0.18, 0.008);
  span([0.3, 6.4, -0.12], [2.15, 6.05, -0.18], 0.12, 0.008);
  // The photo's tangle: a dense bundle across the first floor and coils at the party line.
  const wr = rng(4207);
  for (let i = 0; i < 16; i++) {
    const ya = 3.0 + wr() * 2.0;
    span(
      [0.02 + wr() * 0.3, ya, -0.14 - wr() * 0.3],
      [W - 0.32 + wr() * 0.3, ya - 0.5 + wr() * 0.7, -0.14 - wr() * 0.3],
      0.06 + wr() * 0.26, 0.004 + wr() * 0.003,
    );
  }
  for (let i = 0; i < 7; i++) {
    span([SPLIT, 3.75 + wr() * 0.3, -0.24], [wr() * W, 2.9 + wr() * 2.6, -0.16 - wr() * 0.2], 0.05 + wr() * 0.2, 0.006);
  }
  for (const [x, y] of [[2.28, 4.02], [2.4, 3.74], [2.18, 3.62]]) {
    add("wire", place(new THREE.TorusGeometry(0.06, 0.009, 4, 10), x, y, -0.26, 0, 0.3, 0));
  }
  addBox("plaster", 0.16, 0.2, 0.1, 2.05, 4.18, -0.06, [0.88, 0.88, 0.86]);
  addBox("metal", 0.05, 0.05, 0.08, 2.05, 4.31, -0.06, METAL);

  grime(SPLIT / 2, 2.44, SPLIT - 0.1, 0.5);
  grime((SPLIT + W) / 2, 7.5, W - SPLIT, 0.9);
  grime(SPLIT / 2, ROOF, SPLIT, 1.1);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass" && name !== "wire" && name !== "grime";
    if (name === "grime") mesh.renderOrder = 1;
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
  root.userData.id = "007";
  return root;
}
