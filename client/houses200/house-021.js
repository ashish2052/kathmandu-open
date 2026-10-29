// House 021. Maru Tole, OSM way 183559497 (Laxmi Narayan Sattal), east edge 5, 10.35 m.
// The lane has no panorama. This footprint is the one the May 2024 stills actually hit:
// aZos heading 303 is 5.1 m from this edge, and 2bHf heading 10 is 3.8 m from the south face.
// Origin: north end of the east front (photo-right in the east still). +X runs south,
// +Y up, +Z west into the lot. The east lane is negative Z.
// After place.js yaw 180, authored x = 0 is the north end (carved corner post).
// Ground floor is an open shop under a tile slope. The carved upper floor sits behind
// that slope, facing south. Untagged 7.2 is not a storey count. No sign text. No people.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 10.35;
const D = 13.48;

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

function brickCanvas() {
  const c = canvas(256, 128);
  const g = c.getContext("2d");
  g.fillStyle = "#6e5348";
  g.fillRect(0, 0, 256, 128);
  const cols = 8;
  const rows = 10;
  const bh = 128 / rows;
  const bw = 256 / cols;
  for (let row = 0; row < rows; row++) {
    const off = row % 2 ? bw * 0.5 : 0;
    for (let col = -1; col < cols + 1; col++) {
      const n = hash(col + 3, row + 1, 2);
      const r = 118 + n * 36;
      const gv = 72 + n * 22;
      const b = 58 + n * 14;
      g.fillStyle = "rgb(" + (r | 0) + "," + (gv | 0) + "," + (b | 0) + ")";
      g.fillRect(col * bw + off + 1, row * bh + 1, bw - 2, bh - 2.2);
    }
  }
  g.fillStyle = "rgba(36,22,18,0.5)";
  g.fillRect(0, 128 - bh * 2.4, 256, bh * 2.4);
  return toTex(c);
}

