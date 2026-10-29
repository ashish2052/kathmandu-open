// House 015. Paropakar Marg, OSM way 906975240, edge 1, 4.95 m.
// Spec: research/houses200/015/design.md
// Origin: front-left after the place.js yaw-180, so x = 0 is photo-right (north, the cooler)
// and x = 4.95 is photo-left (south, the bananas). +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// Still: pano FYyBhqUgtpIF14r09nEj_w, yaw 243, pitch 8. Copy that frame.
// Ground: striped awning, open snack mouth, bananas south, red cooler north. No invented words.
// Above: two brick floors, one dark window each, metal balconies with ring rails.
// The carved timber balcony and the corrugated tarp shop are the north neighbour. Not this mesh.
// Brick sampled from the still, about #754847. Overcast light split, same as house 005.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 4.95;
const D = 8.12;
const T = 0.22;
const S1 = 2.52;
const S2 = 5.18;
const S3 = 7.72;
const ROOF = 8.95;

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

function toTex(c, srgb, wrap) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (wrap) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
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
  const rows = 12;
  const bw = w / cols;
  const bh = h / rows;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const arm = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const a = arm.getContext("2d");
  const r = rng(15015);
  c.fillStyle = "#4a3a34";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#2e2e2e";
  e.fillRect(0, 0, w, h);
  a.fillStyle = "rgb(170,248,0)";
  a.fillRect(0, 0, w, h);
  const pal = [
    [128, 62, 42], [114, 54, 38], [140, 70, 48], [100, 48, 34],
    [122, 60, 44], [92, 46, 34], [134, 66, 46], [108, 56, 42],
  ];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw / 2;
    for (let k = 0; k < cols; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.88 + r() * 0.2;
      let R = p[0] * j;
      let G = p[1] * j;
      let B = p[2] * j;
      if (r() < 0.1) { R *= 0.76; G *= 0.74; B *= 0.74; }
      if (r() < 0.05) { R = R * 0.8 + 28; G = G * 0.8 + 24; B = B * 0.8 + 22; }
      const jx = 1.1;
      const jy = 0.9;
      for (const dx of [0, -w]) {
        const x0 = k * bw + off + dx + jx;
        const y0 = row * bh + jy;
        const ww = bw - jx * 2;
        const hh = bh - jy * 2;
        c.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
        c.fillRect(x0, y0, ww, hh);
        const sh = c.createLinearGradient(x0, y0, x0, y0 + hh);
        sh.addColorStop(0, "rgba(255,220,190,0.06)");
        sh.addColorStop(1, "rgba(20,10,6,0.16)");
        c.fillStyle = sh;
        c.fillRect(x0, y0, ww, hh);
        for (let q = 0; q < 3; q++) {
          c.fillStyle = r() > 0.5 ? "rgba(36,18,12,0.22)" : "rgba(190,160,140,0.1)";
          c.fillRect(x0 + r() * ww * 0.8, y0 + r() * hh * 0.7, 1 + r() * 5, 1 + r() * 1.5);
        }
        if (r() < 0.08) { c.fillStyle = "rgba(30,20,16,0.35)"; c.fillRect(x0 + r() * ww * 0.5, y0, 3 + r() * 6, hh * 0.6); }
        e.fillStyle = "#6e6e6e";
        e.fillRect(x0, y0, ww, hh);
        e.fillStyle = "#b4b4b4";
        e.fillRect(x0 + 1, y0 + 1, ww - 2, hh - 2);
        a.fillStyle = "rgb(255,220,0)";
        a.fillRect(x0, y0, ww, hh);
      }
    }
  }
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 2.6), false, true);
  const rough = toTex(arm, false, true);
  for (const t of [map, nor, rough]) t.repeat.set(1 / 1.9, 1 / 0.95);
  return { diff: map, nor, arm: rough };
}

function awningTex() {
  const w = 512;
  const h = 180;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const cols = ["#c0574a", "#d9d4c4", "#4f9a74", "#d9c76a", "#5b86b8", "#d9d4c4", "#c46a8a", "#7fb0a0"];
  const stripes = 64;
  for (let i = 0; i < stripes; i++) {
    g.fillStyle = cols[i % cols.length];
    g.fillRect((i * w) / stripes, 0, w / stripes + 1, h);
  }
  const fade = g.createLinearGradient(0, 0, 0, h);
  fade.addColorStop(0, "rgba(200,194,180,0.1)");
  fade.addColorStop(0.7, "rgba(120,110,96,0.12)");
  fade.addColorStop(1, "rgba(40,30,24,0.4)");
  g.fillStyle = fade;
  g.fillRect(0, 0, w, h);
  const r = rng(915);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = `rgba(50,40,30,${0.08 + r() * 0.12})`;
    g.fillRect(r() * w, r() * h, 3 + r() * 30, 2 + r() * 10);
  }
  g.fillStyle = "rgba(30,22,16,0.55)";
  g.fillRect(0, h - 8, w, 8);
  const tex = toTex(c, true, false);
  tex.wrapS = THREE.ClampToEdgeWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

