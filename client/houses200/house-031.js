// House 031. Chittadhar Marg, the west lane out of Asan Tol.
// OSM way 1029956838, edge 3, south face 5.75 m. Depth 5.53 m.
// Pano 3afo3kvo_nWjhvNJPwy3YA at 27.707662, 85.311766, 2.19 m off the footprint.
// Spec: research/houses200/031/design.md
// Origin: front-left of the MODEL, before place.js yaws it 180.
// After that yaw, x = 0 is east (photo-right, the narrow pale door)
// and x = 5.75 is west (photo-left, the green door). +Y up. +Z into the lot.
// The lane is negative Z. The shutter shop and the blue carved door are neighbours.
// Still: yaw 33, pitch 2, fov 100. Doors are shut. No shop was open on this face.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

const W = 5.75;
const D = 5.53;
const H = 4.05;
const T = 0.2;
const OVERCAST = { dir: 0.7, spec: 0.32, ind: 1.4 };

function hash(x, y, z) {
  const n = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function lin(hex) {
  const c = [((hex >> 16) & 255) / 255, ((hex >> 8) & 255) / 255, (hex & 255) / 255];
  return c.map((v) => Math.pow(v, 2.2));
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

function canvasTex(draw, w, h) {
  const c = canvas(w, h);
  draw(c.getContext("2d"), w, h);
  return toTex(c);
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

function plasterTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#a89884";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(78, 64, 54, 0.4)";
    g.fillRect(0, h * 0.9, w, h * 0.1);
    g.fillStyle = "rgba(62, 54, 48, 0.18)";
    g.fillRect(0, 0, w, h * 0.06);
    g.strokeStyle = "rgba(60, 44, 36, 0.55)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(w * 0.62, h * 0.18);
    g.lineTo(w * 0.66, h * 0.42);
    g.lineTo(w * 0.61, h * 0.7);
    g.stroke();
    g.strokeStyle = "rgba(80, 64, 54, 0.4)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(w * 0.22, h * 0.12);
    g.lineTo(w * 0.28, h * 0.38);
    g.stroke();
  }, 1024, 512);
}

function greenDoor() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#3d6e4a";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "#2c5038";
    g.fillRect(w / 2 - 4, 0, 8, h);
    for (let i = 1; i < 6; i++) {
      g.strokeStyle = "rgba(20, 40, 28, 0.35)";
      g.lineWidth = 3;
      g.beginPath();
      g.moveTo((w * i) / 6, 0);
      g.lineTo((w * i) / 6, h);
      g.stroke();
    }
    g.fillStyle = "rgba(20, 30, 22, 0.28)";
    g.fillRect(0, h * 0.82, w, h * 0.18);
    g.fillStyle = "#c6a24a";
    g.beginPath();
    g.arc(w * 0.28, h * 0.36, w * 0.045, 0, 6.3);
    g.fill();
  }, 512, 640);
}

function paleDoor() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#6d7a66";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(30, 26, 22, 0.28)";
    g.fillRect(0, h * 0.84, w, h * 0.16);
  }, 256, 320);
}

function narrowDoor() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#738270";
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(30, 26, 22, 0.25)";
    g.fillRect(0, h * 0.84, w, h * 0.16);
  }, 128, 320);
}

function latticeTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#120e0c";
    g.fillRect(0, 0, w, h);
    g.strokeStyle = "#d2bea2";
    g.lineWidth = 4;
    const step = 28;
    for (let x = -h; x < w + h; x += step) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x + h, h);
      g.stroke();
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x - h, h);
      g.stroke();
    }
  }, 256, 320);
}

function jaliTex() {
  return canvasTex((g, w, h) => {
    g.fillStyle = "#cbb89f";
    g.fillRect(0, 0, w, h);
    const nx = 10;
    const ny = 6;
    const gx = w / nx;
    const gy = h / ny;
    g.fillStyle = "#14110e";
    for (let j = 0; j < ny; j++) {
      for (let i = 0; i < nx; i++) {
        g.fillRect(i * gx + 3, j * gy + 3, gx - 6, gy - 6);
      }
    }
  }, 320, 180);
}

function poster(bg) {
  return canvasTex((g, w, h) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,0.18)";
    g.fillRect(0, 0, w, h * 0.35);
    g.fillStyle = "rgba(0,0,0,0.22)";
    g.fillRect(0, h * 0.78, w, h * 0.22);
  }, 180, 240);
}

