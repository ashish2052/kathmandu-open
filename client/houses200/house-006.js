// House 006. Yatkha west face, OSM way 1029960699, edge 0, 6.26 m.
// Spec: research/houses200/006/design.md
// Origin: front-left at the south end. +X runs south to north, +Y up, +Z into the lot.
// Street face is z = 0. x = 0 is the blue textile bay beside house 005.
// x = 6.26 is the yellow sign. The still is pano EoSq0dPaeIi63s-pG4984w, yaw 70, pitch 8, fov 58.
// South block is the taller red brick. North block is lower and sooted.
// The sign line that reads is "Aary · Sohan Corner". The pale board's words do not.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 6.26;
const D = 7.45;
const T = 0.22;
const SPLIT = 2.72;
const SOUTH_TOP = 8.85;
const NORTH_TOP = 5.62;

const OVERCAST = { dir: 0.42, spec: 0.3, ind: 1.7 };

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
  const w = 1024;
  const h = 512;
  const cols = 10;
  const rows = 18;
  const bw = w / cols;
  const bh = h / rows;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const arm = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const a = arm.getContext("2d");
  const r = rng(6006);
  c.fillStyle = "#8a7468";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#3a3a3a";
  e.fillRect(0, 0, w, h);
  a.fillStyle = "rgb(190,250,0)";
  a.fillRect(0, 0, w, h);
  const pal = [
    [204, 122, 96], [196, 114, 90], [212, 130, 100], [186, 106, 84],
    [200, 118, 92], [192, 112, 88], [208, 126, 98], [178, 100, 80],
  ];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw / 2;
    for (let k = 0; k < cols; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.92 + r() * 0.12;
      let R = p[0] * j;
      let G = p[1] * j;
      let B = p[2] * j;
      if (r() < 0.04) { R *= 0.78; G *= 0.74; B *= 0.74; }
      if (r() < 0.05) { R *= 1.06; G *= 1.08; B *= 1.08; }
      const jx = 1.3 + r() * 1.0;
      const jy = 1.05 + r() * 0.8;
      const x0 = k * bw + off + jx;
      const y0 = row * bh + jy;
      const ww = bw - jx * 2;
      const hh = bh - jy * 2;
      for (const dx of [0, -w]) {
        c.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
        c.fillRect(x0 + dx, y0, ww, hh);
        e.fillStyle = "#c8c8c8";
        e.fillRect(x0 + dx + 1, y0 + 1, ww - 2, hh - 2);
        a.fillStyle = "rgb(255,220,0)";
        a.fillRect(x0 + dx, y0, ww, hh);
      }
    }
  }
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = r() * h;
    const len = 60 + r() * 220;
    const st = c.createLinearGradient(0, y, 0, y + len);
    st.addColorStop(0, "rgba(40,30,26,0)");
    st.addColorStop(0.3, `rgba(40,30,26,${0.06 + r() * 0.08})`);
    st.addColorStop(1, "rgba(40,30,26,0)");
    c.fillStyle = st;
    c.fillRect(x, y, 6 + r() * 26, len);
  }
  for (let i = 0; i < 14; i++) {
    c.fillStyle = `rgba(225,205,180,${0.05 + r() * 0.07})`;
    c.beginPath();
    c.ellipse(r() * w, r() * h, 20 + r() * 50, 10 + r() * 30, 0, 0, Math.PI * 2);
    c.fill();
  }
  const rep = [1 / 2.4, 1 / 1.2];
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 2.8), false, true);
  const rough = toTex(arm, false, true);
  for (const t of [map, nor, rough]) t.repeat.set(rep[0], rep[1]);
  return { diff: map, nor, arm: rough };
}

