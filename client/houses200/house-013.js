// House 013. Sukra Path at the New Road gate, west face of OSM way 169429535, edge 3, 28.33 m.
// Spec: research/houses200/013/design.md
// Origin: front-left ground corner. +X runs south along the face, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// place.js yaw-180 puts authored x = 0 on photo-right (the south end). addBox mirrors x,
// so a small authored x is the north end: photo-left when the camera faces this wall.
// Still: pano P0wTXZyQwLGQawBcG_Lh7w, yaw 96. Copy that front. No people, no fence, no pole.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 28.33;
const D = 8.25;
const T = 0.22;
const ROOF = 7.2;
const OVERCAST = { dir: 0.48, spec: 0.28, ind: 1.45 };

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

function canvasTex(draw, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  draw(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) * 0.42, p.getY(i) * 0.42);
    else if (ax >= ay) uv.setXY(i, p.getZ(i) * 0.42, p.getY(i) * 0.42);
    else uv.setXY(i, p.getX(i) * 0.42, p.getZ(i) * 0.42);
  }
  return g;
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  if (p.z < 0.9) {
    ao *= 1.0 - 0.42 * smoothstep(0.45, 0.0, 3.15 - p.y) * step(0.0, 3.15 - p.y);
    ao *= 1.0 - 0.22 * smoothstep(0.35, 0.0, 6.35 - p.y) * step(0.0, 6.35 - p.y);
  }
  ao *= 0.78 + 0.22 * smoothstep(0.0, 0.35, p.y);
  ao *= 1.0 - 0.28 * smoothstep(0.12, 0.0, p.z);
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

// Plaster wear: damp at the foot, streaks under the valance and the gallery sill, mottling.
const GRIME_GLSL = `
vec3 q = vHousePos;
float col = fract(sin(floor(q.x * 9.0) * 91.7) * 4375.5);
float mott = 0.5 + 0.5 * sin(q.x * 2.7 + q.y * 1.9) * sin(q.x * 6.9 - q.y * 4.7 + q.z * 3.0);
float g = mix(0.7, 1.0, smoothstep(0.0, 0.9, q.y));
g *= 1.0 - 0.18 * col * smoothstep(3.1, 2.7, q.y) * smoothstep(1.6, 2.9, q.y);
g *= 1.0 - 0.14 * col * smoothstep(3.95, 3.6, q.y) * step(3.4, q.y);
g *= 0.93 + 0.1 * mott;
diffuseColor.rgb *= g;
`;

function houseShader(mat, key) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + AO_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    if (key === "plaster" || key === "plasterDark" || key === "yellow" || key === "orange") frag = frag.replace("#include <color_fragment>", "#include <color_fragment>" + String.fromCharCode(10) + GRIME_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house013-" + key; };
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
    roughness: o.rough == null ? 0.9 : o.rough,
    metalness: 0,
    aoMapIntensity: o.ao == null ? 0.32 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.18 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.45 : o.ns, o.ns == null ? 0.45 : o.ns);
  return m;
}

function cafeSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f4f1ea";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#8d1d22";
    g.lineWidth = 10;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#9a1c22";
    g.font = "bold 54px sans-serif";
    g.textAlign = "center";
    g.fillText("Revolution Cafe", w / 2, 78);
    g.fillStyle = "#2a211c";
    g.font = "28px sans-serif";
    g.fillText("Breakfast, Lunch & Dinner", w / 2, 128);
    g.font = "bold 26px sans-serif";
    g.fillStyle = "#6b3a22";
    g.fillText("Coffee", w / 2, 172);
  }, 640, 220);
}

function casioSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#1a1c1e";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#f2f4f6";
    g.font = "bold 64px sans-serif";
    g.textAlign = "center";
    g.fillText("CASIO", w / 2, h * 0.68);
  }, 512, 128);
}

function samsungSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#14285a";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#f4f7fb";
    g.font = "bold 48px sans-serif";
    g.textAlign = "center";
    g.fillText("SAMSUNG", w / 2, h * 0.68);
  }, 512, 96);
}