const AO_GLSL = `
varying vec3 vHousePos;
varying vec3 vHouseN;
float houseAO(vec3 p) {
  float ao = 1.0;
  ao *= 1.0 - 0.42 * smoothstep(0.5, 0.0, p.y);
  ao *= 1.0 - 0.22 * smoothstep(0.18, 0.0, abs(p.y - 2.2));
  ao *= 1.0 - 0.3 * smoothstep(0.4, 0.0, 4.05 - p.y);
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
  mat.customProgramCacheKey = function () { return "house031-" + key; };
  return mat;
}

function paintVary(g, tint) {
  const rgb = tint || [1, 1, 1];
  const p = g.attributes.position;
  const c = new Float32Array(p.count * 3);
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    let k = 0.94 + 0.06 * hash(x * 1.7, y * 1.3, z * 1.7);
    if (y < 0.45) k *= 0.75 + 0.25 * (y / 0.45);
    if (y > 3.55) k *= 0.88;
    c[i * 3] = rgb[0] * k;
    c[i * 3 + 1] = rgb[1] * k;
    c[i * 3 + 2] = rgb[2] * k;
  }
  g.setAttribute("color", new THREE.BufferAttribute(c, 3));
  if (g.attributes.uv && !g.attributes.uv2) g.setAttribute("uv2", g.attributes.uv.clone());
}

function frontUV(g) {
  const p = g.attributes.position;
  const n = g.attributes.normal;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    if (n.getZ(i) < -0.6) uv.setXY(i, p.getX(i) / W, p.getY(i) / H);
    else uv.setXY(i, 0.04, 0.82);
  }
  return g;
}

export function createHouse031() {
  const root = new THREE.Group();
  root.name = "house-031";
  const mats = {
    plaster: new THREE.MeshStandardMaterial({ map: plasterTex(), color: 0xffffff, roughness: 0.94, metalness: 0, vertexColors: true }),
    side: new THREE.MeshStandardMaterial({ color: 0xa89078, roughness: 0.94, metalness: 0, vertexColors: true }),
    timber: new THREE.MeshStandardMaterial({ color: 0x5c4636, roughness: 0.86, metalness: 0, vertexColors: true }),
    sage: new THREE.MeshStandardMaterial({ color: 0x8d9a82, roughness: 0.84, metalness: 0, vertexColors: true }),
    dark: new THREE.MeshStandardMaterial({ color: 0x1a1612, roughness: 0.92, metalness: 0, vertexColors: true }),
    metal: new THREE.MeshStandardMaterial({ color: 0x8d9294, roughness: 0.45, metalness: 0.35, vertexColors: true }),
    wire: new THREE.MeshStandardMaterial({ color: 0x2a2622, roughness: 0.7, metalness: 0.05, vertexColors: true }),
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
    add(name, place(boxGeo(w, h, d), x, y, z), tint);
  }
  function looseMesh(geo, mat, key) {
    houseShader(mat, key);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    loose.push(mesh);
  }

  const green = { x: 4.84, y: 1.12, w: 1.46, h: 2.08 };
  const wide = { x: 2.81, y: 1.12, w: 1.76, h: 2.08 };
  const narrow = { x: 1.37, y: 1.12, w: 0.92, h: 2.08 };
  const jali = { x: 4.84, y: 3.08, w: 1.08, h: 0.58 };
  const lattice = { x: 2.81, y: 2.95, w: 1.12, h: 1.02 };
  const holes = [green, wide, narrow, jali, lattice];

  const front = cells(0, W, 0, H, holes);
  for (const part of front) {
    const g = place(boxGeo(part.w, part.h, T), part.x, part.y, T / 2);
    frontUV(g);
    add("plaster", g);
  }
  addBox("side", T, H, D, T / 2, H / 2, D / 2);
  addBox("side", T, H, D, W - T / 2, H / 2, D / 2);
  addBox("side", W, H, T, W / 2, H / 2, D - T / 2);
  addBox("side", W, 0.14, D, W / 2, H - 0.04, D / 2);
  addBox("dark", 0.7, 0.55, 0.7, 1.6, H + 0.28, 4.2, lin(0x8a8e90));

  function recess(hole, depth) {
    addBox("dark", hole.w - 0.04, hole.h - 0.04, 0.04, hole.x, hole.y, depth);
  }
  recess(green, 0.55);
  recess(wide, 0.55);
  recess(narrow, 0.55);
  recess(jali, 0.28);
  recess(lattice, 0.28);

  function frame(hole, z, t) {
    const hh = t || 0.07;
    addBox("timber", hole.w + hh, hh, 0.06, hole.x, hole.y + hole.h / 2, z);
    addBox("timber", hole.w + hh, hh, 0.06, hole.x, hole.y - hole.h / 2, z);
    addBox("timber", hh, hole.h, 0.06, hole.x - hole.w / 2, hole.y, z);
    addBox("timber", hh, hole.h, 0.06, hole.x + hole.w / 2, hole.y, z);
  }
  frame(green, -0.012);
  frame(wide, -0.012);
  frame(narrow, -0.012);
  frame(jali, -0.02, 0.06);
  frame(lattice, -0.03, 0.08);
  addBox("timber", jali.w + 0.2, 0.05, 0.1, jali.x, jali.y + jali.h / 2 + 0.05, -0.04);
  addBox("side", jali.w + 0.08, 0.04, 0.08, jali.x, jali.y - jali.h / 2 - 0.02, -0.02, lin(0xc8b8a4));

  function leaf(tex, x, w, h, y, key) {
    const geo = place(new THREE.PlaneGeometry(w, h), x, y, 0.045, 0, Math.PI, 0);
    looseMesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0 }), key);
  }
  leaf(greenDoor(), green.x, green.w - 0.08, green.h - 0.08, green.y, "green");
  leaf(paleDoor(), wide.x, wide.w - 0.08, wide.h - 0.08, wide.y, "wide");
  leaf(narrowDoor(), narrow.x, narrow.w - 0.06, narrow.h - 0.08, narrow.y, "narrow");
  function rails(hole, rows, split) {
    if (split) addBox("sage", 0.045, hole.h - 0.12, 0.03, hole.x, hole.y, 0.012);
    const top = hole.y + hole.h / 2 - 0.07;
    const bot = hole.y - hole.h / 2 + 0.07;
    for (let i = 0; i <= rows; i++) {
      const y = bot + ((top - bot) * i) / rows;
      addBox("sage", hole.w - 0.08, 0.04, 0.03, hole.x, y, 0.012);
    }
  }
  rails(wide, 3, true);
  rails(narrow, 2, false);
  const lat = place(new THREE.PlaneGeometry(lattice.w - 0.1, lattice.h - 0.1), lattice.x, lattice.y, 0.04, 0, Math.PI, 0);
  looseMesh(lat, new THREE.MeshStandardMaterial({ map: latticeTex(), roughness: 0.8 }), "lattice");
  const ja = place(new THREE.PlaneGeometry(jali.w - 0.08, jali.h - 0.08), jali.x, jali.y, 0.04, 0, Math.PI, 0);
  looseMesh(ja, new THREE.MeshStandardMaterial({ map: jaliTex(), roughness: 0.75 }), "jali");

  addBox("metal", 0.04, 0.08, 0.05, wide.x, 1.15, -0.02);
  addBox("metal", 0.16, 0.035, 0.03, wide.x, 1.15, -0.03);
  addBox("metal", 0.05, 0.08, 0.04, narrow.x + 0.28, 1.25, -0.03, lin(0x3a3a3c));
  addBox("dark", 0.04, 0.07, 0.025, narrow.x + 0.28, 1.16, -0.04);

  const cards = [
    poster("#e7a3c4", [{ color: "#f4f0f2", x: 0.2, y: 0.45, w: 0.25, h: 0.28 }]),
    poster("#3aa0d8", [{ color: "#d8f4ff", round: true, x: 0.5, y: 0.55, r: 0.16 }]),
    poster("#e23b55", [{ color: "#ffd0d6", round: true, x: 0.38, y: 0.58, r: 0.1 }, { color: "#fff", round: true, x: 0.62, y: 0.5, r: 0.08 }]),
    poster("#f2c14e", [{ color: "#fff6d8", x: 0.25, y: 0.42, w: 0.5, h: 0.22 }]),
    poster("#6b4ea0", [{ color: "#efe6ff", x: 0.3, y: 0.48, w: 0.4, h: 0.2 }]),
  ];
  cards.forEach((tex, i) => {
    const x = 5.42 - i * 0.28;
    const geo = place(new THREE.PlaneGeometry(0.26, 0.36), x, 2.48, -0.02, 0, Math.PI, (i - 2) * 0.03);
    looseMesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7, side: THREE.DoubleSide }), "poster" + i);
  });

  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), new THREE.MeshBasicMaterial({ color: 0xf4f1e4 }));
  bulb.position.set(5.35, 3.42, -0.12);
  loose.push(bulb);
  addBox("wire", 0.012, 0.22, 0.012, 5.35, 3.55, -0.1);

  addBox("dark", W, 0.06, 0.55, W / 2, 3.78, -0.22);
  for (let i = 0; i < 9; i++) {
    const x = 0.35 + i * 0.62;
    addBox("timber", 0.08, 0.1, 0.7, x, 3.7, -0.28);
  }
  addBox("side", W, 0.08, 0.08, W / 2, 0.04, -0.02, lin(0x6e6258));
  addBox("side", 0.26, H - 0.2, 0.08, 3.9, (H - 0.2) / 2, -0.02);
  addBox("timber", 0.12, 0.08, 0.1, 3.9, 0.08, -0.16, lin(0x8a5a3c));

  function span(a, b, droop, rad) {
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const t = i / 6;
      pts.push(new THREE.Vector3(
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * droop,
        a[2] + (b[2] - a[2]) * t,
      ));
    }
    add("wire", new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 6, rad, 4, false));
  }
  for (let i = 0; i < 16; i++) {
    const y = 3.42 + (hash(i, 1, 2) - 0.4) * 0.28;
    span([0.1, y, -0.26 - (i % 3) * 0.04], [W - 0.08, y - 0.06, -0.42], 0.08 + hash(i, 3, 1) * 0.16, i % 5 === 0 ? 0.009 : 0.004);
  }
  span([3.95, 3.5, -0.2], [3.95, 2.35, -0.16], 0.02, 0.007);
  span([5.35, 3.4, -0.12], [4.9, 2.7, -0.08], 0.04, 0.006);

  for (const name of Object.keys(buckets)) {
    const list = buckets[name];
    if (!list.length || !mats[name]) continue;
    const geo = list.length === 1 ? list[0] : mergeGeometries(list, false);
    if (!geo) continue;
    const mesh = new THREE.Mesh(geo, mats[name]);
    mesh.castShadow = true;
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
  root.userData.id = "031";
  return root;
}
