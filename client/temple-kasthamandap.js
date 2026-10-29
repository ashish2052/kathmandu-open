// Kasthamandap (Maru Satta) as rebuilt 2018-2021. Built from post-2021 Wikimedia Commons photos
// (research/kasthamandap-ref) and the reconstruction committee's figures: 18.70 x 18.73 m base, 16.3 m to the
// top roof, porch on the east side. See research/kasthamandap-report.md.
// The OSM outline (21.44 x 21.75 m) is the drip line of the lowest roof; every storey is an inset of it.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { basis } from "./heroes.js";

export const KASTHA_ID = 183558418;

// Insets are metres in from the OSM outline, heights metres above the street.
const PLINTH = [{ i: 1.4, y: 0.36 }, { i: 1.75, y: 0.72 }];
const BRICK_TILE = 0.8;
const POST_I = 2.4, CORE_I = 2.65, HALL_I = 5.0, POST_TOP = 5.9, PORCH = 2.2;
const BALC = { half: 5.2, out: 1.85, floor: 3.4, top: 4.4 };
const ROOF1 = { i0: 0, i1: 6.15, y0: 5.6, y1: 8.6, lift: 0.45, tile: 1.5 };
const WALL2 = { i: 6.15, y0: 8.45, y1: 10.0 };
const BALC2 = { out: 5.2, floor: 10.25, top: 11.15 };
const ROOF2 = { i0: 4.0, i1: 7.85, y0: 11.7, y1: 13.9, lift: 0.38, tile: 1.4 };
const WALL3 = { i: 8.15, y0: 13.75 };
const ROOF3 = { i0: 7.35, i1: 10.45, y0: 14.9, y1: 16.4, lift: 0.3, tile: 1.3 };
const roofY = (R, i) => {
  const t = (i - R.i0) / (R.i1 - R.i0);
  return R.y0 + (R.y1 - R.y0) * t * (0.8 + 0.2 * t);
};

