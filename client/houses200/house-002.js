// House 002. Snow Lion Guest House, one Thamel lodging. Spec: research/houses200/002/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face of the ground floor is z = 0. Overhangs use negative Z.
// Order: mass, shop, openings, balcony, party walls, roof, wires.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 4.85;
const D = 6.4;
const T = 0.2;

const GF = { y0: 0, y1: 3.05, z: 0, mat: "plasterSalmon" };
const F1 = { y0: 3.05, y1: 5.78, z: -0.52, mat: "plasterYellow", red: true };
const F2 = { y0: 5.78, y1: 8.62, z: -0.96, mat: "brick", red: false };
const F3 = { y0: 8.62, y1: 11.28, z: -0.58, mat: "plasterOchre", red: true };
const F4 = { y0: 11.28, y1: 13.78, z: -0.9, mat: "plasterMint", red: true };
const F5 = { y0: 13.78, y1: 16.12, z: -0.28, mat: "plasterCream", red: false };
const DECK = 16.12;
const LEVELS = [GF, F1, F2, F3, F4, F5];
const UPPER = [F1, F2, F3, F4, F5];
const COLS = [0.22, 2.42, 4.63];
const BANDS = [3.05, 5.78, 8.62, 11.28, 13.78, 16.12];

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

// Per-pixel weathering, house-local space: patchy fade, soot and rain runs under
// every slab, rising damp at the street, dark soffits, dirty ledges.
const GRIME_VS = "varying vec3 vLp;\nvarying vec3 vLn;\n";
const GRIME_FS = `
varying vec3 vLp;
varying vec3 vLn;
float gH(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float gN(vec3 p) {
  vec3 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gH(i), gH(i + vec3(1, 0, 0)), f.x), mix(gH(i + vec3(0, 1, 0)), gH(i + vec3(1, 1, 0)), f.x), f.y),
    mix(mix(gH(i + vec3(0, 0, 1)), gH(i + vec3(1, 0, 1)), f.x), mix(gH(i + vec3(0, 1, 1)), gH(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
vec3 grime(vec3 col) {
  vec3 p = vLp;
  float h = p.x + p.z;
  float k = mix(0.72, 1.05, gN(p * 0.9) * 0.6 + gN(p * 2.7) * 0.4);
  k *= 0.94 + 0.06 * gN(p * 11.0);
  float damp = 0.0;
  float bands[6] = float[6](${BANDS.join(", ")});
  for (int b = 0; b < 6; b++) {
    float d = bands[b] - 0.2 - p.y;
    if (d > 0.0 && d < 1.6) {
      float run = smoothstep(0.45, 0.8, gN(vec3(h * 6.0, float(b) * 3.1, 0.0)));
      float fall = 1.0 - d / (0.5 + 1.1 * gN(vec3(h * 6.0, float(b), 7.0)));
      k *= 1.0 - 0.5 * run * clamp(fall, 0.0, 1.0) - 0.16 * smoothstep(0.35, 0.0, d);
    }
  }
  float rise = 0.75 + 0.35 * gN(vec3(h * 2.2, 0.0, 3.0));
  damp = smoothstep(rise, 0.0, p.y);
  k *= 1.0 - 0.32 * damp;
  if (vLn.y < -0.5) k *= 0.62;
  else if (vLn.y > 0.5) k *= 0.78 + 0.12 * gN(p * 6.0);
  col *= k;
  return mix(col, col * vec3(0.86, 0.9, 0.82), damp);
}
`;
function weather(m) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = GRIME_VS + sh.vertexShader.replace(
      "#include <begin_vertex>",
      "#include <begin_vertex>\nvLp = position;\nvLn = normal;"
    );
    sh.fragmentShader = GRIME_FS + sh.fragmentShader.replace(
      "#include <color_fragment>",
      "#include <color_fragment>\ndiffuseColor.rgb = grime(diffuseColor.rgb);"
    );
  };
  m.customProgramCacheKey = () => "grime002";
  return m;
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
    aoMapIntensity: o.ao == null ? 0.45 : o.ao,
    vertexColors: true,
    envMapIntensity: 0.72,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 1 : o.ns, o.ns == null ? 1 : o.ns);
  return o.metal ? m : weather(m);
}

function makeMaterials() {
  const plaster = {
    diff: tex("plastered_wall_Diffuse.jpg", true, 0.55, 0.55),
    nor: tex("plastered_wall_nor_gl.jpg", false, 0.55, 0.55),
    arm: tex("plastered_wall_arm.jpg", false, 0.55, 0.55),
  };
  const brick = {
    diff: tex("brick_wall_006_Diffuse.jpg", true, 0.55, 0.55),
    nor: tex("brick_wall_006_nor_gl.jpg", false, 0.55, 0.55),
    arm: tex("brick_wall_006_arm.jpg", false, 0.55, 0.55),
  };
  const concrete = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 0.8, 0.8),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 0.8, 0.8),
    arm: tex("concrete_wall_001_arm.jpg", false, 0.8, 0.8),
  };
  const wood = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.1, 1.1),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.1, 1.1),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.1, 1.1),
  };
  const plate = {
    diff: tex("metal_plate_Diffuse.jpg", true, 1.6, 1.6),
    nor: tex("metal_plate_nor_gl.jpg", false, 1.6, 1.6),
    arm: tex("metal_plate_arm.jpg", false, 1.6, 1.6),
  };
  const rust = {
    diff: tex("rusty_metal_Diffuse.jpg", true, 1.2, 1.2),
    nor: tex("rusty_metal_nor_gl.jpg", false, 1.2, 1.2),
    arm: tex("rusty_metal_arm.jpg", false, 1.2, 1.2),
  };
  const dish = pbr(plate, 0xd8dbe0, { ao: 0.25, metal: true, ns: 0.7 });
  dish.side = THREE.DoubleSide;
  dish.envMapIntensity = 1.15;
  return {
    brick: pbr(brick, 0xffffff, { ao: 0.55 }),
    brickRed: pbr(brick, 0xb4553c, { ao: 0.5, ns: 0.9 }),
    brickNew: pbr(brick, 0xffd2c2, { ao: 0.35 }),
    plasterSalmon: pbr(plaster, 0xdea894, { ao: 0.5, ns: 0.85 }),
    plasterYellow: pbr(plaster, 0xd8b770, { ao: 0.55, ns: 1.05 }),
    plasterOchre: pbr(plaster, 0xc7a062, { ao: 0.55, ns: 1.1 }),
    plasterMint: pbr(plaster, 0xaec7b8, { ao: 0.55, ns: 1.05 }),
    plasterCream: pbr(plaster, 0xe6dcc6, { ao: 0.5, ns: 0.9 }),
    plasterGhost: pbr(plaster, 0xf3e6c4, { ao: 0.35, ns: 0.7 }),
    plasterDamp: pbr(plaster, 0x5e5348, { ao: 0.4, ns: 0.55 }),
    concrete: pbr(concrete, 0xd4cfc6, { ao: 0.35 }),
    wood: pbr(wood, 0xd2c0a2, { ao: 0.32 }),
    woodDark: pbr(wood, 0x8d7356, { ao: 0.28 }),
    plate: pbr(plate, 0xffffff, { ao: 0.22, metal: true, ns: 0.75 }),
    rust: pbr(rust, 0xffffff, { ao: 0.28, metal: true }),
    dish,
    stain: new THREE.MeshStandardMaterial({ color: 0x4e453c, roughness: 0.96, metalness: 0, vertexColors: true }),
    steel: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.42, metalness: 0.7, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x2a3034, roughness: 0.2, metalness: 0.45, envMapIntensity: 0.8 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.92, metalness: 0 }),
    pot: new THREE.MeshStandardMaterial({ color: 0x8d5134, roughness: 0.86, metalness: 0, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, vertexColors: true }),
    tank: new THREE.MeshStandardMaterial({ color: 0x141618, roughness: 0.55, metalness: 0.06, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb060, emissiveIntensity: 0.7, roughness: 0.4 }),
    sign: null,
    blade: null,
  };
}

