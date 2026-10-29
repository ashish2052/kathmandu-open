// Houses 001-005 on live ordinary boxes. The photo facade is retired (ownMesh)
// and the collision rectangle is the mesh, not the old extruded box.
// Street face of each model is local z = 0; +Z runs into the lot. An edge frame's
// +Z points out to the street, so the mesh is yawed 180 degrees and the front
// stays on the street edge. Scale is clamped to 10%.
import * as THREE from "three";
import { createHouse001 } from "./house-001.js";
import { createHouse002 } from "./house-002.js";
import { createHouse003 } from "./house-003.js";
import { createHouse004 } from "./house-004.js";
import { createHouse005 } from "./house-005.js";
import { createHouse006 } from "./house-006.js";
import { createHouse008 } from "./house-008.js";
import { createHouse007 } from "./house-007.js";
import { createHouse009 } from "./house-009.js";
import { createHouse010 } from "./house-010.js";
import { createHouse011 } from "./house-011.js";
import { createHouse013 } from "./house-013.js";
import { createHouse012 } from "./house-012.js";
import { createHouse014 } from "./house-014.js";
import { createHouse015 } from "./house-015.js";
import { createHouse016 } from "./house-016.js";
import { createHouse017 } from "./house-017.js";
import { createHouse018 } from "./house-018.js";
import { createHouse019 } from "./house-019.js";
import { createHouse020 } from "./house-020.js";
import { createHouse021 } from "./house-021.js";
import { createHouse022 } from "./house-022.js";
import { createHouse025 } from "./house-025.js";
import { createHouse023 } from "./house-023.js";
import { createHouse024 } from "./house-024.js";
import { createHouse026 } from "./house-026.js";
import { createHouse028 } from "./house-028.js";
import { createHouse027 } from "./house-027.js";
import { createHouse030 } from "./house-030.js";
import { createHouse031 } from "./house-031.js";
import { createHouse032 } from "./house-032.js";
import { createHouse029 } from "./house-029.js";
import { createHouse033 } from "./house-033.js";
import { streetDress } from "./street-dress.js";

