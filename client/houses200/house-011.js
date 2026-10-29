// House 011. Lane north of Taleju, OSM way 907048004, edge 2, 6.58 m.
// Spec: research/houses200/011/design.md
// Origin: front-left ground corner. +X along the street, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z.
// After place.js yaw-180, photo-left (west plaster) is high X. Photo-right (carved doors) is low X.
// Proof still: pano LdR-irGn7y2pvvhZhBV-5w, yaw 334, pitch 6, fov 58. 4.79 m from the footprint.
// No lassi board, no shrine, no words. The paper on the door is blank.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 6.58;
const D = 5.98;
const T = 0.22;
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

function doorMap() {
  // Dark plank leaf, two sunk panels, chalky sun wear low down as on face_front_334.
  return canvasTex((g, w, h) => {
    const r = rng(11011);
    g.fillStyle = "#3e2a22";
    g.fillRect(0, 0, w, h);
    for (let p = 0; p < 3; p++) {
      const k = 0.9 + r() * 0.2;
      g.fillStyle = "rgba(" + Math.round(64 * k) + "," + Math.round(44 * k) + "," + Math.round(36 * k) + ",0.9)";
      g.fillRect(p * w / 3, 0, w / 3, h);
      g.fillStyle = "rgba(14,8,6,0.8)";
      g.fillRect(p * w / 3, 0, 2, h);
    }
    for (let i = 0; i < 2600; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(16,8,6,0.3)" : "rgba(110,84,68,0.14)";
      g.fillRect(r() * w, r() * h, 1 + r() * 1.5, 6 + r() * 30);
    }
    function panel(x, y, pw, ph) {
      g.fillStyle = "rgba(20,12,9,0.45)";
      g.fillRect(x, y, pw, ph);
      g.fillStyle = "rgba(10,6,4,0.75)";
      g.fillRect(x, y, pw, 6);
      g.fillRect(x, y, 5, ph);
      g.fillStyle = "rgba(150,124,104,0.35)";
      g.fillRect(x, y + ph - 4, pw, 4);
      g.fillRect(x + pw - 3, y, 3, ph);
      g.fillStyle = "rgba(70,50,40,0.5)";
      g.fillRect(x + 14, y + 14, pw - 28, ph - 28);
    }
    panel(22, h * 0.06, w - 44, h * 0.38);
    panel(22, h * 0.55, w - 44, h * 0.34);
    // Pale chalky wear, heavier toward the sill, blurred so it reads as bleaching not spots.
    g.filter = "blur(7px)";
    for (let i = 0; i < 90; i++) {
      const y = h * (0.4 + 0.6 * Math.pow(r(), 0.5));
      g.fillStyle = "rgba(178,166,152," + (0.05 + r() * 0.1).toFixed(2) + ")";
      g.fillRect(r() * w - 10, y, 10 + r() * 50, 4 + r() * 18);
    }
    g.filter = "none";
    for (let i = 0; i < 10; i++) {
      g.fillStyle = "rgba(170,160,148,0.07)";
      g.fillRect(r() * w, h * (0.3 + r() * 0.5), 1 + r() * 2, 20 + r() * 60);
    }
    const damp = g.createLinearGradient(0, h * 0.88, 0, h);
    damp.addColorStop(0, "rgba(30,22,18,0)");
    damp.addColorStop(1, "rgba(30,22,18,0.55)");
    g.fillStyle = damp;
    g.fillRect(0, h * 0.88, w, h * 0.12);
  }, 256, 512);
}