function signCanvas(w, h, title, sub, opt) {
  const o = opt || {};
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = o.bg || "#7a1e24";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = o.edge || "#f0d48a";
  g.lineWidth = Math.max(8, Math.min(w, h) / 28);
  g.strokeRect(16, 16, w - 32, h - 32);
  g.fillStyle = o.fg || "#f6e7c1";
  g.textAlign = "center";
  g.textBaseline = "middle";
  if (o.stack) {
    g.save();
    g.translate(w / 2, h / 2);
    g.rotate(-Math.PI / 2);
    g.font = "700 " + Math.floor(w * 0.34) + "px Georgia, serif";
    g.fillText(title, 0, -h * 0.02);
    g.restore();
  } else {
    g.font = "700 " + Math.floor(h * 0.34) + "px Georgia, serif";
    g.fillText(title, w / 2, sub ? h * 0.40 : h * 0.5);
    if (sub) {
      g.font = "600 " + Math.floor(h * 0.2) + "px Georgia, serif";
      g.fillText(sub, w / 2, h * 0.74);
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function paintGrime(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.84 + 0.16 * hash(x * 2.7, y * 1.3, z * 2.2);
    k += Math.sin(y * 46) * 0.035;
    const blot = hash(Math.floor(x * 2.4), Math.floor(y * 1.7), Math.floor(z * 2.4));
    if (blot > 0.86) k *= 0.68;
    else if (blot < 0.07) k *= 1.14;
    if (y < 0.4) k *= 0.48 + 0.52 * Math.max(0, y) / 0.4;
    else if (y < 1.05) k *= 0.84 + 0.16 * ((y - 0.4) / 0.65);
    if (z < 0.45 || x < 0.35 || x > W - 0.35) {
      for (let b = 0; b < BANDS.length; b++) {
        const below = BANDS[b] - y;
        if (below > 0.02 && below < 0.62) k *= 0.7 + 0.3 * (below / 0.62);
      }
    }
    const col = hash(Math.floor(x * 9 + z * 3), 1.7, 4);
    if (col > 0.78 && ((y * 1.7) % 1) < 0.18) k *= 0.76;
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse002() {
  const root = new THREE.Group();
  root.name = "house-002";
  const mats = makeMaterials();
  const buckets = {};
  const loose = [];

  function add(name, g, tint) {
    paintGrime(g, tint);
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
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
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
      const len = 0.28 + hash(x + i, yTop, 3) * 0.7;
      const xx = x + (i - (n - 1) / 2) * 0.16 + (hash(x, i, yTop) - 0.5) * 0.08;
      addBox("stain", 0.03 + (i % 2) * 0.012, len, 0.014, xx, yTop - len / 2, zFace - 0.01, [0.72, 0.66, 0.58]);
    }
  }

  function peel(x, y, w, h, zFace) {
    addBox("brick", w, h, 0.018, x, y, zFace - 0.012);
    addBox("brickNew", w * 0.45, h * 0.55, 0.012, x + w * 0.15, y - h * 0.1, zFace - 0.02, [1, 0.95, 0.9]);
  }

  function frontBeam(level) {
    const y = level.y1 - 0.09;
    addBox("concrete", W + 0.08, 0.18, 0.16, W / 2, y, level.z - 0.01);
  }

  function frontColumn(level, x) {
    const y0 = level.y0 + 0.02;
    const y1 = level.y1 - 0.18;
    addBox("concrete", 0.28, y1 - y0, 0.3, x, (y0 + y1) / 2, level.z - 0.02);
    if (level.red && (x < 0.5 || x > W - 0.5)) {
      addBox("brickRed", 0.18, y1 - y0, 0.06, x, (y0 + y1) / 2, level.z - 0.16);
    }
  }

  function floorSlab(level) {
    const z0 = level.z - 0.05;
    const z1 = D - 0.1;
    addBox("concrete", W + 0.04, 0.15, z1 - z0, W / 2, level.y0 - 0.075, (z0 + z1) / 2, [0.76, 0.74, 0.7]);
    addBox("concrete", W + 0.1, 0.05, 0.07, W / 2, level.y0 - 0.02, level.z - 0.045);
    streaks(W * 0.3, level.y0 - 0.02, level.z - 0.02, 4);
    streaks(W * 0.7, level.y0 - 0.02, level.z - 0.02, 3);
  }

  function archWindow(floor, x, sill, rectH, r, opt) {
    const o = opt || {};
    const zFace = floor.z;
    const spring = sill + rectH;
    const w = r * 2;
    const n = 8;
    for (let i = 0; i < n; i++) {
      const y0 = (i / n) * r;
      const y1 = ((i + 1) / n) * r;
      const ym = (y0 + y1) / 2;
      const hw = Math.sqrt(Math.max(0, r * r - ym * ym));
      const leftW = r - hw;
      if (leftW < 0.012) continue;
      addBox(floor.mat, leftW, y1 - y0, T, x - r + leftW / 2, spring + ym, zFace + T / 2);
      addBox(floor.mat, leftW, y1 - y0, T, x + r - leftW / 2, spring + ym, zFace + T / 2);
    }
    const trim = new THREE.TorusGeometry(r - 0.01, 0.042, 6, 18, Math.PI);
    add("brickRed", place(trim, x, spring, zFace - 0.035));
    for (let i = 0; i < 8; i++) {
      const a = Math.PI * (i + 0.5) / 8;
      const g = boxGeo(0.1, 0.055, 0.07);
      add("brickRed", place(g, x + Math.cos(a) * (r + 0.01), spring + Math.sin(a) * (r + 0.01), zFace - 0.055, 0, 0, Math.PI / 2 - a));
    }
    const jamb = "woodDark";
    addBox(jamb, 0.055, rectH, 0.06, x - r + 0.03, sill + rectH / 2, zFace + 0.09, [0.85, 0.8, 0.72]);
    addBox(jamb, 0.055, rectH, 0.06, x + r - 0.03, sill + rectH / 2, zFace + 0.09, [0.85, 0.8, 0.72]);
    if (!o.door) addBox(jamb, w - 0.06, 0.05, 0.06, x, sill + 0.03, zFace + 0.09, [0.85, 0.8, 0.72]);
    addBox("glass", w - 0.14, rectH - 0.02, 0.012, x, sill + rectH / 2 + 0.01, zFace + 0.17);
    const cw = (w - 0.14) * (0.3 + 0.25 * hash(x, sill, 2));
    const side = hash(sill, x, 5) > 0.5 ? 1 : -1;
    addBox("cloth", cw, rectH * 0.92, 0.006, x + side * ((w - 0.14) / 2 - cw / 2), sill + rectH * 0.5, zFace + 0.162, [0.6, 0.58, 0.53]);
    const fan = new THREE.CircleGeometry(r - 0.07, 14, 0, Math.PI);
    add("glass", place(fan, x, spring, zFace + 0.17, 0, Math.PI, 0));
    if (!o.door) {
      addBox("concrete", w + 0.16, 0.08, 0.22, x, sill - 0.02, zFace - 0.06);
      streaks(x, sill - 0.04, zFace, 4);
    }
    if (o.grille) {
      const bars = Math.max(3, Math.round(w / 0.12));
      for (let i = 0; i < bars; i++) {
        const bx = x - r + 0.06 + (i + 0.5) * ((w - 0.12) / bars);
        addBox("steel", 0.012, rectH - 0.1, 0.016, bx, sill + rectH / 2, zFace + 0.04, [0.16, 0.17, 0.18]);
      }
      addBox("steel", w - 0.1, 0.012, 0.014, x, sill + rectH * 0.35, zFace + 0.045, [0.16, 0.17, 0.18]);
      addBox("steel", w - 0.1, 0.012, 0.014, x, sill + rectH * 0.68, zFace + 0.045, [0.16, 0.17, 0.18]);
    }
  }

  function newariWindow(x, sill, zFace) {
    const w = 0.74;
    const h = 1.12;
    const y = sill + h / 2;
    const postX = w / 2 + 0.1;
    addBox("woodDark", 0.12, h + 0.62, 0.14, x - postX, y + 0.06, zFace - 0.06);
    addBox("woodDark", 0.12, h + 0.62, 0.14, x + postX, y + 0.06, zFace - 0.06);
    for (let i = 0; i < 14; i++) {
      const yy = sill - 0.08 + i * 0.1;
      addBox("woodDark", 0.16, 0.022, 0.18, x - postX, yy, zFace - 0.07, [0.78, 0.7, 0.58]);
      addBox("woodDark", 0.16, 0.022, 0.18, x + postX, yy, zFace - 0.07, [0.9, 0.82, 0.68]);
    }
    addBox("woodDark", w + 0.46, 0.12, 0.16, x, sill + h + 0.08, zFace - 0.07);
    addBox("woodDark", w + 0.58, 0.06, 0.18, x, sill + h + 0.28, zFace - 0.06);
    for (let i = 0; i < 11; i++) {
      const xx = x - (w + 0.36) / 2 + (i + 0.5) * ((w + 0.36) / 11);
      addBox("woodDark", 0.04, 0.045, 0.05, xx, sill + h + 0.18, zFace - 0.1, [0.7, 0.62, 0.5]);
    }
    const steps = [0.7, 0.5, 0.34, 0.2, 0.1];
    for (let i = 0; i < steps.length; i++) {
      addBox("woodDark", steps[i], 0.045, 0.1, x, sill + h + 0.36 + i * 0.045, zFace - 0.05);
    }
    for (let i = 0; i < 9; i++) {
      const xx = x - 0.32 + i * 0.08;
      addBox("woodDark", 0.035, 0.05, 0.03, xx, sill + h + 0.08, zFace - 0.15, [0.62, 0.52, 0.4]);
    }
    addBox("woodDark", w + 0.08, 0.05, 0.08, x, sill + 0.03, zFace + 0.05);
    addBox("woodDark", 0.045, h - 0.06, 0.07, x - w / 2 + 0.03, y, zFace + 0.06);
    addBox("woodDark", 0.045, h - 0.06, 0.07, x + w / 2 - 0.03, y, zFace + 0.06);
    addBox("woodDark", 0.04, h - 0.1, 0.05, x - w / 6, y, zFace + 0.05);
    addBox("woodDark", 0.04, h - 0.1, 0.05, x + w / 6, y, zFace + 0.05);
    addBox("woodDark", w - 0.1, 0.04, 0.05, x, y, zFace + 0.055);
    addBox("glass", w - 0.06, h - 0.06, 0.02, x, y, zFace + 0.15);
    addBox("woodDark", w + 0.36, 0.08, 0.16, x, sill - 0.02, zFace - 0.08);
    const apronTop = sill - 0.08;
    const apronH = 0.3;
    for (let i = 0; i < 7; i++) {
      const xx = x - 0.36 + i * 0.12;
      addBox("woodDark", 0.022, apronH, 0.04, xx, apronTop - apronH / 2, zFace - 0.05);
    }
    for (let j = 0; j < 4; j++) {
      addBox("woodDark", 0.78, 0.022, 0.04, x, apronTop - 0.04 - j * 0.07, zFace - 0.05);
    }
    addBox("woodDark", 0.08, 0.16, 0.22, x - 0.28, sill - 0.28, zFace - 0.02, [0.8, 0.72, 0.58]);
    addBox("woodDark", 0.08, 0.16, 0.22, x + 0.28, sill - 0.28, zFace - 0.02, [0.8, 0.72, 0.58]);
    streaks(x, sill - 0.36, zFace, 3);
  }

  function rectWindow(floor, x, sill, w, h, opt) {
    const o = opt || {};
    const zFace = floor.z;
    const y = sill + h / 2;
    const jamb = o.alu ? "plate" : "woodDark";
    const tint = o.alu ? [0.78, 0.8, 0.82] : [0.9, 0.84, 0.74];
    addBox(jamb, w, 0.05, 0.05, x, sill + h - 0.03, zFace + 0.1, tint);
    addBox(jamb, w, 0.05, 0.05, x, sill + 0.03, zFace + 0.1, tint);
    addBox(jamb, 0.05, h, 0.05, x - w / 2 + 0.03, y, zFace + 0.1, tint);
    addBox(jamb, 0.05, h, 0.05, x + w / 2 - 0.03, y, zFace + 0.1, tint);
    if (o.mullion) addBox(jamb, 0.035, h - 0.08, 0.04, x, y, zFace + 0.11, tint);
    addBox("glass", w - 0.12, h - 0.12, 0.012, x, y, zFace + 0.17);
    addBox("concrete", w + 0.14, 0.1, 0.1, x, sill + h + 0.04, zFace - 0.02);
    addBox("concrete", w + 0.18, 0.08, 0.24, x, sill - 0.02, zFace - 0.07);
    streaks(x, sill - 0.04, zFace, 3);
    if (o.board) {
      addBox("wood", w - 0.08, h * 0.72, 0.02, x + 0.03, y + 0.04, zFace + 0.04, [0.55, 0.42, 0.28]);
    } else if (o.grille !== false) {
      const bars = Math.max(3, Math.round(w / 0.11));
      for (let i = 0; i < bars; i++) {
        const bx = x - w / 2 + 0.05 + (i + 0.5) * ((w - 0.1) / bars);
        addBox("steel", 0.012, h - 0.12, 0.016, bx, y, zFace + 0.04, [0.15, 0.16, 0.17]);
      }
      addBox("steel", w - 0.08, 0.012, 0.014, x, sill + h * 0.45, zFace + 0.045, [0.15, 0.16, 0.17]);
    }
  }

  function acUnit(x, y, zFace) {
    addBox("plate", 0.55, 0.34, 0.3, x, y, zFace - 0.12, [0.72, 0.74, 0.76]);
    for (let i = 0; i < 7; i++) {
      addBox("steel", 0.46, 0.012, 0.02, x, y - 0.12 + i * 0.04, zFace - 0.28, [0.22, 0.24, 0.26]);
    }
    addBox("steel", 0.06, 0.28, 0.04, x + 0.22, y - 0.28, zFace - 0.05, [0.35, 0.36, 0.34]);
    streaks(x, y - 0.2, zFace, 3);
  }

  function ribRun(x, y0, y1, w, z, dusty) {
    for (let y = y0; y <= y1; y += 0.052) {
      const bend = hash(x, y, 2) > 0.86 ? 0.012 : 0;
      const dust = dusty * (0.55 + 0.45 * (y - y0) / Math.max(0.2, y1 - y0));
      addBox("plate", w, 0.016, 0.03, x, y, z - bend, [dust, dust * 0.98, dust * 0.92]);
    }
  }

  // ----- front floors
  const shopHoles = [
    { x: 1.23, y: 1.2, w: 1.9, h: 2.28 },
    { x: 3.63, y: 1.2, w: 1.9, h: 2.28 },
  ];
  wallZ(GF.mat, 0.02, W - 0.02, 0.02, GF.y1 - 0.18, GF.z, shopHoles);
  for (const level of LEVELS) {
    frontBeam(level);
    for (const x of COLS) frontColumn(level, x);
  }
  for (const level of UPPER) floorSlab(level);
  for (const level of [F1, F3, F4]) {
    addBox("brickRed", W + 0.06, 0.11, 0.08, W / 2, level.y0 + 0.08, level.z - 0.03);
  }

  const arches = [
    [F1, 1.22, 3.48, 1.08, 0.4, { grille: true }],
    [F1, 3.58, 3.48, 1.08, 0.4, { grille: true }],
    [F2, 1.28, 5.78, 1.58, 0.38, { door: true, grille: false }],
    [F3, 1.22, 9.02, 1.0, 0.36, { grille: true }],
    [F3, 3.52, 9.12, 0.92, 0.34, { grille: true }],
    [F4, 1.28, 11.62, 0.9, 0.34, { grille: true }],
    [F4, 3.48, 11.72, 0.82, 0.32, { grille: true }],
  ];
  function holesFor(floor, extra) {
    const list = extra ? extra.slice() : [];
    for (const a of arches) {
      if (a[0] !== floor) continue;
      const h = a[3] + a[4];
      list.push({ x: a[1], y: a[2] + h / 2, w: a[4] * 2, h });
    }
    return list;
  }
  wallZ(F1.mat, 0.02, W - 0.02, F1.y0, F1.y1 - 0.18, F1.z, holesFor(F1));
  wallZ(F2.mat, 0.02, W - 0.02, F2.y0, F2.y1 - 0.18, F2.z, holesFor(F2, [
    { x: 3.32, y: 6.92 + 0.56, w: 0.74, h: 1.12 },
  ]));
  wallZ(F3.mat, 0.02, W - 0.02, F3.y0, F3.y1 - 0.18, F3.z, holesFor(F3));
  wallZ(F4.mat, 0.02, W - 0.02, F4.y0, F4.y1 - 0.18, F4.z, holesFor(F4));
  wallZ(F5.mat, 0.02, W - 0.02, F5.y0, F5.y1 - 0.18, F5.z, [
    { x: 1.42, y: 14.32 + 0.51, w: 0.78, h: 1.02 },
    { x: 3.42, y: 14.5 + 0.44, w: 0.7, h: 0.88 },
  ]);
  for (const a of arches) archWindow(a[0], a[1], a[2], a[3], a[4], a[5]);
  newariWindow(3.32, 6.92, F2.z);
  rectWindow(F5, 1.42, 14.32, 0.78, 1.02, { alu: true, mullion: true });
  rectWindow(F5, 3.42, 14.5, 0.7, 0.88, { board: true, grille: false });
  acUnit(4.42, 4.35, F1.z);
  acUnit(0.48, 10.15, F3.z);
  peel(0.7, 4.55, 0.38, 0.26, F1.z);
  peel(2.55, 5.05, 0.28, 0.2, F1.z);
  peel(4.15, 9.7, 0.34, 0.22, F3.z);
  peel(2.1, 10.4, 0.22, 0.18, F3.z);
  peel(0.85, 12.4, 0.3, 0.24, F4.z);
  peel(3.9, 12.9, 0.26, 0.16, F4.z);
  peel(2.3, 15.15, 0.36, 0.22, F5.z);

  addBox("plasterDamp", 0.28, 0.62, 0.03, 0.14, 0.31, -0.012);
  addBox("plasterDamp", 0.36, 0.7, 0.03, 2.45, 0.35, -0.012);
  addBox("plasterDamp", 0.26, 0.55, 0.03, W - 0.14, 0.28, -0.012);

  // left bay: part-raised galvanized shutter, quilts in the mouth
  addBox("plasterSalmon", 0.08, 2.2, 0.5, 0.3, 1.18, 0.28);
  addBox("plasterSalmon", 0.08, 2.2, 0.5, 2.16, 1.18, 0.28);
  addBox("plasterSalmon", 1.78, 0.08, 0.5, 1.23, 2.28, 0.28);
  addBox("plasterCream", 1.82, 2.2, 0.06, 1.23, 1.18, 0.34, [0.66, 0.6, 0.52]);
  for (const sy of [1.45, 1.85]) {
    addBox("woodDark", 1.6, 0.03, 0.22, 1.23, sy, 0.22);
    for (let i = 0; i < 6; i++) {
      const hgt = 0.12 + hash(i, sy, 1) * 0.14;
      addBox("cloth", 0.22, hgt, 0.18, 0.55 + i * 0.27, sy + 0.015 + hgt / 2, 0.22,
        [0.35 + hash(i, sy, 2) * 0.5, 0.2 + hash(i, sy, 3) * 0.4, 0.15 + hash(i, sy, 4) * 0.4]);
    }
  }
  addBox("wood", 1.5, 0.08, 0.46, 1.23, 0.92, 0.08);
  addBox("woodDark", 1.5, 0.62, 0.04, 1.23, 0.58, 0.28);
  const quilts = [
    [0.7, 1.02, 0.02, 0.55, 0.08, 0.1],
    [1.12, 1.14, 0.0, 0.92, 0.84, 0.62],
    [1.52, 1.0, -0.02, 0.1, 0.48, 0.42],
    [0.95, 1.28, 0.02, 0.78, 0.55, 0.14],
    [1.7, 1.08, -0.04, 0.72, 0.12, 0.18],
  ];
  for (const q of quilts) addBox("cloth", 0.34, 0.14, 0.32, q[0], q[1], q[2], [q[3], q[4], q[5]]);
  addBox("cloth", 0.42, 0.85, 0.02, 1.85, 1.35, -0.08, [0.62, 0.08, 0.12]);
  addBox("cloth", 0.28, 0.6, 0.02, 0.62, 1.15, -0.05, [0.85, 0.72, 0.35]);
  ribRun(1.23, 1.58, 2.34, 1.84, -0.045, 0.78);
  addBox("plate", 0.05, 2.3, 0.06, 0.3, 1.2, -0.03, [0.45, 0.44, 0.42]);
  addBox("plate", 0.05, 2.3, 0.06, 2.16, 1.2, -0.03, [0.45, 0.44, 0.42]);
  const coilL = new THREE.CylinderGeometry(0.12, 0.12, 1.9, 14);
  add("rust", place(coilL, 1.23, 2.46, -0.06, 0, 0, Math.PI / 2), [0.7, 0.62, 0.52]);
  const bulbL = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), mats.bulb);
  bulbL.position.set(1.23, 2.05, 0.2);
  loose.push(bulbL);
  const shopLamp = new THREE.PointLight(0xffd8b0, 6, 4.5, 1.6);
  shopLamp.position.set(1.23, 1.65, -0.05);
  loose.push(shopLamp);

  // right bay: dusty shutter mostly down, crate in the bottom gap
  addBox("dark", 1.7, 1.9, 0.04, 3.63, 1.35, 0.48);
  addBox("wood", 0.42, 0.28, 0.36, 3.35, 0.2, 0.22, [0.45, 0.32, 0.18]);
  addBox("plate", 0.32, 0.22, 0.28, 3.9, 0.16, 0.18, [0.35, 0.4, 0.45]);
  ribRun(3.63, 0.38, 2.34, 1.84, -0.045, 0.62);
  addBox("plate", 0.05, 2.3, 0.06, 2.7, 1.2, -0.03, [0.4, 0.39, 0.37]);
  addBox("plate", 0.05, 2.3, 0.06, 4.56, 1.2, -0.03, [0.4, 0.39, 0.37]);
  addBox("steel", 1.7, 0.04, 0.04, 3.63, 1.15, -0.07, [0.25, 0.26, 0.27]);
  addBox("steel", 0.08, 0.1, 0.06, 4.15, 1.12, -0.09, [0.2, 0.18, 0.14]);
  const coilR = new THREE.CylinderGeometry(0.07, 0.07, 1.9, 12);
  add("rust", place(coilR, 3.63, 2.44, -0.05, 0, 0, Math.PI / 2), [0.55, 0.5, 0.45]);
  addBox("concrete", 1.7, 0.12, 0.36, 1.23, 0.06, -0.16);

  mats.sign = new THREE.MeshStandardMaterial({
    map: signCanvas(1024, 240, "SNOW LION", "GUEST HOUSE", { bg: "#6a2024", edge: "#cdb27a", fg: "#eadbb4" }),
    roughness: 0.62,
    metalness: 0,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(3.55, 0.42), mats.sign);
  sign.position.set(W / 2, 2.71, -0.34);
  sign.rotation.y = Math.PI;
  addMesh(sign);
  addBox("woodDark", 3.66, 0.5, 0.05, W / 2, 2.71, -0.3);

  mats.blade = new THREE.MeshStandardMaterial({
    map: signCanvas(220, 640, "GUEST HOUSE", null, { stack: true, bg: "#1a4e86", fg: "#f4f7fb", edge: "#d5e4f5" }),
    roughness: 0.55,
    metalness: 0.05,
    side: THREE.DoubleSide,
  });
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 1.15), mats.blade);
  blade.position.set(0.12, 4.15, -0.85);
  blade.rotation.y = Math.PI - 0.4;
  addMesh(blade);
  addBox("plate", 0.04, 1.2, 0.46, 0.12, 4.15, -0.85, [0.75, 0.78, 0.82]);

  const awn = boxGeo(4.55, 0.07, 0.95);
  awn.translate(0, 0, -0.475);
  awn.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.12));
  awn.translate(W / 2, 2.5, 0);
  add("concrete", awn, [0.8, 0.78, 0.74]);
  addBox("steel", 0.04, 0.28, 0.55, 0.9, 2.28, -0.4, [0.35, 0.36, 0.38]);
  addBox("steel", 0.04, 0.28, 0.55, 3.9, 2.28, -0.4, [0.35, 0.36, 0.38]);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mats.bulb);
  bulb.position.set(2.4, 2.22, -0.45);
  loose.push(bulb);

  // brick jali balcony on the old floor
  function jaliBalcony() {
    const x0 = 0.22;
    const x1 = 4.62;
    const y = F2.y0;
    const zWall = F2.z;
    const zOuter = -1.78;
    const xc = (x0 + x1) / 2;
    addBox("concrete", x1 - x0, 0.12, zWall - zOuter, xc, y - 0.06, (zWall + zOuter) / 2, [0.8, 0.78, 0.74]);
    addBox("concrete", x1 - x0 + 0.06, 0.05, 0.08, xc, y + 0.9, zOuter + 0.02);
    for (let x = x0; x <= x1 + 0.01; x += 0.62) {
      addBox("brickRed", 0.14, 0.9, 0.14, Math.min(x, x1), y + 0.45, zOuter + 0.02);
    }
    for (let x = x0 + 0.12; x < x1; x += 0.15) {
      addBox("brick", 0.035, 0.72, 0.05, x, y + 0.42, zOuter, [0.9, 0.86, 0.82]);
    }
    for (let k = 0; k < 4; k++) {
      addBox("brick", x1 - x0 - 0.1, 0.045, 0.05, xc, y + 0.16 + k * 0.2, zOuter, [0.85, 0.8, 0.76]);
    }
    addBox("brick", 0.1, 0.9, zWall - zOuter, x0, y + 0.4, (zWall + zOuter) / 2);
    addBox("brick", 0.1, 0.9, zWall - zOuter, x1, y + 0.4, (zWall + zOuter) / 2);
    streaks(xc, y - 0.1, zOuter, 5);
  }
  jaliBalcony();

  function pot(x, y, z, s) {
    add("pot", place(new THREE.CylinderGeometry(s * 0.16, s * 0.22, s * 0.32, 8), x, y + s * 0.16, z));
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25;
      const leaf = boxGeo(s * 0.1, s * 0.55, s * 0.28);
      add("leaf", place(leaf, x + Math.cos(a) * s * 0.1, y + s * 0.48, z + Math.sin(a) * s * 0.06, 0.4, a, 0.3), [0.15 + (i % 2) * 0.08, 0.42, 0.16]);
    }
  }
  function hang(x, y, z, tint) {
    const a = boxGeo(0.34, 0.7, 0.01);
    add("cloth", place(a, x, y - 0.28, z, 0.08, 0.05, 0.1), tint);
  }
  pot(0.7, 5.78, -1.35, 0.7);
  pot(2.15, 5.78, -1.25, 0.62);
  pot(3.7, 5.78, -1.4, 0.66);
  hang(1.15, 6.7, -1.7, [0.75, 0.28, 0.1]);

  // short steel rail on the mint ledge (floor 5 is set back)
  {
    const x0 = 2.55;
    const x1 = 4.6;
    const y = F5.y0;
    const zOuter = F4.z - 0.02;
    const xc = (x0 + x1) / 2;
    for (let x = x0; x <= x1; x += 0.7) addBox("steel", 0.03, 0.82, 0.03, x, y + 0.41, zOuter, [0.55, 0.57, 0.6]);
    addBox("steel", x1 - x0, 0.03, 0.04, xc, y + 0.84, zOuter, [0.6, 0.62, 0.64]);
    const n = Math.round((x1 - x0) / 0.12);
    for (let i = 0; i < n; i++) {
      const x = x0 + (i + 0.5) * ((x1 - x0) / n);
      addBox("steel", 0.012, 0.7, 0.012, x, y + 0.42, zOuter, [0.45, 0.47, 0.5]);
    }
    pot(2.9, y, -0.62, 0.55);
    pot(4.15, y, -0.7, 0.5);
    hang(3.5, y + 0.9, -0.78, [0.15, 0.28, 0.55]);
  }

  // party walls: strips, grid, ghost, patches, pipes
  function party(xOuter, sign) {
    const floors = [
      [0, GF.y1, 0, D],
      [F1.y0, F1.y1, F1.z, D],
      [F2.y0, F2.y1, F2.z, D],
      [F3.y0, F3.y1, F3.z, D],
      [F4.y0, F4.y1, F4.z, D],
      [F5.y0, F5.y1, F5.z, D],
    ];
    const tints = [[1, 0.96, 0.92], [0.78, 0.74, 0.7], [1.08, 0.9, 0.82], [0.88, 0.84, 0.8]];
    for (const band of floors) {
      const y0 = band[0];
      const y1 = band[1];
      const z0 = band[2];
      const z1 = band[3];
      const strips = 4;
      const span = (z1 - z0) / strips;
      for (let i = 0; i < strips; i++) {
        const a = z0 + span * i + 0.015;
        const b = z0 + span * (i + 1) - 0.015;
        const proud = (hash(a, y0, sign) - 0.45) * 0.04;
        const cx = xOuter - sign * (0.09 + proud);
        let mat = "brick";
        let tint = tints[i % 4];
        if (sign < 0 && y1 <= 6.0 && i <= 1) { mat = "plasterGhost"; tint = [1, 1, 0.94]; }
        else if (sign < 0 && y0 >= 5.7 && y1 <= 8.7 && i === 0) { mat = "plasterSalmon"; tint = [1, 0.92, 0.86]; }
        else if (sign < 0 && y0 >= 8.5 && i === 2) { mat = "concrete"; tint = [0.72, 0.72, 0.7]; }
        else if (sign > 0 && y1 <= 6.2 && i === 0) { mat = "plasterGhost"; tint = [1, 0.98, 0.9]; }
        else if (sign > 0 && y0 >= 8.5 && y1 <= 11.4 && i === 1) { mat = "plasterSalmon"; tint = [1, 0.9, 0.84]; }
        addBox(mat, 0.18, y1 - y0, Math.max(0.05, b - a), cx, (y0 + y1) / 2, (a + b) / 2, tint);
      }
      addBox("concrete", 0.26, 0.16, z1 - z0, xOuter + sign * 0.04, y1 - 0.1, (z0 + z1) / 2);
    }
    const colZ = [0.28, 2.15, 4.15, 6.05];
    for (const z of colZ) {
      addBox("concrete", 0.24, DECK, 0.26, xOuter + sign * 0.08, DECK / 2, z);
    }
  }
  party(0, -1);
  party(W, 1);

  // left ghost, patches, pipes, toothing — the side 001 left flat
  addBox("plasterGhost", 0.14, 3.4, 2.6, -0.2, 1.85, 2.0);
  addBox("plasterGhost", 0.14, 1.3, 1.5, -0.22, 4.15, 3.15);
  addBox("plasterGhost", 0.12, 0.7, 0.7, -0.22, 4.85, 4.05);
  addBox("stain", 0.02, 0.1, 2.8, -0.1, 3.6, 2.05, [0.28, 0.22, 0.18]);
  addBox("plasterSalmon", 0.07, 1.35, 1.15, -0.06, 7.55, 1.35);
  addBox("concrete", 0.06, 0.7, 0.85, -0.05, 9.5, 3.6, [0.62, 0.62, 0.6]);
  addBox("plasterMint", 0.05, 0.55, 0.5, -0.05, 11.2, 5.1, [0.75, 0.95, 0.88]);
  addBox("brickNew", 0.06, 0.85, 2.8, -0.05, 6.55, 3.6);
  addBox("plasterDamp", 0.06, 0.8, D - 0.15, -0.04, 0.4, D / 2);
  for (let i = 0; i < 6; i++) {
    addBox("stain", 0.012, 0.35, 0.28, -0.05, 5.4 - i * 0.55, 5.05 - i * 0.15, [0.4, 0.36, 0.32]);
  }
  const pvc = new THREE.CylinderGeometry(0.055, 0.06, 15.4, 8);
  add("plate", place(pvc, -0.14, 7.7, 1.15), [0.92, 0.93, 0.9]);
  addBox("plate", 0.08, 0.08, 0.35, -0.14, F2.y0 + 0.4, 1.28, [0.9, 0.91, 0.88]);
  addBox("plate", 0.08, 0.08, 0.28, -0.14, F4.y0 + 0.3, 1.22, [0.9, 0.91, 0.88]);
  const rustP = new THREE.CylinderGeometry(0.03, 0.035, 8.5, 7);
  add("rust", place(rustP, -0.08, 4.4, 1.65), [0.7, 0.45, 0.32]);
  const teeth = [0.45, 1.05, 0.3, 1.35, 0.55];
  for (let i = 0; i < teeth.length; i++) {
    addBox("brick", 0.22, teeth[i], 0.16, -0.12, teeth[i] / 2, 6.05 + (i - 2) * 0.18, [0.9, 0.82, 0.76]);
  }

  // right side, different scar
  addBox("plasterGhost", 0.08, 4.2, 2.4, W + 0.06, 5.4, 1.8);
  addBox("plasterGhost", 0.07, 1.1, 1.2, W + 0.07, 8.1, 3.3);
  addBox("plasterSalmon", 0.06, 1.1, 0.9, W + 0.05, 9.6, 4.5);
  addBox("plasterDamp", 0.03, 0.6, D - 0.4, W + 0.02, 0.3, D / 2);
  const rightPipe = new THREE.CylinderGeometry(0.035, 0.04, 12, 7);
  add("plate", place(rightPipe, W + 0.08, 6.2, 3.4), [0.7, 0.72, 0.7]);

  // back
  const backHoles = [
    { x: 1.4, y: 7.4, w: 0.6, h: 0.8 },
    { x: 3.4, y: 12.2, w: 0.55, h: 0.75 },
  ];
  const backParts = cells(0.2, W - 0.2, 0.2, DECK, backHoles);
  for (const part of backParts) addBox("brick", part.w, part.h, T, part.x, part.y, D - T / 2);
  rectWindow({ z: D - T }, 1.4, 7.0, 0.6, 0.8, {});
  rectWindow({ z: D - T }, 3.4, 11.82, 0.55, 0.75, { alu: true });

  const down = new THREE.CylinderGeometry(0.04, 0.045, 15.4, 8);
  add("plate", place(down, W + 0.02, 7.7, -0.08), [0.78, 0.8, 0.78]);
  addBox("plate", 0.16, 0.1, 0.2, W - 0.02, 0.18, -0.12, [0.75, 0.77, 0.75]);
  addBox("plate", 0.26, 0.34, 0.1, 0.2, 1.45, -0.04, [0.7, 0.72, 0.7]);

  // roof balustrade along the street, brick returns, one gap
  for (let x = 0.15; x <= W - 0.1; x += 0.22) {
    if (x > 1.55 && x < 2.15) continue;
    addBox("concrete", 0.07, 0.72, 0.07, x, DECK + 0.4, F5.z + 0.02);
  }
  addBox("concrete", W - 0.2, 0.06, 0.1, W / 2, DECK + 0.8, F5.z + 0.02);
  addBox("brick", 0.14, 0.85, D * 0.55, 0.08, DECK + 0.42, D * 0.55);
  addBox("brick", 0.14, 0.85, 2.2, 0.08, DECK + 0.42, 1.5);
  addBox("brick", 0.14, 0.85, D - 0.3, W - 0.08, DECK + 0.42, D / 2);
  addBox("brick", W, 0.7, 0.14, W / 2, DECK + 0.35, D - 0.08);
  addBox("concrete", 0.2, 0.05, 2.3, 0.08, DECK + 0.88, 1.5);

  for (const x of COLS) {
    for (const dx of [-0.07, 0.07]) {
      for (const dz of [-0.06, 0.06]) {
        const kink = x === COLS[1] && dx > 0 ? 0.18 : 0;
        const bar = new THREE.CylinderGeometry(0.008, 0.008, 1.15, 5);
        add("steel", place(bar, x + dx, DECK + 0.55, F5.z + 0.2 + dz, kink, 0, 0), [0.55, 0.32, 0.18]);
      }
    }
  }

  // tank on a braced stand
  add("tank", place(new THREE.CylinderGeometry(0.42, 0.4, 0.95, 16), 1.15, DECK + 0.55 + 0.48, 2.55));
  for (let i = 0; i < 4; i++) {
    add("tank", place(new THREE.TorusGeometry(0.41, 0.012, 5, 14), 1.15, DECK + 0.72 + i * 0.18, 2.55, Math.PI / 2, 0, 0), [0.45, 0.46, 0.48]);
  }
  add("tank", place(new THREE.CylinderGeometry(0.44, 0.44, 0.05, 16), 1.15, DECK + 0.55 + 0.98, 2.55), [0.25, 0.28, 0.3]);
  for (const dx of [-0.28, 0.28]) {
    for (const dz of [-0.28, 0.28]) {
      addBox("steel", 0.035, 0.55, 0.035, 1.15 + dx, DECK + 0.28, 2.55 + dz, [0.4, 0.4, 0.42]);
    }
  }
  addBox("steel", 0.62, 0.03, 0.03, 1.15, DECK + 0.5, 2.27, [0.4, 0.4, 0.42]);
  addBox("steel", 0.62, 0.03, 0.03, 1.15, DECK + 0.5, 2.83, [0.4, 0.4, 0.42]);
  strut(new THREE.Vector3(0.87, DECK + 0.08, 2.27), new THREE.Vector3(1.43, DECK + 0.5, 2.83), 0.012, "steel", [0.35, 0.36, 0.38]);
  strut(new THREE.Vector3(1.43, DECK + 0.08, 2.27), new THREE.Vector3(0.87, DECK + 0.5, 2.83), 0.012, "steel", [0.35, 0.36, 0.38]);
  const overflow = new THREE.CylinderGeometry(0.012, 0.012, 0.9, 6);
  add("steel", place(overflow, 1.55, DECK + 1.15, 2.55, 0, 0, Math.PI / 2), [0.7, 0.72, 0.74]);

  // evacuated tubes
  for (let i = 0; i < 8; i++) {
    const tube = new THREE.CylinderGeometry(0.032, 0.032, 1.15, 8);
    add("steel", place(tube, 2.62 + i * 0.085, DECK + 0.42, 2.35, -1.05, 0, 0), [0.1, 0.14, 0.2]);
  }
  add("tank", place(new THREE.CylinderGeometry(0.09, 0.09, 0.78, 10), 2.92, DECK + 0.74, 1.82, 0, 0, Math.PI / 2));
  addBox("steel", 0.9, 0.03, 0.04, 2.95, DECK + 0.42, 2.45, [0.55, 0.56, 0.58]);
  addBox("steel", 0.9, 0.03, 0.04, 2.95, DECK + 0.85, 1.85, [0.55, 0.56, 0.58]);
  addBox("steel", 0.04, 0.4, 0.04, 2.55, DECK + 0.25, 2.4, [0.5, 0.5, 0.52]);
  addBox("steel", 0.04, 0.55, 0.04, 3.35, DECK + 0.4, 1.9, [0.5, 0.5, 0.52]);

  // parabolic dish, bowl toward the lane, LNB in front of the focus
  {
    const R = 0.44;
    const f = 0.32;
    const yRim = (R * R) / (4 * f);
    const tilt = -1.02;
    const dx = 3.35;
    const dy = DECK + 1.05;
    const dz = 0.95;
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const r = (i / 12) * R;
      pts.push(new THREE.Vector2(r, (r * r) / (4 * f)));
    }
    const dish = new THREE.LatheGeometry(pts, 24);
    dish.rotateX(tilt);
    dish.translate(dx, dy, dz);
    add("dish", dish, [1.15, 1.15, 1.18]);
    const back = new THREE.LatheGeometry(pts, 24);
    back.translate(0, -0.02, 0);
    back.rotateX(tilt);
    back.translate(dx, dy, dz);
    add("dish", back, [0.55, 0.57, 0.6]);
    const rim = new THREE.TorusGeometry(R, 0.016, 5, 24);
    rim.rotateX(Math.PI / 2);
    rim.translate(0, yRim, 0);
    rim.rotateX(tilt);
    rim.translate(dx, dy, dz);
    add("plate", rim, [0.7, 0.72, 0.74]);
    const axis = new THREE.Vector3(0, 1, 0).applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
    const focus = new THREE.Vector3(dx, dy, dz).add(axis.clone().multiplyScalar(f));
    const lnb = new THREE.CylinderGeometry(0.035, 0.04, 0.16, 8);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.clone().normalize());
    lnb.applyMatrix4(new THREE.Matrix4().compose(focus, q, new THREE.Vector3(1, 1, 1)));
    add("steel", lnb, [0.15, 0.16, 0.18]);
    const horn = new THREE.CylinderGeometry(0.06, 0.03, 0.08, 8);
    const hornPos = focus.clone().add(axis.clone().multiplyScalar(0.1));
    horn.applyMatrix4(new THREE.Matrix4().compose(hornPos, q, new THREE.Vector3(1, 1, 1)));
    add("plate", horn, [0.8, 0.8, 0.82]);
    const rimLocal = [
      new THREE.Vector3(R, yRim, 0),
      new THREE.Vector3(-R * 0.5, yRim, R * 0.866),
      new THREE.Vector3(-R * 0.5, yRim, -R * 0.866),
    ];
    for (const p of rimLocal) {
      p.applyAxisAngle(new THREE.Vector3(1, 0, 0), tilt);
      p.add(new THREE.Vector3(dx, dy, dz));
      strut(p, focus, 0.008, "steel", [0.25, 0.26, 0.28]);
    }
    addBox("steel", 0.04, 0.95, 0.04, dx, DECK + 0.48, dz, [0.4, 0.4, 0.42]);
    const clamp = new THREE.TorusGeometry(0.045, 0.008, 5, 10);
    add("steel", place(clamp, dx, DECK + 0.85, dz, 0, 0, Math.PI / 2), [0.3, 0.3, 0.32]);
    addBox("steel", 0.16, 0.04, 0.16, dx, DECK + 0.04, dz, [0.35, 0.35, 0.37]);
  }

  // half-built stair cabin, left rear
  addBox("brick", 0.12, 1.45, 1.6, 0.32, DECK + 0.72, 5.35);
  addBox("brick", 0.12, 1.45, 1.6, 1.78, DECK + 0.72, 5.35);
  addBox("brick", 1.46, 1.45, 0.12, 1.05, DECK + 0.72, 6.1);
  addBox("concrete", 1.55, 0.08, 0.85, 1.05, DECK + 1.48, 5.75);
  for (let i = 0; i < 4; i++) addBox("concrete", 1.2, 0.07, 0.28, 1.05, DECK + 0.12 + i * 0.16, 4.7 + i * 0.28);
  for (const x of [0.32, 1.78]) {
    for (const z of [4.6, 6.05]) {
      add("steel", place(new THREE.CylinderGeometry(0.008, 0.008, 0.65, 5), x, DECK + 1.7, z), [0.55, 0.32, 0.18]);
    }
  }

  // street pole and the wire nest
  add("concrete", place(new THREE.CylinderGeometry(0.07, 0.09, 8.2, 8), -1.05, 4.1, -2.35));
  addBox("concrete", 0.9, 0.07, 0.07, -1.05, 6.9, -2.35);
  addBox("steel", 0.28, 0.36, 0.16, -1.05, 5.55, -2.28, [0.25, 0.26, 0.28]);

  function wire(pts, rad, tint) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    add("steel", new THREE.TubeGeometry(curve, 18, rad, 5, false), tint);
  }
  const black = [0.05, 0.05, 0.06];
  const ys = [3.6, 4.35, 5.15, 6.05, 7.1, 8.4, 9.7, 11.1, 12.6, 14.2];
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const sag = 0.3 + (i % 3) * 0.16;
    const z = -0.18 - (i % 4) * 0.06;
    wire([[-0.2, y, z], [W * 0.45, y - sag, z - 0.25], [W + 0.15, y - 0.05, z]], 0.007, black);
    if (i % 2 === 0) addBox("plate", 0.05, 0.05, 0.05, 0.15, y, -0.06, [0.85, 0.85, 0.8]);
  }
  wire([[0.4, 4.4, -0.25], [-0.3, 4.9, -1.2], [-1.05, 5.5, -2.35]], 0.014, black);
  for (let i = 0; i < 7; i++) {
    const y = 4.2 + i * 0.55;
    wire([[-1.05, 5.3 + (i % 3) * 0.25, -2.35], [0.4 + i * 0.15, y - 0.8, -1.6], [W - 0.2, y, -0.35]], 0.011, black);
  }
  wire([[1.6, 6.2, -0.8], [0.2, 5.4, -1.5], [-1.05, 5.7, -2.35]], 0.01, black);
  wire([[3.4, 8.8, -0.5], [1.0, 6.6, -1.4], [-1.05, 5.9, -2.35]], 0.01, black);
  wire([[4.4, 11.4, -0.7], [1.8, 8.2, -1.5], [-1.05, 6.2, -2.35]], 0.009, [0.12, 0.16, 0.32]);
  wire([[2.2, 14.6, -0.2], [0.2, 10.2, -1.3], [-1.05, 6.6, -2.35]], 0.008, black);
  wire([[0.15, 16.85, -0.15], [-0.4, 11.4, -1.2], [-1.05, 7.0, -2.35]], 0.006, [0.35, 0.35, 0.35]);
  wire([[-0.05, 4.2, 0.4], [-0.12, 3.4, 2.2], [-0.08, 2.6, 4.4]], 0.008, black);
  wire([[-0.06, 8.5, 0.3], [-0.14, 7.2, 2.6], [-0.1, 6.4, 5.0]], 0.007, black);

  const flagCols = [[0.85, 0.15, 0.15], [0.15, 0.35, 0.75], [0.95, 0.85, 0.2], [0.95, 0.95, 0.9], [0.15, 0.5, 0.25]];
  for (let i = 0; i < 5; i++) {
    const t = 0.12 + i * 0.15;
    const x = 0.15 + (-1.05 - 0.15) * t;
    const y = 16.9 + (7.05 - 16.9) * t;
    const z = -0.2 + (-2.35 + 0.2) * t;
    addBox("cloth", 0.32, 0.2, 0.012, x, y - 0.12, z, flagCols[i]);
  }

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
    for (const g of list) {
      if (g !== geo) g.dispose();
    }
  }
  for (const obj of loose) root.add(obj);

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "002";
  return root;
}