function tileCanvas() {
  // 512 x 256 is 2.5 m x 1.25 m of old clay tile: brown-red rows, grey lichen, moss, gaps.
  const c = canvas(512, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#5a382c";
  g.fillRect(0, 0, 512, 256);
  const rows = 14;
  const rh = 256 / rows;
  for (let row = 0; row < rows; row++) {
    const n = 22;
    const tw = 512 / n;
    const off = row % 2 ? tw * 0.5 : 0;
    for (let i = -1; i < n + 1; i++) {
      const k = hash(i + 2, row, 5);
      const x = i * tw + off;
      const y = row * rh;
      if (k > 0.97) continue;
      const r = 120 + k * 50;
      const gv = 70 + k * 26;
      const b = 52 + k * 18;
      const gr = g.createLinearGradient(x, 0, x + tw, 0);
      gr.addColorStop(0, "rgb(" + (r * 0.7 | 0) + "," + (gv * 0.7 | 0) + "," + (b * 0.7 | 0) + ")");
      gr.addColorStop(0.45, "rgb(" + (r | 0) + "," + (gv | 0) + "," + (b | 0) + ")");
      gr.addColorStop(1, "rgb(" + (r * 0.62 | 0) + "," + (gv * 0.62 | 0) + "," + (b * 0.62 | 0) + ")");
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(x + 1, y + rh + 2);
      g.lineTo(x + 2, y + 1);
      g.quadraticCurveTo(x + tw * 0.5, y - 2, x + tw - 2, y + 1);
      g.lineTo(x + tw - 1, y + rh + 2);
      g.closePath();
      g.fill();
      g.fillStyle = "rgba(20,12,8,0.55)";
      g.fillRect(x + 1, y + rh - 2, tw - 2, 3);
    }
  }
  for (let i = 0; i < 70; i++) {
    const x = hash(i, 4, 9) * 512;
    const y = hash(i, 7, 3) * 256;
    const r = 6 + hash(i, 2, 8) * 26;
    g.fillStyle = i % 3 ? "rgba(150,146,132,0.32)" : "rgba(48,52,34,0.3)";
    g.beginPath();
    g.ellipse(x, y, r * 1.6, r * 0.7, 0, 0, Math.PI * 2);
    g.fill();
  }
  return toTex(c);
}

function plasterCanvas() {
  // Upper storey plaster, 7.6 m x 2.5 m: pale cream, mottled, soot under the cornice, streaks.
  const c = canvas(1024, 336);
  const g = c.getContext("2d");
  g.fillStyle = "#c4b79d";
  g.fillRect(0, 0, 1024, 336);
  for (let i = 0; i < 260; i++) {
    const x = hash(i, 1, 4) * 1024;
    const y = hash(i, 3, 2) * 336;
    const r = 4 + hash(i, 5, 6) * 30;
    g.fillStyle = hash(i, 8, 1) > 0.5 ? "rgba(225,214,190,0.22)" : "rgba(110,96,78,0.16)";
    g.beginPath();
    g.ellipse(x, y, r * 1.4, r, 0, 0, Math.PI * 2);
    g.fill();
  }
  const top = g.createLinearGradient(0, 0, 0, 90);
  top.addColorStop(0, "rgba(38,30,24,0.75)");
  top.addColorStop(1, "rgba(38,30,24,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1024, 90);
  for (let i = 0; i < 46; i++) {
    const x = hash(i, 9, 2) * 1024;
    const len = 60 + hash(i, 4, 4) * 220;
    const w = 3 + hash(i, 6, 1) * 10;
    const gr = g.createLinearGradient(0, 20, 0, 20 + len);
    gr.addColorStop(0, "rgba(52,42,32,0.45)");
    gr.addColorStop(1, "rgba(52,42,32,0)");
    g.fillStyle = gr;
    g.fillRect(x, 20, w, len);
  }
  const foot = g.createLinearGradient(0, 290, 0, 336);
  foot.addColorStop(0, "rgba(70,58,44,0)");
  foot.addColorStop(1, "rgba(70,58,44,0.55)");
  g.fillStyle = foot;
  g.fillRect(0, 290, 1024, 46);
  return toTex(c);
}

function shopCanvas() {
  // Back of the open bays, 11.3 m x 2.1 m: dark timber wall, shelves of tins, packets, bundles.
  const c = canvas(2048, 384);
  const g = c.getContext("2d");
  const bg = g.createLinearGradient(0, 0, 0, 384);
  bg.addColorStop(0, "#120c09");
  bg.addColorStop(0.5, "#2a1c14");
  bg.addColorStop(1, "#3a2a1e");
  g.fillStyle = bg;
  g.fillRect(0, 0, 2048, 384);
  const inks = ["#b3121c", "#d8b02c", "#2f63b5", "#e8e2d4", "#c85a1e", "#3f7d4a", "#d4407a", "#7a1420"];
  for (const y of [120, 200, 280]) {
    g.fillStyle = "#4a3222";
    g.fillRect(0, y, 2048, 7);
    let x = 4;
    while (x < 2040) {
      const k = hash(x, y, 3);
      const w = 8 + k * 22;
      const h = 18 + hash(x, y, 7) * 40;
      if (hash(x, y, 9) > 0.18) {
        g.fillStyle = inks[(k * 8) | 0];
        g.globalAlpha = 0.42;
        g.fillRect(x, y - h, w, h);
        g.fillStyle = "rgba(255,255,255,0.25)";
        g.fillRect(x + 1, y - h + 3, w - 2, 3);
        g.globalAlpha = 1;
      }
      x += w + 2 + hash(x, y, 1) * 10;
    }
  }
  const top = g.createLinearGradient(0, 0, 0, 90);
  top.addColorStop(0, "rgba(0,0,0,0.85)");
  top.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 2048, 90);
  return toTex(c);
}

const GARMENT_INKS = ["#b3121c", "#d4407a", "#2f63b5", "#ebe7de", "#7a1420", "#d9632a", "#c2185b", "#6b8fd1"];

function garmentCanvas() {
  // Eight hanging kurtas and tops, one per 128 x 256 cell, cut out on alpha.
  const c = canvas(1024, 256);
  const g = c.getContext("2d");
  GARMENT_INKS.forEach((ink, i) => {
    const x = i * 128;
    const bot = i % 3 !== 1 ? 250 : 170;
    g.fillStyle = ink;
    g.beginPath();
    g.moveTo(x + 50, 8);
    g.lineTo(x + 78, 8);
    g.lineTo(x + 112, 26);
    g.lineTo(x + 120, 90);
    g.lineTo(x + 98, 94);
    g.lineTo(x + 94, 60);
    g.lineTo(x + 100, bot);
    g.lineTo(x + 28, bot);
    g.lineTo(x + 34, 60);
    g.lineTo(x + 30, 94);
    g.lineTo(x + 8, 90);
    g.lineTo(x + 16, 26);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(0,0,0,0.28)";
    for (let k = 0; k < 5; k++) g.fillRect(x + 40 + k * 11, 70, 3, bot - 74);
    g.fillStyle = i % 2 ? "rgba(255,230,140,0.55)" : "rgba(255,255,255,0.35)";
    for (let k = 0; k < 18; k++) g.fillRect(x + 36 + hash(i, k, 1) * 56, 30 + hash(i, k, 2) * (bot - 40), 4, 4);
    g.fillStyle = "rgba(0,0,0,0.35)";
    g.fillRect(x + 54, 8, 20, 10);
  });
  return toTex(c);
}

function sachetCanvas() {
  // A hanging strip of sachets, 0.24 m x 1.1 m.
  const c = canvas(64, 512);
  const g = c.getContext("2d");
  const inks = ["#d42020", "#f0c020", "#f4f0e4", "#d42020", "#2a8a3a"];
  for (let i = 0; i < 16; i++) {
    g.fillStyle = inks[i % inks.length];
    g.fillRect(4, i * 32 + 2, 56, 28);
    g.fillStyle = "rgba(255,255,255,0.4)";
    g.fillRect(10, i * 32 + 8, 30, 5);
    g.fillStyle = "rgba(0,0,0,0.3)";
    g.fillRect(4, i * 32 + 26, 56, 3);
  }
  return toTex(c);
}

function latticeCanvas(rail) {
  // Carved timber with pierced holes: gallery rail panel (1 m x 0.95 m) or window lattice.
  const c = canvas(256, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#3a2419";
  g.fillRect(0, 0, 256, 256);
  g.globalCompositeOperation = "destination-out";
  if (rail) {
    for (let i = 0; i < 8; i++) {
      for (let j = 0; j < 3; j++) {
        g.beginPath();
        g.ellipse(16 + i * 32, 92 + j * 46, 9, 16, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
  } else {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        g.save();
        g.translate(14 + i * 28.5, 14 + j * 28.5);
        g.rotate(Math.PI / 4);
        g.fillRect(-7, -7, 14, 14);
        g.restore();
      }
    }
  }
  g.globalCompositeOperation = "source-over";
  g.strokeStyle = "rgba(120,84,58,0.6)";
  g.lineWidth = 3;
  g.strokeRect(4, 4, 248, 248);
  if (rail) {
    g.fillStyle = "#2c1a12";
    g.fillRect(0, 0, 256, 50);
    g.fillRect(0, 230, 256, 26);
    g.fillStyle = "rgba(150,110,80,0.35)";
    for (let i = 0; i < 16; i++) g.fillRect(i * 16 + 3, 12, 8, 26);
  }
  return toTex(c);
}

function fringeCanvas() {
  // Maroon cloth valance under the top eave, scalloped hem.
  const c = canvas(256, 64);
  const g = c.getContext("2d");
  g.fillStyle = "#7c1a1c";
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(256, 0);
  g.lineTo(256, 40);
  for (let i = 7; i >= 0; i--) g.quadraticCurveTo(i * 32 + 16, 64, i * 32, 40);
  g.closePath();
  g.fill();
  g.fillStyle = "rgba(230,190,90,0.6)";
  g.fillRect(0, 8, 256, 4);
  g.fillStyle = "rgba(0,0,0,0.25)";
  for (let i = 0; i < 16; i++) g.fillRect(i * 16, 14, 3, 30);
  return toTex(c);
}

function woodCanvas() {
  const c = canvas(64, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#3c241c";
  g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 22; i++) {
    const x = (hash(i, 1, 1) * 64) | 0;
    g.strokeStyle = "rgba(18,10,8," + (0.3 + hash(i, 2, 1) * 0.45) + ")";
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + (hash(i, 3, 1) - 0.5) * 6, 256);
    g.stroke();
  }
  return toTex(c);
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

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.88 + 0.12 * hash(x * 1.7, y * 1.3, z * 1.1);
    if (y < 0.35) k *= 0.72;
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
}

function std(map, nor, color, rough) {
  const m = new THREE.MeshStandardMaterial({
    color,
    map: map || null,
    normalMap: nor || null,
    roughness: rough,
    metalness: 0,
    vertexColors: true,
    envMapIntensity: 0.18,
  });
  if (nor) m.normalScale = new THREE.Vector2(0.65, 0.65);
  return m;
}

export function createHouse021() {
  const root = new THREE.Group();
  root.name = "house-021";

  const brickMap = brickCanvas();
  const tileMap = tileCanvas();
  tileMap.repeat.set(1 / 2.5, 1 / 1.25);
  const woodMap = woodCanvas();
  const shopMap = shopCanvas();
  const cut = (map) => new THREE.MeshStandardMaterial({ map, alphaTest: 0.5, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, vertexColors: true });
  const mats = {
    brick: std(brickMap, tex("brick_wall_006_nor_gl.jpg", false, 2, 1), 0xffffff, 0.96),
    wood: std(woodMap, tex("dark_wood_nor_gl.jpg", false, 1, 2), 0xffffff, 0.86),
    tile: std(tileMap, tex("clay_roof_tiles_02_nor_gl.jpg", false, 0.8, 0.8), 0xffffff, 0.92),
    plaster: std(plasterCanvas(), null, 0xb3a896, 0.95),
    shop: new THREE.MeshStandardMaterial({ map: shopMap, emissiveMap: shopMap, emissive: 0xffffff, emissiveIntensity: 0.1, roughness: 0.9, metalness: 0, vertexColors: true }),
    garment: cut(garmentCanvas()),
    sachet: cut(sachetCanvas()),
    rail: cut(latticeCanvas(true)),
    lattice: cut(latticeCanvas(false)),
    fringe: cut(fringeCanvas()),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.78, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110f, roughness: 0.96, metalness: 0, vertexColors: true }),
    garland: new THREE.MeshStandardMaterial({ color: 0xe2a020, roughness: 0.72, metalness: 0, vertexColors: true }),
    solar: new THREE.MeshStandardMaterial({ color: 0x1c3358, roughness: 0.35, metalness: 0.15, vertexColors: true }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xd8d6d0, roughness: 0.5, metalness: 0.2, vertexColors: true }),
  };
  mats.tile.side = THREE.DoubleSide;

  const buckets = {};
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    add(name, place(boxGeo(w, h, d), x, y, z, rx || 0, ry || 0, rz || 0), tint);
  }
  // Plane facing +Z before ry; ru repeats the texture along its width.
  function plane(name, w, h, x, y, z, ry, tint, ru, cell) {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      const u = uv.getX(i);
      uv.setX(i, cell !== undefined ? (cell + u) / 8 : u * (ru || 1));
    }
    add(name, place(g, x, y, z, 0, ry || 0, 0), tint);
  }
  const Z = new THREE.Vector3(0, 0, 1);
  function beam(name, a, b, w, h, tint) {
    const va = new THREE.Vector3(...a);
    const dir = new THREE.Vector3(...b).sub(va);
    const len = dir.length();
    const g = boxGeo(w, h, len);
    g.applyMatrix4(new THREE.Matrix4().compose(
      va.addScaledVector(dir, 0.5),
      new THREE.Quaternion().setFromUnitVectors(Z, dir.normalize()),
      new THREE.Vector3(1, 1, 1),
    ));
    add(name, g, tint);
  }
  // Hipped skirt: eave rectangle at y0 rises to an inner rectangle at y1, sagging with age.
  function skirt(outer, inner, y0, y1, sag, tint) {
    const oc = [[outer[0], outer[2]], [outer[1], outer[2]], [outer[1], outer[3]], [outer[0], outer[3]]];
    const ic = [[inner[0], inner[2]], [inner[1], inner[2]], [inner[1], inner[3]], [inner[0], inner[3]]];
    for (let s = 0; s < 4; s++) {
      const oa = oc[s], ob = oc[(s + 1) % 4], ia = ic[s], ib = ic[(s + 1) % 4];
      const elen = Math.hypot(ob[0] - oa[0], ob[1] - oa[1]);
      const ex = (ob[0] - oa[0]) / elen, ez = (ob[1] - oa[1]) / elen;
      const mx = (ia[0] + ib[0] - oa[0] - ob[0]) / 2, mz = (ia[1] + ib[1] - oa[1] - ob[1]) / 2;
      const slope = Math.hypot(Math.hypot(mx, mz), y1 - y0);
      const nu = Math.max(2, Math.ceil(elen / 0.9));
      const nv = 4;
      const pos = [], uvs = [], idx = [];
      for (let j = 0; j <= nv; j++) {
        const v = j / nv;
        for (let i = 0; i <= nu; i++) {
          const u = i / nu;
          const x0 = oa[0] + (ob[0] - oa[0]) * u, z0 = oa[1] + (ob[1] - oa[1]) * u;
          const x1 = ia[0] + (ib[0] - ia[0]) * u, z1 = ia[1] + (ib[1] - ia[1]) * u;
          const x = x0 + (x1 - x0) * v, z = z0 + (z1 - z0) * v;
          pos.push(x, y0 + (y1 - y0) * v - sag * Math.sin(Math.PI * u) * Math.sin(Math.PI * v), z);
          uvs.push((x - oa[0]) * ex + (z - oa[1]) * ez, v * slope);
        }
      }
      for (let j = 0; j < nv; j++) {
        for (let i = 0; i < nu; i++) {
          const a = j * (nu + 1) + i;
          idx.push(a, a + 1, a + nu + 1, a + 1, a + nu + 2, a + nu + 1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      add("tile", g, tint);
      // Big lichen-grey and soot blotches, the way the photo's roof greys toward the east end.
      const col = g.attributes.color;
      const p = g.attributes.position;
      for (let i = 0; i < col.count; i++) {
        const x = p.getX(i), z = p.getZ(i);
        const l = Math.max(0, Math.sin(x * 0.9 + 1.3) * Math.sin(z * 0.55 + 0.4) + 0.25 - z * 0.04) * 0.9;
        const d = 0.8 + 0.2 * Math.sin(x * 2.3 + z * 1.7);
        col.setXYZ(i, ...[0, 1, 2].map((c) => (col.getComponent(i, c) * (1 - l) + [0.34, 0.33, 0.3][c] * l) * d));
      }
      beam("tile", [oa[0], y0 + 0.04, oa[1]], [ia[0], y1 + 0.04, ia[1]], 0.18, 0.1, [0.8, 0.76, 0.72]);
    }
  }
  function festoon(name, a, b, drop, r, tint) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - drop * Math.sin(Math.PI * t),
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add(name, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 14, r, 5, false), tint);
  }
  function garment(x, y, z, ry, cell, w, h) {
    plane("garment", w || 0.42, h || 0.84, x, y, z, ry, [1, 1, 1], 0, cell);
  }

  // Brick plinth along the east lane and the south square, stone ledge on top.
  addBox("brick", W, 0.42, 0.28, W / 2, 0.21, 0.08);
  addBox("brick", 0.28, 0.42, D, W - 0.1, 0.21, D / 2, [0.5, 0.46, 0.44]);
  addBox("wood", 0.34, 0.05, D, W - 0.1, 0.445, D / 2, [0.42, 0.4, 0.38]);
  addBox("brick", 0.22, 3.1, D, 0.11, 1.55, D / 2, [0.85, 0.82, 0.8]);
  addBox("brick", W, 3.2, 0.22, W / 2, 1.6, D - 0.11, [0.82, 0.8, 0.78]);

  // Shop floors, dark plank ceilings, and lit stock walls deep in the bays.
  addBox("wood", W - 0.5, 0.06, 3.4, W / 2, 0.46, 1.9, [0.55, 0.48, 0.42]);
  addBox("wood", 2.4, 0.05, D - 3.5, W - 1.35, 0.455, 3.4 + (D - 3.5) / 2, [0.5, 0.44, 0.38]);
  addBox("wood", W, 0.04, 3.3, W / 2, 2.585, 1.65, [0.3, 0.25, 0.22]);
  addBox("wood", 2.5, 0.04, D - 3.3, W - 1.35, 2.57, 3.3 + (D - 3.3) / 2, [0.3, 0.25, 0.22]);
  plane("shop", 7.55, 2.1, 4.08, 1.55, 3.3, Math.PI);
  plane("shop", D - 2.2, 2.1, W - 2.5, 1.55, 2.0 + (D - 2.2) / 2, Math.PI / 2);
  for (const z of [5.2, 8.4, 11.6]) addBox("wood", 1.6, 2.0, 0.05, W - 1.7, 1.5, z, [0.25, 0.21, 0.19]);

  function post(x, z, h, alongZ) {
    addBox("wood", 0.26, 0.1, 0.26, x, 0.5, z, [0.6, 0.52, 0.46]);
    addBox("wood", 0.17, h, 0.17, x, 0.55 + h / 2, z, [0.78, 0.7, 0.64]);
    addBox("wood", 0.22, 0.07, 0.22, x, 0.55 + h * 0.32, z, [0.55, 0.46, 0.4]);
    addBox("wood", 0.21, 0.24, 0.21, x, 0.55 + h * 0.7, z, [0.6, 0.5, 0.42]);
    addBox("wood", 0.22, 0.06, 0.22, x, 0.55 + h - 0.02, z, [0.6, 0.52, 0.46]);
    addBox("wood", alongZ ? 0.2 : 0.62, 0.12, alongZ ? 0.62 : 0.2, x, 0.55 + h + 0.08, z, [0.7, 0.6, 0.52]);
  }

  // Northeast corner post is the carved one in both stills, with three treads and a raised bay.
  post(0.42, 0.16, 2.05);
  addBox("brick", 1.05, 0.14, 0.32, 0.7, 0.07, -0.28, [0.9, 0.84, 0.8]);
  addBox("brick", 0.92, 0.14, 0.28, 0.72, 0.21, -0.08, [0.94, 0.88, 0.82]);
  addBox("brick", 0.8, 0.12, 0.24, 0.74, 0.34, 0.1, [1, 0.94, 0.88]);
  addBox("wood", 1.7, 0.16, 1.35, 1.15, 0.52, 0.95, [0.62, 0.5, 0.42]);
  addBox("goods", 0.7, 0.14, 0.48, 1.2, 0.68, 0.85, [0.72, 0.38, 0.48]);
  addBox("goods", 0.42, 0.16, 0.32, 0.85, 0.68, 1.25, [0.32, 0.4, 0.58]);
  addBox("goods", 0.36, 0.28, 0.3, 1.55, 0.74, 1.35, [0.55, 0.44, 0.3]);
  addBox("wood", 0.08, 1.7, 1.5, 0.12, 1.4, 1.1, [0.7, 0.6, 0.52]);

  const eastPosts = [2.35, 4.45, 6.55, 8.55, 10.05];
  for (const x of eastPosts) post(x, 0.14, 2.0);
  addBox("wood", W, 0.16, 0.18, W / 2, 2.64, 0.06, [0.62, 0.52, 0.46]);

  // South colonnade, the face the square photo looks at: eight bays and a plank-walled corner bay.
  const southZ = [2.0, 3.6, 5.2, 6.8, 8.4, 10.0, 11.6, 13.2];
  for (const z of southZ) post(W - 0.16, z, 2.0, true);
  addBox("wood", 0.18, 0.16, D, W - 0.12, 2.64, D / 2, [0.62, 0.52, 0.46]);
  for (let z = 0.36; z < 1.95; z += 0.2) {
    addBox("wood", 0.05, 2.02, 0.19, W - 0.3 + hash(z, 1, 1) * 0.02, 1.52, z, [0.5 + hash(z, 2, 2) * 0.25, 0.42 + hash(z, 2, 2) * 0.2, 0.36 + hash(z, 2, 2) * 0.16]);
  }
  addBox("wood", 0.04, 0.1, 1.7, W - 0.26, 0.95, 1.12, [0.42, 0.34, 0.3]);
  addBox("wood", 0.04, 0.1, 1.7, W - 0.26, 2.15, 1.12, [0.42, 0.34, 0.3]);
  addBox("dark", 0.04, 0.16, 0.05, W - 0.24, 1.45, 1.0, [1.6, 1.6, 1.6]);
  add("goods", place(new THREE.CylinderGeometry(0.15, 0.12, 0.26, 10), W + 0.3, 0.13, 1.1), [0.08, 0.42, 0.12]);

  // Garments hang from two rails at staggered depths; sachet strips between them.
  addBox("dark", 0.03, 0.03, 9.6, W - 0.42, 2.4, 8.3, [2, 2, 2]);
  addBox("dark", 0.03, 0.03, 9.6, W - 1.05, 2.42, 8.3, [2, 2, 2]);
  let n = 0;
  for (let z = 5.35; z < 13.0; z += 0.36) {
    n++;
    if (hash(z, 4, 4) > 0.35) garment(W - 1.05, 1.96, z, Math.PI / 2 + (hash(z, 1, 7) - 0.5) * 0.5, (n * 3) % 8);
    if (n % 2 && hash(z, 5, 5) > 0.3) garment(W - 0.42 - hash(z, 3, 3) * 0.08, 1.98, z + 0.1, Math.PI / 2 + (hash(z, 2, 9) - 0.5) * 0.4, (n * 5 + 1) % 8);
  }
  for (const z of [4.4, 7.6, 7.85]) plane("sachet", 0.24, 1.1, W - 0.36, 1.8, z, Math.PI / 2);

  // Low counters with folded cloth piles, a blue tarp bundle and white sacks.
  for (const z of [4.4, 6.0, 9.2, 10.8, 12.4]) {
    addBox("wood", 0.9, 0.3, 1.2, W - 1.0, 0.63, z, [0.5, 0.42, 0.36]);
    for (let k = 0; k < 4; k++) {
      const ink = GARMENT_INKS[(k + Math.round(z)) % 8];
      const rgb = [1, 3, 5].map((o) => Math.pow(parseInt(ink.substr(o, 2), 16) / 255, 2.2));
      addBox("goods", 0.32, 0.05 + k * 0.012, 0.26, W - 1.05 + (k % 2) * 0.1, 0.81 + k * 0.055, z - 0.3 + (k % 3) * 0.2, rgb);
    }
  }
  add("goods", place(new THREE.SphereGeometry(0.4, 10, 7).scale(1.2, 0.55, 1), W - 1.1, 0.75, 10.0), [0.04, 0.16, 0.5]);
  add("goods", place(new THREE.SphereGeometry(0.3, 9, 6).scale(1, 0.7, 1), W - 1.6, 0.68, 9.4), [0.8, 0.78, 0.74]);
  // Bundles spill onto the plinth edge, as in the photo.
  add("goods", place(new THREE.SphereGeometry(0.32, 10, 7).scale(1.3, 0.5, 0.9), W - 0.45, 0.62, 10.6), [0.05, 0.2, 0.58]);
  add("goods", place(new THREE.SphereGeometry(0.22, 9, 6).scale(1, 0.75, 1), W - 0.5, 0.62, 12.2), [0.78, 0.76, 0.72]);
  add("goods", place(new THREE.SphereGeometry(0.2, 9, 6).scale(1.2, 0.6, 1), W - 0.5, 0.6, 6.1), [0.42, 0.05, 0.06]);
  add("goods", place(new THREE.SphereGeometry(0.26, 9, 6).scale(1, 0.8, 1), W - 1.75, 0.68, 6.6), [0.75, 0.72, 0.68]);

  // East front cloths become cut-out garments; shelves stay.
  const hangs = [
    [2.7, 0.28], [3.05, 0.34], [3.45, 0.26], [3.85, 0.32],
    [4.7, 0.3], [5.1, 0.36], [5.5, 0.28], [6.3, 0.32],
    [7.1, 0.26], [7.5, 0.34], [8.2, 0.3], [8.7, 0.28],
  ];
  hangs.forEach((h, i) => garment(h[0], 1.96, h[1], Math.PI + (hash(i, 3, 1) - 0.5) * 0.4, (i * 3 + 2) % 8));
  function shelf(x, z, tint) {
    addBox("wood", 1.05, 0.04, 0.28, x, 1.12, z, [0.65, 0.56, 0.48]);
    for (let i = 0; i < 4; i++) {
      addBox("goods", 0.14, 0.1 + hash(i, x, z) * 0.12, 0.12, x - 0.36 + i * 0.24, 1.24, z, tint);
    }
  }
  shelf(3.4, 1.55, [0.5, 0.28, 0.2]);
  shelf(5.6, 1.4, [0.72, 0.26, 0.2]);
  shelf(8.6, 1.4, [0.35, 0.28, 0.22]);
  addBox("goods", 0.42, 0.28, 0.32, 4.2, 0.68, 0.9, [0.84, 0.7, 0.16]);
  addBox("goods", 0.36, 0.24, 0.28, 6.4, 0.66, 1.0, [0.55, 0.36, 0.18]);
  addBox("goods", 0.28, 0.26, 0.28, 0.55, 0.18, -0.55, [0.22, 0.48, 0.24]);

  // Marigold festoons with tails: along the east plate and over the two south corner bays.
  const gold = [1, 0.62, 0.16];
  for (let x = 0.6; x < 7.0; x += 1.6) {
    festoon("garland", [x, 2.52, -0.06], [x + 1.6, 2.52, -0.06], 0.32, 0.045, gold);
    festoon("garland", [x + 1.6, 2.52, -0.06], [x + 1.6, 2.1, -0.07], 0.01, 0.04, gold);
  }
  for (const [z0, z1] of [[0.2, 1.1], [1.1, 2.0], [2.0, 2.8], [2.8, 3.6]]) {
    festoon("garland", [W + 0.03, 2.52, z0], [W + 0.03, 2.52, z1], 0.3, 0.045, gold);
    festoon("garland", [W + 0.04, 2.52, z1], [W + 0.04, 2.15, z1], 0.01, 0.04, gold);
  }

  // Lower hipped tile skirt round the whole sattal, with rafter ends under the eaves.
  skirt([-0.2, W + 0.6, -0.6, D + 0.25], [1.6, 6.8, 2.2, 11.4], 2.62, 4.3, 0.09, [0.62, 0.52, 0.48]);
  beam("wood", [W + 0.6, 2.58, -0.6], [W + 0.6, 2.58, D + 0.25], 0.06, 0.1, [0.4, 0.33, 0.28]);
  beam("wood", [-0.2, 2.58, -0.6], [W + 0.6, 2.58, -0.6], 0.06, 0.1, [0.4, 0.33, 0.28]);
  for (let z = 0.1; z < D; z += 0.45) beam("wood", [W + 0.58, 2.55, z], [W - 0.2, 2.86, z], 0.07, 0.07, [0.45, 0.36, 0.3]);
  for (let x = 0.2; x < W; x += 0.45) beam("wood", [x, 2.55, -0.58], [x, 2.86, 0.2], 0.07, 0.07, [0.45, 0.36, 0.3]);

  // First storey: pale plaster between carved pilasters, struts up to the gallery, latticed windows.
  const fx = 6.8;
  plane("plaster", 9.2, 2.5, fx, 5.5, 6.8, Math.PI / 2);
  plane("plaster", 5.2, 2.5, 4.2, 5.5, 2.2, Math.PI);
  plane("plaster", 5.2, 2.5, 4.2, 5.5, 11.4, 0);
  plane("plaster", 9.2, 2.5, 1.6, 5.5, 6.8, -Math.PI / 2);
  addBox("wood", 0.14, 0.18, 9.3, fx + 0.04, 4.34, 6.8, [0.5, 0.42, 0.36]);
  for (const z of [2.25, 4.5, 6.8, 9.1, 11.35]) {
    addBox("wood", 0.1, 2.5, 0.24, fx + 0.05, 5.5, z, [0.5, 0.4, 0.34]);
    beam("wood", [fx + 0.1, 5.05, z], [7.55, 6.72, z], 0.15, 0.1, [0.6, 0.48, 0.4]);
    beam("wood", [fx + 0.3, 5.6, z], [fx + 0.6, 6.3, z], 0.22, 0.14, [0.7, 0.56, 0.46]);
  }
  for (const [z, w, h, y] of [[5.65, 1.35, 0.95, 5.45], [7.95, 1.35, 0.95, 5.45], [3.38, 1.0, 0.72, 5.5], [10.22, 1.0, 0.72, 5.5]]) {
    plane("dark", w, h, fx + 0.01, y, z, Math.PI / 2);
    plane("lattice", w, h, fx + 0.06, y, z, Math.PI / 2, [1, 1, 1], w > 1.1 ? 2 : 1);
    addBox("wood", 0.1, 0.1, w + 0.5, fx + 0.07, y + h / 2 + 0.05, z, [0.6, 0.48, 0.4]);
    addBox("wood", 0.12, 0.08, w + 0.4, fx + 0.08, y - h / 2 - 0.04, z, [0.55, 0.44, 0.38]);
    addBox("wood", 0.1, h, 0.08, fx + 0.07, y, z - w / 2, [0.55, 0.44, 0.38]);
    addBox("wood", 0.1, h, 0.08, fx + 0.07, y, z + w / 2, [0.55, 0.44, 0.38]);
  }
  addBox("lamp", 0.12, 0.16, 0.26, fx + 0.1, 6.35, 7.0);
  addBox("lamp", 0.12, 0.16, 0.26, fx + 0.1, 6.3, 3.4);

  // Floor plate, dentil course and the carved gallery storey.
  addBox("wood", 5.4, 0.14, 9.4, 4.2, 6.82, 6.8, [0.5, 0.42, 0.36]);
  addBox("wood", 1.1, 0.14, 10.4, 7.1, 6.82, 6.8, [0.5, 0.42, 0.36]);
  for (let z = 1.7; z < 11.95; z += 0.18) addBox("wood", 0.08, 0.1, 0.08, 7.62, 6.7, z, [0.45, 0.36, 0.3]);
  addBox("wood", 0.08, 1.9, 9.2, 6.55, 7.84, 6.8, [0.32, 0.27, 0.24]);
  addBox("wood", 4.85, 1.9, 0.08, 4.12, 7.84, 2.2, [0.5, 0.42, 0.36]);
  addBox("wood", 4.85, 1.9, 0.08, 4.12, 7.84, 11.4, [0.5, 0.42, 0.36]);
  addBox("wood", 0.08, 1.9, 9.2, 1.7, 7.84, 6.8, [0.5, 0.42, 0.36]);
  plane("rail", 10.4, 0.95, 7.58, 7.37, 6.8, Math.PI / 2, [1, 1, 1], 10.4);
  plane("rail", 1.05, 0.95, 7.08, 7.37, 1.62, Math.PI, [1, 1, 1], 1);
  plane("rail", 1.05, 0.95, 7.08, 7.37, 11.98, 0, [1, 1, 1], 1);
  addBox("wood", 0.1, 0.08, 10.45, 7.58, 7.87, 6.8, [0.55, 0.44, 0.38]);
  for (let z = 1.65; z < 12.0; z += 0.98) addBox("wood", 0.1, 0.95, 0.1, 7.56, 8.33, z, [0.5, 0.4, 0.34]);
  addBox("wood", 0.12, 0.12, 10.45, 7.58, 8.86, 6.8, [0.5, 0.42, 0.36]);
  addBox("solar", 0.72, 0.04, 0.46, 7.8, 8.08, 8.4, [0.7, 0.8, 1], 0, 0, -0.6);
  addBox("lamp", 0.76, 0.02, 0.5, 7.79, 8.065, 8.4, [0.6, 0.6, 0.6], 0, 0, -0.6);

  // Top hipped roof with a maroon fringe under its eaves.
  skirt([0.9, 8.35, 0.95, 12.65], [3.7, 4.8, 5.0, 8.6], 8.95, 10.25, 0.05, [0.6, 0.5, 0.46]);
  addBox("tile", 1.1, 0.08, 3.6, 4.25, 10.27, 6.8, [0.85, 0.8, 0.76]);
  for (let z = 1.1; z < 12.6; z += 0.45) beam("wood", [8.33, 8.9, z], [7.5, 9.2, z], 0.06, 0.06, [0.42, 0.34, 0.28]);
  plane("fringe", 11.7, 0.32, 8.37, 8.78, 6.8, Math.PI / 2, [1, 1, 1], 9.8);
  plane("fringe", 7.45, 0.32, 4.62, 8.78, 0.93, Math.PI, [1, 1, 1], 6.2);
  plane("fringe", 7.45, 0.32, 4.62, 8.78, 12.67, 0, [1, 1, 1], 6.2);

  // One wire across the east front, sagging. No lamps.
  festoon("dark", [0.3, 3.4, -0.2], [9.8, 3.4, -0.2], 0.35, 0.008, [1, 1, 1]);

  let tris = 0;
  for (const [name, list] of Object.entries(buckets)) {
    const geom = mergeGeometries(list);
    list.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(geom, mats[name]);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
    tris += geom.index.count / 3;
  }
  root.userData.triangles = tris;
  return root;
}
