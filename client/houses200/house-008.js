// House 008. Paropakar Marg, west face of OSM way 906786521, edge 6, 9.28 m.
// Spec: research/houses200/008/design.md
// Origin: front-left ground corner. +X along the street toward north, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. x = 0 is south (photo-right: the panelled doors).
// x = 9.28 is north (photo-left: brick, the arched window). place.js flips local +X.
// Pano 54b40hySIPyBqu4wlN72dg, yaw 100. Copy that face. No Khalti board (that door is
// past the south corner). No bicycle tag. No words that are not readable on this wall.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 9.28;
const D = 6.78;
const T = 0.22;
const ROOF = 6.55;

const SUN = { dir: 0.78, spec: 0.4, ind: 1.3 };

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
  const w = 2048;
  const h = 1024;
  const cols = 20;
  const rows = 36;
  const bw = w / cols;
  const bh = h / rows;
  const col = canvas(w, h);
  const hei = canvas(w, h);
  const arm = canvas(w, h);
  const c = col.getContext("2d");
  const e = hei.getContext("2d");
  const a = arm.getContext("2d");
  const r = rng(8008);
  c.fillStyle = "#7a5a48";
  c.fillRect(0, 0, w, h);
  e.fillStyle = "#3a3a3a";
  e.fillRect(0, 0, w, h);
  a.fillStyle = "rgb(190,250,0)";
  a.fillRect(0, 0, w, h);
  const pal = [
    [178, 104, 70], [166, 94, 64], [190, 116, 80], [156, 86, 60],
    [184, 110, 76], [146, 80, 56], [172, 100, 68], [198, 128, 92], [162, 92, 64],
  ];
  for (let row = 0; row < rows; row++) {
    const off = (row % 2) * bw / 2;
    for (let k = 0; k < cols; k++) {
      const p = pal[Math.floor(r() * pal.length)];
      const j = 0.84 + r() * 0.24;
      let R = p[0] * j;
      let G = p[1] * j;
      let B = p[2] * j;
      if (r() < 0.05) { R *= 0.78; G *= 0.76; B *= 0.76; }
      if (r() < 0.06) { R = R * 0.8 + 44; G = G * 0.8 + 30; B = B * 0.8 + 24; }
      const jx = 1.3 + r() * 1.0;
      const jy = 1.05 + r() * 0.8;
      for (const dx of [0, -w]) {
        const x0 = k * bw + off + dx + jx;
        const y0 = row * bh + jy;
        const ww = bw - jx * 2;
        const hh = bh - jy * 2;
        c.fillStyle = `rgb(${R | 0},${G | 0},${B | 0})`;
        c.fillRect(x0, y0, ww, hh);
        c.fillStyle = "rgba(90,52,36,0.14)";
        c.fillRect(x0, y0 + hh * 0.72, ww, hh * 0.28);
        for (let s = 0; s < 6; s++) {
          c.fillStyle = r() > 0.5 ? "rgba(230,190,150,0.10)" : "rgba(80,44,30,0.12)";
          c.fillRect(x0 + r() * ww, y0 + r() * hh, 2 + r() * 8, 1 + r() * 3);
        }
        e.fillStyle = "rgb(168,168,168)";
        e.fillRect(x0 + 2, y0 + 2, ww - 4, hh - 4);
        a.fillStyle = "rgb(255,214,0)";
        a.fillRect(x0, y0, ww, hh);
      }
    }
  }
  const rep = [1 / 2.4, 1 / 1.2];
  const map = toTex(col, true, true);
  const nor = toTex(normalFromHeight(hei, 3.4), false, true);
  const rough = toTex(arm, false, true);
  for (const t of [map, nor, rough]) t.repeat.set(rep[0], rep[1]);
  return { diff: map, nor, arm: rough };
}

