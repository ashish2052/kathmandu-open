// House 022. Thahiti lane, north face of OSM way 1416947358, edge 3, 8.40 m.
// Spec: research/houses200/022/design.md
// Origin: front-left ground corner. +X along the street toward the east pier, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// After place.js yaw 180, x = 0 is photo-right (open door and gong) and x = 8.4 is photo-left (brick pier).
// Still: pano AUII6-FKiVWtfmAjByOJmg, yaw 150, pitch 6. Copy that frame.
// No readable shop name in the still. The paper and the small plaque stay blank.
// Opus polish 22 Oct: camera rebuilt from the still (pier near on the left, glass, pale column, door and gongs on the right).

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 8.4;
const D = 4.83;
const T = 0.2;
const ROOF = 9.15;

function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + (z || 0) * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
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
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}


// Brick sampled from the still: dull red-brown with pale dusty mortar, some bricks spalled pale.
function brickTex() {
  const w = 512;
  const h = 512;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(22);
  const cols = 10;
  const rows = 22;
  const bw = w / cols;
  const bh = h / rows;
  g.fillStyle = "#8d8075";
  g.fillRect(0, 0, w, h);
  for (let row = 0; row < rows; row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let col = -1; col < cols + 1; col++) {
      const tone = 0.8 + r() * 0.26;
      const warm = r() * 14;
      g.fillStyle = "rgb(" + Math.floor((128 + warm) * tone) + "," + Math.floor(82 * tone) + "," + Math.floor(66 * tone) + ")";
      const x = col * bw + off + 1.6;
      g.fillRect(x, row * bh + 1.8, bw - 3.2, bh - 3.4);
      if (r() > 0.88) {
        g.fillStyle = "rgba(205,180,160,0.55)";
        g.fillRect(x + r() * bw * 0.4, row * bh + 2, bw * (0.2 + r() * 0.35), bh * 0.6);
      }
      if (r() > 0.9) {
        g.fillStyle = "rgba(40,26,20,0.35)";
        g.fillRect(x, row * bh + bh * 0.5, bw - 3.2, bh * 0.3);
      }
    }
  }
  return toTex(c, true);
}

// Ragged blob for damp, spall and plaster patches.
function blob(g, x, y, rx, ry, r) {
  g.beginPath();
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const k = 0.7 + r() * 0.5;
    const px = x + Math.cos(a) * rx * k;
    const py = y + Math.sin(a) * ry * k;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.fill();
}

// Facade grime decal drawn in metres: x0..x1 by y0..y1, holes are cut clean.
function grimeTex(x0, x1, y0, y1, holes, draw) {
  const ppm = 110;
  const c = canvas(Math.round((x1 - x0) * ppm), Math.round((y1 - y0) * ppm));
  const g = c.getContext("2d");
  const P = (x, y) => [(x1 - x) * ppm, (y1 - y) * ppm];
  draw(g, P, ppm);
  for (const hole of holes) {
    const [a, b] = P(hole.x + hole.w / 2, hole.y + hole.h / 2);
    g.clearRect(a, b, hole.w * ppm, hole.h * ppm);
  }
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Back wall of the bowl window: cream shelves, bowl rows below, small gold figures above, darker up top.
function windowBackTex() {
  const w = 1024;
  const h = 540;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(31);
  g.fillStyle = "#b8ab95";
  g.fillRect(0, 0, w, h);
  const shelves = [500, 400, 300, 200, 95];
  for (const y of shelves) {
    g.fillStyle = "#efe7d8";
    g.fillRect(0, y, w, 9);
    g.fillStyle = "rgba(70,55,40,0.35)";
    g.fillRect(0, y + 9, w, 5);
  }
  for (const x of [340, 680]) {
    g.fillStyle = "#c9bca6";
    g.fillRect(x, 0, 12, h);
  }
  shelves.slice(0, 3).forEach((y, row) => {
    for (let x = 18; x < w - 20; x += 34 + r() * 10) {
      const rad = 15 + r() * 6;
      const n = 2 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        const cy = y - 8 - k * 13;
        const tone = 150 + r() * 50;
        g.fillStyle = "rgb(" + Math.floor(tone) + "," + Math.floor(tone * 0.82) + "," + Math.floor(tone * 0.55) + ")";
        g.beginPath();
        g.ellipse(x, cy, rad, 9, 0, 0, Math.PI);
        g.fill();
        g.fillStyle = "rgba(255,240,205,0.6)";
        g.fillRect(x - rad, cy - 1.5, rad * 2, 2.5);
      }
    }
  });
  shelves.slice(3).forEach((y) => {
    for (let x = 14; x < w - 14; x += 22 + r() * 12) figure(g, x, y, 34 + r() * 26, r);
  });
  const shade = g.createLinearGradient(0, 0, 0, h);
  shade.addColorStop(0, "rgba(30,22,14,0.55)");
  shade.addColorStop(0.35, "rgba(30,22,14,0.12)");
  shade.addColorStop(1, "rgba(30,22,14,0.05)");
  g.fillStyle = shade;
  g.fillRect(0, 0, w, h);
  return toTex(c, true);
}

