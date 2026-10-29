// Footprint basis only. Placeholder pagodas from the old heroes.js are not part of this build.

export function basis(poly) {
  let best = 0;
  let ax = 1;
  let az = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (len > best) {
      best = len;
      ax = (b[0] - a[0]) / len;
      az = (b[1] - a[1]) / len;
    }
  }
  const bx = -az;
  const bz = ax;
  let minA = 1e9;
  let maxA = -1e9;
  let minB = 1e9;
  let maxB = -1e9;
  for (const p of poly) {
    const a = p[0] * ax + p[1] * az;
    const c = p[0] * bx + p[1] * bz;
    minA = Math.min(minA, a);
    maxA = Math.max(maxA, a);
    minB = Math.min(minB, c);
    maxB = Math.max(maxB, c);
  }
  const ca = (minA + maxA) / 2;
  const cb = (minB + maxB) / 2;
  return {
    x: ca * ax + cb * bx,
    z: ca * az + cb * bz,
    w: Math.max(2, maxA - minA),
    d: Math.max(2, maxB - minB),
    yaw: Math.atan2(ax, az),
  };
}
