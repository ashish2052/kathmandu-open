// House 003. Himalaya Weave, an older Newari brick house with a pashmina shop.
// Spec: research/houses200/003/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face of the ground floor is z = 0. Overhangs use negative Z.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 6.4;
const D = 7.1;
const T = 0.22;
const CX = 2.45;

const GF = { y0: 0, y1: 3.25, z: 0, mat: "brick" };
const F1 = { y0: 3.25, y1: 6.45, z: -0.18, mat: "brick" };
const F2 = { y0: 6.45, y1: 9.25, z: -0.55, mat: "brick" };
const F3 = { y0: 9.25, y1: 11.55, z: -0.12, mat: "plasterCream" };
const LEVELS = [GF, F1, F2, F3];
const COLS = [0.28, 4.55, 6.12];

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

function makeGrime() {
  const w = 1024;
  const h = 1536;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#e4dcd0";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 3500; i++) {
    const x = hash(i, 1.3, 2) * w;
    const y = hash(i, 4, 8) * h;
    const k = hash(i, 9, 1);
    g.fillStyle = k > 0.55 ? "rgba(72,54,40,0.22)" : "rgba(255,250,240,0.18)";
    g.fillRect(x, y, 2 + k * 5, 2 + k * 4);
  }
  const damp = g.createLinearGradient(0, h * 0.72, 0, h);
  damp.addColorStop(0, "rgba(62,48,36,0)");
  damp.addColorStop(0.45, "rgba(62,48,36,0.32)");
  damp.addColorStop(1, "rgba(48,38,30,0.62)");
  g.fillStyle = damp;
  g.fillRect(0, h * 0.72, w, h * 0.28);
  const soot = g.createLinearGradient(0, 0, 0, h * 0.2);
  soot.addColorStop(0, "rgba(40,32,26,0.5)");
  soot.addColorStop(1, "rgba(40,32,26,0)");
  g.fillStyle = soot;
  g.fillRect(0, 0, w, h * 0.2);
  g.filter = "blur(2px)";
  const bands = [3.25, 6.45, 9.25, 11.55];
  for (const hy of bands) {
    const cy = h * (1 - hy / 13.8);
    g.fillStyle = "rgba(48,38,30,0.45)";
    g.fillRect(0, cy - 7, w, 18);
    for (let i = 0; i < 36; i++) {
      const x = hash(hy, i, 3) * w;
      const len = 30 + hash(i, hy, 6) * 160;
      g.strokeStyle = "rgba(55,42,32," + (0.25 + hash(i, hy, 2) * 0.4) + ")";
      g.lineWidth = 1 + (i % 3);
      g.beginPath();
      g.moveTo(x, cy);
      g.lineTo(x + (hash(i, 7, hy) - 0.5) * 18, cy + len);
      g.stroke();
    }
  }
  for (let i = 0; i < 160; i++) {
    const x = hash(i, 11, 4) * w;
    const y0 = hash(i, 12, 5) * h * 0.75;
    const len = 50 + hash(i, 13, 6) * 320;
    g.strokeStyle = "rgba(36,26,18," + (0.1 + hash(i, 14, 7) * 0.22) + ")";
    g.lineWidth = 4 + hash(i, 15, 8) * 12;
    g.beginPath();
    g.moveTo(x, y0);
    g.lineTo(x + (hash(i, 16, 9) - 0.5) * 22, y0 + len);
    g.stroke();
  }
  g.filter = "none";
  for (let i = 0; i < 16; i++) {
    g.fillStyle = "rgba(42,58,36,0.34)";
    g.beginPath();
    g.ellipse(hash(i, 20, 1) * w, h * (0.72 + hash(i, 21, 2) * 0.24), 18 + hash(i, 22, 3) * 55, 8 + hash(i, 23, 4) * 22, 0, 0, 6.3);
    g.fill();
  }
  for (let i = 0; i < 12; i++) {
    g.fillStyle = "rgba(236,226,208,0.5)";
    g.beginPath();
    g.ellipse(hash(i, 30, 5) * w, hash(i, 31, 6) * h * 0.7, 16 + hash(i, 32, 7) * 48, 8 + hash(i, 33, 8) * 20, hash(i, 34, 9) * 1.2, 0, 6.3);
    g.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.anisotropy = 4;
  return t;
}

function bindGrime(mat, grimeTex, strength) {
  const s = strength.toFixed(2);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.grimeMap = { value: grimeTex };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform sampler2D grimeMap;\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <color_fragment>", "#include <color_fragment>\n" +
        "float ax = abs(vHouseN.x);\nfloat ay = abs(vHouseN.y);\nfloat az = abs(vHouseN.z);\n" +
        "float gu = (ax > az && ax > ay) ? clamp(vHousePos.z / 7.6, 0.0, 1.0) : clamp((vHousePos.x + 0.8) / 7.6, 0.0, 1.0);\n" +
        "float gv = (ay > 0.72) ? clamp(vHousePos.z / 7.6, 0.0, 1.0) : clamp(vHousePos.y / 13.8, 0.0, 1.0);\n" +
        "vec3 grime = texture2D(grimeMap, vec2(gu, gv)).rgb;\n" +
        "diffuseColor.rgb *= mix(vec3(1.0), grime, " + s + ");");
  };
  mat.customProgramCacheKey = function () { return "house003-grime-" + s; };
}

