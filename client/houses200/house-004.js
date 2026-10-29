// House 004. Narayan Dai Ko Masangalli, one real shop on Yatkha Road.
// OSM way 343060498, west face (edge 4), 8.02 m. Spec: research/houses200/004/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. Anything over the lane is negative Z.
// The Street View stills are the measure. They are not textures.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 8.02;
const D = 8.92;
const T = 0.22;

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
  const w = 512;
  const h = 768;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d");
  g.fillStyle = "#f3ece4";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) {
    const x = hash(i, 2, 1) * w;
    const y = hash(i, 5, 3) * h;
    const k = hash(i, 8, 4);
    g.fillStyle = k > 0.62 ? "rgba(90,48,36,0.16)" : "rgba(255,244,230,0.14)";
    g.beginPath();
    g.ellipse(x, y, 3 + k * 14, 2 + k * 8, hash(i, 9, 2) * 3, 0, 6.3);
    g.fill();
  }
  const grad = g.createLinearGradient(0, h * 0.78, 0, h);
  grad.addColorStop(0, "rgba(90,60,48,0)");
  grad.addColorStop(1, "rgba(70,42,32,0.45)");
  g.fillStyle = grad;
  g.fillRect(0, h * 0.78, w, h * 0.22);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = "rgba(48,70,40,0.18)";
    g.beginPath();
    g.ellipse(hash(i, 3, 7) * w, h * (0.86 + hash(i, 4, 2) * 0.1), 20 + hash(i, 5, 1) * 40, 8 + hash(i, 6, 2) * 10, 0, 0, 6.3);
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
        "float gu = (ax > az && ax > ay) ? clamp(vHousePos.z / 9.2, 0.0, 1.0) : clamp(vHousePos.x / 8.2, 0.0, 1.0);\n" +
        "float gv = (ay > 0.72) ? clamp(vHousePos.z / 9.2, 0.0, 1.0) : clamp(vHousePos.y / 9.6, 0.0, 1.0);\n" +
        "vec3 grime = texture2D(grimeMap, vec2(gu, gv)).rgb;\n" +
        "diffuseColor.rgb *= mix(vec3(1.0), grime, " + s + ");\n" +
        "float lum = dot(diffuseColor.rgb, vec3(0.30, 0.59, 0.11));\n" +
        "float mortar = smoothstep(0.30, 0.58, lum);\n" +
        "diffuseColor.rgb *= mix(vec3(1.0), vec3(0.34, 0.28, 0.24), mortar);\n" +
        "float yy = vHousePos.y;\n" +
        "float wallN = smoothstep(0.45, 0.9, abs(vHouseN.z));\n" +
        "float under = 0.0;\n" +
        "under = max(under, smoothstep(0.48, 0.02, 2.74 - yy) * step(0.0, 2.74 - yy));\n" +
        "under = max(under, smoothstep(0.36, 0.02, 3.68 - yy) * step(0.0, 3.68 - yy));\n" +
        "under = max(under, smoothstep(0.46, 0.02, 5.52 - yy) * step(0.0, 5.52 - yy));\n" +
        "under = max(under, smoothstep(0.34, 0.02, 6.53 - yy) * step(0.0, 6.53 - yy));\n" +
        "under = max(under, smoothstep(0.42, 0.02, 8.50 - yy) * step(0.0, 8.50 - yy));\n" +
        "diffuseColor.rgb *= mix(vec3(1.0), vec3(0.46, 0.32, 0.26), under * wallN * 0.7);");
  };
  mat.customProgramCacheKey = function () { return "house004-soot-" + s; };
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
    aoMapIntensity: o.ao == null ? 0.35 : o.ao,
    vertexColors: true,
    envMapIntensity: 0.65,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.8 : o.ns, o.ns == null ? 0.8 : o.ns);
  return m;
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const k = 0.92 + 0.08 * hash(x * 1.7, y * 1.3, z * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

function canvasTex(draw, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d"), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function momoSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#163a86";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#f4f7ff";
    g.lineWidth = 10;
    g.strokeRect(8, 8, w - 16, h - 16);
    g.fillStyle = "#f7f4ee";
    g.fillRect(28, 28, 250, h - 56);
    g.strokeStyle = "#163a86";
    g.lineWidth = 4;
    g.strokeRect(40, 44, 226, h - 88);
    g.fillStyle = "#f3efe8";
    g.fillRect(48, 52, 210, 200);
    g.fillStyle = "#8d8883";
    g.beginPath();
    g.ellipse(153, 148, 64, 62, 0, 0, 6.3);
    g.fill();
    g.fillStyle = "#c5c0ba";
    g.beginPath();
    g.ellipse(104, 156, 16, 30, 0, 0, 6.3);
    g.ellipse(202, 156, 16, 30, 0, 0, 6.3);
    g.fill();
    g.fillStyle = "#f0d2b6";
    g.beginPath();
    g.moveTo(120, 124);
    g.quadraticCurveTo(108, 158, 122, 188);
    g.quadraticCurveTo(142, 218, 153, 220);
    g.quadraticCurveTo(164, 218, 184, 188);
    g.quadraticCurveTo(198, 158, 186, 124);
    g.quadraticCurveTo(170, 108, 153, 108);
    g.quadraticCurveTo(136, 108, 120, 124);
    g.closePath();
    g.fill();
    g.fillStyle = "rgba(130,82,54,0.18)";
    g.beginPath();
    g.ellipse(172, 170, 16, 26, 0.15, 0, 6.3);
    g.fill();
    g.fillStyle = "#9a958f";
    g.fillRect(106, 122, 24, 32);
    g.fillRect(176, 122, 24, 32);
    g.fillStyle = "#d2cdc6";
    g.fillRect(110, 126, 16, 18);
    g.fillRect(180, 126, 16, 18);
    g.fillStyle = "#14161a";
    g.beginPath();
    g.moveTo(114, 130);
    g.lineTo(128, 84);
    g.lineTo(153, 70);
    g.lineTo(178, 84);
    g.lineTo(192, 130);
    g.quadraticCurveTo(153, 142, 114, 130);
    g.fill();
    g.fillStyle = "#d5d0c8";
    g.beginPath();
    g.moveTo(78, 132);
    g.lineTo(118, 122);
    g.lineTo(116, 214);
    g.lineTo(80, 200);
    g.closePath();
    g.fill();
    g.beginPath();
    g.moveTo(228, 132);
    g.lineTo(188, 122);
    g.lineTo(190, 214);
    g.lineTo(226, 200);
    g.closePath();
    g.fill();
    g.fillStyle = "#8e8984";
    g.fillRect(96, 150, 14, 40);
    g.fillRect(196, 150, 14, 40);
    g.strokeStyle = "#3a3e46";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(126, 104);
    g.quadraticCurveTo(153, 112, 180, 104);
    g.stroke();
    g.fillStyle = "#eeeae4";
    g.beginPath();
    g.moveTo(78, 252);
    g.lineTo(116, 200);
    g.lineTo(190, 200);
    g.lineTo(228, 252);
    g.closePath();
    g.fill();
    g.strokeStyle = "#22262c";
    g.lineWidth = 4;
    g.stroke();
    g.beginPath();
    g.moveTo(138, 202);
    g.lineTo(153, 228);
    g.lineTo(168, 202);
    g.stroke();
    g.strokeStyle = "#5c584e";
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(122, 146);
    g.lineTo(146, 140);
    g.moveTo(160, 140);
    g.lineTo(184, 146);
    g.stroke();
    g.strokeStyle = "#111111";
    g.lineWidth = 3;
    g.beginPath();
    g.arc(134, 160, 13, 0, 6.3);
    g.stroke();
    g.beginPath();
    g.arc(172, 160, 13, 0, 6.3);
    g.stroke();
    g.beginPath();
    g.moveTo(147, 160);
    g.lineTo(159, 160);
    g.stroke();
    g.fillStyle = "#1b1916";
    g.beginPath();
    g.ellipse(134, 161, 2.8, 2.2, 0, 0, 6.3);
    g.ellipse(172, 161, 2.8, 2.2, 0, 0, 6.3);
    g.fill();
    g.strokeStyle = "#7a5344";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(153, 156);
    g.lineTo(147, 178);
    g.lineTo(162, 180);
    g.stroke();
    g.strokeStyle = "#6a4038";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(140, 198);
    g.lineTo(166, 198);
    g.stroke();
    g.fillStyle = "#ffffff";
    g.font = "700 42px Arial, sans-serif";
    g.textAlign = "left";
    g.fillText("NARAYAN DAI KO MASANGALLI KO", 300, 78);
    g.font = "800 64px Arial, sans-serif";
    g.fillText("FAMOUS MO:MO:", 300, 162);
    g.font = "700 36px Arial, sans-serif";
    g.fillText("SINCE 1962", 860, 230);
  }, 1280, 320);
}

