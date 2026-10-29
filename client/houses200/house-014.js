// House 014. Indra Chowk east edge, OSM way 668405150, edge 1, 7.33 m.
// Spec: research/houses200/014/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. addBox mirrors X so photo-left (east, Vijaya) stays high X
// after place.js yaw-180. Still: pano qoxmdPCGFW6Ymje4tE8Wyw, yaw 210, pitch 4, fov 52.
// No point lights. No words that were not readable on the boards.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.33;
const D = 5.29;
const T = 0.22;
const ROOF = 7.5;
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

function worldUV(g, k) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i));
    const ay = Math.abs(n.getY(i));
    const az = Math.abs(n.getZ(i));
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) * k, p.getY(i) * k);
    else if (ax >= ay) uv.setXY(i, p.getZ(i) * k, p.getY(i) * k);
    else uv.setXY(i, p.getX(i) * k, p.getZ(i) * k);
  }
  return g;
}

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toTex(c) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// One canvas spans the whole face (PLASTER_UV per metre), so stains sit where the
// photo has them: dusty pink lime plaster, damp above the shop boards, soot under
// the cornice, grey streaks below each sill, a vertical seam, patched repairs.
const PLASTER_UV = 1 / 7.6;
function plasterTex() {
  const S = 1024;
  const c = canvas(S, S);
  const g = c.getContext("2d");
  const r = rng(14);
  const px = (ax) => ((W - ax) * PLASTER_UV) * S;
  const py = (y) => (1 - y * PLASTER_UV) * S;
  g.fillStyle = "#e9c6b2";
  g.fillRect(0, 0, S, S);
  function blot(x, y, rad, col) {
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, col);
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 60; i++) blot(r() * S, r() * S, 40 + r() * 140, r() > 0.5 ? "rgba(240,224,210,0.35)" : "rgba(160,128,110,0.16)");
  // Patched repairs, a shade off the old coat.
  for (let i = 0; i < 9; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(214,196,178,0.55)" : "rgba(176,150,132,0.4)";
    g.fillRect(r() * S, py(3.5 + r() * 3.6), 40 + r() * 120, 20 + r() * 70);
  }
  // Damp and grime band over the shop boards.
  let gr = g.createLinearGradient(0, py(4.3), 0, py(3.38));
  gr.addColorStop(0, "rgba(110,92,78,0)");
  gr.addColorStop(1, "rgba(96,80,68,0.38)");
  g.fillStyle = gr;
  g.fillRect(0, py(4.3), S, py(3.38) - py(4.3));
  // Soot under the cornice.
  gr = g.createLinearGradient(0, py(7.1), 0, py(6.4));
  gr.addColorStop(0, "rgba(60,50,44,0.5)");
  gr.addColorStop(1, "rgba(60,50,44,0)");
  g.fillStyle = gr;
  g.fillRect(0, py(7.6), S, py(6.4) - py(7.6));
  // Rain streaks falling from each sill.
  for (const [ax, y, w] of [[1.4, 3.76, 1.2], [5.55, 3.8, 1.08], [1.45, 5.86, 0.86], [5.5, 6.0, 0.78]]) {
    for (let i = 0; i < 26; i++) {
      const x = px(ax + (r() - 0.5) * w);
      const len = 30 + r() * 150;
      gr = g.createLinearGradient(0, py(y), 0, py(y) + len);
      gr.addColorStop(0, "rgba(84,78,70,0.32)");
      gr.addColorStop(1, "rgba(84,78,70,0)");
      g.fillStyle = gr;
      g.fillRect(x, py(y), 2 + r() * 5, len);
    }
  }
  // Seam between the two pours, and hairline cracks.
  g.strokeStyle = "rgba(90,72,60,0.45)";
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(px(3.62), py(6.9));
  g.lineTo(px(3.6), py(3.45));
  g.stroke();
  g.lineWidth = 1.2;
  for (let i = 0; i < 14; i++) {
    let x = r() * S;
    let y = py(3.5 + r() * 3.6);
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 0; k < 6; k++) {
      x += (r() - 0.5) * 30;
      y += (r() - 0.3) * 22;
      g.lineTo(x, y);
    }
    g.stroke();
  }
  // Fine grit.
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(245,232,220,0.18)" : "rgba(80,60,50,0.16)";
    g.fillRect(r() * S, r() * S, 1.5, 1.5);
  }
  return toTex(c);
}