function grimeTex() {
  const w = 1024;
  const h = 768;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(808);
  const X = (m) => (m / 9.4) * w;
  const Y = (m) => h - (m / 6.8) * h;
  g.fillStyle = "rgb(168,168,168)";
  g.fillRect(0, 0, w, h);
  const stain = (x, y, rw, rh) => {
    g.fillStyle = "rgba(42,28,24,0.55)";
    g.beginPath();
    g.ellipse(X(x), Y(y), X(rw) * 0.5, (rh / 6.8) * h * 0.5, 0, 0, 6.3);
    g.fill();
  };
  stain(7.3, 3.7, 1.4, 1.1);
  stain(1.5, 3.55, 0.9, 0.7);
  const damp = g.createLinearGradient(0, Y(0), 0, Y(0.9));
  damp.addColorStop(0, "rgba(40,34,30,0.55)");
  damp.addColorStop(1, "rgba(40,34,30,0)");
  g.fillStyle = damp;
  g.fillRect(0, Y(0.9), w, Y(0) - Y(0.9));
  for (let i = 0; i < 40; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(50,36,30,0.10)" : "rgba(220,200,180,0.08)";
    g.beginPath();
    g.ellipse(r() * w, r() * h, 20 + r() * 90, 10 + r() * 50, 0, 0, 6.3);
    g.fill();
  }
  for (const by of [2.95, 6.2]) {
    const gr = g.createLinearGradient(0, Y(by), 0, Y(by - 0.7));
    gr.addColorStop(0, "rgba(36,24,20,0.7)");
    gr.addColorStop(1, "rgba(36,24,20,0)");
    g.fillStyle = gr;
    g.fillRect(0, Y(by), w, Math.abs(Y(by - 0.7) - Y(by)));
  }
  for (let i = 0; i < 90; i++) {
    const x = r() * w;
    const len = (0.3 + r() * 0.9) * (h / 6.8);
    const gr = g.createLinearGradient(0, Y(2.9), 0, Y(2.9) - len);
    gr.addColorStop(0, "rgba(40,28,24,0.45)");
    gr.addColorStop(1, "rgba(40,28,24,0)");
    g.fillStyle = gr;
    g.fillRect(x, Y(2.9) - len, 3 + r() * 10, len);
  }
  const t = toTex(c, false, false);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function doorTex() {
  const w = 512;
  const h = 768;
  const c = canvas(w, h);
  const hei = canvas(w, h);
  const g = c.getContext("2d");
  const e = hei.getContext("2d");
  const r = rng(88);
  g.fillStyle = "#8a5236";
  g.fillRect(0, 0, w, h);
  e.fillStyle = "#9a9a9a";
  e.fillRect(0, 0, w, h);
  for (let i = 0; i < 400; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(40,18,10,0.15)" : "rgba(180,120,80,0.08)";
    g.fillRect(r() * w, r() * h, 2, 8 + r() * 30);
  }
  const cols = 2;
  const rows = 3;
  const padX = 28;
  const padY = 26;
  const gw = (w - padX * 2) / cols;
  const gh = (h - padY * 2) / rows;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = padX + col * gw + 10;
      const y = padY + row * gh + 10;
      const pw = gw - 20;
      const ph = gh - 20;
      g.fillStyle = "#5c3828";
      g.fillRect(x - 4, y - 4, pw + 8, ph + 8);
      g.fillStyle = "#9a5e3e";
      g.fillRect(x, y, pw, ph);
      g.fillStyle = "rgba(255,220,180,0.08)";
      g.fillRect(x, y, pw, ph * 0.35);
      e.fillStyle = "#6e6e6e";
      e.fillRect(x, y, pw, ph);
      e.fillStyle = "#b4b4b4";
      e.fillRect(x + 6, y + 6, pw - 12, ph - 12);
    }
  }
  for (let i = 0; i < 110; i++) {
    g.fillStyle = r() > 0.3 ? "rgba(236,226,206,0.85)" : "rgba(60,30,18,0.5)";
    g.beginPath();
    g.ellipse(r() * w, r() * h, 1.5 + r() * 4, 1 + r() * 3, r() * 3, 0, 6.3);
    g.fill();
  }
  const scuff = g.createLinearGradient(0, h, 0, h * 0.8);
  scuff.addColorStop(0, "rgba(40,24,16,0.5)");
  scuff.addColorStop(1, "rgba(40,24,16,0)");
  g.fillStyle = scuff;
  g.fillRect(0, h * 0.8, w, h * 0.2);
  const map = toTex(c, true, false);
  const nor = toTex(normalFromHeight(hei, 2.8), false, false);
  return { diff: map, nor };
}

