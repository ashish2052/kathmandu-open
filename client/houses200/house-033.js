// House 033. Kilagal, OSM way 226512180, edge 5, 7.90 m.
// Spec: research/houses200/033/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// After place.js yaw 180, x = 0 is the south end (shutter bays) and x = 7.90 is the north end
// (Bhawadurga Ornament). The still is pano DXL_RwdU_9p-yLqV8mq7gA, yaw 45, pitch 0, hfov 60.
// Copy that frame: stained beige plaster, teal awning, pale green doors, red poster,
// two upper windows (one with an open leaf), wires. No shop lighting.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.9;
const D = 5.6;
const T = 0.22;
const ROOF = 8.05;

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
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
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

function plasterTex() {
  const w = 512;
  const h = 512;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(331);
  g.fillStyle = "#c4a882";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    const x = r() * w;
    const y = r() * h;
    const k = r();
    g.fillStyle = k > 0.55 ? "rgba(90,70,48,0.18)" : "rgba(232,214,184,0.16)";
    g.fillRect(x, y, 1 + r() * 3, 1 + r() * 2);
  }
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = "rgba(92,68,46," + (0.08 + r() * 0.12) + ")";
    g.lineWidth = 1;
    g.beginPath();
    const x = r() * w;
    g.moveTo(x, r() * h);
    g.lineTo(x + (r() - 0.5) * 30, r() * h);
    g.stroke();
  }
  const grd = g.createLinearGradient(0, h * 0.72, 0, h);
  grd.addColorStop(0, "rgba(70,52,36,0)");
  grd.addColorStop(1, "rgba(62,46,32,0.45)");
  g.fillStyle = grd;
  g.fillRect(0, h * 0.72, w, h * 0.28);
  return toTex(c);
}

function slatTex() {
  const c = canvas(64, 256);
  const g = c.getContext("2d");
  for (let y = 0; y < 256; y += 4) {
    const k = 118 + ((y / 4) % 2) * 28;
    g.fillStyle = "rgb(" + (k - 10) + "," + (k - 28) + "," + (k - 46) + ")";
    g.fillRect(0, y, 64, 3);
    g.fillStyle = "rgba(40,28,18,0.35)";
    g.fillRect(0, y + 3, 64, 1);
  }
  return toTex(c);
}

function signTex() {
  const c = canvas(1280, 320);
  const g = c.getContext("2d");
  g.fillStyle = "#355860";
  g.fillRect(0, 0, 1280, 320);
  const r = rng(45);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)";
    g.fillRect(r() * 1280, r() * 320, 8, 3);
  }
  g.fillStyle = "#f4f0e6";
  g.textAlign = "center";
  g.font = "italic 86px Georgia";
  g.fillText("Bhawadurga Ornament", 640, 148);
  g.font = "italic 34px Georgia";
  g.fillStyle = "#e7e0d2";
  g.fillText("Kilagal, Kathmandu Ph: 9851015459", 640, 230);
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function posterTex() {
  const c = canvas(512, 680);
  const g = c.getContext("2d");
  g.fillStyle = "#9a2428";
  g.fillRect(0, 0, 512, 680);
  g.strokeStyle = "#f3ead4";
  g.lineWidth = 14;
  g.strokeRect(28, 28, 456, 624);
  g.fillStyle = "#f6f0e2";
  g.textAlign = "center";
  g.font = "bold 64px Georgia";
  g.fillText("ORNAMENT", 256, 280);
  g.font = "36px Georgia";
  g.fillText("Kathmandu", 256, 360);
  g.font = "bold 40px Georgia";
  g.fillText("9851015459", 256, 450);
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function bendSheet(w, depth, drop) {
  const g = new THREE.PlaneGeometry(w, depth, 1, 10);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = p.getY(i) / depth + 0.5;
    p.setZ(i, -Math.sin(v * Math.PI * 0.55) * drop);
  }
  g.computeVertexNormals();
  return g;
}

