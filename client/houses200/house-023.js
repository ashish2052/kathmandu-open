// House 023. Suraj Chok, east Watu Marg (Otu / Wotu), OSM way 1029217595, edge 2, 4.56 m.
// Spec: research/houses200/023/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// After the place.js yaw-180, x = 0 is photo-right (east): the open clothes bay.
// x = 4.56 is photo-left (west): the dark passage. Copy pano vady yaw 59, pitch 4.
// No letters. The Devanagari boards in the wider still belong to the neighbours.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 4.56;
const D = 7.35;
const T = 0.18;

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

function toTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function plasterTex() {
  const w = 512;
  const h = 512;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(23023);
  g.fillStyle = "#e7dfd6";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(90,70,55,0.13)" : "rgba(255,250,240,0.16)";
    g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2);
  }
  g.fillStyle = "rgba(120,90,70,0.18)";
  g.fillRect(0, h * 0.86, w, h * 0.14);
  for (let i = 0; i < 18; i++) {
    const x = r() * w;
    g.fillStyle = "rgba(90,70,60,0.10)";
    g.fillRect(x, r() * h * 0.5, 2 + r() * 3, h * (0.2 + r() * 0.4));
  }
  return toTex(c);
}

function shopWallTex() {
  const c = canvas(256, 256);
  const g = c.getContext("2d");
  const r = rng(23);
  g.fillStyle = "#6e645c";
  g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = r() > 0.55 ? "rgba(30,24,20,0.25)" : "rgba(180,160,140,0.12)";
    g.fillRect(r() * 256, r() * 256, 2, 2);
  }
  g.fillStyle = "rgba(40,32,28,0.35)";
  g.fillRect(0, 210, 256, 46);
  return toTex(c);
}

function awningTex() {
  const c = canvas(256, 64);
  const g = c.getContext("2d");
  const r = rng(91);
  // Dull green trim from the still, pulled toward grey for overcast light; rust and grime on the edge.
  g.fillStyle = "#3f8f72";
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = "rgba(20,50,40,0.22)";
  for (let i = 0; i < 8; i++) g.fillRect(i * 32, 0, 3, 64);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = r() > 0.6 ? "rgba(90,60,40,0.22)" : "rgba(10,30,25,0.18)";
    g.fillRect(r() * 256, r() * 64, 1 + r() * 3, 1 + r() * 2);
  }
  g.fillStyle = "rgba(40,30,25,0.35)";
  g.fillRect(0, 54, 256, 10);
  return toTex(c);
}

function brickTex() {
  // Party-wall brick, 1 m square tile: dull red-brown, mortar, spall and soot.
  const c = canvas(512, 512);
  const g = c.getContext("2d");
  const r = rng(2302);
  g.fillStyle = "#3d3330";
  g.fillRect(0, 0, 512, 512);
  const ch = 512 / 15;
  const cw = 512 / 4.4;
  for (let row = 0; row < 15; row++) {
    const off = row % 2 ? cw / 2 : 0;
    for (let k = -1; k < 5; k++) {
      const v = 0.72 + r() * 0.3;
      g.fillStyle = `rgb(${Math.round(112 * v)},${Math.round(80 * v)},${Math.round(70 * v)})`;
      g.fillRect(k * cw + off + 2, row * ch + 2, cw - 4, ch - 4);
    }
  }
  for (let i = 0; i < 5000; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(30,22,18,0.18)" : "rgba(200,180,160,0.10)";
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2, 1 + r() * 2);
  }
  for (let i = 0; i < 6; i++) {
    g.fillStyle = "rgba(150,140,128,0.3)";
    g.fillRect(r() * 480, r() * 480, 20 + r() * 60, 12 + r() * 40);
  }
  for (let i = 0; i < 30; i++) {
    g.fillStyle = "rgba(25,20,18,0.12)";
    g.fillRect(r() * 512, 0, 3 + r() * 12, 512);
  }
  return toTex(c);
}