// Dim room seen through the upper glazing.
function roomTex() {
  const c = canvas(128, 128);
  const g = c.getContext("2d");
  const gr = g.createLinearGradient(0, 0, 0, 128);
  gr.addColorStop(0, "#2a2420");
  gr.addColorStop(0.6, "#4a3e36");
  gr.addColorStop(1, "#2e2622");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(200,190,170,0.18)";
  g.fillRect(70, 20, 40, 70);
  return toTex(c);
}

// Deep shop: warm dim back, stacked cloth bolts, hanging garments.
function shopTex() {
  const c = canvas(512, 320);
  const g = c.getContext("2d");
  const r = rng(31);
  const gr = g.createLinearGradient(0, 0, 0, 320);
  gr.addColorStop(0, "#3a302a");
  gr.addColorStop(0.5, "#5a4a3e");
  gr.addColorStop(1, "#2a221e");
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 320);
  const cols = ["#7a2a34", "#2e3a5a", "#8a6a5a", "#c8b8a8", "#4a5a4a", "#9a3a4a", "#d6c8b4", "#5a4a6a"];
  for (let x = 20; x < 500; x += 14 + r() * 18) {
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    const top = 30 + r() * 30;
    g.fillRect(x, top, 10 + r() * 10, 120 + r() * 90);
  }
  g.fillStyle = "rgba(255,240,210,0.22)";
  g.fillRect(180, 0, 160, 18);
  g.fillStyle = "rgba(0,0,0,0.35)";
  g.fillRect(0, 250, 512, 70);
  return toTex(c);
}

// Folded cloth stacks on the left counter, pink and blue as in the still.
function stackTex() {
  const c = canvas(128, 256);
  const g = c.getContext("2d");
  const r = rng(41);
  const cols = ["#e8c8cc", "#c8d8e8", "#f0e4dc", "#d8a8b4", "#b8c8d8", "#e8e0d0"];
  for (let y = 0; y < 256; y += 10) {
    g.fillStyle = cols[Math.floor(r() * cols.length)];
    g.fillRect(0, y, 128, 9);
    g.fillStyle = "rgba(0,0,0,0.18)";
    g.fillRect(0, y + 9, 128, 1);
  }
  return toTex(c);
}

function stoneTex() {
  const c = canvas(512, 512);
  const g = c.getContext("2d");
  const r = rng(14);
  g.fillStyle = "#b09488";
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 14000; i++) {
    const v = r();
    g.fillStyle = v > 0.7 ? "rgba(236,222,210,0.55)" : v > 0.38 ? "rgba(70,52,46,0.45)" : "rgba(150,110,96,0.4)";
    g.fillRect(r() * 512, r() * 512, 1 + r() * 2.4, 1 + r() * 2.4);
  }
  // Hand grime at shoulder height and splash at the foot.
  let gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, "rgba(60,46,40,0)");
  gr.addColorStop(0.8, "rgba(60,46,40,0.1)");
  gr.addColorStop(1, "rgba(50,40,34,0.4)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 512, 512);
  return toTex(c);
}

