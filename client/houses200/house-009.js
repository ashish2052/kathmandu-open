// House 009. Kampukot Marg, OSM way 1416284448, edge 0, 5.19 m.
// Spec: research/houses200/009/design.md
// Origin: front-left ground corner. +X along the street toward the east, +Y up, +Z into the lot.
// Street face is z = 0. The lane is negative Z. x = 0 is west (photo-left). x = 5.19 is east.
// The still is pano hk9gkOyEZx-LvL7L4WolBQ, yaw 300, pitch looking up.
// One storey: dark green dado, off-white plaster, sage corrugated roof, a flag string.
// No door, no window, no sign words. The red board on the row was not readable and is not on this face.

import * as THREE from "three";
import { mergeGeometries, mergeVertices } from "three/addons/utils/BufferGeometryUtils.js";

const W = 5.19;
const D = 6.11;
const T = 0.22;
const DADO = 1.55;
const WALL = 3.38;
const RIDGE = 4.85;

const OVERCAST = { dir: 0.6, spec: 0.3, ind: 1.3 };

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
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function place(g, x, y, z, rx, ry, rz) {
  g.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx || 0, ry || 0, rz || 0)),
    new THREE.Vector3(1, 1, 1),
  ));
  return g;
}

const AO_GLSL = `
varying vec3 vHousePos;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 0.82 + 0.18 * smoothstep(0.0, 0.4, p.y);
  if (p.z < 0.35) {
    ao *= 1.0 - 0.4 * smoothstep(0.55, 0.0, ${WALL.toFixed(2)} - p.y);
    ao *= 1.0 - 0.18 * smoothstep(0.25, 0.0, ${DADO.toFixed(2)} - p.y);
  }
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
      .replace("#include <common>", "#include <common>\nvarying vec3 vHousePos;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvHousePos = transformed;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\n" + AO_GLSL)
      .replace("#include <lights_fragment_end>", "#include <lights_fragment_end>\n" + LIGHT_GLSL);
  };
  mat.customProgramCacheKey = function () { return "house009-" + key; };
  return mat;
}

function plasterTex() {
  const w = 1024;
  const h = 512;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(9009);
  g.fillStyle = "#aaa599";
  g.fillRect(0, 0, w, h);
  // Broad uneven patches: old lime coats, not one flat paint.
  for (let i = 0; i < 26; i++) {
    const x = r() * w;
    const y = r() * h;
    const rad = 60 + r() * 160;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, r() > 0.5 ? "rgba(120,112,98,0.08)" : "rgba(235,230,218,0.07)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 9000; i++) {
    g.fillStyle = r() > 0.5 ? "rgba(90,82,72,0.05)" : "rgba(255,250,242,0.04)";
    g.fillRect(r() * w, r() * h, 2, 2);
  }
  for (let i = 0; i < 18; i++) {
    const x = r() * w;
    const y = r() * h * 0.35;
    const len = 40 + r() * 180;
    const gr = g.createLinearGradient(x, y, x, y + len);
    gr.addColorStop(0, "rgba(70,64,56,0.28)");
    gr.addColorStop(1, "rgba(70,64,56,0)");
    g.fillStyle = gr;
    g.fillRect(x, y, 2 + r() * 7, len);
  }
  // Grey soot band under the eave, darkest at the wall head.
  const head = g.createLinearGradient(0, 0, 0, 70);
  head.addColorStop(0, "rgba(72,68,62,0.42)");
  head.addColorStop(1, "rgba(72,68,62,0)");
  g.fillStyle = head;
  g.fillRect(0, 0, w, 70);
  // Dirt gathers on the dado line. The still is a clean wall, not a speckled one.
  const band = g.createLinearGradient(0, h - 36, 0, h);
  band.addColorStop(0, "rgba(70,78,68,0)");
  band.addColorStop(1, "rgba(60,70,58,0.35)");
  g.fillStyle = band;
  g.fillRect(0, h - 36, w, 36);
  return toTex(c);
}

function dadoTex() {
  const w = 1024;
  const h = 256;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(9011);
  g.fillStyle = "#12231a";
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4000; i++) {
    g.fillStyle = r() > 0.6 ? "rgba(20,28,22,0.18)" : "rgba(120,150,120,0.05)";
    g.fillRect(r() * w, r() * h, 2, 2);
  }
  const damp = g.createLinearGradient(0, h * 0.55, 0, h);
  damp.addColorStop(0, "rgba(20,24,18,0)");
  damp.addColorStop(1, "rgba(18,22,16,0.45)");
  g.fillStyle = damp;
  g.fillRect(0, h * 0.55, w, h * 0.45);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = "rgba(210,206,190," + (0.04 + r() * 0.06).toFixed(2) + ")";
    g.fillRect(r() * w, h * 0.15 + r() * h * 0.5, 18 + r() * 40, 2 + r() * 3);
  }
  return toTex(c);
}

function roofTex() {
  const w = 512;
  const h = 256;
  const c = canvas(w, h);
  const g = c.getContext("2d");
  const r = rng(9013);
  g.fillStyle = "#b4d4a8";
  g.fillRect(0, 0, w, h);
  const ribs = 36;
  for (let i = 0; i < ribs; i++) {
    const x = (i + 0.5) * (w / ribs);
    g.fillStyle = i % 2 ? "rgba(50,70,46,0.16)" : "rgba(255,255,245,0.08)";
    g.fillRect(x, 0, w / ribs * 0.45, h);
  }
  for (let i = 0; i < 30; i++) {
    g.fillStyle = "rgba(90,70,50," + (0.05 + r() * 0.08).toFixed(2) + ")";
    g.fillRect(r() * w, r() * h, 8 + r() * 20, 3);
  }
  return toTex(c);
}

function slope(x0, x1, z0, y0, z1, y1) {
  const sx = 42;
  const sz = 10;
  const g = new THREE.PlaneGeometry(1, 1, sx, sz);
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) + 0.5;
    const v = p.getY(i) + 0.5;
    const x = x0 + (x1 - x0) * u;
    const z = z0 + (z1 - z0) * v;
    const y = y0 + (y1 - y0) * v;
    const rib = Math.sin(u * 34 * Math.PI * 2) * 0.022;
    p.setXYZ(i, x, y + rib, z);
    uv.setXY(i, u * 8, v * 2);
  }
  g.computeVertexNormals();
  return g;
}

export function createHouse009() {
  const root = new THREE.Group();
  root.name = "house-009";
  const buckets = {};
  const mats = {
    plaster: houseShader(new THREE.MeshStandardMaterial({
      color: 0xdcd7cc, map: plasterTex(), roughness: 0.92, metalness: 0,
    }), "plaster"),
    dado: houseShader(new THREE.MeshStandardMaterial({
      color: 0xffffff, map: dadoTex(), roughness: 0.88, metalness: 0,
    }), "dado"),
    roof: houseShader(new THREE.MeshStandardMaterial({
      color: 0xffffff, map: roofTex(), roughness: 0.62, metalness: 0.08, side: THREE.DoubleSide,
    }), "roof"),
    dark: houseShader(new THREE.MeshStandardMaterial({
      color: 0x2a2622, roughness: 0.9, metalness: 0,
    }), "dark"),
    flag: houseShader(new THREE.MeshStandardMaterial({
      color: 0xffffff, roughness: 0.84, metalness: 0, side: THREE.DoubleSide, vertexColors: true,
    }), "flag"),
    wire: houseShader(new THREE.MeshStandardMaterial({
      color: 0x3a342e, roughness: 0.7, metalness: 0.15,
    }), "wire"),
  };

  function add(name, g) {
    (buckets[name] = buckets[name] || []).push(g);
  }
  function addBox(name, w, h, d, x, y, z) {
    add(name, place(new THREE.BoxGeometry(w, h, d), x, y, z));
  }

  // South wall. Dado stands 3 cm proud of the plaster so the colour break casts a line.
  addBox("dado", W, DADO, T + 0.03, W / 2, DADO / 2, (T + 0.03) / 2 - 0.03);
  addBox("plaster", W, WALL - DADO, T, W / 2, (WALL + DADO) / 2, T / 2);
  addBox("dark", W, 0.09, 0.16, W / 2, DADO + 0.02, -0.05);

  // West and east returns, and the north wall. No openings: the still does not show any.
  const sideD = D - T;
  addBox("dado", T, DADO, sideD, T / 2, DADO / 2, T / 2 + sideD / 2);
  addBox("plaster", T, WALL - DADO, sideD, T / 2, (WALL + DADO) / 2, T / 2 + sideD / 2);
  addBox("dado", T, DADO, sideD, W - T / 2, DADO / 2, T / 2 + sideD / 2);
  addBox("plaster", T, WALL - DADO, sideD, W - T / 2, (WALL + DADO) / 2, T / 2 + sideD / 2);
  addBox("dado", W - T * 2, DADO, T, W / 2, DADO / 2, D - T / 2);
  addBox("plaster", W - T * 2, WALL - DADO, T, W / 2, (WALL + DADO) / 2, D - T / 2);

  // Gable ends. Grok left them open; the sky showed through under the ridge.
  const gable = new THREE.Shape();
  gable.moveTo(0, WALL - 0.02);
  gable.lineTo(D, WALL - 0.02);
  gable.lineTo(2.55, RIDGE - 0.06);
  gable.closePath();
  for (const gx of [T, W]) {
    const g = new THREE.ExtrudeGeometry(gable, { depth: T, bevelEnabled: false });
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 5, uv.getY(i) / 5);
    add("plaster", mergeVertices(place(g, gx, 0, 0, 0, -Math.PI / 2, 0)));
  }

  // Roof sits on the wall. Front slope falls toward the lane. Ribs run down the slope.
  const front = slope(-0.16, W + 0.16, -0.26, WALL - 0.16, 2.55, RIDGE);
  const back = slope(-0.12, W + 0.12, 2.55, RIDGE, D + 0.18, WALL - 0.06);
  add("roof", front);
  add("roof", back);
  addBox("roof", W + 0.36, 0.08, 0.18, W / 2, RIDGE + 0.03, 2.55);
  // Dark verge boards under the sheet edge at both gables, so the roof line casts a shadow.
  for (const vx of [-0.12, W + 0.12]) {
    for (const [z0, y0, z1, y1] of [[-0.26, WALL - 0.16, 2.55, RIDGE], [2.55, RIDGE, D + 0.18, WALL - 0.06]]) {
      const len = Math.hypot(z1 - z0, y1 - y0);
      const ang = Math.atan2(y1 - y0, z1 - z0);
      add("dark", place(new THREE.BoxGeometry(0.05, 0.14, len), vx, (y0 + y1) / 2 - 0.08, (z0 + z1) / 2, -ang, 0, 0));
    }
  }
  // Soffit tucks into the wall top so the eave is not a floating bar.
  addBox("dark", W + 0.36, 0.06, 0.4, W / 2, WALL - 0.05, -0.1);
  addBox("dark", W + 0.36, 0.12, 0.05, W / 2, WALL + 0.02, -0.32);

  // Flag string. up8 shows a dense run of small maroon and faded red cloths, no letters,
  // hung in swags a hand below the eave.
  const yString = WALL - 0.12;
  const sag = (t) => Math.sin(Math.PI * ((t * 2) % 1)) * 0.2;
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = i / 24;
    pts.push(new THREE.Vector3(0.15 + t * (W - 0.3), yString - sag(t), -0.2));
  }
  add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 0.006, 4, false));

  const flagColors = [
    [0.48, 0.1, 0.1], [0.62, 0.16, 0.14], [0.42, 0.08, 0.12],
    [0.7, 0.42, 0.4], [0.56, 0.14, 0.12], [0.66, 0.56, 0.48],
  ];
  const flagGeos = [];
  const nFlags = 30;
  for (let i = 0; i < nFlags; i++) {
    const t = (i + 0.5) / nFlags;
    const x = 0.15 + t * (W - 0.3);
    const y = yString - sag(t);
    const z = -0.2;
    const droop = 0.13 + hash(i, 2, 1) * 0.05;
    const half = 0.06;
    const lean = (hash(i, 7, 4) - 0.5) * 0.06;
    const g = new THREE.BufferGeometry();
    const col = flagColors[Math.floor(hash(i, 9, 2) * flagColors.length)];
    const fade = 0.78 + hash(i, 5, 3) * 0.22;
    g.setAttribute("position", new THREE.Float32BufferAttribute([
      x - half, y, z,
      x + half, y, z,
      x + lean, y - droop, z - 0.02,
    ], 3));
    const rgb = [];
    for (let k = 0; k < 3; k++) rgb.push(col[0] * fade, col[1] * fade, col[2] * fade);
    g.setAttribute("color", new THREE.Float32BufferAttribute(rgb, 3));
    g.computeVertexNormals();
    flagGeos.push(g);
  }
  add("flag", mergeGeometries(flagGeos, false));

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
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
  root.userData.id = "009";
  return root;
}
