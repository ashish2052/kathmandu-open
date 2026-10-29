// House 019. Kilagal, OSM way 226512210, edge 0, 5.11 m.
// Spec: research/houses200/019/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// Street face is edge 3, the west wall, 6.25 m. The panorama stands west of it.
// After the place.js yaw-180, x = 0 is photo-right (south) and x = 6.25 is photo-left (north),
// the end beside the red shop. Copy pano tkhvMXbSpaJR9O6AzFvOWA, yaw 66.
// Three timber arches, a marigold swag, three lattice windows with grey shutters, dull brick.
// No sign. The red shop and its board are the neighbour.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 6.25;
const D = 5.11;
const T = 0.22;
const ROOF = 7.45;

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

// 2.4 m x 1.2 m tile. Median still sample of this wall is #8c7168; the sunlit courses sit a little above that.
function brickSet() {
  const w = 1024;
  const h = 512;
  const cols = 10;
  const rows = 18;
  const bw = w / cols;
  const bh = h / rows;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const r = rng(19019);
  c.fillStyle = "#857b72";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#3a3a3a";
  e.fillRect(0, 0, w, h);
  // Dull, greyed red-brown around the photo median #8c7168; a few burnt and a few chalky bricks.
  const pal = [
    [132, 90, 70], [118, 82, 64], [144, 100, 78], [106, 76, 60],
    [128, 94, 76], [148, 106, 84], [98, 72, 58], [136, 102, 84],
  ];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw * 0.5;
    for (let k = -1; k < cols + 1; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.9 + r() * 0.16;
      const x0 = k * bw + off + 2;
      const y0 = row * bh + 2;
      const ww = bw - 4;
      const hh = bh - 3.5;
      c.fillStyle = "rgb(" + Math.round(p[0] * j) + "," + Math.round(p[1] * j) + "," + Math.round(p[2] * j) + ")";
      c.fillRect(x0, y0, ww, hh);
      e.fillStyle = "rgb(" + Math.round(70 + r() * 40) + "," + Math.round(70 + r() * 40) + "," + Math.round(70 + r() * 40) + ")";
      e.fillRect(x0, y0, ww, hh);
      if (r() > 0.82) {
        c.fillStyle = "rgba(70,56,50,0.4)";
        c.fillRect(x0 + r() * ww * 0.5, y0, 2, hh);
      }
      // Spalled faces: a paler, rougher patch where the fired skin has gone.
      if (r() > 0.9) {
        c.fillStyle = "rgba(176,150,136,0.45)";
        c.fillRect(x0 + r() * ww * 0.4, y0 + 1, ww * (0.3 + r() * 0.4), hh - 2);
        e.fillStyle = "rgb(48,48,48)";
        e.fillRect(x0 + ww * 0.3, y0 + 2, ww * 0.3, hh - 4);
      }
      // Fine grit so a brick is not one flat colour.
      for (let k2 = 0; k2 < 10; k2++) {
        c.fillStyle = r() > 0.5 ? "rgba(40,30,26,0.18)" : "rgba(190,170,150,0.12)";
        c.fillRect(x0 + r() * ww, y0 + r() * hh, 2 + r() * 4, 1 + r() * 2);
      }
    }
  }
  // Damp at the foot of the tile and a few rain streaks. Sparse, not polka dots.
  const g = c;
  g.fillStyle = "rgba(48,40,36,0.38)";
  g.fillRect(0, h - 36, w, 36);
  for (let i = 0; i < 14; i++) {
    const x = r() * w;
    g.fillStyle = "rgba(60,48,42,0.28)";
    g.fillRect(x, r() * h * 0.4, 2 + r() * 2, h * (0.25 + r() * 0.5));
  }
  const map = toTex(col, true);
  const nor = toTex(normalFromHeight(hei, 2.6), false);
  map.repeat.set(1 / 2.4, 1 / 1.2);
  nor.repeat.set(1 / 2.4, 1 / 1.2);
  return { diff: map, nor };
}