function friezeMap() {
  // Carved lintel band: repeating rosettes between scroll leaves, cut dark.
  return canvasTex((g, w, h) => {
    const r = rng(11033);
    g.fillStyle = "#3a2820";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(12,6,4,0.35)" : "rgba(100,76,60,0.18)";
      g.fillRect(r() * w, r() * h, 3 + r() * 10, 1 + r());
    }
    g.fillStyle = "rgba(10,5,4,0.8)";
    g.fillRect(0, 0, w, 10);
    g.fillRect(0, h - 10, w, 10);
    const step = 64;
    for (let x = step / 2; x < w; x += step) {
      g.fillStyle = "rgba(8,4,3,0.6)";
      g.beginPath();
      g.arc(x, h / 2, 26, 0, 6.3);
      g.fill();
      g.fillStyle = "rgba(78,56,44,0.9)";
      for (let k = 0; k < 8; k++) {
        const a = k * Math.PI / 4;
        g.beginPath();
        g.ellipse(x + Math.cos(a) * 13, h / 2 + Math.sin(a) * 13, 9, 4, a, 0, 6.3);
        g.fill();
      }
      g.fillStyle = "rgba(90,68,54,0.9)";
      g.beginPath();
      g.arc(x, h / 2, 6, 0, 6.3);
      g.fill();
      g.strokeStyle = "rgba(10,5,4,0.85)";
      g.lineWidth = 5;
      g.beginPath();
      g.moveTo(x + 30, h * 0.75);
      g.bezierCurveTo(x + 36, h * 0.2, x + 28, h * 0.2, x + 34, h * 0.5);
      g.stroke();
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = "rgba(170,156,140,0.1)";
      g.fillRect(r() * w, r() * h, 10 + r() * 40, 3 + r() * 8);
    }
  }, 1024, 128);
}

function latticeMap() {
  return canvasTex((g, w, h) => {
    const r = rng(11027);
    g.fillStyle = "#30201a";
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() > 0.6 ? "rgba(20,10,8,0.4)" : "rgba(90,60,46,0.25)";
      g.fillRect(r() * w, r() * h, 2, 3);
    }
    g.strokeStyle = "#1a0e0c";
    g.lineWidth = 3;
    const step = 14;
    for (let x = 8; x < w; x += step) {
      g.beginPath();
      g.moveTo(x, 8);
      g.lineTo(x, h - 8);
      g.stroke();
    }
    for (let y = 8; y < h; y += step) {
      g.beginPath();
      g.moveTo(8, y);
      g.lineTo(w - 8, y);
      g.stroke();
    }
    g.strokeStyle = "#6a4838";
    g.lineWidth = 8;
    g.strokeRect(6, 6, w - 12, h - 12);
    // A shallow floral band, no letters.
    g.strokeStyle = "#7a5844";
    g.lineWidth = 2;
    g.beginPath();
    for (let x = 20; x < w - 10; x += 28) {
      g.moveTo(x, 22);
      g.quadraticCurveTo(x + 10, 8, x + 20, 22);
      g.quadraticCurveTo(x + 10, 36, x, 22);
    }
    g.stroke();
  }, 512, 256);
}