function pbr(maps, color, opts) {
  const o = opts || {};
  const m = new THREE.MeshStandardMaterial({
    color,
    map: maps.diff || null,
    normalMap: maps.nor || null,
    roughnessMap: maps.arm || null,
    aoMap: maps.arm || null,
    metalnessMap: o.metal ? maps.arm : null,
    roughness: 1,
    metalness: o.metal ? 1 : 0,
    aoMapIntensity: o.ao == null ? 0.4 : o.ao,
    vertexColors: true,
    envMapIntensity: 0.7,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 1 : o.ns, o.ns == null ? 1 : o.ns);
  return m;
}

function makeMaterials(grimeTex) {
  const plaster = {
    diff: tex("plastered_wall_Diffuse.jpg", true, 0.5, 0.5),
    nor: tex("plastered_wall_nor_gl.jpg", false, 0.5, 0.5),
    arm: tex("plastered_wall_arm.jpg", false, 0.5, 0.5),
  };
  const brick = {
    diff: tex("brick_wall_006_Diffuse.jpg", true, 0.42, 0.42),
    nor: tex("brick_wall_006_nor_gl.jpg", false, 0.42, 0.42),
    arm: tex("brick_wall_006_arm.jpg", false, 0.42, 0.42),
  };
  const concrete = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 0.7, 0.7),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 0.7, 0.7),
    arm: tex("concrete_wall_001_arm.jpg", false, 0.7, 0.7),
  };
  const wood = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.2, 1.2),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.2, 1.2),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.2, 1.2),
  };
  const plate = {
    diff: tex("metal_plate_Diffuse.jpg", true, 1.4, 1.4),
    nor: tex("metal_plate_nor_gl.jpg", false, 1.4, 1.4),
    arm: tex("metal_plate_arm.jpg", false, 1.4, 1.4),
  };
  const rust = {
    diff: tex("rusty_metal_Diffuse.jpg", true, 1.3, 1.3),
    nor: tex("rusty_metal_nor_gl.jpg", false, 1.3, 1.3),
    arm: tex("rusty_metal_arm.jpg", false, 1.3, 1.3),
  };
  const tile = {
    diff: tex("clay_roof_tiles_02_Diffuse.jpg", true, 0.55, 0.55),
    nor: tex("clay_roof_tiles_02_nor_gl.jpg", false, 0.55, 0.55),
    arm: tex("clay_roof_tiles_02_arm.jpg", false, 0.55, 0.55),
  };
  const mats = {
    brick: pbr(brick, 0xf0d6c8, { ao: 0.55 }),
    brickDark: pbr(brick, 0xc98978, { ao: 0.4 }),
    brickNew: pbr(brick, 0xffd0c0, { ao: 0.32 }),
    plasterCream: pbr(plaster, 0xe7d7c0, { ao: 0.45, ns: 0.9 }),
    plasterGhost: pbr(plaster, 0xd8c4a0, { ao: 0.35, ns: 0.8 }),
    plasterSalt: pbr(plaster, 0xf4efe4, { ao: 0.2, ns: 0.4 }),
    concrete: pbr(concrete, 0xcfc8bc, { ao: 0.32 }),
    wood: pbr(wood, 0x8a6a4e, { ao: 0.28 }),
    woodDark: pbr(wood, 0x3d3128, { ao: 0.22 }),
    tile: pbr(tile, 0xd8a07a, { ao: 0.4 }),
    plate: pbr(plate, 0xffffff, { ao: 0.2, metal: true, ns: 0.7 }),
    rust: pbr(rust, 0xffffff, { ao: 0.25, metal: true }),
    stain: new THREE.MeshStandardMaterial({ color: 0x3e352e, roughness: 0.96, metalness: 0, vertexColors: true, transparent: true, opacity: 0.42, depthWrite: false }),
    steel: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.65, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x8eafc2, roughness: 0.14, metalness: 0.55, envMapIntensity: 1.3, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a120e, roughness: 0.8, metalness: 0, vertexColors: true }),
    face: new THREE.MeshStandardMaterial({ color: 0x6e5038, roughness: 0.82, metalness: 0, vertexColors: true }),
    pot: new THREE.MeshStandardMaterial({ color: 0x8a4e32, roughness: 0.86, metalness: 0, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3d6a34, roughness: 0.8, metalness: 0, vertexColors: true }),
    tank: new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 0.55, metalness: 0.05, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xb8b8b8, roughness: 0.95, metalness: 0, envMapIntensity: 0.35, side: THREE.DoubleSide, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb060, emissiveIntensity: 0.7, roughness: 0.4 }),
    dish: null,
  };
  const dish = pbr(plate, 0xd5d8de, { ao: 0.22, metal: true, ns: 0.65 });
  dish.side = THREE.DoubleSide;
  dish.envMapIntensity = 1.1;
  mats.dish = dish;
  bindGrime(mats.brick, grimeTex, 0.96);
  bindGrime(mats.brickDark, grimeTex, 0.96);
  bindGrime(mats.brickNew, grimeTex, 0.7);
  bindGrime(mats.plasterCream, grimeTex, 0.78);
  bindGrime(mats.plasterGhost, grimeTex, 0.88);
  bindGrime(mats.concrete, grimeTex, 0.5);
  bindGrime(mats.tile, grimeTex, 0.4);
  bindGrime(mats.wood, grimeTex, 0.28);
  bindGrime(mats.woodDark, grimeTex, 0.22);
  return mats;
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.9 + 0.1 * hash(x * 2.2, y * 1.4, z * 2.1);
    if (hash(Math.floor(x * 3.1), Math.floor(y * 2.2), Math.floor(z * 2.4)) > 0.9) k *= 0.78;
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

