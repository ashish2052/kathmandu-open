// House 032. Kel Tol lane, OSM way 671190295, edge 1, 7.44 m.
// Spec: research/houses200/032/design.md
// Origin: front-left of the MODEL, before place.js yaws it 180.
// After that yaw, x = 0 is photo-right (grey window, toward the copper neighbour).
// x = 7.44 is photo-left (carved triple window). +Y up. +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// Still: pano _6yNjsLscHaFE3ukr9I78Q, yaw 120, pitch up 8, hfov 60.
// This footprint only. The concrete balcony block and the copper stall are neighbours.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.44;
const D = 5.38;
const T = 0.22;
const ROOF = 9.35;

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

function lin(hex) {
  const n = typeof hex === "number" ? hex : parseInt(String(hex).replace("#", ""), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map((c) => Math.pow(c, 2.2));
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

function plasterSet() {
  const w = 512;
  const h = 512;
  const col = canvas(w, h);
  const c = col.getContext("2d");
  const r = rng(32032);
  c.fillStyle = "#c9bfb4";
  c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 10) {
    c.fillStyle = "rgba(120,108,96,0.07)";
    c.fillRect(0, y, w, 1);
  }
  for (let i = 0; i < 1800; i++) {
    c.fillStyle = r() > 0.5 ? "rgba(70,60,52,0.18)" : "rgba(255,255,255,0.08)";
    c.fillRect(r() * w, r() * h, 2 + r() * 4, 1 + r() * 2);
  }
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(60,50,42,${0.08 + r() * 0.2})`;
    c.fillRect(r() * w, r() * h, 8 + r() * 30, 3 + r() * 8);
  }
  const map = toTex(col, true, true);
  map.repeat.set(0.42, 0.42);
  return map;
}

function metalSet() {
  const w = 256;
  const h = 64;
  const col = canvas(w, h);
  const c = col.getContext("2d");
  c.fillStyle = "#8a8680";
  c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 8) {
    c.fillStyle = x % 16 === 0 ? "#5e5a56" : "#b7b2aa";
    c.fillRect(x, 0, 3, h);
  }
  const map = toTex(col, true, true);
  map.repeat.set(2.2, 0.8);
  return map;
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
    let k = 0.94 + 0.06 * hash(x * 1.7, y * 1.3, z * 1.7);
    if (y < 0.55) k *= 0.72 + 0.28 * (y / 0.55);
    if (y > 4.15 && y < 4.7) k *= 0.86;
    if (z > 1.2) k *= Math.max(0.55, 1 - (z - 1.2) * 0.12);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

function sariTex(main, border) {
  return canvasTex((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = main;
    g.fillRect(w * 0.18, 4, w * 0.64, h - 8);
    g.fillStyle = border;
    g.fillRect(w * 0.18, 4, 8, h - 8);
    g.fillRect(w * 0.18, h - 28, w * 0.64, 16);
    g.fillRect(w * 0.22, h * 0.42, w * 0.56, 8);
    g.globalAlpha = 0.28;
    for (let i = 0; i < 4; i++) g.fillRect(w * (0.3 + i * 0.12), h * 0.15, 5, h * 0.22);
    g.globalAlpha = 1;
  }, 128, 280);
}

function curtainTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f4f0e6";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(210,200,184,0.7)";
    for (let x = 8; x < w; x += 18) g.fillRect(x, 0, 6, h);
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(0, 0, w, h * 0.2);
  }, 128, 180);
}

function flagTex() {
  return canvasTex((g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = "#c8102e";
    g.beginPath();
    g.moveTo(4, 8);
    g.lineTo(w - 8, h * 0.32);
    g.lineTo(4, h * 0.55);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(4, h * 0.48);
    g.lineTo(w - 18, h * 0.72);
    g.lineTo(4, h - 6);
    g.closePath();
    g.fill();
    g.fillStyle = "#1d4e9a";
    g.beginPath();
    g.moveTo(4, h * 0.5);
    g.lineTo(w * 0.42, h * 0.66);
    g.lineTo(4, h * 0.82);
    g.closePath();
    g.fill();
  }, 160, 120);
}

export function createHouse032() {
  const root = new THREE.Group();
  root.name = "house-032";
  const plasterMap = plasterSet();
  const metalMap = metalSet();
  const mats = {
    plaster: new THREE.MeshStandardMaterial({ map: plasterMap, color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true }),
    wood: new THREE.MeshStandardMaterial({ color: 0x5a4638, roughness: 0.78, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.9, metalness: 0, vertexColors: true }),
    room: new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.94, metalness: 0, vertexColors: true }),
    frame: new THREE.MeshStandardMaterial({ color: 0x8d8882, roughness: 0.62, metalness: 0.04, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ map: metalMap, color: 0xffffff, roughness: 0.55, metalness: 0.35, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.62, metalness: 0.08, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.82, metalness: 0, vertexColors: true }),
    skin: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0xb7c0c4, roughness: 0.42, metalness: 0.02, vertexColors: true }),
    curtain: new THREE.MeshStandardMaterial({ map: curtainTex(), color: 0xffffff, roughness: 0.85, metalness: 0, vertexColors: true }),
  };

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx, ry, rz);
    if (name === "plaster" || name === "metal") worldUV(g);
    add(name, g, tint);
  }
  function wall(x0, x1, y0, y1, zFace, holes, depth, mat) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) {
      addBox(mat || "plaster", part.w, part.h, depth || T, part.x, part.y, zFace + (depth || T) / 2);
    }
  }
  function cutout(geo, mat) {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
  }

  const shop = { x: W / 2, y: 1.42, w: 6.55, h: 2.62 };
  const carved = { x: 5.55, y: 4.95, w: 2.45, h: 1.42 };
  const grey = { x: 2.05, y: 5.02, w: 1.08, h: 1.35 };
  const tops = [1.35, 2.85, 4.55, 6.15].map((x) => ({ x, y: 7.62, w: 0.92, h: 0.78 }));
  wall(0, W, 0, ROOF, 0, [shop, carved, grey, ...tops]);
  wall(0, W, 0, ROOF, D - T, []);
  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2);

  // Shop mouth. The hats and saris fill it; the back of the bay is just darker.
  addBox("wood", shop.w + 0.16, 0.1, 0.16, shop.x, shop.y + shop.h / 2 + 0.02, -0.06, lin("#4a382c"));
  addBox("wood", 0.1, shop.h, 0.14, shop.x - shop.w / 2, shop.y, -0.05, lin("#4a382c"));
  addBox("wood", 0.1, shop.h, 0.14, shop.x + shop.w / 2, shop.y, -0.05, lin("#4a382c"));
  addBox("room", shop.w - 0.2, shop.h - 0.15, 0.08, shop.x, shop.y, 1.85, lin("#5c5148"));
  addBox("room", 0.08, shop.h, 1.6, shop.x - shop.w / 2 + 0.15, shop.y, 0.95, lin("#4a4038"));
  addBox("room", 0.08, shop.h, 1.6, shop.x + shop.w / 2 - 0.15, shop.y, 0.95, lin("#4a4038"));
  addBox("dark", shop.w - 0.3, 0.06, 1.7, shop.x, 2.72, 0.85, lin("#3a332c"));

  // Hats fill the mouth. Four crowded rows, larger than a token, photo-left stacked lower.
  const hatCols = ["#1a1c1e", "#f2efe6", "#c8102e", "#1d4e89", "#e6d2a8", "#2a2a2a", "#f4f4f2", "#6a1a28", "#d8d4cc", "#111418", "#c45a18", "#2f6b3a"];
  function hat(x, y, z, hex, brim) {
    add("cloth", place(new THREE.CylinderGeometry(brim, brim * 0.92, 0.04, 8), x, y, z), lin(hex));
    add("cloth", place(new THREE.CylinderGeometry(brim * 0.48, brim * 0.58, 0.11, 8), x, y + 0.07, z), lin(hex));
  }
  for (let row = 0; row < 4; row++) {
    const n = 12;
    for (let i = 0; i < n; i++) {
      const x = 0.7 + i * 0.5 + (row % 2) * 0.12;
      if (x > W - 0.55) continue;
      hat(x, 2.62 - row * 0.36, -0.16 - (row % 2) * 0.05, hatCols[(i + row * 3) % hatCols.length], 0.145 - row * 0.006);
    }
  }

  // Sari rail and the cloth that hangs in front of the plaster pier.
  add("wood", place(new THREE.CylinderGeometry(0.025, 0.025, W - 0.5, 6), W / 2, 3.72, -0.42, 0, 0, Math.PI / 2), lin("#3a2e26"));
  const saris = [
    ["#1f6b3a", "#e6c84a"], ["#1d4e89", "#f2efe6"], ["#c4324a", "#f2c14e"], ["#e07a2f", "#6b1a22"],
    ["#f2efe6", "#1a1a1a"], ["#8b1e2d", "#e6c84a"], ["#111111", "#c4324a"], ["#d4527a", "#f2efe6"],
    ["#c9a24a", "#6b1a22"], ["#2a9b8f", "#f2efe6"], ["#3d2a6b", "#e6c84a"], ["#b8333a", "#1d4e89"],
    ["#e8d15a", "#1f6b3a"], ["#f4f1ea", "#1a1a1a"],
  ];
  saris.forEach((pair, i) => {
    const x = 0.55 + i * 0.47;
    const tex = sariTex(pair[0], pair[1]);
    const geo = place(new THREE.PlaneGeometry(0.46, 1.35), x, 2.95, -0.48 - (i % 2) * 0.06, 0, Math.PI, (i % 2 ? 0.03 : -0.02));
    cutout(geo, new THREE.MeshStandardMaterial({
      map: tex, roughness: 0.8, metalness: 0, transparent: true, alphaTest: 0.45, side: THREE.DoubleSide,
    }));
    if (i % 3 === 0) {
      add("skin", place(new THREE.SphereGeometry(0.075, 8, 6), x, 3.78, -0.48), lin("#e4cbb8"));
    }
  });

  // Crimson pennant on the photo-left of the hat row. The still shows one there.
  const flag = place(new THREE.PlaneGeometry(0.42, 0.32), 6.55, 2.35, -0.55, 0, Math.PI, 0.15);
  cutout(flag, new THREE.MeshStandardMaterial({
    map: flagTex(), roughness: 0.7, transparent: true, alphaTest: 0.4, side: THREE.DoubleSide,
  }));
  add("wood", place(new THREE.CylinderGeometry(0.012, 0.012, 0.7, 5), 6.35, 2.15, -0.5), lin("#5a4638"));

  // Carved triple window, photo-left. Projecting sill, dentils, three curtains, brackets.
  const cx = carved.x;
  addBox("wood", carved.w + 0.28, 0.16, 0.28, cx, carved.y - carved.h / 2 - 0.02, -0.12, lin("#3f3228"));
  addBox("wood", carved.w + 0.22, 0.1, 0.22, cx, carved.y + carved.h / 2 + 0.06, -0.08, lin("#3f3228"));
  addBox("wood", 0.1, carved.h, 0.16, cx - carved.w / 2, carved.y, -0.06, lin("#3f3228"));
  addBox("wood", 0.1, carved.h, 0.16, cx + carved.w / 2, carved.y, -0.06, lin("#3f3228"));
  for (let i = 0; i < 3; i++) {
    const ax = cx - 0.72 + i * 0.72;
    addBox("wood", 0.08, carved.h - 0.12, 0.14, ax, carved.y, -0.07, lin("#4a382c"));
    const arch = new THREE.TorusGeometry(0.28, 0.035, 6, 10, Math.PI);
    add("wood", place(arch, ax, carved.y + carved.h / 2 - 0.28, -0.08, 0, 0, 0), lin("#3f3228"));
    const curtain = place(new THREE.PlaneGeometry(0.46, 1.05), ax, carved.y - 0.02, -0.02, 0, Math.PI, 0);
    cutout(curtain, new THREE.MeshStandardMaterial({
      map: curtainTex(), color: 0xf4f0e6, roughness: 0.85, side: THREE.DoubleSide,
    }));
  }
  for (let i = 0; i < 16; i++) {
    addBox("wood", 0.06, 0.08, 0.1, cx - carved.w / 2 + 0.12 + i * 0.15, carved.y - carved.h / 2 - 0.12, -0.16, lin("#2e241e"));
  }
  for (const bx of [cx - 0.9, cx, cx + 0.9]) {
    addBox("wood", 0.08, 0.42, 0.08, bx, carved.y - carved.h / 2 - 0.28, -0.02, lin("#3f3228"), 0.7, 0, 0);
  }

  // Grey four-pane window, photo-right. Flush with the plaster.
  const gx = grey.x;
  addBox("frame", grey.w + 0.1, 0.05, 0.06, gx, grey.y + grey.h / 2, -0.02, lin("#9a9590"));
  addBox("frame", grey.w + 0.1, 0.05, 0.06, gx, grey.y - grey.h / 2, -0.02, lin("#9a9590"));
  addBox("frame", 0.05, grey.h, 0.06, gx - grey.w / 2, grey.y, -0.02, lin("#9a9590"));
  addBox("frame", 0.05, grey.h, 0.06, gx + grey.w / 2, grey.y, -0.02, lin("#9a9590"));
  addBox("frame", 0.035, grey.h - 0.08, 0.05, gx, grey.y, -0.025, lin("#8d8882"));
  addBox("frame", grey.w - 0.08, 0.035, 0.05, gx, grey.y, -0.025, lin("#8d8882"));
  addBox("glass", grey.w - 0.08, grey.h - 0.08, 0.02, gx, grey.y, 0.02, lin("#c5ced4"));

  // Top floor: four plain windows under the sheet roof. Not the neighbour's balconies.
  tops.forEach((win) => {
    addBox("frame", win.w + 0.08, 0.045, 0.07, win.x, win.y + win.h / 2, -0.03, lin("#d9d3c8"));
    addBox("frame", win.w + 0.08, 0.045, 0.07, win.x, win.y - win.h / 2, -0.03, lin("#d9d3c8"));
    addBox("frame", 0.045, win.h, 0.07, win.x - win.w / 2, win.y, -0.03, lin("#d9d3c8"));
    addBox("frame", 0.045, win.h, 0.07, win.x + win.w / 2, win.y, -0.03, lin("#d9d3c8"));
    addBox("glass", win.w - 0.06, win.h - 0.08, 0.02, win.x, win.y, 0.03, lin("#d5ddd8"));
    addBox("curtain", win.w - 0.16, win.h - 0.2, 0.02, win.x, win.y - 0.04, 0.08, lin("#f3efe4"));
  });

  // Corrugated eave and a low cap set back. The concrete block to photo-right is not this way.
  addBox("metal", W + 0.3, 0.05, 0.85, W / 2, 8.95, -0.22);
  addBox("metal", W + 0.15, 0.04, 0.4, W / 2, 9.08, 0.15);
  addBox("plaster", W, 0.16, D, W / 2, 9.2, D / 2);
  addBox("metal", 2.2, 0.55, 1.4, 4.2, 9.55, 3.4, lin("#6e6a64"));

  // Cable bundle across the pier, in front of the window hoods, tied at both ends.
  addBox("dark", 0.12, 0.16, 0.1, 0.18, 4.72, -0.2, lin("#1c1917"));
  addBox("dark", 0.12, 0.16, 0.1, W - 0.18, 4.55, -0.2, lin("#1c1917"));
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
  for (let i = 0; i < 16; i++) {
    const y0 = 4.85 - (i % 5) * 0.045;
    const y1 = 4.62 - (i % 4) * 0.04;
    const z = -0.32 - (i % 3) * 0.03;
    span([0.16, y0, z], [W - 0.16, y1, z - 0.04], 0.22 + (i % 6) * 0.04, i < 4 ? 0.016 : 0.008);
  }

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
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
  root.userData.id = "032";
  return root;
}