// One cast figure standing on a shelf at (x, base): seated Buddha, or a standing deity.
function figure(g, x, base, s, r) {
  const pal = [["#c9a04e", "#6e4c1c"], ["#b88c3c", "#5e3f14"], ["#9a6a3c", "#4a2a12"], ["#cdb08a", "#7d6440"], ["#5f8a6a", "#2c4a36"], ["#b4543c", "#5e2416"]];
  const p = pal[Math.floor(r() * (r() > 0.8 ? pal.length : 3))];
  const grad = g.createLinearGradient(x - s / 2, 0, x + s / 2, 0);
  grad.addColorStop(0, p[1]);
  grad.addColorStop(0.45, p[0]);
  grad.addColorStop(1, p[1]);
  g.fillStyle = grad;
  if (r() > 0.25) {
    g.fillRect(x - s * 0.42, base - s * 0.14, s * 0.84, s * 0.14);
    g.beginPath();
    g.ellipse(x, base - s * 0.2, s * 0.4, s * 0.12, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.moveTo(x - s * 0.28, base - s * 0.22);
    g.lineTo(x - s * 0.18, base - s * 0.62);
    g.lineTo(x + s * 0.18, base - s * 0.62);
    g.lineTo(x + s * 0.28, base - s * 0.22);
    g.fill();
    g.beginPath();
    g.fill();
    g.beginPath();
    g.arc(x, base - s * 0.76, s * 0.11, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.arc(x, base - s * 0.9, s * 0.045, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x - s * 0.36, base - s * 0.5, s * 0.72, s * 0.08);
    if (r() > 0.6) {
      g.strokeStyle = p[0];
      g.lineWidth = Math.max(1, s * 0.04);
      g.beginPath();
      g.ellipse(x, base - s * 0.6, s * 0.36, s * 0.42, 0, Math.PI * 1.05, Math.PI * 1.95);
      g.stroke();
    }
  } else {
    g.fillRect(x - s * 0.2, base - s * 0.1, s * 0.4, s * 0.1);
    g.beginPath();
    g.moveTo(x - s * 0.16, base - s * 0.1);
    g.lineTo(x - s * 0.1, base - s * 0.95);
    g.lineTo(x + s * 0.1, base - s * 0.95);
    g.lineTo(x + s * 0.16, base - s * 0.1);
    g.fill();
    g.beginPath();
    g.arc(x, base - s * 1.05, s * 0.09, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(255,245,215,0.35)";
  g.fillRect(x - s * 0.04, base - s * 0.6, s * 0.06, s * 0.35);
}

// A shelf row of cut-out figures, alpha everywhere else.
function figureRowTex(seed, n) {
  const w = 2048;
  const h = 200;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const x = 40 + (i + r() * 0.5) * ((w - 80) / n);
    figure(g, x, h - 4, 70 + r() * 70, r);
  }
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Torn paper sheet, blank as in the design (the Devanagari was not read): only faint illegible smudges.
function paperTex(seed, ink, border) {
  const c = canvas(256, 256);
  const g = c.getContext("2d");
  const r = rng(seed);
  g.fillStyle = "#f1ede4";
  g.beginPath();
  for (let i = 0; i <= 40; i++) {
    const side = Math.floor(i / 10);
    const t = (i % 10) / 10;
    const j = () => 4 + r() * 10;
    const pts = [[t * 256, j()], [256 - j(), t * 256], [256 - t * 256, 256 - j()], [j(), 256 - t * 256]];
    const [px, py] = pts[Math.min(side, 3)];
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.fill();
  const age = g.createLinearGradient(0, 0, 0, 256);
  age.addColorStop(0, "rgba(150,120,80,0.05)");
  age.addColorStop(1, "rgba(120,95,60,0.3)");
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = age;
  g.fillRect(0, 0, 256, 256);
  if (border) {
    g.strokeStyle = "rgba(40,30,25,0.8)";
    g.lineWidth = 5;
    g.strokeRect(14, 14, 228, 228);
  }
  for (let k = 0; k < ink; k++) {
    g.fillStyle = "rgba(90,60,55," + (0.12 + r() * 0.12) + ")";
    g.fillRect(40 + r() * 30, 50 + k * 42, 120 + r() * 50, 9);
  }
  g.globalCompositeOperation = "source-over";
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// Dim shop seen through the open door: shelves of bowls fading into dark.
function doorBackTex() {
  const c = canvas(256, 512);
  const g = c.getContext("2d");
  const r = rng(77);
  g.fillStyle = "#2a2018";
  g.fillRect(0, 0, 256, 512);
  for (let y = 140; y < 480; y += 85) {
    g.fillStyle = "#4a3a2a";
    g.fillRect(0, y, 256, 6);
    for (let x = 14; x < 250; x += 26 + r() * 8) {
      g.fillStyle = "rgb(" + Math.floor(110 + r() * 50) + "," + Math.floor(85 + r() * 30) + ",50)";
      g.beginPath();
      g.ellipse(x, y - 8, 11, 7, 0, 0, Math.PI);
      g.fill();
    }
  }
  const v = g.createRadialGradient(128, 300, 40, 128, 300, 300);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.6)");
  g.fillStyle = v;
  g.fillRect(0, 0, 256, 512);
  return toTex(c, true);
}

function sidingTex() {
  const c = canvas(512, 256);
  const g = c.getContext("2d");
  const r = rng(8);
  g.fillStyle = "#e4dcd2";
  g.fillRect(0, 0, 512, 256);
  for (let y = 0; y < 256; y += 16) {
    g.fillStyle = y % 32 === 0 ? "#cfc4b6" : "#efe8df";
    g.fillRect(0, y, 512, 14);
    g.fillStyle = "rgba(90,70,55,0.28)";
    g.fillRect(0, y + 14, 512, 2);
    if (r() > 0.55) {
      g.fillStyle = "rgba(120,90,60,0.13)";
      g.fillRect(r() * 400, y + 2, 40 + r() * 80, 8);
    }
  }
  return toTex(c, true);
}

function boxGeo(w, h, d) {
  const geo = new THREE.BoxGeometry(w, h, d);
  const uv = geo.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]);
    }
  }
  return geo;
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
      const bw = X[i + 1] - X[i];
      const bh = Y[j + 1] - Y[j];
      if (bw < 0.015 || bh < 0.015) continue;
      const inside = holes.some((hole) => Math.abs(cx - hole.x) < hole.w / 2 - 0.001 && Math.abs(cy - hole.y) < hole.h / 2 - 0.001);
      if (!inside) out.push({ x: cx, y: cy, w: bw, h: bh });
    }
  }
  return out;
}