function garmentAtlas() {
  // 4 x 2 atlas of hung garment cut-outs, drawn white so the material colour tints them.
  // Columns: romper, tee, frock, long shirt. Row 0 plain, row 1 printed.
  const c = canvas(512, 256);
  const g = c.getContext("2d");
  const r = rng(77);
  const shapes = [
    [[44, 14], [84, 14], [116, 34], [104, 52], [90, 46], [92, 104], [70, 122], [64, 108], [58, 122], [36, 104], [38, 46], [24, 52], [12, 34]],
    [[42, 12], [86, 12], [120, 34], [106, 56], [94, 48], [96, 122], [32, 122], [34, 48], [22, 56], [8, 34]],
    [[46, 12], [82, 12], [94, 30], [88, 50], [118, 124], [10, 124], [40, 50], [34, 30]],
    [[40, 6], [88, 6], [118, 30], [108, 92], [96, 88], [98, 126], [30, 126], [32, 88], [20, 92], [10, 30]],
  ];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 4; col++) {
      const ox = col * 128;
      const oy = row * 128;
      g.save();
      g.beginPath();
      shapes[col].forEach(([x, y], i) => (i ? g.lineTo(ox + x, oy + y) : g.moveTo(ox + x, oy + y)));
      g.closePath();
      g.fillStyle = "#f4f2ee";
      g.fill();
      g.clip();
      // Folds: soft vertical shade bands and a darker hem.
      for (let i = 0; i < 6; i++) {
        g.fillStyle = `rgba(60,55,50,${0.05 + r() * 0.08})`;
        g.fillRect(ox + 14 + r() * 100, oy, 3 + r() * 7, 128);
      }
      const grad = g.createLinearGradient(0, oy, 0, oy + 128);
      grad.addColorStop(0, "rgba(0,0,0,0.12)");
      grad.addColorStop(0.3, "rgba(0,0,0,0)");
      grad.addColorStop(1, "rgba(0,0,0,0.16)");
      g.fillStyle = grad;
      g.fillRect(ox, oy, 128, 128);
      g.fillStyle = "rgba(40,35,30,0.4)";
      g.beginPath();
      g.ellipse(ox + 64, oy + 14, 14, 6, 0, 0, Math.PI * 2);
      g.fill();
      if (row === 1) {
        for (let i = 0; i < 26; i++) {
          g.fillStyle = ["rgba(200,80,90,0.55)", "rgba(70,110,170,0.5)", "rgba(230,180,60,0.55)", "rgba(80,150,110,0.5)"][i % 4];
          g.beginPath();
          g.arc(ox + 18 + r() * 92, oy + 30 + r() * 90, 3 + r() * 5, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();
      // Hanger hook above the neck.
      g.strokeStyle = "rgba(40,40,40,0.9)";
      g.lineWidth = 2;
      g.beginPath();
      g.arc(ox + 64, oy + 6, 4, Math.PI, 0);
      g.stroke();
    }
  }
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function stockTex() {
  // Back wall of the clothes bay: shelves of stacked, plastic-wrapped bundles in dusty pinks and browns.
  const c = canvas(512, 384);
  const g = c.getContext("2d");
  const r = rng(4023);
  g.fillStyle = "#3a2f29";
  g.fillRect(0, 0, 512, 384);
  const tones = ["#b28c80", "#9c7466", "#c9a7a0", "#8a6b5c", "#d6c3b8", "#a5868c", "#7e6a62", "#c7b49a"];
  for (let shelf = 0; shelf < 4; shelf++) {
    const y0 = 10 + shelf * 94;
    g.fillStyle = "#4a3a30";
    g.fillRect(0, y0 + 84, 512, 8);
    let x = 4;
    while (x < 500) {
      const w = 34 + r() * 40;
      let y = y0 + 84;
      const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) {
        const h = 10 + r() * 10;
        if (y - h < y0) break;
        g.fillStyle = tones[Math.floor(r() * tones.length)];
        g.fillRect(x + r() * 3, y - h, w - 3, h - 1);
        g.fillStyle = "rgba(255,255,255,0.18)";
        g.fillRect(x + 3, y - h + 1, w - 10, 2);
        g.fillStyle = "rgba(0,0,0,0.25)";
        g.fillRect(x, y - 2, w - 3, 2);
        y -= h;
      }
      x += w + 2 + r() * 4;
    }
  }
  const grad = g.createLinearGradient(0, 0, 0, 384);
  grad.addColorStop(0, "rgba(0,0,0,0.35)");
  grad.addColorStop(0.5, "rgba(0,0,0,0.05)");
  grad.addColorStop(1, "rgba(0,0,0,0.4)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 512, 384);
  return toTex(c);
}

function grimeTex(w, h, holes) {
  // Facade-sized decal in metres (x 0..w, y 2.8..2.8+h): soot under the awning and slab, sill streaks, damp patches.
  const S = 96;
  const c = canvas(Math.round(w * S), Math.round(h * S));
  const g = c.getContext("2d");
  const r = rng(9023);
  const Y = (y) => (2.8 + h - y) * S;
  for (let i = 0; i < 60; i++) {
    const x = r() * w * S;
    const y = Y(5.0) + r() * 10;
    const grad = g.createLinearGradient(0, y, 0, y + (0.3 + r() * 1.2) * S);
    grad.addColorStop(0, "rgba(45,38,32,0.32)");
    grad.addColorStop(1, "rgba(45,38,32,0)");
    g.fillStyle = grad;
    g.fillRect(x, y, 4 + r() * 18, (0.3 + r() * 1.2) * S);
  }
  for (const hole of holes) {
    for (let i = 0; i < 9; i++) {
      const x = (hole.x - hole.w / 2 + r() * hole.w) * S;
      const y = Y(hole.y - hole.h / 2);
      const len = (0.4 + r() * 1.1) * S;
      const grad = g.createLinearGradient(0, y, 0, y + len);
      grad.addColorStop(0, "rgba(55,45,38,0.4)");
      grad.addColorStop(1, "rgba(55,45,38,0)");
      g.fillStyle = grad;
      g.fillRect(x, y, 3 + r() * 8, len);
    }
  }
  for (let i = 0; i < 14; i++) {
    g.fillStyle = `rgba(${r() > 0.5 ? "70,62,50" : "120,110,90"},${0.06 + r() * 0.1})`;
    g.beginPath();
    g.ellipse(r() * w * S, r() * h * S, (0.2 + r() * 0.6) * S, (0.15 + r() * 0.5) * S, r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  const top = g.createLinearGradient(0, 0, 0, 0.5 * S);
  top.addColorStop(0, "rgba(40,34,30,0.35)");
  top.addColorStop(1, "rgba(40,34,30,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, w * S, 0.5 * S);
  for (const edge of [0, w * S - 0.35 * S]) {
    g.fillStyle = "rgba(50,42,36,0.18)";
    g.fillRect(edge, 0, 0.35 * S, h * S);
  }
  const t = toTex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

export function createHouse023() {
  const root = new THREE.Group();
  const buckets = {};
  const loose = [];
  const upperHole = { x: 2.2, y: 3.95, w: 4.0, h: 1.7 };
  const winHole = { x: 1.45, y: 6.15, w: 0.92, h: 1.18 };
  const maps = {
    plaster: plasterTex(),
    shop: shopWallTex(),
    awning: awningTex(),
    brick: brickTex(),
    atlas: garmentAtlas(),
    stock: stockTex(),
    grime: grimeTex(W, 5.6, [{ ...winHole, x: W - winHole.x }]), // the decal is turned to face the lane, so x is mirrored
  };

  function mat(name, color, opts) {
    const o = opts || {};
    const m = new THREE.MeshStandardMaterial({
      color: new THREE.Color(color),
      map: o.map || null,
      roughness: o.roughness == null ? 0.9 : o.roughness,
      metalness: o.metalness || 0,
      side: o.side || THREE.FrontSide,
    });
    if (o.glow) {
      m.emissive = new THREE.Color("#ffffff");
      m.emissiveMap = o.map;
      m.emissiveIntensity = o.glow;
    }
    m.name = name;
    return m;
  }
  function cloth(name, color) {
    const m = mat(name, color, { map: maps.atlas, roughness: 0.92, side: THREE.DoubleSide });
    m.alphaTest = 0.5;
    return m;
  }

  // Garment colours sampled from the still, pulled toward grey: the pano is blown out, the game is overcast.
  const GARMENTS = {
    gWhite: "#e9e6e0", gCream: "#e3d8c2", gPink: "#d29aa9", gLilac: "#ad9cc2", gMint: "#9cc4b0",
    gBlue: "#879fbd", gYellow: "#d9bd6a", gRed: "#a8424a", gTeal: "#4f8f99", gGrey: "#9a9894",
  };
  const mats = {
    plaster: mat("plaster", "#ece4da", { map: maps.plaster, roughness: 0.94 }),
    brick: mat("brick", "#ffffff", { map: maps.brick, roughness: 0.95 }),
    shop: mat("shop", "#ffffff", { map: maps.shop, roughness: 0.92 }),
    stock: mat("stock", "#ffffff", { map: maps.stock, roughness: 0.9, glow: 0.22 }),
    dark: mat("dark", "#2a241f", { roughness: 0.95 }),
    darker: mat("darker", "#161310", { roughness: 0.98 }),
    wood: mat("wood", "#4e3c2f", { roughness: 0.84 }),
    awning: mat("awning", "#ffffff", { map: maps.awning, roughness: 0.72 }),
    rail: mat("rail", "#5d6266", { roughness: 0.5, metalness: 0.5 }),
    wire: mat("wire", "#24211f", { roughness: 0.6, metalness: 0.1 }),
    box: mat("box", "#8d8a84", { roughness: 0.7 }),
    glass: mat("glass", "#9aa6a8", { roughness: 0.2, metalness: 0.05 }),
    frame: mat("frame", "#e0d6c8", { roughness: 0.7 }),
    sill: mat("sill", "#cfc4b6", { roughness: 0.8 }),
    pink: mat("pink", "#e88aa6", { roughness: 0.45 }),
    tank: mat("tank", "#c5ccd0", { roughness: 0.55, metalness: 0.2 }),
  };
  maps.stock.repeat.set(0.42, 0.45);
  for (const [name, color] of Object.entries(GARMENTS)) mats[name] = cloth(name, color);
  const grimeMat = new THREE.MeshStandardMaterial({
    map: maps.grime, transparent: true, depthWrite: false, roughness: 1,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });

  function add(name, geo) {
    if (!buckets[name]) buckets[name] = [];
    buckets[name].push(geo);
  }

  function addBox(name, w, h, d, x, y, z, rx, ry, rz) {
    add(name, place(boxGeo(w, h, d), x, y, z, rx, ry, rz));
  }

  function wall(name, x0, x1, y0, y1, z, depth, holes) {
    for (const c of cells(x0, x1, y0, y1, holes)) {
      addBox(name, c.w, c.h, depth, c.x, c.y, z);
    }
  }

  const shopHole = { x: 1.55, y: 1.28, w: 2.8, h: 2.42 };
  const passHole = { x: 3.78, y: 1.32, w: 1.05, h: 2.5 };

  wall("shop", 0, W, 0, 2.72, T / 2, T, [shopHole, passHole]);
  wall("plaster", 0, W, 2.72, 8.2, T / 2, T, [upperHole, winHole]);
  // Side returns are bare party-wall brick, as Kathmandu infill houses are; the back stays plaster.
  addBox("brick", T, 8.2, D, 0, 4.1, D / 2);
  addBox("brick", T, 8.2, D, W, 4.1, D / 2);
  addBox("plaster", W, 8.2, T, W / 2, 4.1, D - T / 2);
  addBox("plaster", W + T, T, D, W / 2, 8.28, D / 2);
  addBox("plaster", W, 0.28, 0.16, W / 2, 8.34, 0.02);
  const grime = new THREE.Mesh(place(new THREE.PlaneGeometry(W, 5.6), W / 2, 5.6, -0.004, 0, Math.PI, 0), grimeMat);
  grime.name = "grime";
  grime.renderOrder = 2;
  loose.push(grime);

  // Hung garment: an alpha cut-out from the atlas (kind 0 romper, 1 tee, 2 frock, 3 long shirt), hem bowed.
  function garment(name, kind, printed, x, top, z, w, h, tilt, yaw) {
    const g = new THREE.PlaneGeometry(w, h, 1, 3);
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const v = p.getY(i) / h + 0.5;
      p.setZ(i, Math.sin(v * Math.PI) * 0.025 + (1 - v) * 0.03);
      uv.setXY(i, (kind + uv.getX(i)) / 4, (printed ? 0 : 0.5) + uv.getY(i) * 0.5);
    }
    g.computeVertexNormals();
    add(name, place(g, x, top - h / 2, z, 0.04 * Math.sign(tilt || 0), yaw == null ? Math.PI : yaw, tilt || 0));
  }
  const pick = (list, k) => list[Math.floor(hash(k, 7, 3) * list.length) % list.length];

  // Shop mouth. A dim lit stock wall at the back, then rails of hung clothes at two depths.
  addBox("stock", 2.7, 2.3, 0.06, 1.55, 1.2, 1.75);
  addBox("stock", 0.06, 2.3, 1.6, 0.2, 1.2, 0.95);
  addBox("dark", 2.8, 0.06, 1.9, 1.55, 0.05, 0.85);
  addBox("dark", 2.8, 0.1, 1.9, 1.55, 2.45, 0.85);
  addBox("wood", 2.4, 0.08, 0.5, 1.55, 0.72, 1.4);
  for (let i = 0; i < 6; i++) addBox(i % 3 ? "box" : "pink", 0.34, 0.18 + hash(i, 2, 2) * 0.2, 0.3, 0.5 + i * 0.4, 0.86 + hash(i, 2, 2) * 0.1, 1.45);
  const inner = ["gWhite", "gPink", "gYellow", "gLilac", "gWhite", "gMint", "gBlue", "gRed", "gWhite", "gCream"];
  for (let row = 0; row < 2; row++) {
    const z = 0.35 + row * 0.45;
    addBox("rail", 2.6, 0.025, 0.025, 1.55, 2.3 - row * 0.12, z);
    for (let i = 0; i < 12; i++) {
      const k = row * 12 + i;
      const x = 0.3 + i * 0.21 + hash(k, 1, 1) * 0.06;
      garment(pick(inner, k), Math.floor(hash(k, 4, 4) * 4), hash(k, 5, 5) > 0.6, x, 2.28 - row * 0.12, z + 0.02, 0.3, 0.42 + hash(k, 6, 6) * 0.3, (hash(k, 3, 1) - 0.5) * 0.12, Math.PI + (hash(k, 9, 9) - 0.5) * 0.5);
    }
  }
  addBox("wood", 2.8, 0.06, 0.08, 1.55, 2.5, -0.02);
  // Big white frocks and shirts hung in the mouth itself, spaced so the stock still shows between them.
  addBox("rail", 2.7, 0.02, 0.02, 1.55, 2.44, -0.2);
  for (let i = 0; i < 7; i++) {
    const k = 900 + i;
    garment(pick(["gWhite", "gWhite", "gCream", "gWhite", "gPink"], k), 2 + (i % 2), hash(k, 5, 5) > 0.8, 0.35 + i * 0.4 + hash(k, 1, 1) * 0.1, 2.44, -0.2, 0.44, 0.75 + hash(k, 6, 6) * 0.3, (hash(k, 3, 1) - 0.5) * 0.1);
  }

  // Pink float ring in the bay, as in the still. Not a sign.
  add("pink", place(new THREE.TorusGeometry(0.17, 0.06, 8, 18), 2.45, 1.62, -0.3, 0, 0.3, 0.2));

  // West passage: an open dark mouth, no door leaf. The back is a wall, not a missing face.
  addBox("darker", 0.86, 2.3, 0.1, 3.78, 1.22, 1.4);
  addBox("darker", 0.06, 2.5, 1.45, 3.1, 1.25, 0.72);
  addBox("darker", 1.2, 0.06, 1.45, 3.78, 2.5, 0.72);
  addBox("shop", 0.06, 2.5, 0.08, 3.22, 1.3, -0.02);
  addBox("shop", 0.06, 2.5, 0.08, 4.34, 1.3, -0.02);
  addBox("wood", 1.15, 0.08, 0.1, 3.78, 2.58, -0.03);
  addBox("shop", 0.22, 2.55, 0.08, 2.95, 1.28, -0.02);
  addBox("shop", W, 0.18, 0.06, W / 2, 0.09, -0.02);

  // Balcony across the whole front, on joists, with a plaster slab edge.
  const BZ = -0.9;
  addBox("sill", W + 0.1, 0.1, 0.95, W / 2, 2.77, BZ / 2 - 0.02);
  addBox("plaster", W + 0.1, 0.16, 0.05, W / 2, 2.72, BZ - 0.02);
  for (let i = 0; i < 7; i++) addBox("wood", 0.07, 0.1, 0.95, 0.2 + i * 0.69, 2.67, BZ / 2);
  for (let i = 0; i <= 15; i++) addBox("rail", 0.025, 0.95, 0.025, 0.05 + i * (W - 0.1) / 15, 3.3, BZ + 0.03);
  addBox("rail", W, 0.035, 0.035, W / 2, 3.78, BZ + 0.03);
  addBox("rail", W, 0.025, 0.025, W / 2, 3.28, BZ + 0.03);
  for (const x of [0.03, W - 0.03]) {
    addBox("rail", 0.035, 0.035, 0.9, x, 3.78, BZ / 2);
    for (let i = 1; i < 4; i++) addBox("rail", 0.025, 0.95, 0.025, x, 3.3, BZ + i * 0.22);
  }

  // The still's white curtain: baby clothes pegged two deep along the rail, a few colours in it.
  const curtain = ["gWhite", "gWhite", "gWhite", "gCream", "gWhite", "gWhite", "gGrey", "gWhite", "gWhite", "gMint", "gWhite", "gWhite"];
  for (let layer = 0; layer < 2; layer++) {
    const n = 30 - layer * 6;
    for (let i = 0; i < n; i++) {
      const k = 300 + layer * 40 + i;
      const x = 0.1 + (i + layer * 0.5) * (W - 0.2) / n;
      const name = layer ? pick(["gWhite", "gCream", "gWhite", "gRed", "gWhite", "gBlue"], k) : pick(curtain, k);
      garment(name, hash(k, 4, 4) > 0.45 ? 0 : 1, hash(k, 5, 5) > 0.92, x, 3.84, BZ - 0.05 + layer * 0.1, 0.36, 0.5 + hash(k, 6, 6) * 0.22, (hash(k, 3, 1) - 0.5) * 0.14);
    }
  }
  // A second line under the slab: small white garments across the bay, coloured ones near the ring.
  addBox("wire", W - 0.2, 0.01, 0.01, W / 2, 2.6, BZ + 0.08);
  for (let i = 0; i < 20; i++) {
    const k = 500 + i;
    const x = 0.15 + i * 0.22;
    if (x > 3.1 && x < 4.45) continue;
    const name = x > 1.9 ? pick(["gPink", "gBlue", "gLilac", "gWhite", "gTeal"], k) : pick(["gWhite", "gWhite", "gCream", "gWhite"], k);
    garment(name, Math.floor(hash(k, 4, 4) * 3), hash(k, 5, 5) > 0.7, x, 2.6, BZ + 0.08 + (i % 2) * 0.05, 0.32, 0.42 + hash(k, 6, 6) * 0.26, (hash(k, 3, 1) - 0.5) * 0.16);
  }

  // Upper floor behind the balcony: a dark open room with coloured garments under the beam.
  addBox("dark", upperHole.w, upperHole.h, 0.06, upperHole.x, upperHole.y, 1.2);
  addBox("dark", upperHole.w, 0.06, 1.2, upperHole.x, upperHole.y + upperHole.h / 2, 0.6);
  addBox("wood", upperHole.w + 0.1, 0.14, 0.14, upperHole.x, upperHole.y + upperHole.h / 2 - 0.07, -0.02);
  for (let i = 0; i < 4; i++) addBox("wood", 0.1, upperHole.h, 0.1, upperHole.x - upperHole.w / 2 + 0.05 + i * (upperHole.w - 0.1) / 3, upperHole.y, -0.02);
  const upper = ["gTeal", "gYellow", "gRed", "gMint", "gWhite", "gBlue", "gPink", "gLilac", "gCream"];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 13; i++) {
      const k = 700 + row * 20 + i;
      garment(pick(upper, k), 1 + Math.floor(hash(k, 4, 4) * 3), hash(k, 5, 5) > 0.5, 0.35 + i * 0.3 + row * 0.12, 4.68 - row * 0.05, 0.12 + row * 0.35, 0.36, 0.55 + hash(k, 6, 6) * 0.35, (hash(k, 3, 1) - 0.5) * 0.1);
    }
  }

  // Green trim canopy over the upper room, sloped out to the lane, on two brackets.
  addBox("awning", W + 0.1, 0.04, 0.7, W / 2, 5.05, -0.33, 0.25, 0, 0);
  addBox("awning", W + 0.1, 0.14, 0.03, W / 2, 4.92, -0.69);
  for (const x of [0.15, W - 0.15]) addBox("rail", 0.04, 0.04, 0.7, x, 4.85, -0.33, -0.6, 0, 0);

  // One cream-framed window on the upper floor. Opaque pane. Frame proud of the plaster.
  function windowUnit(x, y, w, h) {
    addBox("frame", 0.05, h + 0.06, 0.05, x - w / 2, y, -0.02);
    addBox("frame", 0.05, h + 0.06, 0.05, x + w / 2, y, -0.02);
    addBox("frame", w + 0.06, 0.05, 0.05, x, y + h / 2, -0.02);
    addBox("frame", w + 0.06, 0.06, 0.06, x, y - h / 2, -0.03);
    addBox("frame", 0.03, h - 0.08, 0.03, x, y, -0.03);
    addBox("frame", w - 0.08, 0.03, 0.03, x, y, -0.03);
    addBox("glass", w - 0.1, h - 0.1, 0.02, x, y, 0.02);
    addBox("sill", w + 0.16, 0.05, 0.12, x, y - h / 2 - 0.04, -0.05);
    addBox("sill", w + 0.2, 0.06, 0.1, x, y + h / 2 + 0.06, -0.04);
  }
  windowUnit(1.45, 6.15, 0.92, 1.18);
  addBox("dark", 0.78, 1.02, 0.2, 1.45, 6.15, 0.16);

  function wire(pts, rad) {
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, rad, 4, false));
  }
  function span(a, b, droop, rad, seed) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t + Math.sin(Math.PI * t) * (hash(seed, i, 1) - 0.5) * 0.12,
      ));
    }
    wire(pts, rad);
  }
  // The still's nest: a thick sagging bundle across the canopy, run past both ends to the neighbours,
  // a coil hung in it, junction boxes, and droppers into the shop.
  for (let i = 0; i < 24; i++) {
    const y = 4.45 + hash(i, 1, 5) * 0.25;
    const z = -1.15 - hash(i, 2, 5) * 0.25;
    span([-0.6, y + 0.1, z], [W + 0.7, y + 0.2 * hash(i, 3, 5), z - 0.1], 0.18 + hash(i, 4, 5) * 0.35, i < 5 ? 0.012 : 0.006, 100 + i);
  }
  for (let i = 0; i < 4; i++) {
    add("wire", place(new THREE.TorusGeometry(0.2 + i * 0.015, 0.008, 4, 22), 2.6 + i * 0.02, 4.22, -1.25, 0.2, 0.4, 0));
  }
  addBox("box", 0.22, 0.28, 0.12, 3.9, 4.35, -1.15);
  addBox("box", 0.18, 0.2, 0.1, 0.8, 4.4, -1.2);
  span([3.9, 4.2, -1.15], [3.6, 2.5, -0.05], 0.1, 0.006, 401);
  span([0.8, 4.3, -1.2], [0.6, 2.6, -0.05], 0.1, 0.006, 402);
  span([2.6, 4.3, -1.25], [2.2, 2.9, -0.95], 0.05, 0.005, 403);
  span([0.3, 4.6, -1.1], [0.5, 7.4, -0.08], 0.15, 0.006, 302);

  // Unseen roof: one tank set behind the parapet.
  addBox("tank", 0.7, 0.55, 0.7, 1.2, 8.7, 2.4);
  addBox("tank", 0.08, 0.16, 0.08, 1.45, 9.05, 2.4);

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
  root.userData.id = "023";
  return root;
}
