// House 001. One Thamel shop-house. Spec: research/houses200/001/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// The street face of the ground floor is z = 0. Overhangs use negative Z.
// Later houses can copy this file's order: mass, walls, openings, balcony, roof, wires.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 5.4;
const D = 7.8;
const T = 0.22;

const GF = { y0: 0, y1: 3.42, z: 0 };
const F1 = { y0: 3.42, y1: 6.28, z: -0.78 };
const F2 = { y0: 6.28, y1: 9.08, z: -1.05 };
const F3 = { y0: 9.08, y1: 11.76, z: -0.46 };
const F4 = { y0: 11.76, y1: 14.36, z: -0.95 };
const DECK = 14.36;
const LEVELS = [GF, F1, F2, F3, F4];
const COLS = [0.24, 2.7, 5.16];

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
  const dims = [
    [d, h], [d, h],
    [w, d], [w, d],
    [w, h], [w, h],
  ];
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
    envMapIntensity: 0.7,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 1 : o.ns, o.ns == null ? 1 : o.ns);
  return m;
}

// Weathering in house-local space: blotchy wash, soot under each floor band,
// rain streaks under sills (uDrips: x, yTop, half width, length), damp at the base,
// darker soffits. Costs no triangles; vertex grime alone is too coarse on big boxes.
const MAX_DRIPS = 24;
function weather(m, desat, drips) {
  m.customProgramCacheKey = () => "house001-weather";
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDrips = drips;
    sh.uniforms.uDesat = { value: desat };
    sh.vertexShader = sh.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHP;\nvarying vec3 vHN;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHP = position;\nvHN = normal;");
    sh.fragmentShader = sh.fragmentShader
      .replace("#include <common>", `#include <common>
varying vec3 vHP;
varying vec3 vHN;
uniform vec4 uDrips[${MAX_DRIPS}];
uniform float uDesat;
float wH(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float wN(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(wH(i), wH(i + vec2(1, 0)), f.x), mix(wH(i + vec2(0, 1)), wH(i + vec2(1, 1)), f.x), f.y);
}
float wF(vec2 p) {
  float a = 0.5, s = 0.0;
  for (int i = 0; i < 4; i++) { s += a * wN(p); p = p * 2.03 + 17.1; a *= 0.5; }
  return s;
}`)
      .replace("#include <map_fragment>", `#include <map_fragment>
{
  vec2 wp = abs(vHN.x) > 0.5 ? vHP.zy : (abs(vHN.y) > 0.5 ? vHP.xz : vHP.xy);
  float n1 = wF(wp * 0.7 + 3.0);
  float n2 = wN(wp * 6.0);
  vec3 c = diffuseColor.rgb;
  float l = dot(c, vec3(0.3, 0.59, 0.11));
  c = mix(c, vec3(l) * vec3(1.0, 0.95, 0.88), uDesat * (1.0 - n1));
  float k = mix(0.78, 1.08, n1) * mix(0.94, 1.03, n2);
  float y = vHP.y;
  if (vHN.z < -0.5) {
    float sn = wN(vec2(vHP.x * 7.0, y * 0.6));
    float B[5] = float[5](3.22, 6.08, 8.88, 11.56, 14.16);
    for (int i = 0; i < 5; i++) {
      float b = B[i] - y;
      if (b > 0.0 && b < 1.1) k *= 1.0 - 0.34 * pow(1.0 - b / 1.1, 1.6) * (0.5 + 0.5 * sn);
    }
    for (int i = 0; i < ${MAX_DRIPS}; i++) {
      vec4 d = uDrips[i];
      if (d.w <= 0.0) break;
      float dy = d.y - y;
      float dx = abs(vHP.x - d.x);
      if (dy > 0.0 && dy < d.w && dx < d.z) {
        float st = smoothstep(0.3, 0.8, wN(vec2(vHP.x * 15.0 + float(i) * 3.1, y * 0.45)));
        k *= 1.0 - 0.5 * st * pow(1.0 - dy / d.w, 1.3) * smoothstep(d.z, d.z * 0.4, dx);
      }
    }
  }
  float dl = 0.85 + 0.45 * wF(vec2(vHP.x * 1.4 + vHP.z * 1.4, 2.0));
  if (y < dl) {
    c = mix(c, vec3(l) * vec3(0.86, 0.82, 0.76), 0.45);
    k *= 1.0 - 0.36 * (1.0 - y / dl);
  }
  k *= 1.0 - 0.12 * smoothstep(0.07, 0.0, abs(y - dl));
  if (vHN.y < -0.5) k *= 0.55;
  if (vHN.y > 0.5) k *= 0.86;
  diffuseColor.rgb = c * k;
}`);
  };
  return m;
}

