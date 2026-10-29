// Own-work player. Default height 1.68 m. No downloaded body.

export function makeAvatar(THREE, opts) {
  const height = opts.height || 1.68;
  const u = height / 1.68;
  const g = new THREE.Group();
  g.name = "avatar";
  const skin = new THREE.MeshStandardMaterial({ color: opts.skin, roughness: 0.62 });
  const cloth = new THREE.MeshStandardMaterial({ color: opts.shirt, roughness: 0.78 });
  const hairM = new THREE.MeshStandardMaterial({ color: opts.hair, roughness: 0.55 });
  const shoe = new THREE.MeshStandardMaterial({ color: 0x2a2420, roughness: 0.85 });
  const add = (mesh, x, y, z) => {
    mesh.position.set(x * u, y * u, z * u);
    mesh.castShadow = false;
    g.add(mesh);
    return mesh;
  };
  const cap = (r, len, seg) => new THREE.Mesh(new THREE.CapsuleGeometry(r * u, Math.max(0.02, len * u), 4, seg || 8), skin);

  add(new THREE.Mesh(new THREE.CapsuleGeometry(0.055 * u, 0.62 * u, 3, 6), cloth), -0.11, 0.48, 0);
  add(new THREE.Mesh(new THREE.CapsuleGeometry(0.055 * u, 0.62 * u, 3, 6), cloth), 0.11, 0.48, 0);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.16 * u, 0.06 * u, 0.28 * u), shoe), -0.11, 0.04, 0.02);
  add(new THREE.Mesh(new THREE.BoxGeometry(0.16 * u, 0.06 * u, 0.28 * u), shoe), 0.11, 0.04, 0.02);
  add(new THREE.Mesh(new THREE.CapsuleGeometry(0.16 * u, 0.42 * u, 4, 8), cloth), 0, 1.05, 0);
  add(cap(0.045, 0.48, 6), -0.24, 1.12, 0);
  add(cap(0.045, 0.48, 6), 0.24, 1.12, 0);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.12 * u, 12, 10), skin), 0, 1.52, 0);
  add(new THREE.Mesh(new THREE.SphereGeometry(0.125 * u, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), hairM), 0, 1.56, 0);
  g.userData.height = height;
  g.userData.parts = { skin, cloth, hair: hairM };
  return g;
}
