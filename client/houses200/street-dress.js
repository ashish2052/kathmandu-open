// Round 2 street dressing for houses 004 and 005, copied from their Street View stills.
// 004 (ref/front.jpg): a red motorbike and a blue scooter parked nose-in, potted plants along the step,
//   the H-pole with the transformer past the south corner and the wire bundles running to the face.
// 005 (ref/yaw_130.jpg): the silver hatchback parked along the blue doors.
// Everything is in the house's own frame (see house-00N.js headers): +X along the street, z = 0 the face,
// the lane is negative Z. Bikes and pots are instanced. No colliders: the climb walls stay as they were.

import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

function hash(a, b) {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// Parts carry their colour in the vertex colours so one material serves many.
function part(g, x, y, z, rx, ry, rz, rgb) {
  g = g.index ? g.toNonIndexed() : g;
  g.deleteAttribute("uv");
  g.applyMatrix4(new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(1, 1, 1)
  ));
  const n = g.attributes.position.count;
  const col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) col.set(rgb, i * 3);
  g.setAttribute("color", new THREE.BufferAttribute(col, 3));
  return g;
}
const box = (w, h, d, x, y, z, rgb, rz) => part(new THREE.BoxGeometry(w, h, d), x, y, z, 0, 0, rz || 0, rgb);
const cylX = (r, len, x, y, z, rgb) => part(new THREE.CylinderGeometry(r, r, len, 8), x, y, z, 0, 0, Math.PI / 2, rgb);
const cylZ = (r, len, x, y, z, rgb, seg) => part(new THREE.CylinderGeometry(r, r, len, seg || 10), x, y, z, Math.PI / 2, 0, 0, rgb);

const TYRE = [0.05, 0.05, 0.05];
const STEEL = [0.55, 0.55, 0.56];
const DARK = [0.12, 0.12, 0.13];
const SEAT = [0.07, 0.065, 0.06];
const PAINT = [1, 1, 1];

// Commuter motorbike, 2.0 m, front to +X. Returns [painted parts, fixed parts].
function motorbike() {
  const fixed = [];
  const paint = [];
  for (const x of [0.66, -0.66]) {
    fixed.push(part(new THREE.TorusGeometry(0.27, 0.06, 6, 16), x, 0.33, 0, 0, 0, 0, TYRE));
    fixed.push(cylZ(0.13, 0.05, x, 0.33, 0, STEEL));
  }
  fixed.push(box(0.46, 0.28, 0.24, 0.02, 0.45, 0, DARK));
  fixed.push(box(0.05, 0.74, 0.12, 0.56, 0.66, 0, STEEL, 0.27));
  fixed.push(box(0.64, 0.1, 0.27, -0.3, 0.86, 0, SEAT));
  fixed.push(cylZ(0.016, 0.7, 0.44, 1.1, 0, DARK, 6));
  fixed.push(cylX(0.04, 0.55, -0.38, 0.33, 0.15, STEEL));
  fixed.push(box(0.05, 0.06, 0.12, -0.72, 0.8, 0, [0.6, 0.05, 0.04]));
  fixed.push(box(0.08, 0.13, 0.15, 0.57, 1.02, 0, [0.85, 0.85, 0.8]));
  paint.push(box(0.52, 0.22, 0.32, 0.2, 0.8, 0, PAINT));
  paint.push(box(0.46, 0.17, 0.22, -0.38, 0.7, 0, PAINT, -0.12));
  paint.push(box(0.36, 0.04, 0.14, -0.66, 0.66, 0, PAINT, -0.25));
  paint.push(box(0.3, 0.04, 0.12, 0.68, 0.64, 0, PAINT, 0.2));
  paint.push(box(0.16, 0.22, 0.24, 0.52, 1.0, 0, PAINT, 0.27));
  return [mergeGeometries(paint), mergeGeometries(fixed)];
}

// Step-through scooter, 1.8 m, front to +X.
function scooter() {
  const fixed = [];
  const paint = [];
  for (const x of [0.6, -0.58]) {
    fixed.push(part(new THREE.TorusGeometry(0.2, 0.07, 6, 14), x, 0.27, 0, 0, 0, 0, TYRE));
    fixed.push(cylZ(0.11, 0.06, x, 0.27, 0, STEEL));
  }
  fixed.push(box(0.6, 0.1, 0.29, -0.3, 0.86, 0, SEAT));
  fixed.push(box(0.56, 0.07, 0.3, 0.08, 0.31, 0, DARK));
  fixed.push(cylZ(0.016, 0.62, 0.44, 1.08, 0, DARK, 6));
  fixed.push(box(0.04, 0.05, 0.16, -0.73, 0.68, 0, [0.6, 0.05, 0.04]));
  fixed.push(cylX(0.035, 0.4, -0.45, 0.3, 0.14, STEEL));
  paint.push(box(0.14, 0.66, 0.36, 0.44, 0.62, 0, PAINT, 0.2));
  paint.push(box(0.72, 0.36, 0.33, -0.34, 0.62, 0, PAINT));
  paint.push(box(0.26, 0.12, 0.2, 0.62, 0.5, 0, PAINT, 0.3));
  paint.push(box(0.18, 0.2, 0.26, 0.47, 1.0, 0, PAINT, 0.2));
  return [mergeGeometries(paint), mergeGeometries(fixed)];
}

