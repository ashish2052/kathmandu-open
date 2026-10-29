// Original adult male. Rig is a bone tree (hips, spine, limbs, head).
// Walk and idle are authored here. No downloaded body, no Mixamo.
// Default face morphs (glasses, jaw, nose) are tuned by eye. The reference
// photo is not shipped and is not a texture.
import * as THREE from "three";

function lerp(a, b, t) {
  return a + (b - a) * t;
}

export function makeAvatar(opts) {
  const height = opts.height || 1.68;
  const build = Math.max(0, Math.min(1, opts.build == null ? 0.42 : opts.build));
  const face = Math.max(0, Math.min(1, opts.face == null ? 0.78 : opts.face));
  const skin = new THREE.MeshStandardMaterial({ color: opts.skin || "#c68642", roughness: 0.58, metalness: 0 });
  const cloth = new THREE.MeshStandardMaterial({ color: opts.shirt || "#1c2433", roughness: 0.82, metalness: 0 });
  const hairM = new THREE.MeshStandardMaterial({ color: opts.hair || "#1a140f", roughness: 0.62, metalness: 0 });
  const trouser = new THREE.MeshStandardMaterial({ color: 0x2c2824, roughness: 0.86, metalness: 0 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x1a1614, roughness: 0.72, metalness: 0.05 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x16181c, roughness: 0.25, metalness: 0.4 });
  const eyeW = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, roughness: 0.35, metalness: 0 });
  const eyeD = new THREE.MeshStandardMaterial({ color: 0x2a1c14, roughness: 0.4, metalness: 0 });
  const lip = new THREE.MeshStandardMaterial({ color: 0x8a4d45, roughness: 0.55, metalness: 0 });

  const root = new THREE.Group();
  root.name = "avatar";
  root.scale.setScalar(height / 1.68);

  const shoulder = 0.2 + build * 0.04;

  function mesh(geo, mat, parent) {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  const hips = new THREE.Group();
  hips.name = "hips";
  hips.position.y = 0.92;
  root.add(hips);

  const pelvis = mesh(new THREE.SphereGeometry(0.11, 12, 10), trouser, hips);
  pelvis.scale.set(1.15 + build * 0.35, 0.72, 0.85 + build * 0.15);
  pelvis.name = "pelvis";

  const spine = new THREE.Group();
  spine.name = "spine";
  spine.position.y = 0.08;
  hips.add(spine);

  const chest = new THREE.Group();
  chest.name = "chest";
  chest.position.y = 0.2;
  spine.add(chest);

  const torso = mesh(new THREE.BoxGeometry(0.36 + build * 0.1, 0.42, 0.2 + build * 0.04), cloth, chest);
  torso.name = "shirt";
  torso.position.y = -0.02;
  const waist = mesh(new THREE.BoxGeometry(0.3 + build * 0.06, 0.16, 0.18 + build * 0.03), cloth, spine);
  waist.position.set(0, 0.02, 0);

  const collarL = mesh(new THREE.BoxGeometry(0.08, 0.045, 0.02), cloth, chest);
  const collarR = mesh(new THREE.BoxGeometry(0.08, 0.045, 0.02), cloth, chest);
  collarL.position.set(-0.05, 0.16, 0.08);
  collarR.position.set(0.05, 0.16, 0.08);
  collarL.rotation.z = 0.5;
  collarR.rotation.z = -0.5;
  collarL.rotation.x = -0.3;
  collarR.rotation.x = -0.3;

  function limb(name, parent, x, y, z) {
    const g = new THREE.Group();
    g.name = name;
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  }

  function arm(side) {
    const s = side;
    const upper = limb(s < 0 ? "upperArm.L" : "upperArm.R", chest, s * shoulder, 0.14, 0);
    upper.rotation.z = s * -0.22;
    upper.rotation.x = 0.12;
    const sleeve = mesh(new THREE.CylinderGeometry(0.055, 0.048, 0.26, 10), cloth, upper);
    sleeve.position.y = -0.14;
    const lower = limb(s < 0 ? "lowerArm.L" : "lowerArm.R", upper, 0, -0.26, 0);
    const fore = mesh(new THREE.CylinderGeometry(0.046, 0.038, 0.24, 10), cloth, lower);
    fore.position.y = -0.12;
    const hand = limb(s < 0 ? "hand.L" : "hand.R", lower, 0, -0.24, 0);
    const palm = mesh(new THREE.BoxGeometry(0.07, 0.09, 0.028), skin, hand);
    palm.position.y = -0.04;
    for (let f = 0; f < 4; f++) {
      const finger = mesh(new THREE.BoxGeometry(0.014, 0.045, 0.014), skin, hand);
      finger.position.set((f - 1.5) * 0.016, -0.1, 0.004);
    }
    return { upper, lower };
  }
  const armL = arm(-1);
  const armR = arm(1);

  function leg(side) {
    const s = side;
    const upper = limb(s < 0 ? "upperLeg.L" : "upperLeg.R", hips, s * (0.09 + build * 0.02), -0.02, 0);
    const thigh = mesh(new THREE.CylinderGeometry(0.085 + build * 0.02, 0.062, 0.42, 10), trouser, upper);
    thigh.position.y = -0.22;
    const lower = limb(s < 0 ? "lowerLeg.L" : "lowerLeg.R", upper, 0, -0.42, 0);
    const shin = mesh(new THREE.CylinderGeometry(0.058, 0.042, 0.4, 10), trouser, lower);
    shin.position.y = -0.2;
    const foot = limb(s < 0 ? "foot.L" : "foot.R", lower, 0, -0.4, 0.03);
    const shoeM = mesh(new THREE.BoxGeometry(0.09, 0.055, 0.24), shoe, foot);
    shoeM.position.set(0, -0.02, 0.04);
    return { upper, lower };
  }
  const legL = leg(-1);
  const legR = leg(1);

  const neck = limb("neck", chest, 0, 0.22, 0);
  const neckM = mesh(new THREE.CylinderGeometry(0.048, 0.055, 0.1, 10), skin, neck);
  neckM.position.y = 0.04;

  const head = limb("head", neck, 0, 0.14, 0);
  head.scale.set(lerp(0.9, 1.08, face), lerp(1.14, 0.96, face), lerp(0.96, 1.02, face));

  const skull = mesh(new THREE.SphereGeometry(0.105, 18, 14), skin, head);
  skull.scale.set(1, 1.06, 0.92);
  const jaw = mesh(new THREE.SphereGeometry(0.072, 12, 10), skin, head);
  jaw.scale.set(lerp(0.82, 1.16, face), 0.62, 0.78);
  jaw.position.set(0, -0.045, 0.02);

  const nose = mesh(new THREE.CylinderGeometry(0.008, 0.016, 0.038, 8), skin, head);
  nose.rotation.x = Math.PI / 2;
  nose.position.set(0, -0.012, 0.095);
  nose.scale.z = lerp(1.35, 0.72, face);
  const nostrilL = mesh(new THREE.SphereGeometry(0.008, 6, 6), skin, head);
  const nostrilR = mesh(new THREE.SphereGeometry(0.008, 6, 6), skin, head);
  nostrilL.position.set(-0.012, -0.028, 0.09);
  nostrilR.position.set(0.012, -0.028, 0.09);
  nostrilL.scale.set(1, 0.6, 0.7);
  nostrilR.scale.set(1, 0.6, 0.7);

  function eye(x) {
    const g = new THREE.Group();
    g.position.set(x, 0.02, 0.078);
    head.add(g);
    const white = mesh(new THREE.SphereGeometry(0.016, 10, 8), eyeW, g);
    const iris = mesh(new THREE.SphereGeometry(0.008, 8, 8), eyeD, g);
    iris.position.z = 0.01;
    const lid = mesh(new THREE.BoxGeometry(0.03, 0.008, 0.012), skin, g);
    lid.position.set(0, 0.012, 0.006);
    white.castShadow = false;
    iris.castShadow = false;
    return g;
  }
  eye(-0.034);
  eye(0.034);

  const browL = mesh(new THREE.BoxGeometry(0.032, 0.008, 0.01), hairM, head);
  const browR = mesh(new THREE.BoxGeometry(0.032, 0.008, 0.01), hairM, head);
  browL.position.set(-0.034, 0.048, 0.082);
  browR.position.set(0.034, 0.048, 0.082);
  browL.rotation.z = 0.25;
  browR.rotation.z = -0.25;

  const mouth = mesh(new THREE.BoxGeometry(0.036, 0.008, 0.012), lip, head);
  mouth.position.set(0, -0.055, 0.078);

  function ear(x) {
    const e = mesh(new THREE.SphereGeometry(0.028, 8, 8), skin, head);
    e.scale.set(0.45, 0.85, 0.55);
    e.position.set(x, -0.01, 0);
  }
  ear(-0.1);
  ear(0.1);

  const hairCap = mesh(new THREE.SphereGeometry(0.108, 16, 12), hairM, head);
  hairCap.scale.set(1.02, 0.48, 0.98);
  hairCap.position.set(0, 0.07, -0.01);
  const hairBack = mesh(new THREE.SphereGeometry(0.09, 12, 10), hairM, head);
  hairBack.scale.set(1.02, 0.7, 0.55);
  hairBack.position.set(0, 0.02, -0.045);
  const fringe = mesh(new THREE.BoxGeometry(0.1, 0.02, 0.03), hairM, head);
  fringe.position.set(0, 0.07, 0.055);
  fringe.rotation.x = -0.5;

  const glasses = new THREE.Group();
  glasses.name = "glasses";
  glasses.visible = face >= 0.45;
  head.add(glasses);
  for (const x of [-0.034, 0.034]) {
    const ring = mesh(new THREE.TorusGeometry(0.022, 0.0024, 6, 14), glass, glasses);
    ring.position.set(x, 0.018, 0.092);
  }
  const bridge = mesh(new THREE.BoxGeometry(0.016, 0.004, 0.004), glass, glasses);
  bridge.position.set(0, 0.02, 0.092);
  for (const x of [-0.054, 0.054]) {
    const temple = mesh(new THREE.BoxGeometry(0.006, 0.004, 0.07), glass, glasses);
    temple.position.set(x, 0.02, 0.05);
  }

  const rest = {
    armL: armL.upper.rotation.x,
    armR: armR.upper.rotation.x,
    hipY: hips.position.y,
  };
  let phase = 0;

  root.userData.height = height;
  root.userData.tick = (dt, speed) => {
    const moving = speed > 0.2;
    if (!moving) {
      phase += dt * 1.5;
      const b = Math.sin(phase);
      spine.rotation.x = b * 0.02;
      chest.position.y = 0.2 + b * 0.004;
      armL.upper.rotation.x = rest.armL + b * 0.02;
      armR.upper.rotation.x = rest.armR - b * 0.02;
      armL.lower.rotation.x = 0.08;
      armR.lower.rotation.x = 0.08;
      legL.upper.rotation.x = 0;
      legR.upper.rotation.x = 0;
      legL.lower.rotation.x = 0.02;
      legR.lower.rotation.x = 0.02;
      hips.position.y = rest.hipY;
      hips.rotation.y = 0;
      return;
    }
    const freq = speed > 3 ? 2.6 : 1.7;
    phase += dt * freq * Math.PI * 2;
    const s = Math.sin(phase);
    const lift = Math.max(0, -s);
    const liftR = Math.max(0, s);
    legL.upper.rotation.x = s * 0.62;
    legR.upper.rotation.x = -s * 0.62;
    legL.lower.rotation.x = lift * 1.15;
    legR.lower.rotation.x = liftR * 1.15;
    armL.upper.rotation.x = rest.armL - s * 0.5;
    armR.upper.rotation.x = rest.armR + s * 0.5;
    armL.lower.rotation.x = 0.25 + lift * 0.2;
    armR.lower.rotation.x = 0.25 + liftR * 0.2;
    hips.position.y = rest.hipY + Math.sin(phase * 2) * 0.012;
    hips.rotation.y = s * 0.05;
    spine.rotation.x = 0.06;
    spine.rotation.y = s * 0.06;
  };
  return root;
}