const TL = new THREE.TextureLoader();
function tex(file, srgb, rot) {
  const t = TL.load(new URL("../assets/tex/" + file, import.meta.url).href);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (rot) t.rotation = Math.PI / 2;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function pbr(name, o = {}) {
  const arm = tex(name + "_arm.jpg", false, o.rot);
  const m = new THREE.MeshStandardMaterial({
    map: tex(name + "_Diffuse.jpg", true, o.rot),
    normalMap: tex(name + "_nor_gl.jpg", false, o.rot),
    roughnessMap: arm,
    aoMap: arm,
    roughness: 1,
    metalness: 0,
    color: o.tint ?? 0xffffff,
    side: o.side ?? THREE.FrontSide,
  });
  m.normalScale.set(o.n ?? 1, o.n ?? 1);
  return m;
}
function canvasTex(w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}
// Pleated red cloth with a gold band and a scalloped gold hem, as hung on every eave since 2021.
function valanceTex() {
  return canvasTex(256, 128, (g) => {
    const wave = (x) => 100 + 7 * Math.cos((x / 32) * Math.PI * 2);
    g.clearRect(0, 0, 256, 128);
    g.save();
    g.beginPath();
    g.moveTo(0, 4);
    g.lineTo(256, 4);
    for (let x = 256; x >= 0; x -= 4) g.lineTo(x, wave(x));
    g.closePath();
    g.clip();
    for (let x = 0; x < 256; x += 2) {
      const k = 0.62 + 0.38 * Math.abs(Math.sin((x / 16) * Math.PI));
      g.fillStyle = `rgb(${(196 * k) | 0},${(20 * k) | 0},${(26 * k) | 0})`;
      g.fillRect(x, 0, 2, 128);
    }
    g.restore();
    g.fillStyle = "#d8a63c";
    g.fillRect(0, 4, 256, 8);
    g.strokeStyle = "#e9be56";
    g.lineWidth = 3;
    g.beginPath();
    for (let x = 0; x <= 256; x += 4) (x ? g.lineTo : g.moveTo).call(g, x, wave(x) - 1.5);
    g.stroke();
  });
}
// Diagonal timber lattice (tikijhya); white bars, transparent gaps.
function latticeTex() {
  return canvasTex(128, 128, (g) => {
    g.clearRect(0, 0, 128, 128);
    g.strokeStyle = "#fff";
    g.lineWidth = 5;
    for (let k = -128; k <= 256; k += 16) {
      g.beginPath();
      g.moveTo(k, 0);
      g.lineTo(k + 128, 128);
      g.stroke();
      g.beginPath();
      g.moveTo(k, 128);
      g.lineTo(k + 128, 0);
      g.stroke();
    }
  });
}

// Box whose UVs are in metres / tile so a texture keeps one scale on every face.
function mbox(w, h, d, tile = 1.4) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v;
      uv.setXY(i, (uv.getX(i) * dims[f][0]) / tile, (uv.getY(i) * dims[f][1]) / tile);
    }
  }
  return g;
}
function lathe(profile, seg = 16) {
  return new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), seg);
}
// Carved strut (tunala) silhouette, y 0..1 along the strut, x in metres.
function strutShape() {
  const prof = [[0, 0.07], [0.1, 0.12], [0.2, 0.07], [0.32, 0.15], [0.45, 0.09], [0.58, 0.16], [0.7, 0.08], [0.84, 0.12], [1, 0.06]];
  const sh = new THREE.Shape();
  sh.moveTo(-prof[0][1], 0);
  for (const [y, w] of prof) sh.lineTo(w, y);
  for (let i = prof.length - 1; i >= 0; i--) sh.lineTo(-prof[i][1], prof[i][0]);
  return sh;
}
// Saddle bracket (meth) on a post head, x along the beam.
function bracketShape() {
  const sh = new THREE.Shape();
  sh.moveTo(-0.62, 0);
  sh.lineTo(0.62, 0);
  sh.lineTo(0.62, -0.07);
  sh.quadraticCurveTo(0.5, -0.08, 0.44, -0.15);
  sh.quadraticCurveTo(0.36, -0.24, 0.2, -0.22);
  sh.lineTo(0.17, -0.3);
  sh.lineTo(-0.17, -0.3);
  sh.lineTo(-0.2, -0.22);
  sh.quadraticCurveTo(-0.36, -0.24, -0.44, -0.15);
  sh.quadraticCurveTo(-0.5, -0.08, -0.62, -0.07);
  sh.closePath();
  return sh;
}
function ribbon(loop, drop, y0, uvScale) {
  const pos = [];
  const uvs = [];
  const idx = [];
  let run = 0;
  for (let i = 0; i <= loop.length; i++) {
    const p = loop[i % loop.length];
    if (i > 0) run += p.distanceTo(loop[(i - 1) % loop.length]);
    pos.push(p.x, p.y + y0, p.z, p.x, p.y + y0 - drop, p.z);
    uvs.push(run * uvScale, 1, run * uvScale, 0);
  }
  for (let i = 0; i < loop.length; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function installKasthamandap(scene, data, buildings, holds) {
  const src = data.buildings.find((b) => b.id === KASTHA_ID && b.name === "Kasthamandap");
  const b = buildings.find((x) => x.id === KASTHA_ID);
  if (!src || !b) throw new Error("Kasthamandap footprint missing");
  const f = basis(src.poly);
  // Square plan: turn by quarters until local +Z (the porch) points east.
  let q = 0;
  for (let k = 1; k < 4; k++) if (Math.sin(f.yaw + k * Math.PI / 2) > Math.sin(f.yaw + q * Math.PI / 2)) q = k;
  const yaw = f.yaw + q * Math.PI / 2;
  const HX = (q % 2 ? f.w : f.d) / 2;
  const HZ = (q % 2 ? f.d : f.w) / 2;
  const ca = Math.cos(yaw);
  const sa = Math.sin(yaw);
  // The surveyed quad is a few cm off a true rectangle: a bilinear warp puts each eave corner on its OSM vertex.
  const osmLocal = src.poly.map(([x, z]) => [(x - f.x) * ca - (z - f.z) * sa, (x - f.x) * sa + (z - f.z) * ca]);
  const C = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => osmLocal.reduce((a, p) => (Math.hypot(p[0] - sx * HX, p[1] - sz * HZ) < Math.hypot(a[0] - sx * HX, a[1] - sz * HZ) ? p : a)));
  const warp = (lx, lz) => {
    const u = (lx + HX) / (2 * HX);
    const v = (lz + HZ) / (2 * HZ);
    const w = [(1 - u) * (1 - v), u * (1 - v), u * v, (1 - u) * v];
    return [w[0] * C[0][0] + w[1] * C[1][0] + w[2] * C[2][0] + w[3] * C[3][0], w[0] * C[0][1] + w[1] * C[1][1] + w[2] * C[2][1] + w[3] * C[3][1]];
  };
  const W = (lx0, lz0) => {
    const [lx, lz] = warp(lx0, lz0);
    return [+(f.x + lx * ca + lz * sa).toFixed(3), +(f.z - lx * sa + lz * ca).toFixed(3)];
  };
  // Face k: 0 = east (porch), 1, 2, 3 by quarter turns. Face frame: x along the face, z outward.
  const D = (k, i) => (k % 2 ? HX : HZ) - i;
  const L = (k, i) => (k % 2 ? HZ : HX) - i;
  const FL = (k, s, d) => {
    const th = (k * Math.PI) / 2;
    return [s * Math.cos(th) + d * Math.sin(th), -s * Math.sin(th) + d * Math.cos(th)];
  };
  const faceRot = [0, 1, 2, 3].map((k) => new THREE.Matrix4().makeRotationY((k * Math.PI) / 2));
  const at = (k, s, y, d, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Matrix4().makeTranslation(s, y, d);
    if (rx || ry || rz) m.multiply(new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(rx, ry, rz, "YXZ")));
    return k === null ? m : faceRot[k].clone().multiply(m);
  };
  const rectL = (i) => [[-(HX - i), -(HZ - i)], [HX - i, -(HZ - i)], [HX - i, HZ - i], [-(HX - i), HZ - i]];
  const rect = (i) => rectL(i).map(([x, z]) => W(x, z));
  const fpoly = (k, s0, s1, d0, d1) => [[s0, d0], [s1, d0], [s1, d1], [s0, d1]].map(([s, d]) => W(...FL(k, s, d)));

  const brick = pbr("red_brick", { tint: 0xf4d2bc, n: 1.1 });
  const brickIn = pbr("red_brick", { tint: 0x8c6f60, n: 1.1 });
  const woodV = pbr("dark_wood", { tint: 0x8a6a58, n: 0.8, rot: true });
  const woodH = pbr("dark_wood", { tint: 0x8a6a58, n: 0.8 });
  const woodDark = pbr("dark_wood", { tint: 0x5a4234, n: 0.8, rot: true });
  const boards = pbr("weathered_brown_planks", { tint: 0x7a6250 });
  const under = pbr("weathered_brown_planks", { tint: 0x5e4a3c, side: THREE.BackSide });
  const tile = pbr("clay_roof_tiles_02", { tint: 0xe3a27e, n: 1.2 });
  const ridge = pbr("clay_roof_tiles_02", { tint: 0x9c5a42, n: 1 });
  const stone = pbr("stone_tiles_02", { tint: 0xd2cabc, n: 0.6 });
  const carvedStone = pbr("plastered_wall", { tint: 0x8f8b82, n: 0.35 });
  const fence = pbr("weathered_brown_planks", { tint: 0xc8b4a0, rot: true });
  const gold = new THREE.MeshStandardMaterial({ color: 0xe2b44a, metalness: 1, roughness: 0.26 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0xb58a3c, metalness: 0.9, roughness: 0.38 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x17110d, roughness: 1 });
  const valMat = new THREE.MeshStandardMaterial({ map: valanceTex(), alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85 });
  const latTex = latticeTex();
  const lattice = new THREE.MeshStandardMaterial({ map: latTex, color: 0x4a3426, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });

  const bag = new Map();
  const add = (mat, geo, m) => {
    const g = geo.index ? geo.toNonIndexed() : geo.clone();
    if (m) g.applyMatrix4(m);
    for (const key of Object.keys(g.attributes)) if (key !== "position" && key !== "normal" && key !== "uv") g.deleteAttribute(key);
    if (!bag.has(mat)) bag.set(mat, []);
    bag.get(mat).push(g);
  };
  const fbox = (k, mat, w, h, dep, s, y, d, tile = 1.2) => add(mat, mbox(w, h, dep, tile), at(k, s, y, d));
  const lbox = (mat, w, h, dep, x, y, z, tile = 1.2) => add(mat, mbox(w, h, dep, tile), at(null, x, y, z));
  // Lattice window with frame, extended sill and lintel, and a dark interior behind it.
  const windowAt = (k, d, s, y, w, h) => {
    const lp = new THREE.PlaneGeometry(w, h);
    const uv = lp.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 0.32, (uv.getY(i) * h) / 0.32);
    add(lattice, lp, at(k, s, y, d + 0.05));
    fbox(k, dark, w, h, 0.02, s, y, d + 0.015);
    for (const sx of [-1, 1]) fbox(k, woodDark, 0.11, h + 0.22, 0.15, s + sx * (w / 2 + 0.055), y, d + 0.07);
    fbox(k, woodH, w + 0.55, 0.12, 0.18, s, y + h / 2 + 0.09, d + 0.09);
    fbox(k, woodH, w + 0.45, 0.1, 0.18, s, y - h / 2 - 0.08, d + 0.09);
  };

  // ---- plinth: brick tiers with stone coping, porch stair on the east
  for (const p of PLINTH) {
    const y0 = p === PLINTH[0] ? 0 : PLINTH[0].y;
    lbox(brick, 2 * (HX - p.i), p.y - y0 - 0.06, 2 * (HZ - p.i), 0, (y0 + p.y - 0.06) / 2, 0, BRICK_TILE);
    lbox(stone, 2 * (HX - p.i) + 0.05, 0.06, 2 * (HZ - p.i) + 0.05, 0, p.y - 0.03, 0, 1.6);
  }
  const stair = [];
  for (let j = 0; j < 3; j++) {
    const yTop = 0.24 * (j + 1);
    const front = 0.35 + 0.35 * j;
    const back = 1.85;
    fbox(0, stone, 2 * PORCH, yTop, back - front, 0, yTop / 2, (D(0, front) + D(0, back)) / 2, 1.6);
    stair.push({ poly: fpoly(0, -PORCH, PORCH, D(0, back), D(0, front)), y: yTop });
  }

  // ---- stone lions guarding the porch stair
  const lion = (m) => {
    const ell = (x, y, z, a, bb, c, rx = 0) => {
      const g = new THREE.SphereGeometry(1, 14, 10);
      g.scale(a, bb, c);
      add(carvedStone, g, m.clone().multiply(at(null, x, y, z, rx)));
    };
    const limb = (a, c, r) => {
      const av = new THREE.Vector3(...a);
      const cv = new THREE.Vector3(...c);
      const g = new THREE.CylinderGeometry(r * 0.85, r, av.distanceTo(cv), 10);
      const mm = new THREE.Matrix4().compose(av.clone().add(cv).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cv.clone().sub(av).normalize()), new THREE.Vector3(1, 1, 1));
      add(carvedStone, g, m.clone().multiply(mm));
    };
    ell(0, 0.3, -0.12, 0.27, 0.26, 0.34);
    ell(0, 0.62, 0.04, 0.23, 0.36, 0.22, -0.25);
    for (const sx of [-1, 1]) {
      limb([sx * 0.12, 0.52, 0.16], [sx * 0.12, 0.06, 0.24], 0.065);
      ell(sx * 0.12, 0.05, 0.28, 0.075, 0.05, 0.1);
      ell(sx * 0.17, 0.18, -0.02, 0.1, 0.16, 0.2);
    }
    // mane in curled tiers, a squarish snarling head pushed forward
    ell(0, 0.92, 0.06, 0.25, 0.26, 0.2);
    for (let a = 0; a < 14; a++) {
      const th = (a / 14) * Math.PI * 2;
      ell(Math.cos(th) * 0.22, 0.95 + Math.sin(th) * 0.23, 0.1, 0.055, 0.06, 0.05);
    }
    ell(0, 0.96, 0.2, 0.14, 0.13, 0.13);
    ell(0, 0.92, 0.34, 0.1, 0.075, 0.08);
    ell(0, 0.86, 0.36, 0.085, 0.03, 0.06);
    ell(0, 1.02, 0.31, 0.11, 0.03, 0.05);
    for (const sx of [-1, 1]) {
      ell(sx * 0.055, 1.0, 0.33, 0.026, 0.02, 0.018);
      ell(sx * 0.1, 1.09, 0.16, 0.04, 0.05, 0.025);
      ell(sx * 0.06, 0.9, 0.4, 0.015, 0.035, 0.015);
    }
    const tail = new THREE.TorusGeometry(0.16, 0.035, 6, 12, Math.PI * 1.3);
    add(carvedStone, tail, m.clone().multiply(at(null, 0, 0.45, -0.42, 0, Math.PI / 2, 0)));
  };
  const lionSpots = [];
  for (const sx of [-1, 1]) {
    const s = sx * 2.75;
    const d = D(0, 0.65);
    fbox(0, stone, 0.75, 0.55, 1.0, s, 0.275, d, 1.6);
    lion(at(0, s, 0.55, d - 0.05, 0, -sx * 0.18, 0));
    lionSpots.push(fpoly(0, s - 0.375, s + 0.375, d - 0.5, d + 0.5));
  }

  // ---- ground floor: carved post colonnade, brick infill under the galleries, open hall behind
  const bShape = bracketShape();
  const bracketGeo = new THREE.ExtrudeGeometry(bShape, { depth: 0.24, bevelEnabled: false });
  bracketGeo.translate(0, 0, -0.12);
  const postSpots = [];
  for (let k = 0; k < 4; k++) {
    const len = L(k, POST_I);
    const n = Math.round((2 * len) / 1.5);
    const d = D(k, POST_I);
    for (let j = 0; j <= n; j++) {
      const s = -len + (j * 2 * len) / n;
      postSpots.push({ k, s, corner: j === 0 || j === n });
      if (k % 2 && (j === 0 || j === n)) continue;
      const y0 = PLINTH[1].y;
      fbox(k, stone, 0.44, 0.2, 0.44, s, y0 + 0.1, d, 1.6);
      fbox(k, woodV, 0.26, POST_TOP - y0 - 0.2, 0.26, s, (y0 + 0.2 + POST_TOP) / 2, d, 1.6);
      for (const yb of [y0 + 1.15, 2.95, POST_TOP - 0.85]) fbox(k, woodH, 0.32, 0.16, 0.32, s, yb, d, 0.8);
      fbox(k, woodH, 0.34, 0.2, 0.34, s, POST_TOP - 0.38, d, 0.8);
      add(woodH, bracketGeo, at(k, s, POST_TOP, d));
    }
    // eave beam and wall plate on the post heads
    const span = 2 * len + (k % 2 ? -0.3 : 0.3);
    fbox(k, woodH, span, 0.3, 0.28, 0, POST_TOP + 0.15, d, 1.6);
    fbox(k, woodH, span + 0.2, 0.26, 0.24, 0, POST_TOP + 0.43, d + 0.08, 1.6);
    // infill walls under the gallery (the east one is split by the porch)
    const segs = k === 0 ? [[-BALC.half, -PORCH], [PORCH, BALC.half]] : [[-BALC.half, BALC.half]];
    const dw = D(k, CORE_I - 0.1);
    for (const [s0, s1] of segs) fbox(k, brick, s1 - s0, BALC.floor - 0.25 - PLINTH[1].y, 0.3, (s0 + s1) / 2, (PLINTH[1].y + BALC.floor - 0.25) / 2, dw - 0.15, BRICK_TILE);
    if (k === 0) {
      for (const sx of [-1, 1]) windowAt(k, dw, sx * 3.7, 1.95, 0.95, 1.05);
    } else {
      for (const sx of [-1, 1]) windowAt(k, dw, sx * 3.0, 1.95, 0.95, 1.05);
      fbox(k, woodDark, 1.1, 2.1, 0.06, 0, PLINTH[1].y + 1.05, dw + 0.03);
      for (const sx of [-1, 1]) fbox(k, woodV, 0.16, 2.35, 0.2, sx * 0.63, PLINTH[1].y + 1.17, dw + 0.08);
      fbox(k, woodH, 2.1, 0.18, 0.24, 0, PLINTH[1].y + 2.42, dw + 0.1);
    }
    // the open hall: inner post row, brick back wall, first-floor ceiling
    const lenIn = L(k, 3.8);
    const ni = Math.round((2 * lenIn) / 1.8);
    for (let j = k % 2 ? 1 : 0; j <= (k % 2 ? ni - 1 : ni); j++) {
      fbox(k, woodV, 0.24, BALC.floor - 0.2 - PLINTH[1].y, 0.24, -lenIn + (j * 2 * lenIn) / ni, (PLINTH[1].y + BALC.floor - 0.2) / 2, D(k, 3.8), 1.6);
    }
    fbox(k, brickIn, 2 * L(k, HALL_I) + (k % 2 ? -0.5 : 0.5), BALC.floor - PLINTH[1].y, 0.25, 0, (PLINTH[1].y + BALC.floor) / 2, D(k, HALL_I) - 0.125, BRICK_TILE);
    const ceilW = k % 2 ? 2 * L(k, HALL_I) : 2 * L(k, POST_I);
    fbox(k, boards, ceilW, 0.2, HALL_I - POST_I, 0, BALC.floor - 0.1, D(k, (POST_I + HALL_I) / 2), 1.5);
    if (k === 0) {
      fbox(k, dark, 2.0, 2.3, 0.04, 0, PLINTH[1].y + 1.15, D(k, HALL_I) + 0.02);
      for (const sx of [-1, 1]) fbox(k, woodV, 0.22, 2.6, 0.26, sx * 1.11, PLINTH[1].y + 1.3, D(k, HALL_I) + 0.1);
      fbox(k, woodH, 3.2, 0.24, 0.3, 0, PLINTH[1].y + 2.72, D(k, HALL_I) + 0.12);
    }
    // first floor wall on the core line, with lattice windows
    const topY = roofY(ROOF1, CORE_I) - 0.12;
    const dc = D(k, CORE_I);
    fbox(k, brick, 2 * L(k, CORE_I) + (k % 2 ? -0.5 : 0), topY - BALC.floor, 0.25, 0, (topY + BALC.floor) / 2, dc - 0.125, BRICK_TILE);
    for (const s of [-6.4, -3.2, 0, 3.2, 6.4]) if (Math.abs(s) < L(k, CORE_I) - 0.8) windowAt(k, dc, s, 4.95, 0.95, 1.0);
  }

  // ---- projecting carved gallery on every face at first-floor level
  for (let k = 0; k < 4; k++) {
    const d = D(k, BALC.out);
    const w = 2 * BALC.half;
    fbox(k, boards, w, 0.22, CORE_I - BALC.out, 0, BALC.floor - 0.11, D(k, (CORE_I + BALC.out) / 2), 1.5);
    for (let s = -BALC.half + 0.2; s <= BALC.half - 0.19; s += 0.4) fbox(k, woodH, 0.1, 0.12, 0.2, s, BALC.floor - 0.28, d + 0.04, 0.6);
    fbox(k, woodH, w + 0.1, 0.16, 0.18, 0, BALC.floor + 0.08, d - 0.09, 1.6);
    fbox(k, woodH, w + 0.2, 0.12, 0.26, 0, BALC.top - 0.06, d - 0.08, 1.6);
    fbox(k, woodDark, w, 0.2, 0.09, 0, BALC.top - 0.24, d - 0.06, 1.0);
    const lp = new THREE.PlaneGeometry(w, 0.52);
    const uv = lp.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / 0.3, (uv.getY(i) * 0.52) / 0.3);
    add(lattice, lp, at(k, 0, BALC.floor + 0.44, d - 0.1));
    // carved deity plaques on the gallery posts
    const boss = new THREE.SphereGeometry(0.075, 10, 8);
    for (let j = 0; j <= 8; j++) {
      const s = -BALC.half + (j * w) / 8;
      fbox(k, woodV, 0.16, BALC.top - BALC.floor, 0.2, s, (BALC.floor + BALC.top) / 2, d - 0.1, 0.8);
      if (j > 0 && j < 8) {
        fbox(k, woodDark, 0.34, 0.4, 0.05, s, BALC.floor + 0.45, d + 0.0, 0.5);
        add(woodH, mbox(0.24, 0.24, 0.04, 0.4), at(k, s, BALC.floor + 0.45, d + 0.035, 0, 0, Math.PI / 4));
        add(woodH, boss, at(k, s, BALC.floor + 0.47, d + 0.06));
      }
    }
    for (const sx of [-1, 1]) fbox(k, woodDark, 0.12, BALC.top - BALC.floor, CORE_I - BALC.out, sx * (BALC.half + 0.06), (BALC.floor + BALC.top) / 2, D(k, (CORE_I + BALC.out) / 2), 1.0);
  }

  // ---- roofs: tiles, board underside, fascia, red valance, ridge caps, upturned corners, rafters, bells
  const roofGeo = (R, yOff) => {
    const ns = 32;
    const nt = 10;
    const span = R.i1 - R.i0;
    const slopeLen = Math.hypot(span, R.y1 - R.y0);
    const out = [];
    for (let k = 0; k < 4; k++) {
      const pos = [];
      const uv = [];
      const idx = [];
      for (let j = 0; j <= nt; j++) {
        const t = j / nt;
        const i = R.i0 + span * t;
        for (let c = 0; c <= ns; c++) {
          const u = (c / ns) * 2 - 1;
          const x = u * L(k, i);
          const y = roofY(R, i) + R.lift * Math.pow(Math.abs(u), 4) * Math.pow(1 - t, 1.5) + yOff;
          const [lx, lz] = FL(k, x, D(k, i));
          pos.push(lx, y, lz);
          uv.push(x / R.tile, (t * slopeLen) / R.tile);
        }
      }
      for (let j = 0; j < nt; j++) {
        for (let c = 0; c < ns; c++) {
          const a = j * (ns + 1) + c;
          idx.push(a, a + 1, a + ns + 1, a + 1, a + ns + 2, a + ns + 1);
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      out.push(g);
    }
    return out;
  };
  const sGeo = new THREE.ExtrudeGeometry(strutShape(), { depth: 0.12, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 });
  sGeo.translate(0, 0, -0.06);
  const strut = (k, s, a, c) => {
    const dir = c.clone().sub(a);
    const len = dir.length();
    const g = sGeo.clone();
    g.scale(1, len, 1);
    const m = new THREE.Matrix4().compose(a, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize()), new THREE.Vector3(1, 1, 1));
    add(woodH, g, faceRot[k].clone().multiply(new THREE.Matrix4().makeTranslation(s, 0, 0)).multiply(m));
  };
  const bellGeo = lathe([[0.001, 0.26], [0.03, 0.25], [0.05, 0.2], [0.075, 0.1], [0.115, 0.015], [0.12, 0]], 12);
  const bell = (x, y, z, scale, chain) => {
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion(), new THREE.Vector3(scale, scale, scale));
    add(bronze, bellGeo, m);
    const cg = new THREE.CylinderGeometry(0.008, 0.008, chain, 4);
    add(bronze, cg, at(null, x, y + 0.26 * scale + chain / 2, z));
  };
  const roof = (R, rafterFrom, ridgeR) => {
    for (const g of roofGeo(R, 0)) add(tile, g);
    for (const g of roofGeo(R, -0.13)) add(under, g);
    const loop = [];
    for (let k = 0; k < 4; k++) {
      for (let c = 0; c < 32; c++) {
        const u = (c / 32) * 2 - 1;
        const [lx, lz] = FL(k, u * L(k, R.i0), D(k, R.i0));
        loop.push(new THREE.Vector3(lx, R.y0 + R.lift * Math.pow(Math.abs(u), 4), lz));
      }
    }
    add(woodDark, ribbon(loop, 0.24, 0.02, 0.8));
    add(valMat, ribbon(loop, 0.44, -0.16, 1.0));
    for (let k = 0; k < 4; k++) {
      // hip ridge cap and the upturned corner tip
      const pts = [];
      for (let j = 0; j <= 10; j++) {
        const t = j / 10;
        const i = R.i0 + (R.i1 - R.i0) * t;
        const [lx, lz] = FL(k, L(k, i), D(k, i));
        pts.push(new THREE.Vector3(lx, roofY(R, i) + R.lift * Math.pow(1 - t, 1.5) + 0.05, lz));
      }
      add(ridge, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, ridgeR, 6, false));
      const c0 = pts[0];
      const diag = new THREE.Vector3(c0.x, 0, c0.z).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const horn = new THREE.CatmullRomCurve3([
        c0.clone().addScaledVector(diag, -0.3),
        c0.clone().addScaledVector(diag, 0.12).addScaledVector(up, 0.05),
        c0.clone().addScaledVector(diag, 0.3).addScaledVector(up, 0.22),
        c0.clone().addScaledVector(diag, 0.34).addScaledVector(up, 0.4),
      ]);
      add(ridge, new THREE.TubeGeometry(horn, 12, ridgeR * 1.15, 8, false));
      bell(c0.x - diag.x * 0.35, R.y0 + R.lift - 0.7, c0.z - diag.z * 0.35, 1.25, 0.35);
      // rafters radiating under the eave (jack rafters stop at the hip)
      const L0 = L(k, R.i0);
      for (let s = -L0 + 0.35; s <= L0 - 0.34; s += 0.45) {
        const iStart = Math.min(rafterFrom, L(k, 0) - Math.abs(s));
        if (iStart - R.i0 < 0.25) continue;
        const pA = new THREE.Vector3(s, roofY(R, iStart) - 0.2, D(k, iStart));
        const pB = new THREE.Vector3(s, R.y0 - 0.2, D(k, R.i0) - 0.04);
        const dir = pB.clone().sub(pA);
        const g = mbox(0.08, 0.11, dir.length(), 1.0);
        const m = new THREE.Matrix4().compose(pA.clone().add(pB).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir.normalize()), new THREE.Vector3(1, 1, 1));
        add(woodH, g, faceRot[k].clone().multiply(m));
      }
    }
    return loop;
  };
  roof(ROOF1, POST_I, 0.1);
  for (let k = 0; k < 4; k++) {
    for (let s = -L(k, 0) + 3.2; s < L(k, 0) - 3; s += 3.6) {
      const [lx, lz] = FL(k, s, D(k, 0.3));
      bell(lx, ROOF1.y0 - 0.85, lz, 0.9, 0.5);
    }
  }

  // ---- second storey: brick band, joists, wooden balcony all round, timber upper wall
  lbox(brick, 2 * (HX - WALL2.i), WALL2.y1 - WALL2.y0, 2 * (HZ - WALL2.i), 0, (WALL2.y0 + WALL2.y1) / 2, 0, BRICK_TILE);
  for (let k = 0; k < 4; k++) {
    const dw = D(k, WALL2.i);
    for (const s of [-2.6, 0, 2.6]) windowAt(k, dw, s, 9.25, 0.78, 0.62);
    const lb = L(k, BALC2.out);
    for (let s = -lb + 0.2; s <= lb - 0.19; s += 0.38) fbox(k, woodH, 0.11, 0.22, 1.0, s, WALL2.y1 + 0.11, dw + 0.5, 0.8);
    const deck = k % 2 ? 2 * lb - 2 * (WALL2.i - BALC2.out) : 2 * lb;
    fbox(k, boards, deck, 0.12, WALL2.i - BALC2.out, 0, BALC2.floor - 0.06, D(k, (WALL2.i + BALC2.out) / 2), 1.5);
    const d = D(k, BALC2.out);
    const rl = 2 * lb + (k % 2 ? -0.3 : 0);
    fbox(k, woodH, rl, 0.1, 0.12, 0, BALC2.floor + 0.08, d - 0.07, 1.4);
    fbox(k, woodH, rl, 0.1, 0.17, 0, BALC2.top - 0.05, d - 0.07, 1.4);
    for (let s = -lb + 0.1; s <= lb - 0.1; s += 0.14) fbox(k, woodV, 0.045, BALC2.top - BALC2.floor - 0.2, 0.045, s, (BALC2.floor + BALC2.top) / 2, d - 0.07, 0.6);
    const eaveB = roofY(ROOF2, BALC2.out) - 0.13;
    const np = Math.round((2 * lb) / 2.2);
    for (let j = k % 2 ? 1 : 0; j <= (k % 2 ? np - 1 : np); j++) {
      fbox(k, woodV, 0.16, eaveB - BALC2.floor, 0.16, -lb + (j * 2 * lb) / np, (eaveB + BALC2.floor) / 2, d - 0.08, 1.2);
    }
    fbox(k, woodH, rl + 0.2, 0.2, 0.2, 0, eaveB - 0.1, d - 0.08, 1.4);
    const topW = roofY(ROOF2, WALL2.i) - 0.12;
    fbox(k, woodDark, 2 * L(k, WALL2.i) + (k % 2 ? -0.4 : 0), topW - BALC2.floor, 0.2, 0, (topW + BALC2.floor) / 2, dw - 0.1, 1.2);
    for (const s of [-3.4, -1.15, 1.15, 3.4]) windowAt(k, dw, s, 11.35, 1.05, 1.1);
  }
  roof(ROOF2, WALL2.i, 0.085);
  for (let k = 0; k < 4; k++) {
    const dd = (ROOF2.i1 + WALL3.i) / 2;
    fbox(k, ridge, k % 2 ? 2 * L(k, WALL3.i) : 2 * L(k, ROOF2.i1), 0.12, WALL3.i - ROOF2.i1 + 0.05, 0, ROOF2.y1 - 0.02, D(k, dd), 1.0);
  }

  // ---- third storey: open timber lantern with lattice bays, carved struts under the top roof
  const topL = roofY(ROOF3, WALL3.i) - 0.13;
  lbox(dark, 2 * (HX - WALL3.i - 0.2), topL - WALL3.y0, 2 * (HZ - WALL3.i - 0.2), 0, (topL + WALL3.y0) / 2, 0);
  for (let k = 0; k < 4; k++) {
    const len = L(k, WALL3.i);
    const d = D(k, WALL3.i);
    fbox(k, woodH, 2 * len + 0.2, 0.22, 0.22, 0, WALL3.y0 + 0.2, d, 1.2);
    fbox(k, woodH, 2 * len + 0.2, 0.2, 0.22, 0, topL - 0.1, d, 1.2);
    const bays = 3;
    for (let j = 0; j <= bays; j++) fbox(k, woodV, 0.2, topL - WALL3.y0, 0.22, -len + (j * 2 * len) / bays, (topL + WALL3.y0) / 2, d, 1.0);
    const bw = (2 * len) / bays - 0.22;
    const bh = topL - WALL3.y0 - 0.55;
    for (let j = 0; j < bays; j++) {
      const lp = new THREE.PlaneGeometry(bw, bh);
      const uv = lp.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * bw) / 0.3, (uv.getY(i) * bh) / 0.3);
      add(lattice, lp, at(k, -len + ((j + 0.5) * 2 * len) / bays, (topL + WALL3.y0) / 2 + 0.05, d + 0.04));
    }
    const eave = roofY(ROOF3, ROOF3.i0 + 0.3) - 0.2;
    for (const u of [-0.72, -0.24, 0.24, 0.72]) {
      strut(k, u * len, new THREE.Vector3(0, WALL3.y0 + 0.32, d + 0.12), new THREE.Vector3(0, eave, D(k, ROOF3.i0 + 0.3)));
    }
  }
  roof(ROOF3, WALL3.i, 0.075);
  lbox(ridge, 2 * (HX - ROOF3.i1) + 0.2, 0.2, 2 * (HZ - ROOF3.i1) + 0.2, 0, ROOF3.y1 + 0.05, 0, 1.0);

  // ---- gilded pinnacle (gajur)
  const gajur = lathe([[0.001, 0], [0.5, 0], [0.56, 0.1], [0.46, 0.2], [0.3, 0.27], [0.44, 0.42], [0.52, 0.58], [0.46, 0.74], [0.2, 0.84], [0.27, 0.94], [0.15, 1.04], [0.23, 1.18], [0.13, 1.32], [0.19, 1.44], [0.08, 1.58], [0.11, 1.72], [0.04, 1.96], [0.008, 2.2]], 24);
  add(gold, gajur, at(null, 0, ROOF3.y1 + 0.15, 0));

  // ---- wooden picket fence round the plinth, open at the porch
  const fenceRuns = [];
  for (let k = 0; k < 4; k++) {
    const d = D(k, 0.9);
    const len = L(k, 0.9);
    const runs = k === 0 ? [[-len, -3.15], [3.15, len]] : [[-len + (k % 2 ? 0.1 : 0), len - (k % 2 ? 0.1 : 0)]];
    for (const [s0, s1] of runs) {
      fenceRuns.push(fpoly(k, s0, s1, d - 0.06, d + 0.06));
      const n = Math.max(1, Math.round((s1 - s0) / 2));
      for (let j = 0; j <= n; j++) fbox(k, fence, 0.1, 1.3, 0.1, s0 + (j * (s1 - s0)) / n, 0.65, d, 0.6);
      for (const y of [0.32, 0.95]) fbox(k, fence, s1 - s0, 0.08, 0.05, (s0 + s1) / 2, y, d - 0.06, 1.2);
      const tip = mbox(0.05, 0.05, 0.022, 0.3);
      for (let s = s0 + 0.12; s < s1 - 0.06; s += 0.14) {
        fbox(k, fence, 0.07, 1.1, 0.022, s, 0.55, d - 0.1, 0.6);
        add(fence, tip, at(k, s, 1.1, d - 0.1, 0, 0, Math.PI / 4));
      }
    }
  }

  // ---- merge per material
  const root = new THREE.Group();
  root.name = "Kasthamandap-real";
  root.position.set(f.x, 0, f.z);
  root.rotation.y = yaw;
  for (const [mat, geos] of bag) {
    const merged = mergeGeometries(geos);
    const p = merged.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const [x, z] = warp(p.getX(i), p.getZ(i));
      p.setX(i, x);
      p.setZ(i, z);
    }
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = mat !== valMat && mat !== lattice;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const geos of bag.values()) for (const g of geos) g.dispose();
  scene.add(root);

  // ---- collision: a 2.5D stack of insets that matches the meshes above
  const levels = [];
  const lv1 = [{ i: CORE_I, y: roofY(ROOF1, CORE_I) }];
  for (let i = CORE_I + 0.35; i < WALL2.i - 0.01; i += 0.35) lv1.push({ i, y: roofY(ROOF1, i) });
  lv1.push({ i: BALC2.out, y: BALC2.floor });
  const lv2 = [{ i: WALL2.i, y: roofY(ROOF2, WALL2.i) }];
  for (let i = WALL2.i + 0.35; i < ROOF2.i1 - 0.01; i += 0.35) lv2.push({ i, y: roofY(ROOF2, i) });
  lv2.push({ i: ROOF2.i1, y: ROOF2.y1 });
  const lv3 = [{ i: WALL3.i, y: roofY(ROOF3, WALL3.i) }];
  for (let i = WALL3.i + 0.35; i < ROOF3.i1 - 0.05; i += 0.35) lv3.push({ i, y: roofY(ROOF3, i) });
  levels.push(...lv1, ...lv2, ...lv3);
  const floorIn = (i) => Math.max(PLINTH[1].y, ...levels.filter((e) => e.i <= i + 1e-6).map((e) => e.y));
  const ring = (e) => ({ poly: rect(e.i), y: +e.y.toFixed(3) });

  b.hero = "kasthamandap";
  b.ownMesh = true;
  b.wall = rect(CORE_I);
  b.height = +lv1[0].y.toFixed(3);
  b.steps = [...PLINTH.map(ring), ...stair, ...lv1.slice(1).map(ring)];
  const tier = (id, lv) => ({ id, name: "", hero: "", ownMesh: true, wall: rect(lv[0].i), height: +lv[0].y.toFixed(3), steps: lv.slice(1).map(ring), hole: null, cx: f.x, cz: f.z });
  buildings.push(tier("kastha-storey2", lv2), tier("kastha-storey3", lv3));
  const small = (id, poly, height) => {
    const cx = poly.reduce((a, p) => a + p[0], 0) / poly.length;
    const cz = poly.reduce((a, p) => a + p[1], 0) / poly.length;
    buildings.push({ id, name: "", hero: "", ownMesh: true, wall: poly, steps: [], height, hole: null, cx, cz });
  };
  postSpots.forEach((p, n) => {
    if (p.k % 2 && p.corner) return;
    const d = D(p.k, POST_I);
    small("kastha-post-" + n, fpoly(p.k, p.s - 0.15, p.s + 0.15, d - 0.15, d + 0.15), POST_TOP);
  });
  fenceRuns.forEach((poly, n) => small("kastha-fence-" + n, poly, 1.2));
  lionSpots.forEach((poly, n) => small("kastha-lion-" + n, poly, 1.75));

  // ---- handholds: posts and the gallery up to the first roof, balcony and walls to the upper roofs
  for (let i = holds.length - 1; i >= 0; i--) if (holds[i].id === KASTHA_ID) holds.splice(i, 1);
  const normal = (k) => {
    const th = (k * Math.PI) / 2;
    const nl = [Math.sin(th), Math.cos(th)];
    return [+(nl[0] * ca + nl[1] * sa).toFixed(4), +(-nl[0] * sa + nl[1] * ca).toFixed(4)];
  };
  const hold = (k, s, inset, y, roofTop = false) => {
    const [x, z] = W(...FL(k, s, D(k, inset)));
    const [nx, nz] = normal(k);
    holds.push({ id: KASTHA_ID, x, y: +y.toFixed(3), z, nx, nz, roof: roofTop });
  };
  const postFace = POST_I - 0.14;
  for (const p of postSpots) {
    const underGallery = Math.abs(p.s) < BALC.half + 0.1;
    hold(p.k, p.s, postFace, 2.2);
    hold(p.k, p.s, postFace, 3.1);
    hold(p.k, p.s, underGallery ? BALC.out : postFace, 4.0);
    hold(p.k, p.s, underGallery ? BALC.out : postFace, 4.9);
    hold(p.k, p.s, underGallery ? CORE_I : postFace, 5.8);
    hold(p.k, p.s, postFace + 0.04, floorIn(postFace + 0.79), true);
  }
  for (let k = 0; k < 4; k++) {
    const lb = L(k, BALC2.out);
    for (let s = -lb + 0.3; s <= lb - 0.3; s += 0.9) {
      hold(k, s, BALC2.out + 0.3, 9.6);
      hold(k, s, BALC2.out - 0.2, BALC2.floor, true);
    }
    const lw = L(k, WALL2.i);
    for (let s = -lw + 0.3; s <= lw - 0.3; s += 0.9) {
      hold(k, s, WALL2.i, 11.7);
      hold(k, s, WALL2.i, 12.4);
      hold(k, s, WALL2.i + 0.05, floorIn(WALL2.i + 0.8), true);
    }
    const l3 = L(k, WALL3.i);
    for (let s = -l3 + 0.2; s <= l3 - 0.2; s += 0.8) {
      hold(k, s, WALL3.i, 14.95);
      hold(k, s, WALL3.i + 0.05, floorIn(WALL3.i + 0.8), true);
    }
  }

  const [fx, fz] = normal(0);
  window.__kastha = {
    id: KASTHA_ID, x: f.x, z: f.z, yaw, hx: HX, hz: HZ, front: { x: fx, z: fz },
    eave: rect(0), plinthTop: PLINTH[1].y, roof1: b.height, roof2: lv2[0].y, roof3: lv3[0].y, top: ROOF3.y1 + 2.35,
    face: (k, s, inset) => W(...FL(k, s, D(k, inset))), normal, floorIn,
  };
  return root;
}