function makeMaterials(drips) {
  const plasterN = tex("plastered_wall_nor_gl.jpg", false, 0.5, 0.5);
  const plasterA = tex("plastered_wall_arm.jpg", false, 0.5, 0.5);
  const plasterD = tex("plastered_wall_Diffuse.jpg", true, 0.5, 0.5);
  const plaster = { diff: plasterD, nor: plasterN, arm: plasterA };
  const brick = {
    diff: tex("brick_wall_006_Diffuse.jpg", true, 0.5, 0.5),
    nor: tex("brick_wall_006_nor_gl.jpg", false, 0.5, 0.5),
    arm: tex("brick_wall_006_arm.jpg", false, 0.5, 0.5),
  };
  const concrete = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 0.85, 0.85),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 0.85, 0.85),
    arm: tex("concrete_wall_001_arm.jpg", false, 0.85, 0.85),
  };
  const wood = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 0.9, 0.9),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 0.9, 0.9),
    arm: tex("weathered_brown_planks_arm.jpg", false, 0.9, 0.9),
  };
  const plate = {
    diff: tex("metal_plate_Diffuse.jpg", true, 1.4, 1.4),
    nor: tex("metal_plate_nor_gl.jpg", false, 1.4, 1.4),
    arm: tex("metal_plate_arm.jpg", false, 1.4, 1.4),
  };
  const rust = {
    diff: tex("rusty_metal_Diffuse.jpg", true, 1.1, 1.1),
    nor: tex("rusty_metal_nor_gl.jpg", false, 1.1, 1.1),
    arm: tex("rusty_metal_arm.jpg", false, 1.1, 1.1),
  };
  return {
    brick: weather(pbr(brick, 0xd8c8bc, { ao: 0.5 }), 0.25, drips),
    plasterGF: weather(pbr(plaster, 0xddcbb0, { ao: 0.4, ns: 0.6 }), 0.35, drips),
    plasterOchre: weather(pbr(plaster, 0xbb9864, { ao: 0.55, ns: 1.35 }), 0.4, drips),
    plasterMint: weather(pbr(plaster, 0x9fc4b7, { ao: 0.55, ns: 1.35 }), 0.4, drips),
    plasterCream: weather(pbr(plaster, 0xdccbb2, { ao: 0.55, ns: 1.35 }), 0.35, drips),
    plasterDamp: weather(pbr(plaster, 0x5a5146, { ao: 0.35, ns: 0.5 }), 0.2, drips),
    concrete: weather(pbr(concrete, 0xc9c4b9, { ao: 0.35 }), 0.3, drips),
    paint: weather(pbr(plate, 0xffffff, { ao: 0.3, ns: 0.6 }), 0.3, drips),
    wood: pbr(wood, 0xd2c0a4, { ao: 0.3 }),
    plate: pbr(plate, 0xffffff, { ao: 0.2, metal: true, ns: 0.8 }),
    rust: pbr(rust, 0xffffff, { ao: 0.25, metal: true }),
    stain: new THREE.MeshStandardMaterial({ color: 0x4a4038, roughness: 0.95, metalness: 0, vertexColors: true }),
    steel: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.45, metalness: 0.72, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3a4044, roughness: 0.08, metalness: 0.2, envMapIntensity: 1.1, transparent: true, opacity: 0.42, depthWrite: false }),
    room: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0, vertexColors: true }),
    tube: new THREE.MeshStandardMaterial({ color: 0xf4f6ff, emissive: 0xe8f0ff, emissiveIntensity: 0.8, roughness: 0.5 }),
    dark: new THREE.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 1, metalness: 0 }),
    pot: new THREE.MeshStandardMaterial({ color: 0x8a4e32, roughness: 0.85, metalness: 0, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, metalness: 0, vertexColors: true }),
    tank: new THREE.MeshStandardMaterial({ color: 0x16181a, roughness: 0.55, metalness: 0.08, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffb060, emissiveIntensity: 0.6, roughness: 0.4 }),
    sign: null,
    blade: null,
  };
}