export function createHouse033() {
  const root = new THREE.Group();
  root.name = "house-033";

  const plasterMap = plasterTex();
  plasterMap.repeat.set(1.4, 1.4);
  const slat = slatTex();
  const mats = {
    plaster: new THREE.MeshStandardMaterial({ map: plasterMap, color: 0xffffff, roughness: 0.94, metalness: 0 }),
    plasterDark: new THREE.MeshStandardMaterial({ map: plasterMap, color: 0xc8b49a, roughness: 0.96, metalness: 0 }),
    door: new THREE.MeshStandardMaterial({ color: 0xa9cfc0, roughness: 0.72, metalness: 0 }),
    doorDark: new THREE.MeshStandardMaterial({ color: 0x7eae9e, roughness: 0.78, metalness: 0 }),
    wood: new THREE.MeshStandardMaterial({ color: 0xb08968, roughness: 0.86, metalness: 0 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xd7c4a4, roughness: 0.84, metalness: 0 }),
    shutter: new THREE.MeshStandardMaterial({ map: slat, color: 0xffffff, roughness: 0.62, metalness: 0.18 }),
    awning: new THREE.MeshStandardMaterial({ color: 0x6a5344, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
    teal: new THREE.MeshStandardMaterial({ color: 0x355860, roughness: 0.84, metalness: 0, side: THREE.DoubleSide }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1c2422, roughness: 0.28, metalness: 0.04, transparent: true, opacity: 0.82 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.95, metalness: 0 }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.55, metalness: 0.05 }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc6a15a, roughness: 0.45, metalness: 0.35 }),
    poster: new THREE.MeshStandardMaterial({ map: posterTex(), roughness: 0.78, metalness: 0 }),
    sign: new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.68, metalness: 0 }),
  };

  const buckets = {};
  const loose = [];
  function add(name, g) {
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    add(name, place(new THREE.BoxGeometry(w, h, d), x, y, z, rx, ry, rz));
  }

  const holes = [
    { x: 6.95, y: 1.15, w: 1.18, h: 1.8 },
    { x: 5.4, y: 1.1, w: 1.04, h: 2.08 },
    { x: 7.15, y: 4.15, w: 0.78, h: 1.42 },
    { x: 5.4, y: 4.05, w: 0.76, h: 1.36 },
    { x: 6.7, y: 6.35, w: 0.7, h: 1.02 },
  ];
  for (const part of cells(0, W, 0, ROOF, holes)) {
    addBox("plaster", part.w, part.h, T, part.x, part.y, T / 2);
  }
  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("plaster", W, 0.16, D, W / 2, ROOF - 0.08, D / 2);
  addBox("plasterDark", W + 0.08, 0.1, 0.42, W / 2, 7.48, -0.12);

  addBox("plasterDark", W, 0.42, 0.04, W / 2, 0.21, -0.012);
  addBox("frame", 0.06, 4.6, 0.025, 6.2, 5.15, -0.02);
  addBox("frame", 0.06, 4.2, 0.025, 4.95, 5.0, -0.02);
  addBox("plasterDark", 0.55, 2.4, 0.03, 4.55, 4.6, -0.016);

  function openingFrame(x, y, w, h, d) {
    const z = -0.03;
    addBox("frame", w + 0.1, 0.06, d, x, y + h / 2 + 0.02, z);
    addBox("frame", w + 0.1, 0.05, d, x, y - h / 2 - 0.015, z);
    addBox("frame", 0.05, h, d, x - w / 2 - 0.02, y, z);
    addBox("frame", 0.05, h, d, x + w / 2 + 0.02, y, z);
  }
  openingFrame(6.95, 1.15, 1.18, 1.8, 0.07);
  openingFrame(5.4, 1.1, 1.04, 2.08, 0.07);
  openingFrame(7.15, 4.15, 0.78, 1.42, 0.06);
  openingFrame(5.4, 4.05, 0.76, 1.36, 0.06);
  openingFrame(6.7, 6.35, 0.7, 1.02, 0.06);

  addBox("dark", 1.12, 1.7, 0.08, 6.95, 1.15, 0.28);
  addBox("glass", 0.52, 1.55, 0.02, 7.22, 1.12, 0.02);
  addBox("glass", 0.5, 1.55, 0.02, 6.68, 1.12, 0.02);
  const poster = place(new THREE.PlaneGeometry(0.52, 1.35), 7.22, 1.1, -0.02, 0, Math.PI, 0);
  loose.push(new THREE.Mesh(poster, mats.poster));
  for (let i = 0; i < 5; i++) {
    const ring = place(new THREE.TorusGeometry(0.045, 0.008, 6, 10), 6.62 + (i % 3) * 0.08, 1.35 - Math.floor(i / 3) * 0.28, 0.1 + (i % 2) * 0.06, 0.4, 0.2 * i, 0.5);
    add("gold", ring);
  }
  addBox("gold", 0.012, 0.34, 0.012, 6.55, 1.45, 0.12);

  addBox("door", 0.46, 1.92, 0.04, 5.16, 1.05, -0.02);
  addBox("door", 0.46, 1.92, 0.04, 5.64, 1.05, -0.02);
  addBox("glass", 0.32, 0.72, 0.015, 5.16, 1.48, -0.045);
  addBox("glass", 0.32, 0.72, 0.015, 5.64, 1.48, -0.045);
  addBox("doorDark", 0.32, 0.7, 0.02, 5.16, 0.62, -0.04);
  addBox("doorDark", 0.32, 0.7, 0.02, 5.64, 0.62, -0.04);
  addBox("frame", 0.04, 2.08, 0.06, 5.4, 1.1, -0.03);

  addBox("dark", 0.7, 1.28, 0.08, 7.15, 4.15, 0.2);
  addBox("glass", 0.62, 1.2, 0.02, 7.15, 4.15, 0.02);
  addBox("dark", 0.66, 1.2, 0.08, 5.4, 4.05, 0.2);
  addBox("glass", 0.28, 0.48, 0.015, 5.28, 3.62, -0.01);
  addBox("glass", 0.28, 0.48, 0.015, 5.52, 3.62, -0.01);
  addBox("wood", 0.04, 1.22, 0.04, 5.78, 4.15, -0.04);
  add("wood", place(new THREE.BoxGeometry(0.62, 1.18, 0.03), 5.95, 4.35, -0.28, 0, 0.85, -0.04));

  addBox("dark", 0.6, 0.9, 0.06, 6.7, 6.35, 0.16);
  addBox("glass", 0.54, 0.84, 0.02, 6.7, 6.35, 0.02);

  const awning = bendSheet(2.95, 0.78, 0.12);
  awning.rotateX(-Math.PI / 2);
  awning.translate(6.4, 2.72, -0.28);
  add("teal", awning);
  addBox("teal", 2.85, 0.56, 0.05, 6.4, 2.4, -0.6);
  addBox("teal", 0.04, 0.56, 0.16, 4.98, 2.46, -0.5);
  addBox("teal", 0.04, 0.56, 0.16, 7.82, 2.46, -0.5);
  addBox("plasterDark", 0.07, 2.4, 0.02, 6.45, 5.35, -0.018);
  addBox("plasterDark", 0.05, 1.5, 0.02, 7.35, 3.5, -0.018);
  const fascia = place(new THREE.PlaneGeometry(2.8, 0.52), 6.4, 2.4, -0.632, 0, Math.PI, 0);
  loose.push(new THREE.Mesh(fascia, mats.sign));

  const bays = [
    { x: 3.85, w: 1.28 },
    { x: 2.4, w: 1.22 },
    { x: 0.95, w: 1.18 },
  ];
  for (const bay of bays) {
    addBox("shutter", bay.w, 2.05, 0.05, bay.x, 1.12, -0.03);
    addBox("frame", bay.w + 0.08, 0.05, 0.06, bay.x, 2.16, -0.04);
    const small = bendSheet(bay.w + 0.08, 0.42, 0.06);
    small.rotateX(-Math.PI / 2);
    small.translate(bay.x, 2.38, -0.2);
    add("awning", small);
  }

  function span(a, b, droop, rad, seed) {
    const pts = [];
    const wob = (hash(seed, 1, 1) - 0.5) * 0.06;
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t + Math.sin(Math.PI * t) * wob,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, rad, 3, false));
  }
  const ties = [[7.72, 6.35], [6.4, 5.9], [4.7, 5.55], [2.6, 5.15], [0.35, 4.85]];
  for (let k = 0; k < ties.length - 1; k++) {
    for (let i = 0; i < 12; i++) {
      const seed = k * 40 + i + 3;
      const rad = i < 2 ? 0.011 : 0.0045 + hash(seed, 2, 1) * 0.004;
      const droop = 0.08 + hash(seed, 4, 2) * 0.28;
      const za = -0.08 - hash(seed, 5, 1) * 0.16;
      const zb = -0.06 - hash(seed, 5, 2) * 0.14;
      span(
        [ties[k][0], ties[k][1] + (hash(seed, 6, 1) - 0.5) * 0.08, za],
        [ties[k + 1][0], ties[k + 1][1] + (hash(seed, 6, 2) - 0.5) * 0.08, zb],
        droop,
        rad,
        seed,
      );
    }
  }
  for (const [tx, ty] of ties) {
    addBox("wire", 0.08, 0.1, 0.06, tx, ty, -0.06);
    addBox("dark", 0.03, 0.16, 0.04, tx, ty + 0.04, -0.02);
  }
  span([7.7, 3.1, -0.2], [4.9, 2.85, -0.55], 0.18, 0.005, 90);
  span([7.65, 4.4, -0.12], [5.2, 4.15, -0.16], 0.22, 0.005, 91);

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
  for (const obj of loose) {
    obj.castShadow = true;
    obj.receiveShadow = true;
    root.add(obj);
  }

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "033";
  return root;
}