function packetTex(seed) {
  const c = canvas(64, 96);
  const g = c.getContext("2d");
  const r = rng(seed);
  const body = r() > 0.5 ? "#e07a28" : (r() > 0.5 ? "#d6c04a" : "#c4473a");
  g.fillStyle = body;
  g.fillRect(0, 0, 64, 96);
  g.fillStyle = "rgba(255,244,220,0.85)";
  g.fillRect(8, 14, 48, 22);
  g.fillStyle = "rgba(40,20,12,0.35)";
  g.fillRect(10, 44, 44, 8);
  g.fillRect(12, 58, 40, 6);
  return toTex(c, true, false);
}

const AO_GLSL = `
float houseAO(vec3 p) {
  float ao = 1.0;
  float front = smoothstep(0.02, 0.45, p.z) * (1.0 - step(1.2, p.z));
  ao *= 1.0 - 0.55 * front;
  if (p.z < 0.8) {
    ao *= 1.0 - 0.45 * smoothstep(0.5, 0.0, ${S1.toFixed(2)} - p.y) * step(0.0, ${S1.toFixed(2)} - p.y);
    ao *= 1.0 - 0.28 * smoothstep(0.4, 0.0, ${S2.toFixed(2)} - p.y) * step(0.0, ${S2.toFixed(2)} - p.y);
    ao *= 1.0 - 0.28 * smoothstep(0.4, 0.0, ${S3.toFixed(2)} - p.y) * step(0.0, ${S3.toFixed(2)} - p.y);
    ao *= 1.0 - 0.4 * smoothstep(0.7, 0.0, ${ROOF.toFixed(2)} - p.y) * step(0.0, ${ROOF.toFixed(2)} - p.y);
  }
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.5, p.y);
  ao *= 1.0 - 0.72 * smoothstep(0.2, 1.3, p.z) * step(p.z, 2.0) * step(p.y, ${(S1 - 0.1).toFixed(2)});
  return ao;
}
`;

