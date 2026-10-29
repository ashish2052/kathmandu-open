// House 018. Kel Tole garment house, Yogbir Singh Marg, OSM way 1416892723, edge 1, 7.93 m.
// Spec: research/houses200/018/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Seen from the pano (yaw 355, pitch -22, c8KcwYnOY5VbMK7m9-k_ZA), x = 7.93 is photo-left and x = 0 is photo-right.
// Beige plaster over brick, railed door balconies, a strutted timber gallery under a CGI eave, kurtas and
// mannequins out front, a cable bundle. No sign. No brick niche.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 7.93;
const D = 4.48;
const T = 0.22;
const ROOF = 8.55;

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

function makeGrime(holes) {
  const S = 1024;
  const c = canvas(S, S);
  const g = c.getContext("2d");
  const px = (x) => (x / W) * S;
  const py = (y) => (1 - y / ROOF) * S;
  g.fillStyle = "rgb(176,168,156)";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 420; i++) {
    const r = 8 + hash(i, 1, 7) * 90;
    g.fillStyle = (hash(i, 2, 7) < 0.6 ? "rgba(96,88,78," : "rgba(214,206,194,") + (0.1 + hash(i, 3, 7) * 0.26).toFixed(3) + ")";
    g.beginPath();
    g.ellipse(hash(i, 4, 7) * S, hash(i, 5, 7) * S, r, r * 0.7, 0, 0, Math.PI * 2);
    g.fill();
  }
  // Brick courses read through the thin plaster, strongest in worn patches.
  for (let row = 0; row * 0.075 < ROOF; row++) {
    const y = py(row * 0.075);
    g.fillStyle = "rgba(86,72,60,0.5)";
    g.fillRect(0, y, S, 1.2);
    for (let x = (row % 2) * 13; x < S; x += 27) {
      const a = hash(Math.floor(x / 90), Math.floor(row / 6), 13) > 0.5 ? 0.55 : 0.2;
      g.fillStyle = "rgba(96,78,62," + a + ")";
      g.fillRect(x, y - 8, 1.2, 8);
    }
  }
  for (const [y, a] of [[8.2, 0.4], [6.05, 0.34], [5.45, 0.22], [2.7, 0.36]]) {
    const grd = g.createLinearGradient(0, py(y), 0, py(y) + 28);
    grd.addColorStop(0, "rgba(52,42,34," + a + ")");
    grd.addColorStop(1, "rgba(52,42,34,0)");
    g.fillStyle = grd;
    g.fillRect(0, py(y), S, 30);
    for (let i = 0; i < 36; i++) {
      const x = hash(i, y, 3) * S;
      const len = 12 + hash(i, y, 4) * 64;
      const lg = g.createLinearGradient(0, py(y), 0, py(y) + len);
      lg.addColorStop(0, "rgba(58,48,40," + (a * 0.75).toFixed(3) + ")");
      lg.addColorStop(1, "rgba(58,48,40,0)");
      g.fillStyle = lg;
      g.fillRect(x, py(y), 1.4 + hash(i, y, 5) * 2.5, len);
    }
  }
  for (let n = 0; n < holes.length; n++) {
    const h = holes[n];
    const top = py(h.y - h.h / 2);
    for (let i = 0; i < 6; i++) {
      const x = px(h.x - h.w / 2 + hash(n, i, 9) * h.w);
      const len = 24 + hash(n, i, 10) * 90;
      const lg = g.createLinearGradient(0, top, 0, top + len);
      lg.addColorStop(0, "rgba(70,58,48,0.4)");
      lg.addColorStop(1, "rgba(70,58,48,0)");
      g.fillStyle = lg;
      g.fillRect(x, top, 1.4 + hash(n, i, 11) * 3, len);
    }
  }
  g.beginPath();
  g.moveTo(0, S);
  for (let x = 0; x <= S; x += 8) g.lineTo(x, py(0.7 + 0.28 * hash(x, 1, 12)));
  g.lineTo(S, S);
  g.closePath();
  const dg = g.createLinearGradient(0, py(1.2), 0, S);
  dg.addColorStop(0, "rgba(90,74,60,0.28)");
  dg.addColorStop(1, "rgba(62,48,38,0.82)");
  g.fillStyle = dg;
  g.fill();
  return toTex(c, false);
}