// Old weathered timber: grey-brown, split grain, darker in the cracks.
function woodSet() {
  const w = 256;
  const h = 256;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(19);
  g.fillStyle = "#6a5c50";
  g.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 1) {
    const k = 0.8 + r() * 0.3;
    g.fillStyle = "rgba(" + Math.round(84 * k) + "," + Math.round(72 * k) + "," + Math.round(62 * k) + ",0.5)";
    g.fillRect(0, y, w, 1);
  }
  for (let i = 0; i < 9; i++) {
    g.fillStyle = "rgba(24,18,14,0.5)";
    g.fillRect(0, r() * h, w * (0.3 + r() * 0.7), 1 + r());
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = "rgba(150,140,128,0.14)";
    g.fillRect(r() * w, r() * h, 6 + r() * 30, 2 + r() * 4);
  }
  return toTex(c, true);
}

// Lime plaster on the floor band, sills and hoods: mottled, cracked, stained.
function plasterSet() {
  const w = 256;
  const h = 256;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(1919);
  g.fillStyle = "#a69c8e";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(80,72,64,0.08)" : "rgba(214,206,194,0.08)";
    g.fillRect(r() * w, r() * h, 1 + r() * 6, 1 + r() * 3);
  }
  for (let i = 0; i < 24; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 10 + r() * 30;
    const rg = g.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, "rgba(70,62,54,0.16)");
    rg.addColorStop(1, "rgba(70,62,54,0)");
    g.fillStyle = rg;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  g.strokeStyle = "rgba(60,52,46,0.45)";
  for (let i = 0; i < 8; i++) {
    g.beginPath();
    let x = r() * w;
    let y = r() * h;
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (r() - 0.5) * 30;
      y += r() * 18;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  const t = toTex(c, true);
  t.repeat.set(1 / 1.4, 1 / 1.4);
  return t;
}

// Carved window lattice (jali): dark timber, diagonal mesh with rosettes. Holes are alpha.
function latticeSet() {
  const s = 256;
  const c = canvas(s, s);
  const g = c.getContext("2d");
  g.strokeStyle = "#8a847a";
  g.lineCap = "square";
  g.lineWidth = 9;
  const n = 6;
  const step = s / n;
  for (let i = -n; i <= 2 * n; i++) {
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step + s, s);
    g.stroke();
    g.beginPath();
    g.moveTo(i * step, 0);
    g.lineTo(i * step - s, s);
    g.stroke();
  }
  g.lineWidth = 5;
  for (let y = 0; y <= n; y++) {
    for (let x = 0; x <= n; x++) {
      g.beginPath();
      g.arc(x * step, y * step + step / 2, step * 0.22, 0, Math.PI * 2);
      g.stroke();
    }
  }
  g.lineWidth = 14;
  g.strokeRect(0, 0, s, s);
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

// One decal over the whole street face, cut to the real openings: damp foot, sill streaks, soot under
// the parapet and band, salt bloom. Height-specific wear a repeating brick tile cannot carry.
function grimeSet(W, H, holes) {
  const cw = 640;
  const ch = Math.round(cw * H / W);
  const c = canvas(cw, ch);
  const g = c.getContext("2d");
  const r = rng(91019);
  const X = (x) => (1 - x / W) * cw;
  const Y = (y) => (1 - y / H) * ch;
  const pm = cw / W;
  let gr = g.createLinearGradient(0, Y(0), 0, Y(0.9));
  gr.addColorStop(0, "rgba(34,28,24,0.62)");
  gr.addColorStop(1, "rgba(34,28,24,0)");
  g.fillStyle = gr;
  g.fillRect(0, Y(0.9), cw, Y(0) - Y(0.9));
  gr = g.createLinearGradient(0, Y(H), 0, Y(H - 1.3));
  gr.addColorStop(0, "rgba(28,24,22,0.55)");
  gr.addColorStop(1, "rgba(28,24,22,0)");
  g.fillStyle = gr;
  g.fillRect(0, 0, cw, Y(H - 1.3));
  // Run-off under the floor band and the parapet.
  for (const top of [2.86, 5.5, H - 0.2]) {
    for (let i = 0; i < 26; i++) {
      const x = r() * cw;
      const len = (0.3 + r() * 0.9) * pm;
      const sg = g.createLinearGradient(0, Y(top), 0, Y(top) + len);
      sg.addColorStop(0, "rgba(30,24,22," + (0.25 + r() * 0.25) + ")");
      sg.addColorStop(1, "rgba(30,24,22,0)");
      g.fillStyle = sg;
      g.fillRect(x, Y(top), 2 + r() * 7, len);
    }
  }
  // Streaks off each window sill, widest under the sill ends.
  for (const hole of holes.filter((o) => o.y > 3)) {
    const sy = Y(hole.y - hole.h / 2 - 0.08);
    for (let i = 0; i < 9; i++) {
      const x = X(hole.x + (r() - 0.5) * (hole.w + 0.2));
      const len = (0.4 + r() * 0.6) * pm;
      const sg = g.createLinearGradient(0, sy, 0, sy + len);
      sg.addColorStop(0, "rgba(26,22,20,0.45)");
      sg.addColorStop(1, "rgba(26,22,20,0)");
      g.fillStyle = sg;
      g.fillRect(x, sy, 3 + r() * 6, len);
    }
  }
  // Blotches: soot and salt bloom.
  for (let i = 0; i < 70; i++) {
    const x = r() * cw;
    const y = r() * ch;
    const rad = (0.15 + r() * 0.5) * pm;
    const salt = r() > 0.6;
    const rg = g.createRadialGradient(x, y, 0, x, y, rad);
    rg.addColorStop(0, salt ? "rgba(196,184,168,0.2)" : "rgba(30,24,20,0.24)");
    rg.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = rg;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (const hole of holes) {
    g.clearRect(X(hole.x + hole.w / 2), Y(hole.y + hole.h / 2), hole.w * pm, hole.h * pm);
  }
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, 0, 0);
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
  g.setAttribute("uv2", uv.clone());
  return g;
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const y = p.getY(i);
    const damp = y < 0.45 ? 0.72 + 0.28 * (y / 0.45) : 1;
    const k = (0.92 + 0.08 * hash(p.getX(i) * 1.7, y * 1.3, p.getZ(i) * 1.7)) * damp;
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv && !g.attributes.uv2) g.setAttribute("uv2", g.attributes.uv.clone());
  return g;
}