function signCanvas(w, h, lines, sub) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#1b4a38";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#e6c56a";
  g.lineWidth = Math.max(8, w / 80);
  g.strokeRect(14, 14, w - 28, h - 28);
  g.fillStyle = "#f3e2a6";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.font = "700 " + Math.floor(h * 0.34) + "px Georgia, serif";
  if (sub) {
    g.fillText(lines, w / 2, h * 0.40);
    g.font = "500 " + Math.floor(h * 0.16) + "px Georgia, serif";
    g.fillText(sub, w / 2, h * 0.72);
  } else {
    const step = h / (lines.length + 1);
    g.font = "700 " + Math.floor(h * 0.22) + "px Georgia, serif";
    lines.forEach((line, i) => g.fillText(line, w / 2, step * (i + 1)));
  }
  const grime = g.createLinearGradient(0, 0, 0, h);
  grime.addColorStop(0, "rgba(40,32,24,0.05)");
  grime.addColorStop(1, "rgba(40,32,24,0.38)");
  g.fillStyle = grime;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "rgba(230,225,205,0.10)";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    const sx = hash(i, w, 1) * w;
    const sl = h * (0.2 + 0.6 * hash(i, h, 2));
    g.fillStyle = "rgba(30,24,18," + (0.06 + 0.1 * hash(i, 3, 3)) + ")";
    g.fillRect(sx, 0, 2 + 4 * hash(i, 4, 4), sl);
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
  const bands = [3.42, 6.28, 9.08, 11.76, 14.36];
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.9 + 0.1 * hash(x, y, z);
    if (y < 0.7) k *= 0.48 + 0.52 * Math.max(0, y) / 0.7;
    else if (y < 1.45) k *= 0.8 + 0.2 * ((y - 0.7) / 0.75);
    if (z < 0.35) {
      for (let b = 0; b < bands.length; b++) {
        const below = bands[b] - y;
        if (below > 0.02 && below < 0.48) k *= 0.78 + 0.22 * (below / 0.48);
      }
    }
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse001() {
  const root = new THREE.Group();
  root.name = "house-001";
  const drips = { value: Array.from({ length: MAX_DRIPS }, () => new THREE.Vector4()) };
  let dripCount = 0;
  const mats = makeMaterials(drips);
  const buckets = {};
  const loose = [];

  function add(name, g, tint) {
    paintGrime(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    add(name, place(boxGeo(w, h, d), x, y, z), tint);
  }
  function addMesh(mesh) {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
  }

  function wallZ(mat, x0, x1, y0, y1, zFace, holes) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      addBox(mat, part.w, part.h, T, part.x, part.y, zFace + T / 2);
    }
  }

  function beam(level) {
    const zFace = level.z;
    const y = level.y1 - 0.098;
    addBox("concrete", W + 0.04, 0.2, 0.16, W / 2, y, zFace + 0.015);
    const sideLen = D - zFace;
    addBox("concrete", 0.26, 0.16, sideLen, -0.04, y, zFace + sideLen / 2);
    addBox("concrete", 0.26, 0.16, sideLen, W + 0.04, y, zFace + sideLen / 2);
    if (zFace < -0.05) {
      const z0 = zFace + 0.08;
      const z1 = 0.02;
      addBox("concrete", W - 0.36, 0.07, z1 - z0, W / 2, level.y0 - 0.09, (z0 + z1) / 2);
    }
  }

  function column(level, x) {
    const zFront = level.z - 0.04;
    const zc = zFront + 0.15;
    const y0 = level.y0 + 0.02;
    const y1 = level.y1 - 0.2;
    addBox("concrete", 0.28, y1 - y0, 0.3, x, (y0 + y1) / 2, zc);
  }

  function streaks(x, yTop, zFace, n) {
    if (dripCount >= MAX_DRIPS) return;
    const len = 0.9 + hash(x, yTop, n) * 1.1;
    drips.value[dripCount++].set(x, yTop, 0.12 + n * 0.09, len);
  }

  function windowUnit(x, sill, w, h, zFace, opt) {
    const o = opt || {};
    const y = sill + h / 2;
    const frame = o.frame || "wood";
    const jamb = frame === "alu" ? "plate" : "wood";
    const tint = frame === "alu" ? [0.78, 0.8, 0.82] : [1, 1, 1];
    const zf = zFace + 0.12;
    addBox(jamb, w, 0.055, 0.05, x, sill + h - 0.028, zf, tint);
    addBox(jamb, w, 0.055, 0.05, x, sill + 0.028, zf, tint);
    addBox(jamb, 0.055, h, 0.05, x - w / 2 + 0.028, y, zf, tint);
    addBox(jamb, 0.055, h, 0.05, x + w / 2 - 0.028, y, zf, tint);
    if (o.mullion) addBox(jamb, 0.04, h - 0.08, 0.04, x, y, zf + 0.01, tint);
    addBox("concrete", 0.045, h - 0.04, 0.16, x - w / 2 + 0.02, y, zFace + 0.08);
    addBox("concrete", 0.045, h - 0.04, 0.16, x + w / 2 - 0.02, y, zFace + 0.08);
    addBox("concrete", w - 0.04, 0.045, 0.16, x, sill + 0.03, zFace + 0.08);
    addBox("concrete", w - 0.04, 0.045, 0.16, x, sill + h - 0.03, zFace + 0.08);
    addBox("glass", w - 0.12, h - 0.12, 0.012, x, y, zFace + 0.2);
    const r = hash(x, sill, 5);
    addBox("room", w - 0.08, h - 0.08, 0.02, x, y, zFace + 0.29, [0.11, 0.1, 0.09]);
    if (r > 0.25) {
      const cur = [[0.62, 0.52, 0.38], [0.55, 0.2, 0.18], [0.78, 0.74, 0.66], [0.3, 0.38, 0.5]][Math.floor(r * 13) % 4];
      const cw = (w - 0.12) * (0.4 + 0.5 * hash(sill, x, 9));
      const left = r > 0.6;
      addBox("cloth", cw, h - 0.14, 0.012, left ? x - w / 2 + 0.06 + cw / 2 : x + w / 2 - 0.06 - cw / 2, y, zFace + 0.235, cur);
    }
    addBox("concrete", w + 0.16, 0.12, 0.12, x, sill + h + 0.05, zFace - 0.01);
    addBox("concrete", w + 0.16, 0.09, 0.28, x, sill - 0.015, zFace - 0.06);
    streaks(x, sill - 0.02, zFace, 3);
    if (o.grille !== false) {
      const bars = Math.max(3, Math.round(w / 0.12));
      for (let i = 0; i < bars; i++) {
        const bx = x - w / 2 + 0.06 + (i + 0.5) * ((w - 0.12) / bars);
        addBox("steel", 0.012, h - 0.12, 0.016, bx, y, zFace + 0.045, [0.14, 0.15, 0.16]);
      }
      for (let k = 1; k <= 3; k++) {
        addBox("steel", w - 0.1, 0.012, 0.014, x, sill + (h * k) / 4, zFace + 0.046, [0.14, 0.15, 0.16]);
      }
    }
    if (o.newari) {
      addBox("wood", 0.1, h + 0.18, 0.1, x - w / 2 - 0.02, y, zFace - 0.02);
      addBox("wood", 0.1, h + 0.18, 0.1, x + w / 2 + 0.02, y, zFace - 0.02);
      addBox("wood", w + 0.36, 0.1, 0.14, x, sill + h + 0.14, zFace - 0.04);
      addBox("wood", w + 0.22, 0.06, 0.1, x, sill + h + 0.24, zFace - 0.02);
      addBox("wood", w + 0.28, 0.07, 0.12, x, sill - 0.08, zFace - 0.03);
    }
  }

  function acUnit(x, y, zFace) {
    addBox("plate", 0.52, 0.36, 0.28, x, y, zFace - 0.1, [0.82, 0.84, 0.86]);
    for (let i = 0; i < 6; i++) {
      addBox("steel", 0.44, 0.012, 0.02, x, y - 0.12 + i * 0.045, zFace - 0.25, [0.25, 0.27, 0.28]);
    }
    addBox("steel", 0.08, 0.04, 0.22, x - 0.16, y - 0.22, zFace - 0.02, [0.3, 0.3, 0.32]);
    addBox("steel", 0.08, 0.04, 0.22, x + 0.16, y - 0.22, zFace - 0.02, [0.3, 0.3, 0.32]);
  }

  function peel(x, y, w, h, zFace) {
    addBox("plasterDamp", w + 0.05, h + 0.04, 0.012, x, y, zFace - 0.006, [1.5, 1.42, 1.32]);
    addBox("brick", w, h, 0.016, x, y, zFace - 0.01, [0.78, 0.66, 0.58]);
  }

  // ----- front floors
  const shopHoles = [
    { x: 1.38, y: 1.34, w: 2.2, h: 2.46 },
    { x: 4.02, y: 1.34, w: 2.2, h: 2.46 },
  ];
  wallZ("plasterGF", 0.02, W - 0.02, 0.02, GF.y1 - 0.2, GF.z, shopHoles);
  for (const level of [F1, F2, F3, F4]) beam(level);
  beam(GF);
  for (const level of LEVELS) {
    for (const x of COLS) column(level, x);
  }

  const f1holes = [
    { x: 1.42, y: 4.2 + 0.75, w: 1.1, h: 1.5 },
    { x: 3.98, y: 4.2 + 0.75, w: 1.1, h: 1.5 },
  ];
  wallZ("brick", 0.02, W - 0.02, F1.y0, F1.y1 - 0.2, F1.z, f1holes);
  windowUnit(1.42, 4.2, 1.1, 1.5, F1.z, { frame: "wood" });
  windowUnit(3.98, 4.2, 1.1, 1.5, F1.z, { frame: "wood" });
  acUnit(4.85, 4.85, F1.z);

  const f2holes = [
    { x: 1.82, y: 6.3 + 1.01, w: 1.18, h: 2.02 },
    { x: 4.18, y: 7.18 + 0.69, w: 0.96, h: 1.38 },
  ];
  wallZ("plasterOchre", 0.02, W - 0.02, F2.y0, F2.y1 - 0.2, F2.z, f2holes);
  windowUnit(1.82, 6.3, 1.18, 2.02, F2.z, { frame: "wood", grille: false, mullion: true });
  windowUnit(4.18, 7.18, 0.96, 1.38, F2.z, { frame: "wood" });
  peel(3.3, 7.6, 0.42, 0.28, F2.z);
  peel(0.7, 8.15, 0.26, 0.2, F2.z);

  const f3holes = [0.98, 2.7, 4.42].map((x) => ({ x, y: 9.92 + 0.63, w: 0.86, h: 1.26 }));
  wallZ("plasterMint", 0.02, W - 0.02, F3.y0, F3.y1 - 0.2, F3.z, f3holes);
  for (const x of [0.98, 2.7, 4.42]) windowUnit(x, 9.92, 0.86, 1.26, F3.z, { frame: "alu" });
  acUnit(0.42, 10.45, F3.z);
  peel(3.55, 10.7, 0.34, 0.22, F3.z);
  addBox("cloth", 0.46, 0.7, 0.015, 2.7, 10.15, F3.z + 0.06, [0.85, 0.25, 0.18]);

  const f4holes = [
    { x: 1.38, y: 12.52 + 0.76, w: 1.28, h: 1.52 },
    { x: 4.08, y: 11.78 + 0.96, w: 0.84, h: 1.92 },
  ];
  wallZ("plasterCream", 0.02, W - 0.02, F4.y0, F4.y1 - 0.2, F4.z, f4holes);
  windowUnit(1.38, 12.52, 1.28, 1.52, F4.z, { frame: "wood", newari: true });
  windowUnit(4.08, 11.78, 0.84, 1.92, F4.z, { frame: "wood", grille: false });
  peel(2.55, 13.1, 0.3, 0.24, F4.z);
  peel(4.7, 13.4, 0.22, 0.18, F4.z);

  // damp piers on the shop
  addBox("plasterDamp", 0.32, 0.7, 0.03, 0.16, 0.35, -0.012);
  addBox("plasterDamp", 0.4, 0.7, 0.03, 2.7, 0.35, -0.012);
  addBox("plasterDamp", 0.32, 0.7, 0.03, W - 0.16, 0.35, -0.012);

  // closed left shutter, painted, with ribs
  addBox("paint", 2.12, 2.4, 0.02, 1.38, 1.34, -0.03, [0.42, 0.56, 0.5]);
  for (let y = 0.2; y < 2.5; y += 0.075) {
    addBox("paint", 2.14, 0.016, 0.045, 1.38, y, -0.05, [0.34, 0.46, 0.41]);
  }
  addBox("paint", 0.05, 2.44, 0.05, 0.32, 1.34, -0.04, [0.3, 0.4, 0.36]);
  addBox("paint", 0.05, 2.44, 0.05, 2.44, 1.34, -0.04, [0.3, 0.4, 0.36]);

  // right shutter rolled up: deep dark mouth, coil, a few slats
  // the open shop: a small trekking-gear room, not a black void
  addBox("plasterGF", 2.2, 2.3, 0.06, 4.02, 1.15, 3.0, [0.72, 0.68, 0.62]);
  addBox("plasterGF", 0.06, 2.3, 2.55, 2.98, 1.15, 1.75, [0.7, 0.66, 0.6]);
  addBox("plasterGF", 0.06, 2.3, 2.55, 5.06, 1.15, 1.75, [0.7, 0.66, 0.6]);
  addBox("concrete", 2.1, 0.04, 2.55, 4.02, 0.12, 1.75, [0.2, 0.19, 0.17]);
  addBox("room", 2.1, 0.04, 2.55, 4.02, 2.24, 1.75, [0.2, 0.19, 0.18]);
  const tubeL = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.03, 0.04), mats.tube);
  tubeL.position.set(4.02, 2.2, 2.2);
  loose.push(tubeL);
  const goods = [[0.42, 0.24, 0.13], [0.15, 0.16, 0.2], [0.46, 0.09, 0.07], [0.55, 0.42, 0.1], [0.12, 0.24, 0.34], [0.22, 0.24, 0.17], [0.38, 0.37, 0.34]].map((c) => c.map((v) => v * 0.6));
  for (let s = 0; s < 4; s++) {
    const sy = 0.5 + s * 0.45;
    addBox("wood", 1.96, 0.03, 0.36, 4.02, sy, 2.78, [0.7, 0.62, 0.52]);
    let gx = 3.1;
    for (let i = 0; gx < 4.9; i++) {
      const gw = 0.18 + hash(s, i, 3) * 0.16;
      const gh = 0.14 + hash(i, s, 4) * 0.2;
      addBox("cloth", gw - 0.02, gh, 0.3, gx + gw / 2, sy + 0.015 + gh / 2, 2.78, goods[Math.floor(hash(s, i, 7) * 7)]);
      gx += gw;
    }
  }
  for (let i = 0; i < 4; i++) {
    addBox("cloth", 0.14, 0.44, 0.3, 5.0, 1.75 - (i % 2) * 0.62, 1.0 + Math.floor(i / 2) * 0.62, goods[(i * 3 + 1) % 7]);
  }
  addBox("steel", 1.9, 0.02, 0.02, 4.02, 2.04, 0.62, [0.3, 0.3, 0.32]);
  for (let i = 0; i < 7; i++) {
    const jx = 3.22 + i * 0.27;
    const jh = 0.52 + hash(i, 2, 2) * 0.22;
    addBox("cloth", 0.2 + hash(i, 3, 3) * 0.05, jh, 0.1 + hash(i, 1, 1) * 0.06, jx, 2.0 - jh / 2, 0.64 + hash(i, 4, 4) * 0.06, goods[(i * 5 + 2) % 7]);
    addBox("cloth", 0.06, 0.48, 0.08, jx - 0.15, 1.72, 0.66, goods[(i * 5 + 2) % 7]);
  }
  addBox("wood", 0.9, 0.82, 0.5, 3.55, 0.55, 2.2, [0.62, 0.55, 0.46]);
  addBox("plasterGF", 0.06, 2.1, 0.4, 2.95, 1.16, 0.28);
  addBox("plasterGF", 0.06, 2.1, 0.4, 5.09, 1.16, 0.28);
  addBox("plasterGF", 2.08, 0.08, 0.4, 4.02, 2.2, 0.28);
  addBox("concrete", 2.3, 0.14, 0.42, 4.02, 0.07, -0.16);
  const coil = new THREE.CylinderGeometry(0.11, 0.11, 2.16, 14);
  add("rust", place(coil, 4.02, 2.4, -0.08, 0, 0, Math.PI / 2));
  for (let i = 0; i < 4; i++) addBox("rust", 2.14, 0.04, 0.03, 4.02, 2.22 - i * 0.05, -0.04);

  // sign board and blade
  mats.sign = new THREE.MeshStandardMaterial({
    map: signCanvas(1024, 256, "HIMAL GEAR", "TREKKING  ·  TENTS  ·  BOOTS"),
    roughness: 0.65,
    metalness: 0,
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 0.48), mats.sign);
  sign.position.set(W / 2, 2.96, -0.09);
  sign.rotation.y = Math.PI;
  addMesh(sign);
  addBox("wood", 4.96, 0.54, 0.05, W / 2, 2.96, -0.05);

  mats.blade = new THREE.MeshStandardMaterial({
    map: signCanvas(512, 768, ["HIMAL", "GEAR"], null),
    roughness: 0.6,
    metalness: 0,
    side: THREE.DoubleSide,
  });
  const blade = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.78), mats.blade);
  blade.position.set(0.06, 2.15, -0.55);
  blade.rotation.y = Math.PI / 2;
  addMesh(blade);
  addBox("wood", 0.04, 0.82, 0.54, 0.06, 2.15, -0.55);

  // awning: pivot at the wall, outer edge drops toward the lane
  const awn = boxGeo(5.0, 0.016, 1.05);
  awn.translate(0, 0, -0.525);
  awn.applyMatrix4(new THREE.Matrix4().makeRotationX(-0.22));
  awn.translate(W / 2, 2.58, 0);
  add("rust", awn, [0.85, 0.82, 0.76]);
  addBox("steel", 0.04, 0.35, 0.7, 1.3, 2.32, -0.45, [0.35, 0.36, 0.38]);
  addBox("steel", 0.04, 0.35, 0.7, 4.1, 2.32, -0.45, [0.35, 0.36, 0.38]);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 10, 8), mats.bulb);
  bulb.position.set(2.7, 2.28, -0.55);
  loose.push(bulb);

  // balconies
  function balcony(x0, x1, y, zWall, zOuter) {
    const depth = zWall - zOuter;
    const xc = (x0 + x1) / 2;
    const zc = (zWall + zOuter) / 2;
    addBox("concrete", x1 - x0, 0.11, depth, xc, y - 0.055, zc);
    addBox("concrete", x1 - x0 + 0.04, 0.05, 0.08, xc, y - 0.1, zOuter + 0.02);
    const railY = y + 0.08;
    const railH = 0.86;
    const posts = [];
    for (let x = x0 + 0.04; x <= x1 - 0.02; x += 1.15) posts.push(x);
    posts.push(x1 - 0.04);
    for (const x of posts) addBox("steel", 0.03, railH, 0.03, x, y + railH / 2, zOuter, [0.62, 0.64, 0.66]);
    addBox("steel", x1 - x0, 0.028, 0.04, xc, y + 0.92, zOuter, [0.62, 0.64, 0.66]);
    addBox("steel", x1 - x0, 0.02, 0.025, xc, y + 0.48, zOuter, [0.55, 0.56, 0.58]);
    const span = x1 - x0 - 0.12;
    const n = Math.round(span / 0.12);
    for (let i = 0; i < n; i++) {
      const x = x0 + 0.08 + (i + 0.5) * (span / n);
      addBox("steel", 0.012, 0.78, 0.012, x, y + 0.5, zOuter, [0.5, 0.52, 0.54]);
    }
    addBox("steel", 0.03, railH, 0.03, x0 + 0.04, y + railH / 2, zWall - 0.04, [0.62, 0.64, 0.66]);
    addBox("steel", 0.03, railH, 0.03, x1 - 0.04, y + railH / 2, zWall - 0.04, [0.62, 0.64, 0.66]);
    addBox("steel", 0.025, 0.03, depth - 0.04, x0 + 0.04, y + 0.92, zc, [0.62, 0.64, 0.66]);
    addBox("steel", 0.025, 0.03, depth - 0.04, x1 - 0.04, y + 0.92, zc, [0.62, 0.64, 0.66]);
    streaks(xc, y - 0.1, zOuter, 5);
    return { y, zOuter, x0, x1 };
  }
  balcony(0.38, 5.02, F2.y0, F2.z, -1.92);
  balcony(3.15, 5.18, F4.y0, F4.z, -1.62);

  function pot(x, y, z, s) {
    const g = new THREE.CylinderGeometry(s * 0.55, s * 0.4, s * 0.5, 8);
    add("pot", place(g, x, y + s * 0.25, z));
    for (let i = 0; i < 5; i++) {
      const a = i * 1.25;
      const leaf = boxGeo(s * 0.12, s * 0.85, s * 0.42);
      add("leaf", place(leaf, x + Math.cos(a) * s * 0.12, y + s * 0.7, z + Math.sin(a) * s * 0.08, 0.5, a, 0.35), [0.16 + (i % 2) * 0.06, 0.4, 0.16]);
    }
  }
  function hang(x, y, z, tint) {
    const a = boxGeo(0.36, 0.72, 0.008);
    add("cloth", place(a, x, y - 0.28, z, 0.05, 0.04, 0.06), tint);
    const b = boxGeo(0.26, 0.58, 0.008);
    add("cloth", place(b, x + 0.14, y - 0.4, z + 0.012, -0.06, -0.05, -0.04), tint);
  }
  pot(0.85, 6.28, -1.28, 0.46);
  pot(2.2, 6.28, -1.2, 0.4);
  pot(3.5, 6.28, -1.3, 0.42);
  pot(3.55, 11.76, -1.02, 0.36);
  pot(4.6, 11.76, -1.08, 0.4);
  hang(1.2, 7.15, -1.7, [0.72, 0.22, 0.1]);
  hang(4.35, 12.62, -1.36, [0.15, 0.26, 0.55]);

  // Party walls follow each floor's street face, so the cantilever is a step, not a flat slab.
  function side(x) {
    addBox("brick", 0.2, GF.y1, D, x, GF.y1 / 2, D / 2);
    for (const level of [F1, F2, F3, F4]) {
      const z0 = level.z;
      const z1 = D;
      const h = level.y1 - level.y0;
      addBox("brick", 0.2, h, z1 - z0, x, level.y0 + h / 2, (z0 + z1) / 2);
    }
  }
  side(0.1);
  side(W - 0.1);
  addBox("dark", 0.03, 0.8, 0.5, 0.015, 7.5, 0.85);
  addBox("wood", 0.045, 0.9, 0.05, -0.02, 7.5, 0.6);
  addBox("wood", 0.045, 0.9, 0.05, -0.02, 7.5, 1.1);
  addBox("wood", 0.045, 0.05, 0.58, -0.02, 7.92, 0.85);
  addBox("wood", 0.045, 0.05, 0.58, -0.02, 7.08, 0.85);
  addBox("dark", 0.03, 0.8, 0.5, W - 0.015, 10.4, 0.9);
  addBox("wood", 0.045, 0.9, 0.05, W + 0.02, 10.4, 0.65);
  addBox("wood", 0.045, 0.9, 0.05, W + 0.02, 10.4, 1.15);
  const sidePipe = new THREE.CylinderGeometry(0.035, 0.04, 11.5, 7);
  add("plate", place(sidePipe, -0.07, 6.4, 1.15), [0.55, 0.56, 0.52]);

  // back wall, two small windows
  const backHoles = [
    { x: 1.6, y: 8.2, w: 0.7, h: 0.9 },
    { x: 3.9, y: 11.2, w: 0.7, h: 0.9 },
  ];
  const backParts = cells(0.2, W - 0.2, 0.02, DECK, backHoles);
  for (const part of backParts) addBox("brick", part.w, part.h, T, part.x, part.y, D - T / 2);
  windowUnit(1.6, 7.75, 0.7, 0.9, D - T, { frame: "wood" });
  windowUnit(3.9, 10.75, 0.7, 0.9, D - T, { frame: "alu" });

  // downpipe and meter
  const pipe = new THREE.CylinderGeometry(0.045, 0.05, 14.0, 8);
  add("plate", place(pipe, W + 0.02, 7.15, -0.06), [0.7, 0.72, 0.7]);
  addBox("plate", 0.28, 0.1, 0.28, W - 0.05, 0.22, -0.12, [0.7, 0.72, 0.7]);
  addBox("plate", 0.28, 0.36, 0.12, 0.22, 1.55, -0.05, [0.75, 0.76, 0.74]);

  // parapet and coping
  addBox("brick", W, 0.92, 0.16, W / 2, DECK + 0.46, F4.z + 0.02);
  addBox("brick", 0.16, 0.92, D + 0.7, 0.08, DECK + 0.46, D / 2 - 0.35);
  addBox("brick", 0.16, 0.92, D + 0.7, W - 0.08, DECK + 0.46, D / 2 - 0.35);
  addBox("brick", W, 0.92, 0.16, W / 2, DECK + 0.46, D - 0.08);
  addBox("concrete", W + 0.08, 0.06, 0.22, W / 2, DECK + 0.95, F4.z);
  addBox("concrete", 0.22, 0.06, D + 0.75, 0.08, DECK + 0.95, D / 2 - 0.35);
  addBox("concrete", 0.22, 0.06, D + 0.75, W - 0.08, DECK + 0.95, D / 2 - 0.35);

  // rebar above the front columns, clear of the parapet
  for (const x of COLS) {
    for (const dx of [-0.07, 0.07]) {
      for (const dz of [-0.07, 0.07]) {
        const bar = new THREE.CylinderGeometry(0.008, 0.008, 1.35, 6);
        add("steel", place(bar, x + dx, DECK + 0.67, F4.z + 0.18 + dz), [0.55, 0.32, 0.16]);
      }
    }
  }

  // tank
  const tank = new THREE.CylinderGeometry(0.48, 0.46, 1.05, 16);
  add("tank", place(tank, 1.25, DECK + 0.62 + 0.52, 2.3));
  for (let i = 0; i < 5; i++) {
    const rib = new THREE.TorusGeometry(0.485, 0.012, 5, 14);
    add("tank", place(rib, 1.25, DECK + 0.78 + i * 0.18, 2.3, Math.PI / 2, 0, 0), [0.55, 0.55, 0.58]);
  }
  const lid = new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16);
  add("tank", place(lid, 1.25, DECK + 0.62 + 1.07, 2.3), [0.7, 0.7, 0.72]);
  for (const dx of [-0.32, 0.32]) {
    for (const dz of [-0.32, 0.32]) {
      addBox("steel", 0.04, 0.62, 0.04, 1.25 + dx, DECK + 0.31, 2.3 + dz, [0.4, 0.4, 0.42]);
    }
  }
  addBox("steel", 0.7, 0.03, 0.03, 1.25, DECK + 0.5, 2.3, [0.4, 0.4, 0.42]);
  addBox("steel", 0.03, 0.03, 0.7, 1.25, DECK + 0.5, 2.3, [0.4, 0.4, 0.42]);
  const overflow = new THREE.CylinderGeometry(0.015, 0.015, 0.8, 6);
  add("steel", place(overflow, 1.7, DECK + 1.35, 2.3, 0, 0, Math.PI / 2), [0.45, 0.46, 0.48]);

  // solar heater, tilted toward the lane
  const solarMat = new THREE.MeshStandardMaterial({ roughness: 0.28, metalness: 0.35, color: 0xffffff });
  const solarC = document.createElement("canvas");
  solarC.width = 512;
  solarC.height = 320;
  const sg = solarC.getContext("2d");
  sg.fillStyle = "#10283c";
  sg.fillRect(0, 0, 512, 320);
  sg.strokeStyle = "#7eb4d4";
  sg.lineWidth = 4;
  for (let i = 1; i < 8; i++) { sg.beginPath(); sg.moveTo(i * 64, 10); sg.lineTo(i * 64, 310); sg.stroke(); }
  for (let j = 1; j < 6; j++) { sg.beginPath(); sg.moveTo(10, j * 53); sg.lineTo(502, j * 53); sg.stroke(); }
  const solarMap = new THREE.CanvasTexture(solarC);
  solarMap.colorSpace = THREE.SRGBColorSpace;
  solarMat.map = solarMap;
  const panel = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.03, 0.95), solarMat);
  panel.position.set(3.25, DECK + 0.85, 1.7);
  panel.rotation.x = -0.42;
  panel.castShadow = true;
  loose.push(panel);
  addBox("steel", 1.6, 0.03, 0.04, 3.25, DECK + 0.72, 1.95, [0.7, 0.72, 0.74]);
  addBox("steel", 1.6, 0.03, 0.04, 3.25, DECK + 0.98, 1.45, [0.7, 0.72, 0.74]);
  addBox("steel", 0.04, 0.55, 0.04, 2.55, DECK + 0.4, 1.9, [0.55, 0.56, 0.58]);
  addBox("steel", 0.04, 0.75, 0.04, 3.95, DECK + 0.5, 1.5, [0.55, 0.56, 0.58]);

  // dish facing the lane
  const dish = new THREE.SphereGeometry(0.55, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.48);
  dish.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, -1, 0),
    new THREE.Vector3(0.62, 0.28, -0.73).normalize(),
  ));
  dish.translate(2.35, DECK + 2.15, 4.15);
  add("plate", dish, [0.9, 0.9, 0.92]);
  const mast = new THREE.CylinderGeometry(0.02, 0.025, 1.2, 6);
  add("steel", place(mast, 2.35, DECK + 0.85, 4.15), [0.5, 0.5, 0.52]);
  addBox("steel", 0.02, 0.02, 0.36, 2.35, DECK + 1.9, 3.95, [0.2, 0.2, 0.22]);

  // half-built stair cabin
  const sy0 = DECK;
  const sy1 = 16.45;
  addBox("brick", 0.15, sy1 - sy0, 1.9, 3.5, (sy0 + sy1) / 2, 6.1);
  addBox("brick", 0.15, sy1 - sy0, 1.9, 5.08, (sy0 + sy1) / 2, 6.1);
  addBox("brick", 1.58, sy1 - sy0, 0.15, 4.29, (sy0 + sy1) / 2, 7.0);
  addBox("concrete", 1.7, 0.1, 0.95, 4.29, sy1, 6.55);
  for (let i = 0; i < 4; i++) {
    addBox("concrete", 1.35, 0.08, 0.32, 4.29, DECK + 0.12 + i * 0.18, 5.45 + i * 0.32);
  }
  for (const x of [3.52, 5.05]) {
    for (const z of [5.25, 6.95]) {
      const bar = new THREE.CylinderGeometry(0.008, 0.008, 0.7, 5);
      add("steel", place(bar, x, sy1 + 0.15, z), [0.55, 0.32, 0.16]);
    }
  }

  // street pole
  const pole = new THREE.CylinderGeometry(0.08, 0.1, 7.4, 8);
  add("concrete", place(pole, -0.95, 3.7, -2.55));
  addBox("concrete", 1.1, 0.08, 0.08, -0.95, 6.55, -2.55);
  addBox("steel", 0.7, 0.05, 0.05, -0.7, 6.85, -2.55, [0.4, 0.4, 0.42]);

  // wires across the facade and out to the pole
  function wire(pts, rad, tint) {
    const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
    add("steel", new THREE.TubeGeometry(curve, 14, rad, 5, false), tint);
  }
  const black = [0.06, 0.06, 0.07];
  const ys = [4.7, 5.9, 7.35, 8.55, 10.4, 12.15];
  for (let i = 0; i < ys.length; i++) {
    const y = ys[i];
    const sag = 0.12 + (i % 3) * 0.08;
    wire([[-0.15, y, -0.15], [W * 0.5, y - sag, -0.28], [W + 0.1, y - 0.05, -0.12]], 0.008, black);
    addBox("plate", 0.06, 0.06, 0.06, 0.12, y, -0.08, [0.9, 0.9, 0.85]);
    addBox("plate", 0.06, 0.06, 0.06, W - 0.15, y, -0.08, [0.9, 0.9, 0.85]);
  }
  wire([[0.4, 5.2, -0.2], [-0.2, 4.6, -1.1], [-0.95, 6.4, -2.55]], 0.012, black);
  wire([[2.2, 7.4, -0.7], [0.4, 6.2, -1.5], [-0.95, 6.5, -2.55]], 0.01, black);
  wire([[4.4, 10.5, -0.4], [1.5, 8.2, -1.4], [-0.95, 6.7, -2.55]], 0.01, [0.15, 0.18, 0.35]);
  wire([[1.2, 15.1, -0.3], [-0.1, 11.5, -1.2], [-0.95, 6.9, -2.55]], 0.008, black);

  // prayer flags, roof corner down to the pole
  const flagCols = [[0.9, 0.15, 0.15], [0.95, 0.85, 0.2], [0.95, 0.95, 0.9], [0.2, 0.45, 0.85], [0.15, 0.55, 0.28]];
  for (let i = 0; i < 5; i++) {
    const t = 0.15 + i * 0.14;
    const x = 0.15 + ( -0.95 - 0.15) * t;
    const y = 15.15 + (7.15 - 15.15) * t;
    const z = -0.4 + (-2.55 + 0.4) * t;
    addBox("cloth", 0.36, 0.22, 0.012, x, y - 0.12, z, flagCols[i]);
  }
  wire([[0.15, 15.15, -0.4], [-0.4, 11.2, -1.5], [-0.95, 7.2, -2.55]], 0.006, [0.3, 0.3, 0.3]);

  // streaks under the cantilever noses
  streaks(1.4, F1.y0 - 0.02, F1.z, 4);
  streaks(3.6, F2.y0 - 0.02, -1.68, 4);
  streaks(2.2, F3.y0 - 0.02, F3.z, 3);
  streaks(4.2, F4.y0 - 0.02, -1.34, 3);

  // heavier, lower service drops: shop meter out to the pole
  wire([[0.3, 3.3, -0.12], [-0.2, 2.75, -1.2], [-0.6, 3.6, -2.1], [-0.95, 6.2, -2.55]], 0.014, black);
  wire([[0.6, 3.36, -0.1], [-0.05, 2.9, -1.0], [-0.55, 3.9, -2.0], [-0.95, 6.3, -2.55]], 0.01, black);
  wire([[W - 0.2, 3.3, -0.1], [W * 0.5, 2.98, -0.35], [0.4, 3.28, -0.12]], 0.009, black);
  add("steel", place(new THREE.TorusGeometry(0.16, 0.025, 5, 12), -0.95, 4.6, -2.48), black);

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
  for (const mesh of loose) root.add(mesh);

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = tris;
  root.userData.id = "001";
  return root;
}
