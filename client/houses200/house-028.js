// House 028. Bhotahiti, Siddhidas Marg, OSM way 341795477, edge 0, 6.33 m.
// Spec: research/houses200/028/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. x = 0 is photo-right (the PATHAN board).
// Pano WFTvaxOf_SU6VaL-hHeAaw, 2.28 m from the footprint, yaw 293, pitch 2.
// One shop, a cream scalloped awning, hanging kurtas, a tin roof. No upper windows.
// The tall brick block down the street is not this footprint.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 6.33;
const D = 4.82;
const T = 0.2;
const ROOF = 4.7;

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

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  float rec = smoothstep(0.02, 0.4, p.z) * (1.0 - step(2.6, p.z));
  ao *= 1.0 - 0.55 * rec;
  ao *= 1.0 - 0.45 * smoothstep(0.7, 0.0, 2.55 - p.y) * step(0.0, 2.55 - p.y) * step(p.z, 0.4);
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.4, p.y);
  return ao;
}
`;

const GRIME_GLSL = `
float gax = abs(vHouseN.x);
float gay = abs(vHouseN.y);
float gaz = abs(vHouseN.z);
float gu = (gax > gaz && gax > gay) ? clamp(vHousePos.z / 4.82, 0.0, 1.0) : clamp(vHousePos.x / 6.33, 0.0, 1.0);
float gv = clamp(vHousePos.y / 4.7, 0.0, 1.0);
float g = texture2D(grimeMap, vec2(gu, gv)).r;
diffuseColor.rgb *= mix(vec3(0.62, 0.58, 0.52), vec3(1.0), g);
`;

const LIGHT_GLSL = `
float hao = houseAO(vHousePos);
reflectedLight.directDiffuse *= ${OVERCAST.dir.toFixed(3)} * (0.55 + 0.45 * hao);
reflectedLight.directSpecular *= ${OVERCAST.spec.toFixed(3)} * hao;
reflectedLight.indirectDiffuse *= ${OVERCAST.ind.toFixed(3)} * hao;
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
  mat.customProgramCacheKey = function () { return "house028-" + key; };
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