function paintVary(g, tint, damp) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.92 + 0.08 * hash(x * 1.7, y * 1.3, z * 1.7);
    if (damp) {
      const foot = Math.max(0, 0.55 - y) * 0.55;
      const streak = y > 2.8 && y < 3.4 ? 0.08 : 0;
      k *= 1 - foot - streak;
    }
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (ay >= ax && ay >= az) uv.setXY(i, p.getX(i) / 2.4, p.getZ(i) / 2.4);
    else if (ax >= az) uv.setXY(i, p.getZ(i) / 2.4, p.getY(i) / 1.15);
    else uv.setXY(i, p.getX(i) / 2.4, p.getY(i) / 1.15);
  }
}

// Nested singing bowls on a lathe: bottom bowl, rims stepping up, open top. Inverted stacks read as domes.
function bowlStack(r, n, seg) {
  const h = r * 0.72;
  const gap = r * 0.3;
  const top = h + (n - 1) * gap;
  const pts = [new THREE.Vector2(0.001, 0), new THREE.Vector2(r * 0.55, 0), new THREE.Vector2(r * 0.86, h * 0.38), new THREE.Vector2(r, h)];
  for (let k = 1; k < n; k++) {
    pts.push(new THREE.Vector2(r * 0.95, h + (k - 1) * gap + 0.008));
    pts.push(new THREE.Vector2(r * (1 - k * 0.012), h + k * gap));
  }
  pts.push(new THREE.Vector2(r * 0.9, top - 0.004));
  pts.push(new THREE.Vector2(r * 0.45, top - h * 0.75));
  pts.push(new THREE.Vector2(0.001, top - h * 0.8));
  return new THREE.LatheGeometry(pts, seg || 8);
}