function grimeMaps() {
  const c = canvas(512, 512);
  const g = c.getContext("2d");
  const r = rng(11041);
  g.fillStyle = "#ffffff";
  g.fillRect(0, 0, 512, 512);
  g.fillStyle = "rgba(70,60,52,0.55)";
  g.fillRect(0, 400, 512, 112);
  for (let i = 0; i < 18; i++) {
    const x = r() * 512;
    g.fillStyle = "rgba(40,32,28,0.28)";
    g.fillRect(x, 80 + r() * 300, 3 + r() * 5, 40 + r() * 160);
  }
  for (let i = 0; i < 40; i++) {
    g.fillStyle = "rgba(90,70,60,0.2)";
    g.beginPath();
    g.ellipse(r() * 512, r() * 512, 6 + r() * 16, 4 + r() * 10, r() * 3, 0, 6.3);
    g.fill();
  }
  const wash = canvas(512, 512);
  const wg = wash.getContext("2d");
  wg.fillStyle = "#000";
  wg.fillRect(0, 0, 512, 512);
  wg.fillStyle = "rgba(255,255,255,0.85)";
  wg.fillRect(300, 40, 180, 220);
  const grime = toTex(c, false);
  grime.userData.wash = toTex(wash, false);
  grime.wrapS = grime.wrapT = THREE.ClampToEdgeWrapping;
  return grime;
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  float rec = smoothstep(0.02, 0.28, p.z) * (1.0 - step(1.1, p.z));
  ao *= 1.0 - 0.55 * rec;
  if (p.z < 0.6) {
    ao *= 1.0 - 0.35 * smoothstep(0.4, 0.0, 2.52 - p.y) * step(0.0, 2.52 - p.y);
    ao *= 1.0 - 0.28 * smoothstep(0.35, 0.0, 4.25 - p.y) * step(0.0, 4.25 - p.y);
    ao *= 1.0 - 0.4 * smoothstep(0.5, 0.0, 8.15 - p.y) * step(0.0, 8.15 - p.y);
  }
  ao *= 0.72 + 0.28 * smoothstep(0.0, 0.4, p.y);
  return ao;
}
`;

const GRIME_GLSL = `
float gax = abs(vHouseN.x);
float gay = abs(vHouseN.y);
float gaz = abs(vHouseN.z);
float gu = (gax > gaz && gax > gay) ? clamp(vHousePos.z / 6.2, 0.0, 1.0) : clamp(vHousePos.x / 6.7, 0.0, 1.0);
float gv = clamp(vHousePos.y / 9.0, 0.0, 1.0);
float gwash = (gaz > gax && gaz > gay && vHousePos.z < 0.4) ? texture2D(washMap, vec2(gu, gv)).r : 0.0;
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.78, 0.74, 0.68), gwash * 0.55);
diffuseColor.rgb *= mix(vec3(1.0), texture2D(grimeMap, vec2(gu, gv)).rgb, 0.65);
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
  mat.customProgramCacheKey = function () { return "house011-" + key; };
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
    roughness: o.rough == null ? 1 : o.rough,
    metalness: 0,
    aoMapIntensity: o.ao == null ? 0.35 : o.ao,
    vertexColors: true,
    envMapIntensity: o.env == null ? 0.28 : o.env,
  });
  if (maps.nor) m.normalScale = new THREE.Vector2(o.ns == null ? 0.8 : o.ns, o.ns == null ? 0.8 : o.ns);
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
    if (az >= ax && az >= ay) uv.setXY(i, p.getX(i) * 0.8, p.getY(i) * 0.8);
    else if (ax >= ay) uv.setXY(i, p.getZ(i) * 0.8, p.getY(i) * 0.8);
    else uv.setXY(i, p.getX(i) * 0.8, p.getZ(i) * 0.8);
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