// Damp at the foot, soot streaks under each slab and the eave, patchy lime wash.
const GRIME_GLSL = `
float gh(float n) { return fract(sin(n * 91.7) * 43758.5453); }
float slabSoot(vec3 p, float top, float floorY, float streak) {
  return smoothstep(top - 0.9 - streak, top, p.y) * step(p.y, top) * step(floorY + 0.3, p.y);
}
float houseGrime(vec3 p) {
  float g = 1.0;
  float edge = 0.55 + 0.35 * gh(floor(p.x * 9.0)) + 0.12 * sin(p.x * 23.0);
  g *= 1.0 - 0.32 * smoothstep(edge, 0.0, p.y);
  float streak = gh(floor(p.x * 7.0) + 3.0);
  g *= 1.0 - 0.26 * slabSoot(p, ${S2.toFixed(2)}, ${S1.toFixed(2)}, streak);
  g *= 1.0 - 0.26 * slabSoot(p, ${S3.toFixed(2)}, ${S2.toFixed(2)}, streak);
  g *= 1.0 - 0.34 * slabSoot(p, ${ROOF.toFixed(2)}, ${S3.toFixed(2)}, streak * 0.8 + 0.4);
  g *= 0.92 + 0.08 * gh(floor(p.x * 2.3) + floor(p.y * 1.7) * 13.0);
  return g;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.5 + 0.5 * hao);
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
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;\n" + AO_GLSL + GRIME_GLSL);
    if (key === "brick" || key === "concrete") frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= houseGrime(vHousePos);");
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house015-maru-" + key; };
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
    roughness: o.rough == null ? 1 : o.rough,
    metalness: 0,
    aoMapIntensity: o.ao == null ? 0.35 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.28 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.8 : o.ns, o.ns == null ? 0.8 : o.ns);
  return m;
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
    const k = 0.9 + 0.1 * hash(x * 1.7, y * 1.3, z * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse015() {
  const root = new THREE.Group();
  root.name = "house-015";

  const shop = [{ x: 2.55, y: 1.22, w: 4.15, h: 2.2 }];
  const win2 = [{ x: 2.35, y: 3.85, w: 0.78, h: 1.12 }];
  const win3 = [{ x: 2.55, y: 6.42, w: 0.7, h: 1.02 }];

  const brickMaps = brickSet();
  const woodMaps = {
    diff: null, nor: null, arm: null,
  };
  const mats = {
    brick: pbr(brickMaps, 0xa69890, { ao: 0.45, ns: 0.9, env: 0.22 }),
    wood: new THREE.MeshStandardMaterial({ color: 0x6e5848, roughness: 0.86, metalness: 0, vertexColors: true }),
    woodDark: new THREE.MeshStandardMaterial({ color: 0x3e2e26, roughness: 0.9, metalness: 0, vertexColors: true }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x8a8178, roughness: 0.92, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x1a1f1e, roughness: 0.3, metalness: 0, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0x9a9690, roughness: 0.62, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x100c0b, roughness: 0.95, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.5, metalness: 0.15, vertexColors: true }),
    rail: new THREE.MeshStandardMaterial({ color: 0x3a3532, roughness: 0.45, metalness: 0.35, vertexColors: true }),
    awning: new THREE.MeshStandardMaterial({ map: awningTex(), color: 0xb4b0aa, roughness: 0.6, metalness: 0.1, side: THREE.DoubleSide }),
    packet: new THREE.MeshStandardMaterial({ map: packetTex(15), color: 0xa09890, roughness: 0.55, metalness: 0, side: THREE.DoubleSide }),
    packetB: new THREE.MeshStandardMaterial({ map: packetTex(44), color: 0xa09890, roughness: 0.55, metalness: 0, side: THREE.DoubleSide }),
  };
  for (const [name, mat] of Object.entries(mats)) {
    if (name === "awning" || name === "packet" || name === "packetB") continue;
    houseShader(mat, name);
  }
  void woodMaps;

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx, ry, rz);
    if (name === "brick") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }
  function wallX(name, z0, z1, y0, y1, xFace, tint) {
    const parts = cells(z0, z1, y0, y1, []);
    for (const part of parts) addBox(name, T, part.h, part.w, xFace, part.y, part.x, tint);
  }

  wallZ("brick", 0, W, 0, ROOF, 0, shop.concat(win2, win3));
  wallZ("brick", 0, W, 0, ROOF, D - T, []);
  wallX("brick", 0, D, 0, ROOF, T / 2);
  wallX("brick", 0, D, 0, ROOF, W - T / 2);
  addBox("concrete", W - 0.2, 0.08, D - 0.3, W / 2, 0.04, D / 2);
  addBox("dark", W - 0.5, 2.15, 0.08, W / 2, 1.15, 1.55);
  addBox("brick", W, 0.16, D, W / 2, ROOF - 0.08, D / 2);
  addBox("brick", W + 0.08, 0.38, 0.12, W / 2, ROOF + 0.14, 0.02);
  addBox("brick", 0.12, 0.34, D, 0.04, ROOF + 0.12, D / 2);
  addBox("brick", 0.12, 0.34, D, W - 0.04, ROOF + 0.12, D / 2);
  addBox("wood", W + 0.35, 0.08, 0.55, W / 2, ROOF + 0.02, -0.22, [0.85, 0.8, 0.72], 0.18);

  const frame = (x, y, w, h) => {
    const t = 0.055;
    addBox("woodDark", w + t * 2, t, 0.07, x, y + h / 2 + t / 2, -0.03);
    addBox("woodDark", w + t * 2, t, 0.07, x, y - h / 2 - t / 2, -0.03);
    addBox("woodDark", t, h, 0.07, x - w / 2 - t / 2, y, -0.03);
    addBox("woodDark", t, h, 0.07, x + w / 2 + t / 2, y, -0.03);
    addBox("glass", w - 0.02, h - 0.02, 0.02, x, y, 0.14);
    addBox("concrete", w + 0.16, 0.06, 0.12, x, y - h / 2 - 0.09, -0.05, [0.6, 0.56, 0.52]);
    addBox("woodDark", 0.02, h - 0.04, 0.025, x, y, 0.12);
    addBox("woodDark", w - 0.04, 0.02, 0.025, x, y, 0.12);
  };
  frame(2.35, 3.85, 0.78, 1.12);
  frame(2.55, 6.42, 0.7, 1.02);
  addBox("wood", 4.35, 0.1, 0.16, 2.55, S1 + 0.02, 0.02);

  const awning = new THREE.PlaneGeometry(4.45, 0.92, 96, 2);
  const ap = awning.attributes.position;
  for (let i = 0; i < ap.count; i++) {
    const x = ap.getX(i);
    const y = ap.getY(i);
    ap.setZ(i, Math.sin(x * 2 * Math.PI / 0.092) * 0.012 - (0.46 - y) * (0.46 - y) * 0.05 * (1 + 0.3 * Math.sin(x * 1.7)));
  }
  awning.computeVertexNormals();
  place(awning, 2.62, 2.62, -0.38, 0.32, 0, 0);
  const awningMesh = new THREE.Mesh(awning, mats.awning);
  awningMesh.castShadow = true;
  loose.push(awningMesh);
  addBox("wood", 4.5, 0.07, 0.1, 2.62, 2.78, -0.08);
  addBox("wood", 0.08, 0.16, 0.7, 0.5, 2.58, -0.32);
  addBox("wood", 0.08, 0.16, 0.7, 4.55, 2.58, -0.32);

  function balcony(y, x0, x1, depth) {
    const mid = (x0 + x1) / 2;
    const span = x1 - x0;
    addBox("concrete", span, 0.08, depth, mid, y, -depth / 2 + 0.04);
    addBox("rail", span, 0.035, 0.03, mid, y + 0.86, -depth + 0.06);
    addBox("rail", 0.03, 0.86, 0.03, x0 + 0.04, y + 0.46, -depth + 0.06);
    addBox("rail", 0.03, 0.86, 0.03, x1 - 0.04, y + 0.46, -depth + 0.06);
    const posts = Math.max(2, Math.round(span / 0.72));
    for (let i = 1; i < posts; i++) {
      const x = x0 + (span * i) / posts;
      addBox("rail", 0.025, 0.82, 0.025, x, y + 0.44, -depth + 0.06);
      if (i % 2 === 0) {
        const ring = place(new THREE.TorusGeometry(0.085, 0.011, 6, 10), x, y + 0.48, -depth + 0.02);
        add("rail", ring);
      }
    }
    addBox("rail", span - 0.1, 0.025, 0.02, mid, y + 0.42, -depth + 0.05);
  }
  balcony(S1, 0.45, 4.55, 0.62);
  balcony(S2, 0.38, 4.62, 0.7);

  addBox("goods", 0.52, 0.92, 0.42, 0.78, 0.5, 0.42, [0.72, 0.12, 0.1]);
  addBox("goods", 0.46, 0.62, 0.02, 0.78, 0.62, 0.2, [0.55, 0.12, 0.28]);
  addBox("goods", 0.16, 0.16, 0.16, 0.78, 1.04, 0.4, [0.85, 0.84, 0.8]);
  const bottleCols = [ [0.15, 0.45, 0.18], [0.85, 0.45, 0.12], [0.75, 0.82, 0.2], [0.9, 0.9, 0.86], [0.2, 0.55, 0.72] ];
  for (let i = 0; i < 8; i++) {
    const tint = bottleCols[i % bottleCols.length];
    const g = place(new THREE.CylinderGeometry(0.035, 0.04, 0.24, 7), 1.15 + (i % 4) * 0.11, 1.05, 0.36 + Math.floor(i / 4) * 0.12);
    add("goods", g, tint);
  }
  addBox("goods", 0.55, 0.9, 0.28, 1.55, 0.55, 0.48, [0.36, 0.16, 0.11]);
  addBox("glass", 0.5, 0.7, 0.02, 1.55, 0.62, 0.33);
  for (let i = 0; i < 6; i++) {
    const tint = bottleCols[i % bottleCols.length];
    add("goods", place(new THREE.CylinderGeometry(0.028, 0.032, 0.2, 6), 1.38 + (i % 3) * 0.1, 0.55, 0.5), tint);
  }

  const hang = (x, y, z, matName, tilt) => {
    const g = place(new THREE.PlaneGeometry(0.16, 0.34), x, y, z, tilt || 0.1, 0.2, 0.05);
    loose.push(new THREE.Mesh(g, mats[matName]));
  };
  for (let i = 0; i < 5; i++) hang(2.35 + i * 0.22, 1.85, 0.12 + (i % 2) * 0.06, i % 2 ? "packet" : "packetB", 0.08 + i * 0.02);
  for (let i = 0; i < 6; i++) {
    const a = -0.7 + i * 0.24;
    addBox("goods", 0.055, 0.24, 0.055, 4.05 + Math.sin(a) * 0.04, 2.02 - Math.abs(a) * 0.08, 0.06, [0.93, 0.8, 0.16], 0.15, 0, a);
  }

  const fr = rng(1515);
  const bunch = (bx, by, bz, n) => {
    addBox("wire", 0.012, 0.3, 0.012, bx, by + 0.18, bz, [0.6, 0.5, 0.4]);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const tier = i % 3;
      const yy = by - tier * 0.09;
      const tint = fr() < 0.3 ? [0.62, 0.6, 0.12] : [0.9, 0.68, 0.06];
      addBox("goods", 0.04, 0.17, 0.04, bx + Math.cos(a) * 0.07, yy, bz + Math.sin(a) * 0.07, tint, Math.sin(a) * 0.55, 0, -Math.cos(a) * 0.55);
    }
  };
  bunch(3.95, 2.0, -0.05, 12);
  bunch(4.3, 1.92, 0.02, 10);
  bunch(3.62, 1.95, 0.08, 11);
  bunch(4.05, 1.62, 0.12, 9);
  for (let i = 0; i < 4; i++) {
    const x = 2.75 + i * 0.16;
    const len = 0.7 + fr() * 0.35;
    add("goods", place(new THREE.CylinderGeometry(0.05, 0.035, len, 6), x, 2.32 - len / 2, 0.05 + (i % 2) * 0.07), [1.2, 0.5, 0.04]);
  }
  for (let k = 0; k < 2; k++) {
    for (let i = 0; i < 4; i++) hang(1.95 + k * 0.28, 2.15 - i * 0.3, 0.2 + k * 0.04, (i + k) % 2 ? "packet" : "packetB", 0.04);
  }
  addBox("wood", 3.8, 0.04, 0.32, 2.5, 1.0, 1.36, [0.7, 0.62, 0.55]);
  addBox("wood", 3.8, 0.04, 0.32, 2.5, 1.5, 1.36, [0.7, 0.62, 0.55]);
  const goodsCols = [[0.8, 0.2, 0.15], [0.9, 0.75, 0.2], [0.2, 0.45, 0.7], [0.85, 0.85, 0.8], [0.25, 0.55, 0.25], [0.9, 0.5, 0.15]];
  for (let k = 0; k < 2; k++) {
    let x = 0.8;
    while (x < 4.3) {
      const w = 0.1 + fr() * 0.18;
      const hgt = 0.14 + fr() * 0.22;
      addBox("goods", w, hgt, 0.18 + fr() * 0.08, x + w / 2, 1.02 + k * 0.5 + hgt / 2, 1.38, goodsCols[Math.floor(fr() * goodsCols.length)]);
      x += w + 0.02 + fr() * 0.05;
    }
  }

  addBox("concrete", 0.5, 0.32, 0.38, 0.42, 0.16, -0.28, [0.72, 0.66, 0.6]);
  addBox("concrete", 0.7, 0.14, 0.46, 0.7, 0.07, -0.55, [0.62, 0.56, 0.52]);

  function sag(a, b, drop, thick, seed) {
    const n = 8;
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      const t = (i + 0.5) / n;
      const p = a.clone().lerp(b, t);
      p.y -= Math.sin(Math.PI * t) * drop;
      const len = a.distanceTo(b) / n;
      addBox("wire", len * 1.04, thick, thick, p.x, p.y, p.z + (r() - 0.5) * 0.02, [0.75, 0.72, 0.66]);
    }
  }
  sag(new THREE.Vector3(0.15, 2.95, -0.08), new THREE.Vector3(4.8, 2.82, -0.12), 0.22, 0.012, 11);
  sag(new THREE.Vector3(0.2, 3.05, -0.05), new THREE.Vector3(4.7, 3.12, -0.1), 0.16, 0.008, 12);
  sag(new THREE.Vector3(0.3, 5.35, -0.06), new THREE.Vector3(4.6, 5.2, -0.1), 0.18, 0.01, 13);
  sag(new THREE.Vector3(0.4, 7.85, -0.04), new THREE.Vector3(4.5, 7.7, -0.08), 0.14, 0.008, 14);

  addBox("concrete", 0.7, 0.55, 0.7, 3.4, ROOF + 0.32, 6.2, [0.75, 0.78, 0.76]);
  addBox("concrete", 0.55, 0.08, 0.55, 3.4, ROOF + 0.62, 6.2, [0.55, 0.58, 0.56]);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    let geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) {
      const desc = list.slice(0, 6).map((g) => (g.index ? "i" : "n") + Object.keys(g.attributes).sort().join("+"));
      console.error("merge-fail", name, list.length, desc.join(" | "));
      continue;
    }
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass" && name !== "wire";
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
  root.userData.id = "015";
  return root;
}
