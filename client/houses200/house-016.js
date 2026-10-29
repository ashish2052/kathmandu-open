// House 016. Phalchasa Pode Galli, Chikamugal corner, OSM way 344176294, edge 1, 8.447 m.
// Spec: research/houses200/016/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// After the place.js yaw-180, x = 0 is photo-right (east). x = 8.45 is photo-left (west),
// the corner nearest pano 4q9GjjRj4_Zj5UuoWmTkyQ. The still is yaw 78.
// Grey plaster, an open kirana, the board "A&S किराना स्टोर". No shrine, no people, no lamps.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 8.447;
const D = 6.499;
const T = 0.22;
const ROOF = 9.85;

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

function makeGrime(holes) {
  // Whole-facade weathering: u = x / 8.5, v = y / 9.85, canvas top is the roof.
  const S = 512;
  const c = canvas(S, S);
  const g = c.getContext("2d");
  const px = (x) => (x / 8.5) * S;
  const py = (y) => (1 - y / 9.85) * S;
  g.fillStyle = "rgb(168,164,158)";
  g.fillRect(0, 0, S, S);
  for (let i = 0; i < 260; i++) {
    const r = 6 + hash(i, 1, 7) * 34;
    const k = hash(i, 2, 7) < 0.5 ? "rgba(120,112,102," : "rgba(196,192,184,";
    g.fillStyle = k + (0.05 + hash(i, 3, 7) * 0.08).toFixed(3) + ")";
    g.beginPath();
    g.ellipse(hash(i, 4, 7) * S, hash(i, 5, 7) * S, r, r * (0.6 + hash(i, 6, 7) * 0.6), 0, 0, Math.PI * 2);
    g.fill();
  }
  // soot and drip under every ledge band and the cornice
  for (const [y, a] of [[9.2, 0.42], [7.3, 0.22], [5.14, 0.26], [2.72, 0.3]]) {
    const grd = g.createLinearGradient(0, py(y), 0, py(y) + 26);
    grd.addColorStop(0, "rgba(46,40,34," + a + ")");
    grd.addColorStop(1, "rgba(46,40,34,0)");
    g.fillStyle = grd;
    g.fillRect(0, py(y), S, 26);
    for (let i = 0; i < 40; i++) {
      const x = hash(i, y, 3) * S;
      const len = 10 + hash(i, y, 4) * 70;
      const lg = g.createLinearGradient(0, py(y), 0, py(y) + len);
      lg.addColorStop(0, "rgba(58,50,42," + (a * 0.8).toFixed(3) + ")");
      lg.addColorStop(1, "rgba(58,50,42,0)");
      g.fillStyle = lg;
      g.fillRect(x, py(y), 1 + hash(i, y, 5) * 3, len);
    }
  }
  // rain streaks off each window sill corner
  for (let n = 0; n < holes.length; n++) {
    const h = holes[n];
    const top = py(h.y - h.h / 2);
    for (let i = 0; i < 7; i++) {
      const x = px(h.x - h.w / 2 + hash(n, i, 9) * h.w);
      const len = 30 + hash(n, i, 10) * 110;
      const lg = g.createLinearGradient(0, top, 0, top + len);
      lg.addColorStop(0, "rgba(64,56,48,0.42)");
      lg.addColorStop(1, "rgba(64,56,48,0)");
      g.fillStyle = lg;
      g.fillRect(x, top, 1.5 + hash(n, i, 11) * 4, len);
    }
  }
  // rising damp: irregular tide line, darker toward the street
  g.beginPath();
  g.moveTo(0, S);
  for (let x = 0; x <= S; x += 8) g.lineTo(x, py(0.85 + 0.35 * hash(x, 1, 12) + 0.25 * Math.sin(x * 0.03)));
  g.lineTo(S, S);
  g.closePath();
  const dg = g.createLinearGradient(0, py(1.5), 0, S);
  dg.addColorStop(0, "rgba(84,76,66,0.35)");
  dg.addColorStop(1, "rgba(62,54,46,0.85)");
  g.fillStyle = dg;
  g.fill();
  return toTex(c, false);
}

