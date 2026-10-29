function signedArea(poly) {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i];
    const q = poly[(i + 1) % poly.length];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a * 0.5;
}

// Edge frame: local +x along the face from outside, +z outward. From houses.js.
export function edgeFrames(poly) {
  const sign = signedArea(poly) >= 0 ? 1 : -1;
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const dx = (b[0] - a[0]) / len;
    const dz = (b[1] - a[1]) / len;
    const rx = -sign * dx;
    const rz = -sign * dz;
    const outx = dz * sign;
    const outz = -dx * sign;
    const o = sign > 0 ? b : a;
    const yaw = Math.atan2(-rz, rx);
    out.push({ i, len, ox: o[0], oz: o[1], rx, rz, outx, outz, yaw });
  }
  return out;
}