function latticeTex() {
  const w = 256;
  const h = 320;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  g.clearRect(0, 0, w, h);
  g.fillStyle = "#1a100c";
  g.fillRect(0, 0, w, h);
  g.strokeStyle = "#3a2418";
  g.lineWidth = 5;
  const step = 22;
  for (let i = -h; i < w + h; i += step) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i + h, h);
    g.stroke();
    g.beginPath();
    g.moveTo(i, h);
    g.lineTo(i + h, 0);
    g.stroke();
  }
  g.strokeStyle = "#2a1a12";
  g.lineWidth = 2;
  for (let i = 0; i < w; i += step) {
    g.beginPath();
    g.moveTo(i, 0);
    g.lineTo(i, h);
    g.stroke();
  }
  return toTex(c, true, false);
}

function awningTex() {
  const w = 1024;
  const h = 256;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const stripes = ["#d8786a", "#e8a86a", "#e6d07a", "#9cc48a", "#7aa8c8", "#c88ab0", "#e89a7a", "#b8cc80"];
  const n = stripes.length * 9;
  const sw = w / n;
  for (let i = 0; i < n; i++) {
    g.fillStyle = stripes[i % stripes.length];
    g.fillRect(i * sw, 0, sw + 1, h);
  }
  const fade = g.createLinearGradient(0, 0, 0, h);
  fade.addColorStop(0, "rgba(240,236,224,0.35)");
  fade.addColorStop(1, "rgba(60,50,40,0.18)");
  g.fillStyle = fade;
  g.fillRect(0, 0, w, h);
  g.fillStyle = "#e8e2d4";
  g.fillRect(0, 0, w, 22);
  return toTex(c, true, true);
}