export function createHouse011() {
  const root = new THREE.Group();
  root.name = "house-011";

  const plasterMaps = {
    diff: tex("plastered_wall_Diffuse.jpg", true, 0.55, 0.7),
    nor: tex("plastered_wall_nor_gl.jpg", false, 0.55, 0.7),
    arm: tex("plastered_wall_arm.jpg", false, 0.55, 0.7),
  };
  const woodMaps = {
    diff: tex("dark_wood_Diffuse.jpg", true, 0.8, 0.5),
    nor: tex("dark_wood_nor_gl.jpg", false, 0.8, 0.5),
    arm: tex("dark_wood_arm.jpg", false, 0.8, 0.5),
  };
  const brickMaps = {
    diff: tex("red_brick_Diffuse.jpg", true, 1.6, 0.45),
    nor: tex("red_brick_nor_gl.jpg", false, 1.6, 0.45),
    arm: tex("red_brick_arm.jpg", false, 1.6, 0.45),
  };
  const tileMaps = {
    diff: tex("clay_roof_tiles_02_Diffuse.jpg", true, 2.2, 1.4),
    nor: tex("clay_roof_tiles_02_nor_gl.jpg", false, 2.2, 1.4),
    arm: tex("clay_roof_tiles_02_arm.jpg", false, 2.2, 1.4),
  };
  const grime = grimeMaps();
  const doorTex = doorMap();
  const latticeTex = latticeMap();
  const friezeTex = friezeMap();
  friezeTex.wrapS = THREE.RepeatWrapping;
  friezeTex.repeat.set(2.4, 1);

  const mats = {
    plaster: pbr(plasterMaps, 0xe9e2d6, { ao: 0.4, ns: 0.7, env: 0.22 }),
    wood: pbr(woodMaps, 0x6a4036, { ao: 0.32, rough: 0.86 }),
    woodDark: pbr(woodMaps, 0x5c4036, { ao: 0.3, rough: 0.88 }),
    brick: pbr(brickMaps, 0xc4a090, { ao: 0.45, ns: 0.8 }),
    tile: pbr(tileMaps, 0xd5c4b8, { ao: 0.3, rough: 0.92 }),
    door: new THREE.MeshStandardMaterial({ map: doorTex, color: 0xffffff, roughness: 0.88, metalness: 0, vertexColors: true }),
    frieze: new THREE.MeshStandardMaterial({ map: friezeTex, color: 0xffffff, roughness: 0.9, metalness: 0, vertexColors: true }),
    lattice: new THREE.MeshStandardMaterial({ map: latticeTex, color: 0xffffff, roughness: 0.82, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x120c0b, roughness: 0.95, metalness: 0, vertexColors: true }),
    paper: new THREE.MeshStandardMaterial({ color: 0xd9d3c8, roughness: 0.9, metalness: 0, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.6, metalness: 0, vertexColors: true }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xd8d0b8, roughness: 0.4, metalness: 0, vertexColors: true }),
    iron: new THREE.MeshStandardMaterial({ color: 0x8a8580, roughness: 0.5, metalness: 0.4, vertexColors: true }),
  };
  for (const [name, mat] of Object.entries(mats)) {
    houseShader(mat, name, name === "plaster" ? grime : null);
  }

  const buckets = {};
  function add(name, g, tint) {
    paintVary(g, tint);
    (buckets[name] || (buckets[name] = [])).push(g);
  }
  function addBox(name, w, h, d, x, y, z, tint) {
    if (w <= 0.004 || h <= 0.004 || d <= 0.004) return;
    const g = place(boxGeo(w, h, d), x, y, z);
    if (name === "plaster" || name === "brick" || name === "tile") worldUV(g);
    add(name, g, tint);
  }
  function wallZ(name, x0, x1, y0, y1, zFace, holes, tint) {
    for (const part of cells(x0, x1, y0, y1, holes || [])) {
      addBox(name, part.w, part.h, T, part.x, part.y, zFace + T / 2, tint);
    }
  }

  const groundHoles = [{ x: 3.29, y: 1.14, w: 6.02, h: 2.16 }];
  const upperHoles = [
    { x: 1.85, y: 5.15, w: 0.92, h: 0.58 },
    { x: 1.55, y: 6.95, w: 0.52, h: 0.7 },
    { x: 3.25, y: 6.95, w: 0.46, h: 0.62 },
  ];

  wallZ("plaster", 0, W, 0, 8.15, 0, groundHoles.concat(upperHoles));
  addBox("plaster", T, 8.15, D, T / 2, 4.08, D / 2);
  addBox("plaster", T, 8.15, D, W - T / 2, 4.08, D / 2);
  addBox("plaster", W, 8.15, T, W / 2, 4.08, D - T / 2);

  // Carved lintel: a deep frieze between a plain beam and a stepped cornice, as on the close still.
  addBox("woodDark", 6.3, 0.12, 0.22, 3.29, 2.25, -0.05, [0.62, 0.54, 0.48]);
  const lintel = place(new THREE.PlaneGeometry(6.2, 0.3), 3.29, 2.46, -0.1, 0, Math.PI, 0);
  add("frieze", lintel, [0.9, 0.84, 0.78]);
  addBox("woodDark", 0.04, 0.3, 0.14, 0.2, 2.46, -0.06, [0.5, 0.44, 0.4]);
  addBox("woodDark", 0.04, 0.3, 0.14, 6.38, 2.46, -0.06, [0.5, 0.44, 0.4]);
  addBox("woodDark", 6.36, 0.06, 0.26, 3.29, 2.64, -0.1, [0.6, 0.52, 0.46]);
  addBox("wood", 6.44, 0.08, 0.34, 3.29, 2.71, -0.14, [0.5, 0.42, 0.36]);
  addBox("brick", 6.25, 0.1, 0.1, 3.29, 2.8, -0.05, [0.6, 0.52, 0.48]);

  // Interior shadow so the shutters never show daylight behind them.
  addBox("dark", 6.02, 2.2, 0.06, 3.29, 1.12, 0.22);
  addBox("woodDark", 6.1, 0.08, 0.16, 3.29, 0.04, -0.04, [0.45, 0.4, 0.36]);

  function leaf(x, y, w, h) {
    add("door", place(new THREE.BoxGeometry(w, h, 0.045), x, y, -0.02));
    const z = -0.052;
    const t = [0.55, 0.48, 0.42];
    addBox("woodDark", 0.045, h, 0.024, x - w / 2 + 0.022, y, z, t);
    addBox("woodDark", 0.045, h, 0.024, x + w / 2 - 0.022, y, z, t);
    addBox("woodDark", w, 0.05, 0.024, x, y + h / 2 - 0.025, z, t);
    addBox("woodDark", w, 0.07, 0.026, x, y - h / 2 + 0.035, z, [0.62, 0.56, 0.5]);
    addBox("woodDark", w, 0.06, 0.022, x, y - h * 0.005, z, t);
  }
  const leaves = 8;
  const run = 6.02;
  for (let i = 0; i < leaves; i++) leaf(0.28 + (i + 0.5) * (run / leaves), 1.13, run / leaves - 0.012, 2.14);

  function post(x) {
    // Square carved post: base block, shaft with cut rings, stepped capital.
    addBox("woodDark", 0.2, 0.16, 0.2, x, 0.08, -0.08, [0.55, 0.5, 0.46]);
    addBox("woodDark", 0.14, 2.0, 0.14, x, 1.16, -0.08, [0.7, 0.62, 0.56]);
    for (const y of [0.42, 0.9, 1.5]) addBox("wood", 0.17, 0.05, 0.17, x, y, -0.08, [0.5, 0.42, 0.36]);
    addBox("wood", 0.16, 0.3, 0.16, x, 0.6, -0.08, [0.58, 0.5, 0.44]);
    addBox("woodDark", 0.18, 0.06, 0.18, x, 2.12, -0.08, [0.6, 0.52, 0.46]);
    addBox("wood", 0.22, 0.08, 0.22, x, 2.18, -0.08, [0.5, 0.42, 0.36]);
  }
  post(0.16);
  post(6.42);

  // Blank torn scrap on a door. The still shows a pale rectangle and no readable word.
  add("paper", place(boxGeo(0.24, 0.2, 0.004), 2.55, 1.6, -0.066, 0, 0, 0.04), [0.93, 0.91, 0.87]);
  add("paper", place(boxGeo(0.12, 0.08, 0.004), 2.5, 1.47, -0.066, 0, 0, -0.1), [0.8, 0.78, 0.74]);

  // Flat bar with staples, padlock hanging at the end.
  addBox("iron", 2.6, 0.045, 0.012, 2.15, 0.88, -0.075, [0.85, 0.84, 0.82]);
  for (const x of [0.9, 2.15, 3.4]) addBox("iron", 0.04, 0.08, 0.03, x, 0.88, -0.07, [0.6, 0.58, 0.56]);
  addBox("iron", 0.065, 0.075, 0.03, 3.42, 0.8, -0.095, [1.0, 1.0, 0.98]);
  add("iron", place(new THREE.TorusGeometry(0.022, 0.005, 4, 10, Math.PI), 3.42, 0.84, -0.095), [0.75, 0.75, 0.72]);

  function bay(x0, x1, y0, y1, proj, open) {
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const bw = x1 - x0;
    const bh = y1 - y0;
    const zf = -proj;
    addBox("woodDark", bw + 0.12, 0.08, proj + 0.06, cx, y1, zf / 2, [0.8, 0.72, 0.64]);
    addBox("woodDark", bw + 0.08, 0.07, proj + 0.04, cx, y0, zf / 2, [0.7, 0.62, 0.54]);
    addBox("wood", 0.08, bh, proj, x0, cy, zf / 2, [0.65, 0.55, 0.48]);
    addBox("wood", 0.08, bh, proj, x1, cy, zf / 2, [0.65, 0.55, 0.48]);
    // Lattice sits behind the frame so the frame reads proud.
    const panel = place(new THREE.PlaneGeometry(bw - 0.16, bh - 0.16), cx, cy, zf + 0.02, 0, Math.PI, 0);
    add("lattice", panel);
    addBox("woodDark", bw - 0.2, 0.045, 0.04, cx, cy, zf - 0.01);
    if (open) {
      addBox("dark", open.w, open.h, 0.2, open.x, open.y, 0.08);
      addBox("wood", open.w + 0.08, 0.045, 0.05, open.x, open.y + open.h / 2, zf - 0.02);
      addBox("wood", open.w + 0.08, 0.045, 0.05, open.x, open.y - open.h / 2, zf - 0.02);
      addBox("wood", 0.045, open.h, 0.05, open.x - open.w / 2, open.y, zf - 0.02);
      addBox("wood", 0.045, open.h, 0.05, open.x + open.w / 2, open.y, zf - 0.02);
    }
    // Struts under the shelf.
    for (let i = 0; i < 4; i++) {
      const x = x0 + 0.25 + i * ((bw - 0.5) / 3);
      addBox("woodDark", 0.05, 0.16, 0.05, x, y0 - 0.08, zf * 0.65);
    }
  }
  bay(0.35, 4.15, 2.95, 4.35, 0.55, null);
  bay(0.45, 4.05, 4.55, 5.95, 0.42, { x: 1.85, y: 5.3, w: 0.78, h: 0.48 });

  // West plaster pier: one blind frame, not an opening.
  addBox("woodDark", 0.62, 0.78, 0.06, 5.45, 4.15, -0.04);
  addBox("wood", 0.46, 0.6, 0.04, 5.45, 4.15, -0.07, [0.55, 0.45, 0.38]);
  addBox("woodDark", 0.7, 0.05, 0.1, 5.45, 3.72, -0.06);

  function smallWin(x, y, w, h) {
    addBox("dark", w - 0.08, h - 0.08, 0.16, x, y, 0.06);
    addBox("woodDark", w + 0.06, 0.05, 0.06, x, y + h / 2, -0.03);
    addBox("woodDark", w + 0.06, 0.05, 0.06, x, y - h / 2, -0.03);
    addBox("woodDark", 0.05, h, 0.06, x - w / 2, y, -0.03);
    addBox("woodDark", 0.05, h, 0.06, x + w / 2, y, -0.03);
  }
  smallWin(1.55, 6.95, 0.52, 0.7);
  smallWin(3.25, 6.95, 0.46, 0.62);

  // Eave and a shallow tile slope toward the lane. Ridge is visual; the plate is the roof hold.
  addBox("woodDark", W + 0.28, 0.1, 0.55, W / 2, 8.22, -0.16);
  addBox("tile", W + 0.15, 0.06, D * 0.55, W / 2, 8.55, D * 0.22, [0.85, 0.8, 0.76]);
  const slope = place(boxGeo(W + 0.2, 0.06, D * 0.62), W / 2, 8.72, D * 0.18, -0.22, 0, 0);
  worldUV(slope);
  add("tile", slope, [0.9, 0.84, 0.78]);
  addBox("woodDark", W + 0.05, 0.08, 0.16, W / 2, 8.95, D * 0.48);

  function span(a, b, droop, rad) {
    const pts = [];
    for (let i = 0; i <= 7; i++) {
      const t = i / 7;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 7, rad, 3, false));
  }
  span([0.2, 6.4, -0.12], [6.3, 6.15, -0.1], 0.35, 0.008);
  span([0.4, 7.3, -0.08], [6.1, 7.05, -0.06], 0.22, 0.006);
  span([1.2, 5.6, -0.2], [5.4, 5.9, -0.16], 0.28, 0.005);
  span([0.3, 3.1, -0.18], [4.2, 2.7, -0.22], 0.18, 0.004);
  span([2.4, 2.58, -0.18], [2.42, 2.22, -0.2], 0.02, 0.004);
  add("bulb", place(new THREE.SphereGeometry(0.03, 8, 6), 2.42, 2.18, -0.2));

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.name = name;
    mesh.castShadow = true;
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
  root.userData.id = "011";
  return root;
}