function vijayaTex() {
  const c = canvas(1024, 300);
  const g = c.getContext("2d");
  g.fillStyle = "#f1ebe0";
  g.fillRect(0, 0, 1024, 300);
  // Purple band, slanting off at the top right, and the purple foot strip.
  g.fillStyle = "#3b2f7e";
  g.beginPath();
  g.moveTo(0, 0); g.lineTo(560, 0); g.lineTo(460, 46); g.lineTo(0, 46);
  g.fill();
  g.fillRect(0, 248, 1024, 52);
  // Man in a cream suit on the purple at the left edge.
  g.fillStyle = "#d8c8a8";
  g.fillRect(14, 70, 70, 150);
  g.beginPath(); g.arc(49, 56, 20, 0, Math.PI * 2); g.fill();
  g.textAlign = "left";
  g.fillStyle = "#c4272a";
  g.font = "700 108px 'Nirmala UI', sans-serif";
  g.fillText("विजया इम्पेक्स", 110, 172);
  g.fillStyle = "#1c1a17";
  g.font = "600 34px 'Nirmala UI', sans-serif";
  g.fillText("इन्द्रचोक काठमाडौं", 390, 228);
  g.fillStyle = "#2b2560";
  g.font = "600 32px 'Nirmala UI', sans-serif";
  g.fillText("रामेश्वर न्यौपाने", 780, 36);
  g.fillText("९८४९३०३२९०", 790, 72);
  // Dark suit with tie, right end.
  g.fillStyle = "#3a2e2c";
  g.beginPath();
  g.moveTo(860, 90); g.lineTo(960, 90); g.lineTo(975, 240); g.lineTo(845, 240);
  g.fill();
  g.fillStyle = "#e8e2d8";
  g.beginPath(); g.moveTo(895, 90); g.lineTo(925, 90); g.lineTo(910, 150); g.fill();
  g.fillStyle = "#2a1e1c";
  g.fillRect(906, 96, 8, 60);
  g.fillStyle = "#f4f0ea";
  g.font = "600 25px 'Nirmala UI', sans-serif";
  g.fillText("होलसेल मूल्यमा कोट, पाइन्ट, सर्ट, दौरा सुरुवाको कपडा पाइनुका साथै सिलाईको व्यवस्था पनि छ ।", 16, 283);
  // Sun fade and grime.
  const r = rng(5);
  const gr = g.createLinearGradient(0, 0, 0, 300);
  gr.addColorStop(0, "rgba(255,250,240,0.12)");
  gr.addColorStop(1, "rgba(60,48,36,0.2)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 300);
  g.fillStyle = "rgba(40,30,20,0.12)";
  for (let i = 0; i < 60; i++) g.fillRect(r() * 1024, r() * 300, 4 + r() * 10, 2);
  return toTex(c);
}

function redSignTex() {
  const c = canvas(1024, 280);
  const g = c.getContext("2d");
  const r = rng(22);
  g.fillStyle = "#c4252e";
  g.fillRect(0, 0, 1024, 280);
  for (let i = 0; i < 220; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(255,245,240,0.35)" : "rgba(90,20,24,0.28)";
    g.beginPath();
    g.arc(r() * 1024, r() * 280, 1 + r() * 3, 0, Math.PI * 2);
    g.fill();
  }
  // Raised letters: a soft dark drop under each word.
  g.textAlign = "left";
  g.shadowColor = "rgba(40,6,8,0.75)";
  g.shadowOffsetX = 5;
  g.shadowOffsetY = 7;
  g.shadowBlur = 6;
  g.fillStyle = "#c9a04e";
  g.font = "700 italic 130px 'Nirmala UI', serif";
  g.fillText("श्री", 36, 184);
  g.fillStyle = "#efe6da";
  g.font = "700 92px 'Nirmala UI', sans-serif";
  g.fillText("सुनचाँदी व्यवसायी", 230, 178);
  g.shadowColor = "transparent";
  const gr = g.createLinearGradient(0, 0, 0, 280);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(50,10,12,0.25)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 1024, 280);
  return toTex(c);
}