function paintSet(base) {
  const w = 512;
  const h = 512;
  const col = canvas(w, h);
  const c = col.getContext("2d");
  const r = rng(base === "#1f6fae" ? 6106 : 6206);
  c.fillStyle = base;
  c.fillRect(0, 0, w, h);
  for (let i = 0; i < 420; i++) {
    c.fillStyle = r() < 0.5 ? "rgba(0,40,60,0.08)" : "rgba(220,240,245,0.07)";
    c.fillRect(r() * w, r() * h, 2, 18 + r() * 80);
  }
  for (let i = 0; i < 18; i++) {
    c.fillStyle = "rgba(20,30,28,0.12)";
    c.fillRect(r() * w, r() * h, 30 + r() * 70, 16 + r() * 40);
  }
  for (let i = 0; i < 40; i++) {
    c.fillStyle = `rgba(150,128,100,${0.25 + r() * 0.35})`;
    c.fillRect(r() * w, r() * h, 3 + r() * 14, 2 + r() * 6);
  }
  return { diff: toTex(col, true, true) };
}

function signTex() {
  const c = canvas(1024, 480);
  const g = c.getContext("2d");
  g.fillStyle = "#f2c51a";
  g.fillRect(0, 0, 1024, 480);
  g.strokeStyle = "#241a12";
  g.lineWidth = 18;
  g.strokeRect(9, 9, 1006, 462);
  g.fillStyle = "#c0261c";
  g.font = "italic 700 104px Brush Script MT, Georgia, serif";
  g.textAlign = "center";
  g.fillText("Aary  ·  Sohan Corner", 512, 180);
  g.fillStyle = "#b8281e";
  for (let k = 0; k < 3; k++) {
    const y = 360 - k * 46;
    const hw = 110 - k * 32;
    g.beginPath();
    g.moveTo(512 - hw, y);
    g.lineTo(512 + hw, y);
    g.lineTo(512 + hw * 0.55, y - 34);
    g.lineTo(512 - hw * 0.55, y - 34);
    g.closePath();
    g.fill();
  }
  g.fillRect(452, 360, 120, 44);
  const dirt = g.createLinearGradient(0, 300, 0, 480);
  dirt.addColorStop(0, "rgba(80,60,20,0)");
  dirt.addColorStop(1, "rgba(80,60,20,0.18)");
  g.fillStyle = dirt;
  g.fillRect(0, 0, 1024, 480);
  return toTex(c, true, false);
}