// Clay and cement pots with a clump of leaves.
function potGeoms() {
  const pot = part(new THREE.CylinderGeometry(0.19, 0.14, 0.3, 10), 0, 0.15, 0, 0, 0, 0, [1, 1, 1]);
  const leaves = [];
  for (let i = 0; i < 14; i++) {
    const a = i * 2.4;
    const tilt = 0.25 + hash(i, 1) * 0.75;
    const len = 0.32 + hash(i, 2) * 0.28;
    const g = new THREE.OctahedronGeometry(1, 0);
    g.scale(0.045, len / 2, 0.012);
    g.translate(0, len / 2, 0);
    g.rotateZ(-tilt);
    g.rotateY(a);
    g.translate(0, 0.28, 0);
    leaves.push(part(g, 0, 0, 0, 0, 0, 0, [0.75 + hash(i, 3) * 0.4, 0.9 + hash(i, 4) * 0.2, 0.75]));
  }
  return [pot, mergeGeometries(leaves)];
}

function instanced(geo, mat, list, colour) {
  const mesh = new THREE.InstancedMesh(geo, mat, list.length);
  const m = new THREE.Matrix4();
  const c = new THREE.Color();
  list.forEach((it, i) => {
    m.compose(
      new THREE.Vector3(it.x, it.y || 0, it.z),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(it.lean || 0, it.yaw || 0, 0, "YXZ")),
      new THREE.Vector3(it.s || 1, it.s || 1, it.s || 1)
    );
    mesh.setMatrixAt(i, m);
    if (colour) mesh.setColorAt(i, c.set(colour(it, i)));
  });
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.computeBoundingSphere();
  return mesh;
}

function mats() {
  return {
    paint: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.38, metalness: 0.25, vertexColors: true }),
    parts: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, metalness: 0.35, vertexColors: true }),
    pot: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, vertexColors: true }),
    leaf: new THREE.MeshStandardMaterial({ color: 0x45702e, roughness: 0.75, metalness: 0, vertexColors: true, flatShading: true, side: THREE.DoubleSide }),
    wire: new THREE.MeshStandardMaterial({ color: 0x1c1a19, roughness: 0.6, metalness: 0 }),
    concrete: new THREE.MeshStandardMaterial({ color: 0x8e8b85, roughness: 0.95, metalness: 0, vertexColors: true }),
    steel: new THREE.MeshStandardMaterial({ color: 0x7d837e, roughness: 0.55, metalness: 0.5, vertexColors: true }),
  };
}

// Parked two-wheelers: { kind, x, z, yaw, lean, colour }.
function bikes(group, M, list) {
  for (const kind of ["bike", "scooter"]) {
    const rows = list.filter((b) => b.kind === kind);
    if (!rows.length) continue;
    const [paint, fixed] = kind === "bike" ? motorbike() : scooter();
    group.add(instanced(paint, M.paint, rows, (b) => b.colour));
    group.add(instanced(fixed, M.parts, rows));
  }
}

function pots(group, M, list) {
  const [pot, leaves] = potGeoms();
  group.add(instanced(pot, M.pot, list, (p) => p.clay ? 0x9a5a3c : 0x8a857c));
  group.add(instanced(leaves, M.leaf, list, (p, i) => new THREE.Color(0xffffff).multiplyScalar(0.8 + hash(i, 9) * 0.35)));
}

// A sagging span: n points between a and b, dropped by sag at the middle.
function span(a, b, sag, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(new THREE.Vector3(
      a[0] + (b[0] - a[0]) * t,
      a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t),
      a[2] + (b[2] - a[2]) * t
    ));
  }
  return pts;
}
function wires(group, M, runs) {
  const geos = runs.map((r) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(r.pts), r.seg || 20, r.rad || 0.01, 4, false));
  const mesh = new THREE.Mesh(mergeGeometries(geos), M.wire);
  mesh.castShadow = true;
  group.add(mesh);
}

