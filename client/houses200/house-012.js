// House 012. West mouth of Makhan Galli, OSM way 1416452844, edge 0, 3.95 m.
// Spec: research/houses200/012/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. addBox mirrors X so photo-left stays high X after place.js yaw-180.
// Still: pano NPp42vabJlyDf0HBWr60LQ, yaw 110, pitch 0, fov 55. Copy that frame.
// Two storeys. Open sandal-and-jewelry shop. Three casements with cloth figures.
// No lettered sign: the still has none. Sides and roof are unseen.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 3.95;
const D = 5.51;
const T = 0.2;
const ROOF = 6.15;
const OVERCAST = { dir: 0.6, spec: 0.3, ind: 1.3 };

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

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) * 0.55, p.getY(i) * 0.55);
    else if (ax >= ay) uv.setXY(i, p.getZ(i) * 0.55, p.getY(i) * 0.55);
    else uv.setXY(i, p.getX(i) * 0.55, p.getZ(i) * 0.55);
  }
  return g;
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  if (p.z < 0.85) {
    ao *= 1.0 - 0.42 * smoothstep(0.45, 0.0, 2.72 - p.y) * step(0.0, 2.72 - p.y);
    ao *= 1.0 - 0.22 * smoothstep(0.3, 0.0, 3.35 - p.y) * step(0.0, 3.35 - p.y);
  }
  ao *= 0.78 + 0.22 * smoothstep(0.0, 0.45, p.y);
  // Inside the shop and the upper room: darker the deeper it sits.
  if (p.x > 0.19 && p.x < ${(W - 0.19).toFixed(2)} && p.z > 0.04 && p.z < ${(D - 0.21).toFixed(2)}) {
    ao *= 0.4 + 0.6 * smoothstep(1.5, 0.0, p.z);
    if (p.x < 0.25 || p.x > ${(W - 0.25).toFixed(2)}) ao *= 0.75;
  }
  return ao;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.2 + 0.8 * hao);