export function createHouse013() {
  const root = new THREE.Group();
  root.name = "house-013";

  // North (low X) to south (high X): juice, cloth, stripes, a cloth bay, Casio, Revolution Cafe.
  const groundHoles = [
    { x: 2.45, y: 1.42, w: 3.55, h: 2.55 },
    { x: 7.05, y: 1.38, w: 4.15, h: 2.45 },
    { x: 11.85, y: 1.4, w: 4.05, h: 2.5 },
    { x: 16.6, y: 1.36, w: 3.7, h: 2.4 },
    { x: 21.15, y: 1.4, w: 4.15, h: 2.5 },
    { x: 25.85, y: 1.38, w: 3.85, h: 2.45 },
  ];
  const archHoles = [];
  for (let i = 0; i < 8; i++) archHoles.push({ x: 2.15 + i * 3.4, y: 5.15, w: 2.15, h: 1.85 });

  const plasterMaps = {
    diff: tex("plastered_wall_Diffuse.jpg", true, 1.6, 0.8),
    nor: tex("plastered_wall_nor_gl.jpg", false, 1.6, 0.8),
    arm: tex("plastered_wall_arm.jpg", false, 1.6, 0.8),
  };
  const stoneMaps = {
    diff: tex("stone_tiles_02_Diffuse.jpg", true, 1.8, 0.7),
    nor: tex("stone_tiles_02_nor_gl.jpg", false, 1.8, 0.7),
    arm: tex("stone_tiles_02_arm.jpg", false, 1.8, 0.7),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 0.8, 0.35),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 0.8, 0.35),
    arm: tex("weathered_brown_planks_arm.jpg", false, 0.8, 0.35),
  };
  const roofMaps = {
    diff: tex("clay_roof_tiles_02_Diffuse.jpg", true, 3.2, 1.1),
    nor: tex("clay_roof_tiles_02_nor_gl.jpg", false, 3.2, 1.1),
    arm: tex("clay_roof_tiles_02_arm.jpg", false, 3.2, 1.1),
  };
  const mats = {
    plaster: pbr(plasterMaps, 0xf1ebe2, { ao: 0.3, ns: 0.35 }),
    plasterDark: pbr(plasterMaps, 0xc4a888, { ao: 0.38 }),
    orange: pbr(plasterMaps, 0xc46b3e, { ao: 0.34 }),
    stone: pbr(stoneMaps, 0x8a8682, { ao: 0.45, ns: 0.7 }),
    wood: pbr(woodMaps, 0x7a5a3c, { ao: 0.28, rough: 0.78 }),
    woodDark: pbr(woodMaps, 0x3c2a1e, { ao: 0.3, rough: 0.72 }),
    roof: pbr(roofMaps, 0x8a5840, { ao: 0.36, ns: 0.7 }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xefe3a4, roughness: 0.72, metalness: 0, vertexColors: true }),
    yellowEdge: new THREE.MeshStandardMaterial({ color: 0xc47a3a, roughness: 0.7, metalness: 0, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3e4644, roughness: 0.4, metalness: 0, transparent: true, opacity: 0.88, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x4a3d34, roughness: 0.9, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2c2824, roughness: 0.55, metalness: 0, vertexColors: true }),
    pot: new THREE.MeshStandardMaterial({ color: 0x8d4a32, roughness: 0.85, metalness: 0, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3d6a32, roughness: 0.75, metalness: 0, vertexColors: true }),
    cafe: new THREE.MeshStandardMaterial({ map: cafeSign(), roughness: 0.55, metalness: 0, vertexColors: true }),
    casio: new THREE.MeshStandardMaterial({ map: casioSign(), roughness: 0.4, metalness: 0, vertexColors: true }),
    samsung: new THREE.MeshStandardMaterial({ map: samsungSign(), roughness: 0.45, metalness: 0, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8a8680, roughness: 0.45, metalness: 0.35, vertexColors: true }),
    rail: new THREE.MeshStandardMaterial({ color: 0xb8643a, roughness: 0.6, metalness: 0.2, vertexColors: true }),
    tarp: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    lamp: new THREE.MeshStandardMaterial({ color: 0xf6f4ec, emissive: 0xe8ece8, emissiveIntensity: 0.55, roughness: 0.5, metalness: 0, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  function add(name, g, tint) {
    const rgb = tint || [1, 1, 1];
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const k = 0.9 + 0.1 * hash(p.getX(i), p.getY(i), p.getZ(i));
      c[i * 3] = rgb[0] * k;
      c[i * 3 + 1] = rgb[1] * k;
      c[i * 3 + 2] = rgb[2] * k;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), W - x, y, z);
    if (name === "plaster" || name === "plasterDark" || name === "orange" || name === "stone" || name === "roof") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }

  wallZ("plaster", 0, W, 0, 3.05, 0, groundHoles);
  wallZ("stone", 0, W, 3.85, 6.45, 0, archHoles, [0.96, 0.95, 0.92]);
  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2, [0.95, 0.9, 0.84]);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2, [0.92, 0.86, 0.8]);
  addBox("plasterDark", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  // Orange pier on the juice stall, north end.
  addBox("orange", 0.42, 3.05, 0.28, 0.28, 1.52, 0.02);

  // Pale yellow valance, brown trim, four peaked rises.
  addBox("yellow", W + 0.15, 0.34, 0.6, W / 2, 3.38, -0.3);
  addBox("orange", W + 0.2, 0.24, 0.66, W / 2, 3.1, -0.31, [1.05, 0.95, 0.9]);
  addBox("dark", W + 0.2, 0.03, 0.62, W / 2, 2.97, -0.3, [0.5, 0.45, 0.4]);
  const peaks = [3.2, 10.2, 17.2, 24.4];
  const sw = new THREE.Shape();
  sw.moveTo(-1.9, 0);
  sw.lineTo(1.9, 0);
  sw.lineTo(1.9, 0.06);
  sw.quadraticCurveTo(0.2, 0.06, 0.13, 1.12);
  sw.lineTo(-0.13, 1.12);
  sw.quadraticCurveTo(-0.2, 0.06, -1.9, 0.06);
  sw.closePath();
  for (const x of peaks) {
    const g = new THREE.ExtrudeGeometry(sw, { depth: 0.16, bevelEnabled: false, curveSegments: 10 });
    add("yellow", place(g, W - x, 3.54, -0.6));
    addBox("orange", 0.24, 1.32, 0.24, x, 4.14, -0.5, [1.05, 0.95, 0.9]);
    addBox("orange", 0.3, 0.06, 0.3, x, 4.82, -0.5, [0.9, 0.82, 0.78]);
    for (const s of [-1.75, 1.75]) {
      const disc = new THREE.CylinderGeometry(0.17, 0.17, 0.04, 14);
      add("orange", place(disc, W - (x + s), 3.82, -0.62, Math.PI / 2, 0, 0), [1.15, 0.95, 0.8]);
    }
  }

  // Balcony deck and rail just above the valance. Pots and a few palms.
  addBox("stone", W - 0.2, 0.1, 0.7, W / 2, 3.92, -0.22, [0.9, 0.88, 0.84]);
  addBox("rail", W - 0.3, 0.05, 0.05, W / 2, 4.62, -0.42);
  addBox("rail", W - 0.3, 0.03, 0.03, W / 2, 4.2, -0.42);
  for (let i = 0; i <= 28; i++) {
    const x = 0.4 + i * (W - 0.8) / 28;
    addBox("rail", 0.035, 0.95, 0.035, x, 4.12, -0.42);
  }
  for (let i = 0; i < 9; i++) {
    const x = 1.6 + i * 3.05;
    const pot = new THREE.CylinderGeometry(0.16, 0.12, 0.2, 7);
    add("pot", place(pot, W - x, 4.08, -0.28));
    if (i % 2 === 0) {
      addBox("leaf", 0.55, 0.08, 0.16, x, 4.42, -0.28, [0.45, 0.7, 0.32]);
      addBox("leaf", 0.16, 0.08, 0.5, x, 4.5, -0.3, [0.32, 0.58, 0.28]);
      addBox("leaf", 0.36, 0.28, 0.1, x + 0.12, 4.62, -0.26, [0.4, 0.66, 0.3]);
    }
  }

  // Gallery arches: wood posts, a raised head, dark glass set in the reveal.
  for (const hole of archHoles) {
    const x = hole.x;
    addBox("woodDark", 0.1, 1.95, 0.1, x - 1.12, 5.05, -0.04);
    addBox("woodDark", 0.1, 1.95, 0.1, x + 1.12, 5.05, -0.04);
    addBox("wood", 2.4, 0.1, 0.12, x, 5.95, -0.05);
    addBox("wood", 1.5, 0.1, 0.1, x, 6.12, -0.03);
    addBox("wood", 0.7, 0.08, 0.08, x, 6.24, -0.02);
    const ring = new THREE.TorusGeometry(0.78, 0.07, 5, 8, Math.PI);
    add("yellowEdge", place(ring, W - x, 5.45, -0.08, 0, 0, 0), [0.85, 0.62, 0.5]);
    addBox("woodDark", 1.95, 0.06, 0.06, x, 4.12, -0.06);
    addBox("glass", 1.9, 1.55, 0.03, x, 5.05, 0.06, [0.55, 0.58, 0.56]);
    addBox("dark", 1.7, 1.2, 0.4, x, 5.0, 0.35);
  }
  // Brackets under the eave.
  for (let i = 0; i < 9; i++) {
    const x = 1.1 + i * 3.2;
    addBox("wood", 0.08, 0.28, 0.22, x, 6.35, -0.02);
  }

  addBox("roof", W + 0.7, 0.16, 1.7, W / 2, 6.62, -0.42);
  addBox("plaster", W + 0.6, 0.03, 1.6, W / 2, 6.53, -0.42, [0.8, 0.74, 0.66]);
  addBox("roof", W + 0.35, 0.22, D + 0.4, W / 2, 6.95, D / 2 - 0.1);
  addBox("wood", 0.45, 0.7, 0.45, 4.2, 7.4, 3.6, [0.92, 0.9, 0.86]);
  // String of unlit bulbs under the eave. No lamps.
  for (let i = 0; i < 36; i++) {
    const x = 0.8 + i * 0.75;
    const t = (x % 3.2) / 3.2;
    addBox("dark", 0.05, 0.07, 0.05, x, 6.4 - Math.sin(Math.PI * t) * 0.18, -0.6, [0.25, 0.22, 0.18]);
  }

  function cloths(x, n, dyes) {
    for (let i = 0; i < n; i++) {
      const len = 0.7 + hash(x, i, 2) * 0.55;
      const dx = (i - (n - 1) / 2) * 0.22;
      const dye = dyes[i % dyes.length];
      addBox("cloth", 0.16, len, 0.02, x + dx, 2.55 - len / 2, -0.05 - (i % 2) * 0.03, dye);
    }
  }

  // Juice stall. Bottles on a shelf. No shop name was readable.
  addBox("dark", 3.2, 2.2, 0.55, 2.45, 1.25, 0.4);
  addBox("wood", 3.3, 0.08, 0.5, 2.45, 1.15, 0.15);
  const bottleDyes = [[0.85, 0.55, 0.15], [0.9, 0.25, 0.2], [0.95, 0.85, 0.3], [0.35, 0.62, 0.28]];
  for (let i = 0; i < 8; i++) {
    addBox("cloth", 0.1, 0.28, 0.1, 1.15 + i * 0.32, 1.35, 0.05, bottleDyes[i % 4]);
  }
  addBox("woodDark", 0.08, 2.55, 0.1, 0.7, 1.4, -0.02);
  addBox("woodDark", 0.08, 2.55, 0.1, 4.2, 1.4, -0.02);

  // Cloth shop, mannequin forms, a SAMSUNG strip on the pier.
  addBox("dark", 3.8, 2.15, 0.5, 7.05, 1.25, 0.38);
  cloths(6.4, 5, [[0.86, 0.82, 0.74], [0.55, 0.52, 0.5], [0.72, 0.28, 0.26]]);
  addBox("plaster", 0.28, 0.7, 0.22, 7.7, 1.15, 0.2, [0.82, 0.76, 0.7]);
  addBox("cloth", 0.26, 0.4, 0.08, 7.7, 1.45, 0.08, [0.75, 0.22, 0.28]);
  addBox("samsung", 1.15, 0.22, 0.03, 8.3, 2.55, -0.04);

  // Striped textiles and a green sheet. The partial word on the sheet was not readable.
  addBox("dark", 3.7, 2.15, 0.5, 11.85, 1.25, 0.38);
  cloths(11.4, 6, [[0.82, 0.28, 0.42], [0.25, 0.45, 0.72], [0.9, 0.78, 0.28], [0.85, 0.82, 0.78]]);
  addBox("cloth", 1.5, 0.85, 0.02, 12.6, 2.15, -0.08, [0.55, 0.75, 0.62]);

  // A bay under a pale sheet.
  addBox("dark", 3.3, 2.05, 0.45, 16.6, 1.22, 0.36);
  addBox("cloth", 2.6, 0.7, 0.02, 16.5, 2.35, -0.06, [0.9, 0.88, 0.84]);
  cloths(16.8, 4, [[0.78, 0.76, 0.74], [0.45, 0.28, 0.55]]);

  // Watch counter. CASIO on the case.
  addBox("dark", 3.8, 2.15, 0.55, 21.15, 1.25, 0.4);
  addBox("metal", 2.4, 1.15, 0.45, 21.0, 0.85, 0.12, [1.3, 1.3, 1.28]);
  addBox("glass", 2.2, 0.7, 0.06, 21.0, 1.05, -0.02, [0.7, 0.78, 0.8]);
  addBox("casio", 1.35, 0.32, 0.03, 21.0, 1.55, -0.05);
  const tarp1 = place(new THREE.PlaneGeometry(3.6, 1.15, 6, 2), W - 21.1, 2.4, -0.35, 0.28, Math.PI, 0);
  add("tarp", tarp1, [0.36, 0.45, 0.45]);
  // Lit glass display case with shelves of watches.
  addBox("lamp", 2.6, 0.04, 0.3, 21.0, 2.3, 0.5, [0.9, 0.92, 0.9]);
  for (const y of [0.55, 0.85, 1.25]) addBox("lamp", 2.2, 0.02, 0.35, 21.0, y, 0.1, [0.75, 0.74, 0.7]);
  for (let i = 0; i < 14; i++) addBox("metal", 0.06, 0.06, 0.02, 20.05 + i * 0.145, 0.62 + (i % 2) * 0.3, -0.06, [0.85, 0.8, 0.6]);
  addBox("woodDark", 0.08, 2.5, 0.1, 19.1, 1.35, -0.02);
  addBox("woodDark", 0.08, 2.5, 0.1, 23.2, 1.35, -0.02);

  // Revolution Cafe. The board is the readable one on this face.
  addBox("dark", 3.5, 2.1, 0.5, 25.85, 1.22, 0.38);
  addBox("wood", 1.6, 0.9, 0.4, 25.4, 0.7, 0.2, [0.55, 0.32, 0.24]);
  addBox("cafe", 1.7, 0.62, 0.04, 26.55, 2.55, -0.06);
  const tarp2 = place(new THREE.PlaneGeometry(3.7, 1.3, 6, 2), W - 25.6, 2.32, -0.38, 0.3, Math.PI, 0);
  add("tarp", tarp2, [0.16, 0.18, 0.32]);
  addBox("lamp", 2.6, 0.04, 0.3, 25.85, 2.3, 0.5, [0.9, 0.92, 0.9]);

  function wire(x0, x1, y, droop) {
    x0 = W - x0;
    x1 = W - x1;
    const pts = [];
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      pts.push(new THREE.Vector3(
        x0 + (x1 - x0) * t,
        y - Math.sin(Math.PI * t) * droop,
        -0.35 - Math.sin(Math.PI * t) * 0.12,
      ));
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, 0.012, 4, false);
    add("wire", g, [0.55, 0.52, 0.48]);
  }
  wire(0.4, 12.5, 4.7, 0.45);
  wire(2.0, 20.0, 5.6, 0.35);
  wire(8.0, 27.6, 4.35, 0.55);
  wire(14.0, 27.8, 6.15, 0.22);
  wire(0.8, 26.5, 3.55, 0.3);

  // Unseen sides: plain plaster, two dark windows each. No signs.
  for (const z of [2.2, 5.4]) {
    addBox("woodDark", 0.08, 1.15, 0.9, -0.02, z, D * 0.45);
    addBox("glass", 0.04, 0.95, 0.7, 0.02, z, D * 0.45, [0.4, 0.44, 0.42]);
    addBox("woodDark", 0.08, 1.15, 0.9, W + 0.02, z, D * 0.55);
    addBox("glass", 0.04, 0.95, 0.7, W - 0.02, z, D * 0.55, [0.4, 0.44, 0.42]);
  }

  for (const name of Object.keys(buckets)) {
    let list = buckets[name];
    if (list.some((g) => !g.index)) list = list.map((g) => (g.index ? g.toNonIndexed() : g));
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass";
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
  root.userData.id = "013";
  return root;
}