export function createHouse019() {
  const root = new THREE.Group();
  root.name = "house-019";

  const bays = [1.04, 3.125, 5.21];
  const groundHoles = [
    { x: 1.04, y: 1.16, w: 1.22, h: 2.16 },
    { x: 3.125, y: 1.16, w: 1.18, h: 2.16 },
    { x: 5.21, y: 1.16, w: 1.22, h: 2.16 },
  ];
  const winHoles = bays.map((x) => ({ x, y: 4.02, w: 0.78, h: 1.5 }));

  const brickMaps = brickSet();
  const woodMap = woodSet();
  const plasterMap = plasterSet();
  const mats = {
    brick: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: brickMaps.diff, normalMap: brickMaps.nor,
      roughness: 0.94, metalness: 0, vertexColors: true, normalScale: new THREE.Vector2(0.9, 0.9),
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0xc4b8aa, map: woodMap, roughness: 0.9, metalness: 0, vertexColors: true,
    }),
    woodDark: new THREE.MeshStandardMaterial({
      color: 0xb8aa9a, map: woodMap, roughness: 0.9, metalness: 0, vertexColors: true,
    }),
    shutter: new THREE.MeshStandardMaterial({
      color: 0xc2c4ba, map: woodMap, roughness: 0.86, metalness: 0, vertexColors: true,
    }),
    stone: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: plasterMap, roughness: 0.95, metalness: 0, vertexColors: true,
    }),
    lattice: new THREE.MeshStandardMaterial({
      color: 0xe8e0d4, map: latticeSet(), roughness: 0.9, metalness: 0, vertexColors: true,
      alphaTest: 0.4, side: THREE.DoubleSide,
    }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x1c1a18, roughness: 0.95, metalness: 0, vertexColors: true,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: 0x4a4038, roughness: 0.95, metalness: 0, vertexColors: true,
    }),
    flower: new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.8, metalness: 0, vertexColors: true,
    }),
    wire: new THREE.MeshStandardMaterial({
      color: 0x1e1c1a, roughness: 0.6, metalness: 0.05, vertexColors: true,
    }),
    grime: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: grimeSet(W, ROOF, [...groundHoles, ...winHoles]), roughness: 1, metalness: 0,
      transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, vertexColors: true,
    }),
  };

  const buckets = {};
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "brick" || name === "stone") worldUV(g);
    add(name, g, tint);
  }
  function wall(name, x0, x1, y0, y1, zFace, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
    }
  }

  wall("brick", 0, W, 0.16, 2.72, 0, groundHoles);
  wall("brick", 0, W, 2.72, 5.55, 0, winHoles);
  wall("brick", 0, W, 5.55, ROOF, 0, []);
  addBox("brick", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("brick", T, ROOF, D, W - T / 2, ROOF / 2, D / 2);
  addBox("brick", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("brick", W, 0.12, D, W / 2, 0.06, D / 2, [0.72, 0.68, 0.62]);
  addBox("brick", W, 0.16, D, W / 2, ROOF + 0.08, D / 2);
  addBox("brick", W, 0.34, 0.16, W / 2, ROOF + 0.12, 0.02);

  // Grime decal, a hair in front of the street face, facing the lane.
  add("grime", place(new THREE.PlaneGeometry(W, ROOF), W / 2, ROOF / 2, -0.004, 0, Math.PI, 0), [1, 1, 1]);

  // Stone plinth the bays stand on, worn and dark at the street edge.
  addBox("stone", W, 0.16, 0.2, W / 2, 0.08, -0.08, [0.62, 0.58, 0.54]);

  // Floor band: carved fascia, dentil course, top beam, then a projecting plaster band. Garland hangs below.
  addBox("woodDark", W, 0.12, 0.16, W / 2, 2.3, -0.09, [0.62, 0.56, 0.5]);
  for (let x = 0.08; x < W; x += 0.14) {
    addBox("woodDark", 0.07, 0.07, 0.06, x, 2.4, -0.2, [0.5, 0.45, 0.4]);
  }
  addBox("woodDark", W, 0.05, 0.08, W / 2, 2.4, -0.13, [0.3, 0.27, 0.24]);
  addBox("wood", W + 0.04, 0.14, 0.24, W / 2, 2.51, -0.12, [0.7, 0.64, 0.56]);
  addBox("stone", W + 0.06, 0.16, 0.24, W / 2, 2.66, -0.12, [0.7, 0.66, 0.6]);
  addBox("stone", W + 0.1, 0.05, 0.28, W / 2, 2.76, -0.14, [0.64, 0.6, 0.55]);

  // Recess behind each bay: deep and dark, the back wall darkest. A stool or the plank door. Not a lit shop.
  for (const hole of groundHoles) {
    const recess = hole.x === 5.21 ? 0.72 : 1.6;
    // Lime-washed inside walls, dim and soot-dark, so the plaster still reads in the shade.
    addBox("stone", hole.w - 0.04, hole.h - 0.08, 0.06, hole.x, hole.y, recess, [0.11, 0.1, 0.09]);
    addBox("stone", 0.06, hole.h, recess, hole.x - hole.w / 2 + 0.02, hole.y, recess / 2, [0.08, 0.072, 0.065]);
    addBox("stone", 0.06, hole.h, recess, hole.x + hole.w / 2 - 0.02, hole.y, recess / 2, [0.08, 0.072, 0.065]);
    for (let j = 0.2; j < recess; j += 0.4) {
      addBox("woodDark", hole.w - 0.1, 0.08, 0.08, hole.x, hole.y + hole.h / 2 - 0.1, j, [0.3, 0.27, 0.24]);
    }
    addBox("dark", hole.w, 0.06, recess, hole.x, hole.y + hole.h / 2 - 0.03, recess / 2, [0.24, 0.22, 0.2]);
    addBox("stone", hole.w, 0.06, recess, hole.x, 0.13, recess / 2, [0.5, 0.46, 0.42]);
  }
  // Photo-left bay (high X) is the plank door, weathered grey, one board loose.
  addBox("woodDark", 0.86, 1.92, 0.06, 5.21, 1.1, 0.62, [0.82, 0.8, 0.76]);
  for (let i = 0; i < 5; i++) {
    addBox("woodDark", 0.012, 1.9, 0.02, 5.21 - 0.36 + i * 0.18, 1.1, 0.585, [0.35, 0.32, 0.3]);
  }
  addBox("wood", 0.8, 0.08, 0.03, 5.21, 0.5, 0.58, [0.75, 0.7, 0.64]);
  addBox("wood", 0.8, 0.08, 0.03, 5.21, 1.7, 0.58, [0.75, 0.7, 0.64]);
  addBox("wire", 0.03, 0.08, 0.03, 4.88, 1.1, 0.56, [0.6, 0.6, 0.6]);
  // Raised plank floor in the two open bays, worn pale at the lip.
  for (const x of [1.04, 3.125]) {
    addBox("wood", 1.1, 0.2, 1.5, x, 0.26, 0.8, [0.5, 0.46, 0.42]);
    addBox("wood", 1.1, 0.04, 0.08, x, 0.35, 0.06, [0.8, 0.74, 0.66]);
  }
  // Stools: one pale, one dark, as the photo has.
  [[1.04, 0.55, [1.25, 1.22, 1.18]], [3.125, 0.75, [0.6, 0.55, 0.5]]].forEach(([x, z, tint]) => {
    addBox("wood", 0.38, 0.05, 0.3, x, 0.76, z, tint);
    for (const [dx, dz] of [[-0.15, -0.11], [0.15, -0.11], [-0.15, 0.11], [0.15, 0.11]]) {
      addBox("wood", 0.04, 0.4, 0.04, x + dx, 0.56, z + dz, tint);
    }
  });

  // Slim square posts, base block and stepped bracket capital, grey with age.
  const posts = [0.28, 2.08, 4.17, 5.98];
  for (const x of posts) {
    addBox("woodDark", 0.15, 2.1, 0.16, x, 1.21, -0.1, [0.95, 0.9, 0.84]);
    addBox("woodDark", 0.22, 0.12, 0.22, x, 0.22, -0.1, [0.55, 0.5, 0.46]);
    addBox("woodDark", 0.19, 0.04, 0.19, x, 0.3, -0.1, [0.62, 0.58, 0.52]);
    addBox("wood", 0.2, 0.08, 0.2, x, 2.08, -0.1, [0.72, 0.66, 0.58]);
    addBox("wood", 0.36, 0.08, 0.22, x, 2.18, -0.1, [0.66, 0.6, 0.52]);
    for (let i = 0; i < 3; i++) {
      addBox("woodDark", 0.17, 0.02, 0.18, x, 0.7 + i * 0.6, -0.1, [0.4, 0.37, 0.34]);
    }
  }

  // Marigold garland: three shallow festoons per bay off the fascia, a hanging tail at each join.
  const garland = rng(1903);
  const bloom = (x, y, z, rad) => {
    const k = 0.8 + garland() * 0.3;
    const tone = garland() > 0.35 ? [0.62 * k, 0.36 * k, 0.07 * k] : [0.6 * k, 0.24 * k, 0.05 * k];
    add("flower", place(new THREE.IcosahedronGeometry(rad, 0), x, y, z), tone);
  };
  for (let b = 0; b < 3; b++) {
    const x0 = posts[b] + 0.08;
    const x1 = posts[b + 1] - 0.08;
    const loops = 3;
    for (let l = 0; l < loops; l++) {
      const la = x0 + (x1 - x0) * l / loops;
      const lb = x0 + (x1 - x0) * (l + 1) / loops;
      const steps = 13;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        bloom(la + (lb - la) * t, 2.24 - Math.sin(Math.PI * t) * 0.15, -0.2, 0.026);
      }
      for (let k = 1; k < 4; k++) bloom(la, 2.24 - k * 0.045, -0.2, 0.022);
    }
  }

  // Windows: deep timber frame in a plaster surround, carved lattice below, grey louvred shutters above,
  // a stepped hood over the head and a projecting sill. Dark room behind.
  for (const hole of winHoles) {
    const top = hole.y + hole.h / 2;
    const bot = hole.y - hole.h / 2;
    addBox("glass", hole.w, hole.h, 0.04, hole.x, hole.y, 0.18, [0.6, 0.6, 0.6]);
    addBox("dark", 0.04, hole.h, 0.2, hole.x - hole.w / 2 + 0.02, hole.y, 0.1, [0.4, 0.37, 0.34]);
    addBox("dark", 0.04, hole.h, 0.2, hole.x + hole.w / 2 - 0.02, hole.y, 0.1, [0.4, 0.37, 0.34]);
    addBox("woodDark", hole.w + 0.24, 0.12, 0.14, hole.x, top + 0.04, -0.08, [1.0, 0.96, 0.9]);
    addBox("woodDark", hole.w + 0.24, 0.1, 0.14, hole.x, bot - 0.03, -0.08, [0.92, 0.88, 0.82]);
    addBox("woodDark", 0.12, hole.h + 0.12, 0.14, hole.x - hole.w / 2 - 0.04, hole.y, -0.08, [1.0, 0.95, 0.88]);
    addBox("woodDark", 0.12, hole.h + 0.12, 0.14, hole.x + hole.w / 2 + 0.04, hole.y, -0.08, [1.0, 0.95, 0.88]);
    addBox("stone", hole.w + 0.56, 0.08, 0.24, hole.x, top + 0.2, -0.12, [0.82, 0.78, 0.72]);
    addBox("stone", hole.w + 0.44, 0.06, 0.18, hole.x, top + 0.13, -0.09, [0.62, 0.58, 0.54]);
    addBox("stone", hole.w + 0.4, 0.07, 0.2, hole.x, bot - 0.12, -0.1, [0.8, 0.76, 0.7]);
    // Lattice, lower 55 %.
    const lh = hole.h * 0.55;
    const ly = bot + lh / 2;
    add("lattice", place(new THREE.PlaneGeometry(hole.w - 0.02, lh - 0.02), hole.x, ly, -0.02, 0, Math.PI, 0), [1, 1, 1]);
    addBox("woodDark", hole.w, 0.06, 0.1, hole.x, bot + lh, -0.05, [0.66, 0.62, 0.56]);
    // Two louvred leaves above.
    const uy0 = bot + lh + 0.03;
    const uh = top - uy0;
    for (const side of [-1, 1]) {
      const cx = hole.x + side * hole.w / 4;
      const lw = hole.w / 2 - 0.02;
      const tint = side < 0 ? [0.8, 0.82, 0.78] : [0.72, 0.74, 0.7];
      addBox("shutter", 0.04, uh, 0.05, cx - lw / 2 + 0.02, uy0 + uh / 2, -0.04, tint);
      addBox("shutter", 0.04, uh, 0.05, cx + lw / 2 - 0.02, uy0 + uh / 2, -0.04, tint);
      addBox("shutter", lw, 0.04, 0.05, cx, top - 0.02, -0.04, tint);
      addBox("glass", lw - 0.06, uh - 0.06, 0.01, cx, uy0 + uh / 2, -0.01, [0.8, 0.8, 0.8]);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const y = uy0 + 0.04 + (i + 0.5) * (uh - 0.08) / n;
        add("shutter", place(boxGeo(lw - 0.06, 0.05, 0.012), cx, y, -0.035, -0.6, 0, 0), tint);
      }
    }
  }

  // Cables: a bundle across the upper wall running past both ends, each its own droop and height,
  // and two dropping across the brick to the window band.
  function sag(x0, y0, x1, y1, droop, rad, z0, z1) {
    const n = 14;
    const pt = (t) => [x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - Math.sin(Math.PI * t) * droop, z0 + (z1 - z0) * t];
    for (let i = 0; i < n; i++) {
      const a = new THREE.Vector3(...pt(i / n));
      const b = new THREE.Vector3(...pt((i + 1) / n));
      const len = a.distanceTo(b) + 0.01;
      const g = new THREE.CylinderGeometry(rad, rad, len, 4, 1, true);
      g.applyMatrix4(new THREE.Matrix4().compose(
        a.clone().add(b).multiplyScalar(0.5),
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()),
        new THREE.Vector3(1, 1, 1),
      ));
      add("wire", g);
    }
  }
  const wr = rng(4419);
  for (let i = 0; i < 9; i++) {
    const ya = 5.7 + wr() * 1.2;
    const yb = ya - 0.3 + wr() * 0.5;
    sag(0.04, ya, W - 0.04, yb, 0.35 + wr() * 0.5, 0.008 + wr() * 0.01, -0.06 - wr() * 0.1, -0.06 - wr() * 0.1);
  }
  // Lower spans cross the window band, as in the photo.
  for (let i = 0; i < 4; i++) {
    const ya = 4.5 + wr() * 0.1;
    sag(0.04, ya, W - 0.04, ya + wr() * 0.1, 0.12 + wr() * 0.2, 0.007 + wr() * 0.006, -0.3 - wr() * 0.05, -0.3 - wr() * 0.05);
  }
  // Iron brackets at each end hold the low spans off the window hoods.
  for (const x of [0.06, W - 0.06]) addBox("wire", 0.03, 0.03, 0.36, x, 4.5, -0.17, [0.8, 0.8, 0.8]);
  sag(W - 0.04, 6.6, 2.4, 4.8, 0.25, 0.01, -0.08, -0.06);
  sag(W - 0.04, 6.4, 0.04, 5.0, 0.6, 0.012, -0.1, -0.08);
  addBox("wire", 0.12, 0.18, 0.08, 2.4, 4.75, -0.1, [0.8, 0.8, 0.8]);

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
  root.userData.id = "019";
  return root;
}