reflectedLight.directSpecular *= ${OVERCAST.spec.toFixed(3)} * hao;
reflectedLight.indirectDiffuse *= ${OVERCAST.ind.toFixed(3)} * hao;
reflectedLight.indirectSpecular *= hao;
`;

// Plaster wear: grimy base, rain streaks under sills and cornice, soft mottling.
const GRIME_GLSL = `
{
  vec3 q = vHousePos;
  float col = fract(sin(floor(q.x * 11.0) * 91.7) * 4375.5);
  float mott = 0.5 + 0.5 * sin(q.x * 3.1 + q.y * 2.3) * sin(q.x * 7.7 - q.y * 5.3 + q.z * 4.0);
  float g = mix(0.74, 1.0, smoothstep(0.05, 1.0, q.y));
  g *= 1.0 - 0.16 * col * smoothstep(3.5, 3.3, q.y) * smoothstep(3.0, 3.3, q.y);
  g *= 1.0 - 0.12 * col * smoothstep(5.55, 5.3, q.y) * smoothstep(4.4, 5.3, q.y);
  g *= 0.95 + 0.07 * mott;
  diffuseColor.rgb *= g * vec3(1.3, 1.25, 1.12);
}
`;

function houseShader(mat, key) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + AO_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    if (key === "plaster" || key === "plasterDark") frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\n" + GRIME_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house012-" + key; };
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
    roughness: o.rough == null ? 0.92 : o.rough,
    metalness: 0,
    aoMapIntensity: o.ao == null ? 0.34 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.18 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.45 : o.ns, o.ns == null ? 0.45 : o.ns);
  return m;
}

export function createHouse012() {
  const root = new THREE.Group();
  root.name = "house-012";

  const plasterMaps = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 1.1, 1.6),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 1.1, 1.6),
    arm: tex("concrete_wall_001_arm.jpg", false, 1.1, 1.6),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 0.6, 0.4),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 0.6, 0.4),
    arm: tex("weathered_brown_planks_arm.jpg", false, 0.6, 0.4),
  };
  const mats = {
    plaster: pbr(plasterMaps, 0xfff2e0, { ao: 0.28, ns: 0.35 }),
    plasterDark: pbr(plasterMaps, 0xd8ccbc, { ao: 0.4 }),
    wood: pbr(woodMaps, 0xc8b8aa, { ao: 0.26, rough: 0.84 }),
    woodDark: pbr(woodMaps, 0x6a5a4e, { ao: 0.3 }),
    frame: new THREE.MeshStandardMaterial({ color: 0xd9cfc6, roughness: 0.72, metalness: 0, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xf7f4ef, roughness: 0.92, metalness: 0, vertexColors: true }),
    red: new THREE.MeshStandardMaterial({ color: 0x9a3040, roughness: 0.78, metalness: 0, vertexColors: true }),
    gold: new THREE.MeshStandardMaterial({ color: 0xc6a15a, roughness: 0.45, metalness: 0.15, vertexColors: true }),
    shoe: new THREE.MeshStandardMaterial({ color: 0xa86838, roughness: 0.7, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0xd5ddd8, roughness: 0.12, metalness: 0, transparent: true, opacity: 0.14, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x161310, roughness: 0.95, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.62, metalness: 0, vertexColors: true }),
    stone: new THREE.MeshStandardMaterial({ color: 0xc8c2b6, roughness: 0.9, metalness: 0, vertexColors: true }),
    counter: new THREE.MeshStandardMaterial({ color: 0xe7d7c4, roughness: 0.82, metalness: 0, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0xece6f0, roughness: 0.7, metalness: 0, vertexColors: true }),
    pane: new THREE.MeshStandardMaterial({ color: 0x8e9aa2, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.55, vertexColors: true, envMapIntensity: 0.6 }),
    iron: new THREE.MeshStandardMaterial({ color: 0x1c1a19, roughness: 0.55, metalness: 0.3, vertexColors: true }),
    bangle: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4, metalness: 0.1, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  function add(name, g, tint) {
    const rgb = tint || [1, 1, 1];
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const k = 0.93 + 0.07 * hash(p.getX(i), p.getY(i), p.getZ(i));
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
    if (name === "plaster" || name === "plasterDark" || name === "stone") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }

  const ground = [
    { x: 0.82, y: 1.32, w: 1.12, h: 2.2 },
    { x: 1.98, y: 1.36, w: 0.92, h: 2.28 },
    { x: 3.14, y: 1.32, w: 1.12, h: 2.2 },
  ];
  const upper = [
    { x: 0.78, y: 4.38, w: 0.86, h: 1.72 },
    { x: 1.97, y: 4.38, w: 0.86, h: 1.72 },
    { x: 3.16, y: 4.38, w: 0.86, h: 1.72 },
  ];

  wallZ("plasterDark", 0, W, 0, 0.42, 0, [], [0.82, 0.78, 0.72]);
  wallZ("plaster", 0, W, 0.42, 2.72, 0, ground);
  wallZ("plaster", 0, W, 2.72, 3.22, 0, [], [0.98, 0.94, 0.9]);
  wallZ("plaster", 0, W, 3.22, 5.55, 0, upper, [1.02, 0.99, 0.96]);
  wallZ("plaster", 0, W, 5.55, ROOF, 0, [], [0.96, 0.93, 0.9]);

  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2, [0.94, 0.9, 0.86]);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2);
  addBox("plasterDark", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("stone", W - 0.2, 0.1, D - 0.3, W / 2, ROOF + 0.02, D / 2, [0.78, 0.75, 0.7]);
  addBox("plaster", W + 0.04, 0.16, 0.22, W / 2, 5.62, -0.04, [0.9, 0.86, 0.82]);

  // Free-form parts in design X (photo-left = low x), mirrored like addBox.
  function addGeo(name, g, x, y, z, rx, ry, rz, tint) {
    place(g, W - x, y, z, rx, ry, rz);
    add(name, g, tint);
  }
  // Box turned about Y, given its centre in design X.
  function addRot(name, w, h, d, x, y, z, ry, tint) {
    addGeo(name, boxGeo(w, h, d), x, y, z, 0, ry, 0, tint);
  }

  function frame(x, y, w, h, z) {
    addBox("frame", 0.07, h + 0.1, 0.09, x - w / 2 - 0.01, y, z, [0.96, 0.94, 0.97]);
    addBox("frame", 0.07, h + 0.1, 0.09, x + w / 2 + 0.01, y, z, [0.96, 0.94, 0.97]);
    addBox("frame", w + 0.1, 0.08, 0.09, x, y + h / 2, z, [0.97, 0.95, 0.98]);
    addBox("plaster", w + 0.16, 0.07, 0.24, x, y - h / 2 - 0.03, z - 0.06, [0.9, 0.87, 0.83]);
    addBox("plaster", w + 0.22, 0.07, 0.14, x, y + h / 2 + 0.1, z - 0.04, [0.96, 0.93, 0.89]);
  }

  // One casement leaf, hinged on a jamb, swung out toward the street by ang.
  function leaf(hx, y, w, h, dir, ang) {
    const z0 = -0.065;
    const ca = Math.cos(ang);
    const sa = Math.sin(ang);
    const ry = Math.atan2(sa, -dir * ca);
    const at = (u) => [hx + dir * u * ca, z0 - u * sa];
    const piece = (name, pw, ph, u, py, tint) => {
      const [x, z] = at(u);
      addRot(name, pw, ph, name === "pane" ? 0.008 : 0.035, x, py, z, ry, tint);
    };
    const st = 0.05;
    piece("leaf", st, h, st / 2, y);
    piece("leaf", st, h, w - st / 2, y);
    for (let k = 0; k <= 4; k++) {
      const py = y - h / 2 + 0.03 + k * (h - 0.06) / 4;
      piece("leaf", w - 2 * st, k === 0 || k === 4 ? 0.07 : 0.035, w / 2, py);
    }
    for (let k = 0; k < 4; k++) {
      const py = y - h / 2 + 0.03 + (k + 0.5) * (h - 0.06) / 4;
      piece("pane", w - 2 * st, (h - 0.06) / 4 - 0.04, w / 2, py, [0.92 + 0.08 * hash(hx, k, 1), 0.95, 1]);
    }
  }

  // Shop dummy with a draped shawl; lower is the garment below the shawl.
  function figure(x, z, y0, shawl, lower) {
    addGeo("cloth", new THREE.CylinderGeometry(0.075, 0.1, 0.62, 8, 1, true), x, y0 + 0.31, z, 0, 0, 0, lower);
    addGeo("cloth", new THREE.CylinderGeometry(0.14, 0.23, 0.78, 10), x, y0 + 0.98, z, 0, 0, 0, shawl);
    addGeo("cloth", new THREE.SphereGeometry(0.15, 10, 4, 0, Math.PI * 2, 0, Math.PI / 2), x, y0 + 1.36, z, 0, 0, 0, shawl);
    addGeo("cloth", new THREE.CylinderGeometry(0.04, 0.045, 0.1, 6), x, y0 + 1.53, z, 0, 0, 0, [0.95, 0.93, 0.9]);
    addGeo("cloth", new THREE.SphereGeometry(0.095, 10, 7), x, y0 + 1.66, z, 0, 0, 0, [0.96, 0.95, 0.93]);
  }

  // Upper room behind the casements: floor, back wall, ceiling.
  addBox("woodDark", W - 2 * T, 0.06, 1.6, W / 2, 3.25, 0.98, [0.7, 0.62, 0.55]);
  addBox("plasterDark", W - 2 * T, 2.3, 0.06, W / 2, 4.4, 1.78, [0.62, 0.56, 0.5]);
  addBox("plasterDark", W - 2 * T, 0.06, 1.6, W / 2, 5.52, 0.98, [0.7, 0.65, 0.6]);

  upper.forEach((hole, i) => {
    frame(hole.x, hole.y, hole.w, hole.h, -0.02);
    const lw = hole.w / 2;
    const ang = i === 0 ? 0 : 1.25 + 0.15 * i;
    leaf(hole.x - hole.w / 2, hole.y, lw, hole.h, 1, ang);
    leaf(hole.x + hole.w / 2, hole.y, lw, hole.h, -1, ang);
    const y0 = hole.y - hole.h / 2;
    if (i === 0) figure(hole.x, 0.42, y0, [0.86, 0.74, 0.52], [0.84, 0.72, 0.5]);
    else figure(hole.x, 0.34, y0, [1.0, 0.99, 0.97], i === 2 ? [0.82, 0.2, 0.36] : [0.96, 0.95, 0.93]);
    if (i === 0) return;
    // Black iron rail across the open casements.
    addBox("iron", hole.w, 0.035, 0.035, hole.x, y0 + 0.86, -0.03);
    addBox("iron", hole.w, 0.03, 0.03, hole.x, y0 + 0.1, -0.03);
    for (let k = 1; k < 8; k++) addBox("iron", 0.014, 0.76, 0.014, hole.x - hole.w / 2 + k * hole.w / 8, y0 + 0.48, -0.03);
  });

  for (const x of [0.16, 0.28, 1.4, 1.52, 2.42, 2.54, 3.66, 3.78]) {
    addBox("plaster", 0.04, 2.1, 0.03, x, 4.35, -0.018, [0.93, 0.9, 0.86]);
  }

  // Deep cream fascia over the shop, soffit darker.
  addBox("plaster", W + 0.06, 0.36, 0.58, W / 2, 2.88, -0.27, [0.97, 0.94, 0.88]);
  addBox("plasterDark", W + 0.02, 0.02, 0.54, W / 2, 2.695, -0.27, [0.7, 0.66, 0.6]);
  addBox("plaster", W + 0.1, 0.05, 0.62, W / 2, 3.075, -0.28, [0.88, 0.85, 0.8]);

  // Shop interior: tiled floor, ceiling, back wall.
  addBox("counter", W - 2 * T, 0.04, 2.2, W / 2, 0.2, 1.2, [0.95, 0.92, 0.85]);
  for (let i = 1; i < 6; i++) addBox("plasterDark", W - 2 * T, 0.004, 0.012, W / 2, 0.222, 0.2 + i * 0.36, [0.7, 0.66, 0.6]);
  addBox("plasterDark", W - 2 * T, 0.06, 2.2, W / 2, 2.62, 1.2, [0.78, 0.74, 0.68]);
  addBox("plasterDark", W - 2 * T, 2.4, 0.06, W / 2, 1.42, 2.3, [0.8, 0.76, 0.7]);

  // Left bay: bangle racks on the back and side walls, glass case below.
  const bangles = [[0.78, 0.16, 0.12], [0.9, 0.36, 0.1], [0.62, 0.1, 0.12], [0.86, 0.62, 0.2], [0.95, 0.5, 0.16], [0.55, 0.12, 0.2]];
  addBox("wood", 1.2, 1.45, 0.04, 0.82, 1.72, 2.25, [0.9, 0.84, 0.76]);
  for (let row = 0; row < 6; row++) {
    const y = 1.08 + row * 0.24;
    addBox("counter", 1.2, 0.02, 0.16, 0.82, y - 0.08, 2.18, [0.98, 0.96, 0.92]);
    addBox("counter", 0.16, 0.02, 1.7, 0.29, y - 0.08, 1.15, [0.98, 0.96, 0.92]);
    for (let col = 0; col < 9; col++) {
      const t = bangles[Math.floor(hash(col, row, 2) * bangles.length)];
      addBox("bangle", 0.1, 0.13, 0.07, 0.3 + col * 0.13, y, 2.17, t);
    }
    for (let col = 0; col < 12; col++) {
      const t = bangles[Math.floor(hash(col, row, 5) * bangles.length)];
      addBox("bangle", 0.07, 0.13, 0.1, 0.28, y, 0.42 + col * 0.14, t);
    }
  }
  addBox("counter", 1.1, 0.62, 0.5, 0.82, 0.53, 0.75, [0.96, 0.93, 0.88]);
  addBox("glass", 1.1, 0.02, 0.5, 0.82, 0.85, 0.75);
  for (let k = 0; k < 5; k++) addBox("gold", 0.12, 0.04, 0.12, 0.42 + k * 0.2, 0.88, 0.75, [0.95, 0.78, 0.38]);

  // Centre and right bays: red velvet back wall hung with necklace pads.
  addBox("red", 2.3, 1.5, 0.04, 2.6, 1.72, 2.24, [0.62, 0.1, 0.12]);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 7; col++) {
      const x = 1.62 + col * 0.31;
      const y = 1.18 + row * 0.36;
      addBox("red", 0.24, 0.3, 0.04, x, y, 2.19, [0.82, 0.14, 0.18]);
      const neck = new THREE.TorusGeometry(0.07, 0.006, 3, 10, Math.PI);
      addGeo("gold", neck, x, y + 0.08, 2.165, 0, 0, Math.PI, [0.98, 0.8, 0.36]);
      addBox("gold", 0.035, 0.05, 0.015, x, y - 0.02, 2.162, [0.98, 0.8, 0.36]);
    }
  }
  // Glass display case in the centre, panelled cream counter at the front right.
  addBox("counter", 0.78, 0.5, 0.45, 1.98, 0.47, 1.1, [0.95, 0.92, 0.86]);
  addBox("glass", 0.78, 0.55, 0.45, 1.98, 0.995, 1.1);
  for (let k = 0; k < 6; k++) addBox("red", 0.1, 0.1, 0.03, 1.68 + (k % 3) * 0.3, 0.84 + ((k / 3) | 0) * 0.24, 1.1, [0.8, 0.15, 0.18]);
  addBox("counter", 1.08, 0.88, 0.42, 3.14, 0.64, 0.3, [0.97, 0.94, 0.86]);
  addBox("counter", 1.12, 0.04, 0.46, 3.14, 1.1, 0.3, [0.92, 0.88, 0.8]);
  for (let k = 0; k < 6; k++) addBox("plasterDark", 0.012, 0.8, 0.01, 2.66 + k * 0.19, 0.64, 0.085, [0.72, 0.68, 0.6]);
  addBox("gold", 0.3, 0.22, 0.04, 3.4, 1.23, 0.36, [0.95, 0.78, 0.38]);
  addBox("dark", 0.18, 0.2, 0.12, 2.9, 1.22, 0.38, [0.5, 0.48, 0.46]);

  addBox("stone", W + 0.08, 0.1, 0.55, W / 2, 0.05, -0.22, [0.72, 0.7, 0.64]);
  addBox("stone", W + 0.04, 0.1, 0.25, W / 2, 0.15, -0.1, [0.78, 0.76, 0.7]);
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    const ang = t * Math.PI * 0.5;
    const rad = 0.28;
    addBox("stone", 0.1, 0.16, 0.1, W - 0.08 - Math.sin(ang) * rad, 0.1, -0.02 - (1 - Math.cos(ang)) * rad, [0.7, 0.68, 0.62]);
  }

  // Wire bundle: a dozen cables lying along the fascia, the loose ones looping down at photo-right.
  function cable(pts, r) {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(W - x, y, z))), 18, r, 4, false);
    add("wire", g, [0.15, 0.14, 0.12]);
  }
  for (let i = 0; i < 12; i++) {
    const h = hash(i, 7, 3);
    const y = 3.13 + (i % 4) * 0.025 + h * 0.03;
    const z = -0.52 - (i % 3) * 0.035 - h * 0.03;
    const sag = 0.03 + 0.09 * hash(i, 1, 9);
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = k / 6;
      pts.push([-0.1 + t * (W + 0.1), y - Math.sin(Math.PI * t) * sag + 0.02 * Math.sin(t * 9 + i), z - 0.02 * Math.cos(t * 7 + i)]);
    }
    if (i % 3 === 0) {
      const drop = 0.7 + 0.5 * h;
      pts.push([W + 0.06, y - drop * 0.5, z - 0.08], [W + 0.02, y - drop, z - 0.12], [W - 0.2, y - drop * 0.75, z - 0.1], [W - 0.35, y - 0.1, z - 0.05]);
    }
    cable(pts, 0.012 + 0.008 * hash(i, 3, 3));
  }

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass" && name !== "pane";
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
  root.userData.id = "012";
  return root;
}