const LOTS = [
  {
    file: "001", way: 907080046, edge: 1, W: 5.4, D: 7.8, roof: 14.36,
    street: "Yogbir Singh Marg", streetWay: 351924485, pin: "center",
    enterable: false,
    make: createHouse001,
  },
  {
    file: "002", way: 907080023, edge: 1, W: 4.85, D: 6.4, roof: 16.12,
    street: "Yatkha Road", streetWay: 120353053, pin: "start",
    enterable: false,
    make: createHouse002,
  },
  {
    file: "003", way: 343063400, edge: 1, W: 6.4, D: 7.1, roof: 13.4,
    street: "Yatkha Road", streetWay: 120353053, pin: "center",
    enterable: false,
    make: createHouse003,
  },
  {
    file: "004", way: 343060498, edge: 4, W: 8.02, D: 8.92, roof: 9.5,
    street: "Yatkha Road", streetWay: 120353053, pin: "center",
    enterable: true,
    shop: true,
    storeys: 3,
    floorHeights: [0, 3.15, 6],
    windows: [
      { x: 1.85, y: 1.32, w: 3.05, h: 2.28 },
      { x: 5.9, y: 1.32, w: 3.15, h: 2.28, door: true },
      { x: 1.55, y: 4.55, w: 1.18, h: 1.7 },
      { x: 3.9, y: 4.55, w: 1.12, h: 1.7 },
      { x: 6.35, y: 4.55, w: 1.18, h: 1.7 },
      { x: 1.55, y: 7.35, w: 1.18, h: 1.6 },
      { x: 3.9, y: 7.35, w: 1.12, h: 1.6 },
      { x: 6.35, y: 7.35, w: 1.18, h: 1.6 },
    ],
    make: createHouse004,
  },
  {
    file: "005", way: 1054191480, edge: 0, W: 10.01, D: 6.48, roof: 9.15,
    street: "Yatkha Road", streetWay: 120353053, pin: "center",
    enterable: false,
    make: createHouse005,
  },
  {
    file: "006", way: 1029960699, edge: 0, W: 6.26, D: 7.45, roof: 9.05,
    street: "Yatkha Road", streetWay: 120353053, pin: "center",
    enterable: false,
    make: createHouse006,
  },
  {
    file: "008", way: 906786521, edge: 6, W: 9.28, D: 6.78, roof: 6.55,
    street: "Paropakar Marg", streetWay: 58752656, pin: "center",
    enterable: false,
    make: createHouse008,
  },
  {
    file: "007", way: 420797423, edge: 3, W: 4.61, D: 4.36, roof: 9.35,
    street: "Basantapur Square", streetWay: 1550144347, pin: "center",
    enterable: false,
    make: createHouse007,
  },
  {
    file: "009", way: 1416284448, edge: 0, W: 5.19, D: 6.11, roof: 4.85,
    street: "Kampukot Marg", streetWay: 514853396, pin: "center",
    enterable: false,
    make: createHouse009,
  },
  {
    file: "010", way: 906975896, edge: 5, W: 16.08, D: 11.81, roof: 6.45,
    street: "Jhochhen Tol", streetWay: 577458435, pin: "center",
    enterable: false,
    make: createHouse010,
  },
  {
    file: "011", way: 907048004, edge: 2, W: 6.58, D: 5.98, roof: 8.7,
    street: "Yogbir Singh Marg", streetWay: 1257513675, pin: "center",
    enterable: false,
    make: createHouse011,
  },
  {
    file: "013", way: 169429535, edge: 3, W: 28.33, D: 8.25, roof: 7.2,
    street: "Sukra Path", streetWay: 4840392, pin: "center",
    enterable: false,
    make: createHouse013,
  },
  {
    file: "012", way: 1416452844, edge: 0, W: 3.95, D: 5.51, roof: 6.15,
    street: "Makhan Galli", streetWay: 169188263, pin: "center",
    enterable: false,
    make: createHouse012,
  },
  {
    file: "014", way: 668405150, edge: 1, W: 7.33, D: 5.29, roof: 7.5,
    street: "Watu Marg", streetWay: 180216845, pin: "center",
    enterable: false,
    make: createHouse014,
  },
  {
    file: "015", way: 906975240, edge: 1, W: 4.95, D: 8.12, roof: 8.95,
    street: "Paropakar Marg", streetWay: 58752656, pin: "center",
    enterable: false,
    make: createHouse015,
  },
  {
    file: "016", way: 344176294, edge: 1, W: 8.447, D: 6.499, roof: 9.85,
    street: "Phalchasa Pode Galli", streetWay: 136452125, pin: "center",
    enterable: false,
    make: createHouse016,
  },
  {
    file: "017", way: 203433636, edge: 2, W: 7.24, D: 6.37, roof: 9.45,
    street: "Yogbir Singh Marg", streetWay: 351924481, pin: "center",
    enterable: false,
    make: createHouse017,
  },
  {
    file: "018", way: 1416892723, edge: 1, W: 7.93, D: 4.48, roof: 8.55,
    street: "Yogbir Singh Marg", streetWay: 351924481, pin: "center",
    enterable: false,
    make: createHouse018,
  },
  {
    file: "020", way: 906975897, edge: 2, W: 16.2, D: 12.85, roof: 8.35,
    street: "Jhochhen Tol", streetWay: 577458435, pin: "center",
    enterable: false,
    make: createHouse020,
  },
  {
    file: "019", way: 226512210, edge: 3, W: 6.25, D: 5.11, roof: 7.45,
    street: "Heritage Walk", streetWay: 212392696, pin: "center",
    enterable: false,
    make: createHouse019,
  },
  {
    file: "021", way: 183559497, edge: 5, W: 10.35, D: 13.48, roof: 7.4,
    street: "Maru Tole", streetWay: 185882291, pin: "center",
    enterable: false,
    make: createHouse021,
  },
  {
    file: "022", way: 1416947358, edge: 3, W: 8.4, D: 4.83, roof: 9.15,
    street: "Gangalal Marg", streetWay: 171203199, pin: "center",
    enterable: false,
    make: createHouse022,
  },
  {
    file: "025", way: 650978482, edge: 0, W: 7.96, D: 4.76, roof: 10.15,
    street: "Lagan lane", streetWay: 136617989, pin: "center",
    enterable: false,
    make: createHouse025,
  },
  {
    file: "023", way: 1029217595, edge: 2, W: 4.56, D: 7.35, roof: 8.45,
    street: "Watu Marg", streetWay: 184133756, pin: "center",
    enterable: false,
    make: createHouse023,
  },
  {
    file: "024", way: 903765084, edge: 2, W: 6.23, D: 4.58, roof: 6.55,
    street: "Nanma Galli", streetWay: 388989993, pin: "center",
    enterable: false,
    make: createHouse024,
  },
  {
    file: "026", way: 907080054, edge: 6, W: 7.15, D: 8.46, roof: 10.9,
    street: "Yatkha Road", streetWay: 120353053, pin: "center",
    enterable: false,
    make: createHouse026,
  },
  {
    file: "028", way: 341795477, edge: 0, W: 6.33, D: 4.82, roof: 4.7,
    street: "Siddhidas Marg", streetWay: 218316959, pin: "center",
    enterable: false,
    make: createHouse028,
  },
  {
    file: "027", way: 341148648, edge: 3, W: 7.35, D: 9.79, roof: 9.15,
    street: "Khichapukhu Sadak", streetWay: 1459430909, pin: "center",
    enterable: false,
    make: createHouse027,
  },
  {
    file: "030", way: 904491190, edge: 2, W: 5.11, D: 8.77, roof: 7.05,
    street: "Saat Ghumti Marg", streetWay: 56688294, pin: "center",
    enterable: false,
    make: createHouse030,
  },
  {
    file: "031", way: 1029956838, edge: 3, W: 5.75, D: 5.53, roof: 4.05,
    street: "Chittadhar Marg", streetWay: 4840409, pin: "center",
    enterable: false,
    make: createHouse031,
  },
  {
    file: "032", way: 671190295, edge: 1, W: 7.44, D: 5.38, roof: 9.35,
    street: "Kel Tol", streetWay: 212392696, pin: "center",
    enterable: false,
    make: createHouse032,
  },
  {
    file: "029", way: 906626836, edge: 1, W: 8.18, D: 8.2, roof: 7.15,
    street: "Gangalal Marg", streetWay: 171203199, pin: "center",
    enterable: false,
    make: createHouse029,
  },
  {
    file: "033", way: 226512180, edge: 5, W: 7.9, D: 5.6, roof: 8.05,
    street: "Heritage Walk", streetWay: 212392696, pin: "center",
    enterable: false,
    make: createHouse033,
  },
];