function makeWash() {
  const c = canvas(128, 128);
  const g = c.getContext("2d");
  g.fillStyle = "rgb(0,0,0)";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgb(40,40,40)";
  g.fillRect(70, 30, 28, 40);
  g.fillRect(20, 90, 36, 18);
  return toTex(c, false);
}

function signTex() {
  const c = canvas(512, 128);
  const g = c.getContext("2d");
  g.fillStyle = "#14110f";
  g.fillRect(0, 0, 512, 128);
  g.strokeStyle = "#3a2418";
  g.lineWidth = 8;
  g.strokeRect(4, 4, 504, 120);
  g.fillStyle = "#f4f1ea";
  g.font = "600 46px 'Nirmala UI', Mangal, sans-serif";
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.fillText("A&S किराना स्टोर", 256, 46);
  const chips = ["#c4382e", "#e2c24a", "#f2f2f0", "#d24a28", "#f0d24a", "#efece6"];
  for (let i = 0; i < chips.length; i++) {
    g.fillStyle = chips[i];
    g.fillRect(158 + i * 34, 96, 22, 12);
  }
  return toTex(c, true);
}

function packetTex() {
  const c = canvas(256, 64);
  const g = c.getContext("2d");
  const cols = ["#e23b6a", "#3c9a45", "#f0d23a", "#ef7a22", "#f4f4f2", "#1f6b4a", "#d4a24a", "#c4323a"];
  for (let i = 0; i < 8; i++) {
    g.fillStyle = cols[i];
    g.fillRect(i * 32, 0, 32, 64);
    g.fillStyle = "rgba(255,255,255,0.35)";
    g.fillRect(i * 32 + 6, 8, 18, 6);
    g.fillStyle = "rgba(0,0,0,0.25)";
    g.fillRect(i * 32 + 4, 40, 22, 10);
  }
  const t = toTex(c, true);
  t.wrapS = THREE.RepeatWrapping;
  return t;
}

function clothTex() {
  const c = canvas(128, 128);
  const g = c.getContext("2d");
  g.fillStyle = "#e7e2d8";
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = "rgba(186,174,162,0.35)";
  for (let i = 0; i < 7; i++) g.fillRect(8 + i * 16, 0, 2, 128);
  g.fillStyle = "rgba(214,176,172,0.55)";
  g.fillRect(86, 78, 28, 36);
  return toTex(c, true);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.7, p.y);
  if (p.z < 0.55) {
    ao *= 1.0 - 0.45 * smoothstep(0.7, 0.0, 2.7 - p.y);
    ao *= 1.0 - 0.28 * smoothstep(0.4, 0.0, 5.2 - p.y);
  }
  // shop recess: light falls off with depth and under the lintel
  if (p.z > 0.06 && p.y < 2.32 && p.x > 5.0 && p.x < 8.24) {
    ao *= mix(1.0, 0.38, smoothstep(0.06, 0.66, p.z));
    ao *= 0.6 + 0.4 * smoothstep(2.3, 1.4, p.y);
  }
  return ao;
}
`;

const GRIME_GLSL = `
float gax = abs(vHouseN.x);
float gay = abs(vHouseN.y);
float gaz = abs(vHouseN.z);
float gu = (gax > gaz && gax > gay) ? clamp(vHousePos.z / 6.5, 0.0, 1.0) : clamp(vHousePos.x / 8.5, 0.0, 1.0);
float gv = clamp(vHousePos.y / 9.85, 0.0, 1.0);
float gwash = (gaz > gax && gaz > gay) ? texture2D(washMap, vec2(gu, gv)).r : 0.0;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.86, 0.82, 0.76), gwash * 0.5);
diffuseColor.rgb *= texture2D(grimeMap, vec2(gu, gv)).rgb * 1.45;
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
    if (grime) {
      shader.uniforms.grimeMap = { value: grime };
      shader.uniforms.washMap = { value: grime.userData.wash };
    }
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;\nvarying vec3 vHouseN;")
      .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvHouseN = objectNormal;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    let frag = shader.fragmentShader.replace("#include <common>", "#include <common>\n" + (grime ? "uniform sampler2D grimeMap;\nuniform sampler2D washMap;\n" : "") + AO_GLSL);
    if (grime) frag = frag.replace("#include <color_fragment>", "#include <color_fragment>\n" + GRIME_GLSL);
    frag = frag.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
    shader.fragmentShader = frag;
  };
  mat.customProgramCacheKey = function () { return "house016-" + key; };
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
    envMapIntensity: o.env == null ? 0.22 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.55 : o.ns, o.ns == null ? 0.55 : o.ns);
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
    const k = 0.93 + 0.07 * hash(p.getX(i) * 1.7, p.getY(i) * 1.3, p.getZ(i) * 1.7);
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv) g.setAttribute("uv2", g.attributes.uv);
}