function caseTex() {
  const c = canvas(512, 640);
  const g = c.getContext("2d");
  const r = rng(8);
  g.fillStyle = "#d8d2ca";
  g.fillRect(0, 0, 512, 640);
  g.fillStyle = "#9a948c";
  g.fillRect(0, 205, 512, 10);
  g.fillRect(0, 420, 512, 10);
  // Top shelf: big hammered silver plates, standing.
  for (const [x, y, rad] of [[120, 110, 80], [300, 105, 88], [450, 120, 60]]) {
    const gr = g.createRadialGradient(x - 20, y - 25, 5, x, y, rad);
    gr.addColorStop(0, "#fbfaf6");
    gr.addColorStop(0.7, "#cfcac2");
    gr.addColorStop(1, "#8e8880");
    g.fillStyle = gr;
    g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill();
  }
  // Middle shelf: pale silver figures and bowls.
  for (let i = 0; i < 6; i++) {
    const x = 40 + i * 80;
    g.fillStyle = r() > 0.5 ? "#f2eee8" : "#dcd6ce";
    g.beginPath(); g.ellipse(x + 20, 360, 30, 50, 0, Math.PI, 0); g.fill();
    g.fillRect(x - 6, 360, 52, 50);
  }
  // Bottom shelf: red velvet busts with gold necklaces, small white price card.
  for (let i = 0; i < 4; i++) {
    const x = 60 + i * 115;
    g.fillStyle = "#8a1c26";
    g.beginPath(); g.arc(x, 470, 20, 0, Math.PI * 2); g.fill();
    g.fillRect(x - 35, 490, 70, 110);
    g.strokeStyle = "#e0b850";
    g.lineWidth = 6;
    g.beginPath(); g.arc(x, 500, 28, 0.2, Math.PI - 0.2); g.stroke();
    g.fillStyle = "#e8c860";
    g.beginPath(); g.arc(x, 535, 8, 0, Math.PI * 2); g.fill();
  }
  g.fillStyle = "#f6f4f0";
  g.fillRect(360, 590, 120, 34);
  return toTex(c);
}

// Woven check, like the hung jacket and suit lengths in the still.
function clothTex(seed, a, b) {
  const c = canvas(128, 256);
  const g = c.getContext("2d");
  const r = rng(seed);
  g.fillStyle = a;
  g.fillRect(0, 0, 128, 256);
  g.globalAlpha = 0.35;
  g.fillStyle = b;
  for (let y = 0; y < 256; y += 12) g.fillRect(0, y, 128, 2);
  for (let x = 0; x < 128; x += 12) g.fillRect(x, 0, 2, 256);
  g.globalAlpha = 1;
  for (let i = 0; i < 2500; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)";
    g.fillRect(r() * 128, r() * 256, 1, 1);
  }
  // Fold shading.
  const gr = g.createLinearGradient(0, 0, 128, 0);
  gr.addColorStop(0, "rgba(0,0,0,0.3)");
  gr.addColorStop(0.5, "rgba(0,0,0,0)");
  gr.addColorStop(1, "rgba(0,0,0,0.3)");
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 256);
  return toTex(c);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.4, p.y);
  ao *= 1.0 - 0.12 * smoothstep(0.22, 0.0, p.z);
  ao *= 1.0 - 0.28 * smoothstep(0.35, 0.0, abs(p.y - 3.35));
  ao *= 1.0 - 0.22 * smoothstep(0.4, 0.0, abs(p.y - 7.2));
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
  mat.customProgramCacheKey = function () { return "house014-" + key; };
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
    aoMapIntensity: o.ao == null ? 0.32 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.16 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.4 : o.ns, o.ns == null ? 0.4 : o.ns);
  return m;
}