// The H-pole: two concrete posts, a channel platform, the tank with fins and three bushings, cross-arms.
function transformerPole(group, M, x, z) {
  const con = [];
  const st = [];
  const gap = 1.5;
  for (const dx of [-gap / 2, gap / 2]) {
    con.push(part(new THREE.CylinderGeometry(0.11, 0.16, 10.5, 8), x + dx, 5.25, z, 0, 0, 0, [1, 1, 1]));
  }
  for (const y of [5.2, 5.32]) st.push(box(gap + 0.5, 0.1, 0.12, x, y, z, [0.8, 0.8, 0.8]));
  st.push(box(0.95, 1.05, 0.62, x, 5.9, z, [1, 1, 1]));
  for (let i = 0; i < 7; i++) st.push(box(0.03, 0.8, 0.7, x - 0.36 + i * 0.12, 5.85, z, [0.9, 0.9, 0.9]));
  for (let i = 0; i < 3; i++) st.push(part(new THREE.CylinderGeometry(0.045, 0.06, 0.3, 6), x - 0.28 + i * 0.28, 6.58, z, 0, 0, 0, [0.6, 0.5, 0.42]));
  st.push(box(0.5, 0.6, 0.35, x + 0.95, 4.2, z, [0.95, 0.95, 0.95]));
  for (const y of [8.7, 9.6]) {
    st.push(box(gap + 1.4, 0.09, 0.1, x, y, z, [0.7, 0.7, 0.7]));
    for (let i = 0; i < 4; i++) st.push(part(new THREE.CylinderGeometry(0.035, 0.05, 0.16, 6), x - 1.0 + i * 0.66, y + 0.12, z, 0, 0, 0, [0.85, 0.82, 0.75]));
  }
  const post = new THREE.Mesh(mergeGeometries(con), M.concrete);
  const kit = new THREE.Mesh(mergeGeometries(st), M.steel);
  for (const m of [post, kit]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
}

// WagonR-style tall hatch, 3.6 m, front to +X. Silver, tinted glass, the tall tail lamps in the D-pillars.
function silverCar(group, x, z, yaw) {
  const shape = new THREE.Shape();
  const prof = [[-1.8, 0.24], [1.78, 0.24], [1.82, 0.6], [1.72, 0.92], [1.15, 1.02], [0.42, 1.6], [-1.6, 1.64], [-1.78, 1.45], [-1.82, 0.95]];
  shape.moveTo(prof[0][0], prof[0][1]);
  for (const p of prof.slice(1)) shape.lineTo(p[0], p[1]);
  const shellG = new THREE.ExtrudeGeometry(shape, { depth: 1.46, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 2 });
  shellG.translate(0, 0, -0.73);
  const shell = new THREE.Mesh(shellG, new THREE.MeshStandardMaterial({ color: 0x7c8084, roughness: 0.45, metalness: 0.4 }));
  const glass = [];
  const trim = [];
  const s = 0.775;
  for (const side of [-1, 1]) {
    glass.push(box(1.02, 0.46, 0.02, -1.0, 1.31, side * s, [1, 1, 1]));
    glass.push(box(0.72, 0.46, 0.02, 0.0, 1.31, side * s, [1, 1, 1]));
    glass.push(box(0.22, 0.34, 0.02, 0.48, 1.25, side * s, [1, 1, 1], 0));
    trim.push(box(0.08, 0.5, 0.025, -0.45, 1.31, side * s, [0.05, 0.05, 0.05]));
    trim.push(box(0.16, 0.03, 0.03, -0.2, 0.9, side * (s + 0.005), [0.6, 0.6, 0.6]));
    trim.push(box(0.16, 0.03, 0.03, -1.05, 0.9, side * (s + 0.005), [0.6, 0.6, 0.6]));
    trim.push(box(0.12, 0.1, 0.16, 0.5, 1.08, side * (s + 0.06), [0.55, 0.56, 0.57]));
    trim.push(box(0.05, 0.46, 0.18, -1.83, 1.18, side * 0.6, [0.62, 0.04, 0.04]));
    for (const wx of [1.18, -1.2]) {
      trim.push(cylZ(0.3, 0.2, wx, 0.3, side * 0.68, [0.04, 0.04, 0.04], 14));
      trim.push(cylZ(0.17, 0.02, wx, 0.3, side * 0.785, [0.62, 0.63, 0.64], 12));
    }
  }
  glass.push(part(new THREE.BoxGeometry(0.02, 0.9, 1.3), 0.8, 1.31, 0, 0, 0, 0.9, [1, 1, 1]));
  glass.push(box(0.02, 0.4, 1.12, -1.8, 1.32, 0, [1, 1, 1]));
  trim.push(box(0.14, 0.22, 1.5, -1.82, 0.42, 0, [0.16, 0.16, 0.17]));
  trim.push(box(0.14, 0.22, 1.5, 1.82, 0.4, 0, [0.16, 0.16, 0.17]));
  trim.push(box(0.02, 0.13, 0.42, -1.9, 0.72, 0, [0.88, 0.86, 0.8]));
  trim.push(box(0.03, 0.12, 0.3, 1.86, 0.82, 0.5, [0.85, 0.85, 0.8]));
  trim.push(box(0.03, 0.12, 0.3, 1.86, 0.82, -0.5, [0.85, 0.85, 0.8]));
  const glassM = new THREE.Mesh(mergeGeometries(glass), new THREE.MeshStandardMaterial({ color: 0x15181a, roughness: 0.12, metalness: 0.4, vertexColors: true }));
  const trimM = new THREE.Mesh(mergeGeometries(trim), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.3, vertexColors: true }));
  const car = new THREE.Group();
  car.name = "street-car-005";
  for (const m of [shell, glassM, trimM]) {
    m.castShadow = true;
    m.receiveShadow = true;
    car.add(m);
  }
  car.position.set(x, 0, z);
  car.rotation.y = yaw;
  group.add(car);
}