export function createHouse016() {
  const root = new THREE.Group();
  root.name = "house-016";

  const shop = { x: 6.62, y: 1.18, w: 3.15, h: 2.22 };
  const frontHoles = [
    shop,
    { x: 6.72, y: 4.22, w: 1.18, h: 1.28 },
    { x: 2.35, y: 4.28, w: 0.72, h: 1.12 },
    { x: 6.55, y: 6.38, w: 1.52, h: 1.12 },
    { x: 2.4, y: 6.38, w: 0.82, h: 1.05 },
    { x: 7.05, y: 8.18, w: 0.58, h: 0.74 },
    { x: 5.55, y: 8.22, w: 0.52, h: 0.68 },
    { x: 2.45, y: 8.18, w: 0.52, h: 0.7 },
  ];
  const westHoles = [
    { x: 1.05, y: 4.25, w: 0.52, h: 1.05 },
    { x: 1.15, y: 6.4, w: 0.5, h: 1.0 },
    { x: 2.85, y: 6.35, w: 0.48, h: 0.95 },
    { x: 1.1, y: 8.18, w: 0.46, h: 0.68 },
  ];

  const grime = makeGrime(frontHoles);
  grime.userData.wash = makeWash();
  const plasterMaps = {
    diff: tex("plastered_wall_Diffuse.jpg", true, 0.42, 0.42),
    nor: tex("plastered_wall_nor_gl.jpg", false, 0.42, 0.42),
    arm: tex("plastered_wall_arm.jpg", false, 0.42, 0.42),
  };
  const woodMaps = {
    diff: tex("weathered_brown_planks_Diffuse.jpg", true, 1.1, 0.45),
    nor: tex("weathered_brown_planks_nor_gl.jpg", false, 1.1, 0.45),
    arm: tex("weathered_brown_planks_arm.jpg", false, 1.1, 0.45),
  };
  const mats = {
    plaster: pbr(plasterMaps, 0xe4dcd2, { ao: 0.34, ns: 0.45 }),
    plasterDark: pbr(plasterMaps, 0xc8bfb4, { ao: 0.36, ns: 0.4 }),
    concrete: pbr(plasterMaps, 0xb7aea4, { ao: 0.28 }),
    wood: pbr(woodMaps, 0x8a7564, { ao: 0.28 }),
    woodDark: pbr(woodMaps, 0x4a382e, { ao: 0.3 }),
    glass: new THREE.MeshStandardMaterial({ color: 0x3c4440, roughness: 0.55, metalness: 0, transparent: true, opacity: 0.94, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x100e0c, roughness: 0.95, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.6, metalness: 0.05, vertexColors: true }),
    lintel: new THREE.MeshStandardMaterial({ color: 0x4a5344, roughness: 0.8, metalness: 0, vertexColors: true }),
    goods: new THREE.MeshStandardMaterial({ map: packetTex(), color: 0xcdc6ba, roughness: 0.74, metalness: 0, side: THREE.DoubleSide, vertexColors: true }),
    cloth: new THREE.MeshStandardMaterial({ map: clothTex(), roughness: 0.92, metalness: 0, side: THREE.DoubleSide }),
  };
  for (const [name, mat] of Object.entries(mats)) {
    houseShader(mat, name, name === "plaster" || name === "plasterDark" ? grime : null);
  }

  const buckets = {};
  const loose = [];
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint, rx, ry, rz) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z, rx, ry, rz);
    if (name === "plaster" || name === "plasterDark" || name === "concrete") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
    }
  }
  function wallX(name, z0, z1, y0, y1, xFace, holes, tint) {
    for (const part of cells(z0, z1, y0, y1, holes || [])) {
      addBox(name, T, part.h, part.w, xFace, part.y, part.x, tint);
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

  wallZ("plaster", 0, W, 0, 2.62, 0, [shop]);
  wallZ("plaster", 0, W, 2.95, 5.15, 0, frontHoles.filter((h) => h.y < 5.2));
  wallZ("plaster", 0, W, 5.28, 7.25, 0, frontHoles.filter((h) => h.y > 5.5 && h.y < 7.2));
  wallZ("plaster", 0, W, 7.4, 9.2, 0, frontHoles.filter((h) => h.y > 7.5));
  addBox("concrete", W + 0.08, 0.1, 0.16, W / 2, 2.78, -0.04);
  addBox("concrete", W + 0.06, 0.08, 0.12, W / 2, 5.18, -0.03, [0.96, 0.95, 0.94]);
  addBox("concrete", W + 0.12, 0.14, 0.28, W / 2, 9.28, -0.08);
  addBox("concrete", W + 0.04, 0.42, 0.16, W / 2, 9.58, 0.02, [0.94, 0.93, 0.92]);

  wallX("plasterDark", 0, D, 0, 9.2, W - T / 2, westHoles, [0.96, 0.95, 0.94]);
  addBox("concrete", 0.16, 0.42, D + 0.04, W + 0.02, 9.58, D / 2);
  addBox("plasterDark", T, ROOF, D, T / 2, ROOF / 2, D / 2);
  addBox("plasterDark", W, ROOF, T, W / 2, ROOF / 2, D - T / 2);
  addBox("concrete", W - 0.3, 0.12, D - 0.4, W / 2, 9.7, D / 2 + 0.05);

  function frame(x, y, w, h, z) {
    addBox("woodDark", 0.06, h + 0.06, 0.07, x - w / 2, y, z, [0.85, 0.78, 0.7]);
    addBox("woodDark", 0.06, h + 0.06, 0.07, x + w / 2, y, z, [0.85, 0.78, 0.7]);
    addBox("wood", w + 0.08, 0.07, 0.09, x, y + h / 2, z - 0.01, [0.9, 0.82, 0.72]);
    addBox("wood", w + 0.06, 0.06, 0.1, x, y - h / 2, z - 0.02, [0.7, 0.62, 0.54]);
  }
  function sash(x, y, w, h) {
    frame(x, y, w, h, -0.02);
    addBox("woodDark", 0.035, h - 0.1, 0.03, x, y, -0.03);
    addBox("woodDark", w - 0.1, 0.035, 0.03, x, y, -0.03);
    addBox("glass", w - 0.12, h - 0.12, 0.015, x, y, 0.03);
  }
  sash(2.35, 4.28, 0.72, 1.12);
  sash(2.4, 6.38, 0.82, 1.05);
  sash(7.05, 8.18, 0.58, 0.74);
  sash(5.55, 8.22, 0.52, 0.68);
  sash(2.45, 8.18, 0.52, 0.7);
  addBox("concrete", 1.15, 0.06, 0.32, 2.4, 6.98, -0.12);

  sash(6.55, 6.38, 1.52, 1.12);
  addBox("woodDark", 0.03, 1.0, 0.025, 6.55 - 0.38, 6.38, -0.035);
  addBox("woodDark", 0.03, 1.0, 0.025, 6.55 + 0.38, 6.38, -0.035);
  addBox("wood", 0.34, 0.95, 0.03, 7.15, 6.42, -0.08, [0.75, 0.68, 0.58], 0, 0.55, 0);

  addBox("concrete", 0.07, 1.36, 0.08, 6.72 - 0.62, 4.22, -0.03, [1.15, 1.12, 1.08]);
  addBox("concrete", 0.07, 1.36, 0.08, 6.72 + 0.62, 4.22, -0.03, [1.15, 1.12, 1.08]);
  addBox("concrete", 1.32, 0.07, 0.08, 6.72, 4.88, -0.03, [1.12, 1.1, 1.06]);
  addBox("concrete", 1.28, 0.07, 0.1, 6.72, 3.56, -0.04, [1.05, 1.02, 0.98]);
  addBox("dark", 1.02, 1.12, 0.2, 6.72, 4.22, 0.16);
  addBox("concrete", 0.5, 1.16, 0.035, 6.15, 4.22, -0.07, [1.12, 1.08, 1.04], 0, -0.85, 0);
  addBox("concrete", 0.5, 1.16, 0.035, 7.28, 4.22, -0.07, [1.1, 1.06, 1.02], 0, 0.8, 0);

  function westSash(z, y, w, h) {
    const x = W + 0.02;
    addBox("woodDark", 0.07, h + 0.05, 0.06, x, y, z - w / 2, [0.85, 0.78, 0.7]);
    addBox("woodDark", 0.07, h + 0.05, 0.06, x, y, z + w / 2, [0.85, 0.78, 0.7]);
    addBox("wood", 0.08, 0.06, w + 0.06, x, y + h / 2, z);
    addBox("wood", 0.09, 0.055, w + 0.04, x, y - h / 2, z);
    addBox("glass", 0.015, h - 0.1, w - 0.1, x - 0.02, y, z);
    addBox("woodDark", 0.02, h - 0.12, 0.03, x + 0.01, y, z);
  }
  westSash(1.05, 4.25, 0.52, 1.05);
  westSash(1.15, 6.4, 0.5, 1.0);
  westSash(2.85, 6.35, 0.48, 0.95);
  westSash(1.1, 8.18, 0.46, 0.68);

  // shop room: back wall, sides, ceiling and floor instead of a solid black block
  addBox("woodDark", shop.w - 0.08, shop.h - 0.06, 0.04, shop.x, shop.y, 0.68, [0.55, 0.5, 0.45]);
  addBox("dark", shop.w - 0.08, 0.04, 0.55, shop.x, 2.27, 0.42);
  addBox("plasterDark", 0.04, shop.h - 0.06, 0.55, shop.x - shop.w / 2 + 0.06, shop.y, 0.42, [0.6, 0.56, 0.52]);
  addBox("plasterDark", 0.04, shop.h - 0.06, 0.55, shop.x + shop.w / 2 - 0.06, shop.y, 0.42, [0.6, 0.56, 0.52]);
  addBox("concrete", shop.w - 0.08, 0.04, 0.6, shop.x, 0.09, 0.4, [0.62, 0.58, 0.54]);
  addBox("woodDark", shop.w + 0.06, 0.07, 0.06, shop.x, 2.32, -0.02, [0.55, 0.48, 0.4]);
  addBox("woodDark", 0.07, 2.28, 0.07, shop.x - shop.w / 2, 1.16, -0.02, [0.5, 0.44, 0.38]);
  addBox("woodDark", 0.07, 2.28, 0.07, shop.x + shop.w / 2, 1.16, -0.02, [0.5, 0.44, 0.38]);
  addBox("concrete", 0.22, 0.16, 0.12, 8.15, 3.35, -0.08, [0.85, 0.84, 0.82]);

  const sign = new THREE.BoxGeometry(2.15, 0.42, 0.045);
  sign.translate(6.55, 2.62, -0.16);
  looseMesh(sign, new THREE.MeshStandardMaterial({ map: signTex(), roughness: 0.6, metalness: 0 }), "sign");

  function strip(x, top, len, col) {
    const g = new THREE.PlaneGeometry(0.11, len, 1, 6);
    const p = g.attributes.position;
    const uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      const v = uv.getY(i);
      uv.setXY(i, (col + 0.15) / 8, v);
      p.setZ(i, 0.02 * Math.sin((1 - v) * Math.PI * 3 + col));
    }
    g.computeVertexNormals();
    add("goods", place(g, x, top - len / 2, -0.05, 0, Math.PI, (hash(col, 2, 1) - 0.5) * 0.15));
  }
  // packet strips hang thick at the doorway like the photo, with a second row behind
  for (let i = 0; i < 20; i++) {
    strip(5.2 + i * 0.145 + hash(i, 4, 2) * 0.04, 2.12, 0.42 + hash(i, 3, 2) * 0.5, Math.floor(hash(i, 5, 2) * 8));
  }
  addBox("wire", shop.w - 0.1, 0.025, 0.025, shop.x, 2.13, -0.05);
  for (let i = 0; i < 12; i++) {
    const g = new THREE.PlaneGeometry(0.2, 0.55 + hash(i, 6, 2) * 0.3, 1, 1);
    const uv = g.attributes.uv;
    const col = Math.floor(hash(i, 7, 2) * 8);
    for (let k = 0; k < uv.count; k++) uv.setX(k, (col + 0.2 + uv.getX(k) * 0.6) / 8);
    add("goods", place(g, 5.25 + i * 0.24, 1.75 - hash(i, 6, 2) * 0.15, 0.28, 0, Math.PI + (hash(i, 8, 2) - 0.5) * 0.5, 0));
  }
  function packet(w, h, d, x, y, z, col) {
    const g = place(boxGeo(w, h, d), x, y, z);
    const uv = g.attributes.uv;
    for (let k = 0; k < uv.count; k++) uv.setX(k, (col + 0.2 + uv.getX(k) * 0.6) / 8);
    add("goods", g, [0.8, 0.8, 0.8]);
  }
  for (const y of [0.55, 1.05, 1.5]) {
    addBox("wood", shop.w - 0.2, 0.03, 0.24, shop.x, y, 0.55, [0.6, 0.52, 0.44]);
    let x = shop.x - shop.w / 2 + 0.18;
    for (let i = 0; x < shop.x + shop.w / 2 - 0.2; i++) {
      const w = 0.1 + hash(i, y, 1) * 0.14;
      const h = 0.14 + hash(i, y, 2) * 0.22;
      packet(w, h, 0.14, x + w / 2, y + 0.015 + h / 2, 0.55, Math.floor(hash(i, y, 3) * 8));
      x += w + 0.015;
    }
  }
  addBox("woodDark", 0.9, 0.78, 0.4, 5.6, 0.48, 0.3, [0.7, 0.62, 0.54]);
  for (let i = 0; i < 5; i++) packet(0.14, 0.2, 0.12, 5.3 + i * 0.16, 0.97, 0.22, (i * 3) % 8);

  const cloth = new THREE.PlaneGeometry(1.35, 1.55, 8, 10);
  const cp = cloth.attributes.position;
  for (let i = 0; i < cp.count; i++) {
    const u = cp.getX(i) / 1.35 + 0.5;
    const v = cp.getY(i) / 1.55 + 0.5;
    cp.setZ(i, Math.sin(u * Math.PI) * 0.05 * (1 - v) + Math.sin(v * 6.2) * 0.02);
    cp.setX(i, cp.getX(i) + (1 - v) * 0.18);
    cp.setY(i, cp.getY(i) - (1 - v) * 0.08);
  }
  cloth.computeVertexNormals();
  place(cloth, 7.15, 3.35, -0.16, 0.04, Math.PI, -0.06);
  looseMesh(cloth, mats.cloth, "cloth");

  function span(a, b, droop, rad, seed) {
    const pts = [];
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 8, rad, 4, false));
  }
  const ties = [[0.3, 3.4], [2.6, 3.55], [4.8, 3.3], [6.7, 3.5], [8.2, 3.35]];
  for (let k = 0; k < ties.length - 1; k++) {
    for (let i = 0; i < 4; i++) {
      const seed = k * 9 + i;
      span(
        [ties[k][0], ties[k][1] + hash(seed, 1, 1) * 0.2, -0.12],
        [ties[k + 1][0], ties[k + 1][1] + hash(seed, 2, 2) * 0.2, -0.18],
        0.08 + hash(seed, 3, 3) * 0.28,
        i === 0 ? 0.012 : 0.005,
        seed,
      );
    }
  }
  span([0.4, 6.2, -0.08], [8.1, 5.6, -0.14], 0.35, 0.006, 11);
  span([1.2, 7.8, -0.06], [7.4, 8.4, -0.1], 0.22, 0.005, 12);
  span([8.3, 3.4, -0.1], [8.45, 7.6, 1.2], 0.3, 0.006, 13);
  span([8.2, 4.8, 0.4], [8.5, 8.0, 3.2], 0.25, 0.005, 14);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = name !== "glass" && name !== "goods";
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
  root.userData.id = "016";
  return root;
}
