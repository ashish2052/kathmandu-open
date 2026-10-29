// Footprints are [x, z] with z south. Pure functions, no rendering.
import { NOT_HOUSES } from "./not-houses.js";

export function signedArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a * 0.5;
}

export function inside(x, z, poly) {
  let inn = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0];
    const zi = poly[i][1];
    const xj = poly[j][0];
    const zj = poly[j][1];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi || 1e-12) + xi) inn = !inn;
  }
  return inn;
}

// Positive shoelace here is clockwise when looking down (z points south).
// Inward normal of an edge is (-dz, dx) * sign, with sign +1 for that winding.
export function insetPoly(poly, dist) {
  if (!poly || poly.length < 3 || dist <= 0) return poly;
  const sign = signedArea(poly) >= 0 ? 1 : -1;
  const n = poly.length;
  const lines = [];
  for (let i = 0; i < n; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % n];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    const ix = -dz * sign;
    const iz = dx * sign;
    lines.push({ px: a[0] + ix * dist, pz: a[1] + iz * dist, dx, dz });
  }
  const out = [];
  for (let i = 0; i < n; i++) {
    const L = lines[(i + n - 1) % n];
    const M = lines[i];
    const cross = L.dx * M.dz - L.dz * M.dx;
    if (Math.abs(cross) < 1e-5) {
      out.push([M.px, M.pz]);
      continue;
    }
    const t = ((M.px - L.px) * M.dz - (M.pz - L.pz) * M.dx) / cross;
    out.push([+(L.px + L.dx * t).toFixed(3), +(L.pz + L.dz * t).toFixed(3)]);
  }
  if (Math.abs(signedArea(out)) < 1) return null;
  return out;
}

export function prepareBuildings(list) {
  const buildings = [];
  const holds = [];
  for (const b of list) {
    if (NOT_HOUSES.has(b.id)) continue;
    const wall = b.poly;
    const item = {
      id: b.id,
      name: b.name || "",
      hero: b.hero || "",
      height: b.height,
      hole: b.hole || null,
      wall,
      steps: [],
      cx: b.cx,
      cz: b.cz,
    };
    if (b.hero === "maju") {
      // 22 risers of 18.4 cm keep the 4.05 m plinth; tread 28.6 cm. See temple.js MAJU.
      const majuSteps = 22;
      const majuRise = 4.05 / 22;
      const majuRun = 6 / 21;
      let ring = wall;
      for (let s = 1; s <= majuSteps && ring; s++) {
        item.steps.push({ poly: ring, y: +(s * majuRise).toFixed(3) });
        item.top = ring;
        ring = s < majuSteps ? insetPoly(ring, majuRun) : ring;
      }
      const core = insetPoly(item.top, 2.1);
      if (core) {
        item.wall = core;
        item.height = 9.7;
        item.climb = { y0: 4.05 + 0.9, y1: 7.5, dy: 0.8 };
      }
    } else if (b.hero && ["trailokya", "maju", "shivaparvati", "narayan", "kastha"].includes(b.hero)) {
      const rings = [];
      let prev = wall;
      const nearHome = (poly) => poly && poly.every((p) => Math.hypot(p[0] - b.cx, p[1] - b.cz) < 40);
      for (let s = 1; s <= 3; s++) {
        const next = insetPoly(prev, 1.15);
        if (!next || !nearHome(next)) break;
        rings.push(prev);
        item.steps.push({ poly: prev, y: s * 0.48 });
        prev = next;
      }
      item.wall = prev;
      item.steps.push({ poly: wall, y: 0.48 });
    }
    buildings.push(item);
    addHolds(item, holds);
  }
  return { buildings, holds };
}

// Ledges sit on a real lip: a sill or cornice about 1.15 m apart, then the roof edge.
// Temple tiers add their own ring (plinth step or eave) instead of a slide up a flat wall.
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

function storeyYs(height) {
  const ys = [];
  if (!(height >= 1.15)) return ys;
  for (let y = 1.15; y < height - 0.28; y += 1.15) ys.push(+y.toFixed(2));
  return ys;
}

function addHolds(b, holds) {
  const cl = b.climb;
  if (cl) {
    const ys = [];
    for (let y = cl.y0; y < cl.y1 - 0.05; y += cl.dy) ys.push(+y.toFixed(2));
    edgeHolds(b.wall, ys, b.id, holds, false);
    return;
  }
  if (b.height >= 1.15) {
    // Storey rings are a guess, not a feature: tagged so the game can swap them for real ledges (client/ledges.js).
    const g0 = holds.length;
    edgeHolds(b.wall, storeyYs(b.height), b.id, holds, false);
    for (let i = g0; i < holds.length; i++) holds[i].grid = true;
    edgeHolds(b.wall, [b.height], b.id, holds, true);
  }
  if (b.steps) {
    for (let i = 0; i < b.steps.length; i++) {
      const s = b.steps[i];
      if (!s || s.y < 0.75) continue;
      edgeHolds(s.poly, [s.y], b.id, holds, s.y >= b.height - 0.25);
    }
  }
}

export function wallHit(buildings, x, z, feet) {
  for (const b of buildings) {
    if (b.dormant || !b.wall || b.wall.length < 3) continue;
    if (feet >= b.height - 0.3) continue;
    if (!inside(x, z, b.wall)) continue;
    if (b.hole && inside(x, z, b.hole)) continue;
    return b;
  }
  return null;
}