function posterTex(seed) {
  const c = canvas(180, 140);
  const g = c.getContext("2d");
  const r = rng(seed);
  g.fillStyle = r() > 0.5 ? "#f4efe6" : "#f7f1e4";
  g.fillRect(0, 0, 180, 140);
  g.fillStyle = "#c45a3a";
  g.beginPath();
  g.ellipse(90, 78, 48, 22, 0, 0, 6.3);
  g.fill();
  g.fillStyle = "#f2d2a2";
  g.beginPath();
  g.arc(90, 62, 26, 0, 6.3);
  g.fill();
  g.fillStyle = r() > 0.5 ? "#6a8f3a" : "#8a3030";
  g.beginPath();
  g.arc(90, 58, 8, 0, 6.3);
  g.fill();
  return toTex(c, true, false);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  float rec = smoothstep(0.02, 0.35, p.z) * (1.0 - step(1.2, p.z));
  ao *= 1.0 - 0.55 * rec;
  if (p.z < 0.6) {
    ao *= 1.0 - 0.45 * smoothstep(0.7, 0.0, 3.05 - p.y) * step(0.0, 3.05 - p.y);
    ao *= 1.0 - 0.4 * smoothstep(0.8, 0.0, 6.25 - p.y) * step(0.0, 6.25 - p.y);
  }
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.5, p.y);
  return ao;
}
`;

const GRIME_GLSL = `
float gax = abs(vHouseN.x);
float gay = abs(vHouseN.y);
float gaz = abs(vHouseN.z);
float gu = (gax > gaz && gax > gay) ? clamp(vHousePos.z / 6.9, 0.0, 1.0) : clamp(vHousePos.x / 9.4, 0.0, 1.0);
float gv = clamp(vHousePos.y / 6.8, 0.0, 1.0);
diffuseColor.rgb *= texture2D(grimeMap, vec2(gu, gv)).rgb * 1.55;
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${SUN.dir.toFixed(3)} * (0.55 + 0.45 * hao);
reflectedLight.directSpecular *= ${SUN.spec.toFixed(3)} * hao;
reflectedLight.indirectDiffuse *= ${SUN.ind.toFixed(3)} * hao;
reflectedLight.indirectSpecular *= hao;
`;

function houseShader(mat, key, grime) {
  mat.onBeforeCompile = (shader) => {
    if (grime) shader.uniforms.grimeMap = { value: grime };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + (grime ? "uniform sampler2D grimeMap;\n" : "") + AO_GLSL);
    if (grime) frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\n" + GRIME_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house008-" + key; };
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

export function createHouse008() {
  const root = new THREE.Group();
  root.name = "house-008";

  const groundHoles = [
    { x: 1.7, y: 1.42, w: 2.55, h: 2.12 },
    { x: 3.72, y: 1.42, w: 0.88, h: 2.12 },
    { x: 5.15, y: 1.52, w: 1.45, h: 1.72 },
  ];
  const topHoles = [
    { x: 5.45, y: 4.72, w: 1.15, h: 1.2 },
    { x: 7.45, y: 4.6, w: 1.02, h: 0.98 },
  ];

  const grime = grimeTex();
  const brickMaps = brickSet();
  const doorMaps = doorTex();
  const mats = {
    brick: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: brickMaps.diff, normalMap: brickMaps.nor, roughnessMap: brickMaps.arm,
      aoMap: brickMaps.arm, roughness: 1, metalness: 0, aoMapIntensity: 0.45, vertexColors: true,
    }),
    wood: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: doorMaps.diff, normalMap: doorMaps.nor, roughness: 0.78, metalness: 0, vertexColors: true,
    }),
    timber: new THREE.MeshStandardMaterial({ color: 0x4a3024, roughness: 0.84, metalness: 0, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({
      color: 0x8a948e, roughness: 0.18, metalness: 0, transparent: true, opacity: 0.28, vertexColors: true,
    }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110f, roughness: 0.94, metalness: 0, vertexColors: true }),
    step: new THREE.MeshStandardMaterial({ color: 0xb7aa9c, roughness: 0.92, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2624, roughness: 0.6, metalness: 0.05, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7, metalness: 0, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({
      color: 0xffffff, map: awningTex(), roughness: 0.86, metalness: 0, vertexColors: true, side: THREE.DoubleSide,
    }),
  };
  mats.brick.normalScale = new THREE.Vector2(1, 1);
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name, name === "brick" ? grime : null);

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "brick") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(x0, x1, y0, y1, holes) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox("brick", part.w, part.h, T, part.x, part.y, T / 2);
    }
  }
  function looseMesh(geo, mat, key) {
    houseShader(mat, key, null);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
    return mesh;
  }

  wallZ(0, W, 0, 2.95, groundHoles);
  wallZ(0, W, 3.2, 6.15, topHoles);
  addBox("brick", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("brick", T, ROOF, D, W - T / 2, ROOF / 2, D / 2);
  addBox("timber", 0.2, 0.1, 1.7, W + 0.02, 2.35, D * 0.7, [0.42, 0.32, 0.24]);
  addBox("brick", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("step", W - 0.5, 0.12, D - 0.6, W / 2, ROOF + 0.06, D / 2 + 0.05, [0.72, 0.7, 0.66]);

  function cornice(y) {
    addBox("timber", W + 0.16, 0.1, 0.34, W / 2, y, -0.11, [0.62, 0.56, 0.5]);
    addBox("timber", W + 0.08, 0.08, 0.22, W / 2, y - 0.09, -0.05, [0.42, 0.36, 0.3]);
    addBox("timber", W + 0.04, 0.12, 0.1, W / 2, y - 0.22, -0.01, [0.34, 0.28, 0.24]);
    const n = 46;
    for (let i = 0; i < n; i++) {
      const x = 0.15 + i * ((W - 0.3) / (n - 1));
      addBox("timber", 0.08, 0.08, 0.06, x, y - 0.17, -0.1, [0.58, 0.5, 0.42]);
      addBox("timber", 0.05, 0.06, 0.04, x + 0.1, y - 0.26, -0.07, [0.5, 0.44, 0.36]);
    }
  }
  cornice(3.02);
  cornice(6.22);

  function frame(x, y, w, h, z, mat, tint) {
    const m = mat || "wood";
    const t = tint || [1, 1, 1];
    addBox(m, 0.06, h + 0.06, 0.07, x - w / 2, y, z, t);
    addBox(m, 0.06, h + 0.06, 0.07, x + w / 2, y, z, t);
    addBox(m, w + 0.06, 0.06, 0.07, x, y + h / 2, z, t);
    addBox(m, w + 0.08, 0.07, 0.09, x, y - h / 2, z - 0.01, t.map((v) => v * 0.9));
  }
  function carve(x, y, w, h, z) {
    // Rows of small carved blocks around a window, the photo's dark ornate surround.
    for (let i = 0; i < 9; i++) {
      const t = (i + 0.5) / 9;
      for (const side of [-1, 1]) {
        addBox("timber", 0.07, 0.07, 0.05, x + side * (w / 2 + 0.07), y - h / 2 + t * h, z - 0.05, [0.3, 0.22, 0.16]);
      }
      addBox("timber", 0.07, 0.06, 0.05, x - w / 2 + t * w, y + h / 2 + 0.07, z - 0.05, [0.3, 0.22, 0.16]);
    }
  }
  const alu = [0.78, 0.78, 0.76];

  frame(5.15, 1.52, 1.45, 1.72, -0.03, "goods", alu);
  addBox("glass", 1.28, 1.52, 0.02, 5.15, 1.55, 0.02);
  addBox("goods", 0.03, 1.5, 0.03, 5.15, 1.52, -0.02, alu);
  addBox("goods", 1.28, 0.03, 0.03, 5.15, 1.52, -0.02, alu);
  frame(3.72, 1.42, 0.88, 2.12, -0.03, "goods", alu);
  addBox("dark", 0.72, 1.9, 0.4, 3.72, 1.4, 0.35);
  add("wood", place(boxGeo(0.08, 2.05, 0.46), 3.22, 1.4, -0.12, 0, 1.15, 0), [1, 1, 1]);
  add("wood", place(boxGeo(0.08, 2.05, 0.46), 4.2, 1.4, -0.1, 0, -1.05, 0), [1, 1, 1]);

  add("wood", place(boxGeo(1.22, 2.12, 0.05), 1.05, 1.42, 0.04), [1, 1, 1]);
  add("wood", place(boxGeo(1.22, 2.12, 0.05), 2.32, 1.42, 0.04), [0.94, 0.94, 0.94]);
  addBox("timber", 0.04, 2.16, 0.08, 1.7, 1.42, -0.02, [0.7, 0.62, 0.54]);
  for (const hx of [1.15, 2.2]) {
    addBox("wire", 0.28, 0.03, 0.04, hx, 1.15, -0.02, [1.8, 1.75, 1.7]);
  }
  addBox("dark", 0.04, 0.08, 0.04, 1.15, 0.7, -0.02);
  addBox("dark", 0.04, 0.08, 0.04, 2.22, 0.95, -0.02);

  frame(5.45, 4.72, 1.22, 1.28, -0.06, "timber", [0.34, 0.25, 0.18]);
  carve(5.45, 4.72, 1.22, 1.28, -0.06);
  addBox("timber", 1.42, 0.1, 0.18, 5.45, 5.46, -0.12, [0.32, 0.22, 0.16]);
  addBox("timber", 1.28, 0.08, 0.12, 5.45, 4.04, -0.08, [0.4, 0.3, 0.22]);
  addBox("dark", 0.98, 1.02, 0.16, 5.45, 4.72, 0.1);
  {
    const cols = 6;
    const rows = 7;
    const jw = 0.92;
    const jh = 0.98;
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        const px = 5.45 - jw / 2 + (i + 0.5) * (jw / cols);
        const py = 4.72 - jh / 2 + (j + 0.5) * (jh / rows);
        add("timber", place(boxGeo(0.034, 0.12, 0.028), px, py, -0.03, 0, 0, Math.PI / 4), [0.2, 0.14, 0.1]);
      }
    }
  }

  {
    const ax = 7.45;
    const spring = 4.55;
    const rad = 0.5;
    const sp = new THREE.Shape();
    sp.moveTo(-rad, 0);
    sp.lineTo(-rad, rad + 0.06);
    sp.lineTo(rad, rad + 0.06);
    sp.lineTo(rad, 0);
    sp.closePath();
    const archHole = new THREE.Path();
    archHole.absarc(0, 0, rad - 0.02, 0, Math.PI, false);
    sp.holes.push(archHole);
    const spandrel = new THREE.ShapeGeometry(sp, 10);
    place(spandrel, ax, spring, 0.012, 0, Math.PI, 0);
    worldUV(spandrel);
    add("brick", spandrel);
    const pane = new THREE.CircleGeometry(rad - 0.06, 14, 0, Math.PI);
    place(pane, ax, spring, 0.04, 0, Math.PI, 0);
    add("dark", pane);
    addBox("dark", rad * 1.7, spring - 4.12, 0.06, ax, (spring + 4.12) / 2, 0.04);
    for (let i = 0; i <= 9; i++) {
      const a = (Math.PI * i) / 9;
      const px = ax + Math.cos(a) * (rad + 0.05);
      const py = spring + Math.sin(a) * (rad + 0.05);
      add("timber", place(boxGeo(0.1, 0.09, 0.14), px, py, -0.07, 0, 0, a - Math.PI / 2), [0.28, 0.2, 0.14]);
    }
    addBox("timber", 1.45, 0.1, 0.26, ax, spring + rad + 0.16, -0.16, [0.3, 0.22, 0.16]);
    addBox("timber", 1.2, 0.08, 0.16, ax, spring + rad + 0.05, -0.1, [0.4, 0.3, 0.22]);
    for (const side of [-1, 1]) {
      addBox("timber", 0.09, 1.2, 0.12, ax + side * (rad + 0.02), spring - 0.42, -0.06, [0.32, 0.24, 0.18]);
      addBox("timber", 0.1, 0.16, 0.18, ax + side * (rad + 0.08), spring + rad + 0.02, -0.14, [0.26, 0.18, 0.12]);
    }
    addBox("timber", 1.15, 0.07, 0.1, ax, 4.12, -0.05, [0.36, 0.26, 0.18]);
  }

  const awnW = 5.15;
  const awnX = 2.75;
  const awn = place(new THREE.BoxGeometry(awnW, 0.04, 1.2), awnX, 3.34, -0.55, -0.18, 0, 0);
  add("cloth", awn);
  {
    const drops = 9;
    const s = new THREE.Shape();
    s.moveTo(-awnW / 2, 0.1);
    s.lineTo(awnW / 2, 0.1);
    const n = 72;
    for (let i = n; i >= 0; i--) {
      const t = i / n;
      const x = -awnW / 2 + awnW * t;
      const wave = -0.2 * Math.abs(Math.sin(t * drops * Math.PI));
      s.lineTo(x, wave);
    }
    s.closePath();
    const sg = new THREE.ShapeGeometry(s, 1);
    const suv = sg.attributes.uv;
    const spos = sg.attributes.position;
    for (let i = 0; i < suv.count; i++) suv.setXY(i, (spos.getX(i) + awnW / 2) / awnW, 0.2 + spos.getY(i) * 2);
    place(sg, awnX, 3.16, -1.1, 0, Math.PI, 0);
    add("cloth", sg);
  }

  const steps = [
    { y: 0.4, z: -0.2, d: 0.32, x0: 0.15, x1: 6.15 },
    { y: 0.24, z: -0.48, d: 0.34, x0: 0.05, x1: 6.35 },
    { y: 0.08, z: -0.78, d: 0.36, x0: -0.05, x1: 6.55 },
  ];
  for (const s of steps) {
    addBox("step", s.x1 - s.x0, 0.14, s.d, (s.x0 + s.x1) / 2, s.y, s.z, [0.78, 0.74, 0.68]);
  }
  addBox("brick", 6.5, 0.06, 0.08, 3.2, 0.04, -0.96);
  addBox("goods", 0.55, 0.012, 0.32, 3.72, 0.48, -0.05, [0.55, 0.12, 0.1]);

  addBox("dark", 2.4, 1.7, 0.08, 4.5, 1.5, 1.6);
  addBox("timber", 0.9, 0.06, 0.55, 4.15, 0.78, 0.85, [0.7, 0.58, 0.46]);
  addBox("timber", 0.06, 0.7, 0.06, 3.8, 0.4, 0.7, [0.55, 0.42, 0.32]);
  addBox("timber", 0.06, 0.7, 0.06, 4.5, 0.4, 0.7, [0.55, 0.42, 0.32]);
  addBox("timber", 0.28, 0.45, 0.28, 3.55, 0.28, 1.15, [0.5, 0.38, 0.28]);
  addBox("timber", 0.28, 0.45, 0.28, 4.7, 0.28, 1.2, [0.5, 0.38, 0.28]);
  const p1 = place(new THREE.PlaneGeometry(0.42, 0.32), 4.7, 1.55, 0.08, 0, Math.PI, 0);
  paintVary(p1);
  looseMesh(p1, new THREE.MeshStandardMaterial({ map: posterTex(21), roughness: 0.8 }), "poster-a");
  const p2 = place(new THREE.PlaneGeometry(0.42, 0.32), 5.55, 1.15, 0.08, 0, Math.PI, 0);
  paintVary(p2);
  looseMesh(p2, new THREE.MeshStandardMaterial({ map: posterTex(44), roughness: 0.8 }), "poster-b");
  addBox("goods", 0.16, 0.2, 0.01, 5.15, 1.85, 0.05, [0.92, 0.9, 0.84]);
  add("goods", place(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 16), 5.65, 2.1, 0.04, Math.PI / 2, 0, 0), [0.86, 0.8, 0.62]);

  function span(a, b, droop, rad) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, rad, 4, false));
  }
  span([0.15, 3.05, -0.22], [5.4, 3.4, -0.32], 0.28, 0.014);
  span([0.3, 3.18, -0.16], [7.2, 3.55, -0.24], 0.2, 0.01);
  span([1.4, 4.05, -0.14], [8.8, 5.55, -0.22], 0.42, 0.012);
  span([0.2, 5.85, -0.12], [9.0, 5.55, -0.2], 0.34, 0.011);
  span([5.6, 4.15, -0.16], [9.05, 3.2, -0.24], 0.26, 0.009);
  for (let i = 0; i < 9; i++) {
    const k = i / 8;
    span([W + 0.1, 3.3 + k * 0.12, -0.32 - k * 0.06], [2.6, 3.36 - k * 0.1, -0.4 + k * 0.05], 0.3 + k * 0.18, 0.008 + (i % 3) * 0.004);
  }
  span([8.4, 3.2, -0.36], [-0.05, 3.95, -0.1], 0.32, 0.016);
  addBox("dark", W - 0.3, 0.16, 0.012, W / 2, 2.86, -0.004, [0.18, 0.12, 0.1]);
  for (let i = 0; i < 8; i++) {
    const x = 0.6 + i * 1.05;
    add("goods", place(new THREE.SphereGeometry(0.035, 6, 5), x, 2.92, -0.16), [1, 0.98, 0.9]);
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
  }
  for (const obj of loose) root.add(obj);

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "008";
  return root;
}