function yogaSign() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#111111";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#f5f5f5";
    g.lineWidth = 8;
    g.lineCap = "round";
    g.beginPath();
    g.arc(128, 70, 22, 0, 6.3);
    g.moveTo(128, 92);
    g.lineTo(128, 168);
    g.moveTo(128, 110);
    g.lineTo(78, 70);
    g.moveTo(128, 118);
    g.lineTo(186, 78);
    g.moveTo(128, 168);
    g.lineTo(96, 230);
    g.moveTo(128, 168);
    g.lineTo(168, 228);
    g.stroke();
    g.fillStyle = "#f5f5f5";
    g.font = "600 22px 'Nirmala UI', sans-serif";
    g.textAlign = "center";
    g.fillText("अथ योगानुशासनम्", 128, 280);
  }, 256, 320);
}

function plaque(label) {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#6a431c";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#e6c56a";
    g.lineWidth = 6;
    g.strokeRect(6, 6, w - 12, h - 12);
    g.fillStyle = "#f0d48a";
    g.font = "700 42px Georgia, serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, w / 2, h / 2 + 2);
  }, 512, 96);
}

export function createHouse004() {
  const root = new THREE.Group();
  root.name = "house-004";
  const grimeTex = makeGrime();
  const brickMaps = {
    diff: tex("brick_wall_006_Diffuse.jpg", true, 0.55, 0.45),
    nor: tex("brick_wall_006_nor_gl.jpg", false, 0.55, 0.45),
    arm: tex("brick_wall_006_arm.jpg", false, 0.55, 0.45),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 0.8, 0.8),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 0.8, 0.8),
    arm: tex("weathered_brown_planks_arm.jpg", false, 0.8, 0.8),
  };
  const plateMaps = {
    diff: tex("metal_plate_Diffuse.jpg", true, 1.2, 1.2),
    nor: tex("metal_plate_nor_gl.jpg", false, 1.2, 1.2),
    arm: tex("metal_plate_arm.jpg", false, 1.2, 1.2),
  };
  const rustMaps = {
    diff: tex("rusty_metal_Diffuse.jpg", true, 1.5, 0.4),
    nor: tex("rusty_metal_nor_gl.jpg", false, 1.5, 0.4),
    arm: tex("rusty_metal_arm.jpg", false, 1.5, 0.4),
  };
  const mats = {
    brick: pbr(brickMaps, 0xc4aa98, { ao: 0.48 }),
    brickDark: pbr(brickMaps, 0x7a6558, { ao: 0.5 }),
    wood: pbr(woodMaps, 0xc47a40, { ao: 0.22 }),
    woodDark: pbr(woodMaps, 0x5c3520, { ao: 0.24 }),
    plate: pbr(plateMaps, 0xf2f2f0, { ao: 0.15, metal: true, ns: 0.5 }),
    rust: pbr(rustMaps, 0xffffff, { ao: 0.3, metal: true }),
    cloth: new THREE.MeshStandardMaterial({ color: 0xf4efe6, roughness: 0.92, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    glass: new THREE.MeshStandardMaterial({ color: 0xd5e2ea, roughness: 0.12, metalness: 0.05, envMapIntensity: 0.8, transparent: true, opacity: 0.32, vertexColors: true }),
    pot: new THREE.MeshStandardMaterial({ color: 0xa86840, roughness: 0.88, metalness: 0, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x3f6b32, roughness: 0.85, metalness: 0, vertexColors: true }),
    white: new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.7, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x2a1812, roughness: 0.9, metalness: 0, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xfff1d0, emissive: 0xffb060, emissiveIntensity: 1.4, roughness: 0.35 }),
    inside: new THREE.MeshStandardMaterial({ color: 0x5a3e2c, emissive: 0x5a2a0c, emissiveIntensity: 0.06, roughness: 0.9, metalness: 0, vertexColors: true }),
    counter: new THREE.MeshStandardMaterial({ color: 0xf4f7f8, roughness: 0.04, metalness: 0.08, transparent: true, opacity: 0.72, vertexColors: true }),
    lattice: new THREE.MeshStandardMaterial({ color: 0x6e4224, roughness: 0.72, metalness: 0, vertexColors: true }),
    concrete: pbr({
      diff: tex("concrete_wall_001_Diffuse.jpg", true, 0.6, 0.6),
      nor: tex("concrete_wall_001_nor_gl.jpg", false, 0.6, 0.6),
      arm: tex("concrete_wall_001_arm.jpg", false, 0.6, 0.6),
    }, 0xc8c2b6, { ao: 0.28 }),
  };
  bindGrime(mats.brick, grimeTex, 0.28);
  bindGrime(mats.brickDark, grimeTex, 0.34);

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
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    const parts = cells(x0, x1, y0, y1, holes || []);
    for (const part of parts) addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
  }
  function hingeBox(name, w, h, d, hx, hy, hz, ang, tint) {
    const g = boxGeo(Math.abs(w), h, d);
    const dir = w >= 0 ? 1 : -1;
    g.applyMatrix4(new THREE.Matrix4().makeTranslation((dir * Math.abs(w)) / 2, 0, 0));
    g.applyMatrix4(new THREE.Matrix4().makeRotationY(ang));
    g.applyMatrix4(new THREE.Matrix4().makeTranslation(hx, hy, hz));
    add(name, g, tint);
  }
  function leaf(hx, hy, hz, w, h, ang) {
    const thick = 0.045;
    hingeBox("wood", w, h, thick, hx, hy, hz, ang);
    const inset = w >= 0 ? 1 : -1;
    hingeBox("woodDark", w * 0.72, h * 0.38, 0.02, hx + inset * 0.02, hy + h * 0.22, hz, ang, [0.72, 0.48, 0.28]);
    hingeBox("woodDark", w * 0.72, h * 0.38, 0.02, hx + inset * 0.02, hy - h * 0.22, hz, ang, [0.68, 0.44, 0.26]);
  }

  const midHoles = [
    { x: 1.55, y: 4.55, w: 1.18, h: 1.7 },
    { x: 3.9, y: 4.55, w: 1.12, h: 1.7 },
    { x: 6.35, y: 4.55, w: 1.18, h: 1.7 },
  ];
  const topHoles = [
    { x: 1.55, y: 7.35, w: 1.18, h: 1.6 },
    { x: 3.9, y: 7.35, w: 1.12, h: 1.6 },
    { x: 6.35, y: 7.35, w: 1.18, h: 1.6 },
  ];
  const shopHoles = [
    { x: 1.85, y: 1.32, w: 3.05, h: 2.28 },
    { x: 5.9, y: 1.32, w: 3.15, h: 2.28 },
  ];

  function stringCourse(y) {
    // Photo: timber lintel, then two rows of brick dentils under a plain brick ledge.
    addBox("woodDark", W + 0.04, 0.16, 0.2, W / 2, y - 0.04, -0.08);
    addBox("brickDark", W + 0.06, 0.08, 0.16, W / 2, y + 0.08, -0.06);
    const n = 40;
    for (let i = 0; i < n; i++) {
      const x = 0.1 + (i + 0.5) * ((W - 0.2) / n);
      addBox("brick", 0.1, 0.07, 0.12, x, y + 0.16, -0.12, [0.92, 0.82, 0.78]);
      addBox("brick", 0.09, 0.06, 0.1, x + (W - 0.2) / n / 2, y + 0.24, -0.17, [0.86, 0.76, 0.72]);
    }
    addBox("brickDark", W + 0.14, 0.05, 0.28, W / 2, y + 0.3, -0.12);
    addBox("brick", W + 0.18, 0.06, 0.32, W / 2, y + 0.36, -0.14, [0.95, 0.88, 0.84]);
  }

  wallZ("brick", 0, W, 0, 3.15, 0, shopHoles);
  stringCourse(2.9);
  wallZ("brick", 0, W, 3.15, 5.7, 0, midHoles);
  stringCourse(5.7);
  wallZ("brick", 0, W, 6.0, 8.45, 0, topHoles);
  addBox("wood", W + 0.5, 0.1, 1.25, W / 2, 8.62, -0.32);
  addBox("woodDark", W + 0.15, 0.08, 0.16, W / 2, 8.74, -0.72);
  for (let i = 0; i < 9; i++) {
    const x = 0.4 + i * 0.9;
    addBox("wood", 0.08, 0.45, 0.08, x, 8.35, -0.15);
    addBox("wood", 0.08, 0.08, 0.55, x, 8.15, -0.28);
  }
  addBox("brick", 0.18, 0.7, D, 0.09, 9.05, D / 2);
  addBox("brick", 0.18, 0.7, D, W - 0.09, 9.05, D / 2);
  addBox("brick", W, 0.45, 0.22, W / 2, 9.05, 0.08);

  addBox("brick", T, 9.5, D, T / 2, 4.75, D / 2);
  addBox("brick", T, 9.5, D, W - T / 2, 4.75, D / 2);
  addBox("brickDark", T, 9.5, T, W / 2, 4.75, D - T / 2);
  addBox("concrete", W - 0.3, 0.16, D - 0.4, W / 2, 8.95, D / 2 + 0.15);
  addBox("rust", W - 0.6, 0.04, D - 1.6, W / 2, 9.08, D / 2 + 0.4);
  addBox("brick", 0.85, 1.3, 0.7, 6.4, 9.7, 7.2);
  add("plate", place(new THREE.CylinderGeometry(0.26, 0.3, 0.65, 10), 2.3, 9.55, 6.6), [0.2, 0.22, 0.24]);
  add("plate", place(new THREE.CylinderGeometry(0.2, 0.07, 0.1, 8), 5.5, 9.2, 5.4, Math.PI / 2.4, 0.4, 0), [0.75, 0.78, 0.8]);

  function bayFrame(x0, x1, y0, y1) {
    const z = -0.06;
    addBox("wood", 0.1, y1 - y0, 0.12, x0, (y0 + y1) / 2, z);
    addBox("wood", 0.1, y1 - y0, 0.12, x1, (y0 + y1) / 2, z);
    addBox("wood", x1 - x0, 0.12, 0.14, (x0 + x1) / 2, y1, z);
    addBox("woodDark", x1 - x0 + 0.08, 0.06, 0.08, (x0 + x1) / 2, y1 + 0.08, z - 0.02);
    for (let i = 0; i < 9; i++) {
      const x = x0 + 0.12 + i * ((x1 - x0 - 0.2) / 8);
      addBox("woodDark", 0.045, 0.045, 0.05, x, y1 + 0.12, -0.1);
    }
  }
  bayFrame(0.28, 3.42, 0.16, 2.5);
  bayFrame(4.2, 7.55, 0.16, 2.5);
  function doorFace(x, y, z, w, h, ang) {
    add("wood", place(boxGeo(w, h, 0.04), x, y, z, 0, ang, 0), [1, 0.84, 0.55]);
    add("woodDark", place(boxGeo(w * 0.62, h * 0.32, 0.018), x, y + h * 0.18, z - 0.02, 0, ang, 0));
    add("woodDark", place(boxGeo(w * 0.62, h * 0.32, 0.018), x, y - h * 0.18, z - 0.02, 0, ang, 0));
  }
  function foldSet(x0, dir) {
    for (let i = 0; i < 2; i++) {
      const ang = dir * (0.85 + i * 0.4);
      doorFace(x0 + dir * (0.08 + i * 0.16), 1.22, -0.16 - i * 0.06, 0.34, 2.02, ang);
    }
  }
  foldSet(0.48, 1);
  foldSet(3.22, -1);
  foldSet(4.48, 1);
  foldSet(7.28, -1);

  addBox("dark", 7.55, 0.06, 2.6, 3.9, 2.66, 1.25, [0.6, 0.5, 0.45]);
  addBox("wood", 7.4, 0.05, 2.3, 3.9, 0.04, 1.2, [0.82, 0.66, 0.44]);
  addBox("white", 2.9, 0.95, 0.42, 5.9, 0.62, 0.3, [0.93, 0.92, 0.9]);
  addBox("counter", 2.95, 0.05, 0.5, 5.9, 1.12, 0.3);
  addBox("plate", 0.06, 2.2, 0.06, 5.95, 1.24, 0.08, [0.7, 0.7, 0.7]);
  function steamer(x, z) {
    for (let i = 0; i < 3; i++) {
      add("plate", place(new THREE.CylinderGeometry(0.22, 0.22, 0.14, 12), x, 1.22 + i * 0.15, z), [0.78, 0.78, 0.76]);
    }
    add("plate", place(new THREE.CylinderGeometry(0.23, 0.23, 0.03, 12), x, 1.67, z), [0.86, 0.84, 0.8]);
  }
  steamer(5.2, 0.42);
  steamer(6.6, 0.42);
  function tableAt(x, z) {
    addBox("wood", 0.72, 0.05, 0.68, x, 0.74, z);
    addBox("woodDark", 0.045, 0.68, 0.045, x - 0.28, 0.38, z - 0.26);
    addBox("woodDark", 0.045, 0.68, 0.045, x + 0.28, 0.38, z - 0.26);
    addBox("woodDark", 0.045, 0.68, 0.045, x - 0.28, 0.38, z + 0.26);
    addBox("woodDark", 0.045, 0.68, 0.045, x + 0.28, 0.38, z + 0.26);
  }
  function stoolAt(x, z) {
    addBox("wood", 0.28, 0.04, 0.28, x, 0.46, z, [0.92, 0.74, 0.48]);
    addBox("woodDark", 0.032, 0.42, 0.032, x - 0.1, 0.24, z - 0.1);
    addBox("woodDark", 0.032, 0.42, 0.032, x + 0.1, 0.24, z - 0.1);
    addBox("woodDark", 0.032, 0.42, 0.032, x - 0.1, 0.24, z + 0.1);
    addBox("woodDark", 0.032, 0.42, 0.032, x + 0.1, 0.24, z + 0.1);
  }
  tableAt(1.45, 1.15);
  tableAt(2.55, 1.35);
  stoolAt(1.15, 0.78);
  stoolAt(1.8, 0.82);
  stoolAt(2.25, 1.0);
  stoolAt(2.95, 0.95);
  addBox("brickDark", 0.3, 2.15, 0.34, 3.85, 1.15, 0.5);
  function hangBulb(x, y, z) {
    addBox("dark", 0.012, 0.16, 0.012, x, y + 0.12, z);
    addBox("bulb", 0.08, 0.1, 0.08, x, y, z);
    const lamp = new THREE.PointLight(0xffb060, 6, 4.5, 1.8);
    lamp.position.set(x, y, z);
    loose.push(lamp);
  }
  hangBulb(1.55, 2.3, 1.15);
  hangBulb(2.6, 2.24, 1.35);
  hangBulb(5.7, 2.28, 1.15);
  hangBulb(6.7, 2.22, 1.2);

  for (let i = 0; i < 10; i++) {
    addBox("wood", 0.32, 0.07, 0.85, 4.35 + i * 0.33, 0.28, -0.48);
  }
  addBox("wood", 0.7, 0.1, 0.32, 7.35, 0.14, -0.22);
  addBox("wood", 0.7, 0.1, 0.32, 7.35, 0.08, -0.5);

  function carvedWin(cx, ww, sill, wh, opts) {
    const o = opts || {};
    const zd = 0.09;
    const z = -0.02;
    addBox("wood", 0.14, wh + 0.2, zd, cx - ww / 2 - 0.05, sill + wh / 2, z, [0.86, 0.66, 0.5]);
    addBox("wood", 0.14, wh + 0.2, zd, cx + ww / 2 + 0.05, sill + wh / 2, z, [0.86, 0.66, 0.5]);
    addBox("wood", ww + 0.34, 0.12, zd, cx, sill + wh + 0.05, z, [0.86, 0.66, 0.5]);
    addBox("woodDark", 0.05, wh + 0.32, 0.05, cx - ww / 2 - 0.15, sill + wh / 2 + 0.04, -0.05);
    addBox("woodDark", 0.05, wh + 0.32, 0.05, cx + ww / 2 + 0.15, sill + wh / 2 + 0.04, -0.05);
    addBox("dark", ww, wh, 0.02, cx, sill + wh / 2, 0.32, [0.55, 0.5, 0.48]);
    addBox("wood", ww + 0.22, 0.07, 0.08, cx, sill - 0.02, -0.03, [0.9, 0.7, 0.44]);
    addBox("woodDark", 0.045, wh - 0.1, 0.045, cx, sill + wh / 2, z);
    const glassH = wh - 0.16;
    const glassY = sill + wh / 2 + 0.02;
    addBox("glass", ww - 0.1, glassH, 0.012, cx, glassY, 0.035);
    addBox("cloth", ww * 0.26, glassH * 0.86, 0.012, cx - ww * 0.3, glassY, 0.05, [0.98, 0.97, 0.93]);
    addBox("cloth", ww * 0.26, glassH * 0.86, 0.012, cx + ww * 0.3, glassY, 0.05, [0.97, 0.96, 0.91]);
    if (o.open) leaf(cx + ww / 2, glassY, -0.03, ww * 0.46, glassH, 1.15);
    if (o.hang) {
      addBox("cloth", 0.34, 0.78, 0.016, cx - ww * 0.22, sill - 0.32, -0.12, [0.98, 0.97, 0.93]);
    }
    if (o.lattice) {
      const latH = 0.42;
      const latY = sill - 0.28;
      addBox("lattice", ww + 0.28, latH, 0.08, cx, latY, -0.14);
      addBox("woodDark", 0.045, latH + 0.02, 0.04, cx - (ww + 0.28) / 2, latY, -0.18);
      addBox("woodDark", 0.045, latH + 0.02, 0.04, cx + (ww + 0.28) / 2, latY, -0.18);
      const cols = 6;
      for (let i = 0; i < cols; i++) {
        const x = cx - ww / 2 + 0.12 + i * ((ww - 0.16) / (cols - 1));
        addBox("woodDark", 0.035, latH - 0.06, 0.03, x, latY, -0.19);
      }
      for (let i = 0; i < 3; i++) {
        const yy = latY - latH / 2 + 0.05 + i * ((latH - 0.08) / 2);
        addBox("woodDark", ww - 0.04, 0.03, 0.03, cx, yy, -0.19);
      }
    }
  }
  carvedWin(1.55, 1.18, 3.7, 1.7, { lattice: true, open: true });
  carvedWin(3.9, 1.12, 3.7, 1.7, { lattice: true, hang: true, open: true });
  carvedWin(6.35, 1.18, 3.7, 1.7, { lattice: true });
  carvedWin(1.55, 1.18, 6.55, 1.6);
  carvedWin(3.9, 1.12, 6.55, 1.6);
  carvedWin(6.35, 1.18, 6.55, 1.6);

  addBox("brick", 0.16, 1.35, 0.9, W + 0.02, 4.3, 2.4);
  addBox("wood", 0.08, 1.05, 0.08, W + 0.08, 4.35, 2.1);
  addBox("wood", 0.08, 1.05, 0.08, W + 0.08, 4.35, 2.7);
  addBox("glass", 0.02, 0.85, 0.62, W + 0.1, 4.35, 2.4);
  add("concrete", place(new THREE.CylinderGeometry(0.045, 0.05, 5.2, 6), W - 0.08, 2.6, 0.35), [0.8, 0.8, 0.78]);

  const pots = [[0.55, -0.85], [2.4, -0.95], [4.55, -1.05], [6.7, -0.9], [7.55, -1.15]];
  for (let i = 0; i < pots.length; i++) {
    const px = pots[i][0];
    const pz = pots[i][1];
    const s = 0.85 + (i % 3) * 0.12;
    add("pot", place(new THREE.CylinderGeometry(0.13 * s, 0.1 * s, 0.22 * s, 8), px, 0.12 * s, pz), [0.85 + (i % 2) * 0.15, 0.55, 0.35]);
    add("pot", place(new THREE.CylinderGeometry(0.15 * s, 0.14 * s, 0.04, 8), px, 0.24 * s, pz));
    add("leaf", place(new THREE.ConeGeometry(0.12 * s, 0.28 * s, 6), px, 0.4 * s, pz), [0.7 + (i % 2) * 0.2, 1, 0.7]);
  }

  const px = 9.05;
  const pz = -1.6;
  add("concrete", place(new THREE.CylinderGeometry(0.09, 0.11, 10.2, 8), px, 5.1, pz));
  addBox("plate", 0.55, 0.7, 0.35, px, 5.4, pz, [0.82, 0.84, 0.86]);
  function sag(a, b, droop) {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add("dark", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, 0.008, 4, false), [0.15, 0.16, 0.18]);
  }
  sag([px, 8.8, pz], [7.7, 8.5, -0.35], 0.45);
  sag([px, 8.2, pz], [5.2, 8.45, -0.3], 0.7);
  sag([px, 7.4, pz], [2.4, 5.7, -0.12], 0.55);
  sag([7.6, 8.55, -0.4], [1.1, 8.4, -0.25], 0.3);

  const sign = new THREE.Mesh(
    new THREE.BoxGeometry(3.3, 0.68, 0.06),
    new THREE.MeshStandardMaterial({ map: momoSign(), roughness: 0.55, metalness: 0.02 })
  );
  sign.position.set(1.9, 3.0, -0.32);
  sign.castShadow = true;
  loose.push(sign);

  const yoga = new THREE.Mesh(
    new THREE.BoxGeometry(0.66, 0.9, 0.04),
    new THREE.MeshStandardMaterial({ map: yogaSign(), roughness: 0.7, metalness: 0 })
  );
  yoga.position.set(2.78, 3.86, -0.24);
  yoga.castShadow = true;
  loose.push(yoga);

  const labels = [["AYURVEDA MASSAGE", 6.35], ["STEAM BATH", 3.9]];
  for (const row of labels) {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(1.0, 0.24, 0.02),
      new THREE.MeshStandardMaterial({ map: plaque(row[0]), roughness: 0.6, metalness: 0 })
    );
    board.position.set(row[1], 3.42, -0.215);
    board.castShadow = true;
    loose.push(board);
  }

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
  root.userData.id = "004";
  return root;
}