function boardTex() {
  const c = canvas(256, 640);
  const g = c.getContext("2d");
  const r = rng(606);
  g.fillStyle = "#e7d7b4";
  g.fillRect(0, 0, 256, 640);
  g.fillStyle = "#c45a3a";
  g.fillRect(0, 0, 256, 54);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = `rgba(90,30,24,${0.35 + r() * 0.3})`;
    const y = 90 + i * 64;
    g.fillRect(28, y, 200, 8 + r() * 6);
    g.fillRect(36, y + 22, 160 - r() * 40, 5);
  }
  g.strokeStyle = "#2a6e74";
  g.lineWidth = 14;
  g.strokeRect(6, 6, 244, 628);
  return toTex(c, true, false);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  if (p.z < 0.55) {
    ao *= 1.0 - 0.45 * smoothstep(0.55, 0.0, 2.55 - p.y) * step(0.0, 2.55 - p.y);
    ao *= 1.0 - 0.28 * smoothstep(0.4, 0.0, 5.55 - p.y) * step(0.0, 5.55 - p.y);
    ao *= 1.0 - 0.4 * smoothstep(0.7, 0.0, 8.35 - p.y) * step(0.0, 8.35 - p.y);
  }
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.4, p.y);
  if (p.z < 0.3) {
    float n = fract(sin(floor(p.x * 9.0) * 12.9898) * 43758.5453);
    float damp = 1.0 - smoothstep(0.25 + 0.3 * n, 0.75 + 0.3 * n, p.y);
    ao *= 1.0 - 0.22 * damp;
    float runoff = smoothstep(0.55, 0.95, n) * smoothstep(3.0, 8.6, p.y);
    ao *= 1.0 - 0.18 * runoff;
  }
  return ao;
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
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + AO_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house006-" + key; };
  return mat;
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
    const k = 0.92 + 0.08 * hash(p.getX(i) * 1.7, p.getY(i) * 1.3, p.getZ(i) * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse006() {
  const root = new THREE.Group();
  root.name = "house-006";

  const brickMaps = brickSet();
  const blueMaps = paintSet("#1f6fae");
  const tealMaps = paintSet("#2f7c84");
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.1, 0.45),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.1, 0.45),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.1, 0.45),
  };
  const rustMaps = {
    diff: tex("rusty_metal_Diffuse.jpg", true, 1.6, 0.35),
    nor: tex("rusty_metal_nor_gl.jpg", false, 1.6, 0.35),
    arm: tex("rusty_metal_arm.jpg", false, 1.6, 0.35),
  };
  const plateMaps = {
    diff: tex("metal_plate_Diffuse.jpg", true, 0.8, 0.4),
    nor: tex("metal_plate_nor_gl.jpg", false, 0.8, 0.4),
    arm: tex("metal_plate_arm.jpg", false, 0.8, 0.4),
  };
  const plasterMaps = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 0.5, 0.5),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 0.5, 0.5),
    arm: tex("concrete_wall_001_arm.jpg", false, 0.5, 0.5),
  };

  function pbr(maps, color, ao) {
    const m = new THREE.MeshStandardMaterial({
      color,
      map: maps.diff || null,
      normalMap: maps.nor || null,
      roughnessMap: maps.arm || null,
      aoMap: maps.arm || null,
      roughness: 1,
      metalness: 0,
      aoMapIntensity: ao == null ? 0.35 : ao,
      vertexColors: true,
      envMapIntensity: 0.28,
    });
    if (maps.nor) m.normalScale = new THREE.Vector2(0.8, 0.8);
    return m;
  }

  const mats = {
    brick: pbr(brickMaps, 0xffffff, 0.45),
    brickDark: pbr(brickMaps, 0xc8beb6, 0.5),
    blue: pbr(blueMaps, 0xd4e4e6, 0.28),
    teal: pbr(tealMaps, 0xc5d4d2, 0.3),
    wood: pbr(woodMaps, 0x8a7564, 0.28),
    woodDark: pbr(woodMaps, 0x4a382e, 0.3),
    rust: pbr(rustMaps, 0xb7b3ae, 0.3),
    plate: pbr(plateMaps, 0xc5c8cc, 0.25),
    plaster: pbr(plasterMaps, 0xd8d0c6, 0.35),
    glass: new THREE.MeshStandardMaterial({ color: 0x6a7370, roughness: 0.55, metalness: 0, transparent: true, opacity: 0.92, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0x8a7c74, roughness: 0.85, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110f, roughness: 0.95, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2c2826, roughness: 0.6, metalness: 0.05, vertexColors: true }),
    red: new THREE.MeshStandardMaterial({ color: 0x8e2c28, roughness: 0.72, metalness: 0, vertexColors: true }),
    sign: new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.55, metalness: 0 }),
    board: new THREE.MeshStandardMaterial({ map: boardTex(), roughness: 0.7, metalness: 0 }),
    sheet: pbr({ nor: rustMaps.nor, arm: plateMaps.arm }, 0x9d9b95, 0.3),
    duct: new THREE.MeshStandardMaterial({ color: 0xc9c8c2, roughness: 0.55, metalness: 0.2, vertexColors: true }),
    shutter: pbr(woodMaps, 0xc8b89c, 0.25),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "brick" || name === "brickDark" || name === "plaster" || name === "shutter") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }
  function looseMesh(geo, mat, key) {
    houseShader(mat, key, null);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
    return mesh;
  }

  const southHoles = [
    { x: 1.34, y: 1.28, w: 2.43, h: 2.36 },
    { x: 0.62, y: 4.15, w: 0.78, h: 1.05 },
    { x: 1.85, y: 4.55, w: 0.7, h: 0.92 },
    { x: 1.15, y: 6.85, w: 0.66, h: 0.95 },
  ];
  const northHoles = [
    { x: 5.82, y: 1.16, w: 0.56, h: 2.05 },
    { x: 4.95, y: 1.14, w: 0.58, h: 2.0 },
    { x: 4.1, y: 1.18, w: 0.78, h: 2.1 },
    { x: 3.32, y: 1.16, w: 0.5, h: 2.02 },
    { x: 5.35, y: 3.55, w: 0.4, h: 0.4 },
    { x: 5.15, y: 4.72, w: 0.36, h: 0.36 },
    { x: 4.15, y: 5.12, w: 0.34, h: 0.4 },
  ];

  wallZ("brick", 0, SPLIT, 0, SOUTH_TOP, 0, southHoles, [1.05, 0.98, 0.94]);
  wallZ("brickDark", SPLIT, W, 0, NORTH_TOP, 0, northHoles, [0.62, 0.56, 0.52]);

  for (const part of cells(SPLIT + 0.02, W, 0, 2.62, northHoles.filter((h) => h.y < 2))) {
    const k = 0.9 + 0.12 * hash(part.x, part.y, 6);
    addBox("plaster", part.w, part.h, 0.03, part.x, part.y, -0.015, [1.3 * k, 1.16 * k, 0.8 * k]);
  }
  addBox("plaster", W - SPLIT - 0.02, 0.1, 0.07, (SPLIT + W) / 2, 2.4, -0.04, [1.0, 0.94, 0.76]);
  addBox("brick", T, SOUTH_TOP, D, T / 2, SOUTH_TOP / 2, D / 2, [1.02, 0.96, 0.92]);
  addBox("brickDark", T, NORTH_TOP, D, W - T / 2, NORTH_TOP / 2, D / 2, [0.8, 0.74, 0.7]);
  addBox("brick", T, SOUTH_TOP - NORTH_TOP, D, SPLIT, NORTH_TOP + (SOUTH_TOP - NORTH_TOP) / 2, D / 2, [1.0, 0.94, 0.9]);
  addBox("brick", SPLIT - T, SOUTH_TOP, T, SPLIT / 2, SOUTH_TOP / 2, D - T / 2, [0.96, 0.9, 0.86]);
  addBox("brickDark", W - SPLIT, NORTH_TOP, T, (SPLIT + W) / 2, NORTH_TOP / 2, D - T / 2, [0.78, 0.72, 0.68]);

  addBox("plaster", SPLIT + 0.06, 0.12, 0.1, SPLIT / 2, 5.48, -0.04, [1.12, 1.06, 0.96]);
  addBox("plaster", SPLIT + 0.02, 0.05, 0.06, SPLIT / 2, 5.4, -0.02, [0.9, 0.84, 0.76]);
  addBox("plaster", SPLIT + 0.08, 0.04, 0.14, SPLIT / 2, 5.56, -0.06, [1.05, 1.0, 0.9]);
  addBox("woodDark", 0.06, 1.15, 0.05, 1.55, 4.7, -0.03, [0.92, 0.9, 0.86]);

  function frame(mat, x, y, w, h, z) {
    addBox(mat, 0.055, h + 0.05, 0.05, x - w / 2, y, z);
    addBox(mat, 0.055, h + 0.05, 0.05, x + w / 2, y, z);
    addBox(mat, w + 0.05, 0.05, 0.05, x, y + h / 2, z);
    addBox(mat, w + 0.05, 0.06, 0.06, x, y - h / 2, z - 0.008);
  }
  function pane(x, y, w, h, rows, cols) {
    frame("teal", x, y, w, h, -0.03);
    addBox("shutter", w - 0.08, h - 0.08, 0.03, x, y, 0.02, [0.95, 0.9, 0.82]);
    const slats = Math.round((h - 0.16) / 0.07);
    for (let i = 0; i < slats; i++) addBox("shutter", w - 0.16, 0.022, 0.025, x, y - h / 2 + 0.1 + i * 0.07, -0.002, [0.8, 0.74, 0.66]);
    for (let i = 1; i < cols; i++) addBox("teal", 0.04, h - 0.1, 0.035, x - w / 2 + (w * i) / cols, y, -0.015);
    for (let i = 1; i < rows; i++) addBox("teal", w - 0.1, 0.04, 0.035, x, y - h / 2 + (h * i) / rows, -0.015);
    addBox("plaster", w + 0.16, 0.05, 0.1, x, y - h / 2 - 0.06, -0.05, [0.95, 0.9, 0.82]);
  }
  pane(0.62, 4.15, 0.78, 1.05, 2, 2);
  addBox("teal", 0.7, 0.22, 0.03, 0.62, 3.78, -0.025);
  for (let i = 0; i < 5; i++) addBox("teal", 0.62, 0.018, 0.02, 0.62, 3.7 + i * 0.04, -0.04);
  pane(1.85, 4.55, 0.7, 0.92, 2, 2);
  frame("teal", 1.15, 6.85, 0.66, 0.95, -0.03);
  for (let i = 0; i < 6; i++) addBox("teal", 0.52, 0.035, 0.03, 1.15, 6.55 + i * 0.09, -0.045);

  function lattice(x, y, s) {
    frame("woodDark", x, y, s, s, -0.04);
    addBox("brickDark", s + 0.2, 0.06, 0.12, x, y + s / 2 + 0.07, -0.06, [0.6, 0.54, 0.5]);
    addBox("brickDark", s + 0.14, 0.05, 0.1, x, y - s / 2 - 0.06, -0.05, [0.58, 0.52, 0.48]);
    const n = 6;
    for (let i = 1; i < n; i++) {
      const t = -s / 2 + (s * i) / n;
      addBox("wood", s - 0.08, 0.018, 0.025, x, y + t, -0.055, [0.95, 0.84, 0.7]);
      addBox("wood", 0.018, s - 0.08, 0.025, x + t, y, -0.055, [0.95, 0.84, 0.7]);
    }
    addBox("dark", s - 0.08, s - 0.08, 0.04, x, y, 0.04);
  }
  lattice(5.35, 3.55, 0.4);
  lattice(5.15, 4.72, 0.36);
  lattice(4.15, 5.12, 0.34);

  function leaf(x, y, w, h, z, mat, open) {
    const gw = open ? 0.04 : w;
    const gd = open ? w : 0.04;
    addBox(mat, gw, h, gd, x, y, z);
    if (!open) {
      addBox(mat, w - 0.08, 0.04, 0.015, x, y + h * 0.22, z - 0.028);
      addBox(mat, w - 0.08, 0.04, 0.015, x, y - h * 0.22, z - 0.028);
      addBox(mat, 0.035, h - 0.16, 0.015, x, y, z - 0.028);
    }
  }
  frame("blue", 1.34, 1.28, 2.43, 2.36, -0.02);
  addBox("blue", 0.08, 2.28, 0.08, 0.9, 1.22, -0.04);
  addBox("blue", 0.08, 2.28, 0.08, 1.78, 1.22, -0.04);
  leaf(0.38, 1.2, 0.42, 2.05, 0.12, "blue", true);
  leaf(2.22, 1.2, 0.48, 2.1, -0.03, "blue", false);
  addBox("wood", 1.55, 0.05, 0.35, 1.34, 0.72, 0.35, [0.75, 0.66, 0.56]);
  addBox("wood", 1.55, 0.05, 0.32, 1.34, 1.15, 0.32, [0.7, 0.6, 0.5]);
  addBox("wood", 1.55, 0.05, 0.28, 1.34, 1.55, 0.28, [0.68, 0.58, 0.48]);
  const cloths = [
    [1.05, 0.86, 0.42, 0.26, 0.28, [0.8, 0.12, 0.12]],
    [1.35, 0.86, 0.4, 0.24, 0.26, [0.85, 0.62, 0.3]],
    [1.62, 0.88, 0.38, 0.28, 0.24, [0.45, 0.14, 0.3]],
    [1.1, 1.3, 0.4, 0.22, 0.26, [0.62, 0.1, 0.14]],
    [1.4, 1.28, 0.36, 0.2, 0.24, [0.2, 0.3, 0.55]],
    [1.66, 1.32, 0.34, 0.24, 0.22, [0.7, 0.42, 0.18]],
    [1.15, 1.7, 0.38, 0.2, 0.22, [0.85, 0.3, 0.12]],
    [1.5, 1.68, 0.4, 0.22, 0.2, [0.3, 0.45, 0.3]],
  ];
  for (const [x, y, w, h, d, tint] of cloths) {
    const n = Math.max(2, Math.round(h / 0.035));
    for (let i = 0; i < n; i++) {
      const k = 0.75 + 0.4 * hash(x * 7 + i, y * 3, 1);
      const sh = hash(x, y, i) < 0.3 ? [0.62, 0.5, 0.42] : tint;
      addBox("cloth", w - 0.02 * hash(i, x, 2), h / n - 0.004, d, x + (hash(i, y, 3) - 0.5) * 0.03, y - h / 2 + (i + 0.5) * (h / n), 0.34, [sh[0] * k, sh[1] * k, sh[2] * k]);
    }
  }
  addBox("woodDark", 2.2, 2.1, 0.08, 1.34, 1.25, 0.85, [0.95, 0.85, 0.75]);
  addBox("woodDark", 2.3, 0.22, 0.85, 1.34, 0.11, 0.42, [0.5, 0.44, 0.4]);
  addBox("blue", 2.4, 0.06, 0.06, 1.34, 0.22, -0.03);

  frame("blue", 5.82, 1.16, 0.56, 2.05, -0.02);
  leaf(5.82, 1.12, 0.42, 1.9, -0.02, "blue", false);
  frame("wood", 4.95, 1.14, 0.58, 2.0, -0.02);
  leaf(4.95, 1.1, 0.44, 1.82, -0.02, "red", false);
  frame("teal", 4.1, 1.18, 0.78, 2.1, -0.02);
  addBox("dark", 0.66, 1.9, 0.4, 4.1, 1.1, 0.35);
  add("plate", place(boxGeo(0.7, 0.95, 0.03), 3.95, 0.72, 0.08, 0.42, 0.05, 0.15), [0.48, 0.58, 0.4]);
  frame("teal", 3.32, 1.16, 0.5, 2.02, -0.02);
  const board = place(new THREE.BoxGeometry(0.28, 1.15, 0.03), 3.18, 1.35, -0.05);
  looseMesh(board, mats.board, "menu-board");

  const sign = place(new THREE.BoxGeometry(1.35, 0.62, 0.04), 4.55, 4.05, -0.08);
  looseMesh(sign, mats.sign, "sign-board");
  addBox("brickDark", 1.5, 0.08, 0.1, 4.55, 3.7, -0.05, [0.7, 0.64, 0.6]);
  addBox("brickDark", 1.5, 0.06, 0.08, 4.55, 4.4, -0.04, [0.75, 0.68, 0.64]);

  function awning(x0, x1, y, droop) {
    const w = x1 - x0;
    const depth = 0.95;
    const g = new THREE.BoxGeometry(w, 0.02, depth, Math.round(w / 0.038), 1, 3);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / w + 0.5;
      const v = p.getZ(i) / depth + 0.5;
      const sag = Math.sin(Math.PI * u) * droop * v;
      const rib = 0.012 * Math.sin(p.getX(i) * Math.PI * 2 / 0.076);
      p.setY(i, p.getY(i) - sag - v * 0.12 + rib);
    }
    g.computeVertexNormals();
    place(g, (x0 + x1) / 2, y, -depth / 2 + 0.02);
    worldUV(g);
    add("sheet", g, [1.0, 0.98, 0.94]);
    const ribs = 3;
    for (let i = 0; i < ribs; i++) {
      const x = x0 + ((i + 0.5) / ribs) * w;
      addBox("woodDark", 0.04, 0.04, depth * 0.92, x, y - droop * 0.4 - 0.05, -depth * 0.42, [0.6, 0.5, 0.42]);
    }
  }
  awning(0.02, SPLIT - 0.04, 2.58, 0.07);
  awning(SPLIT + 0.06, W - 0.02, 2.5, 0.1);

  addBox("duct", 0.28, 0.55, 0.22, 4.55, 2.85, -0.15, [1.0, 1.0, 1.0]);
  addBox("duct", 0.22, 0.7, 0.18, 4.7, 3.35, -0.02, [0.92, 0.92, 0.9]);
  addBox("duct", 0.34, 0.16, 0.16, 4.85, 3.62, 0.02, [0.86, 0.86, 0.84]);

  addBox("rust", SPLIT + 0.15, 0.04, 0.7, SPLIT / 2, 8.55, -0.28, [0.55, 0.52, 0.48]);
  for (let i = 0; i < 4; i++) {
    const x = 0.35 + i * 0.62;
    addBox("woodDark", 0.07, 0.28, 0.08, x, 8.28, -0.08, [0.45, 0.36, 0.28]);
    addBox("wood", 0.06, 0.06, 0.42, x, 8.12, -0.28, [0.5, 0.4, 0.3]);
  }
  addBox("rust", W - SPLIT - 0.2, 0.04, D * 0.55, (SPLIT + W) / 2, NORTH_TOP + 0.08, D * 0.35, [0.5, 0.48, 0.45]);
  addBox("rust", SPLIT - 0.3, 0.035, D * 0.45, SPLIT / 2, SOUTH_TOP + 0.02, D * 0.4, [0.48, 0.46, 0.44]);

  function span(a, b, droop, rad, seed) {
    const pts = [];
    const wob = (hash(seed, 1, 2) - 0.5) * 0.06;
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t + Math.sin(Math.PI * t) * wob,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, rad, 3, false));
  }
  const ties = [[0.15, 2.72], [1.7, 2.68], [3.15, 2.62], [4.7, 2.58], [6.1, 2.66]];
  for (let k = 0; k < ties.length - 1; k++) {
    for (let i = 0; i < 5; i++) {
      const seed = k * 17 + i;
      span(
        [ties[k][0], ties[k][1] + (hash(seed, 2, 1) - 0.5) * 0.05, -0.12 - hash(seed, 3, 1) * 0.12],
        [ties[k + 1][0], ties[k + 1][1], -0.1 - hash(seed, 3, 2) * 0.14],
        0.04 + hash(seed, 4, 1) * 0.16,
        i < 1 ? 0.012 : 0.005,
        seed,
      );
    }
  }
  span([0.2, 5.5, -0.06], [2.5, 5.35, -0.1], 0.18, 0.006, 80);
  span([0.4, 7.4, -0.05], [2.4, 7.1, -0.08], 0.22, 0.005, 81);
  span([3.0, 5.4, -0.06], [6.0, 5.15, -0.08], 0.16, 0.005, 82);
  span([0.3, 2.7, -0.2], [0.5, 6.6, -0.08], 0.12, 0.005, 83);
  span([5.9, 2.55, -0.18], [5.6, 5.2, -0.06], 0.1, 0.005, 84);

  for (let i = 0; i < 4; i++) {
    const coil = new THREE.TorusGeometry(0.2 + i * 0.012, 0.009, 4, 18);
    place(coil, 0.12, 2.0 - i * 0.015, -0.12, 0.2 + i * 0.08, 1.35, 0);
    add("wire", coil);
  }
  addBox("duct", 0.06, 2.6, 0.06, 2.55, 6.1, -0.06, [1.05, 1.05, 1.02]);
  addBox("plaster", 0.9, 0.06, 0.35, 1.3, 0.04, -0.12, [0.75, 0.72, 0.68]);
  addBox("plaster", 2.4, 0.05, 0.28, 4.6, 0.035, -0.1, [0.7, 0.66, 0.62]);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
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
  root.userData.id = "006";
  return root;
}
