// House 010. Jhochhen Tol (Freak Street), west face of OSM way 906975896, edge 5, 16.08 m.
// Spec: research/houses200/010/design.md
// Origin: front-left ground corner. +X along the street toward the shutter, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. Source x is mirrored at build so photo-left is the snack shop.
// Still: pano kU1uAm_Nmk155_Gvg4H9ew, yaw 20, pitch -8. Copy that frame.
// Ground, low X to high X: snack counter, a dark door, TAMBA's, a yellow stall, a shutter.
// One plaster floor above, with the Okta board and two dark windows. No phone numbers.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 16.08;
const D = 11.81;
const T = 0.22;
const ROOF = 6.45;
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
  return t;
}

function canvasTex(draw, w, h) {
  const c = canvas(w, h);
  draw(c.getContext("2d"), w, h);
  return toTex(c, true);
}

function worldUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) * 0.45, p.getY(i) * 0.45);
    else if (ax >= ay) uv.setXY(i, p.getZ(i) * 0.45, p.getY(i) * 0.45);
    else uv.setXY(i, p.getX(i) * 0.45, p.getZ(i) * 0.45);
  }
  return g;
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  if (p.z < 0.8) {
    ao *= 1.0 - 0.45 * smoothstep(0.4, 0.0, 2.7 - p.y) * step(0.0, 2.7 - p.y);
    ao *= 1.0 - 0.28 * smoothstep(0.35, 0.0, 3.55 - p.y) * step(0.0, 3.55 - p.y);
  }
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.4, p.y);
  ao *= 1.0 - 0.35 * smoothstep(0.15, 0.0, p.z);
  return ao;
}
float h010(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
float n010(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(h010(i), h010(i + vec2(1.0, 0.0)), f.x), mix(h010(i + vec2(0.0, 1.0)), h010(i + vec2(1.0, 1.0)), f.x), f.y);
}
`;

// Plaster only: damp at the foot, soot run-off under each ledge, blotchy repaint.
const GRIME_GLSL = `
{
  vec3 hp = vHousePos;
  float u = hp.x + hp.z;
  float mott = n010(vec2(u, hp.y) * 1.3) * 0.6 + n010(vec2(u, hp.y) * 4.1) * 0.4;
  float streak = n010(vec2(u * 7.0, hp.y * 0.35)) * n010(vec2(u * 2.3, 1.7));
  float run = 0.0;
  run += smoothstep(1.3, 0.0, 3.3 - hp.y) * step(hp.y, 3.3);
  run += smoothstep(1.1, 0.0, 5.88 - hp.y) * step(hp.y, 5.88);
  run += 0.6 * smoothstep(0.5, 0.0, 6.45 - hp.y);
  float soot = clamp(run * (0.25 + 0.9 * streak), 0.0, 1.0) * 0.55;
  float damp = smoothstep(1.1, 0.05, hp.y) * (0.55 + 0.45 * n010(vec2(u * 1.7, hp.y * 3.0)));
  vec3 c = diffuseColor.rgb * (0.86 + 0.22 * mott);
  c = mix(c, c * vec3(0.55, 0.5, 0.48), soot);
  c = mix(c, c * vec3(0.62, 0.6, 0.58), damp * 0.6);
  diffuseColor.rgb = c;
}
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.55 + 0.45 * hao);
reflectedLight.directSpecular *= ${OVERCAST.spec.toFixed(3)} * hao;
reflectedLight.indirectDiffuse *= ${OVERCAST.ind.toFixed(3)} * hao;
reflectedLight.indirectSpecular *= hao;
`;

const CANVAS_MATS = new Set(["sign", "beauty", "ice", "menu", "store", "posters"]);
const GRIME_KEYS = new Set(["plaster", "plasterDark", "concrete"]);

function houseShader(mat, key) {
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + AO_GLSL);
    if (GRIME_KEYS.has(key)) frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\n" + GRIME_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house010-" + key; };
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
    aoMapIntensity: o.ao == null ? 0.35 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.2 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.6 : o.ns, o.ns == null ? 0.6 : o.ns);
  return m;
}

function tambaSign() {
  return canvasTex((g, w, h) => {
    const bg = g.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#b80d16");
    bg.addColorStop(0.5, "#d4141e");
    bg.addColorStop(1, "#9c0a12");
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#7a0810";
    g.lineWidth = 10;
    g.strokeRect(5, 5, w - 10, h - 10);
    g.fillStyle = "#fbf7f2";
    g.beginPath();
    g.arc(150, h * 0.48, 92, 0, 6.3);
    g.fill();
    g.fillStyle = "#d4141e";
    g.beginPath();
    g.arc(150, h * 0.48, 78, 0, 6.3);
    g.fill();
    g.fillStyle = "#f4c400";
    g.fillRect(112, h * 0.3, 76, 22);
    g.fillRect(138, h * 0.3, 24, 96);
    g.shadowColor = "rgba(255,240,230,0.9)";
    g.shadowBlur = 14;
    g.fillStyle = "#ffffff";
    g.font = "bold 132px sans-serif";
    g.textAlign = "left";
    g.fillText("TAMBA", 280, h * 0.6);
    const tw = g.measureText("TAMBA").width;
    g.font = "bold 78px sans-serif";
    g.fillText("'s", 290 + tw, h * 0.62);
    g.font = "bold 40px sans-serif";
    g.fillText("MO:MO & BURGER", 420, h * 0.88);
  }, 1024, 300);
}

function beautySign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#101010";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#e9c92a";
    g.fillRect(0, h * 0.78, w, h * 0.22);
    // Photo strip: faces, nails, lashes. Muted squares, no detail.
    const tones = ["#c99a84", "#8a5a4a", "#d8b8a8", "#b07a6a", "#e0c8b8", "#9a6a5a", "#c8a090"];
    for (let i = 0; i < 7; i++) {
      g.fillStyle = tones[i];
      g.fillRect(250 + i * 92, 108, 82, 62);
    }
    g.fillStyle = "#d8b49c";
    g.fillRect(14, 14, 118, 156);
    g.fillRect(w - 132, 14, 118, 156);
    g.fillStyle = "#e8cf3a";
    g.font = "bold 70px serif";
    g.textAlign = "center";
    g.fillText("OKTA BEAUTY CLUB", w / 2, 82);
    g.fillStyle = "#f4f0e4";
    g.font = "16px sans-serif";
    g.textAlign = "left";
    g.fillText("Freakstreet, Basantapur, Kathmandu", 250, 100);
    g.fillStyle = "#151515";
    g.font = "bold 19px sans-serif";
    g.fillText("Our Services: Nail Extension, Eye Lashes Extension, Facial, Hair, Manicure, Pedicure, Bridal Makeup etc.", 14, h * 0.93);
  }, 1024, 220);
}

function foodPosters() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f2ead8";
    g.fillRect(0, 0, w, h);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const x = i * (w / n);
      g.fillStyle = i % 2 ? "#e8a020" : "#f6f0e2";
      g.fillRect(x + 4, 4, w / n - 8, h - 8);
      g.fillStyle = "#b06a2a";
      g.beginPath();
      g.ellipse(x + w / n / 2, h * 0.55, w / n * 0.3, h * 0.28, 0, 0, 6.3);
      g.fill();
      g.fillStyle = "#e6c48a";
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.arc(x + w / n / 2 - 18 + (k % 2) * 30, h * 0.48 + (k > 1 ? 18 : 0), 11, 0, 6.3);
        g.fill();
      }
    }
  }, 1024, 128);
}

function iceSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f4f1ea";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#222";
    g.lineWidth = 4;
    g.strokeRect(2, 2, w - 4, h - 4);
    g.fillStyle = "#1a1a1a";
    g.font = "bold 28px sans-serif";
    g.textAlign = "center";
    g.fillText("Ice Cube", w / 2, 42);
    g.fillText("Available", w / 2, 76);
    g.fillText("Here", w / 2, 110);
  }, 256, 160);
}

function storeSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#5c4638";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#f3efe6";
    g.font = "bold 42px sans-serif";
    g.textAlign = "center";
    g.fillText("STORE", w / 2, h * 0.68);
  }, 512, 128);
}

function menuColumn() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#f7f4ee";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#c45a3a";
    g.lineWidth = 10;
    g.strokeRect(6, 6, w - 12, h - 12);
    const dyes = ["#e37b2d", "#d8c24a", "#c4472a", "#6a9a3a", "#e8d8a0", "#b85a28"];
    for (let i = 0; i < 8; i++) {
      const y = 24 + i * ((h - 48) / 8);
      g.fillStyle = dyes[i % dyes.length];
      g.fillRect(22, y, w - 44, (h - 48) / 8 - 8);
      g.fillStyle = "rgba(255,255,255,0.35)";
      g.fillRect(30, y + 8, w * 0.35, 10);
    }
  }, 180, 900);
}

export function createHouse010() {
  const root = new THREE.Group();
  root.name = "house-010";

  const groundHoles = [
    { x: 1.85, y: 1.28, w: 3.15, h: 2.35 },
    { x: 4.05, y: 1.22, w: 0.92, h: 2.15 },
    { x: 6.45, y: 1.38, w: 3.55, h: 2.5 },
    { x: 9.15, y: 1.32, w: 2.15, h: 2.2 },
    { x: 11.05, y: 1.18, w: 0.82, h: 2.05 },
    { x: 14.15, y: 1.28, w: 3.15, h: 2.3 },
  ];
  const upperHoles = [
    { x: 3.6, y: 4.55, w: 4.6, h: 1.15 },
    { x: 9.4, y: 4.62, w: 1.15, h: 1.05 },
    { x: 12.6, y: 4.7, w: 0.85, h: 0.95 },
  ];

  const plasterMaps = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 1.4, 0.7),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 1.4, 0.7),
    arm: tex("concrete_wall_001_arm.jpg", false, 1.4, 0.7),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.1, 0.35),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.1, 0.35),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.1, 0.35),
  };
  const mats = {
    plaster: pbr(plasterMaps, 0xffb294, { ao: 0.32, ns: 0.5 }),
    plasterDark: pbr(plasterMaps, 0xe09a80, { ao: 0.4 }),
    wood: pbr(woodMaps, 0x8a7564, { ao: 0.28 }),
    woodDark: pbr(woodMaps, 0x4a3c32, { ao: 0.3 }),
    red: new THREE.MeshStandardMaterial({ color: 0xd0121c, roughness: 0.82, metalness: 0, vertexColors: true }),
    yellow: new THREE.MeshStandardMaterial({ color: 0xe6c200, roughness: 0.62, metalness: 0, vertexColors: true }),
    shutter: new THREE.MeshStandardMaterial({ color: 0x8d8680, roughness: 0.72, metalness: 0.04, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0x9aa6ac, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.82, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x100e0c, roughness: 0.95, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.6, metalness: 0, vertexColors: true }),
    paper: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, vertexColors: true }),
    concrete: pbr(plasterMaps, 0xc09a8c, { ao: 0.3 }),
    sign: (() => { const t = tambaSign(); return new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.45, metalness: 0, vertexColors: true }); })(),
    posters: new THREE.MeshStandardMaterial({ map: foodPosters(), roughness: 0.6, metalness: 0, vertexColors: true }),
    beauty: new THREE.MeshStandardMaterial({ map: beautySign(), roughness: 0.5, metalness: 0, vertexColors: true }),
    ice: new THREE.MeshStandardMaterial({ map: iceSign(), roughness: 0.8, metalness: 0, vertexColors: true }),
    menu: new THREE.MeshStandardMaterial({ map: menuColumn(), roughness: 0.55, metalness: 0, vertexColors: true }),
    store: new THREE.MeshStandardMaterial({ map: storeSign(), roughness: 0.7, metalness: 0, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  function add(name, g, tint) {
    const rgb = tint || [1, 1, 1];
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      const k = 0.92 + 0.08 * hash(p.getX(i), p.getY(i), p.getZ(i));
      c[i * 3] = rgb[0] * k;
      c[i * 3 + 1] = rgb[1] * k;
      c[i * 3 + 2] = rgb[2] * k;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  // Photo left is high X when the lane camera looks at this face.
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    // Canvas signs take the whole texture once; tiled maps take metre UVs.
    const g = place(CANVAS_MATS.has(name) ? new THREE.BoxGeometry(w, h, d) : boxGeo(w, h, d), W - x, y, z);
    if (name === "plaster" || name === "plasterDark" || name === "concrete") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const mirrored = (holes || []).map((hole) => ({ x: W - hole.x, y: hole.y, w: hole.w, h: hole.h }));
    const parts = cells(x0, x1, y0, y1, mirrored);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }

  wallZ("plaster", 0, W, 0, 3.35, 0, groundHoles);
  addBox("concrete", W + 0.06, 0.16, 0.42, W / 2, 3.32, -0.16, [0.85, 0.82, 0.78]);
  addBox("concrete", W + 0.02, 0.05, 0.06, W / 2, 3.22, -0.34, [0.6, 0.56, 0.52]);
  addBox("concrete", W + 0.08, 0.09, 0.2, W / 2, 3.96, -0.08, [0.82, 0.78, 0.74]);
  wallZ("plaster", 0, W, 3.4, 5.85, 0, upperHoles, [1.04, 0.98, 0.96]);
  addBox("concrete", W + 0.12, 0.16, 0.28, W / 2, 5.95, -0.06, [0.78, 0.74, 0.7]);
  addBox("plasterDark", W, 0.42, 0.2, W / 2, 6.24, 0.02, [0.9, 0.86, 0.82]);

  addBox("plaster", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("plaster", T, ROOF, D, W - T / 2, ROOF / 2, D / 2, [0.94, 0.9, 0.86]);
  addBox("plasterDark", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("concrete", W - 0.3, 0.12, D - 0.4, W / 2, 6.15, D / 2 + 0.05);
  addBox("concrete", 0.7, 0.55, 0.55, 12.2, 6.55, 7.4, [0.7, 0.68, 0.64]);

  function frame(x, y, w, h, z, mat) {
    addBox(mat, 0.06, h + 0.04, 0.05, x - w / 2, y, z);
    addBox(mat, 0.06, h + 0.04, 0.05, x + w / 2, y, z);
    addBox(mat, w + 0.06, 0.05, 0.05, x, y + h / 2, z);
    addBox(mat, w + 0.06, 0.06, 0.06, x, y - h / 2, z);
  }
  frame(3.6, 4.55, 4.6, 1.15, -0.02, "woodDark");
  addBox("dark", 4.4, 1.05, 0.04, 3.6, 4.55, 0.7);
  addBox("glass", 4.35, 0.95, 0.02, 3.6, 4.55, 0.06, [0.62, 0.66, 0.7]);
  for (const dx of [-1.1, 0, 1.1]) addBox("woodDark", 0.05, 0.95, 0.04, 3.6 + dx, 4.55, 0.03);
  addBox("woodDark", 4.35, 0.04, 0.04, 3.6, 4.82, 0.03);
  frame(9.4, 4.62, 1.15, 1.05, -0.02, "wood");
  addBox("dark", 1.0, 0.9, 0.04, 9.4, 4.62, 0.6);
  addBox("glass", 0.95, 0.85, 0.02, 9.4, 4.62, 0.06, [0.55, 0.58, 0.62]);
  addBox("wood", 0.04, 0.85, 0.04, 9.4, 4.62, 0.03, [0.6, 0.55, 0.5]);
  frame(12.6, 4.7, 0.85, 0.95, -0.02, "wood");
  addBox("dark", 0.7, 0.78, 0.06, 12.6, 4.7, 0.05);

  addBox("beauty", 4.7, 0.95, 0.04, 2.7, 4.85, -0.08);
  addBox("woodDark", 0.08, 0.7, 0.08, 0.5, 4.7, -0.05, [0.35, 0.3, 0.26]);
  addBox("woodDark", 0.08, 0.7, 0.08, 4.9, 4.7, -0.05, [0.35, 0.3, 0.26]);

  addBox("dark", 3.1, 2.4, 0.06, 1.85, 1.25, 1.9);
  addBox("woodDark", 3.1, 0.06, 1.7, 1.85, 2.42, 1.05, [0.5, 0.42, 0.36]);
  addBox("plasterDark", 0.06, 2.4, 1.7, 0.3, 1.25, 1.05, [0.45, 0.4, 0.38]);
  addBox("plasterDark", 0.06, 2.4, 1.7, 3.4, 1.25, 1.05, [0.45, 0.4, 0.38]);
  const goods = [[0.95, 0.75, 0.2], [0.85, 0.2, 0.15], [0.2, 0.45, 0.8], [0.95, 0.95, 0.9], [0.3, 0.65, 0.3], [0.95, 0.5, 0.15], [0.6, 0.2, 0.5]];
  for (let row = 0; row < 3; row++) {
    const y = 1.15 + row * 0.42;
    addBox("wood", 2.9, 0.03, 0.32, 1.85, y, 1.7, [0.5, 0.42, 0.34]);
    let x = 0.5;
    for (let k = 0; x < 3.2; k++) {
      const bw = 0.08 + hash(row, k, 5) * 0.12;
      const bh = 0.12 + hash(k, row, 9) * 0.2;
      addBox("paper", bw, bh, 0.18, x + bw / 2, y + 0.015 + bh / 2, 1.72, goods[(k * 3 + row) % goods.length].map((v) => v * (0.7 + 0.3 * hash(k, row, 2))));
      x += bw + 0.015;
    }
  }
  addBox("wood", 2.6, 0.9, 0.5, 1.95, 0.45, 0.55, [0.55, 0.46, 0.38]);
  addBox("glass", 2.5, 0.6, 0.02, 1.95, 0.5, 0.28, [0.8, 0.84, 0.82]);
  addBox("wood", 2.65, 0.05, 0.55, 1.95, 0.92, 0.55, [0.7, 0.64, 0.56]);
  for (let k = 0; k < 9; k++) {
    addBox("glass", 0.08, 0.26, 0.08, 0.9 + k * 0.11, 1.08, 0.5, [0.7, 0.85, 1.0]);
    addBox("paper", 0.05, 0.03, 0.05, 0.9 + k * 0.11, 1.225, 0.5, [0.2, 0.45, 0.85]);
  }
  addBox("ice", 0.42, 0.28, 0.02, 1.35, 0.55, 0.26);
  const packets = [[0.95, 0.7, 0.15], [0.85, 0.25, 0.3], [0.9, 0.55, 0.15], [0.6, 0.3, 0.7], [0.95, 0.9, 0.3]];
  for (let i = 0; i < 12; i++) {
    const x = 0.5 + i * 0.24 + hash(i, 4, 4) * 0.06;
    const len = 0.45 + hash(i, 2, 1) * 0.4;
    for (let k = 0; k < Math.floor(len / 0.09); k++) {
      addBox("paper", 0.1, 0.08, 0.012, x, 2.3 - 0.05 - k * 0.09, -0.04 - (i % 3) * 0.02, packets[(i + k) % packets.length]);
    }
  }
  for (let i = 0; i <= 14; i++) {
    const t = i / 14;
    addBox("paper", 0.05, 0.05, 0.05, 0.4 + t * 2.9, 2.38 - Math.sin(Math.PI * ((t * 2) % 1)) * 0.14, -0.08, i % 2 ? [0.95, 0.7, 0.15] : [0.9, 0.35, 0.15]);
  }
  addBox("woodDark", 0.08, 2.2, 0.08, 0.3, 1.2, -0.02);
  addBox("woodDark", 0.08, 2.2, 0.08, 3.4, 1.2, -0.02);

  addBox("dark", 0.78, 2.0, 0.45, 4.05, 1.15, 0.35);
  addBox("wood", 0.1, 2.2, 0.08, 3.55, 1.2, -0.02, [0.55, 0.48, 0.4]);
  addBox("wood", 0.1, 2.2, 0.08, 4.55, 1.2, -0.02, [0.55, 0.48, 0.4]);

  addBox("red", 3.6, 2.6, 0.06, 6.45, 1.3, 2.6, [0.78, 0.2, 0.18]);
  addBox("red", 0.06, 2.6, 2.4, 4.68, 1.3, 1.4, [0.7, 0.16, 0.15]);
  addBox("plasterDark", 0.06, 2.6, 2.4, 8.22, 1.3, 1.4, [0.9, 0.82, 0.62]);
  addBox("paper", 3.6, 0.04, 2.4, 6.45, 2.6, 1.4, [0.82, 0.78, 0.72]);
  addBox("concrete", 3.6, 0.04, 2.4, 6.45, 0.12, 1.4, [0.7, 0.66, 0.62]);
  addBox("posters", 3.5, 0.32, 0.02, 6.45, 2.3, 2.56);
  addBox("posters", 1.4, 0.4, 0.02, 7.4, 1.55, 2.56);
  addBox("yellow", 1.5, 1.0, 0.5, 5.5, 0.62, 2.3, [0.95, 0.75, 0.15]);
  addBox("red", 1.5, 0.05, 0.55, 5.5, 1.14, 2.3, [0.6, 0.1, 0.1]);
  addBox("paper", 0.3, 0.2, 0.01, 6.0, 1.95, 2.56, [1.0, 0.85, 0.6]);
  addBox("red", 0.12, 2.5, 0.14, 4.75, 1.3, -0.02, [0.85, 0.15, 0.15]);
  addBox("yellow", 0.14, 2.5, 0.14, 8.15, 1.3, -0.02, [0.98, 0.8, 0.15]);
  addBox("sign", 3.7, 0.85, 0.22, 6.45, 2.95, -0.12);
  addBox("red", 3.75, 0.06, 0.3, 6.45, 2.5, -0.1, [0.55, 0.08, 0.08]);
  for (const [x, z] of [[5.25, 0.95], [7.1, 1.15]]) {
    addBox("paper", 0.55, 0.04, 0.45, x, 0.44, z, [0.95, 0.94, 0.92]);
    addBox("red", 0.4, 0.4, 0.32, x, 0.21, z, [0.8, 0.12, 0.12]);
  }
  const stools = [[5.15, 0.42], [5.7, 0.55], [6.55, 0.72], [7.35, 0.48], [7.9, 0.38]];
  for (let i = 0; i < stools.length; i++) {
    const [x, z] = stools[i];
    addBox("wood", 0.32, 0.16, 0.32, x, 0.19, z, [0.55, 0.36, 0.24]);
    addBox("wood", 0.32, 0.16, 0.32, x, 0.36, z, [0.48, 0.3, 0.2]);
    addBox("red", 0.34, 0.08, 0.34, x, 0.48, z, [0.8, 0.14, 0.16]);
  }

  addBox("dark", 1.9, 1.9, 0.5, 9.15, 1.25, 0.4);
  addBox("yellow", 1.7, 0.85, 0.7, 9.1, 0.7, 0.05, [0.98, 0.82, 0.1]);
  addBox("wood", 0.9, 0.18, 0.4, 9.0, 1.15, -0.05, [0.72, 0.5, 0.28]);
  addBox("menu", 0.42, 1.85, 0.08, 10.35, 1.35, -0.05);

  addBox("dark", 0.7, 1.95, 0.35, 11.05, 1.15, 0.3);
  addBox("woodDark", 0.08, 2.1, 0.07, 10.62, 1.15, -0.02);
  addBox("woodDark", 0.08, 2.1, 0.07, 11.48, 1.15, -0.02);

  addBox("dark", 2.9, 2.1, 0.4, 14.15, 1.25, 0.35);
  for (let i = 0; i < 14; i++) {
    addBox("shutter", 2.95, 0.07, 0.04, 14.15, 0.35 + i * 0.13, -0.02, [0.85 + (i % 3) * 0.04, 0.82, 0.78]);
  }
  addBox("woodDark", 3.2, 0.12, 0.1, 14.15, 2.2, -0.04, [0.4, 0.32, 0.26]);
  addBox("store", 1.3, 0.28, 0.02, 14.5, 2.55, -0.05);

  for (let s = 0; s < 3; s++) {
    const y = 0.1 + s * 0.14;
    const depth = 0.34 + s * 0.28;
    addBox("concrete", 11.2, 0.14, depth, 5.5, y, -0.12 - s * 0.22, [0.72, 0.66, 0.6]);
  }
  addBox("concrete", 3.4, 0.12, 0.35, 14.2, 0.08, -0.12, [0.68, 0.62, 0.56]);

  function wire(x0, x1, y, droop) {
    x0 = W - x0;
    x1 = W - x1;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, y - Math.sin(Math.PI * t) * droop, -0.18 - Math.sin(Math.PI * t) * 0.08));
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 5, false);
    add("wire", g, [0.7, 0.68, 0.64]);
  }
  wire(0.2, 7.5, 3.55, 0.28);
  wire(0.4, 15.6, 3.85, 0.42);
  wire(2.0, 15.2, 5.35, 0.22);
  wire(6.0, 15.8, 4.9, 0.35);
  wire(8.5, 15.9, 3.2, 0.18);
  for (let i = 0; i < 7; i++) wire(-0.2 + hash(i, 7, 1) * 0.6, 16.2 - hash(i, 3, 7) * 0.6, 3.62 + i * 0.035, 0.12 + hash(i, 9, 2) * 0.22);
  wire(9.2, 15.0, 3.45, 0.45);
  wire(10.5, 13.2, 3.5, 0.3);

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

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "010";
  return root;
}