function tinTex() {
  const c = canvas(256, 64);
  const g = c.getContext("2d");
  for (let y = 0; y < 64; y++) {
    const k = 0.72 + 0.28 * Math.abs(Math.sin(y * 0.55));
    const r = Math.floor(138 * k);
    const gv = Math.floor(132 * k);
    const b = Math.floor(124 * k);
    g.fillStyle = "rgb(" + r + "," + gv + "," + b + ")";
    g.fillRect(0, y, 256, 1);
  }
  g.strokeStyle = "rgba(70,64,58,0.45)";
  for (let x = 0; x < 256; x += 48) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + 6, 64);
    g.stroke();
  }
  const t = toTex(c, true);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(4, 1);
  return t;
}

function clothTex() {
  const c = canvas(128, 256);
  const g = c.getContext("2d");
  g.fillStyle = "#fff";
  g.fillRect(0, 0, 128, 256);
  // Soft vertical folds, then small printed motifs and an embroidered hem band.
  for (let x = 0; x < 128; x++) {
    const k = 0.78 + 0.22 * Math.sin(x * 0.19 + Math.sin(x * 0.05) * 2);
    g.fillStyle = "rgba(0,0,0," + (1 - k).toFixed(3) + ")";
    g.fillRect(x, 0, 1, 256);
  }
  for (let i = 0; i < 140; i++) {
    const r = 1.5 + hash(i, 1, 71) * 3;
    g.fillStyle = hash(i, 2, 71) < 0.55 ? "rgba(255,255,255,0.42)" : "rgba(30,20,20,0.3)";
    g.beginPath();
    g.arc(hash(i, 3, 71) * 128, hash(i, 4, 71) * 256, r, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = "rgba(255,245,230,0.5)";
  for (let x = 4; x < 128; x += 10) g.fillRect(x, 222, 5, 14);
  g.fillRect(0, 238, 128, 3);
  return toTex(c, true);
}

// Four kurta cut-outs side by side: floral, yoke embroidery, dense dots, plain. White so vertex colour tints it.
function kurtaTex() {
  const c = canvas(512, 256);
  const g = c.getContext("2d");
  for (let k = 0; k < 4; k++) {
    const o = k * 128;
    g.save();
    g.beginPath();
    g.moveTo(o + 50, 4);
    g.lineTo(o + 26, 12);
    g.lineTo(o + 4, 40);
    g.lineTo(o + 10, 104);
    g.lineTo(o + 26, 102);
    g.lineTo(o + 28, 56);
    g.lineTo(o + 22, 252);
    g.lineTo(o + 106, 252);
    g.lineTo(o + 100, 56);
    g.lineTo(o + 102, 102);
    g.lineTo(o + 118, 104);
    g.lineTo(o + 124, 40);
    g.lineTo(o + 102, 12);
    g.lineTo(o + 78, 4);
    g.quadraticCurveTo(o + 64, 22, o + 50, 4);
    g.closePath();
    g.clip();
    g.fillStyle = "#fff";
    g.fillRect(o, 0, 128, 256);
    for (let x = 0; x < 128; x++) {
      const f = 0.8 + 0.2 * Math.sin(x * 0.23 + k + Math.sin(x * 0.07) * 2);
      g.fillStyle = "rgba(0,0,0," + (1 - f).toFixed(3) + ")";
      g.fillRect(o + x, 40, 1, 216);
    }
    // Sleeve seams and the shade under the arms.
    g.fillStyle = "rgba(0,0,0,0.28)";
    g.fillRect(o + 26, 56, 4, 50);
    g.fillRect(o + 98, 56, 4, 50);
    if (k === 0) {
      for (let i = 0; i < 70; i++) {
        const x = o + 10 + hash(i, k, 81) * 108;
        const y = 20 + hash(i, 2, 81) * 230;
        g.fillStyle = hash(i, 3, 81) < 0.5 ? "rgba(255,250,240,0.55)" : "rgba(20,10,10,0.35)";
        for (let a = 0; a < 5; a++) {
          g.beginPath();
          g.arc(x + Math.cos(a * 1.26) * 3, y + Math.sin(a * 1.26) * 3, 2.2, 0, Math.PI * 2);
          g.fill();
        }
      }
    } else if (k === 1) {
      g.fillStyle = "rgba(255,248,236,0.7)";
      for (let i = 0; i < 26; i++) g.fillRect(o + 44 + hash(i, 1, 82) * 40, 14 + i * 2.6, 2 + hash(i, 2, 82) * 4, 2);
      g.fillRect(o + 62, 20, 4, 120);
      for (let x = o + 24; x < o + 106; x += 7) g.fillRect(x, 226 + (x % 3) * 2, 4, 10);
      g.fillRect(o + 22, 240, 84, 3);
    } else if (k === 2) {
      for (let y = 18; y < 256; y += 7) {
        for (let x = o + 6 + (y % 14 ? 3 : 0); x < o + 124; x += 7) {
          g.fillStyle = "rgba(255,255,255,0.4)";
          g.fillRect(x, y, 2, 2);
        }
      }
    }
    // Neck opening reads dark, the back of the garment seen through it.
    g.fillStyle = "rgba(30,20,18,0.75)";
    g.beginPath();
    g.ellipse(o + 64, 6, 13, 12, 0, 0, Math.PI);
    g.fill();
    g.restore();
  }
  return toTex(c, true);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 0.74 + 0.26 * smoothstep(0.0, 0.8, p.y);
  if (p.z < 0.5) {
    ao *= 1.0 - 0.38 * smoothstep(0.55, 0.0, 2.7 - p.y);
    ao *= 1.0 - 0.22 * smoothstep(0.4, 0.0, 6.2 - p.y);
  }
  if (p.z > 0.05 && p.y < 2.55 && p.x > 0.3 && p.x < 7.65) {
    ao *= mix(1.0, 0.34, smoothstep(0.04, 0.85, p.z));
    ao *= 0.62 + 0.38 * smoothstep(2.5, 1.2, p.y);
  }
  return ao;
}
`;

const GRIME_GLSL = `
float gax = abs(vHouseN.x);
float gay = abs(vHouseN.y);
float gaz = abs(vHouseN.z);
float gu = (gax > gaz && gax > gay) ? clamp(vHousePos.z / 4.5, 0.0, 1.0) : clamp(vHousePos.x / 7.93, 0.0, 1.0);
float gv = clamp(vHousePos.y / 8.55, 0.0, 1.0);
diffuseColor.rgb *= texture2D(grimeMap, vec2(gu, gv)).rgb * 1.35;
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
  mat.customProgramCacheKey = function () { return "house018-" + key; };
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
    envMapIntensity: o.env == null ? 0.2 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.5 : o.ns, o.ns == null ? 0.5 : o.ns);
  return m;
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
    const k = 0.94 + 0.06 * hash(p.getX(i) * 1.7, p.getY(i) * 1.3, p.getZ(i) * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse018() {
  const root = new THREE.Group();
  root.name = "house-018";

  const shop = { x: 3.96, y: 1.28, w: 7.2, h: 2.46 };
  // Photo-left to photo-right: the deep door balcony, the narrower one, the dark one behind the mannequins.
  const doorA = { x: 5.75, y: 4.2, w: 1.0, h: 2.3 };
  const doorB = { x: 3.75, y: 4.25, w: 0.84, h: 2.2 };
  const doorC = { x: 1.6, y: 4.15, w: 0.72, h: 2.0 };
  const frontHoles = [shop, doorA, doorB, doorC];

  const grime = makeGrime(frontHoles);
  const plasterMaps = {
    diff: tex("plastered_wall_Diffuse.jpg", true, 0.45, 0.45),
    nor: tex("plastered_wall_nor_gl.jpg", false, 0.45, 0.45),
    arm: tex("plastered_wall_arm.jpg", false, 0.45, 0.45),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 0.8, 0.35),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 0.8, 0.35),
    arm: tex("weathered_brown_planks_arm.jpg", false, 0.8, 0.35),
  };
  const mats = {
    plaster: pbr(plasterMaps, 0xb2a796, { ao: 0.3, ns: 0.45 }),
    plasterIn: pbr(plasterMaps, 0xb8ab94, { ao: 0.28, ns: 0.35 }),
    wood: pbr(woodMaps, 0x7a6450, { ao: 0.26 }),
    woodDark: pbr(woodMaps, 0x3e2e26, { ao: 0.28 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x2c3330, roughness: 0.62, metalness: 0, transparent: true, opacity: 0.92, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x14110e, roughness: 0.96, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x1e1c1a, roughness: 0.62, metalness: 0.04, vertexColors: true }),
    iron: new THREE.MeshStandardMaterial({ color: 0x4a3c32, roughness: 0.7, metalness: 0.25, vertexColors: true }),
    paint: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.84, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    kurta: new THREE.MeshStandardMaterial({ map: kurtaTex(), alphaTest: 0.5, roughness: 0.94, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ map: clothTex(), roughness: 0.92, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    tin: new THREE.MeshStandardMaterial({ map: tinTex(), color: 0xc8c0b4, roughness: 0.72, metalness: 0.08, vertexColors: true, side: THREE.DoubleSide }),
  };
  for (const [name, mat] of Object.entries(mats)) {
    houseShader(mat, name, name === "plaster" || name === "plasterIn" ? grime : null);
  }

  const buckets = {};
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  // Vertex colours are linear; the photo samples below are sRGB.
  const lin = (c) => c.map((v) => Math.pow(v, 2.2));
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx, ry, rz);
    if (name === "plaster" || name === "plasterIn") worldUV(g);
    add(name, g, tint);
  }
  // A square stick from a to b ([y, z] at one x).
  function strut(name, s, x, a, b, tint) {
    const dy = b[0] - a[0];
    const dz = b[1] - a[1];
    addBox(name, s, Math.hypot(dy, dz), s, x, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, tint, Math.atan2(dz, dy));
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
    }
  }
  function wallX(name, z0, z1, y0, y1, xFace, tint) {
    for (const part of cells(z0, z1, y0, y1, [])) {
      addBox(name, T, part.h, part.w, xFace, part.y, part.x, tint);
    }
  }

  wallZ("plaster", 0, W, 0, 2.72, 0, [shop]);
  wallZ("plaster", 0, W, 2.72, 6.15, 0, [doorA, doorB, doorC]);
  wallZ("plasterIn", 0, W, 6.15, ROOF, 0, [{ x: 5.73, y: 7.05, w: 0.8, h: 1.7 }, { x: 2.6, y: 7.05, w: 0.8, h: 1.7 }]);
  wallX("plaster", 0.15, D, 0, ROOF, T / 2);
  wallX("plaster", 0.15, D, 0, ROOF, W - T / 2);
  addBox("plaster", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("plaster", W - 0.2, 0.16, D - 0.3, W / 2, ROOF, D / 2);
  // Middle floor: tall plank doors set back in deep reveals, a railed box balcony in front of each.
  function frame(x, y, w, h, z, deep) {
    const d = deep || 0.08;
    addBox("woodDark", 0.08, h + 0.08, d, x - w / 2, y, z);
    addBox("woodDark", 0.08, h + 0.08, d, x + w / 2, y, z);
    addBox("wood", w + 0.14, 0.1, d + 0.02, x, y + h / 2, z - 0.01);
    addBox("woodDark", w + 0.08, 0.07, d + 0.02, x, y - h / 2, z - 0.02);
  }
  function door(o, open) {
    frame(o.x, o.y, o.w, o.h, -0.02, 0.12);
    addBox("dark", o.w, o.h, 0.04, o.x, o.y, 0.34);
    for (const s of [-1, 1]) addBox("plasterIn", 0.04, o.h, 0.22, o.x + s * (o.w / 2 - 0.02), o.y, 0.11, [0.62, 0.56, 0.48]);
    const lw = o.w / 2 - 0.03;
    for (const s of [-1, 1]) {
      const a = s < 0 ? open : 0.12;
      const hx = o.x + s * (o.w / 2 - 0.04);
      const cx = hx - s * Math.cos(a) * lw / 2;
      const cz = 0.14 + Math.sin(a) * lw / 2;
      addBox("woodDark", lw, o.h - 0.1, 0.04, cx, o.y, cz, [0.85, 0.72, 0.62], 0, s * a);
      for (const k of [0.25, 0.55, 0.85]) {
        addBox("wood", lw - 0.08, 0.05, 0.02, cx, o.y - o.h / 2 + o.h * k, cz - 0.025, [0.7, 0.6, 0.52], 0, s * a);
      }
    }
  }
  door(doorA, 0.5);
  door(doorB, 0.9);
  door(doorC, 1.2);

  function balcony(o, depth, bars, postTop) {
    const yb = o.y - o.h / 2;
    addBox("wood", o.w + 0.24, 0.07, depth, o.x, yb - 0.035, -depth / 2);
    addBox("woodDark", o.w + 0.26, 0.16, 0.05, o.x, yb - 0.1, -depth - 0.02);
    for (let k = 0; k < 3; k++) addBox("woodDark", 0.06, 0.08, depth, o.x - o.w / 2 + k * o.w / 2, yb - 0.11, -depth / 2);
    const top = yb + 0.95;
    addBox("iron", o.w + 0.24, 0.045, 0.045, o.x, top, -depth);
    addBox("iron", o.w + 0.24, 0.03, 0.03, o.x, yb + 0.12, -depth);
    for (const s of [-1, 1]) {
      const sx = o.x + s * (o.w / 2 + 0.1);
      addBox("iron", 0.045, 0.045, depth, sx, top, -depth / 2);
      for (let k = 1; k < 4; k++) addBox("iron", 0.016, 0.82, 0.016, sx, yb + 0.53, -depth * k / 4);
      // Corner posts run up to the gallery soffit, as in the photo.
      addBox("woodDark", 0.08, postTop - yb + 0.05, 0.08, sx, (postTop + yb) / 2, -depth + 0.02, [0.95, 0.85, 0.75]);
    }
    for (let i = 0; i < bars; i++) {
      const x = o.x - o.w / 2 - 0.06 + (i + 0.5) * ((o.w + 0.12) / bars);
      addBox("iron", 0.016, 0.82, 0.016, x, yb + 0.53, -depth);
    }
    strut("woodDark", 0.07, o.x - o.w / 2 - 0.1, [yb - 0.65, -0.02], [yb - 0.12, -depth + 0.04]);
    strut("woodDark", 0.07, o.x + o.w / 2 + 0.1, [yb - 0.65, -0.02], [yb - 0.12, -depth + 0.04]);
  }
  balcony(doorA, 0.5, 11, 6.02);
  balcony(doorB, 0.42, 9, 6.02);
  balcony(doorC, 0.36, 8, 6.02);

  // Gallery floor: plastered soffit on joists, a front beam, diagonal struts down to the wall.
  const deckY = 6.18;
  const GZ = -1.12;
  addBox("plasterIn", W, 0.04, -GZ, W / 2, deckY - 0.12, GZ / 2, [2.3, 2.2, 2.0]);
  addBox("wood", W + 0.06, 0.05, -GZ + 0.04, W / 2, deckY, GZ / 2, [1.15, 1.02, 0.88]);
  for (let x = 0.12; x < W; x += 0.62) addBox("woodDark", 0.08, 0.1, -GZ, x, deckY - 0.08, GZ / 2);
  addBox("woodDark", W + 0.12, 0.2, 0.13, W / 2, deckY - 0.1, GZ, [1.1, 0.95, 0.82]);
  const posts = [0.12, 1.24, 2.38, 3.42, 4.6, 5.68, 6.8, 7.82];
  for (const x of posts) {
    strut("woodDark", 0.08, x, [deckY - 1.0, -0.02], [deckY - 0.14, GZ + 0.08], [1.05, 0.92, 0.8]);
    addBox("wood", 0.11, 2.12, 0.11, x, deckY + 1.06, GZ, [1.25, 1.08, 0.92]);
    addBox("woodDark", 0.2, 0.08, 0.16, x, deckY + 2.08, GZ);
  }
  addBox("wood", W + 0.1, 0.12, 0.14, W / 2, deckY + 2.14, GZ, [1.2, 1.02, 0.86]);
  addBox("wood", W, 0.06, 0.07, W / 2, deckY + 0.88, GZ - 0.02, [1.25, 1.08, 0.9]);
  addBox("woodDark", W, 0.05, 0.06, W / 2, deckY + 0.1, GZ - 0.02);
  for (let x = 0.2; x < W - 0.08; x += 0.105) {
    if (posts.some((p) => Math.abs(p - x) < 0.07)) continue;
    addBox("iron", 0.018, 0.74, 0.018, x, deckY + 0.5, GZ - 0.02, [1.1, 1.0, 0.9]);
  }
  // Yellow mat panels behind the balusters (photo-left two thirds), grey sheet boxing the photo-right end.
  for (let k = 2; k < posts.length - 1; k++) {
    if (hash(k, 1, 31) < 0.18) continue;
    const a = posts[k] + 0.07;
    const b = posts[k + 1] - 0.07;
    const sh = 0.82 + hash(k, 2, 31) * 0.14;
    addBox("paint", b - a, 0.72 + hash(k, 3, 31) * 0.1, 0.02, (a + b) / 2, deckY + 0.48, GZ + 0.07, lin([0.74 * sh, 0.6 * sh, 0.36 * sh]));
  }
  for (let k = 0; k < 2; k++) {
    const g = place(boxGeo(posts[k + 1] - posts[k] - 0.1, 1.05, 0.02), (posts[k] + posts[k + 1]) / 2, deckY + 0.62, GZ - 0.06);
    worldUV(g);
    add("tin", g, [0.82, 0.84, 0.86]);
  }
  addBox("paint", 0.06, 0.08, 0.06, 5.2, deckY - 0.2, -0.45, lin([0.95, 0.88, 0.62]));
  addBox("wire", 0.008, 0.12, 0.008, 5.2, deckY - 0.1, -0.45);

  // Eave: CGI on planks and exposed rafters, sloping down over the gallery.
  const eaveA = [ROOF + 0.18, 0.25];
  const eaveB = [deckY + 2.05, GZ - 0.42];
  const rise = Math.atan2(eaveA[0] - eaveB[0], eaveA[1] - eaveB[1]);
  const run = Math.hypot(eaveA[0] - eaveB[0], eaveA[1] - eaveB[1]);
  const roofG = place(boxGeo(W + 0.35, 0.03, run), W / 2, (eaveA[0] + eaveB[0]) / 2 + 0.11, (eaveA[1] + eaveB[1]) / 2, -rise, 0, 0);
  worldUV(roofG);
  add("tin", roofG, [0.86, 0.84, 0.8]);
  addBox("wood", W + 0.3, 0.025, run, W / 2, (eaveA[0] + eaveB[0]) / 2 + 0.08, (eaveA[1] + eaveB[1]) / 2, [0.95, 0.82, 0.7], -rise);
  for (let x = 0.05; x < W + 0.1; x += 0.48) {
    addBox("woodDark", 0.06, 0.09, run, x, (eaveA[0] + eaveB[0]) / 2 + 0.02, (eaveA[1] + eaveB[1]) / 2, null, -rise);
  }
  addBox("dark", 0.7, 1.6, 0.04, 5.73, 7.0, 0.16);
  addBox("dark", 0.7, 1.6, 0.04, 2.6, 7.0, 0.16);
  frame(5.73, 7.05, 0.8, 1.7, -0.01, 0.08);
  frame(2.6, 7.05, 0.8, 1.7, -0.01, 0.08);

  // Ground floor: the stall behind the clothes.
  addBox("woodDark", shop.w + 0.08, 0.1, 0.1, shop.x, 2.58, -0.06);
  addBox("woodDark", 0.08, 2.5, 0.08, 0.28, 1.25, -0.04);
  addBox("woodDark", 0.08, 2.5, 0.08, W - 0.28, 1.25, -0.04);
  addBox("dark", shop.w - 0.2, shop.h - 0.1, 0.05, shop.x, shop.y, 0.72);
  addBox("dark", shop.w - 0.15, 0.05, 0.6, shop.x, 2.48, 0.4);
  addBox("plaster", 0.05, shop.h - 0.08, 0.62, 0.42, shop.y, 0.4, [0.72, 0.66, 0.58]);
  addBox("plaster", 0.05, shop.h - 0.08, 0.62, W - 0.42, shop.y, 0.4, [0.72, 0.66, 0.58]);
  const stock = [[0.72, 0.62, 0.58], [0.55, 0.22, 0.28], [0.28, 0.32, 0.48], [0.75, 0.58, 0.22], [0.35, 0.42, 0.32], [0.6, 0.4, 0.55]];
  for (let i = 0; i < 28; i++) {
    const col = lin(stock[i % stock.length].map((c) => c * (0.6 + 0.3 * hash(i, 1, 41))));
    addBox("paint", 0.36, 0.06, 0.3, 0.75 + (i % 7) * 0.95, 0.85 + Math.floor(i / 7) * 0.32, 0.55, col);
  }
  // Slate-blue sheet over the photo-right end of the stall.
  const tarp = place(new THREE.PlaneGeometry(3.2, 1.1, 6, 2), 1.7, 2.62, -0.5, -Math.PI / 2 + 0.22, 0, 0);
  add("paint", tarp, lin([0.42, 0.5, 0.6]));

  // The rail of kurtas on orange hangers, two deep, from the photo.
  const cloths = [
    [0.62, 0.7, 0.82], [0.55, 0.55, 0.58], [0.72, 0.16, 0.2], [0.55, 0.12, 0.2], [0.82, 0.55, 0.62], [0.62, 0.48, 0.72],
    [0.4, 0.3, 0.55], [0.3, 0.6, 0.66], [0.25, 0.3, 0.55], [0.5, 0.5, 0.52], [0.66, 0.6, 0.8], [0.92, 0.9, 0.88],
    [0.85, 0.7, 0.3], [0.78, 0.12, 0.14], [0.6, 0.15, 0.25], [0.62, 0.55, 0.78], [0.9, 0.62, 0.5], [0.92, 0.86, 0.68],
    [0.82, 0.4, 0.55], [0.5, 0.2, 0.35], [0.95, 0.92, 0.9], [0.65, 0.12, 0.2], [0.42, 0.62, 0.78], [0.8, 0.72, 0.6],
    [0.7, 0.2, 0.42], [0.88, 0.8, 0.82],
  ];
  const railY = 2.62;
  addBox("iron", W + 0.2, 0.03, 0.03, W / 2, railY, -0.95, [0.8, 0.8, 0.8]);
  for (const x of [0.05, W / 2, W - 0.05]) strut("iron", 0.03, x, [railY + 0.4, -0.02], [railY, -0.95]);
  // Dusty, as the photo: pull each colour a quarter toward grey and darken.
  const dull = (c, k) => { const m = (c[0] + c[1] + c[2]) / 3; return lin(c.map((v) => (v * 0.75 + m * 0.25) * k)); };
  function kurta(x, z, len, col, lean) {
    const g = new THREE.PlaneGeometry(0.62, len, 4, 6);
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    const kind = Math.floor(hash(x, z, 91) * 4);
    for (let k = 0; k < p.count; k++) {
      const v = p.getY(k) / len + 0.5;
      const u = p.getX(k) / 0.31;
      p.setX(k, p.getX(k) + (1 - v) * lean);
      // Cloth bellies forward at the chest and falls in a few soft folds.
      p.setZ(k, Math.cos(u * 1.3) * 0.06 * (0.4 + v * 0.6) + Math.sin(u * 5 + x * 3) * 0.015 * (1 - v));
      uv.setX(k, (kind + uv.getX(k)) / 4);
    }
    g.computeVertexNormals();
    add("kurta", place(g, x, railY - 0.04 - len / 2, z, 0, Math.PI, 0), dull(col, 0.6));
    // Hanger: two arms and a hook.
    for (const s of [-1, 1]) addBox("paint", 0.2, 0.025, 0.02, x + s * 0.1, railY - 0.06, z - 0.01, lin([0.98, 0.5, 0.1]), 0, 0, -s * 0.35);
    addBox("paint", 0.02, 0.07, 0.02, x, railY - 0.01, z - 0.01, lin([0.98, 0.5, 0.1]));
  }
  for (let i = 0; i < cloths.length; i++) {
    const x = W - 0.25 - i * ((W - 0.5) / (cloths.length - 1));
    kurta(x + (hash(i, 5, 2) - 0.5) * 0.08, -0.95 + (i % 3) * 0.04, 1.0 + hash(i, 3, 1) * 0.35, cloths[i], (hash(i, 4, 2) - 0.5) * 0.06);
  }
  for (let i = 0; i < 14; i++) {
    const col = cloths[(i * 5 + 3) % cloths.length].map((c) => c * 0.7);
    kurta(W - 0.5 - i * 0.52, -0.62, 1.15 + hash(i, 6, 1) * 0.3, col, 0);
  }

  // Mannequins in long dresses under the gallery, photo-right.
  const gowns = [[0.12, 0.12, 0.14], [0.15, 0.25, 0.75], [0.85, 0.2, 0.5], [0.88, 0.45, 0.55], [0.8, 0.9, 0.15], [0.78, 0.15, 0.3], [0.9, 0.35, 0.5], [0.75, 0.12, 0.2]];
  addBox("iron", 2.5, 0.025, 0.025, 1.2, 5.62, -0.8);
  for (let i = 0; i < gowns.length; i++) {
    const x = 2.3 - i * 0.29;
    const z = -0.8 - (i % 2) * 0.06;
    const head = new THREE.SphereGeometry(0.085, 8, 6);
    head.scale(0.9, 1.15, 0.95);
    add("paint", place(head, x, 5.42, z), lin([0.86, 0.72, 0.62]));
    if (i % 3 !== 1) add("dark", place(new THREE.SphereGeometry(0.09, 8, 4, 0, Math.PI * 2, 0, 1.4), x, 5.45, z + 0.012), [0.6, 0.55, 0.5]);
    addBox("paint", 0.05, 0.12, 0.05, x, 5.27, z, lin([0.84, 0.7, 0.6]));
    const gown = new THREE.CylinderGeometry(0.15, 0.26, 1.75, 8, 4, true);
    const p = gown.attributes.position;
    for (let k = 0; k < p.count; k++) {
      const v = (p.getY(k) + 0.875) / 1.75;
      const waist = v > 0.62 && v < 0.85 ? 0.82 : 1;
      p.setX(k, p.getX(k) * waist + Math.sin(k * 1.7) * 0.012);
      p.setZ(k, p.getZ(k) * 0.7 * waist);
    }
    gown.computeVertexNormals();
    add("cloth", place(gown, x, 5.21 - 0.875, z, 0, 0, (hash(i, 1, 51) - 0.5) * 0.05), dull(gowns[i], 0.8));
  }

  // Wires: the black bundle sweeping down from photo-left, plus slack single lines and a coil.
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
  for (let i = 0; i < 16; i++) {
    const o = (hash(i, 1, 61) - 0.5) * 0.22;
    const q = (hash(i, 2, 61) - 0.5) * 0.18;
    span([W + 0.6, 4.7 + o * 1.6, -0.45 + q], [4.4 + q, 2.74 + o * 0.5, -1.0 + o * 0.3], 0.38 + hash(i, 3, 61) * 0.2, 0.009 + hash(i, 4, 61) * 0.008);
    if (i < 9) span([4.4 + q, 2.72 + o * 0.4, -1.0 + o * 0.3], [0.2, 2.7 + o * 0.3, -1.05 + q * 0.3], 0.08 + hash(i, 5, 61) * 0.08, 0.008);
  }
  span([W + 0.3, 5.3, -0.2], [0, 4.85, -0.4], 0.35, 0.006);
  span([W + 0.3, 5.75, -0.25], [doorA.x, 5.55, -0.5], 0.2, 0.005);
  span([doorA.x, 5.55, -0.5], [0, 5.2, -0.9], 0.3, 0.005);
  span([doorB.x, 3.05, -0.42], [0, 2.95, -0.85], 0.25, 0.005);
  // The photo's web of thin service lines over the upper wall, and droppers off the gallery beam.
  for (let i = 0; i < 7; i++) {
    const y0 = 4.4 + hash(i, 1, 63) * 1.6;
    const y1 = 3.6 + hash(i, 2, 63) * 2.2;
    span([W + 0.4, y0, -0.15 - hash(i, 3, 63) * 0.5], [hash(i, 4, 63) * 5, y1, -0.3 - hash(i, 5, 63) * 0.8], 0.15 + hash(i, 6, 63) * 0.45, 0.0025 + hash(i, 7, 63) * 0.002);
  }
  for (let i = 0; i < 7; i++) {
    const x = 0.5 + hash(i, 1, 64) * 6.8;
    span([x, deckY - 0.2, GZ + 0.05], [x + (hash(i, 2, 64) - 0.5) * 1.2, 2.75 + hash(i, 3, 64) * 1.2, -0.7 - hash(i, 4, 64) * 0.3], 0.05, 0.0025);
  }
  const coil = new THREE.TorusGeometry(0.2, 0.008, 4, 18);
  add("wire", place(coil, 7.15, 5.0, -0.06, 0, 0.3, 0));
  add("wire", place(new THREE.TorusGeometry(0.14, 0.008, 4, 16), 7.3, 4.8, -0.08, 0, -0.2, 0));

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass" && name !== "paint";
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
  root.userData.id = "018";
  return root;
}