function clamp(v, lo, hi) {
  return Math.max(lo, Math.min(hi, v));
}

function signedArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a * 0.5;
}

function edgeHolds(poly, ys, id, holds, roof) {
  if (!poly || poly.length < 2 || !ys.length) return;
  const areaSign = signedArea(poly) >= 0 ? 1 : -1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const c = poly[(i + 1) % poly.length];
    let dx = c[0] - a[0];
    let dz = c[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 0.8) continue;
    dx /= len;
    dz /= len;
    const nx = dz * areaSign;
    const nz = -dx * areaSign;
    const parts = Math.max(1, Math.round(len / 1.0));
    for (let s = 0; s <= parts; s++) {
      const t = s / parts;
      const x = a[0] + (c[0] - a[0]) * t;
      const z = a[1] + (c[1] - a[1]) * t;
      for (let k = 0; k < ys.length; k++) {
        holds.push({ x, y: +(+ys[k]).toFixed(2), z, nx, nz, id, roof: !!(roof && k === ys.length - 1) });
      }
    }
  }
}

function retarget(live, holds, poly, roof) {
  for (let i = holds.length - 1; i >= 0; i--) {
    if (holds[i].id === live.id) holds.splice(i, 1);
  }
  live.ownMesh = true;
  live.wall = poly;
  live.height = roof;
  live.hole = null;
  live.steps = [];
  let cx = 0;
  let cz = 0;
  for (const p of poly) {
    cx += p[0];
    cz += p[1];
  }
  live.cx = cx / poly.length;
  live.cz = cz / poly.length;
  const ys = [];
  for (let y = 1.15; y < roof - 0.28; y += 1.15) ys.push(+y.toFixed(2));
  edgeHolds(poly, ys, live.id, holds, false);
  edgeHolds(poly, [roof], live.id, holds, true);
}