// ceil: ignore surfaces above this. Movement passes the feet so a roof does not
// replace the floor you are standing on. Omit it and the old highest-surface rule stands.
export function floorAt(buildings, x, z, ceil) {
  let h = 0;
  const cap = ceil == null ? Infinity : ceil;
  for (const b of buildings) {
    if (b.dormant || b.blocker) continue;
    if (b.shell) {
      const decks = b.decks || [];
      for (let i = 0; i < decks.length; i++) {
        const d = decks[i];
        if (d.y > cap || d.y < h) continue;
        if (!inside(x, z, d.poly)) continue;
        if (d.hole && inside(x, z, d.hole)) continue;
        h = d.y;
      }
      continue;
    }
    if (b.height <= cap && inside(x, z, b.wall) && !(b.hole && inside(x, z, b.hole))) h = Math.max(h, b.height);
    for (const s of b.steps) {
      if (s.y <= cap && inside(x, z, s.poly)) h = Math.max(h, s.y);
    }
  }
  return h;
}

function nearestOnEdge(x, z, poly) {
  let best = 1e9;
  let px = x;
  let pz = z;
  let nx = 0;
  let nz = 1;
  const sign = signedArea(poly) >= 0 ? 1 : -1;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    let dx = b[0] - a[0];
    let dz = b[1] - a[1];
    const len2 = dx * dx + dz * dz || 1e-8;
    let t = ((x - a[0]) * dx + (z - a[1]) * dz) / len2;
    t = Math.max(0, Math.min(1, t));
    const qx = a[0] + dx * t;
    const qz = a[1] + dz * t;
    const d = Math.hypot(x - qx, z - qz);
    if (d < best) {
      best = d;
      px = qx;
      pz = qz;
      const len = Math.sqrt(len2);
      nx = (dz / len) * sign;
      nz = (-dx / len) * sign;
    }
  }
  return { d: best, x: px, z: pz, nx, nz };
}

function pushSeg(cx, cz, leaf, radius) {
  const ax = leaf.ax;
  const az = leaf.az;
  const bx = leaf.bx;
  const bz = leaf.bz;
  let dx = bx - ax;
  let dz = bz - az;
  const len2 = dx * dx + dz * dz || 1e-8;
  let t = ((cx - ax) * dx + (cz - az) * dz) / len2;
  t = Math.max(0, Math.min(1, t));
  const qx = ax + dx * t;
  const qz = az + dz * t;
  let nx = cx - qx;
  let nz = cz - qz;
  const d = Math.hypot(nx, nz);
  if (d >= radius) return null;
  if (d < 1e-4) {
    const len = Math.hypot(dx, dz) || 1;
    nx = -dz / len;
    nz = dx / len;
    if (leaf.px != null && nx * leaf.px + nz * leaf.pz < 0) {
      nx = -nx;
      nz = -nz;
    }
  } else {
    nx /= d;
    nz /= d;
  }
  return { x: qx + nx * radius, z: qz + nz * radius };
}

export function resolve(buildings, x, z, feet, radius) {
  let cx = x;
  let cz = z;
  for (let pass = 0; pass < 3; pass++) {
    for (const b of buildings) {
      if (b.dormant) continue;
      if (b.feetMin != null && feet < b.feetMin) continue;
      if (b.leaf && feet > b.leaf.y0 - 0.2 && feet < b.leaf.y1 - 0.05) {
        const pushed = pushSeg(cx, cz, b.leaf, radius);
        if (pushed) {
          cx = pushed.x;
          cz = pushed.z;
        }
      }
      if (b.risers) {
        for (let i = 0; i < b.risers.length; i++) {
          const s = b.risers[i];
          if (feet < s.y0 - 0.05 || feet >= s.y - 0.32) continue;
          if (!inside(cx, cz, s.poly)) continue;
          const e = nearestOnEdge(cx, cz, s.poly);
          cx = e.x + e.nx * (radius + 0.02);
          cz = e.z + e.nz * (radius + 0.02);
        }
      }
      if (feet >= b.height - 0.3) continue;
      if (b.gap && b.gap.open && feet >= b.gap.y0 - 0.15 && feet < b.gap.y1 - 0.05 && inside(cx, cz, b.gap.poly)) continue;
      const polys = b.hole ? [b.wall] : [b.wall];
      if (!inside(cx, cz, b.wall)) {
        const e = nearestOnEdge(cx, cz, b.wall);
        if (e.d < radius) {
          cx = e.x + e.nx * radius;
          cz = e.z + e.nz * radius;
        }
        continue;
      }
      if (b.hole && inside(cx, cz, b.hole)) continue;
      const outer = nearestOnEdge(cx, cz, b.wall);
      let use = outer;
      if (b.hole) {
        const inner = nearestOnEdge(cx, cz, b.hole);
        if (inner.d < outer.d) use = { ...inner, nx: -inner.nx, nz: -inner.nz };
      }
      cx = use.x + use.nx * (radius + 0.02);
      cz = use.z + use.nz * (radius + 0.02);
    }
  }
  return { x: cx, z: cz };
}

export function findHold(holds, x, y, z, fx, fz, y0, y1, maxD = 1.15) {
  let best = null;
  let bestD = maxD;
  for (const h of holds) {
    if (h.y < y + y0 || h.y > y + y1) continue;
    const dx = h.x - x;
    const dz = h.z - z;
    const d = Math.hypot(dx, dz);
    if (d > bestD || d < 0.05) continue;
    if (fx || fz) {
      const along = (dx * fx + dz * fz) / (d || 1);
      if (along < 0.15) continue;
    }
    best = h;
    bestD = d;
  }
  return best;
}

export function holdNear(holds, x, y, z, pred) {
  let best = null;
  let score = 1e9;
  for (const h of holds) {
    if (!pred(h)) continue;
    const d = Math.hypot(h.x - x, h.z - z) + Math.abs(h.y - y) * 0.35;
    if (d < score) {
      score = d;
      best = h;
    }
  }
  return score < 2.2 ? best : null;
}