function signCanvas() {
  const c = document.createElement("canvas");
  c.width = 1024;
  c.height = 280;
  const g = c.getContext("2d");
  g.fillStyle = "#1a120e";
  g.fillRect(0, 0, 1024, 280);
  g.strokeStyle = "#e6c36a";
  g.lineWidth = 10;
  g.strokeRect(14, 14, 996, 252);
  g.fillStyle = "#f2d15a";
  g.font = "700 118px Georgia, serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("PASHMINA", 512, 118);
  g.fillStyle = "#f6e7c2";
  g.font = "600 48px Georgia, serif";
  g.fillText("HIMALAYA WEAVE", 512, 210);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function createHouse003() {
  const root = new THREE.Group();
  root.name = "house-003";
  const grimeTex = makeGrime();
  const mats = makeMaterials(grimeTex);
  const buckets = {};
  const loose = [];

  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    add(name, place(boxGeo(w, h, d), x, y, z), tint);
  }
  function addMesh(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
  }
  function strut(a, b, rad, name, tint) {
    const dir = new THREE.Vector3().subVectors(b, a);
    const len = dir.length();
    if (len < 0.02) return;
    const mid = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
    const g = new THREE.CylinderGeometry(rad, rad, len, 5);
    g.applyMatrix4(new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)));
    add(name, g, tint);
  }
  function wallZ(mat, x0, x1, y0, y1, zFace, holes) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      addBox(mat, part.w, part.h, T, part.x, part.y, zFace + T / 2);
    }
  }
  function streaks(x, yTop, zFace, n) {
    for (let i = 0; i < n; i++) {
      const len = 0.35 + hash(x + i, yTop, 3) * 0.85;
      const xx = x + (i - (n - 1) / 2) * 0.14 + (hash(x, i, yTop) - 0.5) * 0.06;
      addBox("stain", 0.05 + (i % 2) * 0.03, len, 0.006, xx, yTop - len / 2, zFace - 0.004, [0.8, 0.72, 0.64]);
    }
  }

  function lotus(x, y, z, sc) {
    const disc = new THREE.CylinderGeometry(0.046 * sc, 0.046 * sc, 0.018 * sc, 8);
    disc.rotateX(Math.PI / 2);
    add("woodDark", place(disc, x, y, z), [0.72, 0.58, 0.42]);
    for (let ring = 0; ring < 2; ring++) {
      const n = ring === 0 ? 8 : 6;
      const rad = (ring === 0 ? 0.052 : 0.028) * sc;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ring * 0.35;
        const petal = boxGeo((ring ? 0.024 : 0.038) * sc, (ring ? 0.012 : 0.018) * sc, (ring ? 0.016 : 0.026) * sc);
        add("wood", place(petal, x + Math.cos(a) * rad, y + Math.sin(a) * rad, z - 0.012 * sc - ring * 0.008, 0, 0, a), ring ? [0.92, 0.74, 0.5] : [0.62, 0.46, 0.32]);
      }
    }
    add("wood", place(new THREE.SphereGeometry(0.014 * sc, 6, 5), x, y, z - 0.028 * sc), [0.95, 0.78, 0.48]);
  }

  function deity(x, y, z, sc) {
    const s = sc || 1;
    addBox("dark", 0.15 * s, 0.2 * s, 0.025, x, y, z + 0.01);
    addBox("woodDark", 0.18 * s, 0.022 * s, 0.04, x, y + 0.11 * s, z - 0.012);
    addBox("woodDark", 0.022 * s, 0.22 * s, 0.04, x - 0.08 * s, y, z - 0.012);
    addBox("woodDark", 0.022 * s, 0.22 * s, 0.04, x + 0.08 * s, y, z - 0.012);
    add("face", place(new THREE.SphereGeometry(0.07 * s, 10, 8), x, y + 0.04 * s, z - 0.055), [1, 0.9, 0.72]);
    for (let i = -2; i <= 2; i++) {
      add("woodDark", place(new THREE.ConeGeometry(0.011 * s, 0.048 * s, 5), x + i * 0.018 * s, y + 0.09 * s, z - 0.045), [0.55, 0.4, 0.26]);
    }
    add("dark", place(new THREE.SphereGeometry(0.012 * s, 6, 5), x - 0.022 * s, y + 0.05 * s, z - 0.11), [0.15, 0.1, 0.08]);
    add("dark", place(new THREE.SphereGeometry(0.012 * s, 6, 5), x + 0.022 * s, y + 0.05 * s, z - 0.11), [0.15, 0.1, 0.08]);
    addBox("wood", 0.01 * s, 0.016 * s, 0.016, x, y + 0.018 * s, z - 0.072, [0.78, 0.6, 0.4]);
    addBox("dark", 0.022 * s, 0.005 * s, 0.01, x, y - 0.002 * s, z - 0.07, [0.15, 0.1, 0.08]);
    addBox("wood", 0.08 * s, 0.07 * s, 0.035, x, y - 0.055 * s, z - 0.03, [0.7, 0.52, 0.36]);
    addBox("woodDark", 0.045 * s, 0.016 * s, 0.018, x - 0.055 * s, y - 0.04 * s, z - 0.04);
    addBox("woodDark", 0.045 * s, 0.016 * s, 0.018, x + 0.055 * s, y - 0.04 * s, z - 0.04);
  }

  function peacock(x, y, z, dir) {
    add("wood", place(new THREE.SphereGeometry(0.05, 7, 6), x, y, z - 0.02), [0.55, 0.4, 0.28]);
    for (let i = 0; i < 3; i++) {
      add("wood", place(new THREE.SphereGeometry(0.026 - i * 0.004, 6, 5), x + dir * (0.04 + i * 0.03), y + 0.04 + i * 0.03, z - 0.03), [0.62, 0.46, 0.3]);
    }
    const hx = x + dir * 0.14;
    const hy = y + 0.14;
    add("wood", place(new THREE.SphereGeometry(0.03, 7, 6), hx, hy, z - 0.035), [0.72, 0.54, 0.36]);
    addBox("woodDark", 0.04, 0.012, 0.012, hx + dir * 0.04, hy, z - 0.04, [0.4, 0.28, 0.16]);
    add("dark", place(new THREE.SphereGeometry(0.007, 5, 4), hx, hy + 0.01, z - 0.06), [0.15, 0.12, 0.1]);
    for (let i = 0; i < 7; i++) {
      const a = 0.15 + i * 0.28;
      const len = 0.28;
      const ang = -dir * a;
      const fx = x - dir * Math.sin(a) * len * 0.42;
      const fy = y + 0.08 + Math.cos(a) * len * 0.42;
      add("wood", place(boxGeo(0.032, len, 0.012), fx, fy, z - 0.02, 0, 0, ang), [0.62, 0.4, 0.22]);
      const ex = x - dir * Math.sin(a) * len * 0.9;
      const ey = y + 0.08 + Math.cos(a) * len * 0.9;
      const eye = new THREE.CylinderGeometry(0.018, 0.018, 0.01, 7);
      eye.rotateX(Math.PI / 2);
      add("wood", place(eye, ex, ey, z - 0.035), [0.15, 0.48, 0.72]);
      add("woodDark", place(new THREE.SphereGeometry(0.006, 5, 4), ex, ey, z - 0.045), [0.1, 0.22, 0.35]);
    }
  }

  function lattice(x, y, w, h, z, cols, rows) {
    for (let i = 0; i <= cols; i++) {
      const xx = x - w / 2 + (i * w) / cols;
      addBox("woodDark", 0.014, h, 0.018, xx, y, z, [0.7, 0.56, 0.4]);
    }
    for (let j = 0; j <= rows; j++) {
      const yy = y - h / 2 + (j * h) / rows;
      addBox("woodDark", w, 0.014, 0.018, x, yy, z, [0.66, 0.52, 0.38]);
    }
  }

  function heroWindow(zFace) {
    const x = CX;
    const sill = 4.18;
    const ow = 0.76;
    const oh = 0.68;
    const y = sill + oh / 2;
    addBox("glass", ow - 0.08, oh - 0.08, 0.012, x, y, zFace + 0.14);
    lattice(x, y, ow - 0.1, oh - 0.1, zFace - 0.02, 8, 7);
    const postX = ow / 2 + 0.1;
    addBox("woodDark", 0.14, 1.55, 0.16, x - postX, y + 0.15, zFace - 0.08);
    addBox("woodDark", 0.14, 1.55, 0.16, x + postX, y + 0.15, zFace - 0.08);
    for (let i = 0; i < 4; i++) {
      const yy = sill + 0.12 + i * 0.32;
      lotus(x - postX, yy, zFace - 0.2, 1.45);
      lotus(x + postX, yy, zFace - 0.2, 1.4);
    }
    for (const sx of [-0.78, 0.78]) {
      addBox("woodDark", 0.42, 0.05, 0.06, x + sx, y + 0.38, zFace - 0.06);
      addBox("woodDark", 0.42, 0.05, 0.06, x + sx, y - 0.38, zFace - 0.06);
      addBox("woodDark", 0.05, 0.76, 0.06, x + sx - 0.18, y, zFace - 0.06);
      addBox("woodDark", 0.05, 0.76, 0.06, x + sx + 0.18, y, zFace - 0.06);
      deity(x + sx, y + 0.02, zFace - 0.14, 1.35);
    }
    for (let i = 0; i < 5; i++) {
      const ww = 1.15 + i * 0.08;
      addBox("woodDark", ww, 0.04, 0.08, x, sill - 0.02 - i * 0.045, zFace - 0.05 - i * 0.022, [0.6, 0.46, 0.32]);
    }
    addBox("woodDark", 1.55, 0.42, 0.07, x, sill - 0.42, zFace - 0.08);
    deity(x, sill - 0.42, zFace - 0.14, 0.85);
    addBox("woodDark", 2.15, 0.08, 0.14, x, sill + oh + 0.08, zFace - 0.08);
    addBox("woodDark", 2.35, 0.05, 0.16, x, sill + oh + 0.2, zFace - 0.07);
    for (let i = 0; i < 14; i++) {
      const xx = x - 1.05 + i * 0.16;
      addBox("woodDark", 0.035, 0.035, 0.03, xx, sill + oh + 0.14, zFace - 0.16, [0.48, 0.36, 0.24]);
    }
    const steps = [1.7, 1.25, 0.85, 0.5, 0.22];
    for (let i = 0; i < steps.length; i++) {
      addBox("woodDark", steps[i], 0.045, 0.1, x, sill + oh + 0.28 + i * 0.05, zFace - 0.06);
    }
    deity(x, sill + oh + 0.72, zFace - 0.16, 1.45);
    peacock(x - 0.62, sill + oh + 0.58, zFace - 0.14, -1);
    peacock(x + 0.62, sill + oh + 0.58, zFace - 0.14, 1);
    addBox("woodDark", 0.1, 0.18, 0.22, x - 0.42, sill - 0.22, zFace - 0.02, [0.58, 0.44, 0.3]);
    addBox("woodDark", 0.1, 0.18, 0.22, x + 0.42, sill - 0.22, zFace - 0.02, [0.58, 0.44, 0.3]);
    streaks(x, sill - 0.55, zFace, 5);
  }

  function bay() {
    const y = F2.y0;
    const zf = -1.05;
    for (let i = 0; i < 7; i++) {
      addBox("wood", 0.78, 0.05, 0.85, 0.55 + i * 0.8, y + 0.04, -0.72, i % 2 ? [0.72, 0.56, 0.4] : [0.86, 0.68, 0.48]);
    }
    addBox("woodDark", 5.6, 0.1, 0.9, 3.05, y - 0.08, -0.7, [0.4, 0.3, 0.22]);
    const bays = [1.15, 2.55, 3.95];
    for (const bx of bays) {
      addBox("glass", 0.7, 0.72, 0.015, bx, y + 0.72, zf + 0.04);
      lattice(bx, y + 0.72, 0.62, 0.66, zf - 0.02, 4, 4);
      addBox("woodDark", 0.78, 0.06, 0.08, bx, y + 1.12, zf - 0.04);
      addBox("woodDark", 0.78, 0.06, 0.08, bx, y + 0.34, zf - 0.04);
    }
    for (const px of [0.55, 1.85, 3.25, 4.55]) {
      addBox("woodDark", 0.12, 1.15, 0.14, px, y + 0.72, zf - 0.02);
      lotus(px, y + 1.15, zf - 0.1, 0.85);
    }
    addBox("woodDark", 5.3, 0.1, 0.1, 2.7, y + 0.22, zf - 0.02);
    for (let i = 0; i < 5; i++) deity(0.9 + i * 0.85, y + 0.28, zf - 0.08, 0.85);
    for (const sx of [0.8, 2.1, 3.4, 4.6]) {
      strut(new THREE.Vector3(sx, y - 0.02, -0.85), new THREE.Vector3(sx, y - 0.62, -0.2), 0.05, "woodDark", [0.55, 0.4, 0.28]);
    }
    addBox("pot", 0.24, 0.18, 0.24, 1.4, y + 0.16, -0.85);
    addBox("pot", 0.22, 0.16, 0.22, 3.6, y + 0.14, -0.82);
    addBox("leaf", 0.3, 0.26, 0.22, 1.4, y + 0.36, -0.85, [0.4, 0.68, 0.3]);
    addBox("leaf", 0.26, 0.22, 0.18, 3.6, y + 0.32, -0.82, [0.28, 0.52, 0.26]);
    addBox("cloth", 0.5, 0.75, 0.02, 0.85, y + 0.4, zf - 0.08, [0.72, 0.16, 0.14]);
    streaks(2.2, y - 0.05, zf, 5);
  }

  function shop() {
    const rail = new THREE.CylinderGeometry(0.015, 0.015, 3.7, 6);
    rail.rotateZ(Math.PI / 2);
    add("steel", place(rail, 2.3, 2.34, -0.22), [0.2, 0.2, 0.22]);
    const colours = [[0.42, 0.06, 0.08], [0.78, 0.7, 0.54], [0.1, 0.16, 0.38], [0.74, 0.46, 0.08], [0.7, 0.28, 0.06], [0.3, 0.44, 0.6], [0.52, 0.08, 0.12]];
    for (let i = 0; i < 7; i++) {
      const x = 0.7 + i * 0.5;
      add("cloth", place(boxGeo(0.38, 1.05, 0.02), x, 1.8, -0.42 - (i % 2) * 0.06, 0.02 * (i % 3 - 1), 0.18 * ((i % 2) * 2 - 1), 0), colours[i]);
      addBox("cloth", 0.36, 0.035, 0.03, x, 2.3, -0.42 - (i % 2) * 0.06, colours[i].map((v) => v * 0.6));
      for (let f = 0; f < 5; f++) addBox("cloth", 0.012, 0.08, 0.012, x - 0.14 + f * 0.07, 1.38, -0.28, colours[i]);
    }
    const folds = [[0.75, 0.22, 0.2], [0.92, 0.78, 0.55], [0.2, 0.35, 0.6], [0.85, 0.45, 0.2], [0.55, 0.15, 0.18], [0.85, 0.8, 0.6], [0.3, 0.5, 0.55], [0.7, 0.25, 0.2], [0.9, 0.7, 0.4]];
    for (let i = 0; i < folds.length; i++) {
      addBox("cloth", 0.48, 0.055, 0.36, 2.15, 0.2 + i * 0.055, -0.62, folds[i]);
    }
    addBox("plasterCream", 4.05, 2.45, 0.12, 2.3, 1.22, 0.32, [0.5, 0.44, 0.38]);
    for (let r = 0; r < 3; r++) {
      const sy = 0.75 + r * 0.5;
      addBox("wood", 3.4, 0.03, 0.34, 2.3, sy, 0.1, [0.42, 0.3, 0.2]);
      for (let k = 0; k < 9; k++) {
        const c = folds[(k + r * 4) % folds.length].map((v) => v * 0.62);
        const n = 3 + Math.floor(hash(r, k, 5) * 4);
        addBox("cloth", 0.32, 0.045 * n, 0.28, 0.75 + k * 0.385, sy + 0.015 + 0.0225 * n, 0.1, c);
      }
    }
    addBox("brick", 0.18, 2.4, 0.55, 0.48, 1.22, 0.22);
    addBox("brick", 0.18, 2.4, 0.55, 4.15, 1.22, 0.22);
    addBox("concrete", 4.1, 0.08, 1.15, 2.3, 0.04, -0.05);
    addBox("wood", 3.7, 0.08, 0.85, 2.3, 2.42, 0.2, [0.62, 0.46, 0.3]);
    addBox("woodDark", 0.12, 2.4, 0.12, 0.48, 1.25, -0.06);
    addBox("woodDark", 0.12, 2.4, 0.12, 4.28, 1.25, -0.06);
    add("bulb", place(new THREE.SphereGeometry(0.05, 8, 6), 2.2, 2.15, -0.15));
    addBox("concrete", 1.1, 0.1, 0.35, 2.3, 0.05, -0.18);
    for (let i = 0; i < 31; i++) {
      const t = (i % 8) / 7;
      addBox("cloth", 0.07, 0.07, 0.07, 0.45 + i * 0.18, 3.24 - Math.sin(t * Math.PI) * 0.12, -0.3, i % 4 === 3 ? [0.75, 0.12, 0.08] : [0.92, 0.5, 0.06]);
    }
    const shutterX = 5.45;
    for (let i = 0; i < 28; i++) {
      addBox("plate", 1.35, 0.018, 0.02, shutterX, 0.4 + i * 0.068, -0.04, i % 5 === 0 ? [0.55, 0.5, 0.45] : [0.72, 0.7, 0.66]);
    }
    add("plate", place(new THREE.CylinderGeometry(0.09, 0.09, 1.35, 8), shutterX, 2.48, -0.02, 0, 0, Math.PI / 2), [0.6, 0.58, 0.55]);
    const awn = boxGeo(6.15, 0.035, 1.2);
    add("rust", place(awn, 3.2, 2.52, -0.55, -0.14, 0, 0), [0.75, 0.7, 0.64]);
    for (let i = 0; i < 22; i++) {
      add("rust", place(boxGeo(0.03, 0.02, 1.15), 0.35 + i * 0.28, 2.54, -0.55, -0.14, 0, 0), [0.55, 0.48, 0.4]);
    }
    strut(new THREE.Vector3(0.7, 2.55, -0.15), new THREE.Vector3(0.85, 2.35, -1.0), 0.012, "steel", [0.3, 0.3, 0.32]);
    strut(new THREE.Vector3(5.6, 2.55, -0.15), new THREE.Vector3(5.4, 2.35, -1.0), 0.012, "steel", [0.3, 0.3, 0.32]);
  }

  function rectWindow(floor, x, sill, w, h, board) {
    const zFace = floor.z;
    const y = sill + h / 2;
    addBox("glass", w - 0.1, h - 0.1, 0.012, x, y, zFace + 0.15);
    lattice(x, y, w - 0.08, h - 0.08, zFace - 0.015, 5, 6);
    addBox("woodDark", w + 0.12, 0.06, 0.08, x, sill + h + 0.02, zFace - 0.04);
    addBox("woodDark", w + 0.16, 0.07, 0.16, x, sill - 0.02, zFace - 0.06);
    addBox("woodDark", 0.06, h, 0.08, x - w / 2 - 0.02, y, zFace - 0.04);
    addBox("woodDark", 0.06, h, 0.08, x + w / 2 + 0.02, y, zFace - 0.04);
    if (board) addBox("wood", w - 0.12, h * 0.55, 0.02, x, y + 0.1, zFace - 0.03, [0.45, 0.32, 0.22]);
    streaks(x, sill - 0.04, zFace, 3);
  }

  function mass() {
    const shopHole = { x: 2.33, y: 1.29, w: 3.9, h: 2.46 };
    const shutHole = { x: 5.45, y: 1.3, w: 1.4, h: 2.4 };
    wallZ(GF.mat, 0, W, GF.y0, GF.y1, GF.z, [shopHole, shutHole]);
    const open = { x: CX, y: 4.52, w: 0.78, h: 0.7 };
    wallZ(F1.mat, 0, W, F1.y0, F1.y1, F1.z, [open]);
    const bayHoles = [1.15, 2.45, 3.75].map((x) => ({ x, y: 7.15, w: 0.82, h: 0.95 }));
    wallZ(F2.mat, 0, W, F2.y0, F2.y1, F2.z, bayHoles);
    wallZ(F3.mat, 0, W, F3.y0, F3.y1, F3.z, [
      { x: 1.7, y: 10.25, w: 0.78, h: 1.05 },
      { x: 3.7, y: 10.35, w: 0.7, h: 0.95 },
    ]);
    for (const level of LEVELS) {
      for (const x of COLS) {
        const y0 = level.y0 + 0.04;
        const y1 = level.y1 - 0.16;
        addBox("concrete", 0.26, y1 - y0, 0.28, x, (y0 + y1) / 2, level.z - 0.06);
      }
      addBox("concrete", W + 0.06, 0.16, 0.18, W / 2, level.y1 - 0.08, level.z - 0.02);
      if (level !== GF) {
        const z0 = level.z - 0.06;
        addBox("concrete", W + 0.04, 0.14, D - z0 - 0.15, W / 2, level.y0 - 0.07, (z0 + D) / 2, [0.78, 0.76, 0.72]);
        streaks(W * 0.35, level.y0, level.z, 4);
        streaks(W * 0.7, level.y0, level.z, 3);
      }
    }
    for (const level of LEVELS) {
      const z0 = level.z + 0.15;
      const z1 = D - 0.15;
      for (const side of [-1, 1]) {
        const xOuter = side < 0 ? 0 : W;
        const courses = 6;
        const ch = (level.y1 - level.y0) / courses;
        for (let i = 0; i < courses; i++) {
          const yy = level.y0 + (i + 0.5) * ch;
          const shift = (hash(level.y0, i, side) - 0.5) * 0.018;
          const tint = i % 2 ? [0.82, 0.7, 0.62] : [1, 0.95, 0.9];
          const inset = i % 3 === 0 ? 0.08 : 0;
          addBox("brick", T, ch - 0.012, (z1 - z0) - inset, xOuter - side * (T / 2) + shift, yy, (z0 + z1) / 2 + inset * 0.25, tint);
        }
        for (const z of [level.z + 0.4, 2.3, 4.3, 6.2]) {
          if (z < z0 + 0.05 || z > z1) continue;
          addBox("concrete", 0.26, level.y1 - level.y0 - 0.18, 0.24, xOuter + side * -0.02, (level.y0 + level.y1) / 2, z);
        }
        addBox("concrete", 0.2, 0.16, z1 - z0, xOuter + side * -0.04, level.y1 - 0.08, (z0 + z1) / 2);
      }
    }
    wallZ("brick", 0.2, W - 0.2, 0.2, 8.6, D - T, [{ x: 3.2, y: 5.2, w: 0.55, h: 0.7 }]);
    addBox("woodDark", 0.7, 0.06, 0.06, 3.2, 5.58, D + 0.02);
    addBox("woodDark", 0.7, 0.06, 0.06, 3.2, 4.82, D + 0.02);
    addBox("glass", 0.42, 0.5, 0.02, 3.2, 5.2, D - 0.02);
  }

  function ghost(xFace, sign, specs) {
    for (let i = 0; i < specs.length; i++) {
      const s = specs[i];
      const proud = 0.14 + (i % 3) * 0.035;
      const x = xFace + sign * proud;
      const rot = (hash(s[0], i, 4) - 0.5) * 0.05;
      const tint = i % 4 === 0 ? [0.62, 0.48, 0.4] : i % 3 === 0 ? [0.8, 0.74, 0.64] : [0.92, 0.8, 0.55];
      const name = i % 5 === 0 ? "plasterSalt" : "plasterGhost";
      add(name, place(boxGeo(0.07, s[3], s[1]), x, s[2] + s[3] / 2, s[0], 0, rot, sign * 0.02), tint);
      if (i % 2 === 0) {
        addBox("brickNew", 0.04, 0.1, s[1] * 0.45, x + sign * 0.03, s[2] + s[3] + 0.02, s[0] + (hash(i, 2, 1) - 0.5) * 0.1, [0.85, 0.6, 0.5]);
      }
      if (i % 3 === 0) {
        addBox("brickDark", 0.03, 0.16, 0.1, x + sign * 0.02, s[2] + 0.2, s[0] - s[1] * 0.3, [0.6, 0.45, 0.38]);
      }
    }
    const crack = boxGeo(0.015, 2.6, 0.012);
    add("stain", place(crack, xFace + sign * 0.2, 2.4, 2.6, 0, 0, 0.5), [0.25, 0.2, 0.16]);
    addBox("stain", 0.02, 1.4, 0.08, xFace + sign * 0.18, 0.7, 4.4, [0.35, 0.4, 0.28]);
  }

  function roof() {
    const eaveZ = -1.05;
    const eaveY = 11.28;
    const ridgeZ = 2.45;
    const ridgeY = 13.35;
    const len = Math.hypot(ridgeZ - eaveZ, ridgeY - eaveY);
    const ang = -Math.atan2(ridgeY - eaveY, ridgeZ - eaveZ);
    const mx = 2.35;
    const my = (eaveY + ridgeY) / 2;
    const mz = (eaveZ + ridgeZ) / 2;
    add("tile", place(boxGeo(4.9, 0.07, len), mx, my, mz, ang, 0, 0));
    add("woodDark", place(boxGeo(4.7, 0.04, len - 0.3), mx, my - 0.05, mz + 0.05, ang, 0, 0), [0.5, 0.38, 0.26]);
    for (let i = 0; i < 12; i++) {
      add("wood", place(boxGeo(0.08, 0.1, 0.7), 0.25 + i * 0.4, eaveY - 0.02, eaveZ + 0.15, ang, 0, 0), [0.55, 0.4, 0.28]);
    }
    addBox("woodDark", 5.0, 0.12, 0.08, mx, eaveY - 0.02, eaveZ);
    addBox("tile", 5.05, 0.16, 0.14, mx, eaveY + 0.08, eaveZ - 0.04, [0.85, 0.5, 0.32]);
    for (const sx of [0.5, 1.4, 2.4, 3.4, 4.3]) {
      strut(new THREE.Vector3(sx, eaveY, eaveZ + 0.15), new THREE.Vector3(sx, 10.7, -0.15), 0.04, "woodDark", [0.55, 0.4, 0.28]);
    }
    add("tile", place(new THREE.CylinderGeometry(0.09, 0.09, 4.9, 8), mx, ridgeY + 0.04, ridgeZ, 0, 0, Math.PI / 2), [0.7, 0.45, 0.32]);
    const backLen = Math.hypot(5.6 - ridgeZ, ridgeY - 11.45);
    const backAng = Math.atan2(ridgeY - 11.45, 5.6 - ridgeZ);
    add("tile", place(boxGeo(4.9, 0.06, backLen), mx, (ridgeY + 11.45) / 2, (ridgeZ + 5.6) / 2, backAng, 0, 0));
    add("rust", place(boxGeo(1.7, 0.03, 1.5), 3.7, my + 0.08, mz - 0.15, ang, 0, 0), [0.65, 0.55, 0.45]);
    for (let i = 0; i < 8; i++) {
      add("rust", place(boxGeo(0.025, 0.015, 1.45), 2.95 + i * 0.2, my + 0.1, mz - 0.15, ang, 0, 0), [0.4, 0.32, 0.24]);
    }
    addBox("concrete", 1.7, 0.12, 2.3, 5.55, 11.5, 5.6);
    addBox("brick", 0.12, 0.7, 2.2, 4.95, 11.9, 5.6);
    addBox("brick", 0.12, 0.7, 1.5, 6.28, 11.9, 5.9);
    addBox("brick", 1.4, 0.55, 0.12, 5.6, 11.85, 6.7);
    const tx = 5.5;
    const tz = 5.3;
    const deck = 11.62;
    for (const dx of [-0.28, 0.28]) {
      for (const dz of [-0.28, 0.28]) {
        addBox("steel", 0.03, 0.7, 0.03, tx + dx, deck + 0.35, tz + dz, [0.35, 0.36, 0.38]);
      }
    }
    strut(new THREE.Vector3(tx - 0.28, deck + 0.15, tz - 0.28), new THREE.Vector3(tx + 0.28, deck + 0.55, tz + 0.28), 0.012, "steel", [0.3, 0.3, 0.32]);
    add("tank", place(new THREE.CylinderGeometry(0.38, 0.4, 0.9, 12), tx, deck + 1.15, tz));
    add("tank", place(new THREE.CylinderGeometry(0.18, 0.18, 0.06, 8), tx, deck + 1.62, tz));
    for (let i = 0; i < 6; i++) {
      const tube = new THREE.CylinderGeometry(0.018, 0.018, 0.85, 5);
      add("glass", place(tube, tx - 0.15 + (i % 3) * 0.12, deck + 0.85, tz - 0.55, 0.5, 0, 0), [0.7, 0.75, 0.8]);
    }
    addBox("tank", 0.42, 0.16, 0.16, tx, deck + 0.7, tz - 0.85);
    const R = 0.4;
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      pts.push(new THREE.Vector2(Math.max(0.01, R * Math.cos(t * Math.PI * 0.5)), 0.12 * Math.sin(t * Math.PI * 0.5)));
    }
    const bowl = new THREE.LatheGeometry(pts, 14);
    bowl.rotateX(0.85);
    bowl.translate(5.7, deck + 1.15, 4.15);
    add("dish", bowl, [0.8, 0.82, 0.86]);
    const rim = new THREE.TorusGeometry(R, 0.014, 5, 16);
    rim.rotateX(Math.PI / 2 + 0.85);
    rim.translate(5.7, deck + 1.15, 4.15);
    add("plate", rim, [0.7, 0.72, 0.75]);
    addBox("steel", 0.035, 0.7, 0.035, 5.7, deck + 0.4, 4.15, [0.4, 0.4, 0.42]);
    strut(new THREE.Vector3(5.7, deck + 1.35, 4.15), new THREE.Vector3(5.7, deck + 1.55, 3.75), 0.008, "steel", [0.25, 0.26, 0.28]);
    add("steel", place(new THREE.CylinderGeometry(0.03, 0.035, 0.1, 6), 5.7, deck + 1.55, 3.75), [0.15, 0.16, 0.18]);
    for (const x of [4.95, 6.2]) {
      add("rust", place(new THREE.CylinderGeometry(0.008, 0.008, 0.85, 4), x, deck + 0.5, 6.35), [0.55, 0.32, 0.18]);
      add("rust", place(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4), x + 0.08, deck + 0.95, 6.35, 0, 0, 0.4), [0.5, 0.28, 0.16]);
    }
    addBox("brick", 0.1, 1.15, 1.15, 5.15, deck + 0.55, 6.15);
    addBox("brick", 0.1, 0.7, 1.15, 6.15, deck + 0.35, 6.15);
    addBox("concrete", 0.9, 0.06, 0.55, 5.65, deck + 1.15, 6.35);
    for (let i = 0; i < 3; i++) addBox("concrete", 0.7, 0.06, 0.22, 5.6, deck + 0.15 + i * 0.16, 5.7 + i * 0.18);
  }

  function power() {
    const px = -1.45;
    const pz = -2.7;
    add("concrete", place(new THREE.CylinderGeometry(0.08, 0.1, 10.2, 8), px, 5.1, pz));
    addBox("concrete", 0.7, 0.06, 0.06, px, 8.4, pz);
    addBox("steel", 0.55, 0.72, 0.42, px, 7.15, pz + 0.15, [0.55, 0.58, 0.56]);
    for (let i = 0; i < 7; i++) addBox("steel", 0.02, 0.6, 0.36, px - 0.3, 7.15, pz + 0.15, [0.35, 0.36, 0.34]);
    for (let i = 0; i < 3; i++) {
      add("plate", place(new THREE.CylinderGeometry(0.035, 0.04, 0.16, 6), px - 0.15 + i * 0.15, 7.6, pz + 0.15), [0.7, 0.55, 0.3]);
    }
    addBox("stain", 0.08, 0.55, 0.04, px + 0.05, 6.5, pz + 0.32, [0.25, 0.2, 0.12]);
    addBox("steel", 0.32, 0.4, 0.18, px, 4.6, pz + 0.12, [0.3, 0.32, 0.3]);
    addBox("steel", 0.22, 0.28, 0.12, 0.35, 3.55, -0.08, [0.28, 0.3, 0.28]);
    add("steel", place(new THREE.TorusGeometry(0.12, 0.012, 5, 10), 0.55, 3.15, -0.25, Math.PI / 2, 0, 0), [0.08, 0.08, 0.09]);
    const black = [0.06, 0.06, 0.07];
    function sag(a, b, droop, rad, tint) {
      const pts = [];
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        const y = a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop;
        const x = a[0] + (b[0] - a[0]) * t;
        const z = a[2] + (b[2] - a[2]) * t + Math.sin(t * 9.0) * 0.04;
        pts.push(new THREE.Vector3(x, y, z));
      }
      const curve = new THREE.CatmullRomCurve3(pts);
      add("steel", new THREE.TubeGeometry(curve, 7, rad, 4, false), tint);
    }
    const origin = [px, 7.05, pz];
    const split = [-0.35, 6.4, -1.15];
    const ends = [[0.4, 5.6, -0.45], [1.3, 4.1, -0.55], [2.5, 7.6, -0.4], [3.8, 3.55, -0.6], [5.2, 6.4, -0.42], [6.15, 4.7, -0.5]];
    sag(origin, split, 0.15, 0.02, black);
    for (let i = 0; i < ends.length; i++) {
      sag(split, ends[i], 0.45 + (i % 3) * 0.38, 0.007 + (i % 2) * 0.003, i === 3 ? [0.1, 0.12, 0.16] : black);
    }
    sag([0.2, 3.45, -0.32], [6.05, 3.3, -0.38], 0.4, 0.01, black);
    sag([0.4, 8.4, -0.72], [6.05, 7.3, -0.55], 1.05, 0.009, black);
    sag([0.3, 10.6, -0.3], [4.6, 9.4, -0.4], 0.55, 0.008, black);
    sag([0.15, 6.6, -0.48], [6.15, 6.25, -0.42], 0.28, 0.007, black);
    sag([1.1, 9.8, -0.35], [5.6, 6.2, -0.7], 0.7, 0.008, [0.12, 0.14, 0.18]);
    sag([5.8, 5.6, -0.3], [4.9, 3.9, -0.95], 0.6, 0.008, black);
    sag([4.9, 3.9, -0.95], [6.2, 4.4, -0.28], 0.35, 0.008, black);
    sag([-0.05, 8.2, 0.35], [-0.16, 5.6, 3.4], 0.4, 0.008, black);
    sag([-0.08, 4.4, 0.4], [-0.18, 2.4, 4.6], 0.55, 0.009, black);
    sag([px, 6.2, pz], [0.2, 2.55, -0.9], 1.15, 0.012, black);
    sag([2.2, 11.2, -0.9], [px, 8.6, pz], 0.8, 0.007, black);
    const flagCols = [[0.85, 0.15, 0.15], [0.15, 0.35, 0.75], [0.95, 0.85, 0.2], [0.95, 0.95, 0.9], [0.15, 0.5, 0.25]];
    sag([0.35, 13.15, -0.85], [px, 8.7, pz], 0.35, 0.006, [0.7, 0.7, 0.68]);
    for (let i = 0; i < 5; i++) {
      const t = 0.12 + i * 0.14;
      const x = 0.35 + (px - 0.35) * t;
      const y = 13.15 + (8.7 - 13.15) * t - Math.sin(Math.PI * t) * 0.35;
      const z = -0.85 + (pz + 0.85) * t;
      addBox("cloth", 0.36, 0.22, 0.015, x, y - 0.16, z, flagCols[i]);
    }
    streaks(1.3, 6.2, F1.z, 6);
    streaks(4.2, 8.6, F2.z, 5);
    streaks(5.4, 4.8, F1.z, 4);
  }

  mass();
  shop();
  heroWindow(F1.z);
  bay();
  rectWindow(F3, 1.7, 9.72, 0.74, 1.02, false);
  rectWindow(F3, 3.7, 9.85, 0.66, 0.92, true);
  addBox("plate", 0.52, 0.32, 0.28, 5.35, 10.3, F3.z - 0.16, [0.7, 0.72, 0.74]);
  for (let i = 0; i < 6; i++) addBox("steel", 0.42, 0.012, 0.02, 5.35, 10.18 + i * 0.04, F3.z - 0.32, [0.22, 0.24, 0.26]);
  addBox("brick", 0.7, 0.45, 0.02, 1.15, 10.15, F3.z - 0.02, [0.8, 0.55, 0.45]);
  addBox("brickNew", 0.4, 0.28, 0.015, 2.6, 10.4, F3.z - 0.015);
  ghost(0, -1, [
    [0.7, 1.15, 0.05, 1.35],
    [1.7, 1.35, 0.1, 2.6],
    [2.8, 0.9, 0.2, 1.15],
    [3.5, 1.25, 0.0, 3.2],
    [4.6, 0.85, 0.15, 1.7],
    [5.4, 1.1, 0.08, 2.15],
    [1.15, 0.7, 2.4, 0.85],
    [2.4, 0.55, 3.5, 0.7],
    [4.15, 0.75, 2.7, 0.65],
    [5.5, 0.5, 1.5, 1.05],
  ]);
  ghost(W, 1, [
    [1.2, 0.4, 3.4, 1.8],
    [1.8, 0.65, 4.1, 2.4],
    [2.6, 0.3, 3.8, 1.1],
    [3.3, 0.5, 5.2, 2.2],
    [4.1, 0.35, 4.6, 1.4],
  ]);
  const teeth = [[0.55, 6.72], [1.15, 6.95], [0.7, 6.55], [0.4, 7.02]];
  for (const tooth of teeth) {
    addBox("brickNew", 0.16, tooth[0], 0.18, -0.08, tooth[0] / 2, tooth[1], [0.9, 0.7, 0.6]);
  }
  add("plate", place(new THREE.CylinderGeometry(0.04, 0.045, 3.2, 6), -0.12, 2.4, 5.2), [0.85, 0.85, 0.82]);
  roof();
  power();

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(5.6, 0.5, 0.05),
    new THREE.MeshStandardMaterial({ map: signCanvas(), roughness: 0.62, metalness: 0 })
  );
  sign.position.set(3.15, 2.92, -0.24);
  addMesh(sign);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass" && name !== "bulb";
    mesh.receiveShadow = true;
    root.add(mesh);
    for (const g of list) if (g !== geo) g.dispose();
  }
  for (const obj of loose) root.add(obj);

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "003";
  return root;
}