export function installHouseModels(scene, buildings, holds, edgeFrames) {
  const placed = [];
  const anchors = [];
  for (const lot of LOTS) {
    const live = buildings.find((b) => b.id === lot.way);
    if (!live || live.hero) continue;
    const frames = edgeFrames(live.wall);
    const F = frames.find((f) => f.i === lot.edge);
    if (!F) continue;
    let lotDepth = 0;
    for (const p of live.wall) {
      const inward = -((p[0] - F.ox) * F.outx + (p[1] - F.oz) * F.outz);
      if (inward > lotDepth) lotDepth = inward;
    }
    const sx = clamp(F.len / lot.W, 0.9, 1.1);
    const sz = clamp(lotDepth / lot.D, 0.9, 1.1);
    const span = sx * lot.W;
    const deep = sz * lot.D;
    const shift = lot.pin === "start" ? 0 : (span - F.len) / 2;
    const ox = F.ox - F.rx * shift;
    const oz = F.oz - F.rz * shift;
    const yaw = Math.atan2(-F.rz, F.rx);

    let house;
    try {
      house = lot.make();
    } catch (err) {
      console.error("house " + lot.file, err);
      (window.__houseFail = window.__houseFail || []).push(lot.file + ": " + err.message);
      live.dormant = true;
      continue;
    }
    const flip = new THREE.Group();
    flip.rotation.y = Math.PI;
    flip.position.set(lot.W, 0, 0);
    flip.add(house);
    const dress = streetDress(lot.file);
    if (dress) {
      house.add(dress);
      (window.__streetDress = window.__streetDress || {})[lot.file] = dress.userData.triangles;
    }

    const root = new THREE.Group();
    root.name = "live-house-" + lot.file;
    root.position.set(ox, 0, oz);
    root.rotation.y = yaw;
    root.scale.set(sx, 1, sz);
    root.add(flip);
    scene.add(root);

    const world = (x, z) => [ox + F.rx * x + F.outx * z, oz + F.rz * x + F.outz * z];
    let poly = [world(0, 0), world(span, 0), world(span, -deep), world(0, -deep)];
    if ((signedArea(poly) >= 0) !== (signedArea(live.wall) >= 0)) poly.reverse();
    const srcId = live.id;
    retarget(live, holds, poly, lot.roof);
    const mid = world(span / 2, 0);
    anchors.push({
      file: lot.file,
      enterable: !!lot.enterable,
      shop: !!lot.shop,
      storeys: lot.storeys || 1,
      floorHeights: lot.floorHeights || null,
      windows: lot.windows || null,
      roof: lot.roof,
      W: lot.W,
      D: lot.D,
      host: house,
      building: live,
    });
    placed.push({
      id: lot.file,
      way: srcId,
      edge: lot.edge,
      street: lot.street,
      streetWay: lot.streetWay,
      sx: +sx.toFixed(3),
      sz: +sz.toFixed(3),
      span: +span.toFixed(2),
      depth: +deep.toFixed(2),
      lotDepth: +lotDepth.toFixed(2),
      edgeLen: +F.len.toFixed(2),
      roof: lot.roof,
      mid: [+mid[0].toFixed(2), +mid[1].toFixed(2)],
      outx: F.outx,
      outz: F.outz,
      rx: F.rx,
      rz: F.rz,
      gap: +(lotDepth - deep).toFixed(2),
      tris: house.userData.triangles || 0,
    });
  }
  window.__houses200 = placed;
  window.__interiorAnchors = anchors;
  return placed;
}