export function createHouse014() {
  const root = new THREE.Group();
  root.name = "house-014";

  const plasterMaps = {
    diff: tex("concrete_wall_001_Diffuse.jpg", true, 1.2, 1.8),
    nor: tex("concrete_wall_001_nor_gl.jpg", false, 1.2, 1.8),
    arm: tex("concrete_wall_001_arm.jpg", false, 1.2, 1.8),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 0.5, 0.35),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 0.5, 0.35),
    arm: tex("weathered_brown_planks_arm.jpg", false, 0.5, 0.35),
  };
  const pMap = plasterTex();
  pMap.wrapS = pMap.wrapT = THREE.RepeatWrapping;
  // Same concrete relief as plasterMaps, tiled about every 1.5 m on the face UVs.
  const pNor = tex("concrete_wall_001_nor_gl.jpg", false, 5, 5);
  const mats = {
    plaster: new THREE.MeshStandardMaterial({ map: pMap, normalMap: pNor, normalScale: new THREE.Vector2(0.55, 0.55), color: 0xffffff, roughness: 0.95, metalness: 0, vertexColors: true }),
    plasterDark: new THREE.MeshStandardMaterial({ map: pMap, normalMap: pNor, normalScale: new THREE.Vector2(0.55, 0.55), color: 0xcabcb0, roughness: 0.95, metalness: 0, vertexColors: true }),
    stone: new THREE.MeshStandardMaterial({ map: stoneTex(), color: 0xffffff, roughness: 0.92, metalness: 0, vertexColors: true }),
    wood: pbr(woodMaps, 0xc4b09a, { ao: 0.26, rough: 0.84 }),
    woodDark: pbr(woodMaps, 0x4a3d34, { ao: 0.28 }),
    red: new THREE.MeshStandardMaterial({ color: 0xc4252e, roughness: 0.72, metalness: 0, vertexColors: true }),
    green: pbr(woodMaps, 0x9ccfa6, { ao: 0.2, rough: 0.78, ns: 0.25 }),
    greenDark: pbr(woodMaps, 0x6aa07c, { ao: 0.2, rough: 0.8, ns: 0.25 }),
    glass: new THREE.MeshStandardMaterial({ color: 0xb8c4c4, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.42, envMapIntensity: 0.6, vertexColors: true }),
    room: new THREE.MeshStandardMaterial({ map: roomTex(), roughness: 0.95, metalness: 0, vertexColors: true }),
    shop: new THREE.MeshStandardMaterial({ map: shopTex(), roughness: 0.95, metalness: 0, vertexColors: true }),
    stack: new THREE.MeshStandardMaterial({ map: stackTex(), roughness: 0.92, metalness: 0, vertexColors: true }),
    navy: new THREE.MeshStandardMaterial({ color: 0x2c2c58, roughness: 0.6, metalness: 0.2, vertexColors: true }),
    iron: new THREE.MeshStandardMaterial({ color: 0x6a4a36, roughness: 0.8, metalness: 0.3, vertexColors: true }),
    grille: new THREE.MeshStandardMaterial({ color: 0x8e8a84, roughness: 0.6, metalness: 0.4, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x161310, roughness: 0.95, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.6, metalness: 0.05, vertexColors: true }),
    silver: new THREE.MeshStandardMaterial({ color: 0xd9d6d0, roughness: 0.32, metalness: 0.55, vertexColors: true }),
    gold: new THREE.MeshStandardMaterial({ color: 0xe6c56a, roughness: 0.4, metalness: 0.35, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.4, metalness: 0, vertexColors: true }),
    signV: new THREE.MeshStandardMaterial({ map: vijayaTex(), roughness: 0.78, metalness: 0, vertexColors: true }),
    signR: new THREE.MeshStandardMaterial({ map: redSignTex(), roughness: 0.62, metalness: 0, vertexColors: true }),
    case: new THREE.MeshStandardMaterial({ map: caseTex(), roughness: 0.8, metalness: 0, vertexColors: true }),
    clothA: new THREE.MeshStandardMaterial({ map: clothTex(3, "#7a6a5c", "#3a302a"), roughness: 0.9, metalness: 0, vertexColors: true }),
    clothB: new THREE.MeshStandardMaterial({ map: clothTex(9, "#b8a088", "#5a4a3c"), roughness: 0.9, metalness: 0, vertexColors: true }),
    jacket: new THREE.MeshStandardMaterial({ map: clothTex(11, "#6a5654", "#c0a8a0"), roughness: 0.86, metalness: 0, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) houseShader(mat, name);

  const buckets = {};
  function add(name, g, tint) {
    const rgb = tint || [1, 1, 1];
    const p = g.attributes.position;
    const c = new Float32Array(p.count * 3);
    for (let i = 0; i < p.count; i++) {
      // Faint per-vertex wear; stronger values band the many thin wall cells.
      const k = 0.97 + 0.03 * hash(p.getX(i), p.getY(i), p.getZ(i));
      c[i * 3] = rgb[0] * k;
      c[i * 3 + 1] = rgb[1] * k;
      c[i * 3 + 2] = rgb[2] * k;
    }
    g.setAttribute("color", new THREE.BufferAttribute(c, 3));
    if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
    if (!g.index) {
      const n = g.attributes.position.count;
      const idx = n > 65535 ? new Uint32Array(n) : new Uint16Array(n);
      for (let i = 0; i < n; i++) idx[i] = i;
      g.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), W - x, y, z);
    if (name === "plaster" || name === "plasterDark") worldUV(g, PLASTER_UV);
    else if (name === "stone") worldUV(g, 0.4);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }
  function wallX(name, z0, z1, y0, y1, xFace, holes, tint) {
    const parts = cells(z0, z1, y0, y1, holes || []);
    for (const part of parts) addBox(name, T, part.h, part.w, xFace, part.y, part.x, tint);
  }
  function plane(name, w, h, x, y, z) {
    const g = place(new THREE.PlaneGeometry(w, h), W - x, y, z, 0, Math.PI, 0);
    add(name, g);
  }

  const shopHoles = [
    { x: 2.05, y: 1.28, w: 3.55, h: 2.4 },
    { x: 5.42, y: 1.35, w: 1.5, h: 2.15 },
    { x: 6.62, y: 1.22, w: 0.82, h: 2.36 },
  ];
  const winHoles = [
    { x: 1.4, y: 4.62, w: 1.2, h: 1.72 },
    { x: 5.55, y: 4.55, w: 1.08, h: 1.5 },
    { x: 1.45, y: 6.42, w: 0.86, h: 1.12 },
    { x: 5.5, y: 6.48, w: 0.78, h: 0.96 },
  ];
  wallZ("stone", 0, W, 0, 3.38, 0, shopHoles);
  wallZ("plaster", 0, W, 3.38, ROOF, 0, winHoles);
  wallX("stone", 0, D, 0, 3.38, T / 2, []);
  wallX("plaster", 0, D, 3.38, ROOF, T / 2, [
    { x: 2.4, y: 4.6, w: 0.9, h: 1.4 },
    { x: 2.5, y: 6.4, w: 0.7, h: 0.95 },
  ]);
  wallX("plaster", 0, D, 0, ROOF, W - T / 2, []);
  wallZ("plaster", 0, W, 0, ROOF, D - T, []);
  addBox("plasterDark", W, 0.16, D, W / 2, ROOF + 0.08, D / 2);
  addBox("plaster", W + 0.16, 0.28, 0.34, W / 2, 7.28, -0.04);
  addBox("plasterDark", 0.42, 0.4, 0.42, 3.2, ROOF + 0.12, 4.5, [0.7, 0.68, 0.64]);

  plane("signV", 3.7, 0.92, 2.05, 2.92, -0.04);
  addBox("woodDark", 3.85, 0.08, 0.1, 2.05, 2.5, -0.02);
  plane("signR", 2.7, 0.72, 5.85, 2.95, -0.08);
  addBox("red", 2.78, 0.08, 0.12, 5.85, 2.62, -0.05);
  addBox("red", 2.78, 0.06, 0.12, 5.85, 3.28, -0.05);

  function frame(x, y, w, h, z, mat) {
    const t = 0.06;
    addBox(mat, w, t, 0.05, x, y + h / 2 - t / 2, z);
    addBox(mat, w, t, 0.05, x, y - h / 2 + t / 2, z);
    addBox(mat, t, h, 0.05, x - w / 2 + t / 2, y, z);
    addBox(mat, t, h, 0.05, x + w / 2 - t / 2, y, z);
  }
  frame(5.42, 1.35, 1.5, 2.15, -0.03, "navy");
  frame(6.62, 1.22, 0.82, 2.36, -0.03, "woodDark");
  addBox("glass", 1.32, 1.95, 0.02, 5.42, 1.4, -0.045);
  plane("case", 1.2, 1.85, 5.42, 1.4, 0.16);
  addBox("dark", 0.7, 2.2, 0.08, 6.62, 1.15, 0.9);
  addBox("wood", 0.7, 0.08, 0.42, 6.62, 0.95, 0.45, [0.45, 0.28, 0.22]);
  addBox("woodDark", 0.42, 0.4, 0.42, 6.7, 0.45, 0.35);

  const shelves = [2.15, 1.45, 0.75];
  for (const y of shelves) addBox("wood", 1.25, 0.03, 0.28, 5.42, y, 0.2, [0.75, 0.72, 0.68]);
  for (let i = 0; i < 3; i++) {
    const g = place(new THREE.CylinderGeometry(0.11, 0.11, 0.02, 10), W - (5.05 + i * 0.28), 2.2, 0.18, Math.PI / 2, 0, 0);
    add("silver", g);
  }
  for (let i = 0; i < 4; i++) addBox("red", 0.12, 0.16, 0.08, 4.9 + i * 0.28, 0.85, 0.2);
  for (let i = 0; i < 4; i++) addBox("gold", 0.04, 0.04, 0.02, 4.9 + i * 0.28, 0.95, 0.16);

  // Deep shop instead of a flat black panel: back wall of hung stock 3.2 m in,
  // dark side walls and ceiling, a cloth counter on the left, a fan-lit ceiling strip.
  plane("shop", 3.5, 2.4, 2.05, 1.22, 3.2);
  addBox("dark", 3.5, 0.06, 3.2, 2.05, 2.46, 1.6, [1.6, 1.4, 1.2]);
  addBox("woodDark", 0.06, 2.4, 3.2, 0.3, 1.2, 1.6, [0.5, 0.42, 0.36]);
  addBox("woodDark", 0.06, 2.4, 3.2, 3.8, 1.2, 1.6, [0.5, 0.42, 0.36]);
  addBox("wood", 3.5, 0.04, 3.2, 2.05, 0.02, 1.6, [0.5, 0.42, 0.36]);
  addBox("stack", 0.5, 1.1, 0.6, 0.6, 0.55, 0.5);
  addBox("stack", 0.5, 0.8, 0.6, 0.6, 0.4, 1.3);
  for (let i = 0; i < 5; i++) addBox(i % 2 ? "clothA" : "jacket", 0.34, 0.95, 0.12, 1.4 + i * 0.42, 1.45, 1.8 + (i % 3) * 0.3);
  // Grey scalloped grille awning over the Vijaya board.
  addBox("grille", 3.9, 0.05, 0.36, 2.05, 3.42, -0.2);
  addBox("grille", 3.9, 0.12, 0.03, 2.05, 3.36, -0.38);
  for (let i = 0; i < 16; i++) addBox("grille", 0.03, 0.1, 0.32, 0.25 + i * 0.24, 3.34, -0.2);

  addBox("woodDark", 3.5, 0.1, 0.16, 2.05, 2.42, -0.02);
  const bulb = place(new THREE.SphereGeometry(0.07, 8, 6), W - 2.4, 2.22, 0.35);
  add("bulb", bulb);
  addBox("wire", 0.008, 0.28, 0.008, 2.4, 2.4, 0.35);
  addBox("jacket", 0.55, 0.7, 0.08, 3.55, 1.55, 0.12);
  addBox("clothA", 0.32, 0.85, 0.04, 3.15, 1.15, 0.08);
  addBox("clothB", 0.28, 0.7, 0.04, 3.42, 0.95, 0.1);

  function casement(x, y, w, h, open) {
    frame(x, y, w, h, -0.02, "green");
    const cols = 3;
    const rows = 2;
    const pw = (w - 0.12) / cols;
    const ph = (h - 0.12) / rows;
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        const px = x - w / 2 + 0.08 + pw * (c + 0.5);
        const py = y - h / 2 + 0.08 + ph * (r + 0.5);
        if (!open) {
          addBox("glass", pw - 0.04, ph - 0.04, 0.015, px, py, -0.03);
          addBox("greenDark", pw, 0.025, 0.03, px, py, -0.02);
        }
      }
    }
    // Plaster reveals give the opening its wall depth; a dim room sits behind.
    addBox("plasterDark", 0.04, h, T, x - w / 2 - 0.02, y, T / 2, [0.7, 0.66, 0.62]);
    addBox("plasterDark", 0.04, h, T, x + w / 2 + 0.02, y, T / 2, [0.7, 0.66, 0.62]);
    addBox("plasterDark", w, 0.04, T, x, y + h / 2 + 0.02, T / 2, [0.6, 0.56, 0.52]);
    addBox("plasterDark", w + 0.2, 0.05, 0.16, x, y - h / 2 - 0.02, -0.04, [0.86, 0.82, 0.78]);
    plane("room", w, h, x, y, 0.9);
    if (open) {
      const leaf = place(boxGeo(0.045, h - 0.1, w * 0.42), W - (x + w * 0.46), y, -0.16, 0, 0.15, 0);
      add("green", leaf);
    }
    addBox("plasterDark", w + 0.12, 0.08, 0.1, x, y + h / 2 + 0.02, -0.03);
  }
  casement(1.4, 4.62, 1.2, 1.72, false);
  casement(5.55, 4.55, 1.08, 1.5, true);
  casement(1.45, 6.42, 0.86, 1.12, false);
  casement(5.5, 6.48, 0.78, 0.96, false);
  // East return, the face the pano also sees. Authoring x is just outside photo-left.
  addBox("green", 0.05, 1.4, 0.05, -0.02, 4.6, 2.4);
  addBox("green", 0.05, 0.05, 0.9, -0.02, 5.28, 2.4);
  addBox("green", 0.05, 0.05, 0.9, -0.02, 3.92, 2.4);
  addBox("glass", 0.02, 1.2, 0.75, -0.01, 4.6, 2.4);
  // A blank board between the window rows. No letters: none were readable.
  const board = place(boxGeo(0.34, 0.48, 0.03), W - 3.35, 5.55, -0.2, 0, 0.4, 0.15);
  add("plasterDark", board, [0.55, 0.52, 0.48]);
  addBox("dark", 0.08, 0.08, 0.04, 3.7, 5.15, -0.02);
  addBox("iron", 0.035, 2.4, 0.035, 4.35, 4.6, -0.04);
  addBox("iron", 0.03, 1.6, 0.03, 6.3, 4.3, -0.04);

  function wire(x0, x1, y, droop) {
    const a = W - x0;
    const b = W - x1;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const t = i / 8;
      pts.push(new THREE.Vector3(
        a + (b - a) * t,
        y - Math.sin(Math.PI * t) * droop,
        -0.22 - Math.sin(Math.PI * t) * 0.08,
      ));
    }
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, 0.012, 5, false);
    add("wire", g, [0.16, 0.15, 0.13]);
  }
  wire(0.1, 7.1, 3.55, 0.28);
  wire(0.2, 6.6, 3.7, 0.16);
  wire(0.4, 7.0, 5.15, 0.34);
  wire(1.2, 6.4, 6.9, 0.2);
  wire(0.3, 5.8, 4.2, 0.12);
  // The tangled bundle that runs just over the shop boards in the still.
  const wr = rng(77);
  for (let i = 0; i < 18; i++) wire(0.03 + wr() * 0.3, W - 0.03 - wr() * 0.3, 3.62 + wr() * 0.22, 0.08 + wr() * 0.22);

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
  root.userData.id = "014";
  return root;
}