function grimeMap() {
  const c = canvas(256, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = "rgba(40,32,24,0.55)";
  g.fillRect(0, 210, 256, 46);
  for (let i = 0; i < 18; i++) {
    const x = (hash(i, 2, 8) * 256) | 0;
    g.fillStyle = "rgba(50,40,30,0.28)";
    g.fillRect(x, 40 + (hash(i, 5, 1) * 160) | 0, 3, 70 + (hash(i, 9, 2) * 80) | 0);
  }
  const t = toTex(c, false);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function awningTex() {
  const c = canvas(512, 128);
  const g = c.getContext("2d");
  g.fillStyle = "#f4f0c6";
  g.fillRect(0, 0, 512, 128);
  g.fillStyle = "#e4e0b0";
  for (let i = 0; i < 16; i++) g.fillRect(i * 32, 0, 2, 128);
  g.fillStyle = "#d9d4a4";
  for (let i = 0; i < 14; i++) {
    g.beginPath();
    g.arc(22 + i * 36, 108, 16, 0, Math.PI, false);
    g.fill();
  }
  g.fillStyle = "#c9c48e";
  g.fillRect(0, 118, 512, 10);
  return toTex(c, true);
}

function signTex() {
  const c = canvas(1024, 360);
  const g = c.getContext("2d");
  g.fillStyle = "#e7dcc4";
  g.fillRect(0, 0, 1024, 360);
  g.fillStyle = "#6b2430";
  g.font = "bold 124px Georgia, serif";
  g.fillText("PATHAN", 150, 130);
  g.font = "bold 30px Georgia, serif";
  g.fillText("THE HUB", 160, 168);
  g.fillStyle = "#3a3330";
  g.font = "26px sans-serif";
  g.fillText("Bhotahity, Ason, Kathmandu", 400, 172);
  g.font = "bold 30px sans-serif";
  g.fillText("Mobile: 9851006667, 9808743867", 300, 222);
  g.fillStyle = "#7f9a3a";
  g.fillRect(36, 150, 84, 84);
  g.fillStyle = "#d9b43a";
  g.fillRect(52, 166, 52, 52);
  g.fillStyle = "#6b2430";
  g.fillRect(0, 262, 1024, 72);
  g.fillStyle = "#f3e6cf";
  g.font = "bold 30px sans-serif";
  g.fillText("Remember us for Kurta, Paijama, Sherwani, Bandi, Daura Suruwal", 24, 310);
  const grd = g.createRadialGradient(950, 120, 10, 950, 120, 90);
  grd.addColorStop(0, "#c9a888");
  grd.addColorStop(0.6, "#8a6a52");
  grd.addColorStop(1, "#e7dcc4");
  g.fillStyle = grd;
  g.beginPath(); g.arc(950, 120, 86, 0, Math.PI * 2); g.fill();
  g.fillStyle = "rgba(60,40,30,0.55)";
  g.beginPath(); g.arc(950, 95, 28, 0, Math.PI * 2); g.fill();
  g.fillRect(912, 128, 76, 70);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = "rgba(70,55,40," + (0.04 + hash(i, 2, 3) * 0.08).toFixed(2) + ")";
    g.fillRect(hash(i, 1, 1) * 1024, 0, 4 + hash(i, 4, 4) * 14, 60 + hash(i, 5, 5) * 300);
  }
  const top = g.createLinearGradient(0, 0, 0, 360);
  top.addColorStop(0, "rgba(40,30,20,0.25)");
  top.addColorStop(0.2, "rgba(40,30,20,0)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1024, 360);
  return toTex(c, true);
}

// Garment atlas, 4 x 2 white cut-outs tinted per garment: 0 printed kurta, 1 bordered kurta, 2 anarkali,
// 3 striped tee, 4 paijama, 5 sherwani, 6 checked kurta, 7 dupatta. Folds and prints are grey so tints carry the colour.
function garmentAtlas() {
  const c = canvas(1024, 1024);
  const g = c.getContext("2d");
  const CW = 256, CH = 512;
  function body(i, path, print) {
    const ox = (i % 4) * CW, oy = Math.floor(i / 4) * CH;
    g.save();
    g.translate(ox, oy);
    g.beginPath();
    path(g);
    g.closePath();
    g.fillStyle = "#e6e6e6";
    g.fill();
    g.save();
    g.clip();
    for (let k = 0; k < 9; k++) {
      const x = 20 + hash(i, k, 3) * 216;
      const grd = g.createLinearGradient(x - 14, 0, x + 14, 0);
      grd.addColorStop(0, "rgba(0,0,0,0)");
      grd.addColorStop(0.5, "rgba(0,0,0," + (0.12 + hash(k, i, 5) * 0.16).toFixed(2) + ")");
      grd.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = grd;
      g.fillRect(x - 14, 40, 28, CH);
    }
    print(g);
    const sh = g.createLinearGradient(0, 0, 0, CH);
    sh.addColorStop(0, "rgba(0,0,0,0.25)");
    sh.addColorStop(0.15, "rgba(0,0,0,0)");
    g.fillStyle = sh;
    g.fillRect(0, 0, CW, CH);
    g.restore();
    g.strokeStyle = "#2a2522";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(128, 30);
    g.lineTo(128, 6);
    g.stroke();
    g.restore();
  }
  function kurta(flare, len) {
    return (p) => {
      p.moveTo(104, 30); p.lineTo(64, 40); p.lineTo(18, 150); p.lineTo(44, 160); p.lineTo(70, 110);
      p.lineTo(66 - flare, len); p.lineTo(190 + flare, len); p.lineTo(186, 110); p.lineTo(212, 160);
      p.lineTo(238, 150); p.lineTo(192, 40); p.lineTo(152, 30); p.quadraticCurveTo(128, 62, 104, 30);
    };
  }
  function dots(step, r, col) {
    return (p) => {
      p.fillStyle = col;
      for (let y = 50; y < CH; y += step) for (let x = (y / step) % 2 ? 10 : 10 + step / 2; x < CW; x += step) {
        p.beginPath(); p.arc(x, y, r, 0, Math.PI * 2); p.fill();
      }
    };
  }
  function yoke(p) {
    p.fillStyle = "rgba(255,255,255,0.75)";
    p.fillRect(108, 40, 40, 70);
    p.fillStyle = "rgba(60,40,30,0.4)";
    for (let y = 46; y < 110; y += 9) p.fillRect(112, y, 32, 3);
  }
  body(0, kurta(6, 500), (p) => { dots(22, 4, "rgba(255,240,200,0.8)")(p); yoke(p); });
  body(1, kurta(10, 500), (p) => {
    p.fillStyle = "rgba(255,245,215,0.85)";
    p.fillRect(0, 430, CW, 46);
    p.fillStyle = "rgba(40,20,10,0.45)";
    for (let x = 0; x < CW; x += 14) p.fillRect(x, 440, 7, 26);
    yoke(p);
  });
  body(2, kurta(48, 505), (p) => { dots(14, 2.5, "rgba(255,235,190,0.7)")(p); p.fillStyle = "rgba(255,240,200,0.8)"; p.fillRect(0, 478, CW, 20); });
  body(3, (p) => {
    p.moveTo(100, 30); p.lineTo(50, 44); p.lineTo(8, 120); p.lineTo(42, 138); p.lineTo(66, 100);
    p.lineTo(66, 300); p.lineTo(190, 300); p.lineTo(190, 100); p.lineTo(214, 138); p.lineTo(248, 120);
    p.lineTo(206, 44); p.lineTo(156, 30); p.quadraticCurveTo(128, 58, 100, 30);
  }, (p) => { p.fillStyle = "rgba(20,20,24,0.85)"; for (let y = 130; y < 230; y += 26) p.fillRect(0, y, CW, 12); });
  body(4, (p) => {
    p.moveTo(70, 30); p.lineTo(186, 30); p.lineTo(200, 500); p.lineTo(140, 500); p.lineTo(128, 140);
    p.lineTo(116, 500); p.lineTo(56, 500);
  }, (p) => { p.fillStyle = "rgba(0,0,0,0.2)"; p.fillRect(70, 30, 116, 22); });
  body(5, kurta(4, 500), (p) => {
    p.fillStyle = "rgba(0,0,0,0.35)"; p.fillRect(124, 40, 8, 460);
    p.fillStyle = "rgba(255,230,160,0.9)";
    for (let y = 70; y < 320; y += 34) { p.beginPath(); p.arc(128, y, 5, 0, Math.PI * 2); p.fill(); }
    p.fillStyle = "rgba(255,235,180,0.5)"; p.fillRect(104, 32, 48, 16);
  });
  body(6, kurta(8, 470), (p) => {
    p.fillStyle = "rgba(0,0,0,0.18)";
    for (let x = 0; x < CW; x += 18) p.fillRect(x, 0, 6, CH);
    for (let y = 0; y < CH; y += 18) p.fillRect(0, y, CW, 6);
    yoke(p);
  });
  body(7, (p) => {
    p.moveTo(90, 26); p.lineTo(166, 26); p.lineTo(180, 490); p.lineTo(76, 490);
  }, (p) => {
    dots(18, 3, "rgba(255,240,200,0.6)")(p);
    p.fillStyle = "rgba(255,240,200,0.9)"; p.fillRect(0, 470, CW, 12);
  });
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function printTex() {
  const c = canvas(128, 128);
  const g = c.getContext("2d");
  g.fillStyle = "#dedede";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(255,240,200,0.85)";
  for (let y = 4; y < 128; y += 16) for (let x = (y / 16) % 2 ? 4 : 12; x < 128; x += 16) {
    g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill();
  }
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(5, 6);
  return t;
}

// The weathered tan band between the awning and the roof: blotched, sooty, faint courses under the render.
function bandTex() {
  const c = canvas(1024, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#7a6142";
  g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 140; i++) {
    const x = hash(i, 1, 4) * 1024, y = hash(i, 7, 2) * 256, r = 8 + hash(i, 3, 9) * 46;
    const dark = hash(i, 5, 5) > 0.45;
    const grd = g.createRadialGradient(x, y, 0, x, y, r);
    grd.addColorStop(0, dark ? "rgba(40,30,20,0.35)" : "rgba(190,170,130,0.3)");
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.strokeStyle = "rgba(40,30,20,0.16)";
  g.lineWidth = 2;
  for (let y = 10; y < 256; y += 13) { g.beginPath(); g.moveTo(0, y + hash(y, 1, 1) * 3); g.lineTo(1024, y); g.stroke(); }
  for (let i = 0; i < 40; i++) {
    const x = hash(i, 9, 9) * 1024;
    g.fillStyle = "rgba(30,24,18," + (0.12 + hash(i, 2, 7) * 0.2).toFixed(2) + ")";
    g.fillRect(x, 0, 3 + hash(i, 4, 4) * 6, 60 + hash(i, 6, 1) * 160);
  }
  const top = g.createLinearGradient(0, 0, 0, 256);
  top.addColorStop(0, "rgba(20,16,12,0.55)");
  top.addColorStop(0.3, "rgba(20,16,12,0)");
  top.addColorStop(0.85, "rgba(20,16,12,0)");
  top.addColorStop(1, "rgba(20,16,12,0.35)");
  g.fillStyle = top;
  g.fillRect(0, 0, 1024, 256);
  return toTex(c, true);
}

// Shelves of folded stock on the back wall, seen dimly between the hanging rails.
function shelfTex() {
  const c = canvas(1024, 384);
  const g = c.getContext("2d");
  g.fillStyle = "#b9ad93";
  g.fillRect(0, 0, 1024, 384);
  const cols = ["#7d1e22", "#c46a1c", "#2f6c6a", "#c9a032", "#e0d6c0", "#5a2c4a", "#3c4a2c", "#a83a52", "#26304a"];
  for (let s = 0; s < 4; s++) {
    const y = 20 + s * 90;
    g.fillStyle = "#4a3a2c";
    g.fillRect(0, y + 70, 1024, 8);
    for (let x = 4; x < 1020;) {
      const w = 40 + hash(x, s, 1) * 40;
      let yy = y + 70;
      const n = 3 + Math.floor(hash(x, s, 2) * 5);
      for (let k = 0; k < n; k++) {
        const h = 9 + hash(x, k, s) * 5;
        yy -= h;
        g.fillStyle = cols[Math.floor(hash(x, k, s + 4) * cols.length)];
        g.fillRect(x, yy, w - 3, h - 1);
      }
      x += w;
    }
  }
  return toTex(c, true);
}

// Scalloped valance: opaque band with a seam stripe, cut into scallops at the foot (alpha).
function valanceTex() {
  const c = canvas(512, 64);
  const g = c.getContext("2d");
  g.fillStyle = "#f2f1cf";
  g.fillRect(0, 0, 512, 40);
  for (let i = 0; i < 16; i++) {
    g.beginPath();
    g.arc(16 + i * 32, 40, 16, 0, Math.PI, false);
    g.fill();
  }
  g.fillStyle = "rgba(120,120,80,0.35)";
  g.fillRect(0, 6, 512, 3);
  g.fillRect(0, 34, 512, 2);
  const t = toTex(c, true);
  t.wrapS = THREE.RepeatWrapping;
  return t;
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
    metalness: o.metal ? 0.4 : 0,
    aoMapIntensity: o.ao == null ? 0.35 : o.ao,
    vertexColors: true,
    envMapIntensity: 0.3,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(0.7, 0.7);
  return m;
}

// Corrugated sheet from a front edge (z0, y0) to a back edge (z1, y1), ribs along the slope.
function corrugated(x0, x1, z0, y0, z1, y1, droop) {
  const pitch = 0.076, amp = 0.016;
  const nx = Math.ceil((x1 - x0) / pitch) * 4, nz = 6;
  const pos = [], uv = [], idx = [];
  const len = Math.hypot(z1 - z0, y1 - y0);
  for (let j = 0; j <= nz; j++) {
    const t = j / nz;
    for (let i = 0; i <= nx; i++) {
      const x = x0 + (x1 - x0) * i / nx;
      const s = (x - x0) / (x1 - x0);
      const sag = droop * (1 - t) * (1 - t) * (Math.sin(s * Math.PI) * 0.6 + 0.4 * Math.sin(s * 9.3 + 1.1));
      pos.push(x, y0 + (y1 - y0) * t + amp * Math.sin(2 * Math.PI * (x - x0) / pitch) - sag, z0 + (z1 - z0) * t);
      uv.push(x * 0.45, t * len * 0.45);
    }
  }
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx.push(a, c, b, b, c, d);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function createHouse028() {
  const root = new THREE.Group();
  root.name = "house-028";
  const dirt = grimeMap();

  const plasterMaps = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 0.8, 0.5),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 0.8, 0.5),
    arm: tex("concrete_wall_001_arm.jpg", false, 0.8, 0.5),
  };
  const tinMaps = {
    diff: tex("metal_plate_Diffuse.jpg", true, 1, 1),
    nor: tex("rusty_metal_nor_gl.jpg", false, 1, 1),
    arm: tex("metal_plate_arm.jpg", false, 1, 1),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.4, 0.35),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.4, 0.35),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.4, 0.35),
  };
  const shelves = shelfTex();

  const mats = {
    plaster: pbr(plasterMaps, 0xcfc6ba, { ao: 0.4 }),
    plasterDark: pbr(plasterMaps, 0x8d847c, { ao: 0.45 }),
    shopWall: pbr(plasterMaps, 0x5f6b52, { ao: 0.45 }),
    band: new THREE.MeshStandardMaterial({ color: 0xffffff, map: bandTex(), roughness: 0.95, metalness: 0, vertexColors: true }),
    tin: pbr(tinMaps, 0xb4b2ac, { ao: 0.25, rough: 0.85 }),
    wood: pbr(woodMaps, 0x6e5848, { ao: 0.3 }),
    woodDark: pbr(woodMaps, 0x3a2c24, { ao: 0.3 }),
    garb: new THREE.MeshStandardMaterial({ color: 0xffffff, map: garmentAtlas(), alphaTest: 0.5, roughness: 0.9, metalness: 0, vertexColors: true, side: THREE.DoubleSide }),
    form: new THREE.MeshStandardMaterial({ color: 0xffffff, map: printTex(), roughness: 0.88, metalness: 0, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.85, metalness: 0, vertexColors: true }),
    iron: new THREE.MeshStandardMaterial({ color: 0x2a2a2c, roughness: 0.6, metalness: 0.5, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x1e1c1b, roughness: 0.6, metalness: 0.1, vertexColors: true }),
    cream: new THREE.MeshStandardMaterial({ color: 0xdfe3b2, roughness: 0.85, metalness: 0, vertexColors: true, side: THREE.DoubleSide }),
    valance: new THREE.MeshStandardMaterial({ color: 0xdfe3b2, map: valanceTex(), alphaTest: 0.5, roughness: 0.85, metalness: 0, vertexColors: true, side: THREE.DoubleSide }),
    stock: new THREE.MeshStandardMaterial({ color: 0xffffff, map: shelves, emissive: 0xffffff, emissiveMap: shelves, emissiveIntensity: 0.22, roughness: 0.9, metalness: 0, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xfff4c8, emissive: 0xffe7a0, emissiveIntensity: 1.4, roughness: 0.35, vertexColors: true }),
  };
  mats.tin.side = THREE.DoubleSide;
  mats.tin.emissive = new THREE.Color(0x3b3833);
  for (const [name, mat] of Object.entries(mats)) {
    if (name === "bulb") continue;
    houseShader(mat, name, name === "plaster" || name === "plasterDark" ? dirt : null);
  }

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    if (g.index) g = g.toNonIndexed();
    if (!g.attributes.uv) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx || 0, 0, 0);
    if (name === "plaster" || name === "plasterDark" || name === "tin" || name === "shopWall") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
    }
  }
  // Side wall in the (z, y) plane, its top following the roof from 3.75 at the face to ROOF at the back.
  function sideWall(x) {
    const s = new THREE.Shape();
    s.moveTo(0, 0); s.lineTo(D, 0); s.lineTo(D, ROOF); s.lineTo(0, 3.75); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: T, bevelEnabled: false });
    g.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 1, 0), new THREE.Vector3(1, 0, 0)));
    g.translate(x, 0, 0);
    worldUV(g);
    add("plaster", g);
  }

  // Shell: two piers, a lintel, the tan band up to the roof, green-washed shop walls inside.
  const mouth = [{ x: 3.16, y: 1.25, w: 5.9, h: 2.5 }];
  wallZ("plaster", 0, W, 0, 2.62, 0, mouth, [0.8, 0.77, 0.72]);
  addBox("plasterDark", 0.16, 2.5, 0.1, 0.22, 1.25, -0.04, [0.85, 0.82, 0.78]);
  addBox("plasterDark", 0.16, 2.5, 0.1, W - 0.16, 1.25, -0.04, [0.82, 0.78, 0.74]);
  addBox("woodDark", W - 0.3, 0.1, 0.12, W / 2, 2.52, -0.06);
  const band = new THREE.PlaneGeometry(W, 1.15);
  band.rotateY(Math.PI);
  band.translate(W / 2, 2.62 + 0.575, -0.002);
  add("band", band, [0.8, 0.72, 0.62]);
  addBox("plasterDark", W, 1.15, T, W / 2, 3.195, T / 2, [0.6, 0.55, 0.48]);
  sideWall(0);
  sideWall(W - T);
  addBox("shopWall", W - 2 * T, 2.55, 0.04, W / 2, 1.275, D - T - 0.02, [0.7, 0.72, 0.68]);
  addBox("shopWall", 0.04, 2.55, D - T, T + 0.02, 1.275, (D - T) / 2);
  addBox("shopWall", 0.04, 2.55, D - T, W - T - 0.02, 1.275, (D - T) / 2);
  addBox("plasterDark", W, ROOF - 2.55, T, W / 2, 2.55 + (ROOF - 2.55) / 2, D - T / 2, [0.55, 0.52, 0.48]);
  addBox("wood", W - 0.3, 0.08, D - 0.4, W / 2, 0.04, D / 2, [0.55, 0.5, 0.44]);
  addBox("woodDark", W - 0.4, 0.05, D - 0.3, W / 2, 2.6, D / 2, [0.5, 0.5, 0.5]);
  const back = new THREE.PlaneGeometry(W - 0.6, 2.2);
  back.rotateY(Math.PI);
  back.translate(W / 2, 1.25, D - T - 0.05);
  add("stock", back);

  // Awning over the photo-left four metres: sagging sheet on a frame, scalloped valance, dark end caps.
  const AW0 = 2.45, AW1 = W - 0.05;
  const sheet = new THREE.PlaneGeometry(AW1 - AW0, 1.12, 12, 4);
  {
    const p = sheet.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = (p.getX(i) + (AW1 - AW0) / 2) / (AW1 - AW0);
      const v = (p.getY(i) + 0.56) / 1.12;
      const z = -1.0 * (1 - v);
      const y = 2.42 + 0.5 * v - 0.035 * Math.sin(v * Math.PI) - 0.012 * Math.sin(u * 23);
      p.setXYZ(i, AW0 + u * (AW1 - AW0), y, z);
    }
    sheet.computeVertexNormals();
  }
  add("cream", sheet, [0.97, 0.98, 0.9]);
  const val = new THREE.PlaneGeometry(AW1 - AW0, 0.3);
  {
    const uv = val.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (AW1 - AW0) / 0.6);
  }
  val.translate((AW0 + AW1) / 2, 2.28, -1.01);
  add("valance", val, [0.94, 0.95, 0.86]);
  addBox("iron", 0.03, 0.03, 1.12, AW0, 2.67, -0.5, null, -0.46);
  addBox("iron", 0.03, 0.03, 1.12, AW1, 2.67, -0.5, null, -0.46);
  addBox("iron", AW1 - AW0, 0.025, 0.025, (AW0 + AW1) / 2, 2.42, -1.0);

  // Corrugated grey roof, front edge out past the awning and drooping; purlins under it.
  const roof = corrugated(-0.1, W + 0.1, -1.15, 3.66, D, ROOF - 0.05, 0.06);
  add("tin", roof, [0.78, 0.82, 0.86]);
  addBox("tin", W + 0.2, 0.03, 0.05, W / 2, 3.64, -1.14, [0.5, 0.48, 0.45]);

  // Garments. Cells: 0 printed, 1 bordered, 2 anarkali, 3 tee, 4 paijama, 5 sherwani, 6 checked, 7 dupatta.
  function garment(cell, x, yTop, z, w, h, rgb, yaw, lean) {
    const g = new THREE.PlaneGeometry(w, h, 1, 3);
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    const bow = 0.02 + hash(x, z, cell) * 0.04;
    for (let i = 0; i < p.count; i++) {
      const v = uv.getY(i);
      p.setZ(i, bow * Math.sin((1 - v) * Math.PI * 0.9) * (uv.getX(i) - 0.5) * 2 + (lean || 0) * (1 - v));
      uv.setXY(i, ((cell % 4) + uv.getX(i)) / 4, 1 - (Math.floor(cell / 4) + 1 - v) / 2);
    }
    g.translate(0, -h / 2, 0);
    g.rotateY(yaw || 0);
    g.translate(x, yTop, z);
    add("garb", g, rgb.map((c) => Math.pow(c * 0.8 + 0.2 * 0.45, 2.2)));
  }
  const PAL = [
    [0.56, 0.1, 0.13], [0.9, 0.48, 0.12], [0.3, 0.62, 0.62], [0.86, 0.64, 0.16], [0.78, 0.12, 0.15],
    [0.16, 0.17, 0.28], [0.46, 0.4, 0.2], [0.9, 0.86, 0.72], [0.74, 0.16, 0.3], [0.62, 0.52, 0.68],
    [0.9, 0.46, 0.56], [0.7, 0.8, 0.62], [0.82, 0.2, 0.22], [0.55, 0.3, 0.14],
  ];
  const pick = (k) => PAL[Math.floor(hash(k, 3.3, 7.1) * PAL.length)];
  // Front curtain under the valance, two staggered layers, shoulders overlapping.
  addBox("iron", AW1 - AW0, 0.025, 0.025, (AW0 + AW1) / 2, 2.32, -0.2);
  let k = 0;
  for (let x = AW0 + 0.16; x < AW1 - 0.1; x += 0.25, k++) {
    const cell = [0, 1, 0, 6, 2, 1, 0, 5][k % 8];
    garment(cell, x, 2.32, -0.2 - hash(k, 1, 1) * 0.04, 0.42, 1.25 + hash(k, 2, 2) * 0.2, pick(k), (hash(k, 4, 4) - 0.5) * 0.35);
  }
  for (let x = AW0 + 0.28; x < AW1 - 0.2; x += 0.31, k++) {
    garment([2, 0, 1, 6][k % 4], x, 2.35, 0.05, 0.44, 1.35, pick(k + 40).map((c) => c * 0.8), (hash(k, 5, 5) - 0.5) * 0.4);
  }
  // A row of tees and frocks hung low inside the mouth, and two dim inner rails.
  for (let x = AW0 + 0.5; x < AW1 - 0.3; x += 0.36, k++) {
    garment(k % 3 === 0 ? 3 : 2, x, 1.15, 0.3, 0.42, k % 3 === 0 ? 0.55 : 1.0, k % 3 === 0 ? [0.92, 0.92, 0.9] : pick(k + 80).map((c) => c * 0.75), (hash(k, 6, 6) - 0.5) * 0.5);
  }
  for (const [z, y, s] of [[1.1, 2.3, 0.6], [2.2, 2.3, 0.45]]) {
    addBox("iron", W - 1.0, 0.02, 0.02, W / 2, y, z);
    for (let x = 0.75; x < W - 0.6; x += 0.22, k++) {
      garment([0, 1, 5, 6, 2][k % 5], x, y, z + hash(k, 7, 7) * 0.08, 0.36, 1.2, pick(k + 120).map((c) => c * s), (hash(k, 8, 8) - 0.5) * 0.3);
    }
  }
  // Under the PATHAN board: a rail of sherwanis and coats on hangers, a pink kurta hung from the board.
  addBox("iron", AW0 - 0.4, 0.025, 0.025, AW0 / 2 + 0.1, 2.62, -0.25);
  for (let x = 0.45; x < AW0 - 0.2; x += 0.2, k++) {
    const rgb = [[0.2, 0.16, 0.14], [0.45, 0.12, 0.12], [0.62, 0.52, 0.42], [0.18, 0.2, 0.26], [0.72, 0.5, 0.5]][k % 5];
    garment(5, x, 2.62, -0.25 + hash(k, 9, 9) * 0.06, 0.4, 0.95, rgb, 0.9 + (hash(k, 9, 1) - 0.5) * 0.3);
  }
  garment(1, 1.95, 2.78, -0.55, 0.5, 1.05, [0.95, 0.74, 0.76], 0.15);
  addBox("iron", AW0 - 0.4, 0.02, 0.02, AW0 / 2 + 0.1, 1.6, 0.2);
  for (let x = 0.4; x < AW0 - 0.15; x += 0.21, k++) {
    garment([1, 0, 2, 6][k % 4], x, 1.6, 0.2 + hash(k, 2, 9) * 0.06, 0.4, 1.25, pick(k + 160).map((c) => c * 0.85), 0.6 + (hash(k, 3, 9) - 0.5) * 0.4);
  }

  // Dress forms on stands in front of the curtain: printed kurta bodies with folds, pale neck caps, dupattas.
  function form(x, z, rgb, yaw) {
    const prof = [[0.001, 1.66], [0.045, 1.65], [0.05, 1.6], [0.14, 1.54], [0.16, 1.46], [0.15, 1.36], [0.125, 1.22], [0.14, 1.08], [0.17, 0.85], [0.2, 0.6], [0.22, 0.42], [0.001, 0.42]];
    const g = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 14);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const y = p.getY(i);
      const a = Math.atan2(p.getZ(i), p.getX(i));
      const fold = y < 1.1 ? 1 + 0.08 * Math.sin(a * 7 + y * 4) * (1.1 - y) * 1.4 : 1;
      p.setX(i, p.getX(i) * fold * 1.12);
      p.setZ(i, p.getZ(i) * fold * 0.72);
    }
    g.computeVertexNormals();
    g.rotateY(yaw || 0);
    g.translate(x, 0, z);
    add("form", g, rgb.map((c) => Math.pow(c, 2.2)));
    add("cloth", place(new THREE.CylinderGeometry(0.045, 0.05, 0.09, 8), x, 1.7, z), [0.9, 0.86, 0.78]);
    add("iron", place(new THREE.CylinderGeometry(0.015, 0.015, 0.42, 5), x, 0.21, z));
    add("iron", place(new THREE.CylinderGeometry(0.16, 0.18, 0.03, 10), x, 0.015, z));
    garment(7, x + 0.08, 1.58, z - 0.17, 0.2, 0.95, rgb.map((c) => Math.min(1, c * 1.25 + 0.15)), (yaw || 0) + 0.2, -0.06);
  }
  form(2.75, -0.5, [0.86, 0.32, 0.42], 0.1);
  form(3.25, -0.55, [0.8, 0.14, 0.18], -0.1);
  form(3.75, -0.48, [0.66, 0.78, 0.58], 0.15);
  form(0.75, -0.45, [0.84, 0.78, 0.64], 0.4);
  garment(7, 0.82, 1.6, -0.63, 0.18, 1.0, [0.62, 0.08, 0.1], 0.5, -0.05);

  // Low grating bench by the board, a bare bulb with a tin shade under the awning.
  addBox("iron", 1.5, 0.04, 0.42, 1.25, 0.42, -0.75);
  for (let i = 0; i < 9; i++) addBox("iron", 0.02, 0.02, 0.4, 0.55 + i * 0.175, 0.445, -0.75, [0.8, 0.8, 0.8]);
  for (const x of [0.55, 1.95]) for (const z of [-0.92, -0.58]) addBox("iron", 0.04, 0.42, 0.04, x, 0.21, z);
  add("wire", place(new THREE.CylinderGeometry(0.004, 0.004, 0.32, 3), 3.45, 2.6, -0.6));
  add("iron", place(new THREE.ConeGeometry(0.11, 0.08, 10, 1, true), 3.45, 2.42, -0.6), [0.75, 0.75, 0.75]);
  add("bulb", place(new THREE.SphereGeometry(0.045, 8, 6), 3.45, 2.37, -0.6), [1, 0.96, 0.8]);

  // Wire nest across the band: a sagging bundle, slack singles under the roof edge, a coil, two droppers.
  function strand(pts, rad) {
    const curve = new THREE.CatmullRomCurve3(pts);
    add("wire", new THREE.TubeGeometry(curve, 14, rad, 4, false));
  }
  function span(x0, y0, z0, x1, y1, z1, sag, rad) {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push(new THREE.Vector3(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t - sag * 4 * t * (1 - t), z0 + (z1 - z0) * t));
    }
    strand(pts, rad);
  }
  for (let i = 0; i < 18; i++) {
    const y = 3.2 + hash(i, 1, 9) * 0.32;
    const z = -0.06 - hash(i, 2, 9) * 0.16;
    span(-0.3, y + 0.1, z, W + 0.3, y + hash(i, 3, 9) * 0.15, z - 0.05, 0.1 + hash(i, 4, 9) * 0.35, 0.006 + hash(i, 5, 9) * 0.008);
  }
  for (let i = 0; i < 6; i++) {
    span(-0.4, 3.45 + hash(i, 6, 3) * 0.2, -0.6 - i * 0.08, W + 0.4, 3.4 + hash(i, 7, 3) * 0.25, -0.7 - i * 0.07, 0.18 + hash(i, 8, 3) * 0.2, 0.006);
  }
  const coil = [];
  for (let i = 0; i <= 40; i++) {
    const a = i / 40 * Math.PI * 6;
    coil.push(new THREE.Vector3(4.6 + Math.cos(a) * 0.16 + i * 0.004, 3.15 + Math.sin(a) * 0.12, -0.15 - i * 0.002));
  }
  strand(coil, 0.007);
  span(1.6, 3.4, -0.12, 1.75, 2.75, -0.3, 0.04, 0.006);
  span(3.45, 3.3, -0.1, 3.45, 2.76, -0.55, 0.05, 0.005);

  const sign = new THREE.BoxGeometry(2.35, 0.72, 0.04);
  sign.rotateX(-0.12);
  sign.translate(1.25, 3.2, -0.5);
  const signMat = new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.7, metalness: 0 });
  houseShader(signMat, "sign", null);
  loose.push(new THREE.Mesh(sign, signMat));
  addBox("iron", 0.03, 0.03, 0.5, 0.3, 3.4, -0.25);
  addBox("iron", 0.03, 0.03, 0.5, 2.2, 3.4, -0.25);
  for (let i = 0; i < 22; i++) add("bulb", place(new THREE.SphereGeometry(0.012, 4, 3), 0.15 + i * 0.105, 2.82, -0.47), [1, 1, 1]);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "garb" && name !== "valance";
    mesh.receiveShadow = true;
    root.add(mesh);
  }
  for (const obj of loose) {
    obj.castShadow = true;
    obj.receiveShadow = true;
    root.add(obj);
  }

  let tris = 0;
  root.traverse((obj) => {
    if (!obj.isMesh) return;
    const g = obj.geometry;
    tris += g.index ? g.index.count / 3 : g.attributes.position.count / 3;
  });
  root.userData.triangles = Math.round(tris);
  root.userData.id = "028";
  return root;
}