// Thin and low props must not steer the climbing camera's line-of-sight test.
function noSight(group, keep) {
  group.traverse((o) => { if (o.isMesh && !keep.includes(o)) o.raycast = () => {}; });
}

export function streetDress(id) {
  const group = new THREE.Group();
  group.name = "street-dress-" + id;
  const M = mats();
  if (id === "004") {
    // Photo-left is high X on 004. Bikes stand nose-in to the step, the red bike photo-left of the scooter.
    bikes(group, M, [
      { kind: "bike", x: 5.4, z: -1.75, yaw: Math.PI / 2 + 0.12, lean: 0.1, colour: 0x8e1812 },
      { kind: "scooter", x: 2.7, z: -1.7, yaw: Math.PI / 2 - 0.08, lean: -0.09, colour: 0x1d3f86 },
      { kind: "bike", x: 7.7, z: -1.9, yaw: Math.PI / 2 + 0.3, lean: 0.11, colour: 0x1a1a1c },
    ]);
    pots(group, M, [
      { x: 7.75, z: -0.55, s: 1.25, clay: true },
      { x: 4.05, z: -0.75, s: 1.1, clay: true },
      { x: 3.3, z: -0.6, s: 1.2 },
      { x: 1.15, z: -1.25, s: 0.95, clay: true },
      { x: -1.1, z: -1.6, s: 1.1, clay: true },
      { x: -2.6, z: -0.9, s: 0.9 },
      { x: -3.6, z: -1.3, s: 1.05, clay: true },
    ]);
    // Open ground beside the south corner; lands where the real pole stands in the front.jpg frame.
    const px = -3.0;
    const pz = 1.5;
    transformerPole(group, M, px, pz);
    // Bundles: cross-arm to the south corner, then sagging along the face above the sign; more leave north.
    const runs = [];
    for (let i = 0; i < 5; i++) {
      const y0 = 8.7 + (i % 2) * 0.9 + 0.12;
      const a = [px - 1.0 + i * 0.5, y0, pz];
      const c = [0.15, 4.25 + i * 0.12, -0.18 - i * 0.03];
      runs.push({ pts: span(a, c, 0.5 + i * 0.12, 14), rad: 0.009 + (i % 3) * 0.003 });
      runs.push({ pts: span(c, [8.3, 4.05 + i * 0.1, -0.22 - i * 0.04], 0.32 + i * 0.07, 18), rad: 0.009 + (i % 3) * 0.003 });
    }
    for (let i = 0; i < 4; i++) {
      runs.push({ pts: span([px - 1.0 + i * 0.66, 9.72, pz], [px - 14, 8.2 + i * 0.2, pz - 3 - i], 0.9, 18), rad: 0.01 });
      runs.push({ pts: span([px - 1.0 + i * 0.66, 8.82, pz], [px + 2 + i, 7.6, pz - 12], 1.0, 18), rad: 0.009 });
    }
    runs.push({ pts: span([px + 0.95, 4.5, pz], [px - 0.28, 6.6, pz], 0.15, 8), rad: 0.012 });
    runs.push({ pts: span([px + 0.28, 6.6, pz], [px + 0.7, 8.7, pz], 0.1, 8), rad: 0.012 });
    wires(group, M, runs);
    const keep = [];
    group.traverse((o) => { if (o.isMesh && o.material === M.concrete) keep.push(o); });
    noSight(group, keep);
  } else if (id === "005") {
    // Along the blue doors (x 4.3-9.8), 0.4 m off the wall, nose north (+X), as in yaw_130.
    silverCar(group, 7.3, -1.55, 0);
    const keep = [];
    group.traverse((o) => { if (o.isMesh) keep.push(o); });
    noSight(group, keep);
  } else {
    return null;
  }
  let tris = 0;
  group.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry;
    const n = (g.index ? g.index.count : g.attributes.position.count) / 3;
    tris += n * (o.isInstancedMesh ? o.count : 1);
  });
  group.userData.triangles = Math.round(tris);
  return group;
}
