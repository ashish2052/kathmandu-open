// Square paving, the streets between the houses, and a sky so the map edge is haze.
// Road lines are OSM (data/roads.json). The far ground is earth, not cobble.
import * as THREE from "three";

function ribbon(pts, width, y) {
  if (!pts || pts.length < 2) return null;
  const hw = width * 0.5;
  const pos = [];
  const idx = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    let dx = next[0] - prev[0];
    let dz = next[1] - prev[1];
    const len = Math.hypot(dx, dz) || 1;
    dx /= len;
    dz /= len;
    pos.push(pts[i][0] - dz * hw, y, pts[i][1] + dx * hw, pts[i][0] + dz * hw, y, pts[i][1] - dx * hw);
    if (i) {
      const b = (i - 1) * 2;
      idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2);
    }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geom.setIndex(idx);
  geom.computeVertexNormals();
  return geom;
}

function skyDome() {
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 256;
  const g = c.getContext("2d");
  const grad = g.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, "#3d78b8");
  grad.addColorStop(0.2, "#6a9ec8");
  grad.addColorStop(0.34, "#e08a48");
  grad.addColorStop(0.46, "#f2c48e");
  grad.addColorStop(0.55, "#e7c4a4");
  grad.addColorStop(1, "#b08968");
  g.fillStyle = grad;
  g.fillRect(0, 0, 16, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mesh = new THREE.Mesh(
    new THREE.SphereGeometry(420, 20, 16),
    new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  mesh.name = "sky";
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
}

function clusterBox(buildings) {
  const ax = -18;
  const az = -8;
  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  let n = 0;
  for (const b of buildings) {
    if (Math.hypot(b.cx - ax, b.cz - az) > 120) continue;
    n += 1;
    for (const p of b.poly) {
      minX = Math.min(minX, p[0]);
      maxX = Math.max(maxX, p[0]);
      minZ = Math.min(minZ, p[1]);
      maxZ = Math.max(maxZ, p[1]);
    }
  }
  if (!n) return { minX: -80, maxX: 80, minZ: -80, maxZ: 40 };
  const pad = 16;
  return { minX: minX - pad, maxX: maxX + pad, minZ: minZ - pad, maxZ: maxZ + pad };
}

export async function installGround(scene, buildings) {
  const box = clusterBox(buildings);
  const earth = new THREE.Mesh(
    new THREE.PlaneGeometry(2400, 2400),
    new THREE.MeshStandardMaterial({ color: 0xc4a888, roughness: 1, metalness: 0 }),
  );
  earth.rotation.x = -Math.PI / 2;
  earth.position.y = -0.04;
  earth.receiveShadow = true;
  earth.name = "earth";
  scene.add(earth);

  const w = box.maxX - box.minX;
  const d = box.maxZ - box.minZ;
  const geo = new THREE.PlaneGeometry(w, d);
  geo.rotateX(-Math.PI / 2);
  const tex = new THREE.TextureLoader().load(new URL("../assets/tex/cobblestone_pavement_Diffuse.jpg", import.meta.url).href);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 8;
  tex.repeat.set(w / 2.4, d / 2.4);
  const pave = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.94, metalness: 0, color: 0xe7d7c4 }));
  pave.position.set((box.minX + box.maxX) / 2, 0, (box.minZ + box.maxZ) / 2);
  pave.receiveShadow = true;
  pave.name = "square-paving";
  scene.add(pave);

  let roads = [];
  try {
    const data = await (await fetch(new URL("../data/roads.json", import.meta.url))).json();
    roads = data.roads || [];
  } catch (err) {
    console.error(err);
  }
  const geoms = [];
  for (const r of roads) {
    const width = Math.max(2.2, Math.min(r.w || 4, 8));
    const g = ribbon(r.p, width, 0.025);
    if (g) geoms.push(g);
  }
  if (geoms.length) {
    const street = new THREE.Mesh(
      geoms.length === 1 ? geoms[0] : merge(geoms),
      new THREE.MeshStandardMaterial({ color: 0x5a5148, roughness: 0.96, metalness: 0, side: THREE.DoubleSide }),
    );
    street.receiveShadow = true;
    street.name = "streets";
    scene.add(street);
  }
  scene.add(skyDome());
  return { box, roads: roads.length };
}

function merge(geoms) {
  let n = 0;
  let ix = 0;
  for (const g of geoms) {
    n += g.attributes.position.count;
    ix += g.index.count;
  }
  const pos = new Float32Array(n * 3);
  const idx = new Uint32Array(ix);
  let pv = 0;
  let iv = 0;
  let base = 0;
  for (const g of geoms) {
    pos.set(g.attributes.position.array, pv);
    const id = g.index.array;
    for (let i = 0; i < id.length; i++) idx[iv + i] = id[i] + base;
    pv += g.attributes.position.count * 3;
    iv += id.length;
    base += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  out.computeVertexNormals();
  return out;
}