export function createHouse022() {
  const root = new THREE.Group();
  root.name = "house-022";

  // Glass runs from the plinth to the beam, as in the still; the door is a tall dark mouth.
  const groundHoles = [
    { x: 0.92, y: 1.4, w: 1.28, h: 2.6 },
    { x: 4.85, y: 1.73, w: 4.7, h: 2.46 },
  ];
  const midHoles = [
    { x: 3.15, y: 4.95, w: 0.78, h: 1.2 },
    { x: 4.85, y: 4.95, w: 0.78, h: 1.2 },
    { x: 6.55, y: 4.95, w: 0.72, h: 1.15 },
  ];
  const topHoles = [
    { x: 3.2, y: 7.45, w: 0.7, h: 1.05 },
    { x: 4.9, y: 7.45, w: 0.7, h: 1.05 },
    { x: 6.5, y: 7.45, w: 0.66, h: 1.0 },
  ];

  const backMap = windowBackTex();
  const card = (map, extra) => new THREE.MeshStandardMaterial(Object.assign({ map, alphaTest: 0.45, roughness: 0.6, metalness: 0.15, side: THREE.DoubleSide }, extra || {}));
  const decal = (map) => new THREE.MeshStandardMaterial({ map, transparent: true, depthWrite: false, roughness: 0.95, metalness: 0, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

  const mats = {
    brick: new THREE.MeshStandardMaterial({ map: brickTex(), color: 0xffffff, roughness: 0.94, metalness: 0, vertexColors: true }),
    side: new THREE.MeshStandardMaterial({ map: sidingTex(), color: 0xf2e8d6, roughness: 0.85, metalness: 0, vertexColors: true }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6b5344, roughness: 0.8, metalness: 0, vertexColors: true }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x3a2c24, roughness: 0.75, metalness: 0, vertexColors: true }),
    plaster: new THREE.MeshStandardMaterial({ color: 0xd9d0c4, roughness: 0.9, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9aa4a2, roughness: 0.1, metalness: 0.1, transparent: true, opacity: 0.1, depthWrite: false, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.15, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x161210, roughness: 0.95, metalness: 0, vertexColors: true }),
    brass: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, vertexColors: true }),
    concrete: new THREE.MeshStandardMaterial({ color: 0xb7ab9e, roughness: 0.92, metalness: 0, vertexColors: true }),
    scooter: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.3, vertexColors: true }),
    shopBack: new THREE.MeshStandardMaterial({ map: backMap, emissiveMap: backMap, emissive: 0xffffff, emissiveIntensity: 0.16, roughness: 0.9, metalness: 0 }),
  };

  const buckets = {};
  const loose = [];
  function add(name, g, tint, damp) {
    paintVary(g, tint, damp);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, damp) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "brick" || name === "side") worldUV(g);
    add(name, g, tint, damp);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint, true);
    }
  }
  // Street-facing textured plane (rotateY(PI) so the canvas reads from the lane).
  function sheet(mat, w, h, x, y, z, rz) {
    const m = new THREE.Mesh(place(new THREE.PlaneGeometry(w, h), x, y, z, 0, Math.PI, rz || 0), mat);
    m.receiveShadow = true;
    loose.push(m);
    return m;
  }

  wallZ("brick", 0, W, 0, 3.0, 0, groundHoles, [0.95, 0.92, 0.9]);
  wallZ("side", 0, W, 3.48, 6.15, 0, midHoles, [0.98, 0.95, 0.88]);
  addBox("wood", W, 0.1, 0.16, W / 2, 6.2, -0.04, [0.7, 0.6, 0.48]);
  wallZ("side", 0, W, 6.28, 8.85, 0, topHoles, [0.96, 0.93, 0.86]);
  addBox("plaster", W + 0.06, 0.28, 0.22, W / 2, 9.02, -0.02, [0.82, 0.78, 0.72]);
  addBox("plaster", W + 0.1, 0.05, 0.3, W / 2, 8.86, -0.06, [0.5, 0.46, 0.42]);

  addBox("brick", T, ROOF, D, T / 2, ROOF / 2, D / 2, [0.9, 0.86, 0.8], true);
  addBox("brick", T, ROOF, D, W - T / 2, ROOF / 2, D / 2, [0.9, 0.86, 0.8], true);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2, [0.78, 0.74, 0.68], true);
  addBox("concrete", W - 0.5, 0.12, D - 0.6, W / 2, 9.08, D * 0.55);
  addBox("concrete", 0.7, 0.55, 0.55, 2.2, 9.4, 3.4, [0.7, 0.68, 0.64]);

  // Carved timber beam over the shop: dark soffit, fascia, a dentil course and a cap plank.
  addBox("woodDark", W + 0.1, 0.05, 0.42, W / 2, 2.985, -0.19, [0.32, 0.26, 0.22]);
  addBox("wood", W + 0.1, 0.24, 0.12, W / 2, 3.13, -0.36, [0.55, 0.44, 0.34]);
  addBox("woodDark", W + 0.1, 0.03, 0.14, W / 2, 3.0, -0.36, [0.4, 0.32, 0.26]);
  for (let x = 0.05; x < W; x += 0.14) addBox("wood", 0.075, 0.08, 0.1, x, 3.3, -0.31, [0.6 + hash(x, 3) * 0.12, 0.48, 0.36]);
  addBox("wood", W + 0.14, 0.06, 0.46, W / 2, 3.37, -0.21, [0.62, 0.52, 0.4]);
  addBox("woodDark", W + 0.02, 0.06, 0.22, W / 2, 3.43, -0.09, [0.3, 0.24, 0.2]);
  addBox("wood", W, 0.18, 0.2, W / 2, 3.2, -0.14, [0.45, 0.37, 0.3]);

  // Plinth ledge under the glass and the worn step at the door.
  addBox("concrete", 4.95, 0.5, 0.42, 4.85, 0.25, -0.13, [0.78, 0.74, 0.68], true);
  addBox("concrete", 5.0, 0.04, 0.46, 4.85, 0.52, -0.14, [0.88, 0.85, 0.8]);
  addBox("concrete", 1.5, 0.16, 0.55, 0.92, 0.08, -0.2, [0.7, 0.67, 0.62], true);
  addBox("concrete", 2.2, 0.06, 0.6, 4.4, 0.03, -0.62, [0.62, 0.6, 0.56]);

  function frame(x, y, w, h, z, mat, tint, s) {
    const t = s || 0.06;
    addBox(mat, t, h + 0.04, 0.07, x - w / 2, y, z, tint);
    addBox(mat, t, h + 0.04, 0.07, x + w / 2, y, z, tint);
    addBox(mat, w + 0.05, t, 0.07, x, y + h / 2, z, tint);
    addBox(mat, w + 0.05, t + 0.01, 0.08, x, y - h / 2, z, tint);
  }

  // Display window, set back in the brick reveal: three lights, transoms, dark wood.
  const gx = 4.85;
  const gy = 1.73;
  const gw = 4.7;
  const gh = 2.46;
  const zf = 0.1;
  frame(gx, gy, gw - 0.06, gh - 0.04, zf, "woodDark", [0.55, 0.45, 0.38], 0.08);
  for (const xx of [gx - gw / 6 - 0.15, gx + gw / 6 + 0.1]) addBox("woodDark", 0.07, gh - 0.08, 0.08, xx, gy, zf, [0.55, 0.45, 0.38]);
  for (const yy of [1.05, 1.62, 2.22]) addBox("woodDark", gw - 0.1, 0.05, 0.06, gx, yy, zf, [0.6, 0.5, 0.42]);
  addBox("glass", gw - 0.12, gh - 0.12, 0.012, gx, gy, zf - 0.04, [0.85, 0.9, 0.88]);

  // Inside: lit back wall, cream shelves, side boards, dark ceiling.
  const z0 = 0.16;
  const zb = 0.78;
  sheet(mats.shopBack, gw - 0.1, gh - 0.06, gx, gy, zb);
  addBox("plaster", gw, 0.04, zb - z0, gx, 0.52, (z0 + zb) / 2, [0.82, 0.78, 0.7]);
  addBox("dark", gw, 0.04, zb - z0, gx, 2.95, (z0 + zb) / 2, [0.35, 0.3, 0.26]);
  for (const xx of [gx - gw / 2 + 0.04, gx - gw / 6 - 0.15, gx + gw / 6 + 0.1, gx + gw / 2 - 0.04]) addBox("plaster", 0.035, gh, zb - z0, xx, gy, (z0 + zb) / 2, [0.5, 0.46, 0.4]);
  const shelfY = [0.98, 1.44, 1.9, 2.4];
  for (const y of shelfY) {
    addBox("plaster", gw - 0.1, 0.03, zb - z0, gx, y, (z0 + zb) / 2, [0.72, 0.68, 0.6]);
    addBox("plaster", gw - 0.1, 0.05, 0.02, gx, y - 0.01, z0 + 0.01, [0.95, 0.92, 0.86]);
  }

  // Bowl stacks on the three lower shelves, two depths, upright and inverted; tones from the still.
  const bowlTones = [[0.5, 0.36, 0.16], [0.42, 0.28, 0.11], [0.56, 0.42, 0.2], [0.3, 0.19, 0.08], [0.47, 0.35, 0.18]];
  const rb = rng(220);
  [0.54, 1.0, 1.46].forEach((y, row) => {
    for (const z of [0.32, 0.56]) {
      let x = gx - gw / 2 + 0.16 + (z > 0.4 ? 0.08 : 0);
      while (x < gx + gw / 2 - 0.12) {
        const r = row === 0 ? 0.11 + rb() * 0.04 : 0.08 + rb() * 0.035;
        const n = 2 + Math.floor(rb() * 3);
        const geo = bowlStack(r, n, z > 0.4 ? 6 : 8);
        const inv = row === 1 && rb() > 0.35;
        if (inv) geo.applyMatrix4(new THREE.Matrix4().makeRotationX(Math.PI)).translate(0, r * 0.72 + (n - 1) * r * 0.3, 0);
        const tone = bowlTones[Math.floor(rb() * bowlTones.length)];
        const dim = z > 0.4 ? 0.7 : 1;
        add("brass", place(geo, x, y, z), [tone[0] * dim, tone[1] * dim, tone[2] * dim]);
        x += r * 2.05 + 0.015;
        if (row === 2 && z < 0.4 && rb() > 0.55) x += 0.22;
      }
    }
  });

  // Cut-out cast figures on the two upper shelves and among the bowls on the third.
  [[1.92, 0.42, 0.5, 11, 14], [1.92, 0.3, 0.42, 12, 17], [2.42, 0.4, 0.46, 13, 13], [2.42, 0.28, 0.4, 14, 16], [1.475, 0.26, 0.3, 15, 6]].forEach(([y, z, h, seed, n]) => {
    sheet(card(figureRowTex(seed, n)), gw - 0.16, h, gx, y + h / 2, z);
  });

  // Pale column between the glass and the door.
  addBox("plaster", 0.78, 2.98, 0.12, 2.08, 1.49, -0.05, [0.9, 0.86, 0.78], true);
  addBox("plaster", 0.84, 0.08, 0.16, 2.08, 0.04, -0.05, [0.55, 0.5, 0.44]);

  // Open door: tall dark mouth, deep shop behind, a dark bronze figure, two brass gongs on a bracket.
  frame(0.92, 1.4, 1.28, 2.6, -0.02, "woodDark", [0.55, 0.45, 0.38], 0.09);
  addBox("dark", 0.06, 2.6, 1.9, 0.31, 1.4, 0.95, [0.5, 0.42, 0.36]);
  addBox("dark", 0.06, 2.6, 1.9, 1.53, 1.4, 0.95, [0.5, 0.42, 0.36]);
  addBox("dark", 1.28, 0.06, 1.9, 0.92, 2.68, 0.95, [0.3, 0.26, 0.22]);
  addBox("concrete", 1.28, 0.06, 1.9, 0.92, 0.13, 0.95, [0.35, 0.31, 0.27]);
  sheet(new THREE.MeshStandardMaterial({ map: doorBackTex(), emissiveMap: doorBackTex(), emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.9 }), 1.2, 2.5, 0.92, 1.4, 1.88);
  const statue = new THREE.LatheGeometry([
    new THREE.Vector2(0.001, 0), new THREE.Vector2(0.2, 0), new THREE.Vector2(0.2, 0.22), new THREE.Vector2(0.14, 0.26),
    new THREE.Vector2(0.13, 0.7), new THREE.Vector2(0.17, 1.0), new THREE.Vector2(0.11, 1.12), new THREE.Vector2(0.07, 1.16),
    new THREE.Vector2(0.09, 1.25), new THREE.Vector2(0.05, 1.36), new THREE.Vector2(0.001, 1.4),
  ], 8);
  add("brass", place(statue, 0.62, 0.16, 0.95), [0.07, 0.045, 0.03]);
  addBox("woodDark", 0.04, 0.04, 0.5, 1.45, 2.55, -0.2, [0.25, 0.2, 0.16]);
  const gong = (r) => new THREE.LatheGeometry([new THREE.Vector2(0.001, 0.035), new THREE.Vector2(r * 0.3, 0.03), new THREE.Vector2(r * 0.85, 0.012), new THREE.Vector2(r, 0.05), new THREE.Vector2(r * 0.96, 0.065)], 16);
  [[1.5, 2.12, -0.38, 0.21, 0.15], [1.22, 2.16, -0.42, 0.18, -0.2]].forEach(([x, y, z, r, ry]) => {
    add("brass", place(gong(r), x, y, z, -Math.PI / 2, ry, 0), [0.62, 0.43, 0.15]);
    add("wire", place(new THREE.CylinderGeometry(0.004, 0.004, 2.53 - y - r, 3), x, (2.53 + y + r) / 2, z), [0.08, 0.06, 0.05]);
  });

  // East pier: blank torn papers, the small framed plaque, the yellow plaster band.
  sheet(card(paperTex(5, 0, false), { metalness: 0, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.32 }), 0.74, 0.62, 7.8, 2.2, -0.012, 0.02);
  sheet(card(paperTex(6, 2, false), { metalness: 0, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.32 }), 0.72, 0.68, 7.76, 1.52, -0.014, -0.015);
  sheet(card(paperTex(7, 0, false), { metalness: 0, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.32 }), 0.66, 0.58, 7.78, 0.92, -0.012, 0.01);
  sheet(card(paperTex(8, 3, true), { metalness: 0, roughness: 0.95, emissive: 0xffffff, emissiveIntensity: 0.32 }), 0.5, 0.36, 7.82, 0.36, -0.016, 0.03);

  // Ground-floor grime: damp foot, spalled pale brick, soot under the beam, yellow plaster on the pier.
  const gTex = grimeTex(0, W, 0, 3.0, groundHoles.concat([{ x: 2.08, y: 1.5, w: 0.78, h: 3.0 }]), (g, P, ppm) => {
    const r = rng(9);
    const foot = g.createLinearGradient(0, 3.0 * ppm, 0, 2.2 * ppm);
    foot.addColorStop(0, "rgba(38,26,18,0.6)");
    foot.addColorStop(1, "rgba(38,26,18,0)");
    g.fillStyle = foot;
    g.fillRect(0, 2.0 * ppm, W * ppm, ppm);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = "rgba(45,32,22," + (0.1 + r() * 0.2) + ")";
      const [a, b] = P(r() * W, r() * 0.9);
      blob(g, a, b, 8 + r() * 30, 6 + r() * 16, r);
    }
    for (let i = 0; i < 9; i++) {
      g.fillStyle = "rgba(200,178,118," + (0.55 + r() * 0.3) + ")";
      const [a, b] = P(7.3 + r() * 1.0, 2.55 + r() * 0.35);
      blob(g, a, b, 0.12 * ppm + r() * 20, 0.08 * ppm + r() * 8, r);
    }
    for (let i = 0; i < 14; i++) {
      g.fillStyle = "rgba(208,186,170," + (0.4 + r() * 0.35) + ")";
      const [a, b] = P(7.25 + r() * 1.1, 0.1 + r() * 1.3);
      blob(g, a, b, 6 + r() * 16, 4 + r() * 10, r);
    }
    const soot = g.createLinearGradient(0, 0, 0, 0.5 * ppm);
    soot.addColorStop(0, "rgba(28,20,14,0.55)");
    soot.addColorStop(1, "rgba(28,20,14,0)");
    g.fillStyle = soot;
    g.fillRect(0, 0, W * ppm, 0.5 * ppm);
  });
  sheet(decal(gTex), W, 3.0, W / 2, 1.5, -0.003);

  // Upper floors: soot under parapet and beam, streaks under each window, damp blots.
  const upHoles = midHoles.concat(topHoles);
  const uTex = grimeTex(0, W, 3.48, 8.85, upHoles, (g, P, ppm) => {
    const r = rng(41);
    const soot = g.createLinearGradient(0, 0, 0, 0.8 * ppm);
    soot.addColorStop(0, "rgba(40,30,22,0.55)");
    soot.addColorStop(1, "rgba(40,30,22,0)");
    g.fillStyle = soot;
    g.fillRect(0, 0, W * ppm, 0.8 * ppm);
    for (const hole of upHoles) {
      for (let k = 0; k < 6; k++) {
        const [a, b] = P(hole.x + hole.w / 2 - r() * hole.w, hole.y - hole.h / 2 - 0.05);
        const len = (0.4 + r() * 0.9) * ppm;
        const s = g.createLinearGradient(0, b, 0, b + len);
        s.addColorStop(0, "rgba(60,45,32,0.4)");
        s.addColorStop(1, "rgba(60,45,32,0)");
        g.fillStyle = s;
        g.fillRect(a, b, 3 + r() * 6, len);
      }
    }
    for (let i = 0; i < 26; i++) {
      g.fillStyle = "rgba(90,72,50," + (0.06 + r() * 0.12) + ")";
      const [a, b] = P(r() * W, 3.5 + r() * 5.3);
      blob(g, a, b, 20 + r() * 60, 10 + r() * 40, r);
    }
    const base = g.createLinearGradient(0, (8.85 - 3.48) * ppm, 0, (8.85 - 4.1) * ppm);
    base.addColorStop(0, "rgba(40,30,22,0.45)");
    base.addColorStop(1, "rgba(40,30,22,0)");
    g.fillStyle = base;
    g.fillRect(0, (8.85 - 4.1) * ppm, W * ppm, 0.62 * ppm);
  });
  sheet(decal(uTex), W, 8.85 - 3.48, W / 2, (8.85 + 3.48) / 2, -0.003);

  // Upper windows: dark frames, plaster sill and hood, curtained dark rooms behind.
  function win(x, y, w, h) {
    frame(x, y, w, h, -0.025, "woodDark", [0.5, 0.42, 0.36]);
    addBox("glass", w - 0.1, h - 0.1, 0.012, x, y, 0.02, [0.75, 0.8, 0.78]);
    addBox("woodDark", 0.03, h - 0.12, 0.03, x, y, -0.01, [0.5, 0.42, 0.36]);
    addBox("woodDark", w - 0.12, 0.03, 0.03, x, y + h * 0.18, -0.01, [0.5, 0.42, 0.36]);
    addBox("dark", w, h, 0.02, x, y, 0.16, [0.55, 0.42, 0.34]);
    addBox("goods", w * 0.42, h - 0.12, 0.02, x + w * 0.24, y - 0.02, 0.12, [0.32, 0.2, 0.14]);
    addBox("plaster", w + 0.2, 0.06, 0.14, x, y - h / 2 - 0.06, -0.06, [0.78, 0.74, 0.66]);
    addBox("plaster", w + 0.24, 0.08, 0.12, x, y + h / 2 + 0.07, -0.05, [0.8, 0.76, 0.68]);
  }
  win(3.15, 4.95, 0.78, 1.2);
  win(4.85, 4.95, 0.78, 1.2);
  win(6.55, 4.95, 0.72, 1.15);
  win(3.2, 7.45, 0.7, 1.05);
  win(4.9, 7.45, 0.7, 1.05);
  win(6.5, 7.45, 0.66, 1.0);

  // Deep balcony: slab with a darker soffit, rail, posts.
  addBox("concrete", 4.9, 0.1, 0.78, 4.9, 3.95, -0.42, [0.84, 0.81, 0.76]);
  addBox("concrete", 4.86, 0.02, 0.74, 4.9, 3.895, -0.42, [0.42, 0.39, 0.35]);
  addBox("wood", 4.9, 0.08, 0.08, 4.9, 4.55, -0.78, [0.5, 0.4, 0.32]);
  for (let i = 0; i < 8; i++) addBox("woodDark", 0.035, 0.52, 0.035, 2.55 + i * 0.67, 4.28, -0.76);
  addBox("concrete", 3.2, 0.06, 0.42, 5.2, 6.55, -0.28, [0.86, 0.83, 0.78]);
  addBox("woodDark", 3.2, 0.04, 0.04, 5.2, 6.85, -0.46, [0.5, 0.4, 0.32]);

  // The wire nest on the fascia: 22 strands each with its own sag, dusty pale and black,
  // on brackets at both ends, a coiled loop and droppers over the east pier, one bare bulb.
  function wire(pts, rad, tint, seg) {
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), seg || 22, rad, 3, false), tint);
  }
  const rw = rng(5);
  const wireTones = [[0.05, 0.045, 0.04], [0.42, 0.36, 0.28], [0.5, 0.44, 0.34], [0.12, 0.1, 0.08], [0.32, 0.27, 0.2]];
  for (const x of [8.3, 0.15]) {
    addBox("woodDark", 0.05, 0.05, 0.62, x, 3.36, -0.66, [0.2, 0.18, 0.16]);
    addBox("woodDark", 0.025, 0.2, 0.025, x, 3.27, -0.96, [0.2, 0.18, 0.16]);
  }
  for (let i = 0; i < 22; i++) {
    const y = 3.3 + rw() * 0.16;
    const z = -0.5 - rw() * 0.42;
    const sag = 0.18 + rw() * 0.38;
    const tone = wireTones[Math.floor(rw() * wireTones.length)];
    wire([
      new THREE.Vector3(8.9, y + 0.1, z - 0.1),
      new THREE.Vector3(8.3, y, z),
      new THREE.Vector3(6.2, y - sag * 0.8, z + rw() * 0.1),
      new THREE.Vector3(4.2, y - sag, z - rw() * 0.1),
      new THREE.Vector3(2.1, y - sag * 0.7, z + rw() * 0.08),
      new THREE.Vector3(0.15, y, z),
      new THREE.Vector3(-0.5, y + 0.12, z - 0.15),
    ], 0.007 + rw() * 0.008, tone, 28);
  }
  for (let k = 0; k < 6; k++) {
    const cx = 7.7 + rw() * 0.7;
    const rad = 0.14 + rw() * 0.12;
    const tilt = (rw() - 0.5) * 0.8;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      pts.push(new THREE.Vector3(cx + Math.sin(a) * rad, 3.12 + rw() * 0.08 - (1 - Math.cos(a)) * rad * 0.7 + Math.sin(a) * tilt * rad, -0.6 - Math.cos(a) * 0.08 - rw() * 0.04));
    }
    wire(pts, 0.007, wireTones[(k + 1) % 5], 24);
  }
  for (let k = 0; k < 3; k++) {
    const x = 8.0 - k * 0.35;
    wire([new THREE.Vector3(x, 3.25, -0.7), new THREE.Vector3(x - 0.06, 2.7, -0.72), new THREE.Vector3(x + 0.04, 2.15 - k * 0.25, -0.7)], 0.006, wireTones[k], 10);
  }
  add("goods", place(new THREE.SphereGeometry(0.045, 8, 6), 8.0, 2.11, -0.7), [1.0, 0.98, 0.95]);
  wire([new THREE.Vector3(0.3, 3.3, -0.1), new THREE.Vector3(0.45, 5.2, -0.14), new THREE.Vector3(0.2, 8.4, -0.08)], 0.01, [0.08, 0.07, 0.06], 10);

  // Dark scooter parked rear-out in front of the column: side-profile body, silver skirt, seat, red lamp.
  const prof = new THREE.Shape();
  [[0, 0.32], [0.04, 0.62], [0.16, 0.76], [0.86, 0.74], [0.96, 0.46], [1.28, 0.44], [1.42, 0.92], [1.5, 1.04], [1.58, 0.98], [1.7, 0.5], [1.6, 0.3], [0.06, 0.26]].forEach(([s, y], i) => (i ? prof.lineTo(s, y) : prof.moveTo(s, y)));
  const scoot = [];
  scoot.push([new THREE.ExtrudeGeometry(prof, { depth: 0.3, bevelEnabled: false }).translate(0, 0, -0.15), [0.05, 0.05, 0.055]]);
  scoot.push([boxGeo(0.8, 0.14, 0.32).translate(0.48, 0.38, 0), [0.45, 0.46, 0.48]]);
  scoot.push([new THREE.SphereGeometry(1, 12, 6).scale(0.4, 0.07, 0.15).translate(0.5, 0.8, 0), [0.02, 0.02, 0.02]]);
  scoot.push([new THREE.SphereGeometry(1, 12, 6).scale(0.42, 0.17, 0.17).translate(0.36, 0.6, 0), [0.07, 0.07, 0.075]]);
  scoot.push([new THREE.SphereGeometry(1, 10, 6).scale(0.12, 0.3, 0.2).translate(1.46, 0.72, 0), [0.06, 0.06, 0.065]]);
  for (const zz of [-0.24, 0.24]) scoot.push([new THREE.SphereGeometry(0.04, 6, 4).scale(1, 0.6, 1.4).translate(1.5, 1.28, zz), [0.03, 0.03, 0.03]], [boxGeo(0.015, 0.2, 0.015).translate(1.52, 1.17, zz * 0.9), [0.03, 0.03, 0.03]]);
  scoot.push([boxGeo(0.04, 0.07, 0.2).translate(0.02, 0.6, 0), [0.6, 0.03, 0.02]]);
  scoot.push([boxGeo(0.05, 0.05, 0.62).translate(1.52, 1.08, 0), [0.03, 0.03, 0.03]]);
  scoot.push([boxGeo(0.02, 0.12, 0.18).translate(-0.01, 0.4, 0), [0.7, 0.7, 0.72]]);
  for (const s of [0.26, 1.56]) scoot.push([new THREE.CylinderGeometry(0.2, 0.2, 0.1, 14).rotateX(Math.PI / 2).translate(s, 0.2, 0), [0.03, 0.03, 0.03]]);
  for (const [g, tint] of scoot) add("scooter", place(g, 3.9, 0, -1.68, 0, -2.3, 0), tint);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name].map((g) => (g.index ? g.toNonIndexed() : g));
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
  root.userData.id = "022";
  return root;
}
